import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, BookOpen, Github, Globe } from 'lucide-react';
import type { ReactNode } from 'react';
import { CornerMarks, MagneticButton } from '../../blueprint';
import type { ProjectPage } from '../../../content/projects/types';
import { cn } from '../../../lib/utils';
import { pad2 } from './sheets';

function Cell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0 border-bp-line-soft/50 px-4 py-3', className)}>
      <div className="bp-label mb-1.5">{label}</div>
      <div className="min-w-0 text-sm text-bp-ink">{children}</div>
    </div>
  );
}

const LINK_META = {
  github: { label: 'View code', Icon: Github },
  docs: { label: 'Docs', Icon: BookOpen },
  live: { label: 'Live site', Icon: Globe },
} as const;

export function ProjectLinks({ links, size = 'md' }: { links: ProjectPage['links']; size?: 'md' | 'sm' }) {
  const entries = (['github', 'docs', 'live'] as const).filter((k) => links[k]);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((key, i) => {
        const { label, Icon } = LINK_META[key];
        const primary = i === 0;
        return (
          <MagneticButton
            key={key}
            href={links[key]}
            target="_blank"
            rel="noopener noreferrer"
            strength={primary ? 0.3 : 0.2}
            className={cn(
              'inline-flex items-center gap-2 font-mono text-[0.75rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              size === 'md' ? 'h-10 px-4' : 'h-9 px-3',
              primary
                ? 'bg-bp-signal text-[#0B2341] hover:bg-bp-signal/90'
                : 'border border-bp-line/60 text-bp-line hover:bg-bp-line/10',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
            <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
          </MagneticButton>
        );
      })}
    </div>
  );
}

/**
 * Cover of the drawing set: the project name set large, its tagline, and a
 * drafting title block (part number, status, sheet count, key parts, links)
 * in the bottom-right corner, where a real drawing keeps it.
 */
export default function TitleBlock({
  project,
  part,
  sheetCount,
}: {
  project: ProjectPage;
  part: string;
  sheetCount: number;
}) {
  const keyParts = project.techStack.slice(0, 3).map((t) => t.name);
  const hasLinks = Boolean(project.links.github || project.links.docs || project.links.live);

  return (
    <header className="relative pb-6 pt-6 md:pt-10">
      <Link
        to="/#projects"
        className="group mb-8 inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-bp-ink-dim transition-colors hover:text-bp-line"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
        All projects
      </Link>

      <div className="bp-grid relative border border-bp-line-soft/40">
        <CornerMarks size={12} className="text-bp-line" />
        {/* Sheet header */}
        <div className="flex items-center gap-3 border-b border-bp-line-soft/40 px-4 py-2.5 sm:px-6">
          <span className="bp-label text-bp-line">{part}</span>
          <span className="bp-label hidden sm:inline">/ Case study</span>
          <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/40" />
          <span className="bp-label tabular-nums">
            Sheet 01 of {pad2(sheetCount)}
          </span>
        </div>

        <div className="grid gap-10 px-4 pb-4 pt-10 sm:px-6 sm:pb-6 md:pt-14 lg:grid-cols-12 lg:gap-8">
          <div className="min-w-0 lg:col-span-7">
            <h1 className="text-balance break-words font-display text-[2.6rem] font-medium leading-[0.98] tracking-[-0.02em] text-bp-ink sm:text-6xl md:text-7xl">
              {project.title}
            </h1>
            <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-bp-ink-dim md:text-xl">{project.tagline}</p>
          </div>

          {/* Title block */}
          <div className="self-end lg:col-span-5">
            <div className="grid grid-cols-2 border border-bp-line/60 bg-bp-panel/90">
              <Cell label="Part no." className="border-b border-r">
                <span className="font-mono text-base text-bp-line">{part}</span>
              </Cell>
              <Cell label="Sheets" className="border-b">
                <span className="font-mono text-base tabular-nums">
                  01 <span className="text-bp-ink-dim">of</span> {pad2(sheetCount)}
                </span>
              </Cell>
              {project.status && (
                <Cell label="Status" className="col-span-2 border-b">
                  <span className="flex items-start gap-2">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-bp-signal" />
                    {project.status}
                  </span>
                </Cell>
              )}
              {keyParts.length > 0 && (
                <Cell label="Key parts" className={cn('col-span-2', hasLinks && 'border-b')}>
                  <span className="font-mono text-[0.8125rem] text-bp-ink-dim">{keyParts.join(' / ')}</span>
                </Cell>
              )}
              {hasLinks && (
                <div className="col-span-2 px-4 py-4">
                  <ProjectLinks links={project.links} size="sm" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
