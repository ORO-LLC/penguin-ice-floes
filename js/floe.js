
/**
 * floe.js — Floe class and row pattern definitions
 */
'use strict';

class Floe {
  /**
   * @param {number} row      - which gameplay row (1-8)
   * @param {number} x        - initial left edge x (canvas coords)
   * @param {number} width    - floe width in px
   * @param {number} speed    - px/sec, positive = right, negative = left
   */
  constructor(row, x, width, speed) {
    this.row   = row;
    this.x     = x;
    this.width = width;
    this.speed = speed;
    this.y     = rowCenterY(row) - C.FLOE_H / 2;
  }

  get centerX() { return this.x + this.width / 2; }

  update(dt) {
    this.x += this.speed * dt;
    // Wrap: when fully off right edge, reappear on left (and vice-versa)
    if (this.speed > 0 && this.x > C.CANVAS_W) {
      this.x -= C.CANVAS_W + this.width;
    } else if (this.speed < 0 && this.x + this.width < 0) {
      this.x += C.CANVAS_W + this.width;
    }
  }

  /**
   * Forgiving collision: returns true if penguinCenterX lands within
   * 110% of floe width from floe center.
   */
  containsX(penguinCenterX) {
    const half = (this.width / 2) * C.COLLISION_FACTOR;
    return Math.abs(penguinCenterX - this.centerX) <= half;
  }
}

// ---------------------------------------------------------------------------
// Row pattern definitions
// Each entry: { speed (px/s), floes: [{x (0-1 fraction of CANVAS_W), w}] }
// 7 distinct patterns for rows 1-8 (row 8 reuses pattern index 6)
// Patterns are designed so there is always a floe to land on and
// floes don't crowd each other enough to trap the penguin.
// ---------------------------------------------------------------------------

const ROW_PATTERNS = [
  // Row 1 — slow, wide floes, left-to-right
  {
    speed: 40,
    floes: [
      { xFrac: 0.00, w: 100 },
      { xFrac: 0.35, w: 100 },
      { xFrac: 0.68, w: 100 },
    ],
  },
  // Row 2 — medium speed, right-to-left
  {
    speed: -55,
    floes: [
      { xFrac: 0.05, w: 90 },
      { xFrac: 0.38, w: 90 },
      { xFrac: 0.70, w: 90 },
    ],
  },
  // Row 3 — slow, wider gaps, left-to-right
  {
    speed: 45,
    floes: [
      { xFrac: 0.00, w: 110 },
      { xFrac: 0.42, w: 110 },
    ],
  },
  // Row 4 — medium, right-to-left, 3 floes
  {
    speed: -60,
    floes: [
      { xFrac: 0.02, w: 85 },
      { xFrac: 0.36, w: 85 },
      { xFrac: 0.68, w: 85 },
    ],
  },
  // Row 5 — slightly faster, left-to-right, 3 floes
  {
    speed: 65,
    floes: [
      { xFrac: 0.00, w: 95 },
      { xFrac: 0.34, w: 95 },
      { xFrac: 0.67, w: 95 },
    ],
  },
  // Row 6 — medium-slow, right-to-left, 2 wide floes
  {
    speed: -50,
    floes: [
      { xFrac: 0.03, w: 115 },
      { xFrac: 0.55, w: 115 },
    ],
  },
  // Row 7 & 8 — gentle, left-to-right, 3 floes (easy approach to win)
  {
    speed: 42,
    floes: [
      { xFrac: 0.00, w: 105 },
      { xFrac: 0.36, w: 105 },
      { xFrac: 0.70, w: 105 },
    ],
  },
];

function buildFloes() {
  const all = [];
  for (let row = 1; row <= 8; row++) {
    const patternIdx = Math.min(row - 1, ROW_PATTERNS.length - 1);
    const pat = ROW_PATTERNS[patternIdx];
    pat.floes.forEach(f => {
      all.push(new Floe(row, f.xFrac * C.CANVAS_W, f.w, pat.speed));
    });
  }
  return all;
}