import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import HighwayCanvas, { CANVAS_HEIGHT } from './HighwayCanvas';
import {
  ACTION_LABEL,
  ACTION_TEXT,
  DRIVER_NOTE,
  REWARD_LABEL,
  SCENARIOS,
  loadScenario,
  type ActionCode,
  type DriverRun,
  type Scenario,
  type ScenarioId,
} from './data';

/** SUMO steps 100 ms per tick; 1× plays in real time. */
const TICKS_PER_S = 10;
const SPEEDS = [1, 2, 4] as const;
type Speed = (typeof SPEEDS)[number];

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background';
const btn = cn(
  'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 border border-bp-line/40 bg-bp-bg px-2.5 font-mono text-xs uppercase tracking-[0.08em] text-bp-ink hover:border-bp-line disabled:pointer-events-none disabled:opacity-40',
  focusRing,
);
const LANE_NAME = ['Right', 'Middle', 'Left'];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function outcomeText(d: DriverRun) {
  return d.outcome === 'collision' ? `Crashed at ${d.durationS.toFixed(1)} s` : `Finished in ${d.durationS.toFixed(1)} s`;
}

/** Per-tick derived series for one run: cumulative reward per component and ego readouts. */
function useRunSeries(run: DriverRun | undefined, keys: string[]) {
  return useMemo(() => {
    if (!run) return null;
    const n = run.t.length;
    const cum: number[][] = [];
    const acc = keys.map(() => 0);
    for (let i = 0; i < n; i++) {
      run.r[i].forEach((x, k) => {
        acc[k] += x;
      });
      cum.push([...acc]);
    }
    // One scale for every term so bar lengths compare across terms.
    const maxAbs = Math.max(1e-6, ...cum.flatMap((row) => row.map(Math.abs)));
    const changes: { i: number; a: ActionCode }[] = [];
    run.a.forEach((a, i) => {
      if (a === 1 || a === 2) changes.push({ i, a });
    });
    return { n, cum, maxAbs, changes };
  }, [run, keys]);
}

function egoAt(run: DriverRun, i: number) {
  const row = run.v[i];
  if (row && row.length && row[4] === 0) return { x: row[1], lane: row[2], speed: row[3] };
  return null;
}

