import { useState, type ReactNode } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useReducedMotion } from './hooks';

export interface MarqueeProps {
  items: ReactNode[];
  /** Seconds for one full loop. Default 40. */
  duration?: number;
  reverse?: boolean;
  /** Rendered between items. Default a small cross mark. */
  separator?: ReactNode;
  /** Accessible name for the list. */
  label?: string;
  className?: string;
}

const Cross = () => (
  <svg aria-hidden="true" width="9" height="9" viewBox="0 0 9 9" className="shrink-0 stroke-bp-signal">
    <path d="M4.5 0V9M0 4.5H9" strokeWidth="1" />
  </svg>
);

/**
 * A single horizontal ticker band. CSS-driven (no JS per frame); pauses on
 * hover and keyboard focus and has a visible pause button (WCAG 2.2.2).
 * Under reduced motion it renders a static wrapped list instead.
 * Use at most once per page.
 */
export default function Marquee({
  items,
  duration = 40,
  reverse = false,
  separator = <Cross />,
  label = 'Highlights',
  className,
}: MarqueeProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-8 whitespace-nowrap">
          {item}
          {separator}
        </li>
      ))}
    </ul>
  );

  if (reduced) {
    return (
      <ul aria-label={label} className={cn('flex flex-wrap items-center gap-x-6 gap-y-3', className)}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn('group relative flex items-center overflow-hidden', className)} role="region" aria-label={label}>
      <div
        className="flex w-max group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
        style={{
          // Longhands only: the `animation` shorthand would reset play-state
          // inline and override the hover/focus pause classes.
          animationName: 'bp-marquee',
          animationDuration: `${duration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationDirection: reverse ? 'reverse' : 'normal',
          animationPlayState: paused ? 'paused' : undefined,
        }}
      >
        {row(false)}
        {row(true)}
      </div>
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        aria-label={paused ? 'Play ticker' : 'Pause ticker'}
        className="absolute right-0 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center border border-bp-line-soft/50 bg-background text-bp-ink-dim hover:text-bp-ink"
      >
        {paused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
      </button>
    </div>
  );
}
