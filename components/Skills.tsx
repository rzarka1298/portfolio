import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Marquee, Section, useReducedMotion } from './blueprint';
import { cn } from '../lib/utils';

interface Group {
  /** Designator prefix, as on a schematic: LNG-01, ML-04 ... */
  code: string;
  name: string;
  parts: string[];
}

const groups: Group[] = [
  {
    code: 'LNG',
    name: 'Languages',
    parts: ['Python', 'Java', 'TypeScript', 'JavaScript', 'Go', 'SQL', 'C', 'C++', 'MATLAB', 'HTML/CSS'],
  },
  {
    code: 'ML',
    name: 'AI & Machine Learning',
    parts: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'HuggingFace', 'LangChain', 'llama-index', 'Weaviate', 'FAISS', 'Diffusion Models'],
  },
  {
    code: 'INF',
    name: 'Cloud & Infrastructure',
    parts: ['AWS', 'Docker', 'Linux', 'Terraform', 'Ansible', 'Temporal', 'DNSDist', 'Unbound', 'Grafana'],
  },
  {
    code: 'WEB',
    name: 'Web & Frameworks',
    parts: ['React.js', 'Node.js', 'FastAPI', 'Tailwind CSS', 'REST APIs', 'MySQL', 'Supabase'],
  },
  {
    code: 'TL',
    name: 'Developer Tools',
    parts: ['Git', 'GitHub', 'Bash', 'OpenTelemetry', 'Vite', 'systemd'],
  },
  {
    code: 'CRT',
    name: 'Certifications',
    parts: ['AWS Certified Cloud Practitioner', 'AWS Solutions Architect', 'Autodesk Fusion Certified'],
  },
];

const total = groups.reduce((n, g) => n + g.parts.length, 0);
const tickerItems = groups
  .filter((g) => g.code !== 'CRT')
  .flatMap((g) => g.parts)
  .map((name) => (
    <span key={name} className="font-mono text-sm uppercase tracking-[0.1em] text-bp-ink-dim">
      {name}
    </span>
  ));

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Sheet 05: skills as a component library. Each skill is drawn as a chip
 * package with a designator; the bill of materials beside it doubles as
 * the group filter. One ticker band runs the whole stack underneath.
 */
export default function Skills() {
  const [filter, setFilter] = useState<string>('all');
  const reduced = useReducedMotion();
  const visible = filter === 'all' ? groups : groups.filter((g) => g.code === filter);

  return (
    <Section
      id="skills"
      index={5}
      label="Skills"
      title="Skills and technologies"
      intro="The parts I build with, grouped like a bill of materials. Pick a group to filter the library."
      className="overflow-x-clip"
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-14">
        {/* Bill of materials: the filter */}
        <div className="lg:order-2">
          <div className="lg:sticky lg:top-28">
            <div className="relative border border-bp-line/50 bg-bp-panel">
              <span className="bp-label absolute -top-[0.4rem] left-4 bg-background px-1.5 text-bp-line">
                BOM / Filter
              </span>
              <div aria-hidden="true" className="grid grid-cols-[3.25rem_1fr_2rem] gap-2 border-b border-bp-line-soft/40 px-4 pb-2 pt-5">
                <span className="bp-label">Ref</span>
                <span className="bp-label">Group</span>
                <span className="bp-label text-right">Qty</span>
              </div>
              <ul aria-label="Filter skills by group">
                {[{ code: 'all', name: 'All parts', parts: { length: total } }, ...groups].map((g) => {
                  const active = filter === g.code;
                  return (
                    <li key={g.code}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter(g.code)}
                        className={cn(
                          'relative grid w-full grid-cols-[3.25rem_1fr_2rem] items-center gap-2 border-b border-bp-line-soft/20 px-4 py-2.5 text-left transition-colors last:border-b-0',
                          active ? 'bg-bp-panel-2' : 'hover:bg-bp-panel-2/60',
                        )}
                      >
                        {active && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-bp-signal" />}
                        <span className={cn('bp-label', active ? 'text-bp-signal-ink' : 'text-bp-line')}>
                          {g.code === 'all' ? '*' : g.code}
                        </span>
                        <span className={cn('text-sm', active ? 'text-bp-ink' : 'text-bp-ink-dim')}>{g.name}</span>
                        <span className="text-right font-mono text-xs tabular-nums text-bp-ink-dim">
                          {g.parts.length}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Component library */}
        <div className="min-w-0 lg:order-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={filter}
              className="space-y-12"
              initial={reduced ? false : { clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              exit={reduced ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              {visible.map((group) => (
                <section key={group.code} aria-labelledby={`skills-${group.code}`}>
                  <div className="mb-6 flex items-center gap-3">
                    <span className="bp-label text-bp-line">{group.code}</span>
                    <h3 id={`skills-${group.code}`} className="font-display text-xl font-medium text-bp-ink">
                      {group.name}
                    </h3>
                    <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/40" />
                    <span className="bp-label">
                      {group.parts.length} {group.parts.length === 1 ? 'part' : 'parts'}
                    </span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
                    {group.parts.map((part, i) => (
                      <Chip key={part} designator={`${group.code}-${String(i + 1).padStart(2, '0')}`} name={part} />
                    ))}
                  </ul>
                </section>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-16 border-y border-bp-line-soft/40 py-4">
        <Marquee items={tickerItems} label="Full stack" duration={60} className="pr-9" />
      </div>
    </Section>
  );
}

/** A skill drawn as a chip package: pin rows, a notch and a designator. */
function Chip({ designator, name }: { designator: string; name: string }) {
  const wide = name.length > 18;
  return (
    <li className={cn('bom-chip group relative', wide && 'col-span-2')}>
      <span aria-hidden="true" className="bom-pins absolute inset-x-3 -top-[5px] h-[5px]" />
      <span aria-hidden="true" className="bom-pins absolute inset-x-3 -bottom-[5px] h-[5px]" />
      <div className="relative flex min-h-[4rem] items-end border border-bp-line/50 bg-bp-panel px-4 pb-3 pt-6 transition-colors duration-200 group-hover:border-bp-line group-hover:bg-bp-panel-2">
        <span
          aria-hidden="true"
          className="absolute left-[-1px] top-1/2 h-4 w-2 -translate-y-1/2 rounded-r-full border border-l-0 border-bp-line/50 bg-background"
        />
        <span aria-hidden="true" className="bp-label absolute left-4 top-2 text-[0.625rem] text-bp-line-soft">
          {designator}
        </span>
        <span aria-hidden="true" className="absolute right-2 top-2 h-1 w-1 rounded-full bg-bp-line-soft/60 transition-colors group-hover:bg-bp-signal" />
        <span className="font-mono text-[0.8125rem] leading-snug text-bp-ink">{name}</span>
      </div>
    </li>
  );
}