export default function LaneOptimizeReplay() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(SCENARIOS[0].id);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState(false);
  const [agent, setAgent] = useState(SCENARIOS[0].defaultAgent);
  const [rawTick, setTick] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const posRef = useRef(0);
  const speedRef = useRef<Speed>(speed);
  speedRef.current = speed;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const autoplayed = useRef(false);

  const meta = SCENARIOS.find((s) => s.id === scenarioId)!;
  const run = scenario?.drivers.find((d) => d.agent === agent) ?? scenario?.drivers[0];
  const series = useRunSeries(run, scenario?.rewardKeys ?? []);
  const lastTick = (series?.n ?? 1) - 1;
  // The reset to 0 on a driver/scenario switch lands one render late; never index past the new run.
  const tick = Math.min(rawTick, lastTick);

  useEffect(() => {
    let alive = true;
    setScenario(null);
    setError(false);
    loadScenario(scenarioId)
      .then((s) => alive && setScenario(s))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [scenarioId]);

  const seek = useCallback((i: number) => {
    posRef.current = i;
    setTick(Math.floor(i));
  }, []);

  // Start a run from the top whenever the scenario or driver changes.
  useEffect(() => {
    seek(0);
  }, [scenario, agent, seek]);

  // Autoplay once, the first time the demo scrolls into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || !scenario || autoplayed.current || prefersReducedMotion()) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          autoplayed.current = true;
          setPlaying(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [scenario]);

  useEffect(() => {
    if (!playing || !series) return undefined;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(100, now - last) / 1000;
      last = now;
      const next = Math.min(lastTick, posRef.current + dt * TICKS_PER_S * speedRef.current);
      posRef.current = next;
      setTick((prev) => (Math.floor(next) === prev ? prev : Math.floor(next)));
      if (next >= lastTick) {
        setPlaying(false);
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, series, lastTick]);

  const atEnd = tick >= lastTick;
  const togglePlay = () => {
    if (playing) setPlaying(false);
    else {
      if (atEnd) seek(0);
      setPlaying(true);
    }
  };
  const pickScenario = (id: ScenarioId) => {
    if (id === scenarioId) return;
    setScenarioId(id);
    setAgent(SCENARIOS.find((s) => s.id === id)!.defaultAgent);
    setPlaying(!prefersReducedMotion());
  };
  const pickDriver = (a: string) => {
    setAgent(a);
    setPlaying(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlay();
    }
  };

  const ego = run ? egoAt(run, tick) : null;
  const action: ActionCode = run ? run.a[tick] ?? -1 : -1;
  const ret = series ? series.cum[tick].reduce((s, x) => s + x, 0) : 0;
  const crashed = !!run && atEnd && run.outcome === 'collision';
  const finished = !!run && atEnd && run.outcome === 'finished';

  return (
    <div ref={rootRef} className="min-w-0 space-y-4" onKeyDown={onKeyDown}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-bp-line/50 bg-bp-line/10 px-2.5 py-0.5 text-[11px] font-medium text-bp-line">
            Recorded SUMO episodes · real checkpoints
          </span>
          <span className="text-[11px] text-bp-ink-dim">Same traffic seed, different driver</span>
        </div>
        <p className="text-sm text-bp-ink-dim">
          Each run was recorded tick by tick from the project&apos;s simulator with the evaluated checkpoints, then
          replayed here. Nothing is simulating live. Pick a scenario, then a driver.
        </p>
      </div>

      {/* Scenario tabs */}
      <div role="tablist" aria-label="Scenario" className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={s.id === scenarioId}
            onClick={() => pickScenario(s.id)}
            className={cn(
              'border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em]',
              s.id === scenarioId
                ? 'border-bp-signal bg-bp-signal/10 text-bp-ink'
                : 'border-bp-line/30 text-bp-ink-dim hover:border-bp-line hover:text-bp-ink',
              focusRing,
            )}
          >
            {s.tab}
          </button>
        ))}
      </div>
      <p className="text-sm text-bp-ink">{meta.blurb}</p>

      {error ? (
        <p className="border border-bp-line/30 p-6 text-sm text-bp-ink-dim">This scenario couldn&apos;t be loaded.</p>
      ) : !scenario || !run || !series ? (
        <div className="grid place-items-center border border-bp-line/30" style={{ height: CANVAS_HEIGHT + 120 }}>
          <span className="bp-label animate-pulse text-bp-line">Loading recording</span>
        </div>
      ) : (
        <>
          {/* Driver picker */}
          <div role="radiogroup" aria-label="Driver" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {scenario.drivers.map((d) => {
              const on = d.agent === run.agent;
              return (
                <button
                  key={d.agent}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pickDriver(d.agent)}
                  className={cn(
                    'border p-2.5 text-left transition-colors',
                    on ? 'border-bp-signal bg-bp-panel' : 'border-bp-line/30 hover:border-bp-line',
                    focusRing,
                  )}
                >
                  <span className="block text-sm font-medium text-bp-ink">{d.label}</span>
                  <span
                    className={cn(
                      'mt-1 block font-mono text-[11px]',
                      d.outcome === 'collision' ? 'text-[hsl(350_85%_64%)]' : 'text-bp-line',
                    )}
                  >
                    {outcomeText(d)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-bp-ink-dim">
            <span className="font-mono text-bp-ink">{run.agent}</span> · {DRIVER_NOTE[run.agent]}
          </p>

          {/* Road */}
          <div className="relative border border-bp-line/40">
            <HighwayCanvas
              run={run}
              roadM={scenario.roadM}
              posRef={posRef}
              label={`Top-down highway: ${run.label} driving the ${meta.title} scenario`}
            />
            <div aria-live="polite" className="pointer-events-none absolute right-2 top-2">
              {crashed && (
                <span className="border border-[hsl(350_85%_64%)] bg-bp-bg/90 px-2 py-0.5 font-mono text-[11px] uppercase text-[hsl(350_85%_64%)]">
                  Collision · episode over
                </span>
              )}
              {finished && (
                <span className="border border-bp-line bg-bp-bg/90 px-2 py-0.5 font-mono text-[11px] uppercase text-bp-line">
                  Reached the end of the road
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-bp-line/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-bp-ink-dim">
              <Legend swatch="bg-bp-signal" label="Ego (policy-driven)" />
              <Legend swatch="bg-bp-ink/70" label="Normal" />
              <Legend swatch="bg-[hsl(185_70%_45%)]" label="Slow" />
              <Legend swatch="bg-[hsl(350_85%_64%)]" label="Aggressive" />
            </div>
          </div>

          {/* Controls + timeline */}
          <div role="toolbar" aria-label="Replay controls" className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} onClick={() => seek(0)} aria-label="Restart" title="Restart">
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className={cn(btn, 'border-bp-signal bg-bp-signal px-4 text-[#0B2341] hover:bg-bp-signal/90')}
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : atEnd ? 'Replay from start' : 'Play'}
              title="Play / pause (K)"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
            </button>
            <div className="relative min-w-[10rem] flex-1">
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2">
                {series.changes.map((c) => (
                  <span
                    key={c.i}
                    className="absolute top-0 h-3 w-px bg-bp-signal/70"
                    style={{ left: `${(c.i / Math.max(1, lastTick)) * 100}%` }}
                  />
                ))}
              </div>
              <input
                type="range"
                min={0}
                max={lastTick}
                step={1}
                value={tick}
                onChange={(e) => {
                  setPlaying(false);
                  seek(Number(e.target.value));
                }}
                aria-label="Replay position"
                aria-valuetext={`${run.t[tick].toFixed(1)} seconds`}
                className={cn('relative w-full accent-[hsl(var(--bp-signal))]', focusRing)}
              />
            </div>
            <div role="radiogroup" aria-label="Playback speed" className="flex">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  role="radio"
                  aria-checked={speed === sp}
                  onClick={() => setSpeed(sp)}
                  className={cn(
                    'h-9 border border-bp-line/40 px-2.5 font-mono text-xs -ml-px first:ml-0',
                    speed === sp ? 'border-bp-line bg-bp-line/15 text-bp-ink' : 'text-bp-ink-dim hover:text-bp-ink',
                    focusRing,
                  )}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-bp-ink-dim">Orange marks on the timeline are lane changes.</p>

          {/* Readouts */}
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
            <div className="grid grid-cols-2 gap-px border border-bp-line/30 bg-bp-line/20 sm:grid-cols-4">
              <Stat label="Sim time" value={`${run.t[tick].toFixed(1)} s`} />
              <Stat label="Ego speed" value={ego ? `${(ego.speed * 3.6).toFixed(0)} km/h` : '—'} />
              <Stat label="Lane" value={ego ? LANE_NAME[ego.lane] : '—'} />
              <Stat label="Return" value={ret.toFixed(1)} />
              <div className="col-span-2 bg-bp-bg p-3 sm:col-span-4">
                <span className="bp-label text-bp-ink-dim">Decision</span>
                <p className="mt-1 font-mono text-sm text-bp-signal-ink">{ACTION_LABEL[action]}</p>
                <p className="text-xs text-bp-ink-dim">{ACTION_TEXT[action]}</p>
              </div>
            </div>
            <div className="border border-bp-line/30 p-3">
              <span className="bp-label text-bp-ink-dim">Reward so far, by term</span>
              <ul className="mt-2 space-y-1.5">
                {scenario.rewardKeys.map((k, ki) => {
                  const val = series.cum[tick][ki];
                  const w = Math.min(50, (Math.abs(val) / series.maxAbs) * 50);
                  return (
                    <li key={k} className="grid grid-cols-[6.5rem_1fr_3.5rem] items-center gap-2 text-xs">
                      <span className="text-bp-ink-dim">{REWARD_LABEL[k] ?? k}</span>
                      <span className="relative h-2 bg-bp-line/10">
                        <span className="absolute inset-y-0 left-1/2 w-px bg-bp-line/40" />
                        <span
                          className={cn('absolute inset-y-0', val >= 0 ? 'left-1/2 bg-bp-line' : 'right-1/2 bg-bp-signal')}
                          style={{ width: `${w}%` }}
                        />
                      </span>
                      <span className="text-right font-mono tabular-nums text-bp-ink">{val.toFixed(1)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* All drivers in this scenario */}
          <div className="overflow-x-auto border border-bp-line/30">
            <table className="w-full min-w-[34rem] text-left text-xs">
              <caption className="sr-only">Every driver on {meta.title}</caption>
              <thead className="font-mono uppercase tracking-[0.08em] text-bp-ink-dim">
                <tr className="border-b border-bp-line/30">
                  <th className="px-3 py-2 font-normal">Driver</th>
                  <th className="px-3 py-2 font-normal">Outcome</th>
                  <th className="px-3 py-2 text-right font-normal">Mean speed</th>
                  <th className="px-3 py-2 text-right font-normal">Lane changes</th>
                  <th className="px-3 py-2 text-right font-normal">Return</th>
                </tr>
              </thead>
              <tbody>
                {scenario.drivers.map((d) => (
                  <tr
                    key={d.agent}
                    className={cn('border-b border-bp-line/15 last:border-0', d.agent === run.agent && 'bg-bp-panel')}
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => pickDriver(d.agent)}
                        className={cn('text-left text-bp-ink underline-offset-2 hover:underline', focusRing)}
                      >
                        {d.label}
                      </button>
                    </td>
                    <td className={cn('px-3 py-2', d.outcome === 'collision' ? 'text-[hsl(350_85%_64%)]' : 'text-bp-line')}>
                      {outcomeText(d)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{(d.meanSpeed * 3.6).toFixed(0)} km/h</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{d.laneChanges}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{d.return.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-bp-ink-dim">
            One seed per scenario, chosen to show the drivers diverging. Across the full 20-seed matrix the PPO was the
            only single-agent policy with no collisions at any density. Recorded with{' '}
            <code className="font-mono">scripts/record_replay.py</code>; time counts from when the ego joins the road.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bp-bg p-3">
      <span className="bp-label text-bp-ink-dim">{label}</span>
      <p className="mt-1 font-mono text-base tabular-nums text-bp-ink">{value}</p>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2 w-3', swatch)} />
      {label}
    </span>
  );
}
