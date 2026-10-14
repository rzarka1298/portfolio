/**
 * Data contract for in-depth project pages (`/projects/:slug`).
 *
 * Content files (one per project, e.g. `content/projects/harnessflow.ts`)
 * default-export a `ProjectPage` and are registered in `./index.ts`.
 * Only optional fields may be added here — existing fields are relied on by
 * content authors.
 */

export type NodeKind = 'client' | 'service' | 'worker' | 'datastore' | 'queue' | 'external' | 'ui';

export interface ArchNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** Canvas position in px (top-left of the node card, ~200x72). */
  x: number;
  y: number;
  /** Optional `ArchGroup.id`; groups are drawn as a background around their nodes. */
  group?: string;
  /** One-liner shown under the label and at the top of the side panel. */
  summary: string;
  /** Longer explanation shown in the side panel. Blank lines split paragraphs. */
  details: string;
  tech: string[];
  /** Repo-relative path; linked as `${links.github}/blob/main/${codePath}`. */
  codePath?: string;
}

export interface ArchGroup {
  id: string;
  label: string;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface TraceStep {
  /** Highlight this edge (and its endpoints) and animate a dot along it. */
  edgeId?: string;
  /** Highlight this node (used when `edgeId` is absent, or in addition to it). */
  nodeId?: string;
  title: string;
  caption: string;
  /** Optional: animate the dot target -> source (e.g. a response). */
  reverse?: boolean;
}

export interface Trace {
  id: string;
  name: string;
  description: string;
  steps: TraceStep[];
}

export interface Architecture {
  groups?: ArchGroup[];
  nodes: ArchNode[];
  edges: ArchEdge[];
  traces: Trace[];
}

export interface ProjectPage {
  slug: string;
  title: string;
  tagline: string;
  status?: string;
  summary: string[];
  problem: string[];
  highlights: { title: string; body: string }[];
  techStack: { name: string; role: string }[];
  architecture: Architecture;
  install?: { intro: string; steps: { label: string; code: string }[] };
  links: { github?: string; docs?: string; live?: string };
  demoId?: string; // key into a demo component registry
}
