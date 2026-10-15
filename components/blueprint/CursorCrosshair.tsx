import { useEffect, useRef, useState } from 'react';
import { usePointerFine, useReducedMotion } from './hooks';

/**
 * Drafting crosshair: two hairlines through the pointer plus a live
 * coordinate readout. Fine pointers only, off under reduced motion, never
 * replaces the native cursor, and is pointer-events: none. Updates via
 * transforms on refs (no React re-render per move).
 */
export default function CursorCrosshair() {
  const fine = usePointerFine();
  const reduced = useReducedMotion();
  const enabled = fine && !reduced;
  const h = useRef<HTMLDivElement>(null);
  const v = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) return undefined;
    let frame = 0;
    let px = 0;
    let py = 0;
    const paint = () => {
      frame = 0;
      if (h.current) h.current.style.transform = `translate3d(0, ${py}px, 0)`;
      if (v.current) v.current.style.transform = `translate3d(${px}px, 0, 0)`;
      if (label.current) {
        label.current.style.transform = `translate3d(${px + 12}px, ${py + 12}px, 0)`;
        label.current.textContent = `X ${String(Math.round(px)).padStart(4, '0')}  Y ${String(
          Math.round(py + window.scrollY),
        ).padStart(4, '0')}`;
      }
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      px = e.clientX;
      py = e.clientY;
      setVisible(true);
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const onLeave = () => setVisible(false);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[70] transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div ref={h} className="absolute inset-x-0 top-0 h-px bg-bp-line/15" />
      <div ref={v} className="absolute inset-y-0 left-0 w-px bg-bp-line/15" />
      <div ref={label} className="bp-label absolute left-0 top-0 whitespace-pre text-[0.625rem] text-bp-line/70" />
    </div>
  );
}
