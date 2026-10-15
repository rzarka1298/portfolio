/// <reference types="vite/client" />
import React, { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  getBezierPath,
  useReactFlow,
  useStore,
  type Edge,
  type EdgeProps,
  type EdgeTypes,
  type Node,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Cloud,
  Cog,
  Database,
  ExternalLink,
  FileCode,
  Hand,
  Layers,
  LayoutDashboard,
  Monitor,
  Pause,
  Play,
  RotateCcw,
  Server,
  SkipForward,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useIsMobile } from '../ui/use-mobile';
import { cn } from '../../lib/utils';
import type { ArchNode, Architecture, NodeKind, Trace, TraceStep } from '../../content/projects/types';

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Node card size in canvas px. Content authors lay out x/y against this. */
export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 72;
const GROUP_PADDING = 24;
const GROUP_HEADER = 28;
const STEP_MS = 2400;
const TRAVEL_MS = 1400;
const FIT_VIEW_OPTIONS = { padding: 0.15 };

// Blueprint tokens (styles/globals.css); they follow the site theme.
const EDGE_IDLE = 'hsl(var(--bp-line-soft))';
const EDGE_ACTIVE = 'hsl(var(--bp-signal))';
const DOT_COLOR = 'hsl(var(--bp-signal))';

type ElementState = 'idle' | 'active' | 'dimmed';

interface KindStyle {
  icon: LucideIcon;
  label: string;
  accent: string;
  iconBox: string;
}

// Blueprint: one ink family. Compute nodes carry the cyan line, stores
// and queues the paper/ink tone, externals the soft line; the icon and the
// side panel's kind label carry the rest.
const ICON_LINE = 'border-bp-line/40 bg-bp-line/10 text-bp-line';
const ICON_INK = 'border-bp-ink/30 bg-bp-ink/5 text-bp-ink';
const ICON_SOFT = 'border-bp-line-soft/50 bg-transparent text-bp-line-soft';

const KIND_STYLES: Record<NodeKind, KindStyle> = {
  client: { icon: Monitor, label: 'Client', accent: 'border-l-bp-line', iconBox: ICON_LINE },
  ui: { icon: LayoutDashboard, label: 'UI', accent: 'border-l-bp-line', iconBox: ICON_LINE },
  service: { icon: Server, label: 'Service', accent: 'border-l-bp-line', iconBox: ICON_LINE },
  worker: { icon: Cog, label: 'Worker', accent: 'border-l-bp-line', iconBox: ICON_LINE },
  datastore: { icon: Database, label: 'Data store', accent: 'border-l-bp-ink/70', iconBox: ICON_INK },
  queue: { icon: Layers, label: 'Queue', accent: 'border-l-bp-ink/70', iconBox: ICON_INK },
  external: { icon: Cloud, label: 'External', accent: 'border-l-bp-line-soft', iconBox: ICON_SOFT },
};

/* ------------------------------------------------------------------ */
/* Flow element types                                                  */
/* ------------------------------------------------------------------ */

type ArchNodeData = { node: ArchNode; state: ElementState; isSelected: boolean };
type ArchFlowNode = Node<ArchNodeData, 'arch'>;

type GroupNodeData = { label: string; state: ElementState };
type GroupFlowNode = Node<GroupNodeData, 'archGroup'>;

type FlowNode = ArchFlowNode | GroupFlowNode;

type Travel = { key: string; reverse: boolean };
type TraceEdgeData = { label?: string; state: ElementState; travel: Travel | null };
type TraceFlowEdge = Edge<TraceEdgeData, 'trace'>;

type Side = 'top' | 'right' | 'bottom' | 'left';
const SIDE_POSITION: Record<Side, Position> = {
  top: Position.Top,
  right: Position.Right,
  bottom: Position.Bottom,
  left: Position.Left,
};
const SIDES = Object.keys(SIDE_POSITION) as Side[];

