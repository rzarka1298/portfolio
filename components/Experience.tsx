import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Section, useGsapContext } from './blueprint';
import { cn } from '../lib/utils';
import { experienceStats, firstYear, roles, type Role } from './sections/experienceData';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Sheet 03: experience as a signal trace. A vertical bus runs down the
 * roles; as you scroll, an orange signal travels along it (GSAP
 * ScrollTrigger, Lenis-synced) and each role "powers on" when the signal
 * reaches its pad. A sticky readout on large screens shows the role the
 * signal is at (or the one you're hovering).
 *
 * Unanimated state = finished state: every role is fully lit. The dimmed
 * "standby" look only exists once the scroll scene is armed, and is never
 * below readable contrast.
 */
export default function Experience() {
  const [live, setLive] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const sceneRef = useGsapContext<HTMLDivElement>(({ gsap, ScrollTrigger }) => {
    const scene = sceneRef.current;
    const track = scene?.querySelector<HTMLElement>('.xp-track');
    const fill = scene?.querySelector<HTMLElement>('.xp-fill');
    const head = scene?.querySelector<HTMLElement>('.xp-head');
    if (!scene || !track || !fill || !head) return undefined;

    const entries = Array.from(scene.querySelectorAll<HTMLElement>('.xp-entry'));
    let offsets: number[] = [];
    let current = -2;

    const measure = () => {
      const top = track.getBoundingClientRect().top;
      offsets = entries.map((entry) => {
        const pad = entry.querySelector<HTMLElement>('.xp-pad') ?? entry;
        const r = pad.getBoundingClientRect();
        return r.top + r.height / 2 - top;
      });
    };
    const apply = (progress: number) => {
      const y = progress * track.offsetHeight;
      let last = -1;
      entries.forEach((entry, i) => {
        const on = offsets[i] <= y + 1;
        entry.classList.toggle('is-on', on);
        if (on) last = i;
      });
      if (last !== current) {
        current = last;
        setLive(last);
      }
    };

    scene.dataset.scene = 'armed';
    const range = { trigger: track, start: 'top 62%', end: 'bottom 62%' };
    gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { ...range, scrub: true } });
    gsap.fromTo(
      head,
      { y: 0 },
      {
        y: () => track.offsetHeight,
        ease: 'none',
        scrollTrigger: { ...range, scrub: true, invalidateOnRefresh: true },
      },
    );
    ScrollTrigger.create({
      ...range,
      onRefresh: (self) => {
        measure();
        apply(self.progress);
      },
      onUpdate: (self) => apply(self.progress),
    });

    return () => {
      delete scene.dataset.scene;
      entries.forEach((entry) => entry.classList.remove('is-on'));
      setLive(null);
    };
  }, []);

  // Readout: hovered role, else where the signal is, else the newest role.
  const shown = hovered ?? (live !== null && live >= 0 ? live : 0);
  const powered = live === null ? roles.length : live + 1;

  return (
    <Section
      id="experience"
      index={3}
      label="Experience"
      title="Experience"
      className="overflow-x-clip"
    >
      <div ref={sceneRef} className="xp-scene grid gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        {/* Sticky readout (large screens) */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <Readout role={roles[shown]} index={shown} powered={powered} live={live !== null} />
            <Stats className="mt-10" />
          </div>
        </aside>

        {/* The trace */}
        <div className="xp-track relative">
          <div aria-hidden="true" className="absolute bottom-0 left-[11px] top-0 w-px bg-bp-line-soft/50" />
          <div
            aria-hidden="true"
            className="xp-fill absolute bottom-0 left-[10px] top-0 hidden w-[3px] origin-top bg-bp-signal shadow-[0_0_14px_hsl(var(--bp-signal)/0.8)]"
          />
          <div
            aria-hidden="true"
            className="xp-head absolute -top-[7px] left-[4px] hidden h-[15px] w-[15px] rounded-full border-2 border-bp-signal bg-background shadow-[0_0_18px_4px_hsl(var(--bp-signal)/0.55)]"
          >
            <span className="absolute inset-[3px] rounded-full bg-bp-signal" />
          </div>

          <ol className="xp-list space-y-8 md:space-y-10">
            {roles.map((role, i) => (
              <Entry
                key={role.ref}
                role={role}
                onEnter={() => setHovered(i)}
                onLeave={() => setHovered((h) => (h === i ? null : h))}
              />
            ))}
          </ol>

          {/* Bus terminator */}
          <div aria-hidden="true" className="mt-8 flex items-center gap-3 pl-[5px]">
            <span className="h-[13px] w-[13px] border border-bp-line-soft" />
            <span className="bp-label">End of trace / {firstYear}</span>
          </div>
        </div>

        <Stats className="lg:hidden" />
      </div>
    </Section>
  );
}

