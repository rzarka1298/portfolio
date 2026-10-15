import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, ShieldAlert, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APPROVAL_STATE_DISPLAY } from './data';
import { approvalPayload, clock, countdown, dayAndClock, fingerprint, shortHash } from './format';
import { ACCENT_TEXT, Btn, Chip, DANGER_TEXT, FOCUS, SectionLabel } from './ui';
import type { DecisionResult } from './useCommandCenter';
import type { Approval, ApprovalFilter, ApprovalState } from './types';

function useFingerprint(payload: string | null) {
  const [fp, setFp] = useState<{ algo: string; hex: string } | null>(null);
  useEffect(() => {
    let alive = true;
    setFp(null);
    if (payload !== null) void fingerprint(payload).then((f) => alive && setFp(f));
    return () => {
      alive = false;
    };
  }, [payload]);
  return fp;
}

function StateBadge({ state }: { state: ApprovalState }) {
  const d = APPROVAL_STATE_DISPLAY[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap text-xs',
        state === 'pending' && cn('font-semibold', ACCENT_TEXT),
        state === 'executed' && 'text-emerald-700 dark:text-emerald-400',
        (state === 'denied' || state === 'expired' || state === 'failed') && 'text-muted-foreground',
      )}
    >
      <span aria-hidden className={cn(state === 'executing' && 'inline-block motion-safe:animate-spin')}>
        {d.glyph}
      </span>
      {d.label}
    </span>
  );
}

type Outcome =
  | { kind: 'none' }
  | { kind: 'checking' }
  | { kind: 'changed'; reviewed: string; current: string }
  | { kind: 'used' }
  | { kind: 'matched'; hash: string; decision: 'approve' | 'deny' };

