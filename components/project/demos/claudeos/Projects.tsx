import { Code2, Folder, GitBranch, Github, Pin, Sparkles, Terminal, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GIT_LABELS, LAUNCH_ACTIONS, PROJECTS } from './data';
import { ago } from './format';
import { ACCENT_TEXT, Btn } from './ui';
import type { LaunchAction, Project } from './types';

const LAUNCH_ICON: Record<LaunchAction, LucideIcon> = {
  antigravity: Sparkles,
  'claude-code': Terminal,
  pair: Users,
  finder: Folder,
  github: Github,
};

export function LaunchToolbar({
  project,
  disabled,
  onLaunch,
  compact,
}: {
  project: Project;
  disabled: boolean;
  onLaunch: (p: Project, a: LaunchAction, label: string) => void;
  compact?: boolean;
}) {
  const hasRemote = project.git.kind === 'repo' && project.git.remote !== null;
  return (
    <div role="group" aria-label={`Launch ${project.name}`} className="flex flex-wrap gap-1.5">
      {LAUNCH_ACTIONS.map(({ action, label }) => {
        const Icon = LAUNCH_ICON[action];
        const noRemote = action === 'github' && !hasRemote;
        return (
          <Btn
            key={action}
            disabled={disabled || noRemote}
            title={noRemote ? 'No GitHub remote' : disabled ? 'Reconnect to launch' : `Open ${project.name} in ${label}`}
            aria-label={compact ? `Open ${project.name} in ${label}` : undefined}
            onClick={() => onLaunch(project, action, label)}
          >
            <Icon aria-hidden className="h-3.5 w-3.5" />
            {compact ? <span className="sr-only sm:not-sr-only">{label}</span> : label}
          </Btn>
        );
      })}
    </div>
  );
}

function gitLine(p: Project): string {
  const g = p.git;
  if (g.kind === 'repo') {
    if (g.detached || !g.branch) return 'Detached HEAD';
    return GIT_LABELS.repo.replace('{branch}', g.branch) + (g.dirty ? ' · uncommitted changes' : ' · clean');
  }
  if (g.kind === 'skipped') return GIT_LABELS.skipped;
  return GIT_LABELS['not-a-repo'];
}

export function ProjectsView({
  now,
  disabled,
  onLaunch,
}: {
  now: number;
  disabled: boolean;
  onLaunch: (p: Project, a: LaunchAction, label: string) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {PROJECTS.map((p) => (
        <article key={p.id} aria-labelledby={`prj-${p.id}`} className="flex min-w-0 flex-col gap-2.5 border bg-card/80 p-4">
          <header className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 id={`prj-${p.id}`} className="flex items-center gap-1.5 font-semibold">
                {p.name}
                {p.pinned && (
                  <span className={cn('inline-flex items-center', ACCENT_TEXT)}>
                    <Pin aria-hidden className="h-3.5 w-3.5" />
                    <span className="sr-only">(pinned)</span>
                  </span>
                )}
              </h3>
              <p className="truncate font-mono text-xs text-muted-foreground">{p.displayPath}</p>
            </div>
          </header>
          <p className="flex items-center gap-1.5 text-xs">
            <GitBranch aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">{gitLine(p)}</span>
          </p>
          {p.git.kind === 'repo' && p.git.commits.length > 0 && (
            <ul className="space-y-1 text-xs" aria-label="Last commits">
              {p.git.commits.map((c) => (
                <li key={c.sha} className="flex min-w-0 gap-2">
                  <code className="shrink-0 font-mono text-muted-foreground">{c.sha}</code>
                  <span className="min-w-0 truncate">{c.subject}</span>
                  <span className="ml-auto shrink-0 text-muted-foreground">{ago(c.at, now)}</span>
                </li>
              ))}
            </ul>
          )}
          <LaunchToolbar project={p} disabled={disabled} onLaunch={onLaunch} />
          <p className="flex items-center gap-1.5 text-[0.68rem] text-muted-foreground">
            <Code2 aria-hidden className="h-3 w-3" />
            Issues and PRs unavailable · Sessions unavailable · Next task unavailable
          </p>
        </article>
      ))}
    </div>
  );
}
