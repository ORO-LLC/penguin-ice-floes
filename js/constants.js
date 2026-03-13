
/**
 * constants.js — shared game constants
 */
'use strict';

const C = Object.freeze({
  // Canvas logical size (scaled to fit viewport)
  CANVAS_W: 400,
  CANVAS_H: 700,

  // Row layout
  NUM_ROWS: 10,          // 0 = start (bottom), 9 = win (top)
  ROW_HEIGHT: 70,        // px per row

  // Penguin
  PENGUIN_W: 36,
  PENGUIN_H: 44,
  JUMP_DURATION: 380,    // ms for a jump animation
  MOVE_DURATION: 140,    // ms for a left/right step
  BLINK_DURATION: 1200,  // ms for fail blink before reset
  STEP_SIZE: 28,         // px per left/right step

  // Floe
  FLOE_H: 18,
  COLLISION_FACTOR: 1.10, // 110% of floe width for forgiving landing

  // Timer
  LEVEL_TIME: 120,       // seconds
  WARNING_TIME: 20,      // seconds remaining when timer turns red

  // Rows: index 0 = bottom start row, index 9 = top win row
  // Gameplay rows are 1-8
  START_ROW: 0,
  WIN_ROW: 9,

  // Colors (placeholder art)
  COLOR_SKY_TOP:    '#0d2b52',
  COLOR_SKY_BOTTOM: '#1a5276',
  COLOR_WATER:      '#1a6fa8',
  COLOR_FLOE:       '#d6eeff',
  COLOR_FLOE_EDGE:  '#a8d4f5',
  COLOR_FLOE_SHINE: '#ffffff',
  COLOR_START_PLATFORM: '#4a90d9',
  COLOR_WIN_PLATFORM:   '#f0c040',

  // Penguin placeholder colors
  COLOR_PENGUIN_BODY:  '#1a1a2e',
  COLOR_PENGUIN_BELLY: '#f0f0f0',
  COLOR_PENGUIN_BEAK:  '#f5a623',
  COLOR_PENGUIN_FEET:  '#f5a623',
  COLOR_PENGUIN_EYE:   '#ffffff',

  // Z-order / misc
  WATER_ROWS: [1,2,3,4,5,6,7,8], // rows with water background

  // Row Y positions (row 0 at bottom, row 9 at top)
  // Computed at runtime via rowY(row)
});

/**
 * Returns the canvas Y coordinate of the TOP of a given row.
 * Row 0 is at the bottom, row 9 at the top.
 */
function rowY(row) {
  // Row 0 top = CANVAS_H - ROW_HEIGHT
  // Row 9 top = 0
  return C.CANVAS_H - (row + 1) * C.ROW_HEIGHT;
}

/**
 * Returns the Y coordinate for the penguin's feet (bottom of penguin sprite)
 * when standing on a given row.
 */
function penguinStandY(row) {
  // Penguin feet sit on top of the row surface
  return rowY(row) - C.PENGUIN_H;
}

/**
 * Row center Y (used for floe vertical centering)
 */
function rowCenterY(row) {
  return rowY(row) + C.ROW_HEIGHT / 2;
}

/**
 * Clamp a value between min and max.
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Wrap x within [0, width)
 */
function wrapX(x, width) {
  return ((x % width) + width) % width;
}