export function ApprovalsView({
  approvals,
  now,
  live,
  selected,
  onSelect,
  decide,
  tamper,
  skipTo,
  onOpenRun,
}: {
  approvals: Approval[];
  now: number;
  live: boolean;
  selected: string | null;
  onSelect: (id: string) => void;
  decide: (id: string, d: 'approve' | 'deny', reviewed: string) => Promise<DecisionResult>;
  tamper: (id: string) => void;
  skipTo: (t: number) => void;
  onOpenRun: (runId: string) => void;
}) {
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const counts: Record<ApprovalFilter, number> = { pending: 0, decided: 0, expired: 0 };
  for (const a of approvals) counts[APPROVAL_STATE_DISPLAY[a.state].filter]++;
  const shown = approvals.filter((a) => APPROVAL_STATE_DISPLAY[a.state].filter === filter);
  const sel = approvals.find((a) => a.proposalId === selected) ?? null;

  // What you looked at: captured when you open a request, and only refreshed
  // when you explicitly review it again.
  const [reviewed, setReviewed] = useState<{ id: string; payload: string } | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'none' });
  const selRef = useRef(sel);
  selRef.current = sel;
  useEffect(() => {
    // Only when the selection changes, not when the request's content does.
    const current = selRef.current;
    setOutcome({ kind: 'none' });
    setReviewed(current ? { id: current.proposalId, payload: approvalPayload(current) } : null);
  }, [selected]);

  const reviewedPayload = reviewed && sel && reviewed.id === sel.proposalId ? reviewed.payload : null;
  const reviewedFp = useFingerprint(reviewedPayload);
  const currentFp = useFingerprint(sel ? approvalPayload(sel) : null);
  const matches = reviewedFp && currentFp ? reviewedFp.hex === currentFp.hex : null;

  async function onDecide(d: 'approve' | 'deny') {
    if (!sel || reviewedPayload === null) return;
    setOutcome({ kind: 'checking' });
    const r = await decide(sel.proposalId, d, reviewedPayload);
    if (r.ok) setOutcome({ kind: 'matched', hash: r.current, decision: d });
    else if (r.reason === 'changed') setOutcome({ kind: 'changed', reviewed: r.reviewed, current: r.current });
    else if (r.reason === 'not-pending') setOutcome({ kind: 'used' });
    else setOutcome({ kind: 'none' });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="min-w-0">
        <div role="group" aria-label="Filter requests" className="mb-3 flex flex-wrap gap-1.5">
          {(['pending', 'decided', 'expired'] as const).map((f) => (
            <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
              {f === 'pending' ? 'Pending' : f === 'decided' ? 'Decided' : 'Expired'}
              <span className="tabular-nums">{counts[f]}</span>
            </Chip>
          ))}
        </div>
        {shown.length === 0 ? (
          <p className="border border-dashed p-3 text-xs text-muted-foreground">No {filter} requests.</p>
        ) : (
          <ul className="space-y-1.5" aria-label={`${filter} requests`}>
            {shown.map((a) => (
              <li key={a.proposalId}>
                <button
                  type="button"
                  aria-pressed={a.proposalId === selected}
                  onClick={() => onSelect(a.proposalId)}
                  className={cn(
                    'w-full border p-2.5 text-left text-xs transition-colors',
                    FOCUS,
                    a.proposalId === selected ? 'bg-muted' : 'hover:bg-muted/50',
                  )}
                >
                  <span className="block font-medium">{a.title}</span>
                  <span className="mt-1 flex flex-wrap items-center justify-between gap-1">
                    <StateBadge state={a.state} />
                    {a.state === 'pending' && a.expiresAt !== null && (
                      <span className="tabular-nums text-muted-foreground">{countdown(a.expiresAt - now)} left</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section aria-label="Request detail" className="min-w-0 border bg-card/80 p-4 text-sm">
        {!sel ? (
          <p className="text-muted-foreground">Select a request to see what it would do.</p>
        ) : (
          <div className="space-y-4">
            <header className="space-y-1">
              <h3 className="font-semibold leading-tight">{sel.title}</h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <StateBadge state={sel.state} />
                {sel.state === 'pending' && sel.expiresAt !== null && (
                  <span className="text-xs tabular-nums text-muted-foreground" aria-live="off">
                    Expires in {countdown(sel.expiresAt - now)}
                  </span>
                )}
              </div>
            </header>

            <dl className="space-y-3 text-xs">
              <Block title="Who and where">
                Requested by the dashboard{sel.project ? ` · ${sel.project}` : ''} · {dayAndClock(sel.requestedAt)}
              </Block>
              {sel.blocks ? (
                <>
                  <Block title="What will happen">{sel.blocks.happen}</Block>
                  <Block title="Target">
                    <span className="font-mono">{sel.blocks.target}</span>
                  </Block>
                  {sel.blocks.change && (
                    <Block title="What will change">
                      <span className="text-muted-foreground line-through decoration-1">{sel.blocks.change.before}</span>
                      <span aria-hidden> → </span>
                      <span className="sr-only"> becomes </span>
                      <span className="font-medium">{sel.blocks.change.after}</span>
                    </Block>
                  )}
                  <Block title="Reason">{sel.blocks.reason}</Block>
                  {sel.blocks.risks.length > 0 && (
                    <Block title="Risks">
                      <ul className="list-disc pl-4">
                        {sel.blocks.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </Block>
                  )}
                </>
              ) : (
                <Block title="What will happen">Details unavailable for this older request.</Block>
              )}
              <Block title="Record">
                <span className="font-mono">{sel.proposalId}</span> · mirrored to{' '}
                <span className="font-mono">system/{sel.proposalId}.md</span>
              </Block>
            </dl>

            {/* Payload hash check */}
            {sel.blocks && (
              <div className="border bg-muted/40 p-3 text-xs">
                <p className="mb-1.5 font-semibold">Payload check</p>
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 font-mono">
                  <span className="font-sans text-muted-foreground">You reviewed</span>
                  <span className="break-all">{shortHash(reviewedFp)}</span>
                  <span className="font-sans text-muted-foreground">Request now</span>
                  <span className={cn('break-all', matches === false && DANGER_TEXT)}>{shortHash(currentFp)}</span>
                </div>
                <p className={cn('mt-1.5 flex items-center gap-1', matches === false ? DANGER_TEXT : 'text-muted-foreground')}>
                  {matches === false ? (
                    <>
                      <ShieldAlert aria-hidden className="h-3.5 w-3.5" /> Changed since you opened it
                    </>
                  ) : (
                    <>
                      <ShieldCheck aria-hidden className="h-3.5 w-3.5" /> The service approves only the exact request you reviewed
                    </>
                  )}
                </p>
              </div>
            )}

            {sel.state === 'pending' && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Btn variant="default" disabled={!live || outcome.kind === 'checking'} onClick={() => void onDecide('deny')}>
                    Deny
                  </Btn>
                  <Btn
                    variant="primary"
                    disabled={!live || outcome.kind === 'checking'}
                    onClick={() => void onDecide('approve')}
                    className="flex-col items-start gap-0 py-1.5"
                  >
                    <span>Approve once</span>
                    {sel.destructive && sel.effect && (
                      <span className="text-[0.65rem] font-normal opacity-90">This will {sel.effect}.</span>
                    )}
                  </Btn>
                </div>
                {!live && <p className="text-xs text-muted-foreground">Reconnect to decide.</p>}
                <div className="flex flex-wrap gap-x-3 gap-y-1 border-t pt-2 text-xs">
                  <span className="text-muted-foreground">Try it:</span>
                  {sel.blocks && (
                    <button type="button" disabled={!live} onClick={() => tamper(sel.proposalId)} className={cn('underline underline-offset-2 disabled:opacity-50', FOCUS)}>
                      Simulate the requester editing it
                    </button>
                  )}
                  {sel.expiresAt !== null && (
                    <button type="button" onClick={() => skipTo((sel.expiresAt ?? now) + 1000)} className={cn('underline underline-offset-2', FOCUS)}>
                      Skip ahead to expiry
                    </button>
                  )}
                  {matches === false && (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewed({ id: sel.proposalId, payload: approvalPayload(sel) });
                        setOutcome({ kind: 'none' });
                      }}
                      className={cn('underline underline-offset-2', FOCUS)}
                    >
                      Review it again
                    </button>
                  )}
                </div>
              </div>
            )}

            {sel.state !== 'pending' && sel.consumed && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Btn disabled={!live || outcome.kind === 'checking'} onClick={() => void onDecide('approve')}>
                  Try to approve it again
                </Btn>
              </div>
            )}

            <Outcome outcome={outcome} />

            {sel.runId && (
              <Btn variant="ghost" className="px-0 underline underline-offset-2" onClick={() => sel.runId && onOpenRun(sel.runId)}>
                Open originating run
              </Btn>
            )}

            <div>
              <SectionLabel>History</SectionLabel>
              <ol className="space-y-1 text-xs">
                {sel.history.map((h, i) => (
                  <motion.li
                    key={`${h.at}-${i}`}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-2"
                  >
                    <span className="shrink-0 tabular-nums text-muted-foreground">{clock(h.at, true)}</span>
                    <span>{h.event}</span>
                  </motion.li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">{title}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}

function Outcome({ outcome }: { outcome: Outcome }) {
  return (
    <div aria-live="polite" className="text-xs">
      {outcome.kind === 'checking' && <p className="text-muted-foreground">Checking the payload hash with the service…</p>}
      {outcome.kind === 'changed' && (
        <p className={cn('border border-current/30 p-2', DANGER_TEXT)}>
          This request changed after you opened it. Nothing was carried out — review it again before deciding.
        </p>
      )}
      {outcome.kind === 'used' && (
        <p className="border p-2 text-muted-foreground">
          Refused by the service: this request was already decided. An approval is used once; raise a new request
          instead.
        </p>
      )}
      {outcome.kind === 'matched' && (
        <p className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Check aria-hidden className="h-3.5 w-3.5" />
          Hash matched ({outcome.hash.slice(0, 13)}…).{' '}
          {outcome.decision === 'approve' ? 'Approved once — the approval is now spent.' : 'Denied.'}
        </p>
      )}
    </div>
  );
}
