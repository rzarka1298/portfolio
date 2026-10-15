import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Check, ChevronRight, Circle, GitBranch, Info, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { attemptsById, frameLabel, frames, replay, RUN_SECONDS, shortSha } from './data';
import type { Detail, ReplayState } from './state';
import { focusRing } from './styles';
import { PHASES, type AgentAttempt, type PlanCheck } from './types';
import { Code, Metric, Panel, StatusBadge, Unavailable } from './ui';

/*
 * Panels mirror the dashboard run page
 * (apps/dashboard/src/app/projects/[id]/runs/[runId]/page.tsx): header with
 * phase chips, four metric tiles, Delivery/Workspace, then a two-column
 * body — Plan & tasks, Acceptance criteria, Activity, Agent attempts on the
 * left; Verification evidence, Independent review, Judge evidence,
 * Artifacts & changes on the right.
 */

type Inspect = (d: Detail) => void;

const fade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

const phaseName = (p: string) => p.replace(/_/g, ' ');

function fmtClock(sec: number): string {
  const s = Math.floor(sec);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function argvText(argv: string[]): string {
  return argv.map((a) => (/[\s'"();]/.test(a) ? `'${a.replace(/'/g, "'\\''")}'` : a)).join(' ');
}

function Placeholder({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

function Running({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-sm text-bp-signal-ink" role="status">
      <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden />
      {label}
    </p>
  );
}

/* ------------------------------ header ------------------------------ */

export function RunHeader({ s }: { s: ReplayState }) {
  const visits = (p: string) => s.path.filter((v) => v.phase === p).length;
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 text-[10px] font-bold tracking-[0.16em] text-bp-line">
            PROJECT RUN
          </div>
          <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{replay.project.name}</h3>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
            {replay.run.id} · recorded {replay.source.recorded}
          </p>
        </div>
        <StatusBadge status={s.runStatus} />
      </div>
      <ol className="flex flex-wrap gap-1.5" aria-label="Run phases">
        {PHASES.map((p, i) => {
          const current = p === s.phase && !s.completed;
          const n = visits(p);
          const done = n > 0 && (!current || s.completed);
          return (
            <li
              key={p}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'border px-2.5 py-0.5 text-[11px] capitalize transition-colors',
                current
                  ? 'border-bp-line bg-bp-line/10 text-bp-line'
                  : done
                    ? 'border-border text-foreground'
                    : 'border-border text-muted-foreground',
              )}
            >
              {done ? '✓ ' : `${i + 1} · `}
              {phaseName(p)}
              {n > 1 ? <span className="ml-1 font-mono text-[10px] opacity-70">×{n}</span> : null}
              <span className="sr-only">{current ? ' (current)' : done ? ' (done)' : ' (not reached)'}</span>
            </li>
          );
        })}
      </ol>
      {s.path.length > 1 ? (
        <div className="overflow-x-auto pb-1">
          <ol className="flex w-max items-center gap-1 text-[10px] text-muted-foreground" aria-label="Phase path so far">
            {s.path.map((v, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 ? <ChevronRight className="h-3 w-3" aria-hidden /> : null}
                <span
                  className={cn(
                    'px-1.5 py-px',
                    v.outcome === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
                    v.outcome === 'passed' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                    v.phase === 'repair' && 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
                  )}
                >
                  {phaseName(v.phase)}
                  {v.outcome === 'rejected' ? ' ✗' : v.outcome === 'passed' ? ' ✓' : ''}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </header>
  );
}

/** Replay-only annotation (not part of the real dashboard). */
export function RepairNote({ s }: { s: ReplayState }) {
  const rejected = s.reviews.find((r) => !r.passed);
  return (
    <AnimatePresence>
      {rejected ? (
        <motion.div
          {...fade}
          role="note"
          className="flex gap-2.5 border border-amber-300 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <strong className="font-semibold">Replay note:</strong> all four frozen checks had passed (exit 0). The
            repair was triggered by the <em>independent read-only review</em>, which could not reproduce the CLI test
            because <code className="font-mono">tempfile.TemporaryDirectory()</code> fails in its sandbox. No check
            failed in this run.
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Metrics({ s, clock }: { s: ReplayState; clock: number }) {
  const total = s.tokens.input + s.tokens.output;
  return (
    <dl className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
      <Metric
        label="Tasks completed"
        value={`${s.completedTasks.size} / ${s.planVisible ? replay.plan.tasks.length : '—'}`}
      />
      <Metric
        label="Coding attempts"
        value={`${s.codingAttempts} / ${replay.run.max_attempts}`}
        sub="limit = API default"
      />
      <Metric
        label="Active time"
        value={`${fmtClock(clock)}`}
        sub={`of ${Math.floor(replay.run.max_duration_seconds / 60)} min limit`}
      />
      <Metric
        label="Reported tokens"
        value={total.toLocaleString('en-US')}
        sub={
          <>
            in {s.tokens.input.toLocaleString('en-US')} · out {s.tokens.output.toLocaleString('en-US')} · cost{' '}
            <span className="italic">not recorded</span>
          </>
        }
      />
    </dl>
  );
}

/* ----------------------------- workspace ----------------------------- */

export function WorkspacePanel({ s, onInspect }: { s: ReplayState; onInspect: Inspect }) {
  if (!s.workspace) return null;
  const head = [...s.checkpoints].reverse().find((c) => c.sha);
  const fs = replay.final_snapshot;
  return (
    <Panel
      title={s.completed ? 'Delivery' : 'Workspace'}
      hint={s.completed ? 'Verified branch delivered locally — no pull request was requested.' : undefined}
      right={s.completed ? <StatusBadge status="completed" label="delivered" /> : null}
    >
      <dl className="space-y-1.5 text-xs">
        <Row label="Branch">
          <span className="inline-flex items-center gap-1 break-all font-mono">
            <GitBranch className="h-3 w-3 shrink-0" aria-hidden />
            {s.workspace.branch}
          </span>
        </Row>
        <Row label="Worktree">
          <span className="break-all font-mono">{fs.workspace_path}</span>
        </Row>
        <Row label="Base">
          <span className="break-all font-mono">{shortSha(s.workspace.base_commit)}</span>{' '}
          <span className="text-muted-foreground">({s.workspace.base_kind})</span>
        </Row>
        <Row label="Commit">
          {head ? (
            <span className="break-all font-mono">{head.sha}</span>
          ) : s.checkpoints.length ? (
            <Unavailable>checkpoint SHA not retained</Unavailable>
          ) : (
            <span className="text-muted-foreground">no checkpoint yet</span>
          )}
        </Row>
      </dl>
      {s.checkpoints.length ? (
        <ol className="mt-3 space-y-1 border-t pt-3 text-xs">
          <AnimatePresence initial={false}>
            {s.checkpoints.map((c) => (
              <motion.li key={c.frameIndex} {...fade}>
                <button
                  type="button"
                  onClick={() => onInspect({ title: 'Checkpoint frame', data: frames[c.frameIndex], frameIndex: c.frameIndex })}
                  className={cn('flex w-full flex-wrap items-center gap-x-2 gap-y-0.5 text-left hover:bg-muted/60', focusRing)}
                >
                  {c.sha ? (
                    <span className="font-mono text-bp-line">{shortSha(c.sha, 7)}</span>
                  ) : (
                    <Unavailable>sha n/a</Unavailable>
                  )}
                  <span className="min-w-0 break-words">{c.message}</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      ) : null}
      {s.completed ? (
        <details className="mt-3 text-xs">
          <summary className={cn('cursor-pointer font-medium', focusRing)}>Delivery summary</summary>
          <p className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{fs.summary}</p>
        </details>
      ) : null}
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-x-2">
      <dt className="w-16 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}

/* ------------------------------- plan -------------------------------- */

export function PlanPanel({ s }: { s: ReplayState }) {
  const plan = replay.plan;
  if (!s.planVisible) {
    return (
      <Panel title="Plan & tasks">
        {s.phase === 'plan' ? (
          <Running label="Planner is inspecting the repository and brief (read-only)…" />
        ) : (
          <Placeholder>The plan will appear after the agent inspects your repository and brief.</Placeholder>
        )}
      </Panel>
    );
  }
  return (
    <Panel
      title="Plan & tasks"
      hint={plan.summary}
      right={
        s.planFrozen ? (
          <StatusBadge status="completed" label="frozen" />
        ) : (
          <StatusBadge status="planning" label="in plan review" />
        )
      }
    >
      <ol className="space-y-2">
        {plan.tasks.map((task) => {
          const done = s.completedTasks.has(task.id);
          const active = s.activeTask === task.id;
          return (
            <li key={task.id} className="border p-3">
              <div className="flex items-start gap-2">
                <span className="mt-0.5" aria-hidden>
                  {done ? (
                    <Check className="h-4 w-4 text-bp-line" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 text-bp-signal-ink motion-safe:animate-spin" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-medium">{task.title}</h4>
                    <span className="sr-only">{done ? 'Completed' : active ? 'In progress' : 'Pending'}</span>
                    {active ? <StatusBadge status="executing" /> : null}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {task.id} · {task.requirement_ids.join(', ')}
                    {task.depends_on.length ? ` · after ${task.depends_on.join(', ')}` : ''}
                  </p>
                  <details className="mt-1.5 text-xs">
                    <summary className={cn('cursor-pointer text-muted-foreground', focusRing)}>Instructions</summary>
                    <p className="mt-1.5 leading-relaxed">{task.instructions}</p>
                  </details>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <details className="mt-3 text-xs">
        <summary className={cn('cursor-pointer font-medium', focusRing)}>
          Planning assumptions ({plan.assumptions.length})
        </summary>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-relaxed">
          {plan.assumptions.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

export function CriteriaPanel({ s }: { s: ReplayState }) {
  if (!s.planVisible) return null;
  const verdicts = new Map(replay.judge.requirement_verdicts.map((v) => [v.requirement_id, v]));
  return (
    <Panel title="Acceptance criteria" hint="Requirements are connected to checks and their recorded results.">
      <ul className="space-y-3">
        {replay.plan.requirements.map((r) => {
          const checks = replay.plan.checks.filter((c) => c.requirement_ids.includes(r.id));
          const verdict = s.judgeDone ? verdicts.get(r.id) : undefined;
          return (
            <li key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 text-sm leading-snug">
                  <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">{r.id}</span>
                  {r.description}
                </p>
                {verdict ? <StatusBadge status={verdict.passed ? 'passed' : 'failed'} label="judge" /> : null}
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                Checks:
                {checks.map((c) => {
                  const st = s.checks.get(c.id);
                  return (
                    <span
                      key={c.id}
                      className={cn(
                        'px-1.5 font-mono',
                        st
                          ? st.passed
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-muted',
                      )}
                    >
                      {c.id}
                      {st ? (st.passed ? ' ✓' : ' ✗') : ''}
                    </span>
                  );
                })}
              </p>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ------------------------------ activity ------------------------------ */

export function ActivityPanel({ s, onInspect }: { s: ReplayState; onInspect: Inspect }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [s.events.length]);
  return (
    <Panel title="Activity" hint="Persistent events from the runner. Select one for its raw frame.">
      {s.events.length ? (
        <ol ref={ref} className="max-h-80 space-y-2 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {s.events.map((e) => (
              <motion.li key={e.frameIndex} {...fade}>
                <button
                  type="button"
                  onClick={() => onInspect({ title: 'Event frame', data: frames[e.frameIndex], frameIndex: e.frameIndex })}
                  className={cn(
                    'block w-full border-l-2 border-bp-line/40 py-0.5 pl-3 text-left hover:bg-muted/60',
                    focusRing,
                  )}
                >
                  <span className="block text-xs leading-relaxed">{e.message}</span>
                  <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">t+{e.t}s</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      ) : (
        <Placeholder>Waiting for the first runner event…</Placeholder>
      )}
    </Panel>
  );
}

/* ------------------------------ attempts ------------------------------ */

function attemptName(a: AgentAttempt): string {
  return `${phaseName(a.phase)}${a.task_id ? ` ${a.task_id}` : ''}`;
}

export function AttemptsPanel({ s, clock, onInspect }: { s: ReplayState; clock: number; onInspect: Inspect }) {
  const started = s.startedAttempts.map((id) => attemptsById.get(id)).filter((a): a is AgentAttempt => !!a);
  const pct = (t: number) => `${(Math.min(t, RUN_SECONDS) / RUN_SECONDS) * 100}%`;
  return (
    <Panel
      title="Agent attempts"
      hint="Each attempt is a separate agent session. Select one for its recorded result."
      right={
        <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-3 bg-bp-line-soft" aria-hidden /> read-only
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-3 bg-bp-line/100" aria-hidden /> workspace-write
          </span>
        </div>
      }
    >
      {started.length ? (
        <ol className="space-y-1.5">
          <AnimatePresence initial={false}>
            {started.map((a) => {
              const ended = s.endedAttempts.has(a.id);
              const end = ended ? a.ended_t : Math.max(a.started_t, Math.min(clock, a.ended_t));
              const write = a.sandbox.startsWith('workspace-write');
              return (
                <motion.li key={a.id} {...fade}>
                  <button
                    type="button"
                    onClick={() => onInspect({ title: `Attempt · ${attemptName(a)}`, data: a })}
                    className={cn('grid w-full grid-cols-[5.5rem_1fr] items-center gap-2 text-left hover:bg-muted/60 sm:grid-cols-[7rem_1fr_5rem]', focusRing)}
                    aria-label={`${attemptName(a)}, ${ended ? 'completed' : 'running'}, t+${a.started_t}s${ended ? ` to t+${a.ended_t}s, ${(a.tokens.input + a.tokens.output).toLocaleString('en-US')} tokens` : ''}`}
                  >
                    <span className="truncate text-xs capitalize">
                      {!ended ? <Loader2 className="mr-1 inline h-3 w-3 motion-safe:animate-spin" aria-hidden /> : null}
                      {attemptName(a)}
                    </span>
                    <span className="relative h-4 bg-muted/60" aria-hidden>
                      <span
                        className={cn('absolute inset-y-0 ', write ? 'bg-bp-line/100' : 'bg-bp-line-soft')}
                        style={{ left: pct(a.started_t), width: `max(3px, calc(${pct(end)} - ${pct(a.started_t)}))` }}
                      />
                      <span className="absolute inset-y-[-2px] w-px bg-foreground/50" style={{ left: pct(clock) }} />
                    </span>
                    <span className="hidden text-right font-mono text-[10px] text-muted-foreground sm:block">
                      {ended ? `${((a.tokens.input + a.tokens.output) / 1000).toFixed(1)}k tok` : 'running'}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
          <li aria-hidden className="grid grid-cols-[5.5rem_1fr] gap-2 sm:grid-cols-[7rem_1fr_5rem]">
            <span />
            <span className="relative h-3 font-mono text-[9px] text-muted-foreground">
              {[0, 60, 120, 180, 240].map((t) => (
                <span key={t} className="absolute -translate-x-1/2 first:translate-x-0" style={{ left: pct(t) }}>
                  {t}s
                </span>
              ))}
            </span>
          </li>
        </ol>
      ) : (
        <Placeholder>No agent sessions yet.</Placeholder>
      )}
    </Panel>
  );
}

/* ----------------------------- evidence ------------------------------ */

export function EvidencePanel({ s, onInspect }: { s: ReplayState; onInspect: Inspect }) {
  const pass = replay.verification_passes.find((p) => p.pass === s.verifyPass);
  const cleared = s.evidenceClearedCount > 0 && s.checks.size === 0;
  const verifying = s.phase === 'verify' && !s.completed;
  const history = replay.verification_passes.filter(
    (p) => p.pass < s.verifyPass || (p.pass === s.verifyPass && s.checks.size === p.evidence.length) || (cleared && p.pass <= s.verifyPass),
  );
  return (
    <Panel title="Verification evidence" hint="Command results are tied to the commit that was checked.">
      {history.length ? (
        <ul className="mb-3 flex flex-wrap gap-1.5 text-[11px]">
          {history.map((p) => (
            <li key={p.pass} className="border px-2 py-0.5">
              Pass {p.pass}: {p.evidence.filter((e) => e.passed).length}/{p.evidence.length} passed ·{' '}
              {p.commit ? <span className="font-mono">{shortSha(p.commit, 7)}</span> : <span className="italic text-muted-foreground">commit not retained</span>}
            </li>
          ))}
        </ul>
      ) : null}
      {cleared ? (
        <p className="mb-3 text-xs text-muted-foreground" role="status">
          Evidence cleared after repair — every frozen check re-runs against the new commit.
        </p>
      ) : null}
      {s.planFrozen ? (
        <div className="space-y-2">
          {replay.plan.checks.map((c) => (
            <CheckRow key={c.id} check={c} s={s} verifying={verifying} onInspect={onInspect} />
          ))}
          {pass && s.checks.size ? (
            <p className="text-[11px] text-muted-foreground">Trigger: {pass.trigger}</p>
          ) : null}
        </div>
      ) : (
        <Placeholder>Checks are defined by the plan and frozen before implementation starts.</Placeholder>
      )}
    </Panel>
  );
}

function CheckRow({ check, s, verifying, onInspect }: { check: PlanCheck; s: ReplayState; verifying: boolean; onInspect: Inspect }) {
  const st = s.checks.get(check.id);
  const ev = st ? replay.verification_passes.find((p) => p.pass === st.pass)?.evidence.find((e) => e.check_id === check.id) : undefined;
  return (
    <details className="group border p-3">
      <summary className={cn('flex cursor-pointer list-none items-center justify-between gap-2 text-sm', focusRing)}>
        <span className="flex min-w-0 items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" aria-hidden />
          <span className="font-mono text-xs">{check.id}</span>
          <span className="truncate text-xs text-muted-foreground">{check.description}</span>
        </span>
        {st ? (
          <StatusBadge status={st.passed ? 'completed' : 'failed'} label={st.passed ? 'passed' : 'failed'} />
        ) : (
          <StatusBadge status={verifying ? 'verifying' : 'pending'} label={verifying ? 'running' : 'pending'} />
        )}
      </summary>
      <div className="mt-2 space-y-2">
        <p className="text-xs leading-relaxed">{check.description}</p>
        {ev ? (
          <p className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
            exit {ev.exit_code} · pass {st?.pass} · commit{' '}
            {ev.commit ? shortSha(ev.commit) : <Unavailable>not retained</Unavailable>}
            <button
              type="button"
              onClick={() => onInspect({ title: `Evidence · ${check.id} (pass ${st?.pass})`, data: ev, frameIndex: st?.frameIndex })}
              className={cn('ml-auto px-1 font-sans text-bp-line underline underline-offset-2', focusRing)}
            >
              raw
            </button>
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Not run in the current pass yet · timeout {check.timeout_seconds}s</p>
        )}
        <Code>
          $ {argvText(check.argv)}
          {ev ? `\n\n${ev.output || 'No output recorded (this check prints nothing on success).'}` : ''}
        </Code>
      </div>
    </details>
  );
}

/* ------------------------------ review ------------------------------- */

export function ReviewPanel({ s, onInspect }: { s: ReplayState; onInspect: Inspect }) {
  return (
    <Panel
      title="Independent review"
      hint="A read-only agent re-checks the work before the judge."
      right={s.reviews.length ? <StatusBadge status={s.reviews[s.reviews.length - 1].passed ? 'passed' : 'rejected'} /> : null}
    >
      {s.reviews.length ? (
        <ol className="space-y-2">
          <AnimatePresence initial={false}>
            {s.reviews.map((r, i) => (
              <motion.li key={r.frameIndex} {...fade}>
                <button
                  type="button"
                  onClick={() => onInspect({ title: `Review #${i + 1}`, data: { frame: frames[r.frameIndex], record: replay.reviews[i] }, frameIndex: r.frameIndex })}
                  className={cn(
                    'w-full border p-3 text-left hover:bg-muted/60',
                    !r.passed && 'border-red-300 dark:border-red-900',
                    focusRing,
                  )}
                >
                  <span className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-medium">
                      Review #{i + 1} · t+{frames[r.frameIndex].t}s
                    </span>
                    <StatusBadge status={r.passed ? 'passed' : 'rejected'} />
                  </span>
                  {r.findings.length ? (
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed">
                      {r.findings.map((f, j) => (
                        <li key={j}>{f}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="mt-2 block text-xs text-muted-foreground">No findings reported.</span>
                  )}
                  {replay.reviews[i] ? (
                    <span className="mt-1.5 block font-mono text-[10px] text-muted-foreground">{replay.reviews[i].outcome}</span>
                  ) : null}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      ) : null}
      {s.reviewRunning ? (
        <div className={s.reviews.length ? 'mt-3' : ''}>
          <Running label="Reviewer is checking the work in a read-only sandbox…" />
        </div>
      ) : !s.reviews.length ? (
        <Placeholder>Runs after every acceptance check passes.</Placeholder>
      ) : null}
    </Panel>
  );
}

/* ------------------------------- judge ------------------------------- */

export function JudgePanel({ s }: { s: ReplayState }) {
  const j = replay.judge;
  return (
    <Panel
      title="Judge evidence"
      hint="The judge evaluates each requirement against the verified commit."
      right={s.judgeDone ? <StatusBadge status={j.passed ? 'completed' : 'failed'} label={j.passed ? 'passed' : 'failed'} /> : null}
    >
      {s.judgeDone ? (
        <>
          <p className="text-xs text-muted-foreground">
            {j.provider} · model “{j.model}”
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">Commit {j.commit}</p>
          <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Requirement verdicts · {j.requirement_verdicts.filter((v) => v.passed).length}/{j.requirement_verdicts.length}
          </h4>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <AnimatePresence>
              {j.requirement_verdicts.map((v, i) => (
                <motion.li key={v.requirement_id} {...fade} transition={{ duration: 0.25, delay: i * 0.06 }} className="border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs">{v.requirement_id}</span>
                    <StatusBadge status={v.passed ? 'completed' : 'failed'} label={v.passed ? 'passed' : 'failed'} />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{v.reason}</p>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
          <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Findings</h4>
          <p className="mt-1 text-xs text-muted-foreground">{j.findings.length ? j.findings.join(' ') : 'No findings.'}</p>
        </>
      ) : s.judgeRunning ? (
        <Running label="Judge is evaluating each requirement…" />
      ) : (
        <Placeholder>Runs after the independent review passes.</Placeholder>
      )}
    </Panel>
  );
}

/* ----------------------------- artifacts ----------------------------- */

const NOT_RETAINED = new Set(['changes.diff']);

export function ArtifactsPanel({ s }: { s: ReplayState }) {
  const d = replay.diff_summary;
  const repairDone = s.checkpoints.some((c) => c.sha);
  if (!s.artifacts && !repairDone) {
    return (
      <Panel title="Artifacts & changes" hint="Inspect the recorded output, diff, and handoff notes.">
        <Placeholder>Artifacts will appear as work is saved.</Placeholder>
      </Panel>
    );
  }
  return (
    <Panel title="Artifacts & changes" hint="Inspect the recorded output, diff, and handoff notes.">
      {s.artifacts ? (
        <div className="mb-3 space-y-2">
          {replay.final_snapshot.artifacts
            .filter((a) => s.artifacts?.includes(a.name))
            .map((a) => (
              <details key={a.name} className="border p-3">
                <summary className={cn('flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-medium', focusRing)}>
                  <span className="break-all">{a.name}</span>
                  {NOT_RETAINED.has(a.name) ? <Unavailable>content not retained</Unavailable> : (
                    <span className="font-mono text-[10px] font-normal text-muted-foreground">{a.media_type}</span>
                  )}
                </summary>
                <div className="mt-2">
                  {NOT_RETAINED.has(a.name) ? (
                    <p className="flex gap-1.5 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                      The full diff was not kept with the recording (the temporary source repo is gone). The file list and the
                      real repair excerpt are shown below instead.
                    </p>
                  ) : (
                    <Code>{a.content}</Code>
                  )}
                </div>
              </details>
            ))}
        </div>
      ) : null}
      {repairDone ? (
        <>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Repair excerpt · test_inventory.py</h4>
          <Code className="mt-1.5">
            {d.repair_excerpt.split('\n').map((line, i) => (
              <span key={i} className={line.startsWith('+') ? 'text-emerald-700 dark:text-emerald-400' : undefined}>
                {line}
                {'\n'}
              </span>
            ))}
          </Code>
        </>
      ) : null}
      {s.completed ? (
        <>
          <h4 className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Files · {shortSha(d.base_commit, 7)}..{shortSha(d.head_commit, 7)}
          </h4>
          <ul className="mt-1.5 divide-y border text-xs">
            {d.files.map((f) => (
              <li key={f.path} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-3 py-1.5">
                <span className="break-all font-mono">{f.path}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400">+{f.lines_added}</span>
                <span className="w-full text-[10px] text-muted-foreground">{f.origin}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Panel>
  );
}

/* ----------------------------- frame log ----------------------------- */

export function FrameLog({ s, onInspect }: { s: ReplayState; onInspect: Inspect }) {
  const ref = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const list = ref.current;
    const row = list?.children[s.index] as HTMLElement | undefined;
    if (list && row) {
      const top = row.offsetTop; // the list is position:relative, so this is list-relative
      if (top < list.scrollTop || top > list.scrollTop + list.clientHeight - row.offsetHeight) {
        list.scrollTop = top - list.clientHeight / 2;
      }
    }
  }, [s.index]);
  return (
    <Panel
      title={`Replay frames · ${s.index + 1} / ${frames.length}`}
      hint="Every recorded frame. Select one to see its raw JSON and seek the replay there."
    >
      <ol ref={ref} className="relative max-h-64 overflow-y-auto border text-[11px]">
        {frames.map((f, i) => (
          <li key={i}>
            <button
              type="button"
              aria-current={i === s.index ? 'step' : undefined}
              onClick={() => onInspect({ title: `Frame ${i + 1} · ${f.type}`, data: f, frameIndex: i })}
              className={cn(
                'grid w-full grid-cols-[2.5rem_6.5rem_1fr] gap-2 px-2 py-1 text-left hover:bg-muted/60',
                i > s.index && 'opacity-45',
                i === s.index && 'bg-bp-line/10',
                focusRing,
              )}
            >
              <span className="font-mono text-muted-foreground">{f.t}s</span>
              <span className="truncate font-mono">{f.type}</span>
              <span className="truncate">{frameLabel(f)}</span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
