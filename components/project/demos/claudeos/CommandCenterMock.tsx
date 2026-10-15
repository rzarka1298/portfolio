import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import {
  Bot,
  BookOpen,
  FlaskConical,
  FolderGit2,
  LayoutGrid,
  ListTodo,
  Play,
  Puzzle,
  RotateCcw,
  Settings,
  WifiOff,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DemoProps } from '../index';
import { AgentRunsView } from './AgentRuns';
import { ApprovalsView } from './Approvals';
import { CONNECTION_LABELS, DESTINATIONS, TODAY_ISO } from './data';
import { clock } from './format';
import { KnowledgePreview } from './Knowledge';
import { OverviewCanvas, Rail } from './Overview';
import { ProjectsView } from './Projects';
import { TasksView } from './Tasks';
import { ACCENT_TEXT, Btn, Chip, FOCUS } from './ui';
import { useCommandCenter, type CommandCenter } from './useCommandCenter';
import type { CardStateOverride, DestinationId, LogEntry, ReconnectMode } from './types';

const TAB_ICON: Record<DestinationId, typeof Bot> = {
  overview: LayoutGrid,
  projects: FolderGit2,
  research: FlaskConical,
  tasks: ListTodo,
  'agent-runs': Bot,
  skills: Puzzle,
  knowledge: BookOpen,
  settings: Settings,
};

const CARD_STATES: { id: CardStateOverride; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'stale', label: 'Stale' },
  { id: 'empty', label: 'Empty' },
  { id: 'permission-required', label: 'Permission required' },
  { id: 'failure', label: 'Failure' },
];

const STARS = Array.from({ length: 12 }, (_, i) => ({
  left: `${(i * 37 + 11) % 97}%`,
  top: `${(i * 53 + 7) % 93}%`,
  delay: `${(i * 0.7) % 4}s`,
}));

