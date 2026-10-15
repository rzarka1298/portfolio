import { useCallback, useSyncExternalStore } from 'react';

/**
 * Site theme: 'dark' (blueprint, the default) or 'light' (blueprint paper).
 *
 * The class on <html> is the source of truth. index.html applies a saved
 * choice before first paint; this module keeps it in sync and persists
 * changes to localStorage under `theme`. `.dark` drives Tailwind's `dark:`
 * variant, `.light` switches the CSS variables in styles/globals.css.
 */
export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
const THEME_COLOR: Record<Theme, string> = { dark: '#0B2341', light: '#FBFCFE' };

function readTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.classList.contains('light') ? 'light' : 'dark';
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* private mode: the choice just isn't remembered */
  }
}

/** Current theme plus a toggle. Re-renders when the <html> class changes. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);
  const toggleTheme = useCallback(() => setTheme(readTheme() === 'dark' ? 'light' : 'dark'), []);
  return { theme, setTheme, toggleTheme };
}
