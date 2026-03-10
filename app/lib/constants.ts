// ============================================================
// constants.ts — Game-wide numeric and style constants
// ============================================================

import type { Difficulty, GameConfig, PowerUpType } from './types';

// ── Virtual canvas dimensions ────────────────────────────────
/** All game coordinates live in this 800 × 600 space */
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// ── Paddle ───────────────────────────────────────────────────
export const PADDLE_NORMAL_WIDTH = 110;
export const PADDLE_WIDE_WIDTH = 190;
export const PADDLE_HEIGHT = 14;
/** Distance from the bottom of the canvas */
export const PADDLE_Y_OFFSET = 48;
export const PADDLE_SPEED = 9;

// ── Ball ─────────────────────────────────────────────────────
export const BALL_RADIUS = 8;
/** Capped maximum speed regardless of difficulty */
export const BALL_MAX_SPEED = 16;
/** Speed bump applied each time the ball hits the paddle */
export const BALL_PADDLE_SPEED_BUMP = 0.15;

// ── Brick grid ───────────────────────────────────────────────
export const BRICK_COLS = 12;
export const BRICK_WIDTH = 58;
export const BRICK_HEIGHT = 20;
export const BRICK_PADDING = 4;
/** Vertical offset from top of canvas to first brick row */
export const BRICK_TOP_OFFSET = 70;
/** Horizontal offset so the grid is centred */
export const BRICK_LEFT_OFFSET =
  (GAME_WIDTH - (BRICK_COLS * BRICK_WIDTH + (BRICK_COLS - 1) * BRICK_PADDING)) / 2;

// ── Power-ups ────────────────────────────────────────────────
/** How long (ms) timed power-ups last */
export const POWER_UP_DURATION = 10_000;
export const POWER_UP_SIZE = 22;
export const POWER_UP_SPEED = 2.2;

// ── Trails & particles ───────────────────────────────────────
export const TRAIL_LENGTH = 10;
export const MAX_PARTICLES = 120;

// ── Per-difficulty configs ────────────────────────────────────
export const DIFFICULTY_CONFIGS: Record<Difficulty, GameConfig> = {
  easy: {
    lives: 5,
    ballSpeed: 5,
    speedIncreasePerLevel: 0.5,
    powerUpChance: 0.22,
  },
  medium: {
    lives: 3,
    ballSpeed: 6.5,
    speedIncreasePerLevel: 0.9,
    powerUpChance: 0.15,
  },
  hard: {
    lives: 2,
    ballSpeed: 8.5,
    speedIncreasePerLevel: 1.3,
    powerUpChance: 0.1,
  },
};

// ── Brick colour palette (index maps to row) ─────────────────
export const BRICK_PALETTE: Array<{ color: string; glow: string; points: number }> = [
  { color: '#ff0080', glow: '#ff0080', points: 70 }, // hot pink  – row 0 (top)
  { color: '#ff4500', glow: '#ff4500', points: 60 }, // orange-red
  { color: '#ffaa00', glow: '#ffaa00', points: 50 }, // amber
  { color: '#ffe600', glow: '#ffe600', points: 40 }, // yellow
  { color: '#00ff9d', glow: '#00ff9d', points: 30 }, // mint
  { color: '#00d4ff', glow: '#00d4ff', points: 20 }, // cyan
  { color: '#9d00ff', glow: '#9d00ff', points: 15 }, // violet  – row 6
];

/** Extra points awarded for multi-hit bricks (multiplied by maxHealth) */
export const MULTI_HIT_BONUS = 10;

// ── Power-up visual config ───────────────────────────────────
export const POWER_UP_META: Record<
  PowerUpType,
  { color: string; icon: string; label: string }
> = {
  wide:      { color: '#00d4ff', icon: '↔', label: 'Wide Paddle' },
  extraLife: { color: '#ff0080', icon: '♥', label: 'Extra Life'  },
  multiBall: { color: '#ffe600', icon: '⊕', label: 'Multi-Ball'  },
  slowBall:  { color: '#00ff9d', icon: '⏸', label: 'Slow Ball'   },
  fireBall:  { color: '#ff4500', icon: '🔥', label: 'Fire Ball'  },
};
