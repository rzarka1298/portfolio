import { motion } from 'framer-motion';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ArchNode, Architecture, NodeKind, TraceStep } from '../../content/projects/types';
import { cn } from '../../lib/utils';

/**
 * A lightweight, read-only drawing of a project's architecture for the home
 * page showcase. It uses the same content and layout rules as
 * `project/ArchitectureDiagram` (200x72 cards placed by x/y, group boxes
 * around their members, edges on facing sides) but renders plain SVG + HTML,
 * so the home page never loads React Flow.
 *
 * - Edges redraw and nodes snap in when it mounts (`animateIn`).
 * - `step` highlights one trace step: its edge turns orange and a signal dot
 *   travels along it; edges from earlier steps stay lit.
 * - `staticTrace` (reduced motion) highlights the whole trace at once.
 * - Clicking a node opens a small tooltip with its summary.
 */

// Same canvas units as ArchitectureDiagram (not imported: that module pulls in React Flow).
const NODE_W = 200;
const NODE_H = 72;
const GROUP_PAD = 24;
const GROUP_HEAD = 28;
const MARGIN = 20;
const EASE = [0.22, 1, 0.36, 1] as const;
const TRAVEL_MS = 1100;

const KIND_LABEL: Record<NodeKind, string> = {
  client: 'Client',
  ui: 'UI',
  service: 'Service',
  worker: 'Worker',
  datastore: 'Data store',
  queue: 'Queue',
  external: 'External',
};

type Rect = { x: number; y: number; w: number; h: number };

