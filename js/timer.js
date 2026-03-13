
/**
 * timer.js — Countdown timer
 */
'use strict';

class GameTimer {
  constructor(totalSeconds) {
    this.total    = totalSeconds;
    this.remaining = totalSeconds;
    this.running  = false;
    this._el      = document.getElementById('timer-display');
  }

  start() {
    this.remaining = this.total;
    this.running   = true;
    this._render();
  }

  stop() {
    this.running = false;
  }

  reset() {
    this.remaining = this.total;
    this.running   = false;
    this._render();
  }

  update(dt) {
    if (!this.running) return;
    this.remaining -= dt;
    if (this.remaining < 0) this.remaining = 0;
    this._render();
  }

  isExpired() {
    return this.running && this.remaining <= 0;
  }

  _render() {
    const secs  = Math.ceil(this.remaining);
    const m     = Math.floor(secs / 60);
    const s     = secs % 60;
    const str   = `${m}:${s.toString().padStart(2, '0')}`;
    if (this._el) {
      this._el.textContent = str;
      if (this.remaining <= C.WARNING_TIME && this.running) {
        this._el.classList.add('warning');
      } else {
        this._el.classList.remove('warning');
      }
    }
  }

  getRemaining() { return this.remaining; }
}