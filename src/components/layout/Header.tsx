'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent, useReducedMotion } from 'framer-motion';
import { Wind, Users, Compass } from 'lucide-react';

const TOP_ZONE = 80;
const HIDE_AFTER = 50;
const SHOW_AFTER = 15;

interface HeaderProps {
  onCommunityClick?: () => void;
  onProfileClick?: () => void;
}

export default function Header({ onCommunityClick, onProfileClick }: HeaderProps) {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const run = useRef(0);

  useMotionValueEvent(scrollY, 'change', (y) => {
    const d = y - lastY.current;
    lastY.current = y;
    if (y < TOP_ZONE) {
      setHidden(false);
      run.current = 0;
      return;
    }
    if (Math.sign(d) !== Math.sign(run.current)) run.current = 0;
    run.current += d;
    if (run.current > HIDE_AFTER) setHidden(true);
    else if (run.current < -SHOW_AFTER) setHidden(false);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/50 shadow-xs"
      animate={{ y: hidden ? '-110%' : '0%' }}
      transition={{ duration: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      onFocusCapture={() => setHidden(false)}
      role="banner"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-teal-800 flex items-center justify-center text-white shadow-xs">
            <Wind className="w-5 h-5 text-teal-200" aria-hidden="true" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg tracking-tight text-slate-900 block leading-tight">
              AirWise
            </span>
            <span className="text-[10px] tracking-widest uppercase font-medium text-teal-800 block">
              Urban Clean Air Guard
            </span>
          </div>
        </div>

        <nav aria-label="Main Navigation" className="flex items-center gap-2 sm:gap-4 text-xs font-medium">
          <button
            onClick={onProfileClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-slate-700 hover:text-slate-950 hover:bg-slate-200/60 transition-colors focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            <Compass className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span className="hidden sm:inline">My Household</span>
          </button>

          <button
            onClick={onCommunityClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 hover:bg-teal-100 transition-colors focus-visible:outline-2 focus-visible:outline-teal-800"
          >
            <Users className="w-4 h-4 text-teal-800" aria-hidden="true" />
            <span>Community Mode</span>
          </button>
        </nav>
      </div>
    </motion.header>
  );
}
