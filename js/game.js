
/**
 * game.js — Main game loop and state machine
 */
'use strict';

const GSTATE = Object.freeze({
  MENU:    'menu',
  PLAYING: 'playing',
  WIN:     'win',
  TIMEOUT: 'timeout',
});

const Game = (() => {
  let _state   = GSTATE.MENU;
  let _level   = null;
  let _penguin = null;
  let _timer   = null;
  let _raf     = null;
  let _lastTs  = null;

  // Screen elements
  const screens = {
    start:   document.getElementById('screen-start'),
    win:     document.getElementById('screen-win'),
    timeout: document.getElementById('screen-timeout'),
  };

  function _showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (name && screens[name]) screens[name].classList.add('active');
  }

  function _hideAllScreens() {
    Object.values(screens).forEach(s => s.classList.remove('active'));
  }

  // -------------------------------------------------------------------------
  // Init
  // -------------------------------------------------------------------------
  function init() {
    Renderer.init();

    _level   = new Level();
    _penguin = new Penguin();
    _timer   = new GameTimer(C.LEVEL_TIME);

    // Wire up inputs
    Input.init(
      () => _handleLeft(),
      () => _handleRight(),
      () => _handleJump()
    );

    // Button listeners
    document.getElementById('btn-start').addEventListener('click', startGame);
    document.getElementById('btn-win-restart').addEventListener('click', startGame);
    document.getElementById('btn-timeout-restart').addEventListener('click', startGame);

    // Check family art image
    const familyEl = document.getElementById('win-family-art');
    const familyImg = Assets.get('family');
    if (!familyImg) {
      familyEl.classList.add('placeholder');
    }

    // Load assets then show start screen
    Assets.load().then(() => {
      _showScreen('start');
      // Draw a static first frame
      Renderer.draw(_level, _penguin, _state);
    });
  }

  // -------------------------------------------------------------------------
  // Game lifecycle
  // -------------------------------------------------------------------------
  function startGame() {
    _level.reset();
    _penguin.reset();
    _timer.start();
    _state = GSTATE.PLAYING;
    _hideAllScreens();
    _lastTs = null;
    if (_raf) cancelAnimationFrame(_raf);
    _raf = requestAnimationFrame(_loop);
  }

  function _resetToStart() {
    _level.reset();
    _penguin.reset();
    _timer.start();
    _state = GSTATE.PLAYING;
  }

  // -------------------------------------------------------------------------
  // Main loop
  // -------------------------------------------------------------------------
  function _loop(ts) {
    if (_lastTs === null) _lastTs = ts;
    const dt = Math.min((ts - _lastTs) / 1000, 0.1); // cap at 100ms
    _lastTs = ts;

    _update(dt);
    Renderer.draw(_level, _penguin, _state);

    if (_state === GSTATE.PLAYING || _state === GSTATE.WIN) {
      _raf = requestAnimationFrame(_loop);
    }
  }

  // -------------------------------------------------------------------------
  // Update
  // -------------------------------------------------------------------------
  function _update(dt) {
    if (_state !== GSTATE.PLAYING) return;

    // Timer
    _timer.update(dt);

    // Check timeout — even mid-jump
    if (_timer.isExpired()) {
      _state = GSTATE.TIMEOUT;
      _timer.stop();
      _showScreen('timeout');
      return;
    }

    // Level (floes)
    _level.update(dt);

    // Penguin
    _penguin.update(dt, _level.floes);

    // Check fail done (blink finished)
    if (_penguin._failDone) {
      _penguin._failDone = false;
      _resetToStart();
      return;
    }

    // Check win
    if (_penguin.state === PSTATE.IDLE && _penguin.row === C.WIN_ROW) {
      _penguin.win();
      _state = GSTATE.WIN;
      _timer.stop();
      setTimeout(() => _showScreen('win'), 600);
      return;
    }

    // Re-attach penguin to floe if IDLE and not on start/win row
    // (handles case where penguin was placed on a floe but rideFloe is null)
    if (_penguin.state === PSTATE.IDLE &&
        _penguin.row > C.START_ROW &&
        _penguin.row < C.WIN_ROW &&
        !_penguin.rideFloe) {
      const f = _level.findFloeAt(_penguin.row, _penguin.centerX);
      if (f) {
        _penguin.rideFloe = f;
      } else {
        // Penguin slid off floe
        _penguin.fail();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Input handlers
  // -------------------------------------------------------------------------
  function _handleLeft() {
    if (_state !== GSTATE.PLAYING) return;
    _penguin.tryMove('left');
  }

  function _handleRight() {
    if (_state !== GSTATE.PLAYING) return;
    _penguin.tryMove('right');
  }

  function _handleJump() {
    if (_state !== GSTATE.PLAYING) return;
    // On start row, jump directly (no floe needed)
    if (_penguin.row === C.START_ROW && _penguin.state === PSTATE.IDLE) {
      _penguin.tryJump();
      return;
    }
    // On gameplay rows, only jump if on a floe
    if (_penguin.rideFloe || _penguin.row === C.WIN_ROW) {
      _penguin.tryJump();
    }
  }

  // -------------------------------------------------------------------------
  // Boot
  // -------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', init);

  return { startGame };
})();