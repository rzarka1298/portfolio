import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import ProjectStage from './ProjectStage';
import type { ShowcaseProject } from './showcaseData';
import { handleTablistKey } from './tablistKeys';

const chipId = (slug: string) => `project-chip-${slug}`;
const cardId = (slug: string) => `project-card-${slug}`;

/**
 * Small screens: a strip of index chips (the tablist) over full-width cards
 * that swipe with scroll snap. Swiping selects; selecting scrolls. Off-screen
 * cards are inert, so keyboard and screen-reader users follow the tabs.
 */
export default function MobileShowcase({
  projects,
  activeIndex,
  onSelect,
  reduced,
  labelledBy,
}: {
  projects: ShowcaseProject[];
  activeIndex: number;
  onSelect: (index: number, source: 'tab' | 'swipe') => void;
  reduced: boolean;
  labelledBy: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const programmatic = useRef<number | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Keep the active card in view (tab taps, hero selections, deep links).
  useEffect(() => {
    const track = trackRef.current;
    const card = cardRefs.current[activeIndex];
    if (!track || !card) return;
    if (Math.abs(track.scrollLeft - card.offsetLeft) < 4) return;
    programmatic.current = activeIndex;
    track.scrollTo({ left: card.offsetLeft, behavior: reduced ? 'auto' : 'smooth' });
    const t = window.setTimeout(() => {
      programmatic.current = null;
    }, 900);
    return () => window.clearTimeout(t);
  }, [activeIndex, reduced]);

  // Keep the active chip in view inside its own strip (never scroll the page).
  useEffect(() => {
    const strip = chipsRef.current;
    const chip = chipRefs.current[activeIndex];
    if (!strip || !chip) return;
    const target = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' });
  }, [activeIndex, reduced]);

  // Swipes: the card that settles in view becomes the selection.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.6) continue;
          const i = cardRefs.current.indexOf(entry.target as HTMLDivElement);
          if (i < 0) continue;
          if (programmatic.current !== null && programmatic.current !== i) continue;
          onSelectRef.current(i, 'swipe');
        }
      },
      { root: track, threshold: [0.6] },
    );
    cardRefs.current.forEach((c) => c && io.observe(c));
    return () => io.disconnect();
  }, []);

  // Off-screen cards are inert (React 18 has no `inert` prop).
  useEffect(() => {
    cardRefs.current.forEach((c, i) => c?.toggleAttribute('inert', i !== activeIndex));
  }, [activeIndex]);

  const go = (next: number) => {
    onSelect(next, 'tab');
    chipRefs.current[next]?.focus({ preventScroll: true });
  };

  return (
    <div>
      <div
        ref={chipsRef}
        role="tablist"
        aria-orientation="horizontal"
        aria-labelledby={labelledBy}
        className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((p, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={p.slug}
              ref={(el) => {
                chipRefs.current[i] = el;
              }}
              id={chipId(p.slug)}
              role="tab"
              type="button"
              aria-selected={active}
              aria-controls={cardId(p.slug)}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(i, 'tab')}
              onKeyDown={(e) => handleTablistKey(e, i, projects.length, go, 'horizontal')}
              className={cn(
                'flex h-10 shrink-0 items-center gap-2 border px-3 transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal',
                active ? 'border-bp-signal bg-bp-panel text-bp-ink' : 'border-bp-line-soft/50 text-bp-ink-dim',
              )}
            >
              <span className={cn('font-mono text-[0.625rem] tracking-[0.12em]', active ? 'text-bp-signal-ink' : 'text-bp-line')}>
                {p.partNo}
              </span>
              <span className="whitespace-nowrap font-display text-sm">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div
        ref={trackRef}
        className="relative -mx-4 flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:-mx-6 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((p, i) => (
          <div
            key={p.slug}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            id={cardId(p.slug)}
            role="tabpanel"
            aria-labelledby={chipId(p.slug)}
            className="w-full shrink-0 snap-center snap-always px-4 sm:px-6"
          >
            <ProjectStage
              project={p}
              position={i + 1}
              total={projects.length}
              variant="mobile"
              active={i === activeIndex}
              reduced={reduced}
              headingId={`project-card-title-${p.slug}`}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5" aria-hidden="true">
        {projects.map((p, i) => (
          <span
            key={p.slug}
            className={cn('h-1 transition-all duration-300', i === activeIndex ? 'w-6 bg-bp-signal' : 'w-2 bg-bp-line-soft/60')}
          />
        ))}
      </div>
    </div>
  );
}
