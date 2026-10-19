/**
 * Recorded LaneIQ episodes, packed by `scripts/pack-lane-replays.py`.
 *
 * Each scenario is one SUMO run setup (density + seed) driven by several
 * policies. Background traffic starts identical for every driver; it
 * diverges only once the ego's own moves change what the cars around it do.
 */

export type ScenarioId = 'high_s14' | 'high_s1' | 'gauntlet_s3';

/** Index into `Action` labels: 0 stay, 1 change left, 2 change right, -1 no decision. */
export type ActionCode = -1 | 0 | 1 | 2;

export interface DriverRun {
  agent: string;
  label: string;
  outcome: 'collision' | 'finished';
  durationS: number;
  laneChanges: number;
  meanSpeed: number;
  return: number;
  /** Sim time (s) per tick. */
  t: number[];
  a: ActionCode[];
  /** Reward components per tick, ordered as `Scenario.rewardKeys`. */
  r: number[][];
  /**
   * Vehicles per tick, flattened in groups of five:
   * [id, x (m), lane (0 = rightmost), speed (m/s), vtype]. The ego is first.
   */
  v: number[][];
}

export interface Scenario {
  id: ScenarioId;
  density: string;
  seed: number;
  roadM: number;
  rewardKeys: string[];
  drivers: DriverRun[];
}

export interface ScenarioMeta {
  id: ScenarioId;
  tab: string;
  title: string;
  blurb: string;
  /** Driver shown first when the scenario opens. */
  defaultAgent: string;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'high_s14',
    tab: 'Dense · seed 14',
    title: 'High density, seed 14',
    blurb:
      'The ego joins a crowded road. Three of the four other drivers crash within about a second; DQN lasts 10.8 s.',
    defaultAgent: 'ppo_v2_safety_heavy_150k',
  },
  {
    id: 'high_s1',
    tab: 'Dense · seed 1',
    title: 'High density, seed 1',
    blurb:
      'Same density, different traffic. Greedy survives but changes lanes 300 times; PPO changes once and is fastest.',
    defaultAgent: 'greedy',
  },
  {
    id: 'gauntlet_s3',
    tab: 'Gauntlet · seed 3',
    title: 'Gauntlet, seed 3',
    blurb:
      'The ego starts in a lane packed with slow cars. The default PPO never leaves it. The gauntlet-trained PPO escapes in one move, as does the rule-based driver.',
    defaultAgent: 'ppo_v2_safety_heavy_150k',
  },
];

const loaders: Record<ScenarioId, () => Promise<{ default: unknown }>> = {
  high_s14: () => import('./scenarios/high_s14.json'),
  high_s1: () => import('./scenarios/high_s1.json'),
  gauntlet_s3: () => import('./scenarios/gauntlet_s3.json'),
};

const cache = new Map<ScenarioId, Promise<Scenario>>();

export function loadScenario(id: ScenarioId): Promise<Scenario> {
  let p = cache.get(id);
  if (!p) {
    p = loaders[id]().then((m) => m.default as Scenario);
    // Let a failed fetch be retried on the next visit to the tab.
    p.catch(() => cache.delete(id));
    cache.set(id, p);
  }
  return p;
}

export const ACTION_LABEL: Record<ActionCode, string> = {
  [-1]: '—',
  0: 'STAY',
  1: 'CHANGE_LEFT',
  2: 'CHANGE_RIGHT',
};

/** The live backend's explanation for each action (backend/app/services/simulator.py). */
export const ACTION_TEXT: Record<ActionCode, string> = {
  [-1]: 'Warming up.',
  0: 'Holding lane — current lane is acceptable.',
  1: 'Changing left — opportunity in adjacent lane.',
  2: 'Changing right — slower traffic ahead or rebalancing.',
};

export const REWARD_LABEL: Record<string, string> = {
  speed: 'Speed',
  lane_cost: 'Lane change',
  jerk: 'Jerk',
  unsafe_gap: 'Unsafe gap',
  collision: 'Collision',
  alive: 'Alive',
};

export const VTYPE_NAMES = ['ego', 'aggressive', 'normal', 'slow'] as const;

/** Driver descriptions, keyed by agent. */
export const DRIVER_NOTE: Record<string, string> = {
  random: 'Uniformly random legal action every 100 ms.',
  greedy: 'Moves to whichever reachable lane has the fastest leader. No gap check.',
  safe_rule: 'Changes lanes only when the target lane is faster and clear (30 m ahead, 20 m behind).',
  dqn_v3_mixed_200k: 'From-scratch Double DQN, 200k steps on mixed densities.',
  ppo_v2_safety_heavy_150k: 'MaskablePPO, 150k steps, collision penalty doubled to −100. The canonical agent.',
  ppo_v5_gauntlet_300k: 'MaskablePPO, 300k steps trained on the gauntlet with the default reward.',
};
