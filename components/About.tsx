import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Annotation, CornerMarks, DrawPath, Section, useReducedMotion } from './blueprint';
import PortfolioViews from './PortfolioViews';

const EASE = [0.22, 1, 0.36, 1] as const;

const disciplines = [
  { ref: 'D-01', title: 'Infrastructure engineer', text: 'Scaling DNS and cloud platforms to 1M+ QPS at AWS and IBM' },
  { ref: 'D-02', title: 'AI/ML engineer', text: 'Building RAG systems, diffusion models and agent orchestration' },
  { ref: 'D-03', title: 'Research assistant', text: 'Published wearable robotics work at ACM IMWUT with UMIACS' },
  { ref: 'D-04', title: 'Founder', text: 'Bootstrapped an AI startup to $20K+ ARR and 20+ people' },
];

const education = {
  school: 'University of Maryland, College Park',
  degree: 'Bachelor of Science in Computer Science',
  graduation: 'Expected December 2027',
  gpa: '3.83 / 4.00',
  coursework: [
    'Advanced Data Structures',
    'Machine Learning',
    'Compilers',
    'Computer Vision',
    'Operating Systems',
    'Database Systems',
    'Algorithms',
    'Object-Oriented Programming',
  ],
};

const stats = [
  { value: '6+', label: 'Years of experience' },
  { value: '8', label: 'Professional roles' },
  { value: '30+', label: 'Technologies used' },
  { value: '3.83', label: 'GPA at UMD' },
];

/**
 * Sheet 02: About, laid out as a drawing. A portrait plate with dimension
 * lines and callouts, the bio as the drawing's notes, and a title-block
 * spec table (disciplines, education, figures) underneath. Everything is
 * readable at first paint; only linework and the scan line animate.
 */
export default function About() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <Section
      id="about"
      index={2}
      label="About"
      title="Between infrastructure and AI"
      className="overflow-x-clip"
    >
      <div ref={ref} className="grid gap-12 lg:grid-cols-12 lg:gap-14">
        <Portrait inView={isInView} />

        {/* Notes: the bio */}
        <div className="lg:col-span-7 lg:pt-8">
          <div className="space-y-5 bg-background/90 text-lg leading-relaxed text-bp-ink lg:py-2">
            <p>
              I'm a Computer Science student at the University of Maryland, working at the seam between infrastructure
              and AI. At IBM I architected a recursive DNS platform and scaled it 10× to over 1M QPS. Now I'm on the
              Domain Name Services team at AWS, working on DNS at global scale.
            </p>
            <p className="text-bp-ink-dim">
              On the AI side, I've built RAG pipelines for Southern African education ministries, fine-tuned diffusion
              models for semiconductor metrology at NIST, and founded RAGent LLC, which grew to $20K+ ARR and a 20+
              person team. I also do wearable robotics research at UMIACS on Calico, published at ACM IMWUT.
            </p>
            <p className="text-bp-ink-dim">
              What ties it together is a bias toward systems that hold up in production: measured, observable and
              reliable. That's the idea behind HarnessFlow, my open-source framework for compiling AI agent pipelines
              into deterministic workflows.
            </p>
          </div>

          <aside className="relative mt-10 border border-dashed border-bp-signal/50 bg-bp-panel/70 p-5 sm:p-6">
            <span className="bp-label absolute -top-[0.4rem] left-4 bg-background px-1.5 text-bp-signal-ink">
              Note 1 / Now building
            </span>
            <p className="leading-relaxed text-bp-ink">
              Interactive touchscreen technology for Calico, a miniature wearable robot that relocates around your body,
              senses your actions and gives real-time feedback.
            </p>
          </aside>
        </div>
      </div>

      <SpecSheet />
    </Section>
  );
}

