import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CornerMarks, DrawPath } from './blueprint';

interface NotFoundProps {
  title?: string;
  message?: string;
}

/**
 * A drafting sheet for a part that isn't there: a base plate with an empty
 * socket and the missing part drawn as a dashed phantom above it, plus a
 * title block naming the address that was asked for.
 */
function MissingPartDrawing() {
  const line = 'stroke-bp-line';
  const soft = 'stroke-bp-line-soft';
  return (
    <svg viewBox="0 0 480 330" className="h-auto w-full" role="img" aria-labelledby="nf-fig-title">
      <title id="nf-fig-title">
        Drawing of a base plate with an empty socket. The part that belongs in it is missing and drawn as a dashed
        outline labelled part not found.
      </title>

      {/* Centre line */}
      <path d="M240 20 V300" className={soft} strokeWidth={1} strokeDasharray="14 4 2 4" fill="none" />

      {/* Base plate with the empty socket */}
      <DrawPath d="M40 170 H190 V200 H290 V170 H440 V270 H40 Z" draw="load" duration={1.4} className={line} strokeWidth={1.5} />
      {/* Hatched socket floor */}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <path key={i} d={`M${194 + i * 11} 216 l12 -12`} className={soft} strokeWidth={1} />
      ))}
      <path d="M190 216 H290" className={soft} strokeWidth={1} />

      {/* Bolt holes with centre marks */}
      {[90, 390].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={225} r={13} fill="none" className={line} strokeWidth={1.25} />
          <path d={`M${cx - 20} 225 H${cx + 20} M${cx} 205 V245`} className={soft} strokeWidth={1} strokeDasharray="4 3" />
        </g>
      ))}

      {/* Missing part: a phantom outline floating above its socket */}
      <motion.g
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path
          d="M165 70 H315 V95 H290 V125 H190 V95 H165 Z"
          fill="hsl(var(--bp-signal) / 0.08)"
          className="stroke-bp-signal"
          strokeWidth={1.5}
          strokeDasharray="6 5"
        />
        {/* Leader to the balloon */}
        <path d="M315 78 L372 48 H404" fill="none" className="stroke-bp-signal" strokeWidth={1} />
        <circle cx={420} cy={48} r={16} fill="hsl(var(--bp-bg))" className="stroke-bp-signal" strokeWidth={1.25} />
        <text x={420} y={52.5} textAnchor="middle" className="fill-bp-signal-ink font-mono text-[12px]">
          ?
        </text>
      </motion.g>

      {/* Fit arrow: where the part should go */}
      <path d="M240 138 V160" className="stroke-bp-signal" strokeWidth={1} strokeDasharray="3 3" fill="none" />
      <path d="M235 154 L240 162 L245 154" className="stroke-bp-signal" strokeWidth={1} fill="none" />

      {/* Dimension: socket width */}
      <path d="M190 276 V300 M290 276 V300 M190 292 H290" className={soft} strokeWidth={1} fill="none" />
      <path d="M196 288 L190 292 L196 296 M284 288 L290 292 L284 296" className={soft} strokeWidth={1} fill="none" />
      <text x={240} y={287} textAnchor="middle" className="fill-bp-line font-mono text-[10px] tracking-[0.12em]">
        100
      </text>

      {/* Dimension: plate height */}
      <path d="M446 170 H466 M446 270 H466 M458 170 V270" className={soft} strokeWidth={1} fill="none" />
      <text x={470} y={224} className="fill-bp-line font-mono text-[10px]" transform="rotate(90 470 224)" textAnchor="middle">
        100
      </text>

      {/* Callout */}
      <text x={330} y={120} className="fill-bp-signal-ink font-mono text-[12px] tracking-[0.12em]">
        PART NOT FOUND
      </text>
      <text x={330} y={134} className="fill-bp-ink-dim font-mono text-[10px] tracking-[0.1em]">
        QTY 1 / ON HAND 0
      </text>
    </svg>
  );
}

export default function NotFound({
  title = 'Page not found',
  message = "The page you're looking for doesn't exist or has moved.",
}: NotFoundProps) {
  const { pathname } = useLocation();

  useEffect(() => {
    const previous = document.title;
    document.title = `${title} · Rugved Zarkar`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <main id="main" className="overflow-x-clip px-4 pb-20 pt-24 sm:px-6 lg:px-10">
      <div className="relative mx-auto max-w-6xl border border-bp-line-soft/40">
        <CornerMarks size={12} className="text-bp-line" />
        <div className="flex items-center gap-3 border-b border-bp-line-soft/40 px-4 py-2.5 sm:px-6">
          <span className="bp-label text-bp-signal-ink">DWG 404</span>
          <span aria-hidden="true" className="h-px flex-1 bg-bp-line-soft/40" />
          <span className="bp-label">Sheet 01 of 01</span>
        </div>

        <div className="bp-grid grid items-center gap-10 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-12 lg:gap-6">
          <div className="min-w-0 lg:col-span-5">
            <p aria-hidden="true" className="font-display text-[6rem] font-medium leading-none tracking-[-0.04em] text-bp-line sm:text-[8rem]">
              404
            </p>
            <h1 className="mt-4 text-balance font-display text-3xl font-medium leading-tight text-bp-ink md:text-4xl">
              {title}
            </h1>
            <p className="mt-4 max-w-[46ch] bg-bp-bg/80 leading-relaxed text-bp-ink-dim">{message}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex h-10 items-center gap-2 bg-bp-signal px-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-[#0B2341] transition-colors hover:bg-bp-signal/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back home
              </Link>
              <Link
                to="/#projects"
                className="inline-flex h-10 items-center border border-bp-line/60 px-4 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-bp-line transition-colors hover:bg-bp-line/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bp-signal"
              >
                See all projects
              </Link>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-7">
            <MissingPartDrawing />
          </div>
        </div>

        {/* Title block */}
        <dl className="grid grid-cols-2 border-t border-bp-line/50 bg-bp-panel/90 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="border-b border-r border-bp-line-soft/50 px-4 py-3 sm:border-b-0">
            <dt className="bp-label mb-1.5">Drawing no.</dt>
            <dd className="font-mono text-sm text-bp-line">404</dd>
          </div>
          <div className="border-b border-bp-line-soft/50 px-4 py-3 sm:order-last sm:border-b-0 sm:border-l">
            <dt className="bp-label mb-1.5">Status</dt>
            <dd className="flex items-center gap-2 text-sm text-bp-ink">
              <span aria-hidden="true" className="h-1.5 w-1.5 bg-bp-signal" />
              Missing
            </dd>
          </div>
          <div className="col-span-2 min-w-0 px-4 py-3 sm:col-span-1">
            <dt className="bp-label mb-1.5">Requested</dt>
            <dd className="truncate font-mono text-sm text-bp-ink">{pathname}</dd>
          </div>
        </dl>
      </div>
    </main>
  );
}
