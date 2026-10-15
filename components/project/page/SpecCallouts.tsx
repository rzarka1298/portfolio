import { motion } from 'framer-motion';
import type { ProjectPage } from '../../../content/projects/types';

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Highlights as the drawing's numbered notes: a balloon with the note
 * number, a leader that draws out from it when it scrolls into
 * view, then the note title and body under the leader.
 */
export default function SpecCallouts({ items }: { items: ProjectPage['highlights'] }) {
  return (
    <ol className="grid gap-x-12 gap-y-4 md:grid-cols-2">
      {items.map((item, i) => (
        <li key={item.title} className="py-5">
          <div className="flex items-center" aria-hidden="true">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-bp-line font-mono text-xs text-bp-line">
              {i + 1}
            </span>
            {/* Leader out of the balloon, becoming the shelf the note sits under. */}
            <motion.span
              className="h-px flex-1 origin-left bg-bp-line-soft/70"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 1 }}
              transition={{ duration: 0.8, delay: 0.1 * (i % 2), ease: EASE }}
            />
            <span className="h-1.5 w-1.5 shrink-0 bg-bp-line-soft/70" />
          </div>
          <div className="mt-3 min-w-0 sm:pl-[3.25rem]">
            <h3 className="font-display text-lg font-medium leading-snug text-bp-ink md:text-xl">
              <span className="sr-only">Note {i + 1}: </span>
              {item.title}
            </h3>
            <p className="mt-2.5 max-w-[62ch] text-[0.9375rem] leading-relaxed text-bp-ink-dim">{item.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
