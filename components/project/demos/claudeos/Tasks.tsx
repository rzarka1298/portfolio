import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TODAY_ISO } from './data';
import { Btn, Chip, FOCUS } from './ui';
import { TASK_FILTERS, type Task, type TaskFilter } from './types';

const FILTER_LABEL: Record<TaskFilter, string> = {
  all: 'All',
  today: 'Today',
  upcoming: 'Upcoming',
  overdue: 'Overdue',
  project: 'Project',
  proposed: 'Proposed',
  blocked: 'Blocked',
  completed: 'Completed',
};

const STATUS_LABEL: Record<Task['status'], string> = {
  inbox: 'Inbox',
  proposed: 'Proposed',
  ready: 'Ready',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  done: 'Done',
  cancelled: 'Cancelled',
};

function isOpen(t: Task) {
  return t.status !== 'done' && t.status !== 'cancelled' && t.status !== 'proposed';
}

function matches(t: Task, f: TaskFilter): boolean {
  switch (f) {
    case 'all':
      return t.status !== 'cancelled';
    case 'today':
      return isOpen(t) && (t.due === TODAY_ISO || t.status === 'in-progress');
    case 'upcoming':
      return isOpen(t) && t.due !== null && t.due > TODAY_ISO;
    case 'overdue':
      return isOpen(t) && t.due !== null && t.due < TODAY_ISO;
    case 'project':
      return isOpen(t) && t.project !== null;
    case 'proposed':
      return t.status === 'proposed';
    case 'blocked':
      return t.status === 'blocked';
    case 'completed':
      return t.status === 'done';
  }
}

export function TasksView({
  tasks,
  live,
  onAccept,
  onDismiss,
}: {
  tasks: Task[];
  live: boolean;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [filter, setFilter] = useState<TaskFilter>('today');
  const [selected, setSelected] = useState<string | null>(null);
  const shown = tasks.filter((t) => matches(t, filter));
  const sel = tasks.find((t) => t.id === selected) ?? null;

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Filter tasks" className="flex flex-wrap gap-1.5">
        {TASK_FILTERS.map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            {FILTER_LABEL[f]} <span className="tabular-nums">{tasks.filter((t) => matches(t, f)).length}</span>
          </Chip>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
        {shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
            No tasks under {FILTER_LABEL[filter]}.
          </p>
        ) : (
          <ul className="min-w-0 space-y-1.5" aria-label={`${FILTER_LABEL[filter]} tasks`}>
            {shown.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-pressed={selected === t.id}
                  onClick={() => setSelected(t.id)}
                  className={cn(
                    'flex w-full flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-lg border p-2.5 text-left text-xs',
                    FOCUS,
                    selected === t.id ? 'bg-muted' : 'hover:bg-muted/50',
                  )}
                >
                  <span className={cn('font-medium', t.status === 'done' && 'text-muted-foreground line-through')}>
                    {t.title}
                  </span>
                  <span className="text-muted-foreground">
                    {STATUS_LABEL[t.status]}
                    {t.due ? ` · due ${t.due.slice(5)}` : ''}
                    {t.project ? ` · ${t.project}` : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <aside aria-label="Task detail" className="min-w-0 rounded-xl border bg-card/80 p-4 text-xs">
          {!sel ? (
            <p className="text-muted-foreground">Select a task to see its detail.</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{sel.title}</h3>
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1">
                {(
                  [
                    ['Status', STATUS_LABEL[sel.status]],
                    ['Priority', sel.priority ?? 'unavailable'],
                    ['Project', sel.project ?? 'None'],
                    ['Due', sel.due ?? 'No due date'],
                    ['Assignee', sel.assignee ?? 'unavailable'],
                    ...(sel.blockedBy ? ([['Blocked by', sel.blockedBy]] as const) : []),
                    ...(sel.proposedBy ? ([['Proposed by', sel.proposedBy]] as const) : []),
                  ] as const
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              {sel.status === 'proposed' && (
                <div className="space-y-1.5 border-t pt-2">
                  <p className="text-muted-foreground">An automation suggested this. It isn't a task until you accept it.</p>
                  <div className="flex gap-2">
                    <Btn variant="primary" disabled={!live} onClick={() => onAccept(sel.id)}>
                      Accept
                    </Btn>
                    <Btn disabled={!live} onClick={() => onDismiss(sel.id)}>
                      Dismiss
                    </Btn>
                  </div>
                </div>
              )}
              <p className="border-t pt-2 text-[0.68rem] text-muted-foreground">
                Editing is part of the real Tasks view; this mock keeps tasks read-only.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
