// ============================================================
// GameMenu.tsx — Animated start-screen with difficulty select
// ============================================================
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import type { Difficulty } from '@/lib/types';

interface Props {
  onStart: (difficulty: Difficulty) => void;
  highScore: number;
}

const DIFFICULTIES: Array<{
  key: Difficulty;
  label: string;
  description: string;
  color: string;
  border: string;
}> = [
  {
    key: 'easy',
    label: 'EASY',
    description: '5 lives · Slow ball · Power-ups galore',
    color: 'text-emerald-400',
    border: 'border-emerald-500 hover:bg-emerald-500/20',
  },
  {
    key: 'medium',
    label: 'MEDIUM',
    description: '3 lives · Normal speed · Classic fun',
    color: 'text-cyan-400',
    border: 'border-cyan-500 hover:bg-cyan-500/20',
  },
  {
    key: 'hard',
    label: 'HARD',
    description: '2 lives · Fast ball · No mercy',
    color: 'text-rose-400',
    border: 'border-rose-500 hover:bg-rose-500/20',
  },
];

export default function GameMenu({ onStart, highScore }: Props) {
  const [selected, setSelected] = useState<Difficulty>('medium');

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#05050f]/90 backdrop-blur-sm">
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mb-8 text-center"
      >
        <h1
          className="text-6xl font-black tracking-widest uppercase
                     text-transparent bg-clip-text
                     bg-gradient-to-b from-cyan-300 via-cyan-400 to-blue-600
                     drop-shadow-[0_0_30px_rgba(0,212,255,0.8)]
                     md:text-8xl"
        >
          BREAKOUT
        </h1>
        <p className="mt-2 text-sm tracking-[0.35em] text-cyan-600 uppercase">
          Neon Edition
        </p>
      </motion.div>

      {/* High score */}
      {highScore > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6 text-center"
        >
          <span className="text-xs tracking-widest text-slate-500 uppercase">
            Best Score
          </span>
          <p className="text-2xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(255,230,0,0.7)]">
            {highScore.toLocaleString()}
          </p>
        </motion.div>
      )}

      {/* Difficulty cards */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="mb-8 flex flex-col gap-3 w-72 sm:w-80"
      >
        {DIFFICULTIES.map((d) => (
          <button
            key={d.key}
            onClick={() => setSelected(d.key)}
            className={`relative rounded-lg border-2 px-6 py-4 text-left transition-all duration-200 cursor-pointer
                        ${d.border}
                        ${selected === d.key ? 'bg-white/10 scale-105 shadow-lg' : 'bg-white/0'}`}
          >
            {selected === d.key && (
              <motion.div
                layoutId="selected-pill"
                className="absolute inset-0 rounded-lg bg-white/5 border-0"
              />
            )}
            <span className={`block text-lg font-bold tracking-widest ${d.color}`}>
              {d.label}
            </span>
            <span className="block text-xs text-slate-400 mt-0.5">
              {d.description}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onStart(selected)}
        className="px-12 py-4 rounded-full font-black text-xl tracking-widest uppercase
                   bg-gradient-to-r from-cyan-500 to-blue-600
                   text-white shadow-[0_0_30px_rgba(0,212,255,0.6)]
                   hover:shadow-[0_0_50px_rgba(0,212,255,0.9)]
                   transition-shadow duration-300 cursor-pointer"
      >
        PLAY
      </motion.button>

      {/* Controls hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-8 text-center text-xs text-slate-600 space-y-1"
      >
        <p>← → Arrow keys / Mouse / Touch to move</p>
        <p>Space / Click / Tap to launch ball</p>
        <p>P / Esc to pause</p>
      </motion.div>
    </div>
  );
}
