import { attemptsById, frames } from './data';
import type { Frame, Phase, RunStatus, TokenCount } from './types';

export interface CheckState {
  pass: number;
  exit_code: number;
  passed: boolean;
  frameIndex: number;
}

export interface PhaseVisit {
  phase: Phase;
  /** Set for review visits once the verdict is in. */
  outcome?: 'passed' | 'rejected';
}

export interface ReplayState {
  /** Index of the last applied frame. */
  index: number;
  t: number;
  runStatus: RunStatus;
  runLabel: string | null;
  phase: Phase | null;
  path: PhaseVisit[];
  workspace: Extract<Frame, { type: 'workspace' }> | null;
  planVisible: boolean;
  planFrozen: boolean;
  completedTasks: ReadonlySet<string>;
  startedAttempts: string[];
  endedAttempts: ReadonlySet<string>;
  /** Task currently being implemented, if any. */
  activeTask: string | null;
  codingAttempts: number;
  tokens: TokenCount;
  /** Evidence for the current verification pass, keyed by check id. */
  checks: ReadonlyMap<string, CheckState>;
  /** 0 before any verify pass. */
  verifyPass: number;
  evidenceClearedCount: number;
  reviews: { passed: boolean; findings: string[]; frameIndex: number }[];
  reviewRunning: boolean;
  judgeRunning: boolean;
  judgeDone: boolean;
  events: { t: number; message: string; frameIndex: number }[];
  checkpoints: { message: string; sha: string | null; frameIndex: number }[];
  artifacts: string[] | null;
  completed: boolean;
}

/** Fold the first `count` frames into dashboard state. */
export function deriveState(count: number): ReplayState {
  const n = Math.min(Math.max(count, 1), frames.length);
  const s: ReplayState = {
    index: n - 1,
    t: frames[n - 1].t,
    runStatus: 'queued',
    runLabel: null,
    phase: null,
    path: [],
    workspace: null,
    planVisible: false,
    planFrozen: false,
    completedTasks: new Set(),
    startedAttempts: [],
    endedAttempts: new Set(),
    activeTask: null,
    codingAttempts: 0,
    tokens: { input: 0, output: 0 },
    checks: new Map(),
    verifyPass: 0,
    evidenceClearedCount: 0,
    reviews: [],
    reviewRunning: false,
    judgeRunning: false,
    judgeDone: false,
    events: [],
    checkpoints: [],
    artifacts: null,
    completed: false,
  };
  const completed = new Set<string>();
  const ended = new Set<string>();
  let checks = new Map<string, CheckState>();

  for (let i = 0; i < n; i++) {
    const f = frames[i];
    switch (f.type) {
      case 'run_status':
        s.runStatus = f.status;
        s.runLabel = f.label;
        if (f.status === 'completed') s.completed = true;
        break;
      case 'phase':
        s.phase = f.phase;
        s.runStatus = f.status;
        s.path.push({ phase: f.phase });
        break;
      case 'event':
        s.events.push({ t: f.t, message: f.message, frameIndex: i });
        break;
      case 'workspace':
        s.workspace = f;
        break;
      case 'attempt_start': {
        s.startedAttempts.push(f.attempt_id);
        if (f.coding_attempts) s.codingAttempts = f.coding_attempts;
        if (f.task_id) s.activeTask = f.task_id;
        const a = attemptsById.get(f.attempt_id);
        if (a?.phase === 'review') s.reviewRunning = true;
        if (a?.phase === 'judge') s.judgeRunning = true;
        break;
      }
      case 'attempt_end': {
        ended.add(f.attempt_id);
        const a = attemptsById.get(f.attempt_id);
        if (a) {
          s.tokens = {
            input: s.tokens.input + a.tokens.input,
            output: s.tokens.output + a.tokens.output,
          };
          if (a.task_id && s.activeTask === a.task_id) s.activeTask = null;
          if (a.phase === 'review') s.reviewRunning = false;
          if (a.phase === 'judge') s.judgeRunning = false;
        }
        break;
      }
      case 'plan':
        s.planVisible = true;
        break;
      case 'plan_frozen':
        s.planFrozen = true;
        break;
      case 'checkpoint':
        s.checkpoints.push({ message: f.message, sha: f.sha, frameIndex: i });
        break;
      case 'task_completed':
        completed.add(f.task_id);
        break;
      case 'check_result':
        if (f.pass !== s.verifyPass) checks = new Map();
        s.verifyPass = f.pass;
        checks.set(f.check_id, { pass: f.pass, exit_code: f.exit_code, passed: f.passed, frameIndex: i });
        break;
      case 'evidence_cleared':
        checks = new Map();
        s.evidenceClearedCount++;
        break;
      case 'review': {
        s.reviews.push({ passed: f.passed, findings: f.findings, frameIndex: i });
        const last = [...s.path].reverse().find((v) => v.phase === 'review');
        if (last) last.outcome = f.passed ? 'passed' : 'rejected';
        break;
      }
      case 'judge':
        s.judgeDone = true;
        break;
      case 'artifacts':
        s.artifacts = f.names;
        break;
    }
  }
  s.completedTasks = completed;
  s.endedAttempts = ended;
  s.checks = checks;
  return s;
}

/** What the raw-detail dialog shows. */
export interface Detail {
  title: string;
  data: unknown;
  /** When set, the dialog offers to seek the replay to this frame. */
  frameIndex?: number;
}
