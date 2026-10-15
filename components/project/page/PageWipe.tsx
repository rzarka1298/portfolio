import { motion } from 'framer-motion';
import { useState } from 'react';
import { useReducedMotion } from '../../blueprint';

const EASE = [0.65, 0, 0.35, 1] as const;

/**
 * Page-enter transition: a blank drafting sheet covers the viewport and is
 * wiped away left to right behind a cyan scan line, uncovering the page.
 * Purely decorative and pointer-transparent; skipped entirely under reduced
 * motion. Remount it (via `key`) to replay on a route change.
 */
export default function PageWipe({ label }: { label: string }) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  if (reduced || done) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      <motion.div
        className="bp-grid absolute inset-0"
        initial={{ clipPath: 'inset(0 0 0 0%)' }}
        animate={{ clipPath: 'inset(0 0 0 100%)' }}
        transition={{ duration: 0.75, ease: EASE, delay: 0.05 }}
        onAnimationComplete={() => setDone(true)}
      />
      <motion.div
        className="absolute inset-y-0 left-0 w-px bg-bp-line shadow-[0_0_12px_hsl(var(--bp-line))]"
        initial={{ x: '0vw' }}
        animate={{ x: '100vw' }}
        transition={{ duration: 0.75, ease: EASE, delay: 0.05 }}
      >
        <span className="bp-label absolute left-2 top-1/2 whitespace-nowrap text-bp-line">{label}</span>
      </motion.div>
    </div>
  );
}
