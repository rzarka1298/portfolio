import { useEffect, useRef } from 'react';
import type { DriverRun } from './data';

// Every driver ran the same seed on its own, and background cars react to the
// ego, so each run has its own traffic. Drawing one driver over another's
// traffic would show cars driving through each other. Instead each driver gets
// its own compact road with its own traffic, stacked under a shared progress
// strip that shows where everyone is on the 1 km road.
//
// The vertical axis is exaggerated (a true-aspect lane would be a few pixels
// tall). Lane 0 is the rightmost lane, drawn at the bottom of each road.
const N_LANES = 3;
const PX_PER_M = 2.4;
const LANE_PX = 11;
const CAR_LEN_M = 5;
const CAR_H = 6;
const ROW_GAP = 8;
const LABEL_W = 92;
const STRIP_H = 40;
/** Each row's ego sits this far across its road so more road ahead is visible. */
const EGO_ANCHOR = 0.3;
const ROAD_H = N_LANES * LANE_PX;

function raceCanvasHeight(rows: number) {
  return STRIP_H + rows * (ROAD_H + ROW_GAP);
}

/** Placeholder height while a six-driver scenario loads. */
export const RACE_LOADING_HEIGHT = STRIP_H + 6 * (ROAD_H + ROW_GAP);

interface Palette {
  bg: string;
  road: string;
  lane: string;
  edge: string;
  ink: string;
  dim: string;
  ego: string;
  normal: string;
  slow: string;
  aggressive: string;
  panel: string;
}

function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, alpha = 1) => `hsl(${css.getPropertyValue(name).trim()} / ${alpha})`;
  return {
    bg: v('--bp-bg'),
    road: v('--bp-panel'),
    lane: v('--bp-line-soft', 0.55),
    edge: v('--bp-line', 0.8),
    ink: v('--bp-ink'),
    dim: v('--bp-ink-dim'),
    ego: v('--bp-signal'),
    normal: v('--bp-ink', 0.6),
    // Fixed teal: --bp-line is navy on paper and would match the normal cars.
    slow: 'hsl(185 70% 45%)',
    aggressive: 'hsl(350 85% 64%)',
    panel: v('--bp-signal', 0.1),
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
  const f = j === i ? 0 : Math.min(1, pos - i);
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

export interface RaceRow {
  agent: string;
  /** Short label, e.g. "DQN". */
  tag: string;
  run: DriverRun;
}

interface Props {
  rows: RaceRow[];
  selected: string;
  roadM: number;
  /** Fractional tick index on the shared race clock; read every frame. */
  posRef: React.MutableRefObject<number>;
  label: string;
  onSelect: (agent: string) => void;
}

export default function RaceCanvas({ rows, selected, roadM, posRef, label, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const height = raceCanvasHeight(rows.length);

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
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const mono = (px: number) => `${px}px "JetBrains Mono", ui-monospace, monospace`;

    let raf = 0;
    const draw = () => {
      const pos = posRef.current;
      const all = rowsRef.current;
      const sel = selectedRef.current;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, width, height);

      // --- Progress strip: everyone on one 0–1000 m line ---------------------
      const sx0 = LABEL_W;
      const sx1 = width - 12;
      const stripY = 24;
      const toStrip = (m: number) => sx0 + (Math.max(0, Math.min(roadM, m)) / roadM) * (sx1 - sx0);
      ctx.font = mono(9);
      ctx.textBaseline = 'middle';
      ctx.fillStyle = palette.dim;
      ctx.fillText('PROGRESS', 8, stripY);
      ctx.fillStyle = palette.lane;
      ctx.fillRect(sx0, stripY, sx1 - sx0, 1);
      for (let m = 0; m <= roadM; m += 250) {
        const x = toStrip(m);
        ctx.fillRect(x, stripY - 3, 1, 7);
      }
      ctx.textBaseline = 'top';
      ctx.fillStyle = palette.dim;
      ctx.fillText('0', sx0, stripY + 6);
      const endLabel = `${roadM} m`;
      ctx.fillText(endLabel, sx1 - ctx.measureText(endLabel).width, stripY + 6);

      // Group drivers at the same spot so their tags share one label.
      const marks: { x: number; tags: string[]; on: boolean }[] = [];
      for (const r of all) {
        const done = pos >= r.run.v.length - 1;
        const { ego } = carsAt(r.run, pos);
        const x = toStrip(done ? roadM : ego ? ego.x : egoXBefore(r.run, Math.floor(pos)));
        const same = marks.find((mk) => Math.abs(mk.x - x) < 2);
        if (same) {
          same.tags.push(r.tag);
          same.on = same.on || r.agent === sel;
        } else marks.push({ x, tags: [r.tag], on: r.agent === sel });
      }
      marks.sort((a, b) => a.x - b.x);
      ctx.textBaseline = 'bottom';
      let lastRight = -Infinity;
      let up = true;
      for (const mk of marks) {
        ctx.fillStyle = mk.on ? palette.ego : palette.ink;
        ctx.beginPath();
        ctx.arc(mk.x, stripY + 0.5, mk.on ? 4 : 3, 0, Math.PI * 2);
        ctx.fill();
        const text = mk.tags.join(' · ');
        const w = ctx.measureText(text).width;
        let tx = Math.min(sx1 - w, Math.max(sx0, mk.x - w / 2));
        // Alternate above/below when labels would collide.
        up = tx < lastRight + 6 ? !up : true;
        if (up) lastRight = tx + w;
        tx = Math.min(sx1 - w, Math.max(sx0, mk.x - w / 2));
        ctx.textBaseline = up ? 'bottom' : 'top';
        ctx.fillText(text, tx, up ? stripY - 5 : stripY + 6);
      }

      // --- One compact road per driver, each following its own ego -----------
      const roadW = width - LABEL_W;
      const len = CAR_LEN_M * PX_PER_M;
      all.forEach((r, ri) => {
        const top = STRIP_H + ri * (ROAD_H + ROW_GAP);
        const on = r.agent === sel;
        const last = r.run.v.length - 1;
        const done = pos >= last;
        const { cars, ego } = carsAt(r.run, Math.min(pos, last));
        const egoX = ego && !done ? ego.x : egoXBefore(r.run, Math.floor(pos));
        const camX = egoX - (roadW * EGO_ANCHOR) / PX_PER_M;
        const sx = (x: number) => LABEL_W + (x - camX) * PX_PER_M;
        const laneY = (lane: number) => top + (N_LANES - 1 - lane) * LANE_PX + LANE_PX / 2;

        if (on) {
          ctx.fillStyle = palette.panel;
          ctx.fillRect(0, top - 3, width, ROAD_H + 6);
        }

        // Label column.
        ctx.textBaseline = 'top';
        ctx.font = mono(10);
        ctx.fillStyle = on ? palette.ego : palette.ink;
        ctx.fillText(r.tag, 8, top + 2);
        ctx.font = mono(9);
        ctx.fillStyle = palette.dim;
        ctx.fillText(done ? `✓ ${r.run.durationS.toFixed(1)} s` : `${egoX.toFixed(0)} m`, 8, top + 16);

        ctx.save();
        ctx.beginPath();
        ctx.rect(LABEL_W, top, roadW, ROAD_H);
        ctx.clip();

        const roadL = Math.max(LABEL_W, sx(0));
        const roadR = Math.min(width, sx(roadM));
        ctx.fillStyle = palette.road;
        ctx.fillRect(roadL, top, Math.max(0, roadR - roadL), ROAD_H);
        ctx.fillStyle = palette.edge;
        ctx.fillRect(roadL, top, roadR - roadL, 1);
        ctx.fillRect(roadL, top + ROAD_H - 1, roadR - roadL, 1);
        ctx.strokeStyle = palette.lane;
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 8]);
        ctx.lineDashOffset = camX * PX_PER_M;
        for (let l = 1; l < N_LANES; l++) {
          const y = top + l * LANE_PX + 0.5;
          ctx.beginPath();
          ctx.moveTo(roadL, y);
          ctx.lineTo(roadR, y);
          ctx.stroke();
        }
        ctx.setLineDash([]);

        const fx = sx(roadM);
        if (fx > LABEL_W && fx < width + 6) {
          for (let k = 0; k < ROAD_H / 4; k++) {
            ctx.fillStyle = k % 2 ? palette.edge : palette.road;
            ctx.fillRect(fx - 4, top + k * 4, 4, 4);
          }
        }

        for (const c of cars) {
          const x = sx(c.x);
          if (x < LABEL_W - len || x > width + len) continue;
          ctx.fillStyle = c.vtype === 1 ? palette.aggressive : c.vtype === 3 ? palette.slow : palette.normal;
          // SUMO positions are the front bumper.
          ctx.fillRect(x - len, laneY(c.lane) - CAR_H / 2, len, CAR_H);
        }
        if (ego && !done) {
          const x = sx(ego.x);
          const y = laneY(ego.lane);
          ctx.fillStyle = palette.ego;
          ctx.fillRect(x - len, y - CAR_H / 2 - 1, len, CAR_H + 2);
          if (on) {
            ctx.strokeStyle = palette.ego;
            ctx.strokeRect(x - len - 2.5, y - CAR_H / 2 - 3.5, len + 5, CAR_H + 7);
          }
        }
        ctx.restore();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      themeObserver.disconnect();
      media.removeEventListener('change', onMedia);
    };
  }, [posRef, roadM, height]);

  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const y = e.nativeEvent.offsetY - STRIP_H + ROW_GAP / 2;
    const i = Math.floor(y / (ROAD_H + ROW_GAP));
    if (y >= 0 && i >= 0 && i < rows.length) onSelect(rows[i].agent);
  };

  return (
    <div ref={wrapRef} className="w-full overflow-hidden">
      <canvas ref={canvasRef} role="img" aria-label={label} className="block cursor-pointer" onClick={onClick} />
    </div>
  );
}
