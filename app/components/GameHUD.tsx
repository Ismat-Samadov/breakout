// ============================================================
// GameHUD.tsx — In-game heads-up display overlay
// Shows score, lives, level, high score, active power-ups
// ============================================================
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { PowerUpType } from '@/lib/types';
import { POWER_UP_META } from '@/lib/constants';
import { TOTAL_LEVELS } from '@/lib/levels';

interface Props {
  score: number;
  lives: number;
  level: number;
  highScore: number;
  soundEnabled: boolean;
  activePowerUps: PowerUpType[];
  onToggleSound: () => void;
  onPause: () => void;
}

export default function GameHUD({
  score,
  lives,
  level,
  highScore,
  soundEnabled,
  activePowerUps,
  onToggleSound,
  onPause,
}: Props) {
  return (
    <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 pointer-events-none select-none">
      {/* Left — Score */}
      <div className="pointer-events-none">
        <p className="text-[10px] tracking-widest text-cyan-700 uppercase">Score</p>
        <AnimatePresence mode="popLayout">
          <motion.p
            key={score}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-xl font-black text-cyan-300 drop-shadow-[0_0_8px_rgba(0,212,255,0.8)] leading-none"
          >
            {score.toLocaleString()}
          </motion.p>
        </AnimatePresence>
        {highScore > 0 && (
          <p className="text-[9px] text-slate-600 leading-none mt-0.5">
            BEST {highScore.toLocaleString()}
          </p>
        )}
      </div>

      {/* Centre — Level + active power-ups */}
      <div className="flex flex-col items-center gap-1 pointer-events-none">
        <p className="text-[10px] tracking-widest text-slate-500 uppercase">
          Level {level} / {TOTAL_LEVELS}
        </p>

        {/* Active power-up badges */}
        <div className="flex gap-1">
          <AnimatePresence>
            {activePowerUps.map((pu) => {
              const meta = POWER_UP_META[pu];
              return (
                <motion.span
                  key={pu}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  title={meta.label}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: meta.color + '33',
                    color: meta.color,
                    border: `1px solid ${meta.color}66`,
                  }}
                >
                  {meta.icon} {meta.label}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Right — Lives + buttons */}
      <div className="flex items-center gap-3">
        {/* Lives */}
        <div className="text-right pointer-events-none">
          <p className="text-[10px] tracking-widest text-slate-500 uppercase">Lives</p>
          <div className="flex gap-0.5 justify-end">
            {Array.from({ length: Math.min(lives, 6) }).map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-rose-500 text-base leading-none drop-shadow-[0_0_4px_rgba(255,0,128,0.8)]"
              >
                ♥
              </motion.span>
            ))}
            {lives > 6 && (
              <span className="text-rose-500 text-xs">+{lives - 6}</span>
            )}
          </div>
        </div>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          title={soundEnabled ? 'Mute' : 'Unmute'}
          className="pointer-events-auto w-7 h-7 rounded flex items-center justify-center
                     bg-slate-800/60 border border-slate-700/50
                     text-slate-400 hover:text-white hover:border-slate-500
                     transition-all duration-150 text-sm"
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Pause */}
        <button
          onClick={onPause}
          title="Pause (P)"
          className="pointer-events-auto w-7 h-7 rounded flex items-center justify-center
                     bg-slate-800/60 border border-slate-700/50
                     text-slate-400 hover:text-white hover:border-slate-500
                     transition-all duration-150 text-sm"
        >
          ⏸
        </button>
      </div>
    </div>
  );
}
