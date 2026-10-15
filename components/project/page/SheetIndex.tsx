import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { scrollToId } from '../../../lib/motion/lenis';
import { cn } from '../../../lib/utils';
import { pad2, type Sheet } from './sheets';

/** Id of the sheet whose top has passed the upper third of the viewport. */
function useActiveSheet(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(',');

  useEffect(() => {
    let frame = 0;
    const measure = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      // At the very bottom the last sheet may never reach the line.
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        const last = ids[ids.length - 1];
        const el = document.getElementById(last);
        if (el && el.getBoundingClientRect().top < window.innerHeight) current = last;
      }
      setActive(current);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands in for `ids`
  }, [key]);

  return active;
}

/**
 * The drawing set's sheet index. A vertical, sticky list beside the content
 * on large screens; a sticky strip under the header on small ones. The
 * orange marker sits on the sheet in view.
 */
export default function SheetIndex({ sheets, part }: { sheets: Sheet[]; part: string }) {
  const active = useActiveSheet(sheets.map((s) => s.id));
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active entry visible in the horizontal strip.
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.querySelector<HTMLElement>(`[data-sheet="${active}"]`);
    if (!strip || !item || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollTo({ left: item.offsetLeft - 16, behavior: 'smooth' });
  }, [active]);

  const go = (id: string) => scrollToId(id);

  return (
    <>
      {/* Small screens: strip under the header */}
      <nav
        aria-label="Sheets"
        className="sticky top-14 z-30 -mx-4 border-y border-bp-line-soft/40 bg-bp-bg/95 backdrop-blur sm:-mx-6 lg:hidden"
      >
        <div ref={stripRef} className="flex overflow-x-auto px-1 [scrollbar-width:none] sm:px-3">
          {sheets.map((s, i) => {
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                data-sheet={s.id}
                onClick={() => go(s.id)}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'relative flex h-10 shrink-0 items-center gap-1.5 px-3 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors',
                  on ? 'text-bp-ink' : 'text-bp-ink-dim hover:text-bp-ink',
                )}
              >
                <span className={on ? 'text-bp-signal-ink' : 'text-bp-line'}>{pad2(i + 1)}</span>
                {s.label}
                {on && (
                  <motion.span
                    layoutId="sheet-strip-marker"
                    className="absolute inset-x-3 bottom-0 h-[2px] bg-bp-signal"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Large screens: sticky side index */}
      <nav aria-label="Sheets" className="hidden lg:block">
        <div className="sticky top-24">
          <div className="bp-label mb-4 text-bp-line">Sheet index</div>
          <ol className="relative border-l border-bp-line-soft/40">
            {sheets.map((s, i) => {
              const on = s.id === active;
              return (
                <li key={s.id} className="relative">
                  {on && (
                    <motion.span
                      layoutId="sheet-index-marker"
                      aria-hidden="true"
                      className="absolute -left-px top-0 h-full w-[2px] bg-bp-signal"
                      transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                    />
                  )}
                  <a
                    href={`#${s.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      go(s.id);
                    }}
                    aria-current={on ? 'true' : undefined}
                    className={cn(
                      'flex items-baseline gap-3 py-2 pl-4 pr-2 text-sm transition-colors',
                      on ? 'text-bp-ink' : 'text-bp-ink-dim hover:text-bp-ink',
                    )}
                  >
                    <span className={cn('font-mono text-[0.6875rem] tabular-nums', on ? 'text-bp-signal-ink' : 'text-bp-line')}>
                      {pad2(i + 1)}
                    </span>
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 border-t border-bp-line-soft/40 pt-3 font-mono text-[0.6875rem] tracking-[0.12em] text-bp-ink-dim">
            {part} / {sheets.length} sheets
          </div>
        </div>
      </nav>
    </>
  );
}
