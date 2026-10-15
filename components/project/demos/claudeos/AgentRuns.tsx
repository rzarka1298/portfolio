import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RUN_STATE_DISPLAY } from './data';
import { ago, clock, duration } from './format';
import { ACCENT_TEXT, Btn, FOCUS, SectionLabel } from './ui';
import type { Approval, Session } from './types';

const WEEK = 7 * 24 * 60 * 60 * 1000;

function sessionDuration(s: Session, now: number): string {
  if (s.state === 'stale') return `At least ${duration((s.lastActivityAt ?? s.startedAt) - s.startedAt)}`;
  return duration((s.endedAt ?? now) - s.startedAt);
}

export function StateCell({ s }: { s: Session }) {
  const d = RUN_STATE_DISPLAY[s.state];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <span aria-hidden className={cn('w-3 text-center', s.state === 'running' && ACCENT_TEXT)}>
        {d.glyph}
      </span>
      {d.label}
      {s.state === 'running' && s.activity && (
        <span className="text-muted-foreground"> · {s.activity === 'working' ? 'Working' : 'Idle'}</span>
      )}
    </span>
  );
}

function RunTable({
  caption,
  sessions,
  now,
  selected,
  onSelect,
  empty,
}: {
  caption: string;
  sessions: Session[];
  now: number;
  selected: string | null;
  onSelect: (id: string) => void;
  empty: string;
}) {
  return (
    <div>
      <SectionLabel>
        {caption} <span className="font-normal normal-case tracking-normal">({sessions.length})</span>
      </SectionLabel>
      {sessions.length === 0 ? (
        <p className="border border-dashed p-3 text-xs text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto border">
          <table className="w-full min-w-[34rem] text-left text-xs">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                {['Name', 'State', 'Project', 'Last activity', 'Model', 'Duration'].map((h) => (
                  <th key={h} scope="col" className="px-2.5 py-1.5 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr
                  key={s.runId}
                  className={cn('border-t transition-colors', selected === s.runId ? 'bg-muted' : 'hover:bg-muted/50')}
                >
                  <td className="px-2.5 py-1.5">
                    <button
                      type="button"
                      aria-pressed={selected === s.runId}
                      onClick={() => onSelect(s.runId)}
                      className={cn('text-left font-medium underline-offset-2 hover:underline', FOCUS)}
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="px-2.5 py-1.5">
                    <StateCell s={s} />
                  </td>
                  <td className="px-2.5 py-1.5">{s.project ?? <span className="text-muted-foreground">unavailable</span>}</td>
                  <td className="whitespace-nowrap px-2.5 py-1.5">{ago(s.lastActivityAt, now)}</td>
                  <td className="px-2.5 py-1.5">{s.model ?? <span className="text-muted-foreground">unavailable</span>}</td>
                  <td className="whitespace-nowrap px-2.5 py-1.5 tabular-nums">{sessionDuration(s, now)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AgentRunsView({
  sessions,
  approvals,
  now,
  live,
  selected,
  onSelect,
  onRequestTerminate,
  onOpenRequest,
  onPreviewAction,
}: {
  sessions: Session[];
  approvals: Approval[];
  now: number;
  live: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
  onRequestTerminate: (s: Session) => void;
  onOpenRequest: (proposalId: string) => void;
  onPreviewAction: (text: string) => void;
}) {
  const active = sessions.filter((s) => RUN_STATE_DISPLAY[s.state].active && !s.unclassified);
  const recent = sessions.filter(
    (s) => !RUN_STATE_DISPLAY[s.state].active && !s.unclassified && now - (s.endedAt ?? s.startedAt) < WEEK,
  );
  const unclassified = sessions.filter((s) => s.unclassified);
  const sel = sessions.find((s) => s.runId === selected) ?? null;
  const pendingFor = sel
    ? approvals.find((a) => a.runId === sel.runId && a.operation === 'session.force-terminate' && a.state === 'pending')
    : undefined;
  const canTerminate = sel !== null && (sel.state === 'running' || sel.state === 'stale');

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_16rem]">
      <div className="min-w-0 space-y-4">
        <RunTable caption="Active" sessions={active} now={now} selected={selected} onSelect={onSelect} empty="No active sessions." />
        <RunTable
          caption="Recent (last 7 days)"
          sessions={recent}
          now={now}
          selected={selected}
          onSelect={onSelect}
          empty="Nothing ended in the last 7 days."
        />
        <RunTable
          caption="Unclassified"
          sessions={unclassified}
          now={now}
          selected={selected}
          onSelect={onSelect}
          empty="Every session belongs to a project."
        />
      </div>
      <aside aria-label="Session detail" className="min-w-0 border bg-card/80 p-4 text-sm">
        {!sel ? (
          <p className="text-muted-foreground">Select a session to see its detail.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{sel.name}</h3>
              <button
                type="button"
                aria-label="Close detail"
                onClick={() => onSelect(null)}
                className={cn('p-0.5 text-muted-foreground hover:bg-muted', FOCUS)}
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <StateCell s={sel} />
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
              {(
                [
                  ['Run', sel.runId],
                  ['Project', sel.project ?? 'unavailable'],
                  ['Model', sel.model ? `${sel.model}${sel.effort ? ` · ${sel.effort} effort` : ''}` : 'unavailable'],
                  ['Launch source', sel.launchSource ?? 'unavailable'],
                  ['Started', clock(sel.startedAt)],
                  ['Duration', sessionDuration(sel, now)],
                  ['Subagents', String(sel.subagents)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 break-words font-mono">{v}</dd>
                </div>
              ))}
            </dl>
            {sel.state === 'waiting-for-approval' && (
              <p className="bg-muted p-2 text-xs text-muted-foreground">
                Claude is asking permission in its own terminal. That prompt is answered there, not in the inbox.
              </p>
            )}
            <div className="flex flex-wrap gap-1.5">
              {RUN_STATE_DISPLAY[sel.state].active && (
                <>
                  <Btn onClick={() => onPreviewAction(`Focusing the terminal for "${sel.name}"…`)}>Focus</Btn>
                  <Btn onClick={() => onPreviewAction(`Resuming "${sel.name}" in a new terminal…`)}>Resume</Btn>
                </>
              )}
              {pendingFor ? (
                <Btn variant="primary" onClick={() => onOpenRequest(pendingFor.proposalId)}>
                  Request pending — review
                </Btn>
              ) : (
                canTerminate && (
                  <Btn variant="danger" disabled={!live} title={live ? undefined : 'Reconnect to raise a request'} onClick={() => onRequestTerminate(sel)}>
                    Request force-terminate
                  </Btn>
                )
              )}
            </div>
            {canTerminate && !pendingFor && (
              <p className="text-[0.68rem] text-muted-foreground">
                Nothing is ended directly: this raises a request that waits in the inbox for you to approve once.
              </p>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
