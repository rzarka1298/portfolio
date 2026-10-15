import { motion } from 'framer-motion';
import { useLayoutEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** Anchor id; also the nav/scroll-spy target. */
  id: string;
  /** Sheet number shown as "02 / EXPERIENCE". */
  index: number;
  /** Short mono section label, e.g. "Experience". */
  label: string;
  /** The section heading (h2). */
  title: ReactNode;
  /** Optional lead paragraph under the title. */
  intro?: ReactNode;
  /** Text on the dimension line. Default: the measured title width, e.g. "W 412". */
  dimension?: string;
  /** Classes for the inner content container. */
  containerClassName?: string;
  children?: ReactNode;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Section scaffold: annotated header ("02 / EXPERIENCE" plus a rule out to
 * the margin), an h2 with a dimension line under it, then the content in
 * the site container. Use one per home-page section.
 *
 *   <Section id="experience" index={2} label="Experience" title="Where I've worked">
 *     ...
 *   </Section>
 */
export default function Section({
  id,
  index,
  label,
  title,
  intro,
  dimension,
  className,
  containerClassName,
  children,
  ...rest
}: SectionProps) {
  const no = String(index).padStart(2, '0');
  const headingId = `${id}-title`;

  return (
    <section id={id} aria-labelledby={headingId} className={cn('relative py-24 md:py-32', className)} {...rest}>
      <div className={cn('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', containerClassName)}>
        <header className="mb-12 md:mb-16">
          <div className="mb-6 flex items-center gap-3">
            <span className="bp-label text-bp-signal-ink">{no}</span>
            <span className="bp-label">/</span>
            <span className="bp-label text-bp-line">{label}</span>
            <motion.span
              aria-hidden="true"
              className="h-px flex-1 origin-left bg-bp-line-soft/50"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.9, ease: EASE }}
            />
            <span aria-hidden="true" className="bp-label hidden sm:inline">
              SHEET {no}
            </span>
          </div>
          <DimensionedTitle id={headingId} dimension={dimension}>
            {title}
          </DimensionedTitle>
          {intro && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-bp-ink-dim">{intro}</div>}
        </header>
        {children}
      </div>
    </section>
  );
}

/**
 * A heading with a drafting dimension line (end ticks, centred value) under
 * it. The value defaults to the heading's measured width, e.g. "W 412".
 */
export function DimensionedTitle({
  id,
  dimension,
  as: Tag = 'h2',
  className,
  children,
}: {
  id?: string;
  dimension?: string;
  as?: 'h1' | 'h2' | 'h3';
  /** Replaces the default h2 type styles. */
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || dimension) return undefined;
    const measure = () => setWidth(Math.round(el.getBoundingClientRect().width));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [dimension]);

  const value = dimension ?? (width ? `W ${width}` : '');

  return (
    <div className="inline-block max-w-full">
      <Tag
        id={id}
        ref={ref}
        className={cn(
          'inline-block max-w-full text-balance font-display text-bp-ink',
          className ?? 'text-4xl font-medium leading-[1.05] sm:text-5xl md:text-6xl',
        )}
      >
        {children}
      </Tag>
      <div aria-hidden="true" className="relative mt-3 flex h-3 items-center text-bp-line-soft">
        <span className="h-3 w-px bg-current" />
        <motion.span
          className="h-px flex-1 origin-center bg-current"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 1 }}
          transition={{ duration: 0.8, delay: 0.15, ease: EASE }}
        />
        <span className="h-3 w-px bg-current" />
        {value && (
          <span className="bp-label absolute left-1/2 top-1/2 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-bp-line">
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
