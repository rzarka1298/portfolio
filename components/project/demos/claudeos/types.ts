/**
 * Types for the Command Center mock. Enum values mirror the real domain
 * package; every value they hold comes from the synthetic `mock.json`.
 */

export const RUN_STATES = [
  'queued',
  'starting',
  'running',
  'waiting-for-approval',
  'stale',
  'completed',
  'failed',
  'cancelled',
] as const;
export type RunState = (typeof RUN_STATES)[number];

export type Activity = 'working' | 'idle';

export interface Session {
  runId: string;
  name: string;
  state: RunState;
  activity: Activity | null;
  project: string | null;
  model: string | null;
  effort: string | null;
  launchSource: string | null;
  /** Sim-clock epoch milliseconds. */
  startedAt: number;
  lastActivityAt: number | null;
  endedAt: number | null;
  subagents: number;
  unclassified: boolean;
  note: string | null;
}

export const APPROVAL_STATES = [
  'pending',
  'approved',
  'executing',
  'executed',
  'failed',
  'unknown',
  'denied',
  'withdrawn',
  'lapsed',
  'expired',
] as const;
export type ApprovalState = (typeof APPROVAL_STATES)[number];
export type ApprovalFilter = 'pending' | 'decided' | 'expired';

export interface ApprovalBlocks {
  happen: string;
  target: string;
  change: { before: string; after: string } | null;
  reason: string;
  risks: string[];
}

export interface HistoryEntry {
  at: number;
  event: string;
}

export interface Approval {
  proposalId: string;
  operation: string;
  state: ApprovalState;
  title: string;
  project: string | null;
  runId: string | null;
  requestedAt: number;
  expiresAt: number | null;
  decidedAt: number | null;
  blocks: ApprovalBlocks | null;
  effect: string | null;
  destructive: boolean;
  history: HistoryEntry[];
  /** Set once the approval has been used; an approval runs at most once. */
  consumed: boolean;
}

export const STAGES = ['capture', 'raw', 'synthesis', 'wiki', 'deliverable', 'output'] as const;
export type Stage = (typeof STAGES)[number];

export interface VaultNote {
  id: string;
  path: string;
  title: string;
  scope: string;
  stage: Stage;
  created: number;
  updated: number;
  generatedBy: Record<string, string>;
  aiGenerated: boolean;
  claimType: string | null;
  sources: string[];
  confidence: string;
  lastReviewed: number | null;
  body: string | null;
}

export const TASK_STATUSES = ['inbox', 'proposed', 'ready', 'in-progress', 'blocked', 'done', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export const TASK_PRIORITIES = ['urgent', 'high', 'medium', 'low'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];
export const TASK_FILTERS = ['all', 'today', 'upcoming', 'overdue', 'project', 'proposed', 'blocked', 'completed'] as const;
export type TaskFilter = (typeof TASK_FILTERS)[number];

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority | null;
  project: string | null;
  /** ISO date (YYYY-MM-DD) or null. */
  due: string | null;
  assignee: string | null;
  blockedBy: string | null;
  proposedBy: string | null;
}

export interface Commit {
  sha: string;
  subject: string;
  at: number;
}

export type GitState =
  | { kind: 'repo'; branch: string | null; detached: boolean; dirty: boolean; commits: Commit[]; remote: string | null }
  | { kind: 'not-a-repo' }
  | { kind: 'skipped'; reason: string };

export interface Project {
  id: string;
  name: string;
  pinned: boolean;
  displayPath: string;
  git: GitState;
}

export type LaunchAction = 'antigravity' | 'claude-code' | 'pair' | 'finder' | 'github';

export type DestinationId =
  | 'overview'
  | 'projects'
  | 'research'
  | 'tasks'
  | 'agent-runs'
  | 'skills'
  | 'knowledge'
  | 'settings';

export interface Destination {
  id: DestinationId;
  label: string;
  description: string;
  implemented: boolean;
}

export type Freshness = 'live' | 'cached' | 'stale' | 'unavailable';

/** The card-state switcher borrowed from the design prototype. */
export type CardStateOverride = 'live' | 'stale' | 'empty' | 'permission-required' | 'failure';

export type ConnectionStatus = 'live' | 'disconnected' | 'connecting';
export type ReconnectMode = 'replay' | 'resync';

/** Everything the service streams to the dashboard is a change to this. */
export interface DashState {
  sessions: Session[];
  approvals: Approval[];
  tasks: Task[];
  notes: VaultNote[];
}

export type EventBody =
  | { type: 'session.upserted'; runId: string; patch: Partial<Session>; create?: Session }
  | { type: 'approval.upserted'; proposalId: string; patch: Partial<Approval>; create?: Approval; historyEvent?: string }
  | { type: 'note.written'; note: VaultNote }
  | { type: 'task.upserted'; taskId: string; patch: Partial<Task> }
  | { type: 'tasks.changed' }
  | { type: 'service.heartbeat' };

export type StreamEvent = EventBody & { id: number; at: number };

export interface LogEntry {
  key: string;
  at: number;
  /** Event id, or null for client-side markers such as `stream.resync`. */
  id: number | null;
  type: string;
  detail: string;
  tone: 'live' | 'replayed' | 'missed' | 'marker';
}

export interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warning';
}
