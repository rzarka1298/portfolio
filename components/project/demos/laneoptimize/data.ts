/**
 * Recorded LaneIQ episodes, packed by `scripts/pack-lane-replays.py`.
 *
 * Each scenario is one SUMO run setup (density + seed) driven by several
 * policies. Background traffic starts identical for every driver; it
 * diverges only once the ego's own moves change what the cars around it do.
 */

export type ScenarioId = 'high_s13' | 'high_s7' | 'gauntlet_s9';

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
    id: 'high_s13',
    tab: 'Dense · seed 13',
    title: 'High density, seed 13',
    blurb:
      'DQN and PPO move into the right lane straight away and finish in 31.1 s. Greedy weaves back and forth and takes 34.6 s. The rule-based driver stays in the middle, and the gauntlet-trained PPO goes left; both finish 6 s behind.',
    defaultAgent: 'ppo_v12_safety_cd_150k',
  },
  {
    id: 'high_s7',
    tab: 'Dense · seed 7',
    title: 'High density, seed 7',
    blurb:
      'Here a learned policy loses. Four drivers move into the left lane straight away and finish in 27.0 s. DQN moves right instead, gets stuck behind slower traffic and finishes 10 s behind them.',
    defaultAgent: 'dqn_v4_mixed_200k_obsfix',
  },
  {
    id: 'gauntlet_s9',
    tab: 'Gauntlet · seed 9',
    title: 'Gauntlet, seed 9',
    blurb:
      'The ego starts in the right lane behind a wall of slow cars. The gauntlet-trained PPO and greedy move two lanes left within 2 s and finish in 23.6 s. The standard PPO, DQN and the rule-based driver never leave the slow lane and arrive 8 s later.',
    defaultAgent: 'ppo_v10_gauntlet_cd_300k',
  },
];

const loaders: Record<ScenarioId, () => Promise<{ default: unknown }>> = {
  high_s13: () => import('./scenarios/high_s13.json'),
  high_s7: () => import('./scenarios/high_s7.json'),
  gauntlet_s9: () => import('./scenarios/gauntlet_s9.json'),
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
  greedy: 'Moves to whichever reachable lane has the fastest leader.',
  safe_rule: 'Changes lanes only when the target lane is faster and clear (30 m ahead, 20 m behind).',
  dqn_v4_mixed_200k_obsfix: 'From-scratch Double DQN, 200k steps on mixed densities.',
  ppo_v12_safety_cd_150k:
    'MaskablePPO, 150k steps, collision penalty −100, lane-change cost −1, 1.5 s cooldown. The canonical agent.',
  ppo_v10_gauntlet_cd_300k: 'MaskablePPO, 300k steps trained on the gauntlet, lane-change cost −1, 1.5 s cooldown.',
};

/** Short labels drawn on the road. */
export const DRIVER_TAG: Record<string, string> = {
  random: 'Random',
  greedy: 'Greedy',
  safe_rule: 'Rule',
  dqn_v4_mixed_200k_obsfix: 'DQN',
  ppo_v12_safety_cd_150k: 'PPO',
  ppo_v10_gauntlet_cd_300k: 'PPO-G',
};
