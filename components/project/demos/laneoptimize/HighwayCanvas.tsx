import { useEffect, useRef } from 'react';
import type { DriverRun } from './data';

// Geometry. The road is 1 km × 3 lanes; at true aspect the lanes would be
// a few pixels tall, so the vertical axis is exaggerated (as in the
// project's own dashboard). Lane 0 is the rightmost lane, drawn at the bottom.
const N_LANES = 3;
const PX_PER_M = 3;
const LANE_PX = 30;
const ROAD_TOP = 22;
const ROAD_BOTTOM = 8;
const CAR_LEN_M = 5;
const CAR_H = 12;
/** Ego sits this far across the canvas so more road ahead is visible. */
const EGO_ANCHOR = 0.36;

export const CANVAS_HEIGHT = ROAD_TOP + N_LANES * LANE_PX + ROAD_BOTTOM;

interface Palette {
  bg: string;
  road: string;
  lane: string;
  edge: string;
  label: string;
  ego: string;
  normal: string;
  slow: string;
  aggressive: string;
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, alpha = 1) => `hsl(${css.getPropertyValue(name).trim()} / ${alpha})`;
  return {
    bg: v('--bp-bg'),
    road: v('--bp-panel'),
    lane: v('--bp-line-soft', 0.55),
    edge: v('--bp-line', 0.8),
    label: v('--bp-ink-dim'),
    ego: v('--bp-signal'),
    normal: v('--bp-ink', 0.72),
    // Fixed teal: --bp-line is navy on paper and would match the normal cars.
    slow: 'hsl(185 70% 45%)',
    aggressive: 'hsl(350 85% 64%)',
  };
}

interface Car {
  x: number;
  lane: number;
  vtype: number;
}

/** Vehicles at fractional tick `pos`, interpolated by id between neighbouring ticks. */
function carsAt(run: DriverRun, pos: number): { cars: Car[]; ego: Car | null } {
  const last = run.v.length - 1;
  const i = Math.max(0, Math.min(last, Math.floor(pos)));
  const j = Math.min(last, i + 1);
  const f = j === i ? 0 : pos - i;
  const a = run.v[i];
  const b = run.v[j];
  const next = new Map<number, number>();
  for (let k = 0; k < b.length; k += 5) next.set(b[k], k);
  const ease = f * f * (3 - 2 * f);
  const cars: Car[] = [];
  let ego: Car | null = null;
  for (let k = 0; k < a.length; k += 5) {
    const id = a[k];
    let x = a[k + 1];
    let lane = a[k + 2];
    const nk = next.get(id);
    if (nk !== undefined) {
      x += (b[nk + 1] - x) * f;
      lane += (b[nk + 2] - lane) * ease;
    }
    const car = { x, lane, vtype: a[k + 4] };
    if (car.vtype === 0) ego = car;
    else cars.push(car);
  }
  return { cars, ego };
}

/** Last ego x at or before tick i (the ego leaves the road when it finishes). */
function egoXBefore(run: DriverRun, i: number): number {
  for (let k = Math.min(i, run.v.length - 1); k >= 0; k--) {
    const row = run.v[k];
    if (row.length && row[4] === 0) return row[1];
  }
  return 0;
}

interface Props {
  run: DriverRun;
  roadM: number;
  /** Fractional tick index; read every frame. */
  posRef: React.MutableRefObject<number>;
  label: string;
}