export default function CommandCenterMock({ project }: DemoProps) {
  const cc = useCommandCenter();
  const reduced = useReducedMotion() ?? false;
  const [tab, setTab] = useState<DestinationId>('overview');
  const [runsView, setRunsView] = useState<'sessions' | 'requests'>('sessions');
  const [selectedRun, setSelectedRun] = useState<string | null>(null);
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [cardState, setCardState] = useState<CardStateOverride>('live');

  // Play the scripted timeline once, the first time the mock scrolls into view.
  const frameRef = useRef<HTMLDivElement>(null);
  const autoplayed = useRef(false);
  const { playTimeline } = cc;
  useEffect(() => {
    const el = frameRef.current;
    if (!el || reduced || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!autoplayed.current && entries.some((e) => e.isIntersecting)) {
          autoplayed.current = true;
          playTimeline();
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, playTimeline]);

  const pending = cc.client.approvals.filter((a) => a.state === 'pending').length;
  const disconnected = cc.status !== 'live';
  const later = () => cc.toast('Connectors arrive in a later phase.');
  const common = {
    override: cardState,
    disconnected,
    onConnectPreview: later,
    onRetryPreview: () => cc.toast('Still failing: this is the Failure state preview.', 'warning'),
  };

  const openRequest = (id: string) => {
    setTab('agent-runs');
    setRunsView('requests');
    setSelectedProposal(id);
  };
  const openRun = (id: string) => {
    setTab('agent-runs');
    setRunsView('sessions');
    setSelectedRun(id);
  };

  function onQuickAction(effect: string, label: string) {
    if (effect === 'navigate:tasks') setTab('tasks');
    else if (effect === 'switcher-opened') {
      setTab('projects');
      cc.toast('Project switcher: pick a project to launch.');
    } else if (effect.startsWith('proposal:')) {
      const id = cc.raiseTest();
      if (id) cc.toast('Test request raised — it is waiting in the inbox.');
    } else cc.toast(`${label}: connectors arrive in a later phase.`);
  }

  const dest = DESTINATIONS.find((d) => d.id === tab) ?? DESTINATIONS[0];
  const showRail = tab === 'overview';

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-w-0 space-y-3" aria-label={`${project.title} interactive mock`} role="region">
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className={cn('border px-2 py-0.5 text-xs font-semibold', ACCENT_TEXT)}>Mock</span>
          Interactive mock with sample data — the real app runs locally in Obsidian.
        </p>

        <Controls cc={cc} cardState={cardState} setCardState={setCardState} />

        <div ref={frameRef} className="relative min-w-0 overflow-hidden border border-bp-line/50 bg-background">
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2">
            <span aria-hidden className="flex gap-1.5">
              <span className="h-2 w-2 border border-bp-line-soft" />
              <span className="h-2 w-2 border border-bp-line-soft" />
              <span className="h-2 w-2 bg-bp-signal" />
            </span>
            <span className="min-w-0 truncate text-xs text-muted-foreground">demo-vault — Obsidian</span>
          </div>

          <div className="relative flex min-w-0">
            {/* Starfield: dark mode only, off under reduced motion */}
            <div aria-hidden className="pointer-events-none absolute inset-0 hidden dark:block">
              {STARS.map((s, i) => (
                <span
                  key={i}
                  className="absolute h-0.5 w-0.5 rounded-full bg-white/60 motion-safe:animate-pulse"
                  style={{ left: s.left, top: s.top, animationDelay: s.delay, animationDuration: '3s' }}
                />
              ))}
            </div>

            {/* Obsidian ribbon */}
            <div aria-hidden className="hidden w-10 shrink-0 flex-col items-center gap-3 border-r bg-muted/30 py-3 text-muted-foreground sm:flex">
              <LayoutGrid className={cn('h-4 w-4', ACCENT_TEXT)} />
              <BookOpen className="h-4 w-4" />
              <ListTodo className="h-4 w-4" />
            </div>

            <div className="relative min-w-0 flex-1 p-3 sm:p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Command center</h2>
                <ConnectionPill cc={cc} />
              </div>

              <Tabs tab={tab} setTab={setTab} pending={pending} />

              <div className={cn('mt-4 grid min-w-0 gap-4', 'lg:grid-cols-[13.5rem_minmax(0,1fr)]')}>
                <div className={cn('order-2 min-w-0 lg:order-1', !showRail && 'hidden lg:block')}>
                  <Rail
                    {...common}
                    status={cc.status}
                    lastEvent={cc.lastEvent}
                    cursor={cc.cursor}
                    now={cc.now}
                    live={cc.live}
                    onQuickAction={onQuickAction}
                  />
                </div>
                <div
                  role="tabpanel"
                  id={`ccc-panel-${tab}`}
                  aria-labelledby={`ccc-tab-${tab}`}
                  tabIndex={0}
                  className={cn('order-1 min-w-0 lg:order-2', FOCUS)}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.15 }}
                      className="min-w-0"
                    >
                      <h3 className="sr-only">{dest.label}</h3>
                      {tab === 'overview' && (
                        <OverviewCanvas
                          {...common}
                          sessions={cc.client.sessions}
                          now={cc.now}
                          live={cc.live}
                          onOpenRuns={() => setTab('agent-runs')}
                          onLaunch={cc.launch}
                        />
                      )}
                      {tab === 'projects' && <ProjectsView now={cc.now} disabled={!cc.live} onLaunch={cc.launch} />}
                      {tab === 'tasks' && (
                        <TasksView
                          tasks={cc.client.tasks}
                          live={cc.live}
                          onAccept={(id) => cc.acceptTask(id, TODAY_ISO)}
                          onDismiss={cc.dismissTask}
                        />
                      )}
                      {tab === 'agent-runs' && (
                        <div className="space-y-3">
                          <div role="group" aria-label="Agent runs section" className="flex flex-wrap gap-1.5">
                            <Chip active={runsView === 'sessions'} onClick={() => setRunsView('sessions')}>
                              Sessions
                            </Chip>
                            <Chip active={runsView === 'requests'} onClick={() => setRunsView('requests')}>
                              Requests <span className="tabular-nums">{pending}</span>
                            </Chip>
                          </div>
                          {runsView === 'sessions' ? (
                            <AgentRunsView
                              sessions={cc.client.sessions}
                              approvals={cc.client.approvals}
                              now={cc.now}
                              live={cc.live}
                              selected={selectedRun}
                              onSelect={setSelectedRun}
                              onRequestTerminate={(s) => {
                                if (cc.requestTerminate(s)) cc.toast('Request raised — it is waiting in the inbox.');
                              }}
                              onOpenRequest={openRequest}
                              onPreviewAction={(t) => cc.toast(t)}
                            />
                          ) : (
                            <ApprovalsView
                              approvals={cc.client.approvals}
                              now={cc.now}
                              live={cc.live}
                              selected={selectedProposal}
                              onSelect={setSelectedProposal}
                              decide={cc.decide}
                              tamper={cc.tamper}
                              skipTo={cc.skipTo}
                              onOpenRun={openRun}
                            />
                          )}
                        </div>
                      )}
                      {tab === 'knowledge' && <KnowledgePreview notes={cc.client.notes} />}
                      {(tab === 'research' || tab === 'skills' || tab === 'settings') && (
                        <ComingSoon id={tab} label={dest.label} description={dest.description} implemented={dest.implemented} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          <Toasts cc={cc} />
        </div>

        <EventLog log={cc.log} cursor={cc.cursor} />
      </div>
    </MotionConfig>
  );
}

