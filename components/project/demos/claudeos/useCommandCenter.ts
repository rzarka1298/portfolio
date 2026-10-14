import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import raw from './mock.json';
import { APPROVAL_STATE_DISPLAY, RUN_STATE_DISPLAY, INITIAL_EVENT_ID, INITIAL_LAST_EVENT, MOCK_NOW, initialDashState } from './data';
import { engineReducer, fold, type EngineState } from './engine';
import { approvalPayload, fingerprint } from './format';
import type {
  Approval,
  DashState,
  EventBody,
  LaunchAction,
  Project,
  ReconnectMode,
  Session,
  Toast,
  VaultNote,
} from './types';
import { RUN_STATES } from './types';

function initialEngine(): EngineState {
  return {
    base: initialDashState(),
    events: [],
    nextId: INITIAL_EVENT_ID + 1,
    cursor: INITIAL_EVENT_ID,
    status: 'live',
    statusDetail: null,
    lastEvent: INITIAL_LAST_EVENT,
    log: [
      {
        key: 'l0',
        at: INITIAL_LAST_EVENT.at,
        id: INITIAL_EVENT_ID,
        type: INITIAL_LAST_EVENT.type,
        detail: 'snapshot loaded on open',
        tone: 'live',
      },
    ],
    logSeq: 0,
  };
}

export type DecisionResult =
  | { ok: true; reviewed: string; current: string }
  | { ok: false; reason: 'changed'; reviewed: string; current: string }
  | { ok: false; reason: 'not-pending' | 'offline' };

export type TimelineStatus = 'idle' | 'playing' | 'done';

interface ScriptedEvent {
  atSec: number;
  type: string;
  runId?: string;
  patch?: Record<string, string | undefined>;
  durationSec?: number;
  reconnectMode?: string;
}

const SCRIPT: ScriptedEvent[] = raw.scripted.events.map((e) => ({ ...e }));

const MIRROR_TITLES: Record<string, string> = {
  'session.force-terminate': 'Force-terminate a Claude session',
  'diagnostic.test': 'Test approval',
};

function mirrorNote(a: Approval, now: number, created: number): VaultNote {
  const label = APPROVAL_STATE_DISPLAY[a.state].label;
  return {
    id: `n${a.proposalId.replace(/[^0-9a-z]/g, '').slice(-8)}mirroraaaaaaaaaaaa`.slice(0, 25),
    path: `system/${a.proposalId}.md`,
    title: `${MIRROR_TITLES[a.operation] ?? a.operation} — ${label}`,
    scope: 'global',
    stage: 'output',
    created,
    updated: now,
    generatedBy: { automation: 'approval-mirror' },
    aiGenerated: false,
    claimType: null,
    sources: [],
    confidence: 'verified',
    lastReviewed: null,
    body: `Status: ${label}. Requested by: Dashboard. Decide in the command center.`,
  };
}

