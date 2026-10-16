import { scrollToId } from '../../lib/motion/lenis';
import { CornerMarks } from '../blueprint';

/** Drawing revision. Bump the letter and date when the site changes materially. */
const REVISION = { rev: 'C', date: '2026-10-15', note: 'Résumé update' };

/**
 * The page footer, drawn as a drawing's title block: who drew it, what
 * it is, the sheet count and the revision.
 */
export default function Footer() {
  const year = new Date().getFullYear();

  const cell = 'bg-background px-4 py-3';
  const key = 'bp-label mb-1.5 block text-[0.625rem]';

  return (
    <footer className="relative overflow-x-clip pb-8 pt-4">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <CornerMarks size={10} className="text-bp-line" />
          <div className="grid grid-cols-2 gap-px border border-bp-line/60 bg-bp-line-soft/50 md:grid-cols-[minmax(0,2.2fr)_repeat(4,minmax(0,1fr))]">
            <div className={`${cell} col-span-2 flex items-center gap-4 md:col-span-1 md:row-span-2`}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-bp-line font-display text-base font-semibold text-bp-ink">
                RZ
              </span>
              <div className="min-w-0">
                <span className={key}>Title</span>
                <p className="font-display text-lg leading-tight text-bp-ink">Rugved Zarkar, portfolio</p>
                <p className="mt-1 font-mono text-xs text-bp-ink-dim">CS @ UMD &rsquo;28 / SWE Intern @ AWS</p>
              </div>
            </div>

            <div className={cell}>
              <span className={key}>Drawn by</span>
              <span className="font-mono text-xs text-bp-ink">R. Zarkar</span>
            </div>
            <div className={cell}>
              <span className={key}>Sheet</span>
              <span className="font-mono text-xs text-bp-ink">06 / 06</span>
            </div>
            <div className={cell}>
              <span className={key}>Rev</span>
              <span className="font-mono text-xs text-bp-signal-ink">{REVISION.rev}</span>
              <span className="sr-only">, {REVISION.note}</span>
            </div>
            <div className={cell}>
              <span className={key}>Date</span>
              <time dateTime={REVISION.date} className="font-mono text-xs text-bp-ink">
                {REVISION.date}
              </time>
            </div>

            <div className={`${cell} col-span-2`}>
              <span className={key}>Built with</span>
              <span className="font-mono text-xs text-bp-ink">React / TypeScript / Vite / Tailwind</span>
            </div>
            <div className={cell}>
              <span className={key}>Copyright</span>
              <span className="font-mono text-xs text-bp-ink">© {year}</span>
            </div>
            <div className={cell}>
              <a
                href="#hero"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId('hero');
                }}
                className="group flex h-full flex-col justify-between"
              >
                <span className={key}>Return</span>
                <span className="font-mono text-xs text-bp-line underline-offset-4 group-hover:underline">
                  Back to top
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
