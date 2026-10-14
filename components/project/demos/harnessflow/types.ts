/**
 * Types for `replay.json` (schema `harnessflow-replay/v1`).
 *
 * The file is built from a REAL, scrubbed HarnessFlow run
 * (fcd68133-d769-4e59-a026-7cbd826d8640, recorded 2026-10-10). Fields typed
 * `| null` are values the run did not retain (intermediate checkpoint SHAs,
 * the verify-pass-1 commit, cost); the UI must render them as unavailable,
 * never invent them. `final_snapshot` mirrors the dashboard's
 * `ProjectSnapshot` (apps/dashboard/src/lib/project-snapshot.ts).
 */

export const PHASES = [
  'prepare',
  'plan',
  'plan_review',
  'implement',
  'verify',
  'review',
  'judge',
  'repair',
  'deliver',
] as const;

export type Phase = (typeof PHASES)[number];

/** Run / attempt status strings as the engine emits them. */
export type RunStatus =
  | 'queued'
  | 'running'
  | 'planning'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'paused'
  | 'blocked'
  | 'exhausted';

export interface Requirement {
  id: string;
  description: string;
}

export interface PlanTask {
  id: string;
  title: string;
  instructions: string;
  requirement_ids: string[];
  depends_on: string[];
}

export interface PlanCheck {
  id: string;
  description: string;
  requirement_ids: string[];
  argv: string[];
  timeout_seconds: number;
}

export interface Plan {
  summary: string;
  assumptions: string[];
  requirements: Requirement[];
  tasks: PlanTask[];
  checks: PlanCheck[];
  clarification: string;
}

export interface TokenCount {
  input: number;
  output: number;
}

/** Planner result as retained: counts only (the full plan lives in `plan`). */
export interface PlannerResult {
  summary: string;
  requirements: number;
  tasks: number;
  checks: number;
}

export interface CodingResult {
  summary: string;
  blocked_reason: string;
}

export interface ReviewResult {
  passed: boolean;
  findings: string[];
}

export interface RequirementVerdict {
  requirement_id: string;
  passed: boolean;
  reason: string;
}

export interface JudgeResult extends ReviewResult {
  requirement_verdicts: RequirementVerdict[];
}

export type AttemptResult = PlannerResult | CodingResult | ReviewResult | JudgeResult;

export interface AgentAttempt {
  id: string;
  phase: Phase;
  task_id: string | null;
  status: RunStatus;
  /** Seconds from worktree creation (±1 s). */
  started_t: number;
  ended_t: number;
  sandbox: string;
  coding_attempt: boolean;
  tokens: TokenCount;
  result: AttemptResult;
}

export interface Evidence {
  check_id: string;
  requirement_ids: string[];
  argv: string[];
  exit_code: number;
  passed: boolean;
  /** null = the checkpoint SHA was not retained for this pass. */
  commit: string | null;
  output: string;
  t: number;
}

export interface VerificationPass {
  pass: number;
  t: number;
  commit: string | null;
  commit_note?: string;
  trigger: string;
  evidence: Evidence[];
}

export interface ReviewRecord {
  t: number;
  attempt_id: string;
  passed: boolean;
  findings: string[];
  outcome: string;
}

export interface Judge extends JudgeResult {
  provider: string;
  model: string;
  commit: string;
}

export interface DiffFile {
  path: string;
  change: string;
  lines_added: number;
  origin: string;
}

export interface DiffSummary {
  base_commit: string;
  head_commit: string;
  files: DiffFile[];
  commits: { message: string; sha: string | null }[];
  repair_excerpt: string;
}

/* ----------------------------- frames ----------------------------- */

interface FrameBase {
  t: number;
}

export type Frame = FrameBase &
  (
    | { type: 'run_status'; status: RunStatus; label: string }
    | { type: 'phase'; phase: Phase; status: RunStatus }
    | { type: 'event'; message: string }
    | { type: 'workspace'; branch: string; base_commit: string; base_kind: string }
    | { type: 'attempt_start'; attempt_id: string; task_id?: string; coding_attempts?: number }
    | { type: 'attempt_end'; attempt_id: string }
    | { type: 'plan'; plan_ref: 'plan' }
    | { type: 'plan_frozen' }
    | { type: 'checkpoint'; message: string; sha: string | null }
    | { type: 'task_completed'; task_id: string }
    | { type: 'check_result'; pass: number; check_id: string; exit_code: number; passed: boolean }
    | { type: 'evidence_cleared' }
    | { type: 'review'; passed: boolean; findings: string[] }
    | { type: 'judge'; passed: boolean }
    | { type: 'artifacts'; names: string[] }
  );

export type FrameType = Frame['type'];

export interface Artifact {
  name: string;
  media_type: string;
  content: string;
}

export interface FinalSnapshot {
  phase: Phase;
  branch: string;
  workspace_path: string;
  base_commit: string;
  head_commit: string;
  plan: Plan;
  completed_task_ids: string[];
  attempts: number;
  max_attempts: number;
  max_duration_seconds: number;
  active_seconds: number;
  evidence: Omit<Evidence, 't'>[];
  review: ReviewResult;
  judge: Judge;
  tokens: TokenCount;
  /** Not recorded for this run. */
  cost_usd: number | null;
  events: { t: number; message: string }[];
  agent_attempts: Pick<AgentAttempt, 'id' | 'phase' | 'status' | 'started_t' | 'ended_t'>[];
  summary: string;
  artifacts: Artifact[];
}

export interface Replay {
  schema: 'harnessflow-replay/v1';
  source: {
    kind: 'real';
    run_id: string;
    recorded: string;
    entry_point: string;
    public_reference: string;
    timing: string;
    limits_note: string;
  };
  project: { name: string; repository_path: string; prd: string };
  run: {
    id: string;
    final_status: RunStatus;
    reason: string;
    duration_seconds: number;
    max_attempts: number;
    max_duration_seconds: number;
    coding_attempts: number;
    request_pr: boolean;
  };
  phases: Phase[];
  plan: Plan;
  agent_attempts: AgentAttempt[];
  verification_passes: VerificationPass[];
  reviews: ReviewRecord[];
  judge: Judge;
  diff_summary: DiffSummary;
  frames: Frame[];
  final_snapshot: FinalSnapshot;
}