export function useCommandCenter() {
  const [engine, dispatch] = useReducer(engineReducer, undefined, initialEngine);
  const engineRef = useRef(engine);
  engineRef.current = engine;

  // ---- Sim clock ------------------------------------------------------
  const startRef = useRef(Date.now());
  const skipRef = useRef(0);
  const simNow = useCallback(() => MOCK_NOW + (Date.now() - startRef.current) + skipRef.current, []);
  const [now, setNow] = useState(MOCK_NOW);
  useEffect(() => {
    const t = window.setInterval(() => setNow(simNow()), 1000);
    return () => window.clearInterval(t);
  }, [simNow]);

  // ---- Timers ---------------------------------------------------------
  const timers = useRef(new Set<number>());
  const later = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach((id) => window.clearTimeout(id));
      set.clear();
    };
  }, []);

  // ---- Toasts ---------------------------------------------------------
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const toast = useCallback(
    (text: string, tone: Toast['tone'] = 'info') => {
      const id = ++toastSeq.current;
      setToasts((t) => [...t.slice(-2), { id, text, tone }]);
      later(3800, () => setToasts((t) => t.filter((x) => x.id !== id)));
    },
    [later],
  );
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  // ---- Views ----------------------------------------------------------
  const client: DashState = useMemo(() => fold(engine.base, engine.events, engine.cursor), [engine.base, engine.events, engine.cursor]);
  const server: DashState = useMemo(() => fold(engine.base, engine.events), [engine.base, engine.events]);
  const serverRef = useRef(server);
  serverRef.current = server;

  const emit = useCallback((body: EventBody) => dispatch({ kind: 'emit', body, at: simNow() }), [simNow]);

  // ---- Connection -----------------------------------------------------
  const [reconnectMode, setReconnectMode] = useState<ReconnectMode>('replay');
  const disconnect = useCallback(
    (mode: ReconnectMode, seconds = 4) => {
      if (engineRef.current.status !== 'live') return;
      dispatch({ kind: 'disconnect', at: simNow() });
      // The service keeps working while the dashboard can't hear it.
      const bump = (activity: 'working' | 'idle') =>
        emit({ type: 'session.upserted', runId: 'run_demo_0001', patch: { activity, lastActivityAt: simNow() } });
      later(800, () => bump('idle'));
      later(1600, () => emit({ type: 'service.heartbeat' }));
      later(2400, () => bump('working'));
      later(seconds * 1000 - 700, () => dispatch({ kind: 'connecting', at: simNow() }));
      later(seconds * 1000, () => dispatch({ kind: 'reconnect', mode, at: simNow() }));
    },
    [emit, later, simNow],
  );
  const live = engine.status === 'live';

  // ---- Scripted timeline ---------------------------------------------
  const [timeline, setTimeline] = useState<TimelineStatus>('idle');
  const playTimeline = useCallback(() => {
    setTimeline('playing');
    let lastAt = 0;
    for (const step of SCRIPT) {
      lastAt = Math.max(lastAt, step.atSec + (step.durationSec ?? 0));
      later(step.atSec * 1000, () => {
        if (step.type === '_disconnect') {
          disconnect(step.reconnectMode === 'resync' ? 'resync' : 'replay', step.durationSec ?? 4);
          return;
        }
        if (step.type === 'session.upserted' && step.runId) {
          const raw = step.patch ?? {};
          const patch: Partial<Session> = { lastActivityAt: simNow() };
          const state = RUN_STATES.find((x) => x === raw.state);
          if (state) patch.state = state;
          if (raw.activity === 'working' || raw.activity === 'idle') patch.activity = raw.activity;
          if (raw.name) patch.name = raw.name;
          if (raw.model) patch.model = raw.model;
          if (raw.endedAt === '+now') patch.endedAt = simNow();
          if (state && !RUN_STATE_DISPLAY[state].active) patch.activity = null;
          emit({ type: 'session.upserted', runId: step.runId, patch });
        } else if (step.type === 'service.heartbeat') emit({ type: 'service.heartbeat' });
        else if (step.type === 'tasks.changed') emit({ type: 'tasks.changed' });
      });
    }
    later(lastAt * 1000 + 600, () => setTimeline('done'));
  }, [disconnect, emit, later, simNow]);

  // Slow heartbeat so the "Last event" line keeps moving.
  useEffect(() => {
    const t = window.setInterval(() => {
      if (engineRef.current.status === 'live') emit({ type: 'service.heartbeat' });
    }, 20000);
    return () => window.clearInterval(t);
  }, [emit]);

  // ---- Expiry: the service denies pending requests whose window lapsed --
  const expiredRef = useRef(new Set<string>());
  useEffect(() => {
    for (const a of serverRef.current.approvals) {
      if (a.state === 'pending' && a.expiresAt !== null && a.expiresAt <= now && !expiredRef.current.has(a.proposalId)) {
        expiredRef.current.add(a.proposalId);
        emit({
          type: 'approval.upserted',
          proposalId: a.proposalId,
          patch: { state: 'expired', decidedAt: now },
          historyEvent: 'Expired — denied automatically',
        });
        emit({ type: 'note.written', note: mirrorNote({ ...a, state: 'expired' }, now, a.requestedAt) });
      }
    }
  }, [now, emit]);

  const skipTo = useCallback(
    (t: number) => {
      const delta = t - simNow();
      if (delta > 0) skipRef.current += delta;
      setNow(simNow());
    },
    [simNow],
  );

  // ---- Commands -------------------------------------------------------
  const sessionSeq = useRef(100);
  const launch = useCallback(
    (project: Project, action: LaunchAction, label: string) => {
      if (engineRef.current.status !== 'live') return;
      if (action === 'github') {
        toast(`Opening ${project.name} on GitHub…`);
        return;
      }
      toast(`Opening ${project.name} in ${label}…`);
      if (action !== 'claude-code' && action !== 'pair') return;
      const runId = `run_demo_0${++sessionSeq.current}`;
      const t = simNow();
      emit({
        type: 'session.upserted',
        runId,
        patch: {},
        create: {
          runId,
          name: 'Starting…',
          state: 'starting',
          activity: null,
          project: project.name,
          model: null,
          effort: null,
          launchSource: 'dashboard',
          startedAt: t,
          lastActivityAt: null,
          endedAt: null,
          subagents: 0,
          unclassified: false,
          note: null,
        },
      });
      later(2000, () =>
        emit({
          type: 'session.upserted',
          runId,
          patch: {
            state: 'running',
            activity: 'working',
            name: action === 'pair' ? `Pair session in ${project.name}` : `New session in ${project.name}`,
            model: 'claude-sonnet',
            lastActivityAt: simNow(),
          },
        }),
      );
    },
    [emit, later, simNow, toast],
  );

  const proposalSeq = useRef(10);
  const raiseApproval = useCallback(
    (a: Omit<Approval, 'proposalId' | 'requestedAt' | 'history' | 'consumed' | 'decidedAt' | 'state'>) => {
      if (engineRef.current.status !== 'live') return null;
      const proposalId = `prop_demo_00${++proposalSeq.current}`;
      const t = simNow();
      const approval: Approval = {
        ...a,
        proposalId,
        state: 'pending',
        requestedAt: t,
        decidedAt: null,
        history: [],
        consumed: false,
      };
      emit({ type: 'approval.upserted', proposalId, patch: {}, create: approval, historyEvent: 'Requested' });
      emit({ type: 'note.written', note: mirrorNote(approval, t, t) });
      return proposalId;
    },
    [emit, simNow],
  );

  const requestTerminate = useCallback(
    (s: Session) =>
      raiseApproval({
        operation: 'session.force-terminate',
        title: `Force-terminate session "${s.name}"`,
        project: s.project,
        runId: s.runId,
        expiresAt: simNow() + 15 * 60 * 1000,
        blocks: {
          happen: 'End the Claude Code process for this session.',
          target: `Session ${s.runId}`,
          change: { before: s.state === 'stale' ? 'Unknown — ended without reporting' : 'Running', after: 'Cancelled' },
          reason: s.state === 'stale' ? 'Session stopped reporting.' : 'Requested from Agent runs.',
          risks: ['Unsaved work in that terminal is lost.'],
        },
        effect: 'end the Claude Code process for this session',
        destructive: true,
      }),
    [raiseApproval, simNow],
  );

  const raiseTest = useCallback(
    () =>
      raiseApproval({
        operation: 'diagnostic.test',
        title: 'Test approval (does nothing)',
        project: null,
        runId: null,
        expiresAt: simNow() + 24 * 60 * 60 * 1000,
        blocks: {
          happen: 'Nothing. This request proves the inbox works.',
          target: 'None',
          change: null,
          reason: 'Raised from Quick actions.',
          risks: [],
        },
        effect: 'record a test decision',
        destructive: false,
      }),
    [raiseApproval, simNow],
  );

  /** Simulates the requester changing the request after you opened it. */
  const tamper = useCallback(
    (proposalId: string) => {
      const a = serverRef.current.approvals.find((x) => x.proposalId === proposalId);
      if (!a || !a.blocks || a.state !== 'pending') return;
      emit({
        type: 'approval.upserted',
        proposalId,
        patch: { blocks: { ...a.blocks, target: `${a.blocks.target.replace(/ \(process \d+\)$/, '')} (process 40113)`, reason: `${a.blocks.reason} (edited)` } },
        historyEvent: 'Request changed by its requester',
      });
    },
    [emit],
  );

  /**
   * The service, not the browser, enforces the decision rules: the
   * fingerprint you reviewed must match the request as it stands now, and a
   * request can be decided (and carried out) only once.
   */
  const decide = useCallback(
    async (proposalId: string, decision: 'approve' | 'deny', reviewedPayload: string): Promise<DecisionResult> => {
      if (engineRef.current.status !== 'live') return { ok: false, reason: 'offline' };
      const current = serverRef.current.approvals.find((x) => x.proposalId === proposalId);
      if (!current || current.state !== 'pending' || current.consumed) return { ok: false, reason: 'not-pending' };
      const [reviewed, now2] = await Promise.all([fingerprint(reviewedPayload), fingerprint(approvalPayload(current))]);
      const r = `${reviewed.algo}:${reviewed.hex}`;
      const c = `${now2.algo}:${now2.hex}`;
      if (decision === 'approve' && r !== c) return { ok: false, reason: 'changed', reviewed: r, current: c };

      const t = simNow();
      if (decision === 'deny') {
        emit({ type: 'approval.upserted', proposalId, patch: { state: 'denied', decidedAt: t, consumed: true }, historyEvent: 'Denied' });
        emit({ type: 'note.written', note: mirrorNote({ ...current, state: 'denied' }, t, current.requestedAt) });
        return { ok: true, reviewed: r, current: c };
      }
      emit({ type: 'approval.upserted', proposalId, patch: { state: 'approved', decidedAt: t, consumed: true }, historyEvent: 'Approved once' });
      later(800, () =>
        emit({ type: 'approval.upserted', proposalId, patch: { state: 'executing' }, historyEvent: 'Carrying out' }),
      );
      later(2200, () => {
        const done = simNow();
        const terminate = current.operation === 'session.force-terminate' && current.runId;
        emit({
          type: 'approval.upserted',
          proposalId,
          patch: { state: 'executed' },
          historyEvent: terminate ? 'Carried out — process ended after SIGTERM' : 'Carried out — test decision recorded',
        });
        if (terminate && current.runId) {
          emit({ type: 'session.upserted', runId: current.runId, patch: { state: 'cancelled', activity: null, endedAt: done } });
        }
        emit({ type: 'note.written', note: mirrorNote({ ...current, state: 'executed' }, done, current.requestedAt) });
        toast(`Mirror note written to system/${proposalId}.md`, 'success');
      });
      return { ok: true, reviewed: r, current: c };
    },
    [emit, later, simNow, toast],
  );

  const acceptTask = useCallback(
    (taskId: string, todayIso: string) =>
      emit({ type: 'task.upserted', taskId, patch: { status: 'ready', due: todayIso, proposedBy: null } }),
    [emit],
  );
  const dismissTask = useCallback(
    (taskId: string) => emit({ type: 'task.upserted', taskId, patch: { status: 'cancelled' } }),
    [emit],
  );

  const reset = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current.clear();
    expiredRef.current.clear();
    startRef.current = Date.now();
    skipRef.current = 0;
    setNow(MOCK_NOW);
    setToasts([]);
    setTimeline('idle');
    dispatch({ kind: 'reset', state: initialEngine() });
  }, []);

  return {
    now,
    client,
    status: engine.status,
    statusDetail: engine.statusDetail,
    lastEvent: engine.lastEvent,
    cursor: engine.cursor,
    log: engine.log,
    live,
    reconnectMode,
    setReconnectMode,
    disconnect,
    timeline,
    playTimeline,
    toasts,
    toast,
    dismissToast,
    launch,
    requestTerminate,
    raiseTest,
    tamper,
    decide,
    skipTo,
    acceptTask,
    dismissTask,
    reset,
  };
}

export type CommandCenter = ReturnType<typeof useCommandCenter>;
