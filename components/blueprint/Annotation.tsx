import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface AnnotationProps {
  /** Offset of the leader's elbow from the anchor point, px. */
  dx?: number;
  dy?: number;
  /** Length of the horizontal shelf the note sits on, px. */
  shelf?: number;
  tone?: 'line' | 'signal';
  /** Where the anchor sits inside the positioned parent (CSS lengths). */
  x?: string | number;
  y?: string | number;
  className?: string;
  children: ReactNode;
}

/**
 * A drafting callout: a dot on the thing being described, a leader line out
 * to an elbow, a short shelf, and a mono note. Absolutely positioned at
 * (x, y) inside a `relative` parent. Hidden from assistive tech when the
 * note only restates visible content; pass meaningful text otherwise.
 *
 *   <div className="relative">
 *     <img ... />
 *     <Annotation x="62%" y="30%" dx={48} dy={-36}>Temporal workflow</Annotation>
 *   </div>
 */
export default function Annotation({
  dx = 40,
  dy = -32,
  shelf = 24,
  tone = 'line',
  x = 0,
  y = 0,
  className,
  children,
}: AnnotationProps) {
  const right = dx >= 0;
  const ex = dx + (right ? shelf : -shelf);
  const minX = Math.min(0, ex);
  const minY = Math.min(0, dy);
  const w = Math.abs(ex) + 8;
  const h = Math.abs(dy) + 8;
  const ox = -minX + 4;
  const oy = -minY + 4;
  const color = tone === 'signal' ? 'text-bp-signal-ink' : 'text-bp-line';

  const noteStyle: CSSProperties = {
    top: dy,
    [right ? 'left' : 'right']: right ? ex + 6 : -ex + 6,
    transform: 'translateY(-50%)',
  };

  return (
    <span className={cn('pointer-events-none absolute z-10', color, className)} style={{ left: x, top: y }}>
      <svg
        aria-hidden="true"
        width={w}
        height={h}
        className="absolute overflow-visible"
        style={{ left: minX - 4, top: minY - 4 }}
      >
        <circle cx={ox} cy={oy} r={2.5} className="fill-current" />
        <circle cx={ox} cy={oy} r={6} className="fill-none stroke-current" strokeWidth={0.75} opacity={0.6} />
        <path
          d={`M${ox} ${oy} L${ox + dx} ${oy + dy} L${ox + ex} ${oy + dy}`}
          fill="none"
          className="stroke-current"
          strokeWidth={1}
        />
      </svg>
      <span className="bp-label absolute whitespace-nowrap normal-case tracking-[0.04em] text-current" style={noteStyle}>
        {children}
      </span>
    </span>
  );
}
