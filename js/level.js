
/**
 * level.js — Level data container
 */
'use strict';

class Level {
  constructor() {
    this.floes = buildFloes();
  }

  reset() {
    // Rebuild floes from scratch (resets positions)
    this.floes = buildFloes();
  }

  update(dt) {
    this.floes.forEach(f => f.update(dt));
  }

  floesInRow(row) {
    return this.floes.filter(f => f.row === row);
  }

  /**
   * Find the floe the penguin is currently standing on (by row + X overlap).
   */
  findFloeAt(row, centerX) {
    return this.floesInRow(row).find(f => f.containsX(centerX)) || null;
  }
}