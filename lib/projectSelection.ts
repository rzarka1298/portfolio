import { useSyncExternalStore } from 'react';
import type { FeaturedProjectId } from '../content/featured';
import { scrollToId } from './motion/lenis';

/**
 * Tiny shared store for "which project is selected".
 *
 * Writers: the hero graph (click a node), and the Projects section's tabs.
 * Reader: the Projects section, which shows the selected project's tab.
 *
 *   const { selectedId, seq, source, select } = useProjectSelection();
 *   select('calico');                                  // just select
 *   select('calico', { scroll: true, source: 'hero' }); // select + scroll to #projects
 *
 * `seq` increments on every `select`, even when the id is unchanged, so a
 * consumer can react to a repeat selection (e.g. re-focus the tab).
 */
export interface ProjectSelection {
  selectedId: FeaturedProjectId | null;
  /** Who made the latest selection, e.g. 'hero' | 'projects'. */
  source: string | null;
  seq: number;
}

export interface SelectOptions {
  /** Scroll to the Projects section (`#projects`). Default false. */
  scroll?: boolean;
  source?: string;
}

let state: ProjectSelection = { selectedId: null, source: null, seq: 0 };
const listeners = new Set<() => void>();

export const PROJECTS_SECTION_ID = 'projects';

export function getProjectSelection() {
  return state;
}

export function selectProject(id: FeaturedProjectId | null, options: SelectOptions = {}) {
  state = { selectedId: id, source: options.source ?? null, seq: state.seq + 1 };
  listeners.forEach((l) => l());
  if (options.scroll) scrollToId(PROJECTS_SECTION_ID);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProjectSelection() {
  const snapshot = useSyncExternalStore(subscribe, getProjectSelection, getProjectSelection);
  return { ...snapshot, select: selectProject };
}
