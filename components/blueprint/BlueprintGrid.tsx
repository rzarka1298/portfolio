import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/theme';
import { useReducedMotion } from './hooks';

/**
 * Animated drafting-grid background in raw WebGL (one full-screen quad, one
 * fragment shader, no library).
 *
 * Three grid layers at different "depths" parallax against the cursor and
 * scroll; a soft spotlight lifts the linework near the pointer; a slow
 * plotter scan line sweeps down the sheet. Colours come from the theme's
 * CSS variables and update when the theme changes.
 *
 * Falls back to the static CSS `.bp-grid` when WebGL is unavailable, the
 * context is lost, or the visitor prefers reduced motion. Rendering pauses
 * while the canvas is offscreen or the tab is hidden. DPR is capped at 2.
 *
 * Fills its positioned parent. `data-bp-grid` reports "webgl" or "static".
 */
export default function BlueprintGrid({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  const { theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [failed, setFailed] = useState(false);
  const useStatic = reduced || failed;

  useEffect(() => {
    if (useStatic) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const renderer = createRenderer(canvas);
    if (!renderer) {
      setFailed(true);
      return undefined;
    }
    const onLost = (e: Event) => {
      e.preventDefault();
      setFailed(true);
    };
    canvas.addEventListener('webglcontextlost', onLost);
    return () => {
      canvas.removeEventListener('webglcontextlost', onLost);
      renderer.destroy();
    };
    // Theme is a dependency so colours are re-read on toggle.
  }, [useStatic, theme]);

  if (useStatic) {
    return <div aria-hidden="true" data-bp-grid="static" className={cn('bp-grid absolute inset-0', className)} />;
  }
  return (
    <div aria-hidden="true" data-bp-grid="webgl" className={cn('bp-grid absolute inset-0', className)}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;      // CSS px
uniform float uDpr;
uniform float uTime;
uniform vec2 uMouse;    // CSS px, top-left origin
uniform float uMouseOn;
uniform vec2 uPar;      // smoothed pointer offset, -0.5..0.5
uniform float uScroll;  // CSS px
uniform vec3 uBg;
uniform vec3 uDeep;
uniform vec3 uGrid;
uniform vec3 uSoft;
uniform vec3 uLine;
uniform vec3 uSignal;

float gridLine(vec2 p, float size, float width) {
  vec2 d = abs(fract(p / size - 0.5) - 0.5) * size;
  float m = min(d.x, d.y);
  return 1.0 - smoothstep(width * 0.5, width * 0.5 + 1.0, m);
}

float crossMark(vec2 p, float size, float arm) {
  vec2 c = p - size * floor(p / size + 0.5);
  vec2 a = abs(c);
  float h = (1.0 - smoothstep(0.35, 1.1, a.y)) * (1.0 - step(arm, a.x));
  float v = (1.0 - smoothstep(0.35, 1.1, a.x)) * (1.0 - step(arm, a.y));
  return max(h, v);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
  vec2 uv = p / uRes;
  vec2 drift = vec2(uTime * 3.0, uTime * 1.5);

  // Three depths: far fine grid, mid major grid, near registration crosses.
  vec2 pFar  = p + uPar * -8.0  + vec2(0.0, uScroll * 0.10) + drift * 0.5;
  vec2 pMid  = p + uPar * -18.0 + vec2(0.0, uScroll * 0.22) + drift;
  vec2 pNear = p + uPar * -36.0 + vec2(0.0, uScroll * 0.38) + drift * 1.6;

  float fine  = gridLine(pFar, 24.0, 0.6);
  float major = gridLine(pMid, 120.0, 0.9);
  float marks = crossMark(pNear + 120.0, 240.0, 7.0);

  float glow = 0.0;
  if (uMouseOn > 0.5) {
    float d = distance(p, uMouse);
    glow = exp(-(d * d) / (2.0 * 210.0 * 210.0));
  }

  // Plotter scan: a soft band sweeping down the sheet every ~9 s.
  float scanY = mod(uTime * 110.0, uRes.y + 400.0) - 200.0;
  float scan = exp(-pow((p.y - scanY) / 46.0, 2.0));

  vec3 col = uBg;
  col = mix(col, uGrid, fine * 0.42);
  col = mix(col, uSoft, major * (0.16 + glow * 0.34 + scan * 0.22));
  col = mix(col, uLine, fine * glow * 0.12);
  col = mix(col, uLine, marks * (0.22 + glow * 0.55));
  col = mix(col, uSignal, marks * glow * glow * 0.7);
  col = mix(col, uLine, scan * 0.015);

  // Depth: fade the sheet toward the edges.
  float vig = smoothstep(0.35, 1.05, length((uv - vec2(0.5, 0.42)) * vec2(1.25, 1.0)));
  col = mix(col, uDeep, vig * 0.55);

  gl_FragColor = vec4(col, 1.0);
}
`;

type Vec3 = [number, number, number];

function cssColor(variable: string): Vec3 {
  const probe = document.createElement('span');
  probe.style.color = `hsl(var(${variable}))`;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
  probe.remove();
  return [rgb[0] / 255, rgb[1] / 255, rgb[2] / 255];
}

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createRenderer(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    res: u('uRes'),
    dpr: u('uDpr'),
    time: u('uTime'),
    mouse: u('uMouse'),
    mouseOn: u('uMouseOn'),
    par: u('uPar'),
    scroll: u('uScroll'),
  };
  const colours: Record<string, string> = {
    uBg: '--bp-bg',
    uDeep: '--bp-bg-deep',
    uGrid: '--bp-grid',
    uSoft: '--bp-line-soft',
    uLine: '--bp-line',
    uSignal: '--bp-signal',
  };
  for (const [uniform, variable] of Object.entries(colours)) gl.uniform3fv(u(uniform), cssColor(variable));

  let width = 0;
  let height = 0;
  let dpr = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Pointer, in canvas-relative CSS px. Parallax is eased toward it.
  let mx = 0;
  let my = 0;
  let mouseOn = 0;
  let parX = 0;
  let parY = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
    mouseOn = 1;
  };
  const onLeave = () => {
    mouseOn = 0;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);

  let visible = true;
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  io.observe(canvas);
  const onVisibility = () => schedule();
  document.addEventListener('visibilitychange', onVisibility);

  let frame = 0;
  const start = performance.now();
  const draw = (now: number) => {
    frame = 0;
    const tx = mouseOn ? mx / Math.max(width, 1) - 0.5 : 0;
    const ty = mouseOn ? my / Math.max(height, 1) - 0.5 : 0;
    parX += (tx - parX) * 0.06;
    parY += (ty - parY) * 0.06;
    gl.uniform2f(loc.res, width, height);
    gl.uniform1f(loc.dpr, dpr);
    gl.uniform1f(loc.time, (now - start) / 1000);
    gl.uniform2f(loc.mouse, mx, my);
    gl.uniform1f(loc.mouseOn, mouseOn);
    gl.uniform2f(loc.par, parX, parY);
    gl.uniform1f(loc.scroll, window.scrollY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    schedule();
  };
  function schedule() {
    if (frame || !visible || document.hidden) return;
    frame = requestAnimationFrame(draw);
  }
  schedule();

  return {
    destroy() {
      cancelAnimationFrame(frame);
      frame = -1; // block further scheduling
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
    },
  };
}