function Entry({ role, onEnter, onLeave }: { role: Role; onEnter: () => void; onLeave: () => void }) {
  return (
    <li className="xp-entry group/xp relative pl-11 md:pl-16" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {/* Pad on the bus and the branch trace to the card */}
      <span aria-hidden="true" className="xp-pad absolute left-0 top-7 flex h-[23px] w-[23px] items-center justify-center border border-bp-line bg-background">
        <span className="xp-pad-core h-[9px] w-[9px] rounded-full bg-bp-line" />
      </span>
      <svg aria-hidden="true" className="absolute left-[23px] top-[26px] h-5 w-[21px] overflow-visible md:w-[41px]" preserveAspectRatio="none">
        <path className="xp-branch hidden md:block" d="M0 12.5 H12 L20 4.5 H41" fill="none" strokeWidth={1} />
        <path className="xp-branch md:hidden" d="M0 12.5 H21" fill="none" strokeWidth={1} />
      </svg>

      <article className="xp-card relative border border-bp-line-soft/40 bg-bp-panel/90 p-5 backdrop-blur-[2px] sm:p-7">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="xp-ref bp-label text-bp-line">{role.ref}</span>
          <span className="bp-label text-bp-ink">{role.period}</span>
          <span className="bp-label normal-case tracking-[0.04em]">{role.location}</span>
          <TypeTag type={role.type} />
        </header>

        <h3 className="mt-4 font-display text-2xl font-medium leading-tight text-bp-ink sm:text-[1.75rem]">
          {role.title}
        </h3>
        <p className="mt-1 text-base text-bp-line">{role.company}</p>

        <ul className="mt-5 max-w-[68ch] space-y-2.5">
          {role.achievements.map((item) => (
            <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-bp-ink">
              <span aria-hidden="true" className="mt-[0.6em] h-px w-3 shrink-0 bg-bp-line" />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-6 border-t border-bp-line-soft/30 pt-4 font-mono text-xs leading-relaxed text-bp-line">
          <span className="sr-only">Stack: </span>
          {role.technologies.join(' / ')}
        </p>
      </article>
    </li>
  );
}

function TypeTag({ type }: { type: Role['type'] }) {
  const current = type === 'Current';
  return (
    <span
      className={cn(
        'bp-label inline-flex items-center gap-1.5 border px-2 py-1',
        current ? 'border-bp-signal/60 text-bp-signal-ink' : 'border-bp-line-soft/50',
      )}
    >
      {current && (
        <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-bp-signal/70 motion-reduce:hidden" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-bp-signal" />
        </span>
      )}
      {type}
    </span>
  );
}

function Readout({ role, index, powered, live }: { role: Role; index: number; powered: number; live: boolean }) {
  return (
    <div aria-hidden="true" className="relative border border-bp-line-soft/40 bg-bp-panel/80 p-5">
      <span className="bp-label absolute -top-[0.4rem] left-4 bg-background px-1.5 text-bp-line">Fig. 03 / Readout</span>

      <div className="relative h-[4.5rem] overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={role.year}
            initial={{ y: '100%' }}
            animate={{ y: '0%' }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.45, ease: EASE }}
            className="font-display text-[4.25rem] font-semibold leading-none tracking-[-0.04em] text-bp-ink tabular-nums"
          >
            {role.year}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="bp-label text-bp-line">
          {role.ref} / {String(roles.length).padStart(2, '0')}
        </span>
        <span className={cn('bp-label', live && powered === 0 ? '' : 'text-bp-signal-ink')}>
          {live && powered === 0 ? 'Standby' : 'Powered'}
        </span>
      </div>

      {/* LED bar: one segment per role, lit as the signal reaches it */}
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${roles.length}, minmax(0, 1fr))` }}>
        {roles.map((r, i) => (
          <span
            key={r.ref}
            className={cn(
              'h-2 transition-colors duration-300',
              i < powered ? 'bg-bp-signal' : 'bg-bp-line-soft/30',
              i === index && 'outline outline-1 outline-offset-1 outline-bp-line',
            )}
          />
        ))}
      </div>

      <div className="mt-5 border-t border-bp-line-soft/30 pt-4">
        <p className="font-display text-lg leading-snug text-bp-ink">{role.short}</p>
        <p className="mt-1 text-sm leading-snug text-bp-ink-dim">{role.title}</p>
        <p className="bp-label mt-3 normal-case tracking-[0.04em]">{role.period}</p>
      </div>
    </div>
  );
}

function Stats({ className }: { className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-px border border-bp-line-soft/40 bg-bp-line-soft/40', className)}>
      {experienceStats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse gap-1 bg-background p-4">
          <dt className="bp-label normal-case tracking-[0.04em]">{stat.label}</dt>
          <dd className="font-display text-3xl font-medium leading-none text-bp-ink">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