/** Pick the facing sides of two nodes so edges don't loop around cards. */
function pickSides(a: ArchNode, b: ArchNode): [Side, Side] {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
  return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
}

/* ------------------------------------------------------------------ */
/* Custom nodes and edge                                               */
/* ------------------------------------------------------------------ */

const hiddenHandle: React.CSSProperties = { opacity: 0, pointerEvents: 'none', width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0 };

const ArchNodeView = memo(function ArchNodeView({ data }: NodeProps<ArchFlowNode>) {
  const { node, state, isSelected } = data;
  const style = KIND_STYLES[node.kind] ?? KIND_STYLES.service;
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 border border-l-2 bg-bp-panel px-3 text-bp-ink transition-all duration-300',
        'border-bp-line/45 hover:border-bp-line',
        style.accent,
        state === 'dimmed' && 'opacity-30',
        state === 'active' && 'border-bp-signal shadow-[0_0_24px_hsl(var(--bp-signal)/0.35)]',
        isSelected && state !== 'active' && 'ring-1 ring-bp-line ring-offset-2 ring-offset-bp-bg',
      )}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      title={`${node.label} — ${style.label}`}
    >
      {SIDES.map((side) => (
        <React.Fragment key={side}>
          <Handle type="source" id={`${side}-s`} position={SIDE_POSITION[side]} isConnectable={false} style={hiddenHandle} />
          <Handle type="target" id={`${side}-t`} position={SIDE_POSITION[side]} isConnectable={false} style={hiddenHandle} />
        </React.Fragment>
      ))}
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center border',
          state === 'active' ? 'border-bp-signal/60 bg-bp-signal/10 text-bp-signal' : style.iconBox,
        )}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-display text-sm font-medium leading-tight">{node.label}</div>
        <div className="mt-0.5 truncate text-xs leading-tight text-bp-ink-dim">{node.summary}</div>
      </div>
    </div>
  );
});

const GroupNodeView = memo(function GroupNodeView({ data, width, height }: NodeProps<GroupFlowNode>) {
  return (
    <div
      className={cn(
        'border border-dashed border-bp-line-soft/60 bg-bp-line/[0.03] transition-opacity duration-300',
        data.state === 'dimmed' && 'opacity-40',
      )}
      style={{ width, height }}
    >
      <div className="bp-label px-3 pt-2 text-bp-line">
        {data.label}
      </div>
    </div>
  );
});

function TravellingDot({ path, reverse }: { path: string; reverse: boolean }) {
  const motionRef = useRef<SVGAnimateMotionElement>(null);

  // begin="indefinite" + beginElement(): a SMIL animation inserted after page
  // load would otherwise start "in the past" and jump straight to its end.
  useLayoutEffect(() => {
    try {
      motionRef.current?.beginElement();
    } catch {
      /* SMIL unsupported — the highlighted edge still conveys the step */
    }
  }, []);

  return (
    <circle r={6} fill={DOT_COLOR} style={{ filter: `drop-shadow(0 0 6px ${DOT_COLOR}) drop-shadow(0 0 12px ${DOT_COLOR})` }}>
      <animateMotion
        ref={motionRef}
        begin="indefinite"
        dur={`${TRAVEL_MS}ms`}
        fill="freeze"
        path={path}
        {...(reverse ? { keyPoints: '1;0', keyTimes: '0;1', calcMode: 'linear' } : {})}
      />
    </circle>
  );
}

