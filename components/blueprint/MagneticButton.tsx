import { motion, useMotionValue, useSpring, type HTMLMotionProps } from 'framer-motion';
import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { usePointerFine, useReducedMotion } from './hooks';

type Common = {
  /** Fraction of the pointer offset the button follows. Default 0.3. */
  strength?: number;
  /** Cap on travel in px so the target never runs from the cursor. Default 10. */
  max?: number;
  className?: string;
  children?: ReactNode;
};

export type MagneticButtonProps =
  | (Common & { href: string } & Omit<HTMLMotionProps<'a'>, 'children' | 'className'>)
  | (Common & { href?: undefined } & Omit<HTMLMotionProps<'button'>, 'children' | 'className'>);

const SPRING = { stiffness: 150, damping: 15, mass: 0.1 };

/**
 * A link (when `href` is set) or button that leans toward the pointer.
 * Unstyled beyond layout: pass your own classes. Magnetism is off on touch
 * devices and under reduced motion; it's driven by motion values, so it
 * never re-renders.
 */
export default function MagneticButton({ strength = 0.3, max = 10, className, children, ...rest }: MagneticButtonProps) {
  const ref = useRef<HTMLElement | null>(null);
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const clamp = (v: number) => Math.max(-max, Math.min(max, v));
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(clamp((e.clientX - (r.left + r.width / 2)) * strength));
    y.set(clamp((e.clientY - (r.top + r.height / 2)) * strength));
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const shared = {
    className: cn('inline-flex items-center justify-center', className),
    style: enabled ? { x, y } : undefined,
    onPointerMove,
    onPointerLeave: reset,
  };

  if ('href' in rest && rest.href !== undefined) {
    return (
      <motion.a ref={ref as React.Ref<HTMLAnchorElement>} {...(rest as HTMLMotionProps<'a'>)} {...shared}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      {...(rest as HTMLMotionProps<'button'>)}
      {...shared}
    >
      {children}
    </motion.button>
  );
}
