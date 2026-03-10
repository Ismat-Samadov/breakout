// ============================================================
// GameOverlay.tsx — Pause / Level Complete / Game Over / Victory
// Renders as an animated fullscreen overlay on top of the canvas
// ============================================================
'use client';

import { motion } from 'framer-motion';
import type { GameState } from '@/lib/types';

interface Props {
  state: GameState;
  score: number;
  highScore: number;
  level: number;
  onResume: () => void;
  onNextLevel: () => void;
  onRestart: () => void;
}

/** Shared animated backdrop */
function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center
                 bg-[#05050f]/85 backdrop-blur-sm"
    >
      {children}
    </motion.div>
  );
}

/** Generic CTA button */
function Btn({
  onClick,
  children,
  className = '',
}: {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`px-10 py-3 rounded-full font-black tracking-widest uppercase
                  text-white shadow-lg transition-shadow duration-200 cursor-pointer ${className}`}
    >
      {children}
    </motion.button>
  );
}

export default function GameOverlay({
  state,
  score,
  highScore,
  level,
  onResume,
  onNextLevel,
  onRestart,
}: Props) {
  // ── PAUSED ────────────────────────────────────────────────
  if (state === 'paused') {
    return (
      <Backdrop>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <h2 className="text-5xl font-black tracking-widest text-cyan-300
                         drop-shadow-[0_0_20px_rgba(0,212,255,0.8)]">
            PAUSED
          </h2>
          <div className="flex gap-4">
            <Btn
              onClick={onResume}
              className="bg-gradient-to-r from-cyan-500 to-blue-600
                         hover:shadow-[0_0_30px_rgba(0,212,255,0.7)]"
            >
              ▶ Resume
            </Btn>
            <Btn
              onClick={onRestart}
              className="bg-slate-700 hover:bg-slate-600"
            >
              ⬡ Menu
            </Btn>
          </div>
          <p className="text-slate-600 text-xs tracking-widest">
            PRESS P OR ESC TO RESUME
          </p>
        </motion.div>
      </Backdrop>
    );
  }

  // ── LEVEL COMPLETE ────────────────────────────────────────
  if (state === 'levelComplete') {
    return (
      <Backdrop>
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center gap-5"
        >
          {/* Animated stars */}
          <div className="text-4xl flex gap-2">
            {['⭐', '⭐', '⭐'].map((s, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1 * i, type: 'spring', stiffness: 300 }}
              >
                {s}
              </motion.span>
            ))}
          </div>

          <h2 className="text-4xl font-black tracking-widest
                         text-transparent bg-clip-text
                         bg-gradient-to-r from-yellow-300 to-orange-400
                         drop-shadow-[0_0_20px_rgba(255,180,0,0.8)]">
            LEVEL {level} CLEAR!
          </h2>

          <p className="text-xl text-cyan-300 font-bold">
            Score: {score.toLocaleString()}
          </p>

          <Btn
            onClick={onNextLevel}
            className="bg-gradient-to-r from-yellow-400 to-orange-500
                       hover:shadow-[0_0_30px_rgba(255,180,0,0.7)]"
          >
            Next Level →
          </Btn>
        </motion.div>
      </Backdrop>
    );
  }

  // ── GAME OVER ─────────────────────────────────────────────
  if (state === 'gameOver') {
    const isNewBest = score > 0 && score >= highScore;
    return (
      <Backdrop>
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 120 }}
          className="flex flex-col items-center gap-5"
        >
          <h2 className="text-5xl font-black tracking-widest text-rose-400
                         drop-shadow-[0_0_20px_rgba(255,0,80,0.8)]">
            GAME OVER
          </h2>

          <div className="text-center">
            <p className="text-lg text-slate-400">Your Score</p>
            <p className="text-4xl font-black text-white">
              {score.toLocaleString()}
            </p>
            {isNewBest && (
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="text-yellow-400 font-bold text-sm mt-1
                           drop-shadow-[0_0_8px_rgba(255,220,0,0.8)]"
              >
                ★ NEW HIGH SCORE ★
              </motion.p>
            )}
          </div>

          <div className="flex gap-4">
            <Btn
              onClick={onRestart}
              className="bg-gradient-to-r from-rose-500 to-pink-600
                         hover:shadow-[0_0_30px_rgba(255,0,80,0.7)]"
            >
              Play Again
            </Btn>
            <Btn
              onClick={onRestart}
              className="bg-slate-700 hover:bg-slate-600"
            >
              Menu
            </Btn>
          </div>
        </motion.div>
      </Backdrop>
    );
  }

  // ── VICTORY ───────────────────────────────────────────────
  if (state === 'victory') {
    return (
      <Backdrop>
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 150 }}
          className="flex flex-col items-center gap-5 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-6xl"
          >
            🏆
          </motion.div>

          <h2 className="text-5xl font-black tracking-widest
                         text-transparent bg-clip-text
                         bg-gradient-to-r from-yellow-300 via-orange-400 to-pink-500
                         drop-shadow-[0_0_30px_rgba(255,200,0,0.8)]">
            YOU WIN!
          </h2>

          <p className="text-lg text-slate-300">All levels conquered!</p>

          <div className="text-center">
            <p className="text-slate-400 text-sm">Final Score</p>
            <p className="text-4xl font-black text-yellow-300">
              {score.toLocaleString()}
            </p>
          </div>

          <Btn
            onClick={onRestart}
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500
                       hover:shadow-[0_0_40px_rgba(255,180,0,0.8)]"
          >
            Play Again
          </Btn>
        </motion.div>
      </Backdrop>
    );
  }

  return null;
}
