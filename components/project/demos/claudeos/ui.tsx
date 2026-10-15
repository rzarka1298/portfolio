import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Lock, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CardStateOverride, Freshness } from './types';

/** Accent for the mock: the site's signal orange (the real app uses pink). */
export const ACCENT_TEXT = 'text-bp-signal-ink';
export const ACCENT_BG = 'bg-bp-signal';
export const ACCENT_BORDER = 'border-bp-signal';
export const DANGER_TEXT = 'text-red-700 dark:text-[#ff6b6b]';
export const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background';

type BtnVariant = 'default' | 'primary' | 'ghost' | 'danger';
export function Btn({
  variant = 'default',
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex min-h-[2rem] items-center justify-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        FOCUS,
        variant === 'default' && 'border-border bg-background hover:bg-muted',
        variant === 'primary' &&
          'border-transparent bg-bp-signal text-[#0B2341] hover:bg-bp-signal/90',
        variant === 'ghost' && 'border-transparent bg-transparent hover:bg-muted',
        variant === 'danger' && 'border-red-700/40 bg-background text-red-700 hover:bg-red-50 dark:border-[#ff6b6b]/40 dark:text-[#ff6b6b] dark:hover:bg-[#ff6b6b]/10',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Chip({
  active,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      {...rest}
      className={cn(
        'inline-flex min-h-[1.75rem] items-center gap-1 border px-2.5 text-xs transition-colors',
        FOCUS,
        active ? cn('font-semibold', ACCENT_BORDER, ACCENT_TEXT, 'bg-muted') : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p id={id} className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
}

const FRESHNESS_LABEL: Record<Freshness, string> = {
  live: 'Live',
  cached: 'Cached',
  stale: 'Stale',
  unavailable: 'Unavailable',
};

const FRESHNESS_DOT: Record<Freshness, string> = {
  live: 'bg-emerald-500',
  cached: 'bg-bp-line-soft',
  stale: 'bg-amber-500',
  unavailable: 'bg-muted-foreground',
};

export function FreshnessFooter({
  freshness,
  source,
  tone = 'default',
}: {
  freshness: Freshness;
  source: string | null;
  tone?: 'default' | 'cream';
}) {
  return (
    <div
      className={cn(
        'mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 border-t pt-2 text-[0.68rem]',
        tone === 'cream' ? 'border-bp-line-soft/50 text-bp-ink-dim' : 'border-border text-muted-foreground',
      )}
    >
      <span className="inline-flex items-center gap-1">
        <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', FRESHNESS_DOT[freshness])} />
        {FRESHNESS_LABEL[freshness]}
      </span>
      {source && (
        <>
          <span aria-hidden>·</span>
          <span>Source: {source}</span>
        </>
      )}
    </div>
  );
}

export interface CardProps {
  title: string;
  source: string | null;
  freshness: Freshness;
  override: CardStateOverride;
  disconnected: boolean;
  wide?: boolean;
  emptyText?: string;
  /** Card is permission-gated in the real app regardless of the switcher. */
  permission?: { source: string; onConnect: () => void };
  unavailableText?: string;
  onConnectPreview: () => void;
  onRetryPreview?: () => void;
  children?: ReactNode;
  headerExtra?: ReactNode;
}

/**
 * The card frame from `widgets/frame.tsx`: header, body, freshness footer.
 * A card never disappears; it changes state.
 */
export function CardFrame(p: CardProps) {
  const permission = p.permission ?? (p.override === 'permission-required' ? { source: p.source ?? p.title, onConnect: p.onConnectPreview } : null);
  const state: CardStateOverride | 'unavailable' = p.unavailableText
    ? 'unavailable'
    : permission
      ? 'permission-required'
      : p.override;
  const freshness: Freshness =
    state === 'unavailable' || state === 'failure' || state === 'permission-required'
      ? 'unavailable'
      : state === 'stale' || p.disconnected
        ? 'stale'
        : p.freshness;

  return (
    <section
      aria-label={p.title}
      className={cn(
        'flex min-w-0 flex-col gap-3 border bg-card/80 p-4 transition-opacity',
        p.wide && 'sm:col-span-2',
        p.disconnected && 'opacity-[0.85]',
      )}
    >
      <header className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-tight">{p.title}</h3>
        {state === 'live' && p.headerExtra}
      </header>
      <div className={cn('min-w-0 text-sm', state === 'stale' && 'opacity-60')}>
        {state === 'live' || state === 'stale' ? (
          p.children
        ) : state === 'empty' ? (
          <p className="text-muted-foreground">{p.emptyText ?? 'Nothing here yet.'}</p>
        ) : state === 'unavailable' ? (
          <p className="text-muted-foreground">{p.unavailableText}</p>
        ) : state === 'failure' ? (
          <div className="space-y-2">
            <p className={cn('flex items-center gap-1.5', DANGER_TEXT)}>
              <AlertTriangle aria-hidden className="h-4 w-4" /> Couldn't load {p.title.toLowerCase()}
            </p>
            <Btn onClick={p.onRetryPreview ?? p.onConnectPreview}>
              <RefreshCw aria-hidden className="h-3 w-3" /> Try again
            </Btn>
          </div>
        ) : permission ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <Lock aria-hidden className="h-4 w-4" /> {permission.source} isn't connected
            </p>
            <Btn onClick={permission.onConnect}>Connect</Btn>
          </div>
        ) : null}
      </div>
      <FreshnessFooter freshness={freshness} source={p.source} />
    </section>
  );
}

export function Meter({ value, label, reserve }: { value: number | null; label: string; reserve?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">{value === null ? 'unavailable' : `${value}%`}</span>
      </div>
      <div
        className="relative h-2 overflow-hidden rounded-full bg-muted"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? 'unavailable' : `${value}%`}
      >
        {value !== null && <div className={cn('h-full rounded-full', ACCENT_BG)} style={{ width: `${value}%` }} />}
        {reserve !== undefined && (
          <div aria-hidden className="absolute inset-y-0 w-0.5 bg-foreground" style={{ left: `${reserve}%` }} />
        )}
      </div>
    </div>
  );
}
