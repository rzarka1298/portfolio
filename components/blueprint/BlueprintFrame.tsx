import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface BlueprintFrameProps extends HTMLAttributes<HTMLElement> {
  /** Mono label set into the top edge, e.g. "FIG. 02 / STACK". */
  label?: ReactNode;
  /** Mono note at the top-right corner, e.g. a part number or date. */
  meta?: ReactNode;
  /** Colour of the corner marks and labels. */
  tone?: 'line' | 'signal' | 'muted';
  /** Opaque panel behind the content (use for body copy over the grid). */
  solid?: boolean;
  /** Draw a full hairline border as well as the corner marks. */
  bordered?: boolean;
  /** Element to render. Default 'div'. */
  as?: ElementType;
  children?: ReactNode;
}

const TONE = {
  line: 'text-bp-line',
  signal: 'text-bp-signal',
  muted: 'text-bp-line-soft',
} as const;

/**
 * A box with drafting registration marks at its corners and an optional
 * label notched into its top edge. The workhorse container of the Blueprint
 * look: wrap cards, figures and panels in it.
 */
export default function BlueprintFrame({
  label,
  meta,
  tone = 'line',
  solid = false,
  bordered = false,
  as: Tag = 'div',
  className,
  children,
  ...rest
}: BlueprintFrameProps) {
  return (
    <Tag
      className={cn(
        'relative',
        solid && 'bg-bp-panel/90 backdrop-blur-[2px]',
        bordered && 'border border-bp-line-soft/40',
        className,
      )}
      {...rest}
    >
      <CornerMarks className={TONE[tone]} />
      {label && (
        <span className={cn('bp-label absolute -top-[0.4rem] left-4 bg-background px-1.5', TONE[tone])}>
          {label}
        </span>
      )}
      {meta && <span className="bp-label absolute -top-[0.4rem] right-4 bg-background px-1.5">{meta}</span>}
      {children}
    </Tag>
  );
}

/** Four L-shaped corner marks. Absolutely positioned; parent must be relative. */
export function CornerMarks({ size = 10, className }: { size?: number; className?: string }) {
  const s = { width: size, height: size };
  const base = 'pointer-events-none absolute border-current';
  return (
    <span aria-hidden="true" className={className}>
      <span className={cn(base, '-left-px -top-px border-l border-t')} style={s} />
      <span className={cn(base, '-right-px -top-px border-r border-t')} style={s} />
      <span className={cn(base, '-bottom-px -left-px border-b border-l')} style={s} />
      <span className={cn(base, '-bottom-px -right-px border-b border-r')} style={s} />
    </span>
  );
}
