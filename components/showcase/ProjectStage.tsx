import { motion, type Variants } from 'framer-motion';
import { ExternalLink, FileText, Github, Pause, Play, SkipForward } from 'lucide-react';
import { useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { CornerMarks, MagneticButton } from '../blueprint';
import { cn } from '../../lib/utils';
import SchematicPreview from './SchematicPreview';
import type { ShowcaseProject } from './showcaseData';
import { useOnScreen, useTracePlayer } from './useTracePlayer';

const EASE = [0.22, 1, 0.36, 1] as const;

const list: Variants = {
  hidden: {},
  show: (delay: number) => ({ transition: { staggerChildren: 0.06, delayChildren: delay } }),
};
const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};
const rise: Variants = {
  hidden: { y: '105%' },
  show: { y: '0%', transition: { duration: 0.6, ease: EASE } },
};

export interface ProjectStageProps {
  project: ShowcaseProject;
  /** 1-based position, for the figure number. */
  position: number;
  total: number;
  variant: 'desktop' | 'mobile';
  /** The visible tab: autoplay and the redraw only run here. */
  active: boolean;
  reduced: boolean;
  /** Seconds the entrance waits (the desktop wipe leads). */
  enterDelay?: number;
  /** id of the heading, for the tabpanel's aria-labelledby. */
  headingId: string;
}

