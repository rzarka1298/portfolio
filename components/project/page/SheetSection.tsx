import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { DimensionedTitle } from '../../blueprint';
import { cn } from '../../../lib/utils';
import { pad2 } from './sheets';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * One sheet of the drawing set: a "SHEET 02 / ARCHITECTURE" rule that draws
 * out to the margin, a dimensioned h2, an optional lead, then the content.
 */
export default function SheetSection({
  id,
  index,
  total,
  label,
  title,
  intro,
  className,
  children,
}: {
  id: string;
  /** 1-based sheet number. */
  index: number;
  total: number;
  label: string;
  title: string;
  intro?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      // Clears the fixed header, plus the sheet strip on small screens.
      className={cn('relative !scroll-mt-28 py-14 md:py-20 lg:!scroll-mt-20', className)}
    >
      <header className="mb-10 md:mb-12">
        <div className="mb-5 flex items-center gap-3">
          <span className="bp-label text-bp-line">Sheet {pad2(index)}</span>
          <span className="bp-label">/</span>
          <span className="bp-label">{label}</span>
          <motion.span
            aria-hidden="true"
            className="h-px min-w-6 flex-1 origin-left bg-bp-line-soft/50"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          <span aria-hidden="true" className="bp-label tabular-nums">
            {pad2(index)}/{pad2(total)}
          </span>
        </div>
        <DimensionedTitle id={headingId} className="text-3xl font-medium leading-[1.05] sm:text-4xl md:text-5xl">
          {title}
        </DimensionedTitle>
        {intro && <div className="mt-6 max-w-[62ch] text-base leading-relaxed text-bp-ink-dim md:text-lg">{intro}</div>}
      </header>
      {children}
    </section>
  );
}
