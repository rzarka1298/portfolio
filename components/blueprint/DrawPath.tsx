import { motion } from 'framer-motion';
import type { SVGProps } from 'react';
import { useGsapContext, useReducedMotion } from './hooks';

export interface DrawPathProps extends Omit<SVGProps<SVGPathElement>, 'ref' | 'pathLength'> {
  d: string;
  /**
   * When the stroke draws itself:
   * - 'load'   on mount (framer-motion)
   * - 'view'   once, when it scrolls into view (framer-motion)
   * - 'scroll' scrubbed to scroll position (GSAP ScrollTrigger, lazy-loaded)
   * - 'none'   static
   */
  draw?: 'load' | 'view' | 'scroll' | 'none';
  /** Seconds (load / view). */
  duration?: number;
  delay?: number;
  /** ScrollTrigger start / end for draw="scroll". Trigger element is the parent <svg>. */
  start?: string;
  end?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * An SVG <path> that draws its stroke. Render it inside an <svg>.
 * Under reduced motion it is simply drawn.
 *
 *   <svg viewBox="0 0 400 40"><DrawPath d="M0 20 H400" draw="view" className="stroke-bp-line" /></svg>
 */
export default function DrawPath({
  d,
  draw = 'view',
  duration = 1.2,
  delay = 0,
  start = 'top 85%',
  end = 'bottom 40%',
  fill = 'none',
  strokeWidth = 1,
  ...rest
}: DrawPathProps) {
  const reduced = useReducedMotion();

  const scrollRef = useGsapContext<SVGPathElement>(
    ({ gsap }) => {
      const path = scrollRef.current;
      if (!path) return;
      gsap.fromTo(
        path,
        { strokeDashoffset: 1 },
        {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: { trigger: path.ownerSVGElement ?? path, start, end, scrub: 0.6 },
        },
      );
    },
    [start, end],
    { enabled: draw === 'scroll' },
  );

  if (draw === 'scroll') {
    return (
      <path
        ref={scrollRef}
        d={d}
        fill={fill}
        strokeWidth={strokeWidth}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={0}
        {...rest}
      />
    );
  }

  if (draw === 'none' || reduced) {
    return <path d={d} fill={fill} strokeWidth={strokeWidth} {...rest} />;
  }

  const animate = { pathLength: 1 };
  const transition = { duration, delay, ease: EASE };
  return (
    <motion.path
      d={d}
      fill={fill}
      strokeWidth={strokeWidth}
      initial={{ pathLength: 0 }}
      {...(draw === 'load'
        ? { animate }
        : { whileInView: animate, viewport: { once: true, amount: 0.4 } })}
      transition={transition}
      {...(rest as object)}
    />
  );
}
