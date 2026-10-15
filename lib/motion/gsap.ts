/**
 * Lazy GSAP loader. GSAP + ScrollTrigger (~45 KB gz) stay out of the main
 * chunk: the first caller triggers one dynamic import, everyone after shares
 * the same promise. Plugins are registered exactly once.
 *
 * Prefer `useGsapContext` (components/blueprint/hooks) in components; it
 * handles scoping, reduced motion and cleanup.
 */
import { getLenis, onLenisChange } from './lenis';

export type GsapModules = {
  gsap: typeof import('gsap').gsap;
  ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger;
};

let modulesPromise: Promise<GsapModules> | null = null;

export function loadGsap(): Promise<GsapModules> {
  if (!modulesPromise) {
    modulesPromise = Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        gsap.registerPlugin(ScrollTrigger);
        // Keep ScrollTrigger in step with Lenis's smoothed scroll position.
        let detach: (() => void) | undefined;
        const attach = () => {
          detach?.();
          const lenis = getLenis();
          detach = lenis ? lenis.on('scroll', ScrollTrigger.update) : undefined;
          ScrollTrigger.refresh();
        };
        attach();
        onLenisChange(attach);
        // Fonts change line heights, which moves trigger positions.
        void document.fonts?.ready.then(() => ScrollTrigger.refresh());
        return { gsap, ScrollTrigger };
      },
    );
  }
  return modulesPromise;
}

/** SplitText, loaded on demand (only for components that split real lines). */
export async function loadSplitText() {
  const [{ gsap }, { SplitText }] = await Promise.all([loadGsap(), import('gsap/SplitText')]);
  gsap.registerPlugin(SplitText);
  return SplitText;
}
