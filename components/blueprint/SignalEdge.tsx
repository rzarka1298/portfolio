import { motion } from 'framer-motion';
import { useId } from 'react';
import { cn } from '../../lib/utils';
import DrawPath, { type DrawPathProps } from './DrawPath';
import { useReducedMotion } from './hooks';

export type SignalState = 'idle' | 'active' | 'dimmed';

export interface SignalEdgeProps {
  d: string;
  /** Visual state. 'active' turns the edge and its signal orange. */
  state?: SignalState;
  /** How the edge draws itself (see DrawPath). Default 'load'. */
  draw?: DrawPathProps['draw'];
  /** Draw duration and delay, seconds. Dots appear once the draw finishes. */
  duration?: number;
  delay?: number;
  /** Travelling dots on the edge. 0 for none. */
  dots?: number;
  /** Seconds for one dot to cross the edge. */
  speed?: number;
  /** Run the signal from the end of the path back to its start. */
  reverse?: boolean;
  className?: string;
}

/**
 * A schematic wire: a faint full-length trace, a stroke that draws itself,
 * and glowing signal dots that travel along it. Render inside an <svg>.
 *
 *   <SignalEdge d="M10 10 H200 V80" state={hover ? 'active' : 'idle'} dots={2} />
 *
 * Dots use SMIL <animateMotion> (no JS per frame) and are omitted under
 * reduced motion.
 */
export default function SignalEdge({
  d,
  state = 'idle',
  draw = 'load',
  duration = 1.1,
  delay = 0,
  dots = 1,
  speed = 2.8,
  reverse = false,
  className,
}: SignalEdgeProps) {
  const pathId = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const active = state === 'active';

  return (
    <g
      className={cn('transition-opacity duration-300', state === 'dimmed' && 'opacity-30', className)}
      data-state={state}
    >
      {/* Faint trace: the wire exists before the signal is drawn along it. */}
      <path id={pathId} d={d} fill="none" strokeWidth={1} strokeDasharray="2 4" className="stroke-bp-line-soft/50" />
      <DrawPath
        d={d}
        draw={draw}
        duration={duration}
        delay={delay}
        strokeWidth={active ? 1.75 : 1.25}
        className={cn('transition-[stroke,stroke-width] duration-300', active ? 'stroke-bp-signal' : 'stroke-bp-line/80')}
      />
      {!reduced &&
        Array.from({ length: dots }, (_, i) => (
          <motion.circle
            key={i}
            r={active ? 3.25 : 2.5}
            className={cn('transition-colors duration-300', active ? 'fill-bp-signal' : 'fill-bp-line')}
            style={{ filter: 'drop-shadow(0 0 4px currentColor)', color: active ? 'hsl(var(--bp-signal))' : 'hsl(var(--bp-line))' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + duration * 0.8, duration: 0.4 }}
          >
            <animateMotion
              dur={`${speed}s`}
              begin={`${-(speed / dots) * i}s`}
              repeatCount="indefinite"
              rotate="auto"
              {...(reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
            >
              <mpath href={`#${pathId}`} />
            </animateMotion>
          </motion.circle>
        ))}
    </g>
  );
}
