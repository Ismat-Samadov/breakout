// ============================================================
// types.ts — Shared TypeScript types for Breakout game
// ============================================================

/** Available difficulty settings */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** Top-level game state machine */
export type GameState =
  | 'menu'
  | 'playing'
  | 'paused'
  | 'levelComplete'
  | 'gameOver'
  | 'victory';

/** Power-up variant identifiers */
export type PowerUpType = 'wide' | 'extraLife' | 'multiBall' | 'slowBall' | 'fireBall';

/** A 2-D coordinate pair */
export interface Vec2 {
  x: number;
  y: number;
}

/** Ball physics object */
export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  /** Previous positions for rendering a motion trail */
  trail: Vec2[];
  /** True while the ball is stuck to the paddle before launch */
  attached: boolean;
  /** When fireBall power-up is active, ball punches through bricks */
  isFire: boolean;
}

/** Player-controlled paddle */
export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A single brick cell on the grid */
export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Remaining hit points. -1 = indestructible */
  health: number;
  maxHealth: number;
  color: string;
  glowColor: string;
  points: number;
  /** Optional power-up dropped when this brick is destroyed */
  powerUp?: PowerUpType;
  /** Shake offset applied briefly after a hit (visual feedback) */
  shakeX: number;
  shakeTimer: number;
}

/** A falling power-up token */
export interface PowerUpItem {
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  size: number;
  /** Pulse animation phase */
  pulse: number;
}

/** Single explosion particle */
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

/** Per-difficulty tuning values */
export interface GameConfig {
  lives: number;
  ballSpeed: number;
  /** Additional speed per level (added to base ball speed) */
  speedIncreasePerLevel: number;
  /** Chance (0–1) that a destroyed brick drops a power-up */
  powerUpChance: number;
}
