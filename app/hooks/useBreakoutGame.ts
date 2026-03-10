// ============================================================
// useBreakoutGame.ts
// Central game-logic hook. Owns the canvas, game loop, physics,
// collision detection, rendering, and all mutable game state.
// ============================================================
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Ball,
  Brick,
  Difficulty,
  GameState,
  Paddle,
  Particle,
  PowerUpItem,
  PowerUpType,
  Vec2,
} from '@/lib/types';
import {
  BALL_MAX_SPEED,
  BALL_PADDLE_SPEED_BUMP,
  BALL_RADIUS,
  BRICK_COLS,
  BRICK_HEIGHT,
  BRICK_LEFT_OFFSET,
  BRICK_PADDING,
  BRICK_PALETTE,
  BRICK_TOP_OFFSET,
  BRICK_WIDTH,
  DIFFICULTY_CONFIGS,
  GAME_HEIGHT,
  GAME_WIDTH,
  MAX_PARTICLES,
  MULTI_HIT_BONUS,
  PADDLE_HEIGHT,
  PADDLE_NORMAL_WIDTH,
  PADDLE_SPEED,
  PADDLE_WIDE_WIDTH,
  PADDLE_Y_OFFSET,
  POWER_UP_DURATION,
  POWER_UP_META,
  POWER_UP_SIZE,
  POWER_UP_SPEED,
  TRAIL_LENGTH,
} from '@/lib/constants';
import { LEVEL_DESIGNS, TOTAL_LEVELS } from '@/lib/levels';
import { sounds, resumeAudio } from '@/lib/sounds';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

/** Clamp v between lo and hi */
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

/** Return a random power-up type, or undefined */
function randomPowerUp(chance: number): PowerUpType | undefined {
  if (Math.random() > chance) return undefined;
  const types: PowerUpType[] = ['wide', 'extraLife', 'multiBall', 'slowBall', 'fireBall'];
  return types[Math.floor(Math.random() * types.length)];
}

/** Normalise velocity so the ball keeps a constant speed */
function normaliseSpeed(vx: number, vy: number, speed: number) {
  const mag = Math.sqrt(vx * vx + vy * vy);
  return { vx: (vx / mag) * speed, vy: (vy / mag) * speed };
}

// ─────────────────────────────────────────────────────────────
// Main hook
// ─────────────────────────────────────────────────────────────

