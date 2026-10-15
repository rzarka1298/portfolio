import { motion } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '../../lib/utils';
import type { ShowcaseProject } from './showcaseData';
import { handleTablistKey, panelId, tabId } from './tablistKeys';

/**
 * Desktop project index: a vertical ARIA tablist. Hovering the list dims the
 * other rows; the active row carries the orange signal marker, which wires
 * across the gutter into the stage.
 */
export default function ShowcaseRail({
  projects,
  activeIndex,
  onSelect,
  labelledBy,
}: {
  projects: ShowcaseProject[];
  activeIndex: number;
  onSelect: (index: number) => void;
  labelledBy: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const go = (next: number) => {
    onSelect(next);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      aria-labelledby={labelledBy}
      className="relative flex flex-col [&:hover>button:not(:hover):not([aria-selected=true])]:opacity-40"
    >
      {projects.map((p, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={p.slug}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={tabId(p.slug)}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={panelId(p.slug)}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => handleTablistKey(e, i, projects.length, go, 'vertical')}
            className={cn(
              'group relative grid grid-cols-[3rem_minmax(0,1fr)] items-baseline border-b border-bp-line-soft/30 py-2.5 pl-4 pr-3 text-left',
              'transition-[opacity,background-color] duration-300 first:border-t',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bp-signal',
              active ? 'bg-bp-panel' : 'hover:bg-bp-panel/50',
            )}
          >
            {active && (
              <motion.span
                layoutId="showcase-rail-marker"
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[3px] bg-bp-signal"
                transition={{ type: 'spring', stiffness: 420, damping: 38 }}
              >
                {/* The wire from the active row into the stage. */}
                <span className="absolute left-[calc(var(--rail-w,18rem)-3px)] top-1/2 hidden h-px w-[calc(var(--rail-gap,2.5rem)+1px)] bg-bp-signal lg:block">
                  <span className="absolute -right-1 -top-[3px] h-[7px] w-[7px] bg-bp-signal" />
                </span>
              </motion.span>
            )}
            <span
              className={cn(
                'font-mono text-[0.6875rem] tracking-[0.12em] transition-colors',
                active ? 'text-bp-signal-ink' : 'text-bp-line',
              )}
            >
              {p.partNo}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block truncate font-display text-base font-medium leading-tight transition-colors',
                  active ? 'text-bp-ink' : 'text-bp-ink/80 group-hover:text-bp-ink',
                )}
              >
                {p.name}
              </span>
              <span className={cn('mt-0.5 block truncate text-xs', active ? 'text-bp-ink-dim' : 'text-bp-ink-dim/80')}>
                {p.result}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
