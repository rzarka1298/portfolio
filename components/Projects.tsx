import { AnimatePresence, motion, type Variants } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { useLocation } from 'react-router-dom';
import { DimensionedTitle, useMediaQuery, useReducedMotion } from './blueprint';
import { isFeaturedProjectId } from '../content/featured';
import { PROJECTS_SECTION_ID, useProjectSelection } from '../lib/projectSelection';
import { scrollToId } from '../lib/motion/lenis';
import MobileShowcase from './showcase/MobileShowcase';
import ProjectStage from './showcase/ProjectStage';
import ShowcaseRail from './showcase/ShowcaseRail';
import { panelId, tabId } from './showcase/tablistKeys';
import { findShowcaseIndex, showcaseProjects } from './showcase/showcaseData';
import { trackProjectView } from './showcase/trackProjectView';

const WIPE_S = 0.85;
const WIPE_EASE = [0.65, 0, 0.35, 1] as const;
const HASH_PREFIX = `#${PROJECTS_SECTION_ID}/`;

/** `#projects/<slug>` → index, or -1. */
function indexFromHash(hash: string) {
  if (!hash.startsWith(HASH_PREFIX)) return -1;
  return findShowcaseIndex(decodeURIComponent(hash.slice(HASH_PREFIX.length)));
}

// The incoming stage is revealed by a scan line sweeping down (or up, going
// back through the list) while the outgoing one fades underneath.
const wipe: Variants = {
  enter: (dir: number) => ({ clipPath: dir >= 0 ? 'inset(0% 0% 100% 0%)' : 'inset(100% 0% 0% 0%)', zIndex: 2 }),
  center: { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2, transition: { duration: WIPE_S, ease: WIPE_EASE } },
  exit: { opacity: 0, zIndex: 1, transition: { duration: 0.2, delay: WIPE_S } },
};
const scan: Variants = {
  enter: (dir: number) => ({ top: dir >= 0 ? '0%' : '100%', opacity: 1 }),
  center: (dir: number) => ({
    top: dir >= 0 ? '100%' : '0%',
    opacity: [1, 1, 0],
    transition: { top: { duration: WIPE_S, ease: WIPE_EASE }, opacity: { duration: WIPE_S + 0.2, times: [0, 0.8, 1] } },
  }),
};

/**
 * Projects (#projects): a full-height showcase. Desktop: an index rail of
 * tabs beside a stage the selected project takes over (live architecture
 * preview, overview, stats, links). Small screens: swipeable cards.
 *
 * Selection comes from the tabs, the hero's project nodes
 * (lib/projectSelection) and a `#projects/<slug>` deep link.
 */
