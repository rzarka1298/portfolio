import { useCallback, useEffect, useState, type RefObject } from 'react';

const START_MS = 1500; // let the stage redraw finish first
const STEP_MS = 1900;
const HOLD_MS = 2600; // linger on the last step before looping

/** True while the element is at least partly on screen and the tab is visible. */
export function useOnScreen(ref: RefObject<Element>, threshold = 0.3) {
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, threshold]);
  useEffect(() => {
    const onVis = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);
  return inView && visible;
}

/**
 * Steps through a trace on a timer and loops. Runs only while `enabled`
 * (active tab, on screen, motion allowed), not paused by the visitor, and
 * not held (e.g. while a node tooltip is open).
 */
export function useTracePlayer(stepCount: number, { enabled, hold = false }: { enabled: boolean; hold?: boolean }) {
  const [index, setIndex] = useState(-1);
  const [paused, setPaused] = useState(false);
  const running = enabled && !paused && !hold && stepCount > 0;

  useEffect(() => {
    if (!running) return undefined;
    const last = stepCount - 1;
    const wait = index < 0 ? START_MS : index >= last ? HOLD_MS : STEP_MS;
    const timer = window.setTimeout(() => setIndex((i) => (i >= last ? -1 : i + 1)), wait);
    return () => window.clearTimeout(timer);
  }, [running, index, stepCount]);

  const toggle = useCallback(() => setPaused((p) => !p), []);
  const next = useCallback(() => {
    setPaused(true);
    setIndex((i) => (i >= stepCount - 1 ? 0 : i + 1));
  }, [stepCount]);
  const prev = useCallback(() => {
    setPaused(true);
    setIndex((i) => (i <= 0 ? stepCount - 1 : i - 1));
  }, [stepCount]);

  return { index, paused, running, toggle, next, prev };
}
