import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { ProjectPage } from '../../../content/projects/types';

/** Props every demo component receives. */
export interface DemoProps {
  project: ProjectPage;
}

export type DemoComponent = LazyExoticComponent<ComponentType<DemoProps>>;

/**
 * demoId -> lazily loaded demo component.
 *
 * Register a demo by adding a module that default-exports a
 * `ComponentType<DemoProps>` and an entry here, e.g.
 *   harnessflow: lazy(() => import('./HarnessFlowDemo')),
 * then set `demoId: 'harnessflow'` on the project's content.
 * A missing or unknown demoId renders nothing.
 */
export const demoRegistry: Record<string, DemoComponent> = {
  'harnessflow-run': lazy(() => import('./harnessflow/HarnessFlowReplay')),
  'claudeos-dashboard': lazy(() => import('./claudeos/CommandCenterMock')),
  'lane-optimize-replay': lazy(() => import('./laneoptimize/LaneOptimizeReplay')),
};

export function getDemo(demoId: string | undefined): DemoComponent | undefined {
  if (!demoId) return undefined;
  return Object.prototype.hasOwnProperty.call(demoRegistry, demoId) ? demoRegistry[demoId] : undefined;
}
