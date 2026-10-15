import { projectId, publicAnonKey } from '../utils/supabase/info';

/**
 * Fire-and-forget visit/event record to the Supabase analytics endpoint
 * (same call App.tsx and Contact.tsx make). Never throws.
 */
export function trackVisit(page: string, referrer: string) {
  fetch(`https://${projectId}.supabase.co/functions/v1/server/api/analytics/visit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${publicAnonKey}`,
      apikey: publicAnonKey,
    },
    body: JSON.stringify({ page, referrer }),
    keepalive: true,
  }).catch(() => {
    /* analytics is best-effort */
  });
}
