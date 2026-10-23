"""Pack LaneIQ replay JSONs into compact columnar scenario files for the portfolio demo.

Record the inputs in the Lane-Optimize repo, one per (scenario, agent), e.g.

    uv run python -m scripts.record_replay --agent ppo_v12_safety_cd_150k \
        --density high --seed 14 --out <replays>/high_s14_ppo_v12_safety_cd_150k.json

then run, from this repo:

    python3 scripts/pack-lane-replays.py <replays> components/project/demos/laneoptimize/scenarios
"""
import json, sys
from pathlib import Path

SRC = Path(sys.argv[1]); DST = Path(sys.argv[2])
ACTIONS = {"stay": 0, "change_left": 1, "change_right": 2}
VTYPES = {"ego": 0, "aggressive": 1, "normal": 2, "slow": 3}
REWARD_KEYS = ["speed", "lane_cost", "jerk", "unsafe_gap", "collision", "alive"]
DRIVERS = {
    "random": "Random",
    "greedy": "Greedy",
    "safe_rule": "Rule-based",
    "dqn_v4_mixed_200k_obsfix": "DQN",
    "ppo_v12_safety_cd_150k": "PPO",
    "ppo_v10_gauntlet_cd_300k": "PPO (gauntlet-trained)",
}
ALL = ["random", "greedy", "safe_rule", "dqn_v4_mixed_200k_obsfix", "ppo_v12_safety_cd_150k", "ppo_v10_gauntlet_cd_300k"]
SCENARIOS = {
    "high_s13": ("high", 13, ALL),
    "high_s7": ("high", 7, ALL),
    "gauntlet_s9": ("gauntlet", 9, ALL),
}

for sid, (density, seed, agents) in SCENARIOS.items():
    drivers = []
    explanations: list[str] = []
    for agent in agents:
        raw = json.loads((SRC / f"{sid}_{agent}.json").read_text())
        ticks = raw["ticks"]
        ids: dict[str, int] = {}
        t, a, e, r, v = [], [], [], [], []
        for tick in ticks:
            t.append(round(tick["t"], 1))
            d = tick["decision"]
            a.append(ACTIONS[d["action"]] if d else -1)
            if d:
                if d["explanation"] not in explanations:
                    explanations.append(d["explanation"])
                e.append(explanations.index(d["explanation"]))
            else:
                e.append(-1)
            r.append([round(tick["info"].get(k, 0.0), 3) for k in REWARD_KEYS])
            flat = []
            # ego first so the renderer can find it at index 0
            for veh in sorted(tick["vehicles"], key=lambda x: not x["is_ego"]):
                vid = ids.setdefault(veh["id"], len(ids))
                flat += [vid, round(veh["x"], 1), veh["lane"], round(veh["speed"], 1), VTYPES[veh["vtype"]]]
            v.append(flat)
        last = ticks[-1]
        collided = last["info"].get("collision", 0) < 0
        # Count moves the ego actually made: with a safety-checked controller
        # SUMO can refuse a requested change, so actions overcount.
        # The first recorded tick is already after step 1, so start from the
        # env's spawn lane (LaneIQEnv: lane 1, or lane 0 on the gauntlet).
        spawn_lane = 0 if density == "gauntlet" else 1
        ego_lanes = [spawn_lane] + [veh["lane"] for tick in ticks for veh in tick["vehicles"] if veh["is_ego"]]
        lane_changes = sum(1 for p, q in zip(ego_lanes, ego_lanes[1:]) if p != q)
        ego_speeds = [veh["speed"] for tick in ticks for veh in tick["vehicles"] if veh["is_ego"]]
        drivers.append({
            "agent": agent,
            "label": DRIVERS[agent],
            "outcome": "collision" if collided else "finished",
            "durationS": round(last["t"] - ticks[0]["t"] + 0.1, 1),
            "laneChanges": lane_changes,
            "meanSpeed": round(sum(ego_speeds) / len(ego_speeds), 1),
            "return": round(sum(sum(x) for x in r), 1),
            "t": t, "a": a, "r": r, "v": v,
        })
    out = {"id": sid, "density": density, "seed": seed, "roadM": 1000,
           "rewardKeys": REWARD_KEYS, "drivers": drivers}
    p = DST / f"{sid}.json"
    p.write_text(json.dumps(out, separators=(",", ":")))
    print(sid, p.stat().st_size // 1024, "KB", [(d["label"], d["outcome"], d["durationS"], d["laneChanges"], d["meanSpeed"], d["return"]) for d in drivers])