export default function Projects() {
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const { hash } = useLocation();
  const { selectedId, seq, source, select } = useProjectSelection();

  const [state, setState] = useState(() => {
    const fromHash = typeof window !== 'undefined' ? indexFromHash(window.location.hash) : -1;
    const fromStore = findShowcaseIndex(selectedId);
    return { index: fromHash >= 0 ? fromHash : fromStore >= 0 ? fromStore : 0, dir: 1, n: 0 };
  });
  const active = showcaseProjects[state.index];
  const indexRef = useRef(state.index);
  indexRef.current = state.index;

  const show = useCallback((next: number, opts: { track?: boolean; hash?: boolean } = {}) => {
    const prev = indexRef.current;
    if (next === prev || next < 0 || next >= showcaseProjects.length) return false;
    setState((st) => ({ index: next, dir: next > prev ? 1 : -1, n: st.n + 1 }));
    const project = showcaseProjects[next];
    if (opts.track) trackProjectView(project);
    if (opts.hash) {
      const url = `${window.location.pathname}${window.location.search}${HASH_PREFIX}${project.slug}`;
      window.history.replaceState(window.history.state, '', url);
    }
    return true;
  }, []);

  /** A visitor picked a tab (rail, chip or swipe). */
  const choose = useCallback(
    (next: number) => {
      if (!show(next, { track: true, hash: true })) return;
      const slug = showcaseProjects[next].slug;
      // Mirror the selection for the hero; non-featured projects clear it.
      select(isFeaturedProjectId(slug) ? slug : null, { source: 'projects' });
    },
    [select, show],
  );

  // Hero node clicks (and any other writer). `seq` catches repeat clicks.
  useEffect(() => {
    if (!selectedId || source === 'projects') return;
    show(findShowcaseIndex(selectedId), { track: true, hash: true });
  }, [selectedId, seq, source, show]);

  // Deep link: /#projects/<slug>, on load and on later hash navigation.
  const firstHash = useRef(true);
  useEffect(() => {
    const i = indexFromHash(hash || window.location.hash);
    const first = firstHash.current;
    firstHash.current = false;
    if (i < 0) return undefined;
    show(i, { track: true });
    // ScrollManager can't resolve "projects/<slug>" as an id; scroll here.
    const t = window.setTimeout(() => scrollToId(PROJECTS_SECTION_ID, { immediate: first }), first ? 60 : 0);
    if (!first) return () => window.clearTimeout(t);
    // On a cold load the sections above keep growing (fonts, images) after
    // that first jump; settle once more unless the visitor has scrolled.
    let interacted = false;
    const stop = () => {
      interacted = true;
    };
    const events = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
    events.forEach((e) => window.addEventListener(e, stop, { passive: true, once: true }));
    const settle = window.setTimeout(() => {
      const el = document.getElementById(PROJECTS_SECTION_ID);
      if (!interacted && el && Math.abs(el.getBoundingClientRect().top - 72) > 8) {
        scrollToId(PROJECTS_SECTION_ID, { immediate: true });
      }
    }, 900);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(settle);
      events.forEach((e) => window.removeEventListener(e, stop));
    };
  }, [hash, show]);

  return (
    <section
      id={PROJECTS_SECTION_ID}
      aria-labelledby="projects-title"
      className="relative py-24 lg:flex lg:h-[calc(100svh-4.5rem)] lg:max-h-[62rem] lg:min-h-[46rem] lg:flex-col lg:py-8"
    >
      <div className="relative mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:px-10">
        {desktop ? (
          <div
            className="grid min-h-0 flex-1 grid-cols-[var(--rail-w)_minmax(0,1fr)] gap-[var(--rail-gap)]"
            style={{ '--rail-w': '19rem', '--rail-gap': '2.5rem' } as CSSProperties}
          >
            <div className="flex min-h-0 flex-col">
              <SectionHeading />
              <div className="mt-6 min-h-0 flex-1">
                <ShowcaseRail
                  projects={showcaseProjects}
                  activeIndex={state.index}
                  onSelect={choose}
                  labelledBy="projects-title"
                />
              </div>
            </div>

            <div id={panelId(active.slug)} role="tabpanel" aria-labelledby={tabId(active.slug)} className="relative grid min-h-0">
              {reduced ? (
                <div className="[grid-area:1/1] min-h-0">
                  <ProjectStage
                    key={active.slug}
                    project={active}
                    position={state.index + 1}
                    total={showcaseProjects.length}
                    variant="desktop"
                    active
                    reduced
                    headingId={`project-stage-title-${active.slug}`}
                  />
                </div>
              ) : (
                <AnimatePresence initial={false} custom={state.dir}>
                  <motion.div
                    key={active.slug}
                    custom={state.dir}
                    variants={wipe}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="relative [grid-area:1/1] min-h-0"
                  >
                    <ProjectStage
                      project={active}
                      position={state.index + 1}
                      total={showcaseProjects.length}
                      variant="desktop"
                      active
                      reduced={false}
                      enterDelay={0.45}
                      headingId={`project-stage-title-${active.slug}`}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              {!reduced && state.n > 0 && (
                // The plotter head: leads the incoming stage's reveal. Sits outside
                // the clipped layer so the clip can't hide it.
                <motion.span
                  key={state.n}
                  aria-hidden="true"
                  custom={state.dir}
                  variants={scan}
                  initial="enter"
                  animate="center"
                  className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-bp-line shadow-[0_0_16px_3px_hsl(var(--bp-line)/0.7)]"
                >
                  <span className="bp-label absolute -top-5 right-3 text-bp-line">{active.partNo} / Redraw</span>
                </motion.span>
              )}
            </div>
          </div>
        ) : (
          <>
            <SectionHeading />
            <div className="mt-8">
              <MobileShowcase
                projects={showcaseProjects}
                activeIndex={state.index}
                onSelect={(i) => choose(i)}
                reduced={reduced}
                labelledBy="projects-title"
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function SectionHeading() {
  return (
    <header>
      <div className="mb-5 flex items-center gap-3">
        <span className="bp-label text-bp-signal-ink">04</span>
        <span className="bp-label">/</span>
        <span className="bp-label text-bp-line">Projects</span>
        <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/50" />
        <span aria-hidden="true" className="bp-label">
          SHEET 04
        </span>
      </div>
      <DimensionedTitle id="projects-title" className="text-4xl font-medium leading-[1.05] lg:text-[2.75rem]">
        Projects
      </DimensionedTitle>
    </header>
  );
}