export function useBreakoutGame() {
  // ── Canvas ref ────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Animation frame handle ────────────────────────────────
  const rafRef = useRef<number>(0);

  // ── Mutable game objects (refs → no re-renders during loop) ─
  const ballsRef = useRef<Ball[]>([]);
  const bricksRef = useRef<Brick[]>([]);
  const paddleRef = useRef<Paddle>({
    x: GAME_WIDTH / 2 - PADDLE_NORMAL_WIDTH / 2,
    y: GAME_HEIGHT - PADDLE_Y_OFFSET,
    width: PADDLE_NORMAL_WIDTH,
    height: PADDLE_HEIGHT,
  });
  const powerUpsRef = useRef<PowerUpItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  // ── Input ─────────────────────────────────────────────────
  const keysRef = useRef<Set<string>>(new Set());
  /** Current mouse/touch X in game coordinates */
  const mouseXRef = useRef<number>(GAME_WIDTH / 2);
  /** Whether to track mouse for paddle (true once mouse moves) */
  const useMouseRef = useRef(false);
  /** Left / right button held on mobile */
  const mobileDirRef = useRef<'left' | 'right' | null>(null);

  // ── Power-up timers (ms remaining) ───────────────────────
  const widePaddleTimerRef = useRef(0);
  const slowBallTimerRef = useRef(0);
  const fireBallTimerRef = useRef(0);

  // ── Timing ────────────────────────────────────────────────
  const lastTimestampRef = useRef(0);

  // ── React state (drives UI re-renders) ───────────────────
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [difficulty, setDifficultyState] = useState<Difficulty>('medium');
  const [activePowerUps, setActivePowerUps] = useState<PowerUpType[]>([]);

  // Shadow refs for closures inside the game loop
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const levelRef = useRef(1);
  const gameStateRef = useRef<GameState>('menu');
  const soundEnabledRef = useRef(true);
  const difficultyRef = useRef<Difficulty>('medium');

  // ── Load high score from localStorage ────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('breakout-highscore');
    if (stored) setHighScore(Number(stored));
  }, []);

  // ── Keep shadow refs in sync ──────────────────────────────
  const syncScore = useCallback((v: number) => {
    scoreRef.current = v;
    setScore(v);
    if (v > (parseInt(localStorage.getItem('breakout-highscore') || '0', 10))) {
      localStorage.setItem('breakout-highscore', String(v));
      setHighScore(v);
    }
  }, []);

  const syncLives = useCallback((v: number) => {
    livesRef.current = v;
    setLives(v);
  }, []);

  const syncLevel = useCallback((v: number) => {
    levelRef.current = v;
    setLevel(v);
  }, []);

  const syncGameState = useCallback((v: GameState) => {
    gameStateRef.current = v;
    setGameState(v);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Canvas coordinate conversion (CSS px → game px)
  // ─────────────────────────────────────────────────────────
  const toGameX = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return clientX;
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * GAME_WIDTH;
  }, []);

  // ─────────────────────────────────────────────────────────
  // Build brick grid from a level design
  // ─────────────────────────────────────────────────────────
  const buildBricks = useCallback((lvl: number) => {
    const design = LEVEL_DESIGNS[lvl - 1];
    const config = DIFFICULTY_CONFIGS[difficultyRef.current];
    const bricks: Brick[] = [];

    design.forEach((row, rowIdx) => {
      const paletteEntry = BRICK_PALETTE[rowIdx % BRICK_PALETTE.length];
      row.forEach((cell, colIdx) => {
        if (cell === 0) return;

        const x =
          BRICK_LEFT_OFFSET + colIdx * (BRICK_WIDTH + BRICK_PADDING);
        const y =
          BRICK_TOP_OFFSET + rowIdx * (BRICK_HEIGHT + BRICK_PADDING);

        const indestructible = cell === -1;
        const health = indestructible ? Infinity : cell;
        const maxHealth = indestructible ? Infinity : cell;
        const points = indestructible
          ? 0
          : paletteEntry.points + (cell - 1) * MULTI_HIT_BONUS;

        bricks.push({
          x,
          y,
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          health,
          maxHealth,
          color: indestructible ? '#888' : paletteEntry.color,
          glowColor: indestructible ? '#aaa' : paletteEntry.glow,
          points,
          powerUp: indestructible
            ? undefined
            : randomPowerUp(config.powerUpChance),
          shakeX: 0,
          shakeTimer: 0,
        });
      });
    });

    bricksRef.current = bricks;
  }, []);

  // ─────────────────────────────────────────────────────────
  // Reset a single ball (attached to paddle)
  // ─────────────────────────────────────────────────────────
  const makeBall = useCallback((): Ball => {
    const paddle = paddleRef.current;
    return {
      x: paddle.x + paddle.width / 2,
      y: paddle.y - BALL_RADIUS - 2,
      vx: 0,
      vy: 0,
      radius: BALL_RADIUS,
      trail: [],
      attached: true,
      isFire: false,
    };
  }, []);

  // ─────────────────────────────────────────────────────────
  // Launch attached balls
  // ─────────────────────────────────────────────────────────
  const launchBall = useCallback(() => {
    const config = DIFFICULTY_CONFIGS[difficultyRef.current];
    const speed = config.ballSpeed + (levelRef.current - 1) * config.speedIncreasePerLevel;
    ballsRef.current.forEach((b) => {
      if (!b.attached) return;
      b.attached = false;
      b.vx = (Math.random() > 0.5 ? 1 : -1) * speed * 0.6;
      b.vy = -speed;
      if (soundEnabledRef.current) sounds.launch();
    });
  }, []);

  // ─────────────────────────────────────────────────────────
  // Spawn particles at a position
  // ─────────────────────────────────────────────────────────
  const spawnParticles = useCallback(
    (x: number, y: number, color: string, count = 12) => {
      const room = MAX_PARTICLES - particlesRef.current.length;
      const n = Math.min(count, room);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const speed = 1.5 + Math.random() * 3;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 2 + Math.random() * 3,
          color,
          alpha: 1,
          decay: 0.025 + Math.random() * 0.02,
        });
      }
    },
    [],
  );

  // ─────────────────────────────────────────────────────────
  // Initialise / reset game for a given level
  // ─────────────────────────────────────────────────────────
  const initLevel = useCallback(
    (lvl: number) => {
      // Reset paddle
      paddleRef.current = {
        x: GAME_WIDTH / 2 - PADDLE_NORMAL_WIDTH / 2,
        y: GAME_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_NORMAL_WIDTH,
        height: PADDLE_HEIGHT,
      };

      // Reset power-up timers
      widePaddleTimerRef.current = 0;
      slowBallTimerRef.current = 0;
      fireBallTimerRef.current = 0;
      setActivePowerUps([]);

      // Reset collections
      powerUpsRef.current = [];
      particlesRef.current = [];

      // Build bricks
      buildBricks(lvl);

      // Place ball
      ballsRef.current = [makeBall()];
    },
    [buildBricks, makeBall],
  );

  // ─────────────────────────────────────────────────────────
  // Start a new game
  // ─────────────────────────────────────────────────────────
  const startGame = useCallback(
    (diff: Difficulty) => {
      resumeAudio();
      difficultyRef.current = diff;
      setDifficultyState(diff);

      const config = DIFFICULTY_CONFIGS[diff];
      syncScore(0);
      syncLives(config.lives);
      syncLevel(1);
      initLevel(1);
      syncGameState('playing');
    },
    [initLevel, syncScore, syncLives, syncLevel, syncGameState],
  );

  // ─────────────────────────────────────────────────────────
  // Pause / Resume
  // ─────────────────────────────────────────────────────────
  const pauseGame = useCallback(() => {
    if (gameStateRef.current === 'playing') syncGameState('paused');
  }, [syncGameState]);

  const resumeGame = useCallback(() => {
    if (gameStateRef.current === 'paused') {
      lastTimestampRef.current = 0; // reset dt so we don't get a huge jump
      syncGameState('playing');
    }
  }, [syncGameState]);

  const togglePause = useCallback(() => {
    if (gameStateRef.current === 'playing') pauseGame();
    else if (gameStateRef.current === 'paused') resumeGame();
  }, [pauseGame, resumeGame]);

  // ─────────────────────────────────────────────────────────
  // Restart (back to menu)
  // ─────────────────────────────────────────────────────────
  const restartGame = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    syncGameState('menu');
  }, [syncGameState]);

  // ─────────────────────────────────────────────────────────
  // Sound toggle
  // ─────────────────────────────────────────────────────────
  const toggleSound = useCallback(() => {
    soundEnabledRef.current = !soundEnabledRef.current;
    setSoundEnabled(soundEnabledRef.current);
  }, []);

  // ─────────────────────────────────────────────────────────
  // Mobile controls
  // ─────────────────────────────────────────────────────────
  const mobileLeft = useCallback(() => { mobileDirRef.current = 'left'; }, []);
  const mobileRight = useCallback(() => { mobileDirRef.current = 'right'; }, []);
  const mobileStop = useCallback(() => { mobileDirRef.current = null; }, []);

  // ─────────────────────────────────────────────────────────
  // Power-up application
  // ─────────────────────────────────────────────────────────
  const applyPowerUp = useCallback(
    (type: PowerUpType) => {
      if (soundEnabledRef.current) sounds.powerUp();
      setActivePowerUps((prev) =>
        prev.includes(type) ? prev : [...prev, type],
      );

      const config = DIFFICULTY_CONFIGS[difficultyRef.current];
      const speed =
        config.ballSpeed + (levelRef.current - 1) * config.speedIncreasePerLevel;

      switch (type) {
        case 'wide':
          paddleRef.current.width = PADDLE_WIDE_WIDTH;
          widePaddleTimerRef.current = POWER_UP_DURATION;
          break;

        case 'extraLife':
          syncLives(livesRef.current + 1);
          setActivePowerUps((prev) => prev.filter((p) => p !== 'extraLife'));
          break;

        case 'multiBall': {
          const baseBall = ballsRef.current.find((b) => !b.attached) ??
            ballsRef.current[0];
          const ballsToAdd: Ball[] = [
            {
              ...baseBall,
              vx: -Math.abs(baseBall.vx || speed * 0.6),
              vy: -Math.abs(baseBall.vy || speed),
              trail: [],
              attached: false,
            },
            {
              ...baseBall,
              vx: Math.abs(baseBall.vx || speed * 0.6),
              vy: -Math.abs(baseBall.vy || speed),
              trail: [],
              attached: false,
            },
          ];
          ballsRef.current = [...ballsRef.current, ...ballsToAdd];
          setActivePowerUps((prev) => prev.filter((p) => p !== 'multiBall'));
          break;
        }

        case 'slowBall':
          slowBallTimerRef.current = POWER_UP_DURATION;
          break;

        case 'fireBall':
          fireBallTimerRef.current = POWER_UP_DURATION;
          ballsRef.current.forEach((b) => (b.isFire = true));
          break;
      }
    },
    [syncLives],
  );

  // ─────────────────────────────────────────────────────────
  // RENDERING
  // ─────────────────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    // Background
    ctx.fillStyle = '#05050f';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < GAME_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < GAME_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }

    // ── Particles ────────────────────────────────────────────
    particlesRef.current.forEach((p) => {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // ── Bricks ───────────────────────────────────────────────
    bricksRef.current.forEach((brick) => {
      if (brick.health <= 0) return;

      const ox = brick.shakeX;
      const healthRatio =
        brick.health === Infinity ? 1 : brick.health / brick.maxHealth;

      // Glow shadow
      ctx.shadowColor = brick.glowColor;
      ctx.shadowBlur = 14 * healthRatio;

      // Main fill (darken when damaged)
      ctx.globalAlpha = 0.3 + 0.7 * healthRatio;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x + ox, brick.y, brick.width, brick.height);
      ctx.globalAlpha = 1;

      // Glossy top highlight
      ctx.shadowBlur = 0;
      const grad = ctx.createLinearGradient(
        brick.x + ox,
        brick.y,
        brick.x + ox,
        brick.y + brick.height / 2,
      );
      grad.addColorStop(0, 'rgba(255,255,255,0.28)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(brick.x + ox, brick.y, brick.width, brick.height / 2);

      // Border
      ctx.strokeStyle = brick.glowColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x + ox, brick.y, brick.width, brick.height);

      // Health pip dots for multi-hit bricks
      if (brick.maxHealth !== Infinity && brick.maxHealth > 1) {
        for (let i = 0; i < brick.health; i++) {
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.arc(
            brick.x + ox + 6 + i * 7,
            brick.y + brick.height - 5,
            2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }

      // Indestructible pattern
      if (brick.health === Infinity) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(brick.x + ox + 8, brick.y);
        ctx.lineTo(brick.x + ox, brick.y + 8);
        ctx.moveTo(brick.x + ox + 20, brick.y);
        ctx.lineTo(brick.x + ox, brick.y + 20);
        ctx.stroke();
      }
    });

    ctx.shadowBlur = 0;

    // ── Power-up tokens ──────────────────────────────────────
    powerUpsRef.current.forEach((pu) => {
      const meta = POWER_UP_META[pu.type];
      const pulse = 1 + 0.1 * Math.sin(pu.pulse);

      ctx.save();
      ctx.translate(pu.x + pu.size / 2, pu.y + pu.size / 2);
      ctx.scale(pulse, pulse);

      ctx.shadowColor = meta.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = meta.color + '33';
      ctx.strokeStyle = meta.color;
      ctx.lineWidth = 2;
      const s = pu.size / 2;
      ctx.fillRect(-s, -s, pu.size, pu.size);
      ctx.strokeRect(-s, -s, pu.size, pu.size);

      ctx.shadowBlur = 0;
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${pu.size * 0.6}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, 0, 0);

      ctx.restore();
    });

    ctx.shadowBlur = 0;

    // ── Paddle ───────────────────────────────────────────────
    const paddle = paddleRef.current;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 20;
    const pg = ctx.createLinearGradient(
      paddle.x,
      paddle.y,
      paddle.x,
      paddle.y + paddle.height,
    );
    pg.addColorStop(0, '#00d4ff');
    pg.addColorStop(0.5, '#0099cc');
    pg.addColorStop(1, '#005580');
    ctx.fillStyle = pg;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Paddle gloss
    ctx.shadowBlur = 0;
    const pgGloss = ctx.createLinearGradient(
      paddle.x, paddle.y,
      paddle.x, paddle.y + paddle.height / 2,
    );
    pgGloss.addColorStop(0, 'rgba(255,255,255,0.4)');
    pgGloss.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = pgGloss;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height / 2);

    // ── Balls ────────────────────────────────────────────────
    ballsRef.current.forEach((ball) => {
      // Trail
      ball.trail.forEach((pos, i) => {
        const t = i / ball.trail.length;
        ctx.globalAlpha = t * 0.35;
        ctx.fillStyle = ball.isFire ? '#ff4500' : '#00d4ff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, ball.radius * t, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Ball body
      ctx.shadowColor = ball.isFire ? '#ff4500' : '#00d4ff';
      ctx.shadowBlur = 20;
      const bg = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3,
        ball.y - ball.radius * 0.3,
        0,
        ball.x,
        ball.y,
        ball.radius,
      );
      if (ball.isFire) {
        bg.addColorStop(0, '#fff');
        bg.addColorStop(0.4, '#ffaa00');
        bg.addColorStop(1, '#ff2200');
      } else {
        bg.addColorStop(0, '#fff');
        bg.addColorStop(0.4, '#88eeff');
        bg.addColorStop(1, '#00aacc');
      }
      ctx.fillStyle = bg;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // "CLICK TO LAUNCH" hint when ball is attached
    if (ballsRef.current.some((b) => b.attached)) {
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'SPACE / CLICK / TAP TO LAUNCH',
        GAME_WIDTH / 2,
        GAME_HEIGHT - PADDLE_Y_OFFSET - BALL_RADIUS - 22,
      );
    }
  }, []);

  // ─────────────────────────────────────────────────────────
  // GAME LOOP
  // ─────────────────────────────────────────────────────────
  const update = useCallback(
    (dt: number) => {
      if (gameStateRef.current !== 'playing') return;

      const config = DIFFICULTY_CONFIGS[difficultyRef.current];
      const baseSpeed =
        config.ballSpeed + (levelRef.current - 1) * config.speedIncreasePerLevel;
      const effectiveSpeed = slowBallTimerRef.current > 0
        ? baseSpeed * 0.55
        : baseSpeed;

      // ── Power-up timer countdown ────────────────────────────
      if (widePaddleTimerRef.current > 0) {
        widePaddleTimerRef.current -= dt;
        if (widePaddleTimerRef.current <= 0) {
          paddleRef.current.width = PADDLE_NORMAL_WIDTH;
          setActivePowerUps((prev) => prev.filter((p) => p !== 'wide'));
        }
      }
      if (slowBallTimerRef.current > 0) {
        slowBallTimerRef.current -= dt;
        if (slowBallTimerRef.current <= 0) {
          setActivePowerUps((prev) => prev.filter((p) => p !== 'slowBall'));
          // Re-normalise ball speed
          ballsRef.current.forEach((b) => {
            if (!b.attached) {
              const n = normaliseSpeed(b.vx, b.vy, baseSpeed);
              b.vx = n.vx;
              b.vy = n.vy;
            }
          });
        }
      }
      if (fireBallTimerRef.current > 0) {
        fireBallTimerRef.current -= dt;
        if (fireBallTimerRef.current <= 0) {
          ballsRef.current.forEach((b) => (b.isFire = false));
          setActivePowerUps((prev) => prev.filter((p) => p !== 'fireBall'));
        }
      }

      // ── Paddle input ──────────────────────────────────────
      const paddle = paddleRef.current;

      if (useMouseRef.current) {
        // Smooth follow of mouse X
        const target = mouseXRef.current - paddle.width / 2;
        const diff = target - paddle.x;
        paddle.x += diff * 0.22;
      } else if (mobileDirRef.current === 'left') {
        paddle.x -= PADDLE_SPEED;
      } else if (mobileDirRef.current === 'right') {
        paddle.x += PADDLE_SPEED;
      }

      if (keysRef.current.has('ArrowLeft') || keysRef.current.has('a')) {
        paddle.x -= PADDLE_SPEED;
        useMouseRef.current = false;
      }
      if (keysRef.current.has('ArrowRight') || keysRef.current.has('d')) {
        paddle.x += PADDLE_SPEED;
        useMouseRef.current = false;
      }

      paddle.x = clamp(paddle.x, 0, GAME_WIDTH - paddle.width);

      // ── Attached balls follow paddle ──────────────────────
      ballsRef.current.forEach((b) => {
        if (b.attached) {
          b.x = paddle.x + paddle.width / 2;
          b.y = paddle.y - b.radius - 2;
        }
      });

      // ── Ball physics + collisions ─────────────────────────
      const nextBalls: Ball[] = [];
      ballsRef.current.forEach((ball) => {
        if (ball.attached) {
          nextBalls.push(ball);
          return;
        }

        // Normalise to effective speed
        const norm = normaliseSpeed(ball.vx, ball.vy, effectiveSpeed);
        ball.vx = norm.vx;
        ball.vy = norm.vy;

        // Update trail
        ball.trail.push({ x: ball.x, y: ball.y });
        if (ball.trail.length > TRAIL_LENGTH) ball.trail.shift();

        // Move
        ball.x += ball.vx;
        ball.y += ball.vy;

        // ── Wall collisions ───────────────────────────────
        if (ball.x - ball.radius < 0) {
          ball.x = ball.radius;
          ball.vx = Math.abs(ball.vx);
          if (soundEnabledRef.current) sounds.wallHit();
        }
        if (ball.x + ball.radius > GAME_WIDTH) {
          ball.x = GAME_WIDTH - ball.radius;
          ball.vx = -Math.abs(ball.vx);
          if (soundEnabledRef.current) sounds.wallHit();
        }
        if (ball.y - ball.radius < 0) {
          ball.y = ball.radius;
          ball.vy = Math.abs(ball.vy);
          if (soundEnabledRef.current) sounds.wallHit();
        }

        // ── Paddle collision ──────────────────────────────
        if (
          ball.vy > 0 &&
          ball.y + ball.radius >= paddle.y &&
          ball.y + ball.radius <= paddle.y + paddle.height + Math.abs(ball.vy) &&
          ball.x >= paddle.x - ball.radius &&
          ball.x <= paddle.x + paddle.width + ball.radius
        ) {
          ball.y = paddle.y - ball.radius;
          const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
          const angle = hitPos * 65; // max ±65° from vertical
          const rad = (angle * Math.PI) / 180;

          // Slightly increase speed on each paddle hit (capped)
          const newSpeed = Math.min(
            Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) + BALL_PADDLE_SPEED_BUMP,
            BALL_MAX_SPEED,
          );
          ball.vx = Math.sin(rad) * newSpeed;
          ball.vy = -Math.cos(rad) * newSpeed;

          if (soundEnabledRef.current) sounds.paddleHit();
        }

        // ── Brick collisions ──────────────────────────────
        let hitAnyBrick = false;
        for (let bi = 0; bi < bricksRef.current.length; bi++) {
          const brick = bricksRef.current[bi];
          if (brick.health <= 0) continue;

          const bLeft = brick.x - ball.radius;
          const bRight = brick.x + brick.width + ball.radius;
          const bTop = brick.y - ball.radius;
          const bBottom = brick.y + brick.height + ball.radius;

          if (
            ball.x >= bLeft &&
            ball.x <= bRight &&
            ball.y >= bTop &&
            ball.y <= bBottom
          ) {
            // Determine collision axis via overlap
            const overlapL = ball.x - bLeft;
            const overlapR = bRight - ball.x;
            const overlapT = ball.y - bTop;
            const overlapB = bBottom - ball.y;

            const minX = Math.min(overlapL, overlapR);
            const minY = Math.min(overlapT, overlapB);

            if (!ball.isFire) {
              if (minX < minY) {
                ball.vx *= -1;
                ball.x += overlapL < overlapR ? -minX : minX;
              } else {
                ball.vy *= -1;
                ball.y += overlapT < overlapB ? -minY : minY;
              }
            }

            if (brick.health !== Infinity) {
              brick.health -= 1;
              brick.shakeX = 4;
              brick.shakeTimer = 80;

              if (brick.health <= 0) {
                // Brick destroyed
                if (soundEnabledRef.current) sounds.brickDestroy();
                spawnParticles(
                  brick.x + brick.width / 2,
                  brick.y + brick.height / 2,
                  brick.color,
                  16,
                );
                syncScore(scoreRef.current + brick.points);

                // Drop power-up
                if (brick.powerUp) {
                  powerUpsRef.current.push({
                    x: brick.x + brick.width / 2 - POWER_UP_SIZE / 2,
                    y: brick.y,
                    vy: POWER_UP_SPEED,
                    type: brick.powerUp,
                    size: POWER_UP_SIZE,
                    pulse: 0,
                  });
                }
              } else {
                if (soundEnabledRef.current) sounds.brickHit();
              }
            }

            hitAnyBrick = true;
            if (!ball.isFire) break; // fireBall can hit multiple bricks
          }
        }

        // ── Ball falls off bottom ─────────────────────────
        if (ball.y - ball.radius > GAME_HEIGHT) {
          return; // Remove ball
        }

        nextBalls.push(ball);
      });

      // If all balls are gone → lose a life
      if (nextBalls.length === 0 || nextBalls.every((b) => b.y - b.radius > GAME_HEIGHT)) {
        const filtered = nextBalls.filter((b) => b.y - b.radius <= GAME_HEIGHT);
        if (filtered.length === 0) {
          if (soundEnabledRef.current) sounds.lifeLost();
          const remaining = livesRef.current - 1;
          syncLives(remaining);
          if (remaining <= 0) {
            if (soundEnabledRef.current) sounds.gameOver();
            ballsRef.current = [];
            syncGameState('gameOver');
            return;
          }
          ballsRef.current = [makeBall()];
        } else {
          ballsRef.current = filtered;
        }
      } else {
        ballsRef.current = nextBalls;
      }

      // ── Brick shake animation ─────────────────────────────
      bricksRef.current.forEach((brick) => {
        if (brick.shakeTimer > 0) {
          brick.shakeTimer -= dt;
          brick.shakeX = brick.shakeTimer > 40 ? 3 : -3;
          if (brick.shakeTimer <= 0) brick.shakeX = 0;
        }
      });

      // ── Remove dead bricks ────────────────────────────────
      bricksRef.current = bricksRef.current.filter((b) => b.health > 0);

      // ── Check level complete (all destructible bricks gone) ─
      const remaining = bricksRef.current.filter((b) => b.health !== Infinity);
      if (remaining.length === 0) {
        if (soundEnabledRef.current) sounds.levelComplete();
        if (levelRef.current >= TOTAL_LEVELS) {
          if (soundEnabledRef.current) sounds.victory();
          syncGameState('victory');
        } else {
          syncGameState('levelComplete');
        }
        return;
      }

      // ── Falling power-ups ────────────────────────────────
      const alivePUs: PowerUpItem[] = [];
      powerUpsRef.current.forEach((pu) => {
        pu.y += pu.vy;
        pu.pulse += 0.08;

        // Collected?
        if (
          pu.y + pu.size >= paddle.y &&
          pu.y <= paddle.y + paddle.height &&
          pu.x + pu.size >= paddle.x &&
          pu.x <= paddle.x + paddle.width
        ) {
          applyPowerUp(pu.type);
          return;
        }

        if (pu.y < GAME_HEIGHT + pu.size) alivePUs.push(pu);
      });
      powerUpsRef.current = alivePUs;

      // ── Particles ────────────────────────────────────────
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.06,
          alpha: p.alpha - p.decay,
          radius: p.radius * 0.97,
        }))
        .filter((p) => p.alpha > 0.01);
    },
    [applyPowerUp, makeBall, spawnParticles, syncLives, syncScore, syncGameState],
  );

  // ─────────────────────────────────────────────────────────
  // GAME LOOP RUNNER
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    /** Resize canvas to fill container, maintaining game aspect ratio */
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = GAME_WIDTH * dpr;
      canvas.height = GAME_HEIGHT * dpr;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);

    const ctx = canvas.getContext('2d')!;

    const loop = (ts: number) => {
      const dt = lastTimestampRef.current
        ? Math.min(ts - lastTimestampRef.current, 40) // cap at 40ms
        : 16;
      lastTimestampRef.current = ts;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (gameStateRef.current === 'playing') update(dt);
      draw(ctx);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [draw, update]);

  // ─────────────────────────────────────────────────────────
  // INPUT LISTENERS
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameStateRef.current === 'menu') return;

      keysRef.current.add(e.key);

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (gameStateRef.current === 'playing') launchBall();
        else if (gameStateRef.current === 'paused') resumeGame();
      }
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
        e.preventDefault();
        togglePause();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [launchBall, resumeGame, togglePause]);

  /** Attach mouse/touch listeners to the canvas */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      useMouseRef.current = true;
      mouseXRef.current = toGameX(e.clientX);
    };

    const onClick = () => {
      resumeAudio();
      if (gameStateRef.current === 'playing') launchBall();
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      useMouseRef.current = true;
      mouseXRef.current = toGameX(e.touches[0].clientX);
    };

    const onTouchStart = (e: TouchEvent) => {
      resumeAudio();
      useMouseRef.current = true;
      mouseXRef.current = toGameX(e.touches[0].clientX);
      if (gameStateRef.current === 'playing') launchBall();
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchstart', onTouchStart);

    return () => {
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchstart', onTouchStart);
    };
  }, [launchBall, toGameX]);

  // ─────────────────────────────────────────────────────────
  // Next-level handler
  // ─────────────────────────────────────────────────────────
  const nextLevel = useCallback(() => {
    const next = levelRef.current + 1;
    syncLevel(next);
    initLevel(next);
    syncGameState('playing');
  }, [syncLevel, initLevel, syncGameState]);

  return {
    canvasRef,
    gameState,
    score,
    lives,
    level,
    highScore,
    soundEnabled,
    difficulty,
    activePowerUps,
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    nextLevel,
    toggleSound,
    launchBall,
    // Mobile controls
    mobileLeft,
    mobileRight,
    mobileStop,
  } as const;
}
