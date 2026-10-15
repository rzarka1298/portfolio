import type { KeyboardEvent } from 'react';

export const tabId = (slug: string) => `project-tab-${slug}`;
export const panelId = (slug: string) => `project-panel-${slug}`;

/**
 * Roving-focus keyboard model for a tablist (WAI-ARIA tabs, automatic
 * activation): arrows move and select, Home/End jump to the ends.
 * Returns true when the key was handled.
 */
export function handleTablistKey(
  event: KeyboardEvent,
  index: number,
  count: number,
  select: (next: number) => void,
  orientation: 'vertical' | 'horizontal',
) {
  const prevKeys = orientation === 'vertical' ? ['ArrowUp', 'ArrowLeft'] : ['ArrowLeft', 'ArrowUp'];
  const nextKeys = orientation === 'vertical' ? ['ArrowDown', 'ArrowRight'] : ['ArrowRight', 'ArrowDown'];
  let next: number | null = null;
  if (nextKeys.includes(event.key)) next = (index + 1) % count;
  else if (prevKeys.includes(event.key)) next = (index - 1 + count) % count;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = count - 1;
  if (next === null) return false;
  event.preventDefault();
  select(next);
  return true;
}
