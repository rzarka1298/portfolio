import { motion, type Variants } from 'framer-motion';
import { Fragment, type ElementType } from 'react';
import { useReducedMotion } from './hooks';

export interface SplitRevealProps {
  text: string;
  /** Element to render. Default 'span'. */
  as?: ElementType;
  /** Split into words (default; use for anything longer than a few words) or characters. */
  by?: 'word' | 'char';
  /** 'view' reveals once when scrolled into view; 'load' on mount. */
  trigger?: 'view' | 'load';
  delay?: number;
  /** Seconds between pieces. */
  stagger?: number;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Masked text reveal: each word (or character) slides up from behind a
 * clip. Splits at render time, so there's no DOM mutation after mount.
 * Screen readers get the whole string via aria-label.
 *
 * Don't use it on above-the-fold content that must be readable immediately
 * (the hero name): it starts hidden.
 */
export default function SplitReveal({
  text,
  as: Tag = 'span',
  by = 'word',
  trigger = 'view',
  delay = 0,
  stagger,
  className,
}: SplitRevealProps) {
  const reduced = useReducedMotion();
  if (reduced) return <Tag className={className}>{text}</Tag>;

  const step = stagger ?? (by === 'char' ? 0.025 : 0.06);
  const container: Variants = { hidden: {}, shown: { transition: { staggerChildren: step, delayChildren: delay } } };
  const piece: Variants = {
    hidden: { y: '110%' },
    shown: { y: '0%', transition: { duration: 0.7, ease: EASE } },
  };
  const words = text.split(' ');

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        aria-hidden="true"
        className="inline"
        variants={container}
        initial="hidden"
        {...(trigger === 'load' ? { animate: 'shown' } : { whileInView: 'shown', viewport: { once: true, amount: 0.5 } })}
      >
        {words.map((word, wi) => (
          <Fragment key={wi}>
            <span className="inline-block whitespace-nowrap">
              {(by === 'char' ? Array.from(word) : [word]).map((chunk, ci) => (
                <span key={ci} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <motion.span className="inline-block" variants={piece}>
                    {chunk}
                  </motion.span>
                </span>
              ))}
            </span>
            {wi < words.length - 1 && ' '}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}
