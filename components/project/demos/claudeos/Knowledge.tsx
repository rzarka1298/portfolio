import { useState } from 'react';
import { FileText, Folder, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORKSPACES } from './data';
import { ACCENT_TEXT, Btn, DANGER_TEXT, FOCUS, SectionLabel } from './ui';
import { STAGES, type Stage, type VaultNote } from './types';

const wsName = (id: string) => WORKSPACES.find((w) => w.id === id)?.displayName ?? id;

/** Folder label with workspace IDs shown by their display name. */
function folderOf(path: string): string[] {
  const parts = path.split('/').slice(0, -1);
  if (parts[0] === 'workspaces' && parts[1]) parts[1] = wsName(parts[1]);
  return parts;
}

interface TreeNode {
  name: string;
  children: Map<string, TreeNode>;
  notes: VaultNote[];
}

function buildTree(notes: VaultNote[]): TreeNode {
  const root: TreeNode = { name: '', children: new Map(), notes: [] };
  for (const n of notes) {
    let node = root;
    for (const part of folderOf(n.path)) {
      let next = node.children.get(part);
      if (!next) {
        next = { name: part, children: new Map(), notes: [] };
        node.children.set(part, next);
      }
      node = next;
    }
    node.notes.push(n);
  }
  return root;
}

const ORDER = ['inbox', 'global', 'workspaces', 'system'];

function Tree({
  node,
  depth,
  selected,
  stage,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selected: string | null;
  stage: Stage | null;
  onSelect: (id: string) => void;
}) {
  const folders = [...node.children.values()].sort(
    (a, b) => (depth === 0 ? ORDER.indexOf(a.name) - ORDER.indexOf(b.name) : a.name.localeCompare(b.name)),
  );
  return (
    <ul className={cn('space-y-0.5', depth > 0 && 'ml-3 border-l pl-2')} aria-label={depth === 0 ? 'Vault folders' : undefined}>
      {folders.map((f) => (
        <li key={f.name}>
          <span className="flex items-center gap-1 py-0.5 text-muted-foreground">
            <Folder aria-hidden className="h-3.5 w-3.5" />
            {f.name}/
          </span>
          <Tree node={f} depth={depth + 1} selected={selected} stage={stage} onSelect={onSelect} />
        </li>
      ))}
      {node.notes.map((n) => {
        const dim = stage !== null && n.stage !== stage;
        return (
          <li key={n.id}>
            <button
              type="button"
              aria-pressed={selected === n.id}
              onClick={() => onSelect(n.id)}
              className={cn(
                'flex w-full min-w-0 items-center gap-1 px-1 py-0.5 text-left',
                FOCUS,
                selected === n.id ? 'bg-muted font-medium' : 'hover:bg-muted/50',
                dim && 'opacity-40',
              )}
            >
              <FileText aria-hidden className="h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 truncate">{n.title}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function fmtValue(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (Array.isArray(v)) return v.length === 0 ? '[]' : `[${v.join(', ')}]`;
  if (typeof v === 'object') {
    const entries = Object.entries(v as Record<string, string>);
    return entries.length === 0 ? '{}' : `{ ${entries.map(([k, x]) => `${k}: ${x}`).join(', ')} }`;
  }
  return String(v);
}

function frontmatter(n: VaultNote): [string, string][] {
  const iso = (t: number | null) => (t === null ? null : new Date(t).toISOString());
  return [
    ['id', n.id],
    ['scope', n.scope],
    ['stage', n.stage],
    ['created', fmtValue(iso(n.created))],
    ['updated', fmtValue(iso(n.updated))],
    ['generatedBy', fmtValue(n.generatedBy)],
    ['aiGenerated', fmtValue(n.aiGenerated)],
    ['claimType', fmtValue(n.claimType)],
    ['sources', fmtValue(n.sources)],
    ['confidence', n.confidence],
    ['lastReviewed', fmtValue(iso(n.lastReviewed))],
  ];
}

export function KnowledgePreview({ notes }: { notes: VaultNote[] }) {
  const [stage, setStage] = useState<Stage | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [refusal, setRefusal] = useState(false);
  const sel = notes.find((n) => n.id === selected) ?? null;
  const orbit = WORKSPACES[0];

  return (
    <div className="space-y-4">
      <p className="border border-dashed px-3 py-2 text-xs text-muted-foreground">
        <span className={cn('font-semibold', ACCENT_TEXT)}>Preview: not yet in the plugin.</span> The managed vault and
        its write rules exist; this browser over them is a later phase.
      </p>

      <div>
        <SectionLabel id="lifecycle-label">Lifecycle</SectionLabel>
        <ol aria-labelledby="lifecycle-label" className="flex flex-wrap items-center gap-1 text-xs">
          {STAGES.map((s, i) => {
            const count = notes.filter((n) => n.stage === s).length;
            return (
              <li key={s} className="flex items-center gap-1">
                <button
                  type="button"
                  aria-pressed={stage === s}
                  onClick={() => setStage(stage === s ? null : s)}
                  className={cn(
                    'border px-2 py-1 transition-colors',
                    FOCUS,
                    stage === s ? cn('bg-muted font-semibold', ACCENT_TEXT) : 'hover:bg-muted/50',
                  )}
                >
                  {s} <span className="tabular-nums text-muted-foreground">{count}</span>
                </button>
                {i < STAGES.length - 1 && (
                  <span aria-hidden className="text-muted-foreground">
                    →
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="mt-1 text-[0.68rem] text-muted-foreground">
          Stage is frontmatter, not folder: a note in <span className="font-mono">wiki/</span> can still be at synthesis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="min-w-0 border bg-card/80 p-3 text-xs">
          <Tree node={buildTree(notes)} depth={0} selected={selected} stage={stage} onSelect={setSelected} />
        </div>
        <div className="min-w-0 border bg-card/80 p-3 text-xs">
          {!sel ? (
            <p className="text-muted-foreground">Select a note to see its provenance.</p>
          ) : (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">{sel.title}</h3>
              <p className="break-all font-mono text-muted-foreground">{folderOf(sel.path).join('/')}/{sel.path.split('/').pop()}</p>
              <pre className="overflow-x-auto bg-muted p-2 font-mono text-[0.7rem] leading-relaxed">
                {'---\n'}
                {frontmatter(sel).map(([k, v]) => `${k}: ${v}\n`)}
                {'---'}
              </pre>
              {sel.body && <p>{sel.body}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="border bg-card/80 p-3 text-xs">
        <p className="mb-2">
          A process working for <span className="font-semibold">{orbit?.displayName ?? 'a workspace'}</span> may only
          write inside <span className="font-mono">workspaces/{orbit?.id ?? '…'}/</span>.
        </p>
        <Btn onClick={() => setRefusal(true)}>Try a cross-scope write</Btn>
        <div aria-live="polite">
          {refusal && (
            <pre className={cn('mt-2 overflow-x-auto whitespace-pre-wrap break-all bg-muted p-2 font-mono text-[0.7rem]', DANGER_TEXT)}>
              <ShieldAlert aria-hidden className="mr-1 inline h-3.5 w-3.5 align-text-bottom" />
              {`write global/wiki/new-note.md\n  declared scope: workspace:${orbit?.id ?? ''}\n  refused: write target is outside the declared scope`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
