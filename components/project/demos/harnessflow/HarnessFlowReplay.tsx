import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { ChevronDown, ChevronsRight, Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react';
import type { DemoProps } from '../index';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { framesAt, frames, replay, runClockAt, RUN_SECONDS, vt, V_TOTAL } from './data';
import {
  ActivityPanel,
  ArtifactsPanel,
  AttemptsPanel,
  CriteriaPanel,
  EvidencePanel,
  FrameLog,
  JudgePanel,
  Metrics,
  PlanPanel,
  RepairNote,
  ReviewPanel,
  RunHeader,
  WorkspacePanel,
} from './panels';
import { deriveState, type Detail } from './state';
import { focusRing } from './styles';
import { Code } from './ui';

/** Milliseconds of playback per virtual second at 1× (~36 s for the whole run). */
const MS_PER_V = 110;
const SPEEDS = [1, 4, 16] as const;
type Speed = (typeof SPEEDS)[number];

const btn = cn(
  'inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md border bg-background px-2.5 text-xs font-medium hover:bg-muted disabled:pointer-events-none disabled:opacity-40',
  focusRing,
);

export default function HarnessFlowReplay(_props: DemoProps) {
  const [v, setV] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [prdOpen, setPrdOpen] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const speedRef = useRef<Speed>(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setV((prev) => {
        const next = Math.min(V_TOTAL, prev + (dt / MS_PER_V) * speedRef.current);
        if (next >= V_TOTAL) setPlaying(false);
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const count = framesAt(v);
  const s = useMemo(() => deriveState(count), [count]);
  const clock = runClockAt(v);
  const atEnd = v >= V_TOTAL;

  const togglePlay = useCallback(() => {
    if (playing) setPlaying(false);
    else {
      if (v >= V_TOTAL) setV(0);
      setPlaying(true);
    }
  }, [playing, v]);
  const seekFrame = useCallback((i: number) => {
    setPlaying(false);
    setV(vt[Math.min(Math.max(i, 0), vt.length - 1)]);
  }, []);
  const restart = () => {
    setV(0);
    setPlaying(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === ',') {
      e.preventDefault();
      seekFrame(count - 2);
    } else if (e.key === '.') {
      e.preventDefault();
      seekFrame(count);
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-w-0 space-y-4" onKeyDown={onKeyDown}>
        {/* Honest framing */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-teal-500/50 bg-teal-50 px-2.5 py-0.5 text-[11px] font-medium text-teal-800 dark:bg-teal-950 dark:text-teal-200">
              Recorded run · {replay.source.recorded} · scrubbed
            </span>
            <span className="text-[11px] text-muted-foreground">Checks passed but review rejected → repair → re-verify</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Replay of a real run (recorded {replay.source.recorded}). Every frame below comes from the run's own records;
            nothing is executing live. Values the recording did not keep are marked as unavailable.
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className={cn('cursor-pointer rounded', focusRing)}>About this recording</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5 leading-relaxed">
              <li>
                Command: <code className="break-all font-mono">{replay.source.entry_point}</code>
              </li>
              <li>{replay.source.timing}</li>
              <li>{replay.source.limits_note}</li>
              <li>
                Not retained: intermediate checkpoint SHAs, the verify-pass-1 commit, the full diff, and cost. Paths and
                user names were scrubbed; raw agent transcripts are excluded.
              </li>
              <li>Public reference: {replay.source.public_reference}</li>
            </ul>
          </details>
        </div>

        {/* PRD */}
        <div className="rounded-xl border bg-card">
          <button
            type="button"
            aria-expanded={prdOpen}
            aria-controls="hf-prd"
            onClick={() => setPrdOpen((o) => !o)}
            className={cn('flex w-full items-center justify-between gap-2 rounded-xl px-4 py-3 text-left text-sm font-medium', focusRing)}
          >
            <span>
              Input brief <span className="font-normal text-muted-foreground">· inventory-prd.md (sample PRD)</span>
            </span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', prdOpen && 'rotate-180')} aria-hidden />
          </button>
          <AnimatePresence initial={false}>
            {prdOpen ? (
              <motion.div
                id="hf-prd"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <p className="whitespace-pre-wrap break-words border-t px-4 py-3 font-mono text-xs leading-relaxed">
                  {replay.project.prd.trim()}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div
          role="toolbar"
          aria-label="Replay controls"
          className="space-y-2 sm:sticky sm:top-20 sm:z-10 rounded-xl border bg-background/95 p-3 shadow-sm backdrop-blur"
        >
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={btn} onClick={restart} aria-label="Restart replay" title="Restart">
              <RotateCcw className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" className={btn} onClick={() => seekFrame(count - 2)} disabled={count <= 1} aria-label="Previous frame" title="Previous frame (,)">
              <SkipBack className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              className={cn(btn, 'border-teal-600 bg-teal-700 px-4 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500')}
              onClick={togglePlay}
              aria-label={playing ? 'Pause replay' : atEnd ? 'Replay from start' : 'Play replay'}
              title="Play / pause (K)"
            >
              {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              {playing ? 'Pause' : atEnd ? 'Replay' : 'Play'}
            </button>
            <button type="button" className={btn} onClick={() => seekFrame(count)} disabled={atEnd} aria-label="Next frame" title="Next frame (.)">
              <SkipForward className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" className={btn} onClick={() => seekFrame(frames.length - 1)} disabled={atEnd} aria-label="Skip to end" title="Skip to end">
              <ChevronsRight className="h-4 w-4" aria-hidden />
            </button>
            <div role="radiogroup" aria-label="Playback speed" className="ml-auto flex overflow-hidden rounded-md border">
              {SPEEDS.map((sp) => (
                <button
                  key={sp}
                  type="button"
                  role="radio"
                  aria-checked={speed === sp}
                  onClick={() => setSpeed(sp)}
                  className={cn(
                    'h-9 px-2.5 text-xs font-medium tabular-nums',
                    speed === sp ? 'bg-foreground text-background' : 'hover:bg-muted',
                    focusRing,
                  )}
                >
                  {sp}×
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={V_TOTAL}
              step={0.5}
              value={v}
              onChange={(e) => {
                setPlaying(false);
                setV(Number(e.target.value));
              }}
              aria-label="Replay position"
              aria-valuetext={`t+${Math.floor(clock)} s of ${RUN_SECONDS} s, frame ${count} of ${frames.length}`}
              className="h-2 min-w-0 flex-1 cursor-pointer accent-teal-600"
            />
            <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground" aria-hidden>
              {Math.floor(clock)}s / {RUN_SECONDS}s
            </span>
          </div>
          <p className="sr-only" aria-live="polite">
            {playing ? '' : `Frame ${count} of ${frames.length}, phase ${s.phase ?? 'none'}, status ${s.runStatus}.`}
          </p>
        </div>

        {/* Dashboard miniature */}
        <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
          <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
            <span className="flex gap-1" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            </span>
            <span className="truncate">HarnessFlow dashboard · Projects / {replay.project.name} / Run</span>
          </div>
          <div className="space-y-4 p-3 sm:p-5">
            <RunHeader s={s} />
            <RepairNote s={s} />
            <Metrics s={s} clock={clock} />
            <WorkspacePanel s={s} onInspect={setDetail} />
            <div className="grid items-start gap-4 lg:grid-cols-2">
              <div className="min-w-0 space-y-4">
                <PlanPanel s={s} />
                <CriteriaPanel s={s} />
                <ActivityPanel s={s} onInspect={setDetail} />
                <AttemptsPanel s={s} clock={clock} onInspect={setDetail} />
              </div>
              <div className="min-w-0 space-y-4">
                <EvidencePanel s={s} onInspect={setDetail} />
                <ReviewPanel s={s} onInspect={setDetail} />
                <JudgePanel s={s} />
                <ArtifactsPanel s={s} />
              </div>
            </div>
            <FrameLog s={s} onInspect={setDetail} />
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">Shortcuts: K play/pause · , and . step one frame.</p>

        <Dialog open={detail !== null} onOpenChange={(o) => !o && setDetail(null)}>
          <DialogContent className="max-h-[85vh] grid-rows-[auto_1fr_auto] sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-base">{detail?.title}</DialogTitle>
              <DialogDescription className="text-xs">
                Raw recorded data{detail?.frameIndex !== undefined ? ` · frame ${detail.frameIndex + 1} of ${frames.length}` : ''}
              </DialogDescription>
            </DialogHeader>
            <Code className="max-h-[55vh] min-h-0">{detail ? JSON.stringify(detail.data, null, 2) : ''}</Code>
            {detail?.frameIndex !== undefined ? (
              <button
                type="button"
                className={cn(btn, 'justify-self-start')}
                onClick={() => {
                  if (detail.frameIndex !== undefined) seekFrame(detail.frameIndex);
                  setDetail(null);
                }}
              >
                Seek replay to this frame
              </button>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </MotionConfig>
  );
}
