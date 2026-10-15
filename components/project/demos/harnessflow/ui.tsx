import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/*
 * Miniature versions of the dashboard's ProjectUI primitives
 * (apps/dashboard/src/components/projects/ProjectUI.tsx), restyled with the
 * portfolio's Tailwind tokens so they follow the site's light/dark theme.
 */

const ACTIVE = new Set(['queued', 'running', 'planning', 'executing', 'verifying']);

const TONES = {
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  active: 'bg-bp-signal/15 text-bp-signal-ink',
  neutral: 'bg-muted text-muted-foreground',
} as const;

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone =
    status === 'completed' || status === 'passed'
      ? 'success'
      : status === 'failed' || status === 'rejected'
        ? 'danger'
        : ACTIVE.has(status)
          ? 'active'
          : 'neutral';
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold capitalize',
        TONES[tone],
      )}
    >
      <span
        aria-hidden
        className={cn('h-1.5 w-1.5 rounded-full bg-current', tone === 'active' && 'motion-safe:animate-pulse')}
      />
      {label ?? (status.replace(/_/g, ' ') || 'pending')}
    </span>
  );
}

export function Panel({
  title,
  hint,
  right,
  children,
  className,
}: {
  title: string;
  hint?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0 border bg-card p-4 sm:p-5', className)}>
      <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
          {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        {right}
      </header>
      {children}
    </section>
  );
}

export function Metric({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 border bg-card px-3 py-2.5 sm:px-4 sm:py-3">
      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-medium tabular-nums sm:text-lg">{value}</dd>
      {sub ? <dd className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{sub}</dd> : null}
    </div>
  );
}

/** Code block: scrolls horizontally inside itself, never the page. */
export function Code({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <pre
      tabIndex={0}
      className={cn(
        'max-h-72 max-w-full overflow-auto whitespace-pre border bg-muted/50 p-3 font-mono text-[11px] leading-relaxed text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal',
        className,
      )}
    >
      {children}
    </pre>
  );
}

/** Explicit marker for data the recorded run did not retain. */
export function Unavailable({ children }: { children: ReactNode }) {
  return (
    <span className="border border-dashed px-1.5 py-px text-[10px] italic text-muted-foreground">
      {children}
    </span>
  );
}
