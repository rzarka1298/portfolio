import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import HighwayCanvas, { CANVAS_HEIGHT } from './HighwayCanvas';
import {
  ACTION_LABEL,
  DRIVER_NOTE,
  DRIVER_TAG,
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

function egoAt(run: DriverRun, i: number) {
  const row = run.v[i];
  if (row && row.length && row[4] === 0) return { x: row[1], lane: row[2], speed: row[3] };
  return null;
}

/** Ticks where the ego's lane index actually changed (SUMO can refuse a requested change). */
function laneChangeTicks(run: DriverRun) {
  const out: number[] = [];
  let prev = -1;
  run.v.forEach((row, i) => {
    if (!row.length || row[4] !== 0) return;
    if (prev !== -1 && row[2] !== prev) out.push(i);
    prev = row[2];
  });
  return out;
}

interface Standing {
  run: DriverRun;
  done: boolean;
  x: number;
}

/** Where every driver is at tick i: finished drivers by finish time, the rest by distance. */
function standingsAt(drivers: DriverRun[], i: number): Standing[] {
  return drivers
    .map((run) => {
      const done = i >= run.v.length - 1;
      const ego = egoAt(run, Math.min(i, run.v.length - 1));
      return { run, done, x: ego ? ego.x : 0 };
    })
    .sort((a, b) => {
      if (a.done && b.done) return a.run.durationS - b.run.durationS;
      if (a.done !== b.done) return a.done ? -1 : 1;
      return b.x - a.x;
    });
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
  // One clock for the whole race: it runs until the slowest driver finishes.
  const lastTick = scenario ? Math.max(...scenario.drivers.map((d) => d.v.length)) - 1 : 0;
  // The reset to 0 on a scenario switch lands one render late; never index past the new race.
  const tick = Math.min(rawTick, lastTick);
  const changes = useMemo(() => (run ? laneChangeTicks(run) : []), [run]);
  const ghosts = useMemo(
    () =>
      (scenario?.drivers ?? [])
        .filter((d) => d.agent !== run?.agent)
        .map((d) => ({ tag: DRIVER_TAG[d.agent] ?? d.label, run: d })),
    [scenario, run],
  );

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

  // Start the race from the top whenever the scenario changes. Switching the
  // followed driver keeps the clock, so you can hop between cars mid-race.
  useEffect(() => {
    seek(0);
  }, [scenario, seek]);

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
    if (!playing || !scenario) return undefined;
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
  }, [playing, scenario, lastTick]);

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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlay();
    }
  };

  const runTick = run ? Math.min(tick, run.v.length - 1) : 0;
  const runDone = !!run && tick >= run.v.length - 1;
  const ego = run && !runDone ? egoAt(run, runTick) : null;
  const action: ActionCode = run && !runDone ? run.a[runTick] ?? -1 : -1;
  const standings = scenario ? standingsAt(scenario.drivers, tick) : [];
  const leaderX = standings.find((s) => !s.done)?.x ?? 0;
  const winner = scenario ? Math.min(...scenario.drivers.map((d) => d.durationS)) : 0;

  return (
    <div ref={rootRef} className="min-w-0 space-y-4" onKeyDown={onKeyDown}>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-bp-line/50 bg-bp-line/10 px-2.5 py-0.5 text-[11px] font-medium text-bp-line">
            Recorded SUMO episodes · real checkpoints
          </span>
          <span className="text-[11px] text-bp-ink-dim">Same traffic seed, six drivers, one clock</span>
        </div>
        <p className="text-sm text-bp-ink-dim">
          Each driver ran the same seed on its own, recorded tick by tick from the project&apos;s simulator. Here the runs
          are replayed side by side like ghost cars in a racing game: the filled car is the one you follow, and the
          outlines are where every other driver was at the same moment. Nothing is simulating live.
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
      ) : !scenario || !run ? (
        <div className="grid place-items-center border border-bp-line/30" style={{ height: CANVAS_HEIGHT + 120 }}>
          <span className="bp-label animate-pulse text-bp-line">Loading recording</span>
        </div>
      ) : (
        <>
          {/* Road */}
          <div className="relative border border-bp-line/40">
            <HighwayCanvas
              run={run}
              roadM={scenario.roadM}
              posRef={posRef}
              tag={DRIVER_TAG[run.agent] ?? run.label}
              ghosts={ghosts}
              label={`Top-down highway: following ${run.label} on ${meta.title}, with the other drivers shown as outlines`}
            />
            <div aria-live="polite" className="pointer-events-none absolute right-2 top-2">
              {runDone && (
                <span className="border border-bp-line bg-bp-bg/90 px-2 py-0.5 font-mono text-[11px] uppercase text-bp-line">
                  {run.label} finished · {run.durationS.toFixed(1)} s
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-bp-line/30 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.08em] text-bp-ink-dim">
              <Legend swatch="bg-bp-signal" label="Followed driver" />
              <Legend swatch="border border-dashed border-bp-ink" label="Other drivers" />
              <Legend swatch="bg-bp-ink/70" label="Traffic" />
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
                {changes.map((i) => (
                  <span
                    key={i}
                    className="absolute top-0 h-3 w-px bg-bp-signal/70"
                    style={{ left: `${(i / Math.max(1, lastTick)) * 100}%` }}
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
                aria-valuetext={`${(tick / TICKS_PER_S).toFixed(1)} seconds`}
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
          <p className="text-[11px] text-bp-ink-dim">
            Orange marks on the timeline are the followed driver&apos;s lane changes.
          </p>

          <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
            {/* Followed driver */}
            <div className="grid grid-cols-2 content-start gap-px border border-bp-line/30 bg-bp-line/20">
              <Stat label="Race clock" value={`${(tick / TICKS_PER_S).toFixed(1)} s`} />
              <Stat label="Distance" value={ego ? `${ego.x.toFixed(0)} m` : `${scenario.roadM} m`} />
              <Stat label="Speed" value={ego ? `${(ego.speed * 3.6).toFixed(0)} km/h` : '—'} />
              <Stat label="Lane" value={ego ? LANE_NAME[Math.round(ego.lane)] : '—'} />
              <div className="col-span-2 bg-bp-bg p-3">
                <span className="bp-label text-bp-ink-dim">Policy output</span>
                <p className="mt-1 font-mono text-sm text-bp-signal-ink">
                  {runDone ? 'FINISHED' : ACTION_LABEL[action]}
                </p>
                <p className="text-xs text-bp-ink-dim">
                  <span className="font-mono text-bp-ink">{run.agent}</span> · {DRIVER_NOTE[run.agent]}
                </p>
              </div>
            </div>

            {/* Standings, which double as the driver picker */}
            <div className="border border-bp-line/30">
              <div className="flex items-baseline justify-between border-b border-bp-line/30 px-3 py-2">
                <span className="bp-label text-bp-ink-dim">Standings · pick a car to follow</span>
              </div>
              <ol role="radiogroup" aria-label="Driver to follow">
                {standings.map((s, rank) => {
                  const on = s.run.agent === run.agent;
                  const behind = s.done ? s.run.durationS - winner : null;
                  return (
                    <li key={s.run.agent}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setAgent(s.run.agent)}
                        className={cn(
                          'grid w-full grid-cols-[1.5rem_1fr_auto] items-center gap-2 border-l-2 px-3 py-1.5 text-left text-xs',
                          on ? 'border-bp-signal bg-bp-panel' : 'border-transparent hover:bg-bp-panel/60',
                          focusRing,
                        )}
                      >
                        <span className="font-mono text-bp-ink-dim">{rank + 1}</span>
                        <span className={cn('text-sm', on ? 'text-bp-ink' : 'text-bp-ink-dim')}>{s.run.label}</span>
                        <span className="font-mono tabular-nums text-bp-ink">
                          {s.done
                            ? `${s.run.durationS.toFixed(1)} s${behind && behind > 0.05 ? ` (+${behind.toFixed(1)})` : ''}`
                            : `${s.x.toFixed(0)} m${leaderX - s.x >= 1 ? ` (−${(leaderX - s.x).toFixed(0)})` : ''}`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>

          {/* Final results */}
          <div className="overflow-x-auto border border-bp-line/30">
            <table className="w-full min-w-[30rem] text-left text-xs">
              <caption className="sr-only">Final results for every driver on {meta.title}</caption>
              <thead className="font-mono uppercase tracking-[0.08em] text-bp-ink-dim">
                <tr className="border-b border-bp-line/30">
                  <th className="px-3 py-2 font-normal">Driver</th>
                  <th className="px-3 py-2 text-right font-normal">Time to 1 km</th>
                  <th className="px-3 py-2 text-right font-normal">Mean speed</th>
                  <th className="px-3 py-2 text-right font-normal">Lane changes</th>
                </tr>
              </thead>
              <tbody>
                {[...scenario.drivers]
                  .sort((a, b) => a.durationS - b.durationS)
                  .map((d) => (
                    <tr
                      key={d.agent}
                      className={cn('border-b border-bp-line/15 last:border-0', d.agent === run.agent && 'bg-bp-panel')}
                    >
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setAgent(d.agent)}
                          className={cn('text-left text-bp-ink underline-offset-2 hover:underline', focusRing)}
                        >
                          {d.label}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">
                        {d.outcome === 'collision' ? `crashed at ${d.durationS.toFixed(1)} s` : `${d.durationS.toFixed(1)} s`}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{(d.meanSpeed * 3.6).toFixed(0)} km/h</td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{d.laneChanges}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] leading-relaxed text-bp-ink-dim">
            One seed per scenario, chosen because the drivers&apos; choices change the result. Lane changes go through
            SUMO&apos;s gap check (lane-change mode 768), so a request that would cut into another car is refused and
            the ego holds its lane. Recorded with <code className="font-mono">scripts/record_replay.py</code>; the clock
            starts when the ego joins the road.
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
