// ============================================================
// sounds.ts — Procedural sound effects via Web Audio API
// No external audio files required.
// ============================================================

/** Lazily-created shared AudioContext */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    ctx = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext)();
  }
  // Resume if suspended (browser auto-play policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/**
 * Plays a single synthesised tone.
 * @param freq       Start frequency in Hz
 * @param freqEnd    End frequency (for pitch slide)
 * @param duration   Duration in seconds
 * @param type       Oscillator waveform
 * @param vol        Peak gain (0–1)
 * @param delay      Schedule offset from now (seconds)
 */
function tone(
  freq: number,
  freqEnd: number,
  duration: number,
  type: OscillatorType = 'square',
  vol = 0.25,
  delay = 0,
) {
  const c = getCtx();
  if (!c) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t + duration);

  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

  osc.start(t);
  osc.stop(t + duration + 0.01);
}

// ── Sound presets ─────────────────────────────────────────────

export const sounds = {
  /** Ball bounces off the paddle */
  paddleHit() {
    tone(300, 260, 0.07, 'square', 0.18);
  },

  /** Ball bounces off a wall */
  wallHit() {
    tone(200, 180, 0.05, 'sine', 0.12);
  },

  /** Ball hits a brick (but doesn't destroy it) */
  brickHit() {
    tone(500, 420, 0.06, 'square', 0.15);
  },

  /** Brick is fully destroyed */
  brickDestroy() {
    tone(700, 900, 0.05, 'square', 0.2);
    tone(900, 600, 0.08, 'sine', 0.15, 0.04);
  },

  /** Player loses a life */
  lifeLost() {
    tone(350, 150, 0.25, 'sawtooth', 0.3);
    tone(200, 80, 0.3, 'sawtooth', 0.25, 0.2);
  },

  /** Power-up collected */
  powerUp() {
    [400, 520, 660, 800].forEach((f, i) => {
      tone(f, f * 1.1, 0.07, 'sine', 0.2, i * 0.06);
    });
  },

  /** Level cleared */
  levelComplete() {
    [523, 659, 784, 1047].forEach((f, i) => {
      tone(f, f, 0.14, 'sine', 0.25, i * 0.1);
    });
  },

  /** All lives lost */
  gameOver() {
    [380, 310, 240, 160].forEach((f, i) => {
      tone(f, f * 0.8, 0.22, 'sawtooth', 0.28, i * 0.15);
    });
  },

  /** Player beats all levels */
  victory() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((f, i) => {
      tone(f, f, 0.16, 'sine', 0.26, i * 0.1);
    });
  },

  /** Ball launches */
  launch() {
    tone(220, 440, 0.1, 'sine', 0.18);
  },
};

/** Resume the AudioContext if it was blocked by browser autoplay policy */
export function resumeAudio() {
  getCtx();
}