/** Shortest readable label: "Temporal · HarnessFlowProjectRun" → "Temporal". */
function shortLabel(label: string) {
  return label.split(/\s[·(]\s?/)[0].trim();
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Orthogonal "drafting" route between the facing sides of two cards. */
function routeEdge(a: Rect, b: Rect) {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const sx = dx >= 0 ? a.x + a.w : a.x;
    const tx = dx >= 0 ? b.x : b.x + b.w;
    const mx = (sx + tx) / 2;
    if (Math.abs(acy - bcy) < 1) return `M${sx} ${acy} H${tx}`;
    return `M${sx} ${acy} H${mx} V${bcy} H${tx}`;
  }
  const sy = dy >= 0 ? a.y + a.h : a.y;
  const ty = dy >= 0 ? b.y : b.y + b.h;
  const my = (sy + ty) / 2;
  if (Math.abs(acx - bcx) < 1) return `M${acx} ${sy} V${ty}`;
  return `M${acx} ${sy} V${my} H${bcx} V${ty}`;
}

function TravellingDot({ path, reverse }: { path: string; reverse: boolean }) {
  const ref = useRef<SVGAnimateMotionElement>(null);
  // begin="indefinite" + beginElement(): SMIL inserted after load would
  // otherwise start "in the past" and jump to its end.
  useLayoutEffect(() => {
    try {
      ref.current?.beginElement();
    } catch {
      /* SMIL unsupported: the lit edge still shows the step */
    }
  }, []);
  return (
    <g className="text-bp-signal">
      <circle r={9} className="fill-bp-signal/25" />
      <circle r={4} className="fill-bp-signal" style={{ filter: 'drop-shadow(0 0 6px currentColor)' }} />
      <animateMotion
        ref={ref}
        begin="indefinite"
        dur={`${TRAVEL_MS}ms`}
        fill="freeze"
        path={path}
        {...(reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
      />
    </g>
  );
}

export interface SchematicPreviewProps {
  architecture: Architecture;
  /** Index into `architecture.traces[0].steps`; -1 for none. */
  stepIndex: number;
  /** Highlight every step of the main trace at once (reduced motion). */
  staticTrace?: boolean;
  /** Redraw edges and snap nodes in on mount. */
  animateIn?: boolean;
  /** Seconds before the redraw starts (lets a stage wipe lead). */
  delay?: number;
  /** Called when a node tooltip opens or closes (e.g. to hold autoplay). */
  onInspect?: (open: boolean) => void;
  className?: string;
  /** Accessible name for the figure. */
  label: string;
}

export default function SchematicPreview({
  architecture,
  stepIndex,
  staticTrace = false,
  animateIn = true,
  delay = 0,
  onInspect,
  className,
  label,
}: SchematicPreviewProps) {
  const [boxRef, size] = useSize<HTMLDivElement>();
  const uid = useId().replace(/:/g, '');
  const trace = architecture.traces[0];
  const steps = useMemo(() => trace?.steps ?? [], [trace]);

  /* --- canvas bounds and fit --- */
  const groups = useMemo(
    () =>
      (architecture.groups ?? []).flatMap((g) => {
        const members = architecture.nodes.filter((n) => n.group === g.id);
        if (members.length === 0) return [];
        const x = Math.min(...members.map((n) => n.x)) - GROUP_PAD;
        const y = Math.min(...members.map((n) => n.y)) - GROUP_PAD - GROUP_HEAD;
        const x2 = Math.max(...members.map((n) => n.x)) + NODE_W + GROUP_PAD;
        const y2 = Math.max(...members.map((n) => n.y)) + NODE_H + GROUP_PAD;
        return [{ id: g.id, label: g.label, members: members.map((m) => m.id), rect: { x, y, w: x2 - x, h: y2 - y } }];
      }),
    [architecture],
  );

  const bounds = useMemo(() => {
    const rects: Rect[] = [
      ...architecture.nodes.map((n) => ({ x: n.x, y: n.y, w: NODE_W, h: NODE_H })),
      ...groups.map((g) => g.rect),
    ];
    const minX = Math.min(...rects.map((r) => r.x)) - MARGIN;
    const minY = Math.min(...rects.map((r) => r.y)) - MARGIN;
    const maxX = Math.max(...rects.map((r) => r.x + r.w)) + MARGIN;
    const maxY = Math.max(...rects.map((r) => r.y + r.h)) + MARGIN;
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [architecture.nodes, groups]);

  const scale = size.w && size.h ? Math.min(size.w / bounds.w, size.h / bounds.h) : 0;
  const ox = (size.w - bounds.w * scale) / 2 - bounds.minX * scale;
  const oy = (size.h - bounds.h * scale) / 2 - bounds.minY * scale;
  const toScreen = useCallback(
    (r: Rect): Rect => ({ x: ox + r.x * scale, y: oy + r.y * scale, w: r.w * scale, h: r.h * scale }),
    [ox, oy, scale],
  );
  // Labels need room for ~10 characters once a box takes some of the gutter.
  const showLabels = (NODE_W + 56) * scale >= 82;
  const showGroupLabels = scale >= 0.42;

  // Cards shrink with the canvas but labels don't: size each box to its
  // label (estimated at ~6.3px per character of 11px Space Grotesk), never
  // narrower than the scaled card nor wider than the card plus most of the
  // 80-unit gutter authors leave between columns. Keeps its centre.
  const nodeRects = useMemo(
    () =>
      new Map(
        architecture.nodes.map((n) => {
          const base = toScreen({ x: n.x, y: n.y, w: NODE_W, h: NODE_H });
          if (!showLabels) return [n.id, base];
          const want = shortLabel(n.label).length * 6.3 + 26;
          const w = Math.min(Math.max(base.w, want), (NODE_W + 56) * scale);
          const h = Math.max(base.h, 26);
          return [n.id, { x: base.x + (base.w - w) / 2, y: base.y + (base.h - h) / 2, w, h }];
        }),
      ),
    [architecture.nodes, toScreen, showLabels, scale],
  );

  const edges = useMemo(
    () =>
      architecture.edges.flatMap((e) => {
        const a = nodeRects.get(e.source);
        const b = nodeRects.get(e.target);
        if (!a || !b) return [];
        return [{ ...e, d: routeEdge(a, b), order: Math.min(a.x, b.x) + Math.min(a.y, b.y) * 0.25 }];
      }),
    [architecture.edges, nodeRects],
  );
  // Redraw sweeps left to right, like a plotter.
  const drawOrder = useMemo(() => {
    const sorted = [...edges].sort((p, q) => p.order - q.order);
    return new Map(sorted.map((e, i) => [e.id, i]));
  }, [edges]);

  /* --- trace highlight state --- */
  const { activeEdge, activeNodes, visitedEdges, visitedNodes, tracing } = useMemo(() => {
    const ae = new Set<string>();
    const an = new Set<string>();
    const ve = new Set<string>();
    const vn = new Set<string>();
    const endpoints = (s: TraceStep, edgeSet: Set<string>, nodeSet: Set<string>) => {
      if (s.nodeId) nodeSet.add(s.nodeId);
      if (s.edgeId) {
        edgeSet.add(s.edgeId);
        const e = architecture.edges.find((x) => x.id === s.edgeId);
        if (e) {
          nodeSet.add(e.source);
          nodeSet.add(e.target);
        }
      }
    };
    if (staticTrace) {
      steps.forEach((s) => endpoints(s, ae, an));
    } else if (stepIndex >= 0 && steps[stepIndex]) {
      endpoints(steps[stepIndex], ae, an);
      steps.slice(0, stepIndex).forEach((s) => endpoints(s, ve, vn));
    }
    return { activeEdge: ae, activeNodes: an, visitedEdges: ve, visitedNodes: vn, tracing: staticTrace || stepIndex >= 0 };
  }, [architecture.edges, staticTrace, stepIndex, steps]);

  const current = !staticTrace && stepIndex >= 0 ? steps[stepIndex] : undefined;
  const travelEdge = current?.edgeId ? edges.find((e) => e.id === current.edgeId) : undefined;
  // Where the current step lands; named in a callout when cards are too small for labels.
  const focusId = current
    ? (current.nodeId ?? (travelEdge ? (current.reverse ? travelEdge.source : travelEdge.target) : undefined))
    : undefined;
  const focusNode = focusId ? architecture.nodes.find((n) => n.id === focusId) : undefined;

  /* --- node tooltip --- */
  const [openId, setOpenId] = useState<string | null>(null);
  const openNode = openId ? architecture.nodes.find((n) => n.id === openId) : undefined;
  const onInspectRef = useRef(onInspect);
  onInspectRef.current = onInspect;
  useEffect(() => {
    onInspectRef.current?.(openId !== null);
  }, [openId]);
  useEffect(() => {
    if (!openId) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenId(null);
    };
    const onDown = (e: PointerEvent) => {
      const el = boxRef.current;
      if (el && !el.contains(e.target as Node)) setOpenId(null);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [openId, boxRef]);

  const ready = scale > 0;
  const tipId = `${uid}-tip`;

  return (
    <div
      ref={boxRef}
      role="group"
      aria-label={label}
      className={cn('relative h-full w-full select-none', className)}
      // Not a scroller, but keep Lenis's wheel handling off the canvas.
      data-lenis-prevent
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpenId(null);
      }}
    >
      {ready && (
        <>
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
            width={size.w}
            height={size.h}
            aria-hidden="true"
          >
            <defs>
              <marker
                id={`${uid}-arrow`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L8 4 L0 8 z" style={{ fill: 'hsl(var(--bp-line) / 0.7)' }} />
              </marker>
              <marker
                id={`${uid}-arrow-on`}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M0 0 L8 4 L0 8 z" style={{ fill: 'hsl(var(--bp-signal))' }} />
              </marker>
            </defs>

            {groups.map((g, i) => {
              const r = toScreen(g.rect);
              const lit = g.members.some((m) => activeNodes.has(m));
              return (
                <motion.g
                  key={g.id}
                  initial={animateIn ? { opacity: 0 } : false}
                  animate={{ opacity: tracing && !lit ? 0.45 : 1 }}
                  transition={{ duration: 0.5, delay: animateIn ? delay + 0.05 * i : 0 }}
                >
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.w}
                    height={r.h}
                    strokeDasharray="3 4"
                    className={cn(
                      'fill-bp-line/[0.03] transition-[stroke] duration-500',
                      lit ? 'stroke-bp-line/70' : 'stroke-bp-line-soft/60',
                    )}
                  />
                  {showGroupLabels && (
                    <text x={r.x + 8} y={r.y + 14} className="fill-bp-line font-mono text-[9px] uppercase tracking-[0.12em]">
                      {g.label}
                    </text>
                  )}
                </motion.g>
              );
            })}

            {edges.map((e) => {
              const on = activeEdge.has(e.id);
              const seen = visitedEdges.has(e.id);
              const order = drawOrder.get(e.id) ?? 0;
              return (
                <g key={e.id}>
                  <path d={e.d} fill="none" strokeWidth={1} strokeDasharray="2 4" className="stroke-bp-line-soft/40" />
                  <motion.path
                    d={e.d}
                    fill="none"
                    markerEnd={`url(#${uid}-arrow${on ? '-on' : ''})`}
                    initial={animateIn ? { pathLength: 0, opacity: 0 } : false}
                    animate={{ pathLength: 1, opacity: tracing && !on && !seen ? 0.35 : 1 }}
                    transition={{
                      pathLength: { duration: 0.7, delay: animateIn ? delay + 0.15 + order * 0.045 : 0, ease: EASE },
                      opacity: { duration: 0.3, delay: animateIn ? delay + 0.15 + order * 0.045 : 0 },
                    }}
                    strokeWidth={on ? 2.25 : 1.25}
                    className={cn(
                      'transition-[stroke,stroke-width] duration-300',
                      on ? 'stroke-bp-signal' : seen ? 'stroke-bp-line' : 'stroke-bp-line/70',
                    )}
                  />
                </g>
              );
            })}

            {travelEdge && (
              <TravellingDot key={`${travelEdge.id}:${stepIndex}`} path={travelEdge.d} reverse={!!current?.reverse} />
            )}
          </svg>

          {architecture.nodes.map((n, i) => (
            <NodeBox
              key={n.id}
              node={n}
              rect={nodeRects.get(n.id)!}
              showLabel={showLabels}
              state={activeNodes.has(n.id) ? 'active' : visitedNodes.has(n.id) ? 'visited' : tracing ? 'dimmed' : 'idle'}
              open={openId === n.id}
              tipId={tipId}
              enterDelay={animateIn ? delay + 0.1 + i * 0.035 : null}
              onToggle={() => setOpenId((cur) => (cur === n.id ? null : n.id))}
            />
          ))}

          {focusNode && !showLabels && !openNode && (
            <FocusCallout
              key={focusNode.id}
              label={shortLabel(focusNode.label)}
              anchor={nodeRects.get(focusNode.id)!}
              bounds={size}
            />
          )}

          {openNode && (
            <NodeTip
              id={tipId}
              node={openNode}
              anchor={nodeRects.get(openNode.id)!}
              bounds={size}
              onClose={() => setOpenId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

type NodeState = 'idle' | 'active' | 'visited' | 'dimmed';

function NodeBox({
  node,
  rect,
  showLabel,
  state,
  open,
  tipId,
  enterDelay,
  onToggle,
}: {
  node: ArchNode;
  rect: Rect;
  showLabel: boolean;
  state: NodeState;
  open: boolean;
  tipId: string;
  enterDelay: number | null;
  onToggle: () => void;
}) {
  const store = node.kind === 'datastore' || node.kind === 'queue';
  const external = node.kind === 'external';
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-describedby={open ? tipId : undefined}
      aria-label={`${node.label}, ${KIND_LABEL[node.kind]}`}
      initial={enterDelay !== null ? { opacity: 0, scale: 0.86 } : false}
      animate={{ opacity: state === 'dimmed' ? 0.5 : 1, scale: 1 }}
      transition={{
        opacity: { duration: 0.35, delay: enterDelay ?? 0 },
        scale: { duration: 0.45, delay: enterDelay ?? 0, ease: EASE },
      }}
      className={cn(
        'absolute flex items-center gap-1.5 overflow-hidden border bg-bp-panel text-left outline-none',
        'transition-[border-color,box-shadow,background-color] duration-300',
        'focus-visible:ring-2 focus-visible:ring-bp-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bp-bg',
        store ? 'border-l-[3px]' : external ? 'border-dashed' : 'border-l-2',
        state === 'active'
          ? 'border-bp-signal bg-bp-panel-2 shadow-[0_0_22px_hsl(var(--bp-signal)/0.35)]'
          : state === 'visited'
            ? 'border-bp-line'
            : 'border-bp-line/45 hover:border-bp-line',
        open && state !== 'active' && 'border-bp-line ring-1 ring-bp-line',
      )}
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h, paddingInline: Math.max(4, rect.w * 0.05) }}
    >
      <span
        aria-hidden="true"
        className={cn(
          'h-1.5 w-1.5 shrink-0 transition-colors duration-300',
          state === 'active' ? 'bg-bp-signal' : store ? 'bg-bp-ink/70' : external ? 'bg-bp-line-soft' : 'bg-bp-line',
        )}
      />
      {showLabel && (
        <span className="min-w-0 truncate font-display text-[11px] font-medium leading-tight text-bp-ink xl:text-xs">
          {shortLabel(node.label)}
        </span>
      )}
    </motion.button>
  );
}

function NodeTip({
  id,
  node,
  anchor,
  bounds,
  onClose,
}: {
  id: string;
  node: ArchNode;
  anchor: Rect;
  bounds: { w: number; h: number };
  onClose: () => void;
}) {
  const W = Math.min(260, bounds.w - 16);
  const left = Math.max(8, Math.min(anchor.x + anchor.w / 2 - W / 2, bounds.w - W - 8));
  const below = anchor.y + anchor.h + 10;
  const placeAbove = below > bounds.h * 0.55;
  return (
    <motion.div
      id={id}
      role="tooltip"
      initial={{ opacity: 0, y: placeAbove ? 6 : -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute z-10 border border-bp-line/60 bg-bp-panel/95 p-3 shadow-xl backdrop-blur"
      style={{
        left,
        width: W,
        ...(placeAbove ? { bottom: bounds.h - anchor.y + 10 } : { top: below }),
      }}
      onClick={onClose}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-bp-line">{KIND_LABEL[node.kind]}</span>
      </div>
      <div className="mt-1 font-display text-sm font-medium leading-snug text-bp-ink">{node.label}</div>
      <p className="mt-1 text-xs leading-relaxed text-bp-ink-dim">{node.summary}</p>
      {node.tech.length > 0 && (
        <div className="mt-2 font-mono text-[10px] leading-relaxed text-bp-line">{node.tech.slice(0, 4).join(' / ')}</div>
      )}
    </motion.div>
  );
}

/** Names the node a trace step lands on when the cards are too small to carry labels. */
function FocusCallout({ label, anchor, bounds }: { label: string; anchor: Rect; bounds: { w: number; h: number } }) {
  const above = anchor.y > 34;
  const cx = anchor.x + anchor.w / 2;
  const maxW = Math.min(180, bounds.w - 16);
  return (
    <motion.div
      aria-hidden="true"
      initial={{ opacity: 0, y: above ? 4 : -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: TRAVEL_MS / 1000 - 0.2 }}
      className="pointer-events-none absolute z-[5] whitespace-nowrap text-center font-mono text-[10px] leading-tight text-bp-ink"
      style={{
        left: Math.max(8, Math.min(cx - maxW / 2, bounds.w - maxW - 8)),
        width: maxW,
        ...(above ? { bottom: bounds.h - anchor.y + 6 } : { top: anchor.y + anchor.h + 6 }),
      }}
    >
      <span className="inline-block max-w-full truncate border border-bp-signal bg-bp-panel px-1.5 py-0.5 shadow-[0_0_12px_hsl(var(--bp-signal)/0.3)]">
        {label}
      </span>
    </motion.div>
  );
}
