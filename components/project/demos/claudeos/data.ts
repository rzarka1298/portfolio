/**
 * Narrows the synthetic `mock.json` into the strongly typed shapes the mock
 * uses. JSON imports widen every enum to `string`, so each one is checked
 * against the real enum list here, once, at module load.
 */
import raw from './mock.json';
import {
  APPROVAL_STATES,
  RUN_STATES,
  STAGES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Approval,
  type ApprovalFilter,
  type ApprovalState,
  type DashState,
  type Destination,
  type DestinationId,
  type Freshness,
  type GitState,
  type LaunchAction,
  type Project,
  type RunState,
  type Session,
  type Task,
  type VaultNote,
} from './types';

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function ms(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function msOr(iso: string | null | undefined, fallback: number): number {
  return ms(iso) ?? fallback;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** The instant the synthetic data was "captured"; the sim clock starts here. */
export const MOCK_NOW = msOr(raw.now, Date.UTC(2026, 9, 14, 15, 30));
export const TODAY_ISO = raw.now.slice(0, 10);
export const INITIAL_EVENT_ID = raw.connection.lastEventId;
export const INITIAL_LAST_EVENT = {
  type: raw.connection.lastEvent.type,
  at: msOr(raw.connection.lastEvent.occurredAt, MOCK_NOW),
};
export const CONNECTION_LABELS = raw.connection.labels;

const DESTINATION_IDS: readonly DestinationId[] = [
  'overview',
  'projects',
  'research',
  'tasks',
  'agent-runs',
  'skills',
  'knowledge',
  'settings',
];

export const DESTINATIONS: Destination[] = raw.destinations.map((d) => ({
  id: oneOf(d.id, DESTINATION_IDS, 'overview'),
  label: d.label,
  description: d.description,
  implemented: d.implemented,
}));

export const RUN_STATE_DISPLAY: Record<RunState, { label: string; glyph: string; active: boolean }> = (() => {
  const out = {} as Record<RunState, { label: string; glyph: string; active: boolean }>;
  for (const s of RUN_STATES) {
    const d = raw.runStateDisplay[s];
    out[s] = { label: d.label, glyph: d.glyph, active: d.group === 'active' };
  }
  return out;
})();

export const APPROVAL_STATE_DISPLAY: Record<ApprovalState, { label: string; glyph: string; filter: ApprovalFilter }> =
  (() => {
    const out = {} as Record<ApprovalState, { label: string; glyph: string; filter: ApprovalFilter }>;
    const filters: readonly ApprovalFilter[] = ['pending', 'decided', 'expired'];
    for (const s of APPROVAL_STATES) {
      const d = raw.approvalStateDisplay[s];
      out[s] = { label: d.label, glyph: d.glyph, filter: oneOf(d.filter, filters, 'decided') };
    }
    return out;
  })();

const LAUNCH_IDS: readonly LaunchAction[] = ['antigravity', 'claude-code', 'pair', 'finder', 'github'];
export const LAUNCH_ACTIONS: { action: LaunchAction; label: string }[] = raw.launchActions.map((a) => ({
  action: oneOf(a.action, LAUNCH_IDS, 'finder'),
  label: a.label,
}));

export const GIT_LABELS = raw.gitStateLabels;

function toGit(g: (typeof raw.projects)[number]['git']): GitState {
  if (g.kind === 'repo') {
    return {
      kind: 'repo',
      branch: str(g.branch),
      detached: g.detached === true,
      dirty: g.dirty === true,
      commits: (g.commits ?? []).map((c) => ({ sha: c.sha, subject: c.subject, at: msOr(c.at, MOCK_NOW) })),
      remote: g.remote ? g.remote.label : null,
    };
  }
  if (g.kind === 'skipped') return { kind: 'skipped', reason: g.reason ?? 'unknown' };
  return { kind: 'not-a-repo' };
}

export const PROJECTS: Project[] = raw.projects.map((p) => ({
  id: p.id,
  name: p.name,
  pinned: p.pinned,
  displayPath: p.displayPath,
  git: toGit(p.git),
}));

const SESSIONS: Session[] = raw.sessions.map((s) => ({
  runId: s.runId,
  name: s.name,
  state: oneOf(s.state, RUN_STATES, 'stale'),
  activity: s.activity === 'working' || s.activity === 'idle' ? s.activity : null,
  project: str(s.project),
  model: str(s.model),
  effort: str(s.effort),
  launchSource: str(s.launchSource),
  startedAt: msOr(s.startedAt, MOCK_NOW),
  lastActivityAt: ms(s.lastActivityAt),
  endedAt: ms(s.endedAt),
  subagents: s.subagents,
  unclassified: s.group === 'unclassified',
  note: str(s.note),
}));

const APPROVALS: Approval[] = raw.approvals.map((a) => {
  const requestedAt = msOr(a.requestedAt, MOCK_NOW);
  return {
    proposalId: a.proposalId,
    operation: a.operation,
    state: oneOf(a.state, APPROVAL_STATES, 'pending'),
    title: a.title,
    project: str(a.project),
    runId: str(a.runId),
    requestedAt,
    expiresAt: ms(a.expiresAt),
    decidedAt: ms(a.decidedAt),
    blocks: a.blocks
      ? {
          happen: a.blocks.happen,
          target: a.blocks.target,
          change: a.blocks.change ? { before: a.blocks.change.before, after: a.blocks.change.after } : null,
          reason: a.blocks.reason,
          risks: [...a.blocks.risks],
        }
      : null,
    effect: str(a.effect),
    destructive: a.destructive === true,
    history: a.history
      ? a.history.map((h) => ({ at: msOr(h.at, requestedAt), event: h.event }))
      : [{ at: requestedAt, event: 'Requested' }],
    consumed: a.state === 'executed',
  };
});

const TASKS: Task[] = raw.tasks.items.map((t) => ({
  id: t.id,
  title: t.title,
  status: oneOf(t.status, TASK_STATUSES, 'inbox'),
  priority: t.priority ? oneOf(t.priority, TASK_PRIORITIES, 'medium') : null,
  project: str(t.project),
  due: str(t.due),
  assignee: str(t.assignee),
  blockedBy: str(t.blockedBy),
  proposedBy: str(t.proposedBy),
}));

function toGeneratedBy(g: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(g)) if (typeof v === 'string') out[k] = v;
  return out;
}

const NOTES: VaultNote[] = raw.vault.notes.map((n) => ({
  id: n.id,
  path: n.path,
  title: n.title,
  scope: n.scope,
  stage: oneOf(n.stage, STAGES, 'capture'),
  created: msOr(n.created, MOCK_NOW),
  updated: msOr(n.updated, MOCK_NOW),
  generatedBy: toGeneratedBy(n.generatedBy),
  aiGenerated: n.aiGenerated,
  claimType: str(n.claimType),
  sources: [...n.sources],
  confidence: n.confidence,
  lastReviewed: ms(n.lastReviewed),
  body: str(n.body),
}));

export const WORKSPACES: { id: string; displayName: string }[] = raw.vault.workspaces.map((w) => ({ ...w }));

export function initialDashState(): DashState {
  return structuredCloneSafe({ sessions: SESSIONS, approvals: APPROVALS, tasks: TASKS, notes: NOTES });
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

type RawWidget = (typeof raw.widgets)[number];
function widget(id: string): RawWidget {
  const w = raw.widgets.find((x) => x.id === id);
  if (!w) throw new Error(`mock.json is missing widget ${id}`);
  return w;
}

const FRESHNESS: readonly Freshness[] = ['live', 'cached', 'stale', 'unavailable'];
export function widgetMeta(id: string): { title: string; source: string | null; freshness: Freshness } {
  const w = widget(id);
  return { title: w.title, source: str(w.sourceLabel), freshness: oneOf(w.freshness, FRESHNESS, 'unavailable') };
}

const usage = widget('claude-usage').data;
const codex = widget('codex').data;
const quick = widget('quick-actions').data;

export const CLAUDE_USAGE = {
  windowLabel: usage?.planCapacity?.label ?? '5-hour window',
  usedPercent: usage?.planCapacity?.usedPercent ?? null,
  resetsAt: ms(usage?.planCapacity?.resetsAt),
  weeklyPercent: usage?.weekly?.usedPercent ?? null,
  tokensToday: usage?.tokensToday ?? null,
  costUsd: usage?.estimatedCostUsd ?? null,
  halfHourly: usage?.halfHourly ? [...usage.halfHourly] : [],
};

export const CODEX = {
  weeklyPercent: codex?.weeklyUsedPercent ?? null,
  reservePercent: codex?.reservePercent ?? 80,
  headroomLabel: codex?.headroomLabel ?? '',
  sessions: (codex?.sessions ?? []).map((s) => ({ ...s, updatedAt: msOr(s.updatedAt, MOCK_NOW) })),
};

export const QUICK_ACTIONS: { label: string; effect: string }[] = (quick?.actions ?? []).map((a) => ({ ...a }));

export const PERMISSION_CARDS = {
  today: { source: str(widget('today').sourceLabel) ?? 'Calendar', body: str(widget('today').body) ?? '' },
  github: {
    source: str(widget('github-discoveries').sourceLabel) ?? 'GitHub',
    body: str(widget('github-discoveries').body) ?? '',
  },
  techIntel: str(widget('tech-intel').body) ?? 'Tech intel unavailable',
};

export const SERVICE_UPTIME = widget('service-health').data?.uptime ?? 'unavailable';
