import { useEffect, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { startLenis, stopLenis } from '../../lib/motion/lenis';
import { useReducedMotion } from './hooks';

/**
 * The single global motion gate. Wrap the app once.
 * - framer-motion: `reducedMotion="user"` drops transform/layout animation
 *   for visitors who prefer reduced motion.
 * - Lenis smooth scroll runs only when motion is allowed, and is torn down
 *   if the preference changes mid-session.
 * GSAP scenes gate themselves through `useGsapContext`.
 */
export default function MotionProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      stopLenis();
      return undefined;
    }
    let cancelled = false;
    // Start after first paint so it never competes with the hero.
    const id = window.setTimeout(() => {
      if (!cancelled) void startLenis();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      stopLenis();
    };
  }, [reduced]);

  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