export default function ProjectStage({
  project,
  position,
  total,
  variant,
  active,
  reduced,
  enterDelay = 0,
  headingId,
}: ProjectStageProps) {
  const desktop = variant === 'desktop';
  const rootRef = useRef<HTMLDivElement>(null);
  const onScreen = useOnScreen(rootRef, 0.35);
  const [inspecting, setInspecting] = useState(false);
  const architecture = project.page?.architecture;
  const trace = architecture?.traces[0];
  const stepCount = trace?.steps.length ?? 0;
  const player = useTracePlayer(stepCount, { enabled: active && onScreen && !reduced, hold: inspecting });
  const step = trace && player.index >= 0 ? trace.steps[player.index] : undefined;
  const animate = !reduced;
  const fig = `FIG. 04.${position}`;
  const navigate = useNavigate();
  const caseStudy = project.page ? `/projects/${project.slug}` : undefined;

  const openCaseStudy = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!caseStudy || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(caseStudy);
  };

  // Tall figures (Command Center, BiasGPT, this site) lose too much scale in a
  // stacked stage, so on desktop they sit beside a narrow info column.
  const side = desktop && !!architecture && aspectOf(architecture) < 1.65;
  const wide = desktop && !side;

  const docsLabel = project.links.docs?.includes('arxiv') ? 'Paper' : 'Docs';
  const liveLabel = project.links.live?.includes('/publication') ? 'Publication' : 'Live';

  return (
    <div ref={rootRef} className={cn('relative flex min-h-0 flex-col border border-bp-line/40 bg-bp-bg', 'h-full')}>
      <CornerMarks className="text-bp-line" size={desktop ? 12 : 9} />

      {/* Title block: figure label + status */}
      <div className="flex items-center gap-3 border-b border-bp-line-soft/40 px-4 py-2.5 sm:px-5">
        <span className="bp-label shrink-0 text-bp-signal-ink">{project.partNo}</span>
        <span className="bp-label shrink-0 text-bp-line">
          {fig}
          <span className="hidden sm:inline"> / Architecture</span>
        </span>
        <span aria-hidden="true" className="h-px min-w-4 flex-1 bg-bp-line-soft/40" />
        {project.status && (
          <span className="bp-label hidden max-w-[45%] truncate md:inline" title={project.status}>
            {project.status}
          </span>
        )}
        <span className="bp-label shrink-0 tabular-nums">
          {String(position).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-col',
          desktop && 'flex-1',
          side && 'grid grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,27rem)]',
        )}
      >
        <div className={cn('flex min-h-0 flex-col', desktop && 'flex-1', side && 'border-r border-bp-line-soft/40')}>
          {/* Diagram */}
          <div
            className={cn(
              'bp-grid relative overflow-hidden border-b border-bp-line-soft/40',
              desktop ? 'min-h-[220px] flex-1' : 'h-60',
            )}
          >
            {architecture ? (
              <SchematicPreview
                // Remount on activation so the redraw plays each time the tab opens.
                key={active ? 'on' : 'off'}
                architecture={architecture}
                stepIndex={player.index}
                staticTrace={reduced}
                animateIn={animate && active}
                delay={enterDelay}
                onInspect={setInspecting}
                label={`${project.name} architecture: ${architecture.nodes.length} components. Select one for a summary.`}
                className="p-3 sm:p-5"
              />
            ) : project.image ? (
              <ImageWithFallback src={project.image} alt={project.name} className="h-full w-full object-cover opacity-90" />
            ) : null}
          </div>

          {/* Trace strip */}
          {trace && (
            <div
              className={cn(
                'relative flex min-h-[2.75rem] items-center gap-3 border-bp-line-soft/40 px-4 py-1.5 sm:px-5',
                !side && 'border-b',
              )}
            >
              <div className="flex min-w-0 flex-1 items-baseline gap-2.5" aria-live={player.running ? 'off' : 'polite'}>
                <span className="bp-label shrink-0 text-bp-line">Trace</span>
                <span className="bp-label shrink-0 tabular-nums text-bp-signal-ink">
                  {step
                    ? `${String(player.index + 1).padStart(2, '0')}/${String(stepCount).padStart(2, '0')}`
                    : reduced
                      ? 'All'
                      : '--/--'}
                </span>
                <span className={cn('min-w-0 text-sm text-bp-ink', desktop ? 'truncate' : 'line-clamp-2 leading-snug')}>
                  {step ? step.title : trace.name}
                  {!step && <span className="text-bp-ink-dim">{reduced ? ': main path highlighted' : ''}</span>}
                </span>
                {step && <span className="hidden min-w-0 shrink truncate text-xs text-bp-ink-dim xl:inline">{trace.name}</span>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!reduced && (
                  <button
                    type="button"
                    onClick={player.toggle}
                    aria-label={player.paused ? 'Play trace' : 'Pause trace'}
                    className="flex h-9 w-9 items-center justify-center border border-bp-line/40 text-bp-line transition-colors hover:border-bp-line hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
                  >
                    {player.paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={player.next}
                  aria-label="Next trace step"
                  className="flex h-9 w-9 items-center justify-center border border-bp-line/40 text-bp-line transition-colors hover:border-bp-line hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
                >
                  <SkipForward className="h-4 w-4" />
                </button>
              </div>
              {/* Progress through the trace */}
              <span
                aria-hidden="true"
                className="absolute -bottom-px left-0 h-px w-full origin-left bg-bp-signal transition-transform duration-700 ease-blueprint"
                style={{ transform: `scaleX(${step ? (player.index + 1) / stepCount : 0})` }}
              />
            </div>
          )}
        </div>

        {/* Overview: title + summary + links | problem, stats, stack */}
        <motion.div
          className={cn(
            'grid gap-x-10 gap-y-5 px-4 py-5 sm:px-5',
            wide && 'grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] grid-rows-[auto_1fr] xl:px-7',
            side && 'min-h-0 auto-rows-max content-start overflow-y-auto xl:px-7 xl:py-6',
          )}
          data-lenis-prevent={side ? '' : undefined}
          variants={list}
          custom={enterDelay + 0.25}
          initial={animate && active ? 'hidden' : false}
          animate="show"
        >
          <div className={cn('min-w-0', wide && 'col-start-1 row-start-1')}>
            <h3
              id={headingId}
              className="overflow-hidden pb-1 font-display text-3xl font-medium leading-[1.05] text-bp-ink sm:text-4xl"
            >
              <motion.span className="block" variants={rise}>
                {project.name}
              </motion.span>
            </h3>
            <motion.p variants={item} className="mt-2.5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-bp-ink-dim">
              {project.overview}
            </motion.p>
            <motion.ul variants={item} className="mt-4 flex flex-wrap gap-1.5" aria-label="Tech stack">
              {project.chips.map((chip) => (
                <li
                  key={chip}
                  className="border border-bp-line-soft/60 px-2 py-1 font-mono text-[0.6875rem] leading-none text-bp-line"
                >
                  {chip}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className={cn('flex min-w-0 flex-col gap-4', wide && 'col-start-2 row-span-2 row-start-1')}>
            <motion.p variants={item} className="border-l-2 border-bp-signal/80 pl-3 text-sm leading-relaxed text-bp-ink">
              <span className="mb-1 block font-mono text-[0.625rem] uppercase tracking-[0.14em] text-bp-signal-ink">Problem</span>
              {project.problem}
            </motion.p>
            <motion.dl variants={item} className={cn('grid gap-4', project.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
              {project.stats.map((s) => (
                <div key={s.label} className="flex min-w-0 flex-col-reverse justify-end border-t border-bp-line/50 pt-2">
                  <dt className="mt-1.5 text-xs leading-snug text-bp-ink-dim">{s.label}</dt>
                  <dd className="font-display text-xl font-medium leading-none text-bp-ink tabular-nums xl:text-2xl">
                    {s.value}
                  </dd>
                </div>
              ))}
            </motion.dl>
          </div>

          <motion.div
            variants={item}
            className={cn('flex flex-wrap items-center gap-2', wide && 'col-start-1 row-start-2 self-end')}
          >
            {caseStudy && (
              <MagneticButton
                href={caseStudy}
                onClick={openCaseStudy}
                className="group/cta inline-flex h-11 items-center gap-2 bg-bp-signal px-5 font-mono text-xs uppercase tracking-[0.12em] text-[hsl(var(--bp-bg))] transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-line focus-visible:ring-offset-2 focus-visible:ring-offset-bp-bg"
                aria-label={`Open the ${project.name} case study`}
              >
                Open case study
                <span aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-1">
                  →
                </span>
              </MagneticButton>
            )}
            {project.links.github && (
              <a
                href={project.links.github}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} on GitHub (opens in a new tab)`}
                className="inline-flex h-11 items-center gap-2 border border-bp-line/50 px-3.5 font-mono text-xs uppercase tracking-[0.12em] text-bp-ink transition-colors hover:border-bp-line hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
              >
                <Github className="h-4 w-4" aria-hidden="true" /> GitHub
              </a>
            )}
            {project.links.live && (
              <a
                href={project.links.live}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} ${liveLabel.toLowerCase()} (opens in a new tab)`}
                className="inline-flex h-11 items-center gap-2 border border-bp-line/50 px-3.5 font-mono text-xs uppercase tracking-[0.12em] text-bp-ink transition-colors hover:border-bp-line hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> {liveLabel}
              </a>
            )}
            {project.links.docs && !project.links.live && docsLabel === 'Paper' && (
              <a
                href={project.links.docs}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.name} paper (opens in a new tab)`}
                className="inline-flex h-11 items-center gap-2 border border-bp-line/50 px-3.5 font-mono text-xs uppercase tracking-[0.12em] text-bp-ink transition-colors hover:border-bp-line hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
              >
                <FileText className="h-4 w-4" aria-hidden="true" /> {docsLabel}
              </a>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/** Width / height of a figure's node layout, in canvas units. */
function aspectOf(architecture: NonNullable<ShowcaseProject['page']>['architecture']) {
  const xs = architecture.nodes.map((n) => n.x);
  const ys = architecture.nodes.map((n) => n.y);
  const w = Math.max(...xs) - Math.min(...xs) + 200;
  const h = Math.max(...ys) - Math.min(...ys) + 72;
  return w / h;
}
