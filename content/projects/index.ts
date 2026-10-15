import type { ProjectPage } from './types';
import harnessflow from './harnessflow';
import claudeos from './claudeos';
import laneOptimize from './lane-optimize';
import calico from './calico';
import biasgpt from './biasgpt';
import agenticRagIp from './agentic-rag-ip';
import neuromaker from './neuromaker';
import portfolio from './portfolio';

export type { ProjectPage } from './types';

/** Registry of project pages, keyed by slug. Add a project by importing its file here. */
export const projectPages: Record<string, ProjectPage> = Object.fromEntries(
  [harnessflow, claudeos, laneOptimize, calico, biasgpt, agenticRagIp, neuromaker, portfolio].map((page) => [page.slug, page]),
);

export function getProjectPage(slug: string | undefined): ProjectPage | undefined {
  if (!slug) return undefined;
  return Object.prototype.hasOwnProperty.call(projectPages, slug) ? projectPages[slug] : undefined;
}

export function hasProjectPage(slug: string | undefined): boolean {
  return getProjectPage(slug) !== undefined;
}
