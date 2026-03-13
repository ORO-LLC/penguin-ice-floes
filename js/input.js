
/**
 * input.js — Keyboard and touch input handler
 */
'use strict';

const Input = (() => {
  let _onLeft  = null;
  let _onRight = null;
  let _onJump  = null;

  function init(onLeft, onRight, onJump) {
    _onLeft  = onLeft;
    _onRight = onRight;
    _onJump  = onJump;

    // Keyboard
    document.addEventListener('keydown', _handleKey);

    // Mobile buttons
    _bindBtn('btn-left',  () => _onLeft  && _onLeft());
    _bindBtn('btn-right', () => _onRight && _onRight());
    _bindBtn('btn-jump',  () => _onJump  && _onJump());

    // Touch on canvas: left third = left, right third = right, middle = jump
    const canvas = document.getElementById('game-canvas');
    canvas.addEventListener('touchstart', _handleTouch, { passive: false });
    canvas.addEventListener('mousedown',  _handleMouse);
  }

  function _handleKey(e) {
    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        e.preventDefault();
        _onLeft && _onLeft();
        break;
      case 'ArrowRight':
      case 'KeyD':
        e.preventDefault();
        _onRight && _onRight();
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        e.preventDefault();
        _onJump && _onJump();
        break;
    }
  }

  function _handleTouch(e) {
    e.preventDefault();
    const touch  = e.changedTouches[0];
    const canvas = e.currentTarget;
    const rect   = canvas.getBoundingClientRect();
    const relX   = touch.clientX - rect.left;
    const w      = rect.width;
    _dispatchByX(relX, w);
  }

  function _handleMouse(e) {
    const canvas = e.currentTarget;
    const rect   = canvas.getBoundingClientRect();
    const relX   = e.clientX - rect.left;
    const w      = rect.width;
    _dispatchByX(relX, w);
  }

  function _dispatchByX(relX, w) {
    const third = w / 3;
    if (relX < third) {
      _onLeft && _onLeft();
    } else if (relX > w - third) {
      _onRight && _onRight();
    } else {
      _onJump && _onJump();
    }
  }

  function _bindBtn(id, fn) {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
    el.addEventListener('mousedown',  fn);
  }

  return { init };
})();