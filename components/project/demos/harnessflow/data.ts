import raw from './replay.json';
import type { AgentAttempt, Frame, FrameType, Replay } from './types';

/*
 * Provenance (from the build notes, kept short):
 * - Real run fcd68133…, recorded 2026-10-10, fixture PRD
 *   `Project-Documentation/projects/fixtures/inventory-prd.md` against an
 *   empty `git init` repo. Paths and the username were scrubbed.
 * - Times are seconds from worktree creation (file mtimes, ±1 s).
 * - All four frozen checks passed in BOTH verify passes. The repair was
 *   triggered by the independent read-only review (it could not create a
 *   TemporaryDirectory in its sandbox), not by a failing check.
 * - Not retained: intermediate checkpoint SHAs, the pass-1 commit, the full
 *   `changes.diff`, cost. Limits are API defaults (30 / 14400 s).
 */

const FRAME_TYPES: ReadonlySet<FrameType> = new Set<FrameType>([
  'run_status',
  'phase',
  'event',
  'workspace',
  'attempt_start',
  'attempt_end',
  'plan',
  'plan_frozen',
  'checkpoint',
  'task_completed',
  'check_result',
  'evidence_cleared',
  'review',
  'judge',
  'artifacts',
]);

function load(value: unknown): Replay {
  const r = value as Replay;
  if (r.schema !== 'harnessflow-replay/v1') {
    throw new Error(`Unexpected replay schema: ${String(r.schema)}`);
  }
  for (const f of r.frames) {
    if (!FRAME_TYPES.has(f.type)) throw new Error(`Unknown replay frame type: ${String(f.type)}`);
  }
  return r;
}

export const replay: Replay = load(raw);

export const frames: readonly Frame[] = replay.frames;

export const attemptsById: ReadonlyMap<string, AgentAttempt> = new Map(
  replay.agent_attempts.map((a) => [a.id, a]),
);

/** Run length in seconds (264). */
export const RUN_SECONDS = replay.run.duration_seconds;

/**
 * Virtual playback timeline. Many frames share a timestamp, so each frame
 * gets at least MIN_GAP run-seconds of screen time; long agent sessions
 * still play proportionally. `vt[i]` is when frame i is applied.
 */
const MIN_GAP = 2;
export const vt: readonly number[] = frames.reduce<number[]>((acc, f, i) => {
  acc.push(i === 0 ? 0 : acc[i - 1] + Math.max(f.t - frames[i - 1].t, MIN_GAP));
  return acc;
}, []);
export const V_TOTAL = vt[vt.length - 1];

/** Number of frames applied at virtual time v (always >= 1). */
export function framesAt(v: number): number {
  let n = 0;
  while (n < vt.length && vt[n] <= v + 1e-9) n++;
  return Math.max(1, n);
}

/** Run clock (seconds) at virtual time v, interpolated between frames. */
export function runClockAt(v: number): number {
  const n = framesAt(v);
  if (n >= frames.length) return frames[frames.length - 1].t;
  const i = n - 1;
  const span = vt[i + 1] - vt[i];
  const frac = span > 0 ? (v - vt[i]) / span : 0;
  return frames[i].t + (frames[i + 1].t - frames[i].t) * Math.min(1, Math.max(0, frac));
}

export function shortSha(sha: string | null | undefined, n = 12): string | null {
  return sha ? sha.slice(0, n) : null;
}

/** One-line label for a frame in the frame log. */
export function frameLabel(f: Frame): string {
  switch (f.type) {
    case 'run_status':
      return `Run ${f.status}: ${f.label}`;
    case 'phase':
      return `Phase → ${f.phase.replace('_', ' ')} (${f.status})`;
    case 'event':
      return f.message;
    case 'workspace':
      return `Worktree on ${f.branch}`;
    case 'attempt_start': {
      const a = attemptsById.get(f.attempt_id);
      return `Start ${a?.phase.replace('_', ' ') ?? 'attempt'}${f.task_id ? ` ${f.task_id}` : ''}${
        f.coding_attempts ? ` · coding attempt ${f.coding_attempts}` : ''
      }`;
    }
    case 'attempt_end': {
      const a = attemptsById.get(f.attempt_id);
      return `End ${a?.phase.replace('_', ' ') ?? 'attempt'}${a?.task_id ? ` ${a.task_id}` : ''}`;
    }
    case 'plan':
      return 'Plan recorded';
    case 'plan_frozen':
      return 'Plan & checks frozen';
    case 'checkpoint':
      return `Checkpoint: ${f.message}`;
    case 'task_completed':
      return `Task ${f.task_id} completed`;
    case 'check_result':
      return `Pass ${f.pass} · ${f.check_id} exit ${f.exit_code}`;
    case 'evidence_cleared':
      return 'Evidence cleared for re-verification';
    case 'review':
      return `Review ${f.passed ? 'passed' : 'rejected'}`;
    case 'judge':
      return `Judge ${f.passed ? 'passed' : 'failed'}`;
    case 'artifacts':
      return `Artifacts: ${f.names.join(', ')}`;
  }
}
