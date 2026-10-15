import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ProjectPage } from '../../../content/projects/types';
import { cn } from '../../../lib/utils';
import { partNumber } from './sheets';

function PagerLink({ project, dir }: { project: ProjectPage; dir: 'prev' | 'next' }) {
  const next = dir === 'next';
  return (
    <Link
      to={`/projects/${project.slug}`}
      rel={dir}
      className={cn(
        'group relative flex min-w-0 flex-col gap-3 bg-bp-panel/90 p-5 transition-colors hover:bg-bp-panel-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-bp-signal sm:p-6',
        next && 'sm:items-end sm:text-right',
      )}
    >
      <span className={cn('flex items-center gap-2', next && 'sm:flex-row-reverse')}>
        {next ? (
          <ArrowRight className="h-4 w-4 text-bp-line transition-transform group-hover:translate-x-1 sm:order-none" aria-hidden="true" />
        ) : (
          <ArrowLeft className="h-4 w-4 text-bp-line transition-transform group-hover:-translate-x-1" aria-hidden="true" />
        )}
        <span className="bp-label">{next ? 'Next' : 'Previous'} project</span>
        <span className="bp-label text-bp-line">{partNumber(project.slug)}</span>
      </span>
      <span className="font-display text-xl font-medium leading-tight text-bp-ink md:text-2xl">{project.title}</span>
      <span className="line-clamp-2 max-w-[44ch] text-sm leading-relaxed text-bp-ink-dim">{project.tagline}</span>
      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-0 h-[2px] w-0 bg-bp-signal transition-all duration-300 group-hover:w-full',
          next ? 'right-0' : 'left-0',
        )}
      />
    </Link>
  );
}

/** Previous / next case study in registry order. */
export default function ProjectPager({ prev, next }: { prev: ProjectPage; next: ProjectPage }) {
  return (
    <nav aria-label="More projects" className="mt-6 border-t border-bp-line-soft/40 pt-14 md:pt-20">
      <div className="bp-label mb-5 text-bp-line">Continue the set</div>
      <div className="grid gap-px border border-bp-line/50 bg-bp-line/50 sm:grid-cols-2">
        <PagerLink project={prev} dir="prev" />
        <PagerLink project={next} dir="next" />
      </div>
    </nav>
  );
}
