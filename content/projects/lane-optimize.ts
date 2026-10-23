import type { ProjectPage } from './types';

const x: ProjectPage = {
  slug: 'lane-optimize',
  title: 'Lane-Optimize (LaneIQ)',
  tagline:
    'Reinforcement learning for highway lane changes in SUMO: a from-scratch DQN, MaskablePPO and shared-policy multi-agent PPO, benchmarked against rule-based drivers and streamed live to a browser.',
  status: 'Personal project · 10-week build',
  summary: [
    'LaneIQ wraps a hand-authored SUMO 3-lane highway in a Gymnasium environment. Every 100 ms of simulated time an ego vehicle picks one of three actions (STAY, CHANGE_LEFT, CHANGE_RIGHT) and is rewarded for speed and penalized for lane changes, jerk, tailgating and collisions.',
    'Three families of learned policy share one `Policy` protocol with three rule-based baselines: a DQN written from scratch in PyTorch, Stable-Baselines3 MaskablePPO, and a parameter-sharing PPO trained over a PettingZoo environment with several egos in one scene.',
    'A reproducible evaluation matrix (agents × densities × seeds) writes every result to CSV. A FastAPI service runs one live simulation with any baseline or checkpoint and streams per-tick state over a WebSocket to a React dashboard.',
  ],
  problem: [
    'Rule-based lane-change logic is easy to reason about, but it is hard to tell how much a learned policy actually improves on it. Evaluations also mislead in quieter ways: an agent can look safe for the wrong reason, and the numbers only change once someone checks what it actually sees.',
    'The project asks a narrow, measurable question: given realistic background traffic at three densities, when should the ego change lanes? It answers it with the same environment, metrics and seeds for every agent, so the comparison is like-for-like.',
  ],
  highlights: [
    {
      title: 'The policy decides, SUMO checks the gap',
      body: 'After a 50-step (5 s) warmup fills the road, the env inserts the ego with `traci.vehicle.add`, switches off SUMO’s own lane-change motivations for it and pins its speed factor to 1, so it can’t outrun the limit by a random draw. Only the policy asks for lane changes. SUMO still checks each request against the cars around it (lane-change mode 768), the way a car’s lane-change assist would, and refuses one that would cut into another car; the ego then holds its lane.',
    },
    {
      title: 'DQN from scratch, with a measured fix',
      body: 'The DQN (25 → 128 → 128 → 3 MLP) has its own replay buffer, a target network synced every 1,000 steps, ε-greedy exploration and Double DQN targets. The project notes record that MSE loss with the sparse −50 collision reward blew up the gradients. Switching to Huber loss brought mean loss down from about 290 to 0.31. It stays a config flag because MSE still trains CartPole better.',
    },
    {
      title: 'Action masking that fits in the observation',
      body: 'The 25-dim observation packs (left_ok, right_ok) into one scalar slot. `valid_actions_mask` decodes it for the DQN, and `env.action_masks()` exposes it to MaskablePPO, which then never samples an impossible lane change.',
    },
    {
      title: 'A mirrored-perception bug made the safest agent a fake',
      body: 'The side-lane observations read TraCI’s `getNeighbors` left/right bit backwards, so every agent trained before the fix saw the adjacent lanes swapped in the middle lane and always empty from the edge lanes. The PPO that had recorded 0% collisions everywhere was safe because it had learned not to change lanes, not because it changed lanes safely. A new test now checks the observed side slots against SUMO’s true lane positions.',
    },
    {
      title: 'A cooldown the policy can see',
      body: 'Retrained on correct inputs, agents dithered at up to 161 lane changes per minute, because one change cost only 5% of a step’s speed reward. A 1.5 s lane-change cooldown, folded into the packed lane-validity slot so even the unmasked multi-agent policy sees it, plus a 20× lane-change cost brought that down to roughly 2–6 per minute.',
    },
    {
      title: 'The simulator, not the policies, was causing the crashes',
      body: 'Before the gap check, every TraCI lane change was carried out unchecked, and every collision in the results was one: the ego changing lanes into a car directly alongside it. Tested in SUMO with a car beside the ego, modes 0 and 1024 execute the change and crash; 256, 512 and 768 refuse it. The old code called 1024 “safety-checked”, which turned out to be wrong. With the check on, every agent has 0% collisions at every density over 20 seeds, and the comparison becomes who gets through traffic fastest.',
    },
    {
      title: 'In heavy traffic, PPO is about a second faster',
      body: 'Paired over the same 20 seeds, the canonical PPO (`ppo_v12_safety_cd_150k`) drives 1 km in dense traffic about a second faster than the rule-based driver (0.97 s, 95% CI 0.14–1.81 s) and greedy (0.81 s, 0.16–1.46 s), and 1.8 s faster than random. Against DQN the 1.0 s gap is just short of significant. At medium density PPO only clearly beats DQN and random. In light traffic every driver ties, with 13–15 of 20 seeds finishing in exactly the same time, because there is nothing to overtake. The rule-based driver makes the fewest lane changes (1.5 per minute on high); random makes 12.3 with no collisions, because SUMO refuses its unsafe requests. On the gauntlet, which floods the ego’s starting lane with slow cars, every agent averages 30.4–30.6 s: once unsafe merges are blocked, escaping is easy.',
    },
    {
      title: 'Return stopped measuring anything',
      body: 'The speed term is min(v / v_max, 1) per step and episodes end at 1 km, so over an episode it sums to about the same value for every driver: driving faster earns nothing. The +0.01 per-step alive bonus even favours arriving later. Results are ranked by finish time instead. Turning the alive bonus into a per-step time penalty and retraining made each retrained agent slower, probably because the per-step penalty for following under 1.5 s outweighed the time saved. That was a negative result, and the time-penalty agents were not promoted.',
    },
    {
      title: 'One live sim, one stream format',
      body: 'TraCI keeps its connection state in module-level globals, so the backend’s SimulatorService allows exactly one run per process. It steps the env at about 10 Hz and fans a typed `SimTick` (vehicles, decision, reward components) out to every WebSocket subscriber.',
    },
  ],
  techStack: [
    { name: 'SUMO + TraCI', role: '3-lane, 1 km highway; four vehicle types; Poisson flows at three densities' },
    { name: 'Gymnasium + PettingZoo', role: 'LaneIQEnv, a mixed-density wrapper, and a ParallelEnv with several egos' },
    { name: 'PyTorch', role: 'From-scratch DQN: network, replay buffer, agent, trainer' },
    { name: 'Stable-Baselines3 / sb3-contrib', role: 'MaskablePPO for one ego; plain PPO with a shared policy for several egos' },
    { name: 'SuperSuit', role: 'Flattens the multi-agent env into an SB3 VecEnv (black_death_v3 keeps finished agents in the API)' },
    { name: 'pandas', role: 'Evaluation matrix to CSV (mean ± std per cell, plus a CSV per episode)' },
    { name: 'FastAPI + WebSockets', role: 'Live-demo backend: /sim/start, /sim/stop, /sim/status, /runs, WS /sim/stream' },
    { name: 'React + Vite + TypeScript + Tailwind + Recharts', role: 'Dashboard: Canvas2D road, decision ticker, reward charts' },
    { name: 'uv + pytest + ruff', role: 'Environment management and test suite across every layer' },
  ],
  architecture: {
    groups: [
      { id: 'sim', label: 'Simulator' },
      { id: 'env', label: 'Gym environments' },
      { id: 'agents', label: 'Policies & training' },
      { id: 'eval', label: 'Evaluation & artifacts' },
      { id: 'demo', label: 'Live demo' },
    ],
    nodes: [
      {
        id: 'scenario',
        label: 'SUMO highway scenario',
        kind: 'datastore',
        x: 0,
        y: 160,
        group: 'sim',
        summary: 'Hand-authored XML: 1 km, 3 lanes, 4 vehicle types, 3 traffic densities.',
        details:
          'Nodes and edges define a single 1 km edge with three lanes and a 36.11 m/s limit. `netconvert` compiles them into the committed net.xml. vtypes.add.xml defines the aggressive, normal, slow and ego profiles. Each of routes_low/medium/high.rou.xml spawns background traffic with exponential `<flow>` periods.\n\nThe ego is not in any route file. The environment adds it at runtime.',
        tech: ['SUMO', 'netconvert', 'XML'],
        codePath: 'sumo_scenarios/highway_3lane/highway.sumocfg',
      },
      {
        id: 'traci',
        label: 'SUMO runtime (TraCI)',
        kind: 'service',
        x: 0,
        y: 320,
        group: 'sim',
        summary: 'Starts, steps and tears down a SUMO process over TraCI.',
        details:
          'Builds the SUMO command line for a chosen density and seed and manages the session lifecycle. The project uses TraCI rather than in-process libsumo everywhere, because libsumo had no macOS arm64 wheel. The `eclipse-sumo` PyPI wheel provides the SUMO binaries, so no separate system install is needed.',
        tech: ['TraCI', 'eclipse-sumo'],
        codePath: 'laneiq/env/sumo_runtime.py',
      },
      {
        id: 'env',
        label: 'LaneIQEnv',
        kind: 'service',
        x: 280,
        y: 160,
        group: 'env',
        summary: 'Gymnasium env: 25-dim observation, 3 discrete actions, 6-term reward.',
        details:
          'On reset it runs 50 warmup steps, adds the ego and disables its automatic lane changes; the changes the policy requests are gap-checked by SUMO (mode 768). Each step gates the action through a 1.5 s lane-change cooldown, applies it (changeLane over 1.0 s), advances SUMO by 0.1 s, builds the observation (ego state, per-lane leader/follower gaps and speeds, lane density, packed lane-validity mask, distance left) and computes the reward.\n\nReward (rewards.py): +speed/v_max, −0.05 per lane change by default (−1 for the canonical agents), −0.2 × normalized jerk, −0.5 when time headway is under 1.5 s, −50 on collision, and +0.01 per step for staying alive. The components sum exactly to the total and are reported in `info`.',
        tech: ['Gymnasium', 'NumPy', 'TraCI'],
        codePath: 'laneiq/env/highway_env.py',
      },
      {
        id: 'marl',
        label: 'LaneIQParallelEnv',
        kind: 'service',
        x: 280,
        y: 480,
        group: 'env',
        summary: 'PettingZoo ParallelEnv with N concurrent egos in one SUMO scene.',
        details:
          'Every ego gets its own observation, action and reward, and the same gap-checked lane changes as the single-ego env. One shared policy decides every ego’s lane changes. Over 20 seeds with 4 egos it has 0% collisions per ego.',
        tech: ['PettingZoo'],
        codePath: 'laneiq/env/multi_agent_env.py',
      },
      {
        id: 'dqn',
        label: 'DQN (from scratch)',
        kind: 'worker',
        x: 560,
        y: 0,
        group: 'agents',
        summary: 'Replay buffer, target network, ε-greedy, Double DQN, Huber loss.',
        details:
          'A 25 → 128 → 128 → 3 ReLU MLP. The target network syncs every 1,000 steps, Double DQN is on by default, and Huber loss is a flag (on for LaneIQ, off for the CartPole sanity check). Invalid actions are masked out of the Q-values before argmax. Saved as .pt.',
        tech: ['PyTorch'],
        codePath: 'laneiq/agents/dqn/dqn_agent.py',
      },
      {
        id: 'ppo',
        label: 'MaskablePPO',
        kind: 'worker',
        x: 560,
        y: 160,
        group: 'agents',
        summary: 'sb3-contrib PPO with action masks, wrapped in the Policy protocol.',
        details:
          'PPOAgent wraps `sb3_contrib.MaskablePPO` so the evaluation harness and backend can drive it exactly like the other agents. Masks come from `env.action_masks()`. Reward-weight sweeps produced the default-reward and safety-weighted variants. Saved as .zip.',
        tech: ['Stable-Baselines3', 'sb3-contrib'],
        codePath: 'laneiq/agents/ppo_sb3.py',
      },
      {
        id: 'baselines',
        label: 'Rule-based baselines',
        kind: 'worker',
        x: 560,
        y: 320,
        group: 'agents',
        summary: 'Random, greedy and safe-rule drivers to compare against.',
        details:
          'Three hand-written policies implement the same Policy protocol as the learned agents, so every comparison runs through the same code path. `safe_rule` makes the fewest lane changes in the final results; PPO is about a second faster in heavy traffic, and everyone ties in light traffic.',
        tech: ['Python'],
        codePath: 'laneiq/agents/baselines/safe_rule_agent.py',
      },
      {
        id: 'mappo',
        label: 'Shared-policy MAPPO',
        kind: 'worker',
        x: 560,
        y: 480,
        group: 'agents',
        summary: 'One PPO network trained on every ego at once (parameter sharing).',
        details:
          'SuperSuit’s black_death_v3 keeps finished agents in the API with zero observations. The env is then flattened into an SB3 VecEnv and trained with plain PPO, because the multi-agent wrappers do not pass action masks through. Invalid lane targets are no-ops in the env.',
        tech: ['Stable-Baselines3', 'SuperSuit', 'PettingZoo'],
        codePath: 'scripts/train_mappo.py',
      },
      {
        id: 'checkpoints',
        label: 'checkpoints/final',
        kind: 'datastore',
        x: 840,
        y: 160,
        group: 'eval',
        summary: 'Promoted DQN (.pt), PPO and MAPPO (.zip) checkpoints.',
        details:
          'The canonical trained agents live here. The backend lists them through `GET /runs` and loads them by file stem.',
        tech: ['PyTorch state dict', 'SB3 zip'],
      },
      {
        id: 'evalm',
        label: 'Evaluation matrix',
        kind: 'worker',
        x: 840,
        y: 400,
        group: 'eval',
        summary: 'agents × densities × seeds → aggregated and per-episode CSVs.',
        details:
          '`compare.py` runs each cell end to end through `runner.py`. `metrics.py` records one row per episode (mean speed, collision, reached end, lane changes per minute, RMS jerk, near-miss rate, return, episode length), and the cells are aggregated as mean ± std. Plot scripts build training curves and Pareto charts from the CSVs.',
        tech: ['pandas', 'Python'],
        codePath: 'laneiq/eval/compare.py',
      },
      {
        id: 'backend',
        label: 'FastAPI SimulatorService',
        kind: 'service',
        x: 1120,
        y: 160,
        group: 'demo',
        summary: 'Owns one live sim per process and broadcasts ticks at ~10 Hz.',
        details:
          '`POST /sim/start` resolves the requested agent (baseline name first, then a checkpoint file) and builds a LaneIQEnv. It then starts an asyncio loop that steps the env, builds a SimTick (vehicles, decision with a short explanation, reward components) and pushes it to every subscriber queue. Stop is idempotent.',
        tech: ['FastAPI', 'asyncio', 'Pydantic'],
        codePath: 'backend/app/services/simulator.py',
      },
      {
        id: 'dashboard',
        label: 'React dashboard',
        kind: 'ui',
        x: 1120,
        y: 400,
        group: 'demo',
        summary: 'Canvas2D highway, decision ticker and reward charts.',
        details:
          'Subscribes to `WS /sim/stream` with a typed client. HighwayCanvas draws a top-down road with interpolated vehicles, DecisionTicker shows the chosen action and why, and MetricsPanel charts cumulative return and each reward component with Recharts.',
        tech: ['React', 'Vite', 'TypeScript', 'Tailwind', 'Recharts'],
      },
    ],
    edges: [
      { id: 'e-scenario-traci', source: 'scenario', target: 'traci', label: 'sumocfg + routes_<density>' },
      { id: 'e-env-traci', source: 'env', target: 'traci', label: 'start · simulationStep · vehicle.add · changeLane' },
      { id: 'e-marl-traci', source: 'marl', target: 'traci', label: 'N egos, one scene' },
      { id: 'e-dqn-env', source: 'dqn', target: 'env', label: 'act(obs, mask)' },
      { id: 'e-ppo-env', source: 'ppo', target: 'env', label: 'action_masks() · step' },
      { id: 'e-baselines-env', source: 'baselines', target: 'env', label: 'Policy protocol' },
      { id: 'e-mappo-marl', source: 'mappo', target: 'marl', label: 'SuperSuit VecEnv' },
      { id: 'e-dqn-ckpt', source: 'dqn', target: 'checkpoints', label: '.pt' },
      { id: 'e-ppo-ckpt', source: 'ppo', target: 'checkpoints', label: '.zip' },
      { id: 'e-mappo-ckpt', source: 'mappo', target: 'checkpoints', label: '.zip' },
      { id: 'e-evalm-env', source: 'evalm', target: 'env', label: 'every agent × density × seed' },
      { id: 'e-backend-ckpt', source: 'backend', target: 'checkpoints', label: 'policy_loader.resolve()' },
      { id: 'e-backend-env', source: 'backend', target: 'env', label: 'reset · step at ~10 Hz' },
      { id: 'e-dashboard-backend', source: 'dashboard', target: 'backend', label: 'POST /sim/start · WS /sim/stream' },
    ],
    traces: [
      {
        id: 'live-decision',
        name: 'A live run in the dashboard',
        description: 'From choosing an agent in the browser to watching its lane decisions stream back, tick by tick.',
        steps: [
          {
            edgeId: 'e-dashboard-backend',
            title: 'Start a run',
            caption: 'The dashboard posts an agent name, a traffic density and a seed to `/sim/start` and opens the WebSocket stream.',
          },
          {
            edgeId: 'e-backend-ckpt',
            title: 'Resolve the policy',
            caption: 'A baseline name (random, greedy, safe_rule) is built directly. Anything else is loaded from checkpoints/final, with the algorithm inferred from the file (.pt → DQN, .zip → PPO).',
          },
          {
            edgeId: 'e-backend-env',
            title: 'Reset the environment',
            caption: 'The service builds a LaneIQEnv for the chosen density and seed and resets it. Only one sim can run per backend process.',
          },
          {
            edgeId: 'e-env-traci',
            title: 'Warm up and insert the ego',
            caption: 'SUMO runs 50 steps to fill the road, then the ego is added, its own lane-change motivations are switched off and its lane-change requests are gap-checked.',
          },
          {
            nodeId: 'env',
            title: 'Observe, act, score',
            caption: 'Every 0.1 s of sim time: 25-dim observation and lane mask → policy action → changeLane or stay → 6-term reward.',
          },
          {
            edgeId: 'e-dashboard-backend',
            reverse: true,
            title: 'Stream the tick',
            caption: 'A SimTick with vehicle positions, the decision and its explanation, and the reward components is sent to every subscriber about 10 times a second.',
          },
        ],
      },
      {
        id: 'train-and-benchmark',
        name: 'Train a policy, then benchmark it',
        description: 'How a PPO checkpoint is produced and then compared fairly against every other agent.',
        steps: [
          {
            edgeId: 'e-scenario-traci',
            title: 'Pick the traffic',
            caption: 'Each episode loads one of three route files (low, medium or high density). A mixed-density wrapper samples one per reset for more robust training.',
          },
          {
            edgeId: 'e-ppo-env',
            title: 'Train with masks',
            caption: 'MaskablePPO collects rollouts from LaneIQEnv and reads `action_masks()`, so it never samples an impossible lane change.',
          },
          {
            edgeId: 'e-ppo-ckpt',
            title: 'Promote a checkpoint',
            caption: 'The chosen run is saved under checkpoints/final, where both the evaluation matrix and the live backend can find it.',
          },
          {
            edgeId: 'e-evalm-env',
            title: 'Run the matrix',
            caption: 'Every agent, baselines included, plays the same densities and seeds through the same env and Policy protocol.',
          },
          {
            nodeId: 'evalm',
            title: 'Aggregate to CSV',
            caption: 'Per-episode metrics, including the lane changes the env actually executed, are aggregated to mean ± std per cell over 20 seeds.',
          },
        ],
      },
    ],
  },
  install: {
    intro: 'Python 3.11 and uv. The eclipse-sumo wheel provides SUMO itself.',
    steps: [
      { label: 'Install dependencies', code: 'uv sync --extra sumo --extra rl --extra multiagent --extra dev' },
      { label: 'Open the scenario in SUMO-GUI', code: 'make sumo-gui' },
      { label: 'Run the backend', code: 'uv run uvicorn backend.app.main:app --reload --port 8000' },
    ],
  },
  links: { github: 'https://github.com/rzarka1298/Lane-Optimize' },
  demoId: 'lane-optimize-replay',
};

export default x;
