import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CLAUDE_USAGE,
  CODEX,
  PERMISSION_CARDS,
  PROJECTS,
  QUICK_ACTIONS,
  SERVICE_UPTIME,
  widgetMeta,
} from './data';
import { ago, clock, compactNumber } from './format';
import { LaunchToolbar } from './Projects';
import { Btn, CardFrame, FreshnessFooter, Meter } from './ui';
import type { CardStateOverride, ConnectionStatus, LaunchAction, Project, Session } from './types';

interface Common {
  override: CardStateOverride;
  disconnected: boolean;
  onConnectPreview: () => void;
  onRetryPreview: () => void;
}

export function Rail({
  status,
  lastEvent,
  cursor,
  now,
  live,
  onQuickAction,
  ...common
}: Common & {
  status: ConnectionStatus;
  lastEvent: { type: string; at: number };
  cursor: number;
  now: number;
  live: boolean;
  onQuickAction: (effect: string, label: string) => void;
}) {
  const health = widgetMeta('service-health');
  const statusText = status === 'live' ? 'Connected' : status === 'connecting' ? 'Reconnecting…' : 'Not reachable';
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <CardFrame {...common} title={health.title} source="Companion service" freshness={health.freshness} emptyText="No health report yet.">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="font-medium">{statusText}</dd>
          <dt className="text-muted-foreground">Uptime</dt>
          <dd>{SERVICE_UPTIME}</dd>
          <dt className="text-muted-foreground">Last event</dt>
          <dd className="min-w-0 break-words">
            <span className="font-mono">{lastEvent.type}</span> · {ago(lastEvent.at, now)}
          </dd>
          <dt className="text-muted-foreground">Last-Event-ID</dt>
          <dd className="font-mono tabular-nums">{cursor}</dd>
        </dl>
      </CardFrame>
      <CardFrame
        {...common}
        title="Today"
        source={PERMISSION_CARDS.today.source}
        freshness="unavailable"
        permission={{ source: PERMISSION_CARDS.today.source, onConnect: common.onConnectPreview }}
      />
      <section aria-label="Quick actions" className="rounded-xl border bg-card/80 p-4">
        <h3 className="mb-2 text-sm font-semibold">Quick actions</h3>
        <ul className="flex flex-col gap-1.5">
          {QUICK_ACTIONS.map((a) => (
            <li key={a.label}>
              <Btn
                className="w-full justify-start"
                disabled={a.effect.startsWith('proposal:') && !live}
                onClick={() => onQuickAction(a.effect, a.label)}
              >
                {a.label}
              </Btn>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Hero({
  sessions,
  disconnected,
  override,
  onOpen,
  onConnectPreview,
}: {
  sessions: Session[];
  disconnected: boolean;
  override: CardStateOverride;
  onOpen: () => void;
  onConnectPreview: () => void;
}) {
  const running = sessions.filter((s) => s.state === 'running').length;
  const waiting = sessions.filter((s) => s.state === 'waiting-for-approval').length;
  const stale = sessions.filter((s) => s.state === 'stale').length;
  const starting = sessions.filter((s) => s.state === 'starting').length;
  const value = running + waiting;
  const meter = value === 0 ? 0 : (waiting / value) * 100;
  const showData = override === 'live' || override === 'stale';
  const freshness = override === 'live' && !disconnected ? 'live' : showData ? 'stale' : 'unavailable';
  return (
    <section
      aria-label="Active Claude sessions"
      className={cn(
        'relative flex min-w-0 flex-col gap-2 rounded-xl border border-[#0b0b0f]/10 bg-[#f4efe6] p-4 text-[#0b0b0f] shadow-sm transition-[opacity,transform] sm:col-span-2',
        showData && 'hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
        disconnected && 'opacity-[0.85]',
      )}
    >
      <h3 className="text-[0.68rem] font-semibold uppercase tracking-[0.14em]">Active Claude sessions</h3>
      {showData ? (
        <div className={cn('flex flex-col gap-2', override === 'stale' && 'opacity-60')}>
          <div className="flex items-end gap-3">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="block text-6xl font-semibold leading-none tabular-nums"
              >
                {value}
              </motion.span>
            </AnimatePresence>
            {starting > 0 && <span className="pb-1 text-xs text-[#5a5650]">+{starting} starting</span>}
          </div>
          <p className="text-xs text-[#5a5650]">
            {waiting} waiting for approval · {stale} unknown
          </p>
          <div aria-hidden className="h-0.5 w-full overflow-hidden rounded-full bg-[#0b0b0f]/10">
            <div className="h-full bg-[#c2185b] transition-[width] duration-500" style={{ width: `${meter}%` }} />
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="self-start rounded text-xs font-medium underline underline-offset-2 after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[#c2185b]"
          >
            Open Agent runs
          </button>
        </div>
      ) : override === 'empty' ? (
        <p className="text-sm text-[#5a5650]">No Claude sessions are running.</p>
      ) : override === 'permission-required' ? (
        <div className="space-y-2 text-sm">
          <p className="text-[#5a5650]">Claude Code hooks aren't connected</p>
          <button type="button" onClick={onConnectPreview} className="rounded-md border border-[#0b0b0f]/30 px-2.5 py-1 text-xs font-medium hover:bg-[#0b0b0f]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2185b]">
            Connect
          </button>
        </div>
      ) : (
        <p className="text-sm text-[#a5134c]">Couldn't load active sessions</p>
      )}
      <FreshnessFooter tone="cream" freshness={freshness} source="Claude Code hooks" />
    </section>
  );
}

export function OverviewCanvas({
  sessions,
  now,
  live,
  onOpenRuns,
  onLaunch,
  ...common
}: Common & {
  sessions: Session[];
  now: number;
  live: boolean;
  onOpenRuns: () => void;
  onLaunch: (p: Project, a: LaunchAction, label: string) => void;
}) {
  const pinned = PROJECTS.filter((p) => p.pinned);
  const usage = widgetMeta('claude-usage');
  const codex = widgetMeta('codex');
  const maxBar = Math.max(1, ...CLAUDE_USAGE.halfHourly);
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
      <Hero sessions={sessions} disconnected={common.disconnected} override={common.override} onOpen={onOpenRuns} onConnectPreview={common.onConnectPreview} />

      <CardFrame {...common} wide title="Project shortcuts" source="Registered projects" freshness="live" emptyText="No pinned projects yet.">
        <ul className="space-y-3">
          {pinned.map((p) => (
            <li key={p.id} className="space-y-1.5">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{p.name}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">{p.displayPath}</span>
              </div>
              <LaunchToolbar project={p} disabled={!live} onLaunch={onLaunch} compact />
            </li>
          ))}
        </ul>
      </CardFrame>

      <CardFrame {...common} title={usage.title} source="Claude Code usage logs" freshness={usage.freshness} emptyText="No usage recorded today.">
        <div className="space-y-2.5">
          <Meter label={CLAUDE_USAGE.windowLabel} value={CLAUDE_USAGE.usedPercent} />
          <Meter label="This week" value={CLAUDE_USAGE.weeklyPercent} />
          <div aria-hidden className="flex h-8 items-end gap-0.5">
            {CLAUDE_USAGE.halfHourly.map((v, i) => (
              <span key={i} className="flex-1 rounded-sm bg-muted-foreground/40" style={{ height: `${Math.max(4, (v / maxBar) * 100)}%` }} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {CLAUDE_USAGE.tokensToday === null ? 'Tokens unavailable' : `${compactNumber(CLAUDE_USAGE.tokensToday)} tokens today`} ·{' '}
            {CLAUDE_USAGE.costUsd === null ? 'cost unavailable' : `≈ $${CLAUDE_USAGE.costUsd.toFixed(2)} estimated`}
            {CLAUDE_USAGE.resetsAt !== null && ` · resets ${clock(CLAUDE_USAGE.resetsAt)}`}
          </p>
        </div>
      </CardFrame>

      <CardFrame {...common} title={codex.title} source="Codex session logs" freshness={codex.freshness} emptyText="No Codex sessions this week.">
        <div className="space-y-2.5">
          <Meter label={`Weekly use · reserve at ${CODEX.reservePercent}%`} value={CODEX.weeklyPercent} reserve={CODEX.reservePercent} />
          <p className="text-xs text-muted-foreground">{CODEX.headroomLabel}</p>
          <ul className="space-y-1 text-xs">
            {CODEX.sessions.map((s) => (
              <li key={s.id} className="flex min-w-0 gap-2">
                <span className="min-w-0 truncate">{s.title}</span>
                <span className="ml-auto shrink-0 text-muted-foreground">{ago(s.updatedAt, now)}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardFrame>

      <CardFrame {...common} title="Tech intel" source={null} freshness="unavailable" unavailableText={PERMISSION_CARDS.techIntel} />
      <CardFrame
        {...common}
        title="GitHub discoveries"
        source={PERMISSION_CARDS.github.source}
        freshness="unavailable"
        permission={{ source: PERMISSION_CARDS.github.source, onConnect: common.onConnectPreview }}
      />
    </div>
  );
}
