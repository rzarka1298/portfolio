import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import type { ProjectPage } from '../../../content/projects/types';
import { cn } from '../../../lib/utils';

function CopyButton({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (insecure context): nothing to do */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? `Copied: ${label}` : `Copy commands: ${label}`}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-1.5 border px-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal',
        copied
          ? 'border-bp-signal/70 text-bp-signal-ink'
          : 'border-bp-line-soft/60 text-bp-ink-dim hover:border-bp-line hover:text-bp-line',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/** One command per line; comment lines are shown dim and without a prompt. */
function Commands({ code }: { code: string }) {
  return (
    <pre
      data-lenis-prevent
      className="overflow-x-auto px-4 pb-4 pt-1 font-mono text-[0.8125rem] leading-6 sm:px-5"
    >
      <code>
        {code.split('\n').map((line, i) => {
          const comment = line.trimStart().startsWith('#');
          return (
            <span key={i} className="block whitespace-pre">
              {!comment && line.trim() !== '' && (
                <span aria-hidden="true" className="select-none text-bp-signal-ink">
                  ${' '}
                </span>
              )}
              <span className={comment ? 'text-bp-ink-dim' : 'text-bp-ink'}>{line}</span>
            </span>
          );
        })}
      </code>
    </pre>
  );
}

/** Install steps in a single terminal pane, with a copy button per step. */
export default function InstallTerminal({ install, slug }: { install: NonNullable<ProjectPage['install']>; slug: string }) {
  return (
    <div className="border border-bp-line/50 bg-bp-deep">
      <div className="flex items-center gap-3 border-b border-bp-line/40 bg-bp-panel px-4 py-2.5">
        <span aria-hidden="true" className="flex gap-1.5">
          <span className="h-2 w-2 border border-bp-line-soft" />
          <span className="h-2 w-2 border border-bp-line-soft" />
          <span className="h-2 w-2 bg-bp-signal" />
        </span>
        <span className="bp-label truncate">~/{slug}</span>
        <span className="bp-label ml-auto hidden sm:inline">
          {install.steps.length} {install.steps.length === 1 ? 'step' : 'steps'}
        </span>
      </div>
      <ol>
        {install.steps.map((step, i) => (
          <li key={i} className={cn(i > 0 && 'border-t border-dashed border-bp-line-soft/40')}>
            <div className="flex items-center gap-3 px-4 pb-1 pt-3.5 sm:px-5">
              <span className="font-mono text-xs text-bp-line"># {i + 1}</span>
              <span className="min-w-0 flex-1 text-sm font-medium text-bp-ink">{step.label}</span>
              <CopyButton code={step.code} label={step.label} />
            </div>
            <Commands code={step.code} />
          </li>
        ))}
      </ol>
    </div>
  );
}
