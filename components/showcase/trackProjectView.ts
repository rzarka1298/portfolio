import { projectId, publicAnonKey } from '../../utils/supabase/info';
import type { ShowcaseProject } from './showcaseData';

const seen = new Set<string>();

/**
 * Record that a visitor opened a project, once per project per page load.
 * Same endpoint, path (`/project/<legacy id>`) and referrer as the old card
 * grid's "Learn More" dialog, so the existing counts keep accumulating.
 */
export function trackProjectView(project: ShowcaseProject) {
  if (seen.has(project.slug)) return;
  seen.add(project.slug);
  fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
    },
    body: JSON.stringify({ page: `/project/${project.legacyId}`, referrer: 'project-gallery' }),
    keepalive: true,
  }).catch(() => {
    /* analytics is best-effort */
  });
}
