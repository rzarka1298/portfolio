import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis, scrollToId } from '../lib/motion/lenis';

/**
 * Router scroll behaviour:
 * - `/#section` scrolls to that section once it exists (it may render a frame
 *   or two after navigating back from a project page).
 * - Any other pathname change scrolls to the top. The initial load is left
 *   alone so a reload keeps the browser's restored position.
 */
export default function ScrollManager() {
  const { pathname, hash } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const firstRender = isFirstRender.current;
    isFirstRender.current = false;

    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let attempts = 0;
      let timer: number | undefined;
      const tryScroll = () => {
        if (scrollToId(id, { immediate: firstRender })) return;
        if (attempts++ < 20) {
          timer = window.setTimeout(tryScroll, 50);
        }
      };
      tryScroll();
      return () => window.clearTimeout(timer);
    }

    if (!firstRender) {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(0, { immediate: true });
      else window.scrollTo(0, 0);
    }
    return undefined;
  }, [pathname, hash]);

  return null;
}