/* ------------------------------------------------------------------ */

function Controls({
  cc,
  cardState,
  setCardState,
}: {
  cc: CommandCenter;
  cardState: CardStateOverride;
  setCardState: (s: CardStateOverride) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2 border bg-card p-2.5 text-xs">
      <Btn onClick={cc.playTimeline} disabled={cc.timeline === 'playing'}>
        <Play aria-hidden className="h-3.5 w-3.5" />
        {cc.timeline === 'playing' ? 'Timeline playing…' : cc.timeline === 'done' ? 'Play timeline again' : 'Play timeline'}
      </Btn>
      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="sr-only">Disconnect test</legend>
        <Btn onClick={() => cc.disconnect(cc.reconnectMode)} disabled={!cc.live}>
          <WifiOff aria-hidden className="h-3.5 w-3.5" /> Disconnect for 4 s
        </Btn>
        <span className="text-muted-foreground">then</span>
        {(
          [
            ['replay', 'Replay missed events'],
            ['resync', 'Service restarted (resync)'],
          ] as [ReconnectMode, string][]
        ).map(([m, label]) => (
          <label key={m} className="inline-flex cursor-pointer items-center gap-1">
            <input
              type="radio"
              name="ccc-reconnect"
              value={m}
              checked={cc.reconnectMode === m}
              onChange={() => cc.setReconnectMode(m)}
              className="accent-[hsl(var(--bp-signal))]"
            />
            {label}
          </label>
        ))}
      </fieldset>
      <label className="inline-flex items-center gap-1.5">
        Card state
        <select
          value={cardState}
          onChange={(e) => {
            const next = CARD_STATES.find((c) => c.id === e.target.value);
            if (next) setCardState(next.id);
          }}
          className={cn('border bg-background px-1.5 py-1', FOCUS)}
        >
          {CARD_STATES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <Btn variant="ghost" onClick={cc.reset} className="ml-auto">
        <RotateCcw aria-hidden className="h-3.5 w-3.5" /> Reset demo
      </Btn>
    </div>
  );
}

function Tabs({
  tab,
  setTab,
  pending,
}: {
  tab: DestinationId;
  setTab: (t: DestinationId) => void;
  pending: number;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    const i = DESTINATIONS.findIndex((d) => d.id === tab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % DESTINATIONS.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + DESTINATIONS.length) % DESTINATIONS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = DESTINATIONS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setTab(DESTINATIONS[next].id);
    refs.current[next]?.focus();
  }
  return (
    <div
      role="tablist"
      aria-label="Destinations"
      onKeyDown={onKey}
      className="-mx-1 flex gap-0.5 overflow-x-auto border-b px-1 [scrollbar-width:thin]"
    >
      {DESTINATIONS.map((d, i) => {
        const Icon = TAB_ICON[d.id];
        const selected = d.id === tab;
        const stub = !d.implemented;
        return (
          <button
            key={d.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`ccc-tab-${d.id}`}
            aria-selected={selected}
            aria-controls={`ccc-panel-${d.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => setTab(d.id)}
            className={cn(
              '-mb-px inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-2.5 py-2 text-xs transition-colors',
              FOCUS,
              selected
                ? cn('border-bp-signal font-semibold text-foreground')
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {d.label}
            {d.id === 'agent-runs' && pending > 0 && (
              <span className="bg-bp-signal px-1.5 text-[0.65rem] font-semibold leading-4 text-[#0B2341]">
                {pending}
                <span className="sr-only"> pending requests</span>
              </span>
            )}
            {stub && (
              <span className="border px-1 text-[0.6rem] uppercase tracking-wide text-muted-foreground">
                {d.id === 'knowledge' ? 'Preview' : 'Soon'}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ConnectionPill({ cc }: { cc: CommandCenter }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    if (!cc.statusDetail) return;
    setShowDetail(true);
    const t = window.setTimeout(() => setShowDetail(false), 6000);
    return () => window.clearTimeout(t);
  }, [cc.statusDetail]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = items.length;
      items[(i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n]?.focus();
    } else if (e.key === 'Tab') setOpen(false);
  }

  function pick(mode: ReconnectMode) {
    setOpen(false);
    btnRef.current?.focus();
    cc.setReconnectMode(mode);
    cc.disconnect(mode);
  }

  const label =
    cc.status === 'live'
      ? showDetail && cc.statusDetail
        ? cc.statusDetail
        : CONNECTION_LABELS.live
      : cc.status === 'connecting'
        ? CONNECTION_LABELS.connecting
        : CONNECTION_LABELS.disconnected;

  return (
    <div className="relative min-w-0 max-w-full">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex max-w-full items-center gap-1.5 border bg-card px-2.5 py-1 text-left text-xs',
          FOCUS,
        )}
      >
        <span
          aria-hidden
          className={cn(
            'h-2 w-2 shrink-0 rounded-full',
            cc.status === 'live' ? 'bg-emerald-500' : cc.status === 'connecting' ? 'bg-amber-500 motion-safe:animate-pulse' : 'bg-red-500',
          )}
        />
        <span className="min-w-0" aria-live="polite">
          <span className="font-medium">{label}</span>
          <span className="text-muted-foreground">
            {' '}
            · Last event: <span className="font-mono">{cc.lastEvent.type}</span> at {clock(cc.lastEvent.at, true)}
          </span>
        </span>
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Connection tests"
          onKeyDown={onMenuKey}
          className="absolute right-0 z-20 mt-1 w-60 max-w-[calc(100vw-3rem)] border bg-popover p-1 text-xs shadow-lg"
        >
          <button type="button" role="menuitem" disabled={!cc.live} onClick={() => pick('replay')} className={cn('block w-full px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50', FOCUS)}>
            Simulate disconnect
            <span className="block text-muted-foreground">Reconnect with Last-Event-ID and replay what was missed</span>
          </button>
          <button type="button" role="menuitem" disabled={!cc.live} onClick={() => pick('resync')} className={cn('block w-full px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50', FOCUS)}>
            Simulate restart
            <span className="block text-muted-foreground">The service lost its log: stream.resync, then a snapshot</span>
          </button>
        </div>
      )}
    </div>
  );
}

function ComingSoon({
  id,
  label,
  description,
  implemented,
}: {
  id: DestinationId;
  label: string;
  description: string;
  implemented: boolean;
}) {
  const Icon = TAB_ICON[id];
  return (
    <div className="flex min-h-[14rem] flex-col items-center justify-center gap-2 border border-dashed p-6 text-center">
      <Icon aria-hidden className="h-6 w-6 text-muted-foreground" />
      <p className="font-semibold">{label}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      <p className={cn('text-xs font-semibold uppercase tracking-wider', ACCENT_TEXT)}>
        {implemented ? 'Not included in this mock' : 'Coming soon'}
      </p>
    </div>
  );
}

function Toasts({ cc }: { cc: CommandCenter }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-3 bottom-3 z-30 flex flex-col items-stretch gap-2 sm:left-auto sm:w-80"
    >
      <AnimatePresence initial={false}>
        {cc.toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className={cn(
              'pointer-events-auto flex items-start gap-2 border bg-popover px-3 py-2 text-xs shadow-lg',
              t.tone === 'success' && 'border-emerald-600/40',
              t.tone === 'warning' && 'border-amber-600/40',
            )}
          >
            <span className="min-w-0 flex-1">{t.text}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => cc.dismissToast(t.id)}
              className={cn('text-muted-foreground hover:text-foreground', FOCUS)}
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

const TONE_LABEL: Record<LogEntry['tone'], string> = {
  live: 'delivered',
  replayed: 'replayed',
  missed: 'missed',
  marker: '',
};

function EventLog({ log, cursor }: { log: LogEntry[]; cursor: number }) {
  return (
    <details className="group border bg-card text-xs" open>
      <summary className={cn('cursor-pointer select-none px-3 py-2 font-medium', FOCUS)}>
        Under the hood: the event stream{' '}
        <span className="font-normal text-muted-foreground">
          · client Last-Event-ID <span className="font-mono">{cursor}</span>
        </span>
      </summary>
      <ol className="max-h-56 space-y-0.5 overflow-y-auto border-t px-3 py-2 font-mono text-[0.7rem]" aria-label="Recent stream events">
        {log.map((e) => (
          <li
            key={e.key}
            className={cn(
              'flex min-w-0 flex-wrap gap-x-2',
              e.tone === 'marker' && 'italic text-muted-foreground',
              e.tone === 'missed' && 'text-amber-700 dark:text-amber-400',
              e.tone === 'replayed' && ACCENT_TEXT,
            )}
          >
            <span className="shrink-0 tabular-nums text-muted-foreground">{clock(e.at, true)}</span>
            <span className="w-10 shrink-0 tabular-nums">{e.id ?? '—'}</span>
            <span className="shrink-0 font-semibold">{e.type}</span>
            <span className="min-w-0 break-all">{e.detail}</span>
            {TONE_LABEL[e.tone] && <span className="text-muted-foreground">[{TONE_LABEL[e.tone]}]</span>}
          </li>
        ))}
      </ol>
    </details>
  );
}