export default function HighwayCanvas({ run, roadM, posRef, label }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const runRef = useRef(run);
  runRef.current = run;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return undefined;
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let palette = readPalette();
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onMedia = () => {
      palette = readPalette();
    };
    media.addEventListener('change', onMedia);

    let width = 0;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = wrap.clientWidth;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(CANVAS_HEIGHT * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${CANVAS_HEIGHT}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const draw = (now: number) => {
      const r = runRef.current;
      const pos = posRef.current;
      const { cars, ego } = carsAt(r, pos);
      const egoX = ego ? ego.x : egoXBefore(r, Math.floor(pos));
      const camX = egoX - (width * EGO_ANCHOR) / PX_PER_M;
      const sx = (x: number) => (x - camX) * PX_PER_M;
      const laneY = (lane: number) => ROAD_TOP + (N_LANES - 1 - lane) * LANE_PX + LANE_PX / 2;

      ctx.clearRect(0, 0, width, CANVAS_HEIGHT);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, CANVAS_HEIGHT);

      // Road surface, clipped to [0, roadM].
      const roadL = Math.max(0, sx(0));
      const roadR = Math.min(width, sx(roadM));
      ctx.fillStyle = palette.road;
      ctx.fillRect(roadL, ROAD_TOP, Math.max(0, roadR - roadL), N_LANES * LANE_PX);

      // Distance ticks every 50 m, labels every 100 m.
      ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline = 'top';
      const first = Math.ceil(camX / 50) * 50;
      for (let m = first; m <= camX + width / PX_PER_M; m += 50) {
        if (m < 0 || m > roadM) continue;
        const x = sx(m);
        ctx.fillStyle = palette.lane;
        ctx.fillRect(x, ROAD_TOP - 5, 1, 5);
        if (m % 100 === 0) {
          ctx.fillStyle = palette.label;
          ctx.fillText(`${m} m`, x + 3, 6);
        }
      }

      // Lane markings: solid edges, dashed dividers that scroll with the road.
      ctx.fillStyle = palette.edge;
      ctx.fillRect(roadL, ROAD_TOP, roadR - roadL, 1);
      ctx.fillRect(roadL, ROAD_TOP + N_LANES * LANE_PX - 1, roadR - roadL, 1);
      ctx.strokeStyle = palette.lane;
      ctx.lineWidth = 1;
      ctx.setLineDash([10, 12]);
      ctx.lineDashOffset = camX * PX_PER_M;
      for (let l = 1; l < N_LANES; l++) {
        const y = ROAD_TOP + l * LANE_PX + 0.5;
        ctx.beginPath();
        ctx.moveTo(roadL, y);
        ctx.lineTo(roadR, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Finish line.
      const fx = sx(roadM);
      if (fx > 0 && fx < width) {
        for (let k = 0; k < (N_LANES * LANE_PX) / 6; k++) {
          ctx.fillStyle = k % 2 ? palette.edge : palette.road;
          ctx.fillRect(fx - 6, ROAD_TOP + k * 6, 6, 6);
        }
      }

      const len = CAR_LEN_M * PX_PER_M;
      const colorFor = (t: number) => (t === 1 ? palette.aggressive : t === 3 ? palette.slow : palette.normal);
      for (const c of cars) {
        const x = sx(c.x);
        if (x < -len || x > width + len) continue;
        ctx.fillStyle = colorFor(c.vtype);
        // SUMO positions are the front bumper.
        ctx.fillRect(x - len, laneY(c.lane) - CAR_H / 2, len, CAR_H);
      }

      const atEnd = Math.floor(pos) >= r.v.length - 1;
      if (ego) {
        const x = sx(ego.x);
        const y = laneY(ego.lane);
        ctx.fillStyle = palette.ego;
        ctx.fillRect(x - len, y - CAR_H / 2, len, CAR_H);
        ctx.strokeStyle = palette.ego;
        ctx.strokeRect(x - len - 3.5, y - CAR_H / 2 - 3.5, len + 7, CAR_H + 7);
        if (atEnd && r.outcome === 'collision') {
          const pulse = (now % 900) / 900;
          ctx.strokeStyle = palette.aggressive;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 1 - pulse;
          ctx.beginPath();
          ctx.arc(x - len / 2, y, 10 + pulse * 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 1;
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      media.removeEventListener('change', onMedia);
    };
  }, [posRef, roadM]);

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <canvas ref={canvasRef} role="img" aria-label={label} className="block" />
    </div>
  );
}
