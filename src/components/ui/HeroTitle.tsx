'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface HeroTitleProps {
  title: string;
  subtitle: string;
}

export default function HeroTitle({ title, subtitle }: HeroTitleProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className="pt-2 pb-6 max-w-4xl">
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
          {title}
        </h1>
        <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-6 max-w-4xl">
      <motion.h1
        className="text-3xl sm:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-tight"
        aria-label={title}
        initial="hidden"
        animate="show"
        variants={{
          show: {
            transition: {
              staggerChildren: 0.08,
              delayChildren: 0.05,
            },
          },
        }}
      >
        {title.split(' ').map((word, i) => (
          <span key={i} aria-hidden="true" className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              variants={{
                hidden: { y: '115%', opacity: 0 },
                show: {
                  y: 0,
                  opacity: 1,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
            >
              {word}&nbsp;
            </motion.span>
          </span>
        ))}
      </motion.h1>

      <motion.p
        className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        {subtitle}
      </motion.p>
    </div>
  );
}
