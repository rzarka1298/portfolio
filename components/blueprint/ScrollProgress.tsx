import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { cn } from '../../lib/utils';

/**
 * Page scroll progress drawn as a drafting ruler. On large screens it's a
 * vertical ruler on the right edge with a moving orange marker and a mono
 * readout; below `lg` it collapses to a hairline under the header.
 * Decorative: hidden from assistive tech.
 */
export default function ScrollProgress({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.3 });
  const markerY = useTransform(progress, (v) => `calc(${v} * (100vh - 14rem))`);
  const readout = useRef<HTMLSpanElement>(null);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (readout.current) readout.current.textContent = String(Math.round(v * 100)).padStart(3, '0');
  });

  return (
    <div aria-hidden="true" className={cn('pointer-events-none', className)}>
      {/* Mobile / tablet: hairline under the header. */}
      <motion.div
        className="fixed inset-x-0 top-14 z-40 h-px origin-left bg-bp-signal lg:hidden"
        style={{ scaleX: progress }}
      />

      {/* Desktop: ruler. */}
      <div className="fixed bottom-24 right-3 top-32 z-30 hidden w-4 lg:block">
        <span ref={readout} className="bp-label absolute -top-6 right-0 text-bp-signal-ink">
          000
        </span>
        <div
          className="absolute inset-y-0 right-0 w-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to bottom, hsl(var(--bp-line-soft) / 0.7) 0 1px, transparent 1px 8px),' +
              'repeating-linear-gradient(to bottom, hsl(var(--bp-line) / 0.8) 0 1px, transparent 1px 40px)',
            backgroundSize: '6px 100%, 12px 100%',
            backgroundPosition: 'right top, right top',
            backgroundRepeat: 'no-repeat',
          }}
        />
        <div className="absolute inset-y-0 right-0 w-px bg-bp-line-soft/60" />
        <motion.div className="absolute right-0 top-0 flex -translate-y-1/2 items-center" style={{ y: markerY }}>
          <span className="h-2 w-2 rotate-45 border border-bp-signal bg-background" />
          <span className="h-px w-3 bg-bp-signal" />
        </motion.div>
      </div>
    </div>
  );
}
