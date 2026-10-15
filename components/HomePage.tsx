import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Hero from './Hero';
import About from './About';
import Projects from './Projects';
import Experience from './Experience';
import Skills from './Skills';
import Contact from './Contact';
import Footer from './sections/Footer';
import { scrollToId } from '../lib/motion/lenis';

/**
 * The single-page site, rendered at `/`.
 *
 * Section ids are the nav, scroll-spy and hash-link targets; keep them.
 * Each section component renders its own blueprint `Section` with its id
 * (about, experience, projects, skills, contact), so there are no wrapping
 * `<section id>` elements here.
 */
/** True once the hero has mostly scrolled out of view. */
function usePastHero() {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return undefined;
    const observer = new IntersectionObserver(([entry]) => setPast(entry.intersectionRatio < 0.3), {
      threshold: [0, 0.3, 1],
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);
  return past;
}

/** True while the contact section is meaningfully in view. */
function useContactVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let observer: IntersectionObserver | undefined;
    let timer: number | undefined;
    const attach = () => {
      const el = document.getElementById('contact');
      if (!el) {
        timer = window.setTimeout(attach, 200);
        return;
      }
      observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
        rootMargin: '0px 0px -40% 0px',
      });
      observer.observe(el);
    };
    attach();
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, []);
  return visible;
}

export default function HomePage() {
  // The hero already carries contact links; the floating CTA joins later.
  // Hidden again once the contact sheet itself is on screen.
  const pastHero = usePastHero();
  const atContact = useContactVisible();
  const showCta = pastHero && !atContact;
  return (
    <>
      <main id="main">
        <section id="hero">
          <Hero />
        </section>

        {/* Sheets 02-06. Each section renders its own blueprint <Section id>. */}
        <div className="bp-sheet relative">
          <About />
          <Experience />
          <Projects />
          <Skills />
          <Contact />
        </div>
      </main>

      <Footer />

      {/* Floating CTA */}
      <AnimatePresence>
        {showCta && (
          <motion.div
            className="fixed bottom-5 right-5 z-40 lg:bottom-8 lg:right-12"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                scrollToId('contact');
              }}
              className="flex h-11 items-center gap-2.5 border border-bp-line/60 bg-bp-bg/90 px-4 font-mono text-xs uppercase tracking-[0.12em] text-bp-ink backdrop-blur transition-colors hover:border-bp-signal"
            >
              <span aria-hidden="true" className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping bg-bp-signal/60 motion-reduce:hidden" />
                <span className="relative h-2 w-2 bg-bp-signal" />
              </span>
              Let's connect
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
