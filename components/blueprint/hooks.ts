import { useEffect, useRef, useSyncExternalStore, type DependencyList, type RefObject } from 'react';
import { loadGsap, type GsapModules } from '../../lib/motion/gsap';

/** Subscribe to a CSS media query. Returns false during SSR. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * True when the visitor asked for reduced motion. The one JS gate for
 * motion the CSS media query and `<MotionConfig reducedMotion="user">`
 * don't cover: loops, parallax, WebGL, Lenis, GSAP scenes, cursor effects.
 */
export function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/** True on devices with a precise hovering pointer (mouse, trackpad). */
export function usePointerFine() {
  return useMediaQuery('(hover: hover) and (pointer: fine)');
}

type GsapSetup = (modules: GsapModules) => void | (() => void);

/**
 * Run GSAP code scoped to an element, loading GSAP + ScrollTrigger lazily.
 *
 *   const ref = useGsapContext<HTMLDivElement>(({ gsap }) => {
 *     gsap.from('.row', { y: 24, opacity: 0, stagger: 0.06,
 *       scrollTrigger: { trigger: '.rows', start: 'top 80%' } });
 *   }, []);
 *   return <div ref={ref}>...</div>;
 *
 * - Selector strings resolve inside the returned ref's element.
 * - Everything created in `setup` (tweens, ScrollTriggers) is reverted on
 *   unmount or when `deps` change. `setup` may also return a cleanup.
 * - Skipped entirely under prefers-reduced-motion, so the DOM's default
 *   (unanimated) state must be the finished, readable state.
 */
export function useGsapContext<T extends Element = HTMLDivElement>(
  setup: GsapSetup,
  deps: DependencyList = [],
  options: { scope?: RefObject<T>; enabled?: boolean } = {},
): RefObject<T> {
  const ownRef = useRef<T>(null);
  const scope = options.scope ?? ownRef;
  const enabled = options.enabled ?? true;
  const reduced = useReducedMotion();
  const setupRef = useRef(setup);
  setupRef.current = setup;

  useEffect(() => {
    if (!enabled || reduced) return undefined;
    let cancelled = false;
    let revert: (() => void) | undefined;
    void loadGsap().then((modules) => {
      if (cancelled) return;
      let userCleanup: void | (() => void);
      const ctx = modules.gsap.context(() => {
        userCleanup = setupRef.current(modules);
      }, scope.current ?? undefined);
      revert = () => {
        if (typeof userCleanup === 'function') userCleanup();
        ctx.revert();
      };
    });
    return () => {
      cancelled = true;
      revert?.();
    };
    // `deps` is the caller's dependency list, like useEffect's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reduced, scope, ...deps]);

  return scope;
}
