/**
 * Lenis smooth scroll, created lazily and only when motion is allowed.
 * `scrollToId` is the one function the app uses for in-page navigation: it
 * goes through Lenis when it's running and falls back to native scrolling.
 * Both honour `scroll-margin-top` (set on `main [id]` in globals.css).
 */
import type Lenis from 'lenis';

let instance: Lenis | null = null;
const listeners = new Set<() => void>();

export const getLenis = () => instance;

/** Called whenever Lenis starts or stops. Returns an unsubscribe. */
export function onLenisChange(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let wanted = false;

export async function startLenis() {
  wanted = true;
  if (instance) return instance;
  const { default: LenisCtor } = await import('lenis');
  // stopLenis() may have been called while the chunk was loading.
  if (instance || !wanted) return instance;
  instance = new LenisCtor({ lerp: 0.12, autoRaf: true, anchors: false });
  listeners.forEach((l) => l());
  return instance;
}

export function stopLenis() {
  wanted = false;
  if (!instance) return;
  instance.destroy();
  instance = null;
  listeners.forEach((l) => l());
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Smooth-scroll to the element with this id. Returns false if it doesn't exist. */
export function scrollToId(id: string, options: { immediate?: boolean } = {}) {
  const element = document.getElementById(id);
  if (!element) return false;
  const immediate = options.immediate || prefersReducedMotion();
  if (instance) {
    // The page may have just changed (route change), so refresh Lenis's
    // scroll limit before targeting an element near the bottom.
    instance.resize();
    instance.scrollTo(element, { immediate, duration: 1.1, force: true });
  } else {
    element.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
  }
  return true;
}
