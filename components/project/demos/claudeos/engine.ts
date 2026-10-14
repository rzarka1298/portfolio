/**
 * A tiny in-browser stand-in for the companion service and its event stream.
 *
 * The "service" keeps an append-only log of numbered events on top of a base
 * snapshot. The dashboard is only ever a fold of that log up to its cursor
 * (its Last-Event-ID). While disconnected the service keeps appending, the
 * cursor stands still, and on reconnect either the missed events are replayed
 * in order, or (after a simulated service restart) the client is told
 * `stream.resync` and loads a fresh snapshot instead.
 */
import type {
  ConnectionStatus,
  DashState,
  EventBody,
  LogEntry,
  ReconnectMode,
  StreamEvent,
} from './types';

export function applyEvent(s: DashState, e: StreamEvent): DashState {
  switch (e.type) {
    case 'session.upserted': {
      const exists = s.sessions.some((x) => x.runId === e.runId);
      if (exists) {
        return { ...s, sessions: s.sessions.map((x) => (x.runId === e.runId ? { ...x, ...e.patch } : x)) };
      }
      return e.create ? { ...s, sessions: [{ ...e.create, ...e.patch }, ...s.sessions] } : s;
    }
    case 'approval.upserted': {
      const exists = s.approvals.some((x) => x.proposalId === e.proposalId);
      const withHistory = <T extends { history: { at: number; event: string }[] }>(a: T): T =>
        e.historyEvent ? { ...a, history: [...a.history, { at: e.at, event: e.historyEvent }] } : a;
      if (exists) {
        return {
          ...s,
          approvals: s.approvals.map((x) => (x.proposalId === e.proposalId ? withHistory({ ...x, ...e.patch }) : x)),
        };
      }
      return e.create ? { ...s, approvals: [withHistory({ ...e.create, ...e.patch }), ...s.approvals] } : s;
    }
    case 'note.written': {
      const exists = s.notes.some((n) => n.id === e.note.id);
      return {
        ...s,
        notes: exists ? s.notes.map((n) => (n.id === e.note.id ? e.note : n)) : [...s.notes, e.note],
      };
    }
    case 'task.upserted':
      return { ...s, tasks: s.tasks.map((t) => (t.id === e.taskId ? { ...t, ...e.patch } : t)) };
    case 'tasks.changed':
    case 'service.heartbeat':
      return s;
  }
}

export function fold(base: DashState, events: StreamEvent[], upTo = Number.POSITIVE_INFINITY): DashState {
  let s = base;
  for (const e of events) if (e.id <= upTo) s = applyEvent(s, e);
  return s;
}

export function describe(e: EventBody): string {
  switch (e.type) {
    case 'session.upserted': {
      const parts = Object.entries(e.patch)
        .filter(([k]) => k === 'state' || k === 'activity' || k === 'name')
        .map(([k, v]) => `${k}=${String(v)}`);
      return `${e.runId}${e.create ? ' (new)' : ''}${parts.length ? ' · ' + parts.join(', ') : ''}`;
    }
    case 'approval.upserted':
      return `${e.proposalId}${e.patch.state ? ' · state=' + e.patch.state : ''}${e.create ? ' (new)' : ''}`;
    case 'note.written':
      return e.note.path;
    case 'task.upserted':
      return `${e.taskId.slice(0, 3)}… · ${Object.keys(e.patch).join(', ')}`;
    case 'tasks.changed':
      return 'task index rebuilt';
    case 'service.heartbeat':
      return 'still alive';
  }
}

export interface EngineState {
  base: DashState;
  events: StreamEvent[];
  nextId: number;
  /** The client's Last-Event-ID. */
  cursor: number;
  status: ConnectionStatus;
  statusDetail: string | null;
  lastEvent: { type: string; at: number };
  log: LogEntry[];
  logSeq: number;
}

export type EngineAction =
  | { kind: 'emit'; body: EventBody; at: number }
  | { kind: 'disconnect'; at: number }
  | { kind: 'connecting'; at: number }
  | { kind: 'reconnect'; mode: ReconnectMode; at: number }
  | { kind: 'reset'; state: EngineState };

const LOG_CAP = 40;

function pushLog(s: EngineState, entries: Omit<LogEntry, 'key'>[]): Pick<EngineState, 'log' | 'logSeq'> {
  let seq = s.logSeq;
  const added = entries.map((e) => ({ ...e, key: `l${++seq}` }));
  return { log: [...added.reverse(), ...s.log].slice(0, LOG_CAP), logSeq: seq };
}

export function engineReducer(s: EngineState, a: EngineAction): EngineState {
  switch (a.kind) {
    case 'emit': {
      const event = { ...a.body, id: s.nextId, at: a.at } as StreamEvent;
      const live = s.status === 'live';
      return {
        ...s,
        events: [...s.events, event],
        nextId: s.nextId + 1,
        cursor: live ? event.id : s.cursor,
        lastEvent: live ? { type: event.type, at: event.at } : s.lastEvent,
        ...pushLog(s, [
          {
            at: a.at,
            id: event.id,
            type: event.type,
            detail: describe(event) + (live ? '' : ' — not delivered'),
            tone: live ? 'live' : 'missed',
          },
        ]),
      };
    }
    case 'disconnect':
      if (s.status !== 'live') return s;
      return {
        ...s,
        status: 'disconnected',
        statusDetail: null,
        ...pushLog(s, [
          { at: a.at, id: null, type: 'stream closed', detail: `client holds Last-Event-ID ${s.cursor}`, tone: 'marker' },
        ]),
      };
    case 'connecting':
      return { ...s, status: 'connecting', statusDetail: null };
    case 'reconnect': {
      if (s.status === 'live') return s;
      const missed = s.events.filter((e) => e.id > s.cursor);
      const hello = {
        at: a.at,
        id: null,
        type: 'reconnect',
        detail: `GET /events · Last-Event-ID: ${s.cursor}`,
        tone: 'marker' as const,
      };
      if (a.mode === 'replay') {
        const last = missed[missed.length - 1];
        return {
          ...s,
          status: 'live',
          cursor: last ? last.id : s.cursor,
          lastEvent: last ? { type: last.type, at: last.at } : s.lastEvent,
          statusDetail: `Reconnected — replayed ${missed.length} event${missed.length === 1 ? '' : 's'}`,
          ...pushLog(s, [
            hello,
            ...missed.map((e) => ({ at: a.at, id: e.id, type: e.type, detail: describe(e), tone: 'replayed' as const })),
          ]),
        };
      }
      // Service restart: its in-memory log is gone, so the cursor can't be
      // honoured. It says `stream.resync` and the client reloads a snapshot.
      const snapshot = fold(s.base, s.events);
      const lastId = s.nextId - 1;
      return {
        ...s,
        base: snapshot,
        events: [],
        cursor: lastId,
        status: 'live',
        lastEvent: { type: 'stream.resync', at: a.at },
        statusDetail: 'Service restarted — stream.resync, loaded snapshot',
        ...pushLog(s, [
          hello,
          {
            at: a.at,
            id: null,
            type: 'stream.resync',
            detail: `ID ${s.cursor} is not in the restarted service's log`,
            tone: 'marker',
          },
          {
            at: a.at,
            id: lastId,
            type: 'snapshot',
            detail: `Loaded snapshot · ${snapshot.sessions.length} sessions, ${snapshot.approvals.length} requests`,
            tone: 'replayed',
          },
        ]),
      };
    }
    case 'reset':
      return a.state;
  }
}
