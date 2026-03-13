
/**
 * penguin.js — Penguin state machine
 */
'use strict';

const POSE = Object.freeze({
  STAND: 'stand',
  WALK:  'walk',
  JUMP:  'jump',
  FALL:  'fall',
  WIN:   'win',
});

const PSTATE = Object.freeze({
  IDLE:    'idle',    // standing on floe / start platform
  MOVING:  'moving',  // left/right step animation
  JUMPING: 'jumping', // mid-air jump to next row
  FAILING: 'failing', // fell in water — blink/fade
  WIN:     'win',
});

class Penguin {
  constructor() {
    this.reset();
  }

  reset() {
    this.row        = C.START_ROW;
    this.x          = C.CANVAS_W / 2 - C.PENGUIN_W / 2; // left edge
    this.y          = penguinStandY(C.START_ROW);
    this.pose       = POSE.STAND;
    this.state      = PSTATE.IDLE;
    this.rideFloe   = null;   // reference to floe currently riding
    this.animTimer  = 0;      // ms remaining in current animation
    this.blinkTimer = 0;
    this.visible    = true;
    this.opacity    = 1;
    // Jump arc
    this._jumpStartX = 0;
    this._jumpStartY = 0;
    this._jumpEndX   = 0;
    this._jumpEndY   = 0;
    this._jumpProgress = 0;
    // Move step
    this._moveStartX = 0;
    this._moveDeltaX = 0;
  }

  get centerX() { return this.x + C.PENGUIN_W / 2; }

  isInputLocked() {
    return this.state !== PSTATE.IDLE;
  }

  /**
   * Attempt to move left or right by one step.
   * Only allowed when IDLE on a floe (not on start/win platform).
   */
  tryMove(dir) {
    if (this.isInputLocked()) return false;
    if (this.row === C.START_ROW || this.row === C.WIN_ROW) return false;
    const delta = dir === 'left' ? -C.STEP_SIZE : C.STEP_SIZE;
    this._moveStartX = this.x;
    this._moveDeltaX = delta;
    this.state     = PSTATE.MOVING;
    this.pose      = POSE.WALK;
    this.animTimer = C.MOVE_DURATION;
    return true;
  }

  /**
   * Attempt to jump to the next row.
   * Only allowed when IDLE.
   */
  tryJump() {
    if (this.isInputLocked()) return false;
    const targetRow = this.row + 1;
    if (targetRow > C.WIN_ROW) return false;

    this._jumpStartX   = this.x;
    this._jumpStartY   = this.y;
    this._jumpEndX     = this.x; // land at same X (floe carries it)
    this._jumpEndY     = penguinStandY(targetRow);
    this._jumpProgress = 0;
    this.state         = PSTATE.JUMPING;
    this.pose          = POSE.JUMP;
    this.animTimer     = C.JUMP_DURATION;
    this.rideFloe      = null;
    Assets.playSound('jump');
    return true;
  }

  /**
   * Called when penguin lands in water.
   */
  fail() {
    if (this.state === PSTATE.FAILING) return;
    this.state      = PSTATE.FAILING;
    this.pose       = POSE.FALL;
    this.blinkTimer = C.BLINK_DURATION;
    this.rideFloe   = null;
    Assets.playSound('splash');
  }

  /**
   * Called when penguin reaches win row.
   */
  win() {
    this.state = PSTATE.WIN;
    this.pose  = POSE.WIN;
    Assets.playSound('win');
  }

  update(dt, floes) {
    const dtMs = dt * 1000;

    switch (this.state) {
      case PSTATE.IDLE:
        this._updateRiding(dt);
        break;

      case PSTATE.MOVING:
        this.animTimer -= dtMs;
        const moveT = clamp(1 - this.animTimer / C.MOVE_DURATION, 0, 1);
        this.x = this._moveStartX + this._moveDeltaX * moveT;
        // Wrap penguin X
        this.x = wrapX(this.x, C.CANVAS_W);
        if (this.animTimer <= 0) {
          this.x     = wrapX(this._moveStartX + this._moveDeltaX, C.CANVAS_W);
          this.state = PSTATE.IDLE;
          this.pose  = POSE.STAND;
        }
        this._updateRiding(dt);
        break;

      case PSTATE.JUMPING:
        this.animTimer -= dtMs;
        this._jumpProgress = clamp(1 - this.animTimer / C.JUMP_DURATION, 0, 1);
        // Horizontal: stay at start X (no horizontal drift during jump)
        this.x = this._jumpStartX;
        // Vertical arc
        const arc = Math.sin(this._jumpProgress * Math.PI);
        const arcHeight = C.ROW_HEIGHT * 0.9;
        this.y = this._jumpStartY +
          (this._jumpEndY - this._jumpStartY) * this._jumpProgress -
          arc * arcHeight;

        if (this.animTimer <= 0) {
          this._landJump(floes);
        }
        break;

      case PSTATE.FAILING:
        this.blinkTimer -= dtMs;
        // Blink effect
        this.visible = Math.floor(this.blinkTimer / 150) % 2 === 0;
        this.opacity = clamp(this.blinkTimer / C.BLINK_DURATION, 0, 1);
        if (this.blinkTimer <= 0) {
          // Signal to game to reset
          this._failDone = true;
        }
        break;

      case PSTATE.WIN:
        // Static
        break;
    }
  }

  _updateRiding(dt) {
    if (this.rideFloe) {
      // Move with floe
      this.x += this.rideFloe.speed * dt;
      this.x  = wrapX(this.x, C.CANVAS_W);
    }
  }

  _landJump(floes) {
    const targetRow = this.row + 1;
    this.y = penguinStandY(targetRow);

    if (targetRow === C.WIN_ROW) {
      this.row  = targetRow;
      this.x    = this._jumpStartX;
      this.state = PSTATE.IDLE;
      this.pose  = POSE.STAND;
      return; // game.js will detect WIN_ROW and call win()
    }

    // Check if landed on a floe
    const landed = floes.filter(f => f.row === targetRow)
                        .find(f => f.containsX(this.centerX));
    if (landed) {
      this.row      = targetRow;
      this.rideFloe = landed;
      this.state    = PSTATE.IDLE;
      this.pose     = POSE.STAND;
      Assets.playSound('land');
    } else {
      this.fail();
    }
  }
}