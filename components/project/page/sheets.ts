import { projectPages } from '../../../content/projects';
import type { ProjectPage } from '../../../content/projects/types';

/** One sheet of a case study: a section of the page and an entry in the side index. */
export interface Sheet {
  id: string;
  /** Short index label. */
  label: string;
  /** Section heading. */
  title: string;
}

/**
 * The sheets a project's page actually has, in page order. Sections without
 * content (no demo, no install steps...) are left out, so numbering and the
 * "sheet N of M" count always match what's on screen.
 */
export function sheetsFor(project: ProjectPage, hasDemo: boolean): Sheet[] {
  const sheets: Sheet[] = [{ id: 'overview', label: 'Overview', title: 'Overview' }];
  if (project.architecture.nodes.length > 0) sheets.push({ id: 'architecture', label: 'Architecture', title: 'Architecture' });
  if (hasDemo) sheets.push({ id: 'demo', label: 'Demo', title: 'Try it' });
  if (project.highlights.length > 0) sheets.push({ id: 'highlights', label: 'Highlights', title: 'Highlights' });
  if (project.techStack.length > 0) sheets.push({ id: 'stack', label: 'Stack', title: 'Tech stack' });
  if (project.install) sheets.push({ id: 'install', label: 'Install', title: 'Get started' });
  return sheets;
}

const order = () => Object.keys(projectPages);

/** Part number from registry order, matching the hero's nodes: P-01, P-02... */
export function partNumber(slug: string): string {
  const i = order().indexOf(slug);
  return `P-${String(i + 1).padStart(2, '0')}`;
}

/** Previous and next projects in registry order, wrapping at the ends. */
export function neighbours(slug: string): { prev: ProjectPage; next: ProjectPage } | null {
  const slugs = order();
  const i = slugs.indexOf(slug);
  if (i < 0 || slugs.length < 2) return null;
  return {
    prev: projectPages[slugs[(i - 1 + slugs.length) % slugs.length]],
    next: projectPages[slugs[(i + 1) % slugs.length]],
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