const TraceEdgeView = memo(function TraceEdgeView({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps<TraceFlowEdge>) {
  const [path, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const state = data?.state ?? 'idle';
  const active = state === 'active';

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        style={{
          stroke: active ? EDGE_ACTIVE : EDGE_IDLE,
          strokeWidth: active ? 2.5 : 1.5,
          opacity: state === 'dimmed' ? 0.25 : 1,
          transition: 'opacity 300ms, stroke 300ms',
        }}
      />
      {data?.travel && <TravellingDot key={data.travel.key} path={path} reverse={data.travel.reverse} />}
      {data?.label && (
        <EdgeLabelRenderer>
          <div
            className={cn(
              'nodrag nopan pointer-events-none absolute border border-bp-line-soft/50 bg-bp-bg/90 px-1.5 py-0.5 font-mono text-[10px] text-bp-ink-dim transition-opacity duration-300',
              state === 'dimmed' && 'opacity-30',
              active && 'border-bp-signal text-bp-ink',
            )}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

const nodeTypes: NodeTypes = { arch: ArchNodeView, archGroup: GroupNodeView };
const edgeTypes: EdgeTypes = { trace: TraceEdgeView };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function useIsDarkMode() {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')));
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

/** Re-fit when the canvas is resized (rotation, breakpoint changes). */
function FitOnResize() {
  const { fitView } = useReactFlow();
  const width = useStore((s) => s.width);
  const height = useStore((s) => s.height);
  useEffect(() => {
    if (width && height) void fitView(FIT_VIEW_OPTIONS);
  }, [width, height, fitView]);
  return null;
}

/** Dev-only: flag content that references ids that don't exist. */
function warnOnBadReferences(architecture: Architecture) {
  if (!import.meta.env.DEV) return;
  const nodeIds = new Set(architecture.nodes.map((n) => n.id));
  const edgeIds = new Set(architecture.edges.map((e) => e.id));
  const groupIds = new Set((architecture.groups ?? []).map((g) => g.id));
  for (const n of architecture.nodes) {
    if (n.group && !groupIds.has(n.group)) console.warn(`[architecture] node "${n.id}" has unknown group "${n.group}"`);
  }
  for (const e of architecture.edges) {
    if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) console.warn(`[architecture] edge "${e.id}" references a missing node`);
  }
  for (const t of architecture.traces) {
    t.steps.forEach((s, i) => {
      if (s.edgeId && !edgeIds.has(s.edgeId)) console.warn(`[architecture] trace "${t.id}" step ${i} has unknown edgeId "${s.edgeId}"`);
      if (s.nodeId && !nodeIds.has(s.nodeId)) console.warn(`[architecture] trace "${t.id}" step ${i} has unknown nodeId "${s.nodeId}"`);
    });
  }
}

function codeUrl(github: string | undefined, codePath: string | undefined) {
  if (!github || !codePath) return undefined;
  return `${github.replace(/\/+$/, '')}/blob/main/${codePath.replace(/^\/+/, '')}`;
}

/* ------------------------------------------------------------------ */
/* Side panel / mobile drawer                                          */
/* ------------------------------------------------------------------ */

interface NodePanelProps {
  node: ArchNode;
  githubUrl?: string;
  isMobile: boolean;
  onClose: () => void;
}

function NodePanel({ node, githubUrl, isMobile, onClose }: NodePanelProps) {
  const style = KIND_STYLES[node.kind] ?? KIND_STYLES.service;
  const Icon = style.icon;
  const href = codeUrl(githubUrl, node.codePath);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node.id, onClose]);

  const body = (
    <>
      <div className="flex items-start gap-3 pr-8">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center border', style.iconBox)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="bp-label text-bp-line">{style.label}</div>
          <h4 id="arch-panel-title" className="text-lg font-medium leading-tight">{node.label}</h4>
        </div>
      </div>
      <Button
        ref={closeRef}
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute right-2 top-2"
        aria-label="Close details"
      >
        <X className="h-4 w-4" />
      </Button>

      <p className="mt-4 text-sm font-medium">{node.summary}</p>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {node.details.split(/\n\s*\n/).map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>

      {node.tech.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {node.tech.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      )}

      {node.codePath && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <FileCode className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              <code className="truncate">{node.codePath}</code>
              <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            </a>
          ) : (
            <code className="truncate text-muted-foreground">{node.codePath}</code>
          )}
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <>
        <motion.button
          type="button"
          aria-label="Close details"
          className="fixed inset-0 z-[60] bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="arch-panel-title"
          data-lenis-prevent
          className="fixed inset-x-0 bottom-0 z-[61] max-h-[75vh] overflow-y-auto border-t border-bp-line/60 bg-bp-panel p-5 pb-8 shadow-2xl"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="mx-auto mb-4 h-1 w-10 bg-bp-line-soft/60" aria-hidden="true" />
          <div className="relative">{body}</div>
        </motion.div>
      </>
    );
  }

  return (
    <motion.aside
      role="dialog"
      aria-labelledby="arch-panel-title"
      data-lenis-prevent
      className="absolute inset-y-3 right-3 z-10 w-80 overflow-y-auto border border-bp-line/40 bg-bp-panel/95 p-5 shadow-xl backdrop-blur"
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative">{body}</div>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/* Trace controls                                                      */
/* ------------------------------------------------------------------ */

interface TraceControlsProps {
  traces: Trace[];
  traceId: string | undefined;
  onTraceChange: (id: string) => void;
  playing: boolean;
  atEnd: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
}

function TraceControls({ traces, traceId, onTraceChange, playing, atEnd, onPlay, onPause, onStep, onReset }: TraceControlsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex min-w-0 items-center gap-2 text-sm">
        <span className="bp-label shrink-0 text-bp-line">Trace a request</span>
        <select
          value={traceId}
          onChange={(event) => onTraceChange(event.target.value)}
          className="h-9 min-w-0 flex-1 border border-bp-line-soft/60 bg-bp-panel px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
        >
          {traces.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        {playing ? (
          <Button size="sm" onClick={onPause} aria-label="Pause trace" className="rounded-none bg-bp-signal text-[#0B2341] hover:bg-bp-signal/90">
            <Pause /> Pause
          </Button>
        ) : (
          <Button size="sm" onClick={onPlay} aria-label={atEnd ? 'Replay trace' : 'Play trace'} className="rounded-none bg-bp-signal text-[#0B2341] hover:bg-bp-signal/90">
            <Play /> {atEnd ? 'Replay' : 'Play'}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onStep} disabled={atEnd} aria-label="Next step" className="rounded-none">
          <SkipForward /> Step
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} aria-label="Reset trace" className="rounded-none">
          <RotateCcw /> Reset
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export interface ArchitectureDiagramProps {
  architecture: Architecture;
  /** Repo URL; enables codePath links as `${githubUrl}/blob/main/${codePath}`. */
  githubUrl?: string;
  className?: string;
}

export default function ArchitectureDiagram({ architecture, githubUrl, className }: ArchitectureDiagramProps) {
  const isMobile = useIsMobile();
  const isDark = useIsDarkMode();
  const reduceMotion = useReducedMotion() ?? false;
  // Touch screens: the canvas is locked so swipes scroll the page; "Explore"
  // unlocks pan/pinch until "Done".
  const [exploring, setExploring] = useState(false);
  const canvasInteractive = !isMobile || exploring;
  useEffect(() => {
    if (!isMobile) setExploring(false);
  }, [isMobile]);

  useEffect(() => warnOnBadReferences(architecture), [architecture]);

  const { nodes: archNodes, edges: archEdges, traces } = architecture;
  const nodeById = useMemo(() => new Map(archNodes.map((n) => [n.id, n])), [archNodes]);
  const edgeById = useMemo(() => new Map(archEdges.map((e) => [e.id, e])), [archEdges]);

  /* --- selection --- */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = selectedId ? nodeById.get(selectedId) : undefined;
  const closePanel = useCallback(() => setSelectedId(null), []);

  /* --- trace playback --- */
  const [traceId, setTraceId] = useState<string | undefined>(traces[0]?.id);
  const trace = traces.find((t) => t.id === traceId) ?? traces[0];
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const lastIndex = trace ? trace.steps.length - 1 : -1;
  const atEnd = stepIndex >= lastIndex && lastIndex >= 0;
  const step: TraceStep | undefined = trace && stepIndex >= 0 ? trace.steps[stepIndex] : undefined;

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (stepIndex >= lastIndex) setPlaying(false);
      else setStepIndex((i) => i + 1);
    }, STEP_MS);
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, lastIndex]);

  const play = () => {
    if (!trace || lastIndex < 0) return;
    if (stepIndex < 0 || stepIndex >= lastIndex) setStepIndex(0);
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const stepForward = () => {
    setPlaying(false);
    setStepIndex((i) => Math.min(i + 1, lastIndex));
  };
  const reset = () => {
    setPlaying(false);
    setStepIndex(-1);
  };
  const changeTrace = (id: string) => {
    setTraceId(id);
    reset();
  };

  /* --- derived highlight state --- */
  const activeEdge = step?.edgeId ? edgeById.get(step.edgeId) : undefined;
  const activeNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (step?.nodeId) ids.add(step.nodeId);
    if (activeEdge) {
      ids.add(activeEdge.source);
      ids.add(activeEdge.target);
    }
    return ids;
  }, [step, activeEdge]);
  const tracing = step !== undefined;

  const nodes: FlowNode[] = useMemo(() => {
    const stateFor = (id: string): ElementState => (!tracing ? 'idle' : activeNodeIds.has(id) ? 'active' : 'dimmed');

    const groupNodes: GroupFlowNode[] = (architecture.groups ?? []).flatMap((group) => {
      const members = archNodes.filter((n) => n.group === group.id);
      if (members.length === 0) return [];
      const minX = Math.min(...members.map((n) => n.x)) - GROUP_PADDING;
      const minY = Math.min(...members.map((n) => n.y)) - GROUP_PADDING - GROUP_HEADER;
      const maxX = Math.max(...members.map((n) => n.x)) + NODE_WIDTH + GROUP_PADDING;
      const maxY = Math.max(...members.map((n) => n.y)) + NODE_HEIGHT + GROUP_PADDING;
      const anyActive = members.some((n) => activeNodeIds.has(n.id));
      return [{
        id: `group:${group.id}`,
        type: 'archGroup' as const,
        position: { x: minX, y: minY },
        width: maxX - minX,
        height: maxY - minY,
        data: { label: group.label, state: !tracing ? 'idle' : anyActive ? 'active' : 'dimmed' },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 0,
      }];
    });

    const cards: ArchFlowNode[] = archNodes.map((n) => ({
      id: n.id,
      type: 'arch' as const,
      position: { x: n.x, y: n.y },
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      data: { node: n, state: stateFor(n.id), isSelected: n.id === selectedId },
      selected: n.id === selectedId,
      draggable: false,
      zIndex: 2,
      ariaLabel: `${n.label}: ${n.summary}. Press Enter for details.`,
    }));

    return [...groupNodes, ...cards];
  }, [architecture.groups, archNodes, activeNodeIds, tracing, selectedId]);

  const edges: TraceFlowEdge[] = useMemo(
    () =>
      archEdges.flatMap((e) => {
        const source = nodeById.get(e.source);
        const target = nodeById.get(e.target);
        if (!source || !target) return [];
        const [sourceSide, targetSide] = pickSides(source, target);
        const state: ElementState = !tracing ? 'idle' : e.id === activeEdge?.id ? 'active' : 'dimmed';
        const travel: Travel | null =
          state === 'active' && !reduceMotion
            ? { key: `${trace?.id}:${stepIndex}`, reverse: !!step?.reverse }
            : null;
        return [{
          id: e.id,
          type: 'trace' as const,
          source: e.source,
          target: e.target,
          sourceHandle: `${sourceSide}-s`,
          targetHandle: `${targetSide}-t`,
          markerEnd: { type: MarkerType.ArrowClosed, color: state === 'active' ? EDGE_ACTIVE : EDGE_IDLE, width: 16, height: 16 },
          data: { label: e.label, state, travel },
          selectable: false,
          focusable: false,
          zIndex: 1,
        }];
      }),
    [archEdges, nodeById, tracing, activeEdge, reduceMotion, trace?.id, stepIndex, step?.reverse],
  );

  // Controlled nodes: apply only selection changes (click / Enter on a focused node).
  const onNodesChange = useCallback((changes: NodeChange<FlowNode>[]) => {
    let next: string | null | undefined;
    for (const change of changes) {
      if (change.type !== 'select') continue;
      if (change.selected) next = change.id;
      else if (next === undefined) next = null;
    }
    if (next !== undefined) setSelectedId(next);
  }, []);

  return (
    <div className={cn('space-y-4', className)}>
      {traces.length > 0 && (
        <TraceControls
          traces={traces}
          traceId={trace?.id}
          onTraceChange={changeTrace}
          playing={playing}
          atEnd={atEnd}
          onPlay={play}
          onPause={pause}
          onStep={stepForward}
          onReset={reset}
        />
      )}

      <div
        className={cn(
          'arch-diagram relative h-[420px] overflow-hidden border border-bp-line/40 bg-bp-bg md:h-[560px]',
          !canvasInteractive && 'arch-diagram--locked',
          exploring && 'ring-2 ring-bp-signal/60',
        )}
        // The canvas owns wheel and drag gestures; keep Lenis out of them.
        data-lenis-prevent
      >
        <ReactFlow<FlowNode, TraceFlowEdge>
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onPaneClick={closePanel}
          colorMode={isDark ? 'dark' : 'light'}
          fitView
          fitViewOptions={FIT_VIEW_OPTIONS}
          minZoom={0.2}
          maxZoom={1.75}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          elementsSelectable
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
          panOnScroll={false}
          preventScrolling={false}
          // On touch screens a one-finger drag scrolls the page unless exploring.
          panOnDrag={canvasInteractive}
          zoomOnPinch={canvasInteractive}
          proOptions={{ hideAttribution: false }}
          // Let the card background (site theme tokens) show through in both modes.
          style={{ background: 'transparent', '--xy-background-color': 'transparent' } as React.CSSProperties}
        >
          <Background variant={BackgroundVariant.Lines} gap={24} lineWidth={1} color="hsl(var(--bp-grid) / 0.8)" />
          <Controls showInteractive={false} position="bottom-left" />
          <FitOnResize />
        </ReactFlow>

        {isMobile && (
          <Button
            size="sm"
            variant={exploring ? 'default' : 'secondary'}
            onClick={() => setExploring((v) => !v)}
            className="absolute right-2 top-2 z-[5] rounded-none"
            aria-pressed={exploring}
          >
            <Hand /> {exploring ? 'Done' : 'Explore'}
          </Button>
        )}

        <AnimatePresence>
          {selectedNode && !isMobile && (
            <NodePanel key={selectedNode.id} node={selectedNode} githubUrl={githubUrl} isMobile={false} onClose={closePanel} />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedNode && isMobile && (
          <NodePanel key={selectedNode.id} node={selectedNode} githubUrl={githubUrl} isMobile onClose={closePanel} />
        )}
      </AnimatePresence>

      {trace && (
        <div className="min-h-[4.5rem] border border-bp-line-soft/40 bg-bp-panel/60 px-4 py-3" aria-live="polite">
          {step ? (
            <>
              <div className="bp-label mb-1 text-bp-signal-ink">
                Step {stepIndex + 1} of {trace.steps.length}
              </div>
              <div className="font-medium">{step.title}</div>
              <p className="text-sm text-muted-foreground">{step.caption}</p>
            </>
          ) : (
            <>
              <div className="font-medium">{trace.name}</div>
              <p className="text-sm text-muted-foreground">
                {trace.description} Press Play to follow it step by step, or click any component for details.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