function Portrait({ inView }: { inView: boolean }) {
  const reduced = useReducedMotion();
  return (
    <figure className="lg:col-span-5">
      <div className="relative pl-7 pt-7">
        {/* Width dimension */}
        <div aria-hidden="true" className="absolute left-7 right-0 top-0 h-4 text-bp-line-soft">
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 16">
            <DrawPath d="M0 8 H100" draw="view" vectorEffect="non-scaling-stroke" className="stroke-current" />
            <path d="M0 2 V14 M100 2 V14" vectorEffect="non-scaling-stroke" className="stroke-current" strokeWidth={1} />
          </svg>
          <span className="bp-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-bp-line">
            W 1851
          </span>
        </div>
        {/* Height dimension */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 top-7 w-4 text-bp-line-soft">
          <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 16 100">
            <DrawPath d="M8 0 V100" draw="view" vectorEffect="non-scaling-stroke" className="stroke-current" />
            <path d="M2 0 H14 M2 100 H14" vectorEffect="non-scaling-stroke" className="stroke-current" strokeWidth={1} />
          </svg>
          <span className="bp-label absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap bg-background px-2 text-bp-line">
            H 1778
          </span>
        </div>

        <div className="relative">
          <div className="relative aspect-[1851/1778] overflow-hidden border border-bp-line/60 bg-black">
            <img
              src="/background.png"
              alt="Portrait of Rugved Zarkar"
              width={1851}
              height={1778}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            {/* Centre lines */}
            <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-bp-line/15" />
            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-bp-line/15" />
            {/* One scan pass when the plate comes into view */}
            {!reduced && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-bp-line/20 to-transparent"
                initial={{ y: '-100%', opacity: 1 }}
                animate={inView ? { y: '300%', opacity: 0 } : undefined}
                transition={{ duration: 1.8, ease: EASE, opacity: { delay: 1.2, duration: 0.6 } }}
              />
            )}
          </div>
          <CornerMarks size={12} className="text-bp-line" />
          <Annotation x="63%" y="20%" dx={34} dy={-34} shelf={18} className="hidden sm:block">
            UMD CS, Dec 2027
          </Annotation>
          <Annotation x="46%" y="74%" dx={60} dy={28} shelf={18} tone="signal" className="hidden sm:block">
            SWE @ AWS
          </Annotation>
        </div>
      </div>

      <figcaption className="mt-5 flex flex-wrap items-center justify-between gap-3 pl-7">
        <span className="font-mono text-xs text-bp-ink-dim">
          <span className="text-bp-line">Fig. 02</span> Rugved Zarkar
        </span>
        <span className="[&>div]:rounded-none [&>div]:border-bp-line-soft/50 [&>div]:bg-bp-panel/70">
          <PortfolioViews isInView={inView} delay={0.3} />
        </span>
      </figcaption>
    </figure>
  );
}

/** Title-block table: disciplines, education and headline figures. */
function SpecSheet() {
  return (
    <div className="mt-20">
      <div className="mb-3 flex items-center gap-3">
        <span className="bp-label text-bp-line">Spec sheet</span>
        <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/40" />
        <span aria-hidden="true" className="bp-label">DWG 02-B</span>
      </div>

      <div className="relative grid gap-px border border-bp-line/50 bg-bp-line-soft/40 sm:grid-cols-2 lg:grid-cols-4">
        <CornerMarks size={10} className="text-bp-line" />

        {disciplines.map((d, i) => (
          <div key={d.ref} className="group relative bg-bp-panel p-5 transition-colors hover:bg-bp-panel-2">
            <motion.span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-px origin-left bg-bp-line"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.7, delay: 0.1 + i * 0.12, ease: EASE }}
            />
            <span className="bp-label text-bp-line transition-colors group-hover:text-bp-signal-ink">{d.ref}</span>
            <h3 className="mt-3 font-display text-xl font-medium text-bp-ink">{d.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-bp-ink-dim">{d.text}</p>
          </div>
        ))}

        <div className="bg-bp-panel p-5 sm:col-span-2">
          <span className="bp-label text-bp-line">Education</span>
          <h3 className="mt-3 font-display text-xl font-medium text-bp-ink">{education.school}</h3>
          <p className="mt-1 text-sm text-bp-line">{education.degree}</p>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-bp-ink-dim">
            <div className="flex gap-2">
              <dt className="text-bp-ink-dim/80">Graduation</dt>
              <dd className="text-bp-ink">{education.graduation}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-bp-ink-dim/80">GPA</dt>
              <dd className="text-bp-ink">{education.gpa}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-bp-panel p-5 sm:col-span-2">
          <span className="bp-label text-bp-line">Relevant coursework</span>
          <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-2 text-sm text-bp-ink">
            {education.coursework.map((course, i) => (
              <li key={course} className="whitespace-nowrap">
                {course}
                {i < education.coursework.length - 1 && (
                  <span aria-hidden="true" className="px-2 text-bp-line-soft">
                    /
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {stats.map((s) => (
          <div key={s.label} className="flex items-end justify-between gap-4 bg-bp-panel p-5">
            <span className="text-sm text-bp-ink-dim">{s.label}</span>
            <span className="font-display text-4xl font-medium leading-none tracking-[-0.03em] text-bp-ink">
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
