import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import { scrollToId } from '../lib/motion/lenis';
import { cn } from '../lib/utils';

const navItems = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/** Scroll-spy: the section crossing the upper-middle of the viewport. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState('hero');
  useEffect(() => {
    if (!enabled) {
      setActive('');
      return undefined;
    }
    const visible = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => visible.set(e.target.id, e.isIntersecting));
        const current = navItems.find((item) => visible.get(item.id));
        if (current) setActive(current.id);
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    // Sections may mount a frame after the header; retry briefly.
    let attempts = 0;
    let timer: number | undefined;
    const observeAll = () => {
      const els = navItems.map((i) => document.getElementById(i.id)).filter(Boolean) as HTMLElement[];
      els.forEach((el) => observer.observe(el));
      if (els.length < navItems.length && attempts++ < 20) timer = window.setTimeout(observeAll, 100);
    };
    observeAll();
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [enabled]);
  return active;
}

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isHome = pathname === '/';
  const active = useActiveSection(isHome);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape and lock page scroll while it's open.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const go = (id: string) => {
    setMenuOpen(false);
    if (!isHome) {
      // ScrollManager scrolls to the section once the home page has rendered.
      navigate(`/#${id}`);
      return;
    }
    scrollToId(id);
  };

  const themeLabel = theme === 'dark' ? 'Switch to light (paper) theme' : 'Switch to dark (blueprint) theme';

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300',
        // No backdrop-filter while the menu is open: it would make the header
        // the containing block for the fixed-position menu panel.
        menuOpen
          ? 'border-bp-line-soft/40 bg-bp-bg'
          : scrolled
            ? 'border-bp-line-soft/40 bg-bp-bg/85 backdrop-blur-md'
            : 'border-transparent bg-transparent',
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[80] focus:bg-bp-signal focus:px-3 focus:py-2 focus:font-mono focus:text-xs focus:text-[hsl(214_74%_11%)]"
      >
        Skip to content
      </a>
      <nav aria-label="Primary" className="mx-auto flex h-14 max-w-[90rem] items-center justify-between px-4 sm:px-6 lg:px-10">
        <a
          href="/#hero"
          onClick={(e) => {
            e.preventDefault();
            go('hero');
          }}
          className="group flex items-center gap-3"
          aria-label="Rugved Zarkar, home"
        >
          <span className="relative flex h-8 w-8 items-center justify-center border border-bp-line/70 font-display text-sm font-semibold text-bp-ink">
            RZ
            <span aria-hidden="true" className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 bg-bp-signal" />
          </span>
          <span className="hidden font-mono text-xs uppercase tracking-[0.14em] text-bp-ink-dim transition-colors group-hover:text-bp-ink sm:inline">
            R. Zarkar
          </span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          <ul className="flex items-center">
            {navItems.map((item, i) => {
              const isActive = active === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`/#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item.id);
                    }}
                    aria-current={isActive ? 'location' : undefined}
                    className={cn(
                      'relative flex h-14 items-center gap-1.5 px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] transition-colors',
                      isActive ? 'text-bp-ink' : 'text-bp-ink-dim hover:text-bp-ink',
                    )}
                  >
                    <span className={cn('transition-colors', isActive ? 'text-bp-signal-ink' : 'text-bp-line-soft')}>
                      {String(i).padStart(2, '0')}
                    </span>
                    {item.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-active"
                        className="absolute inset-x-3 bottom-0 h-[2px] bg-bp-signal"
                        transition={{ duration: 0.35, ease: EASE }}
                      />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
          <ThemeToggle theme={theme} onToggle={toggleTheme} label={themeLabel} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle theme={theme} onToggle={toggleTheme} label={themeLabel} />
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="flex h-9 items-center gap-2 border border-bp-line-soft/60 px-3 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-bp-ink"
          >
            <span aria-hidden="true" className="relative block h-2.5 w-3.5">
              <span
                className={cn(
                  'absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300',
                  menuOpen && 'translate-y-[5px] rotate-45',
                )}
              />
              <span
                className={cn(
                  'absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300',
                  menuOpen && '-translate-y-[4px] -rotate-45',
                )}
              />
            </span>
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.35, ease: EASE }}
            data-lenis-prevent
            className="bp-grid fixed inset-x-0 bottom-0 top-14 overflow-y-auto border-t border-bp-line-soft/40 md:hidden"
          >
            <ul className="px-4 py-6">
              {navItems.map((item, i) => (
                <li key={item.id} className="border-b border-bp-line-soft/30">
                  <a
                    href={`/#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item.id);
                    }}
                    aria-current={active === item.id ? 'location' : undefined}
                    className="flex items-baseline gap-4 py-4"
                  >
                    <span className={cn('bp-label', active === item.id ? 'text-bp-signal-ink' : 'text-bp-line')}>
                      {String(i).padStart(2, '0')}
                    </span>
                    <span className="font-display text-3xl font-medium text-bp-ink">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function ThemeToggle({ theme, onToggle, label }: { theme: 'dark' | 'light'; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      title={label}
      className="ml-2 flex h-9 items-center gap-2 border border-bp-line-soft/60 px-2.5 font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-bp-ink-dim transition-colors hover:border-bp-line hover:text-bp-ink"
    >
      {theme === 'dark' ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span className="hidden lg:inline">{theme === 'dark' ? 'Paper' : 'Blueprint'}</span>
    </button>
  );
}
