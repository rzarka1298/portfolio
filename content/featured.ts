import { projectPages } from './projects';

/**
 * The projects wired to the hero's node graph, in display order.
 *
 * `id` is the key shared with the project-selection store
 * (lib/projectSelection.ts). The Projects section should use the same ids for
 * its tabs. For projects with a deep-dive page, `id` equals the page slug.
 *
 * Titles for deep-dive projects come from content/projects. `result` lines
 * are one-line outcomes, also shown in the Projects showcase rail.
 */
export const FEATURED_PROJECT_IDS = ['harnessflow', 'claudeos', 'lane-optimize', 'calico', 'biasgpt'] as const;

export type FeaturedProjectId = (typeof FEATURED_PROJECT_IDS)[number];

export interface FeaturedProject {
  id: FeaturedProjectId;
  /** Drawing-style part number shown on the node, e.g. "P-01". */
  partNo: string;
  title: string;
  /** One-line outcome. */
  result: string;
  /** Two or three headline technologies. */
  stack: string[];
  /** Deep-dive route slug, when one exists. */
  slug?: string;
}

export const featuredProjects: FeaturedProject[] = [
  {
    id: 'harnessflow',
    partNo: 'P-01',
    title: projectPages.harnessflow?.title ?? 'HarnessFlow',
    result: 'Verified PRD-to-branch coding runs',
    stack: ['Go', 'Temporal', 'Python'],
    slug: 'harnessflow',
  },
  {
    id: 'claudeos',
    partNo: 'P-02',
    title: projectPages.claudeos?.title ?? 'Claude Command Center',
    result: 'Local-first agent command center',
    stack: ['TypeScript', 'Node.js', 'SQLite'],
    slug: 'claudeos',
  },
  {
    id: 'lane-optimize',
    partNo: 'P-03',
    title: 'Lane-Optimize',
    result: 'RL vs. rule-based traffic benchmarks',
    stack: ['PyTorch', 'SUMO', 'FastAPI'],
  },
  {
    id: 'calico',
    partNo: 'P-04',
    title: 'Calico Smartlabs',
    result: 'ACM IMWUT published, featured in IEEE Spectrum and The Verge',
    stack: ['C++', 'ESP32-S3', 'IMU'],
  },
  {
    id: 'biasgpt',
    partNo: 'P-05',
    title: 'BiasGPT',
    result: 'Counterfactual identity-swap bias checks',
    stack: ['DistilBERT', 'spaCy', 'FastAPI'],
  },
];

export function isFeaturedProjectId(value: unknown): value is FeaturedProjectId {
  return typeof value === 'string' && (FEATURED_PROJECT_IDS as readonly string[]).includes(value);
}
