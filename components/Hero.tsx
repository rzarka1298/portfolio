import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { ArrowDownToLine, Github, Linkedin, Mail } from 'lucide-react';
import { featuredProjects, type FeaturedProject, type FeaturedProjectId } from '../content/featured';
import { selectProject } from '../lib/projectSelection';
import { scrollToId } from '../lib/motion/lenis';
import { trackVisit } from '../lib/analytics';
import { cn } from '../lib/utils';
import BlueprintGrid from './blueprint/BlueprintGrid';
import { CornerMarks } from './blueprint/BlueprintFrame';
import DrawPath from './blueprint/DrawPath';
import MagneticButton from './blueprint/MagneticButton';
import SignalEdge from './blueprint/SignalEdge';
import { DimensionedTitle } from './blueprint/Section';

const RESUME_URL = '/RugvedZarkar_Resume.pdf';

/**
 * Hero: "FIG. 01", a live system drawing. The name is the origin node,
 * wired to the featured projects. Edges are measured from the real DOM
 * layout, so the same markup draws a radial schematic on desktop and a
 * bus-and-branches diagram on phones. Text and links render immediately;
 * only the wiring animates.
 */
export default function Hero() {
  const [hovered, setHovered] = useState<FeaturedProjectId | null>(null);
  const { containerRef, coreRef, nodeRef, edges, size } = useWiring();

  const openProject = (id: FeaturedProjectId) => (event: MouseEvent) => {
    event.preventDefault();
    selectProject(id, { scroll: true, source: 'hero' });
  };

  return (
    <div className="relative isolate overflow-hidden">
      <BlueprintGrid className="-z-10" />

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[90rem] flex-col px-4 pb-10 pt-20 sm:px-6 lg:px-12">
        {/* Sheet border with registration marks. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-2 bottom-3 top-16 sm:inset-x-4 lg:inset-x-6">
          <CornerMarks size={14} className="text-bp-line/70" />
        </div>

        {/* Title row */}
        <div className="mb-8 flex items-center gap-3 lg:mb-10">
          <span className="bp-label text-bp-line">Fig. 01 / Hero</span>
          <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/40" />
          <span aria-hidden="true" className="bp-label hidden sm:inline">
            Sheet 01 / 06
          </span>
        </div>

        {/* Schematic */}
        <div
          ref={containerRef}
          className="relative grid flex-1 grid-cols-1 content-center gap-y-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)_minmax(0,1fr)] lg:grid-rows-[repeat(3,auto)] lg:gap-x-16 lg:gap-y-8 xl:gap-x-24"
        >
          {/* Wiring layer */}
          {size && (
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 -z-0 overflow-visible"
              width={size.w}
              height={size.h}
            >
              {edges.map((edge, i) => (
                <g key={edge.id}>
                  <SignalEdge
                    d={edge.d}
                    state={hovered === null ? 'idle' : hovered === edge.id ? 'active' : 'dimmed'}
                    delay={0.15 + i * 0.12}
                    duration={0.9}
                    speed={2.6 + (i % 3) * 0.45}
                  />
                  <rect
                    x={edge.pin[0] - 3}
                    y={edge.pin[1] - 3}
                    width={6}
                    height={6}
                    className={cn(
                      'transition-colors duration-300',
                      hovered === edge.id ? 'fill-bp-signal' : 'fill-background stroke-bp-line',
                    )}
                    strokeWidth={1}
                  />
                </g>
              ))}
            </svg>
          )}

          {/* Origin node */}
          <div
            ref={coreRef}
            className="relative z-10 mb-8 border border-bp-line/50 bg-bp-panel/95 p-6 backdrop-blur-[3px] sm:p-8 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:mb-0 lg:self-center"
          >
            <CornerMarks size={12} className="text-bp-line" />
            <span className="bp-label absolute -top-[0.4rem] left-5 bg-bp-bg px-1.5 text-bp-line">00 / Origin</span>

            <div>
              <DimensionedTitle
                as="h1"
                className="text-[clamp(3.25rem,13vw,4.5rem)] font-semibold leading-[0.92] tracking-[-0.035em] lg:text-[clamp(4.5rem,7vw,6.75rem)]"
              >
                <span className="block">Rugved</span> <span className="block">Zarkar</span>
              </DimensionedTitle>
            </div>

            <ul className="mt-6 space-y-1.5 font-mono text-sm uppercase tracking-[0.1em] text-bp-ink sm:text-base">
              <li>
                <span aria-hidden="true" className="text-bp-signal-ink">●</span> SWE Intern @ AWS
              </li>
              <li>CS @ UMD &rsquo;28</li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <MagneticButton
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId('projects');
                }}
                className="h-11 gap-2 bg-bp-signal px-5 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[hsl(214_74%_11%)] transition-colors hover:bg-bp-signal/90"
              >
                View my work
              </MagneticButton>
              <MagneticButton
                href={RESUME_URL}
                download="Rugved_Zarkar_Resume.pdf"
                onClick={() => trackVisit('/resume-download', 'hero')}
                className="h-11 gap-2 border border-bp-line/60 px-5 font-mono text-xs font-medium uppercase tracking-[0.12em] text-bp-ink transition-colors hover:border-bp-line hover:bg-bp-line/10"
              >
                <ArrowDownToLine className="h-3.5 w-3.5" aria-hidden="true" />
                Résumé
              </MagneticButton>
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-bp-line-soft/40 pt-5">
              {[
                { href: 'mailto:rugvedzarkar@gmail.com', label: 'Email', icon: Mail },
                { href: 'https://github.com/rzarka1298', label: 'GitHub', icon: Github },
                { href: 'https://www.linkedin.com/in/rugved-zarkar', label: 'LinkedIn', icon: Linkedin },
              ].map(({ href, label, icon: Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="group inline-flex items-center gap-2 py-1 font-mono text-xs uppercase tracking-[0.12em] text-bp-ink-dim transition-colors hover:text-bp-ink"
                  >
                    <Icon className="h-3.5 w-3.5 text-bp-line" aria-hidden="true" />
                    <span className="underline-offset-4 group-hover:underline">{label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Project nodes */}
          <h2 className="sr-only">Selected projects</h2>
          {featuredProjects.map((project, i) => (
            <ProjectNode
              key={project.id}
              project={project}
              placement={PLACEMENT[i]}
              nodeRef={nodeRef(project.id)}
              active={hovered === project.id}
              dimmed={hovered !== null && hovered !== project.id}
              onHover={setHovered}
              onOpen={openProject(project.id)}
            />
          ))}

          {/* Legend (desktop) */}
          <div
            aria-hidden="true"
            className="hidden self-end justify-self-start border border-bp-line-soft/40 bg-bp-bg/70 px-4 py-3 lg:col-start-3 lg:row-start-3 lg:block"
          >
            <div className="bp-label mb-2.5 text-bp-line">Legend</div>
            <ul className="space-y-1.5 font-mono text-[0.6875rem] text-bp-ink-dim">
              <li className="flex items-center gap-2.5">
                <span className="h-px w-6 bg-bp-line" /> Wire
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex w-6 justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-bp-line shadow-[0_0_6px_hsl(var(--bp-line))]" />
                </span>
                Signal
              </li>
              <li className="flex items-center gap-2.5">
                <span className="h-0.5 w-6 bg-bp-signal" /> Selected
              </li>
            </ul>
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="bp-label max-w-md normal-case leading-relaxed tracking-[0.04em]">
            <span className="uppercase tracking-[0.12em] text-bp-line">Fig. 01</span> Selected projects. Select one to
            open it below.
          </p>
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollToId('about');
            }}
            className="group inline-flex items-center gap-3 self-start font-mono text-xs uppercase tracking-[0.12em] text-bp-ink-dim transition-colors hover:text-bp-ink sm:self-auto"
          >
            <svg aria-hidden="true" width="12" height="36" viewBox="0 0 12 36" className="overflow-visible">
              <path d="M6 0 V36" className="stroke-bp-line-soft/50" strokeWidth={1} fill="none" />
              <DrawPath d="M6 0 V36" draw="scroll" start="top 95%" end="bottom 30%" className="stroke-bp-signal" />
              <path d="M2 31 L6 36 L10 31" className="stroke-bp-signal" strokeWidth={1} fill="none" />
            </svg>
            See sheet 02: About
          </a>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Desktop grid placement for each featured project, in order. */
const PLACEMENT = [
  'lg:col-start-1 lg:row-start-1',
  'lg:col-start-3 lg:row-start-1',
  'lg:col-start-1 lg:row-start-2',
  'lg:col-start-3 lg:row-start-2',
  'lg:col-start-1 lg:row-start-3',
];

interface ProjectNodeProps {
  project: FeaturedProject;
  placement: string;
  nodeRef: (el: HTMLElement | null) => void;
  active: boolean;
  dimmed: boolean;
  onHover: (id: FeaturedProjectId | null) => void;
  onOpen: (event: MouseEvent) => void;
}

function ProjectNode({ project, placement, nodeRef, active, dimmed, onHover, onOpen }: ProjectNodeProps) {
  const left = placement.includes('col-start-1');
  return (
    <a
      ref={nodeRef}
      href="#projects"
      onClick={onOpen}
      onPointerEnter={() => onHover(project.id)}
      onPointerLeave={() => onHover(null)}
      onFocus={() => onHover(project.id)}
      onBlur={() => onHover(null)}
      aria-label={`${project.title}: ${project.result}. Open in Projects.`}
      className={cn(
        'group relative z-10 ml-10 block border bg-bp-panel/95 px-4 py-3.5 backdrop-blur-[2px] transition-[border-color,opacity,background-color] duration-300 sm:ml-12 lg:ml-0 lg:w-full lg:max-w-[18.5rem] lg:self-center',
        left ? 'lg:justify-self-end' : 'lg:justify-self-start',
        active ? 'border-bp-signal bg-bp-panel-2' : 'border-bp-line-soft/60',
        dimmed && 'opacity-55',
        placement,
      )}
    >
      <CornerMarks size={6} className={active ? 'text-bp-signal' : 'text-bp-line'} />
      <div className="flex items-center justify-between gap-3">
        <span className={cn('bp-label', active ? 'text-bp-signal-ink' : 'text-bp-line')}>{project.partNo}</span>
        <span
          aria-hidden="true"
          className={cn(
            'h-1.5 w-1.5 transition-colors duration-300',
            active ? 'bg-bp-signal shadow-[0_0_8px_hsl(var(--bp-signal))]' : 'bg-bp-line-soft',
          )}
        />
      </div>
      <div className="mt-2 font-display text-lg font-medium leading-tight text-bp-ink">{project.title}</div>
      <div className="mt-1 text-sm leading-snug text-bp-ink-dim">{project.result}</div>
      <div className="mt-2.5 font-mono text-[0.6875rem] tracking-[0.04em] text-bp-line-soft">
        {project.stack.join(' / ')}
      </div>
    </a>
  );
}

/* ------------------------------------------------------------------ */

interface Edge {
  id: FeaturedProjectId;
  d: string;
  /** Where the wire leaves the origin node. */
  pin: [number, number];
}

/**
 * Measures the origin node and each project node relative to the schematic
 * container and routes an orthogonal wire to each. Re-routes on resize and
 * once web fonts settle.
 */
function useWiring() {
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<FeaturedProjectId, HTMLElement>());
  const [edges, setEdges] = useState<Edge[]>([]);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const refCallbacks = useRef(new Map<FeaturedProjectId, (el: HTMLElement | null) => void>());
  const nodeRef = useCallback((id: FeaturedProjectId) => {
    let cb = refCallbacks.current.get(id);
    if (!cb) {
      cb = (el) => {
        if (el) nodes.current.set(id, el);
        else nodes.current.delete(id);
      };
      refCallbacks.current.set(id, cb);
    }
    return cb;
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const core = coreRef.current;
    if (!container || !core) return undefined;

    const measure = () => {
      const box = container.getBoundingClientRect();
      const rel = (el: Element) => {
        const r = el.getBoundingClientRect();
        return { l: r.left - box.left, t: r.top - box.top, r: r.right - box.left, b: r.bottom - box.top };
      };
      const c = rel(core);
      const placed = featuredProjects
        .map((project) => ({ project, el: nodes.current.get(project.id) }))
        .filter((x): x is { project: FeaturedProject; el: HTMLElement } => !!x.el)
        .map(({ project, el }) => ({ project, n: rel(el) }));
      const left = placed.filter(({ n }) => n.r <= c.l + 1);
      const right = placed.filter(({ n }) => n.l >= c.r - 1);
      // Pins are spread evenly down each side of the origin node, so wires
      // leave it like a connector header and elbow out to their targets.
      const pinY = (k: number, count: number) => c.t + ((c.b - c.t) * (k + 1)) / (count + 1);
      const next: Edge[] = [];
      for (const { project, n } of placed) {
        const ny = Math.round((n.t + n.b) / 2);
        let d: string;
        let pin: [number, number];
        const li = left.findIndex((x) => x.project.id === project.id);
        const ri = right.findIndex((x) => x.project.id === project.id);
        if (ri >= 0) {
          const sy = Math.round(pinY(ri, right.length));
          const mid = Math.round((c.r + n.l) / 2);
          d = Math.abs(sy - ny) < 2 ? `M${c.r} ${sy} H${n.l}` : `M${c.r} ${sy} H${mid} V${ny} H${n.l}`;
          pin = [c.r, sy];
        } else if (li >= 0) {
          const sy = Math.round(pinY(li, left.length));
          const mid = Math.round((c.l + n.r) / 2);
          d = Math.abs(sy - ny) < 2 ? `M${c.l} ${sy} H${n.r}` : `M${c.l} ${sy} H${mid} V${ny} H${n.r}`;
          pin = [c.l, sy];
        } else {
          // Stacked layout: a bus runs down the left from the origin's base.
          const x = c.l + 18;
          d = `M${x} ${c.b} V${ny} H${n.l}`;
          pin = [x, c.b];
        }
        next.push({ id: project.id, d, pin });
      }
      setEdges(next);
      setSize({ w: box.width, h: box.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(core);
    let alive = true;
    void document.fonts?.ready.then(() => alive && measure());
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, []);

  return { containerRef, coreRef, nodeRef, edges, size };
}
