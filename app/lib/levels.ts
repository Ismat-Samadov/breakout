// ============================================================
// levels.ts — Brick layout definitions for each level
//
// Grid values:
//   0   = empty cell
//   1   = 1-hit brick
//   2   = 2-hit brick  (darker shade + requires two hits)
//   3   = 3-hit brick  (strong)
//  -1   = indestructible (silver)
// ============================================================

/**
 * Each element is a 2-D grid (rows × BRICK_COLS).
 * Rows are drawn top-to-bottom; columns left-to-right.
 */
export const LEVEL_DESIGNS: number[][][] = [
  // ── Level 1 – "Hello World" ──────────────────────────────
  // Simple chevron / diamond shape, single-hit bricks only
  [
    [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  ],

  // ── Level 2 – "Fortress" ─────────────────────────────────
  // Diamond of 2-hit bricks with indestructible corners
  [
    [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
    [0, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 0],
    [1, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 1],
    [1, 2, 2,-1, 2, 2, 2, 2,-1, 2, 2, 1],
    [1, 2, 2, 2, 1, 1, 1, 1, 2, 2, 2, 1],
    [0, 1, 2, 2, 2, 1, 1, 2, 2, 2, 1, 0],
    [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
  ],

  // ── Level 3 – "Grid Lock" ────────────────────────────────
  // Full grid with checkerboard of strong bricks and indestructible pillars
  [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2,-1, 2, 3, 2, 3, 3, 2, 3, 2,-1, 2],
    [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
    [2, 3, 3,-1, 3, 2, 2, 3,-1, 3, 3, 2],
    [2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2],
    [2,-1, 2, 3, 2, 3, 3, 2, 3, 2,-1, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  ],
];

export const TOTAL_LEVELS = LEVEL_DESIGNS.length;
