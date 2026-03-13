
/**
 * renderer.js — Canvas rendering (placeholder art + image support)
 */
'use strict';

const Renderer = (() => {
  let _canvas = null;
  let _ctx    = null;
  let _scale  = 1;

  function init() {
    _canvas = document.getElementById('game-canvas');
    _ctx    = _canvas.getContext('2d');
    _resize();
    window.addEventListener('resize', _resize);
  }

  function _resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Maintain aspect ratio, fit within viewport
    // Leave room for mobile controls (~80px) on small screens
    const mobileCtrlH = vw < 600 ? 80 : 0;
    const availH = vh - mobileCtrlH;
    _scale = Math.min(vw / C.CANVAS_W, availH / C.CANVAS_H);
    _canvas.width  = Math.floor(C.CANVAS_W * _scale);
    _canvas.height = Math.floor(C.CANVAS_H * _scale);
    _ctx.setTransform(_scale, 0, 0, _scale, 0, 0);
  }

  function getScale() { return _scale; }

  // -------------------------------------------------------------------------
  // Main draw entry point
  // -------------------------------------------------------------------------
  function draw(level, penguin, gameState) {
    const ctx = _ctx;
    ctx.clearRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    _drawBackground(ctx);
    _drawRows(ctx);
    _drawFloes(ctx, level.floes);
    _drawPenguin(ctx, penguin);
  }

  // -------------------------------------------------------------------------
  // Background
  // -------------------------------------------------------------------------
  function _drawBackground(ctx) {
    const bgImg = Assets.get('bg');
    if (bgImg) {
      ctx.drawImage(bgImg, 0, 0, C.CANVAS_W, C.CANVAS_H);
      return;
    }
    // Gradient sky
    const grad = ctx.createLinearGradient(0, 0, 0, C.CANVAS_H);
    grad.addColorStop(0,   C.COLOR_SKY_TOP);
    grad.addColorStop(0.6, C.COLOR_SKY_BOTTOM);
    grad.addColorStop(1,   C.COLOR_WATER);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, C.CANVAS_W, C.CANVAS_H);

    // Water shimmer lines
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#7ec8e3';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const y = rowY(1) + i * 12;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(C.CANVAS_W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Row platforms (start + win)
  // -------------------------------------------------------------------------
  function _drawRows(ctx) {
    // Start platform (row 0)
    _drawPlatform(ctx, C.START_ROW, C.COLOR_START_PLATFORM);
    // Win platform (row 9)
    _drawPlatform(ctx, C.WIN_ROW, C.COLOR_WIN_PLATFORM);
  }

  function _drawPlatform(ctx, row, color) {
    const y = rowY(row);
    ctx.fillStyle = color;
    ctx.fillRect(0, y, C.CANVAS_W, C.ROW_HEIGHT);
    // Top edge highlight
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, y, C.CANVAS_W, 3);
    // Label
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (row === C.START_ROW) {
      ctx.fillText('START', C.CANVAS_W / 2, y + C.ROW_HEIGHT / 2);
    } else {
      ctx.fillText('🏁 GOAL', C.CANVAS_W / 2, y + C.ROW_HEIGHT / 2);
    }
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Floes
  // -------------------------------------------------------------------------
  function _drawFloes(ctx, floes) {
    floes.forEach(f => _drawFloe(ctx, f));
  }

  function _drawFloe(ctx, f) {
    const floeImg = Assets.get('floe');
    const x = f.x;
    const y = f.y;
    const w = f.width;
    const h = C.FLOE_H;
    const r = 6; // corner radius

    if (floeImg) {
      ctx.drawImage(floeImg, x, y, w, h);
    } else {
      // Placeholder ice floe
      ctx.save();
      ctx.beginPath();
      _roundRect(ctx, x, y, w, h, r);
      ctx.fillStyle = C.COLOR_FLOE;
      ctx.fill();
      // Edge shadow
      ctx.strokeStyle = C.COLOR_FLOE_EDGE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Shine
      ctx.fillStyle = C.COLOR_FLOE_SHINE;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      _roundRect(ctx, x + 4, y + 2, w * 0.4, 3, 2);
      ctx.fill();
      ctx.restore();
    }

    // Draw wrapped ghost if floe is near an edge
    const ghostX = f.speed > 0
      ? (f.x - C.CANVAS_W - f.width)
      : (f.x + C.CANVAS_W + f.width);
    // Only draw ghost if it would be visible
    if (ghostX + f.width > 0 && ghostX < C.CANVAS_W) {
      if (floeImg) {
        ctx.drawImage(floeImg, ghostX, y, w, h);
      } else {
        ctx.save();
        ctx.beginPath();
        _roundRect(ctx, ghostX, y, w, h, r);
        ctx.fillStyle = C.COLOR_FLOE;
        ctx.fill();
        ctx.strokeStyle = C.COLOR_FLOE_EDGE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  // -------------------------------------------------------------------------
  // Penguin
  // -------------------------------------------------------------------------
  function _drawPenguin(ctx, p) {
    if (!p.visible) return;

    ctx.save();
    ctx.globalAlpha = p.opacity;

    const imgKey = _poseToImageKey(p.pose);
    const img    = Assets.get(imgKey);
    const x = p.x;
    const y = p.y;
    const w = C.PENGUIN_W;
    const h = C.PENGUIN_H;

    if (img) {
      ctx.drawImage(img, x, y, w, h);
    } else {
      _drawPlaceholderPenguin(ctx, x, y, w, h, p.pose);
    }

    ctx.restore();
  }

  function _poseToImageKey(pose) {
    switch (pose) {
      case POSE.STAND: return 'penguin_stand';
      case POSE.WALK:  return 'penguin_walk';
      case POSE.JUMP:  return 'penguin_jump';
      case POSE.FALL:  return 'penguin_fall';
      case POSE.WIN:   return 'penguin_win';
      default:         return 'penguin_stand';
    }
  }

  function _drawPlaceholderPenguin(ctx, x, y, w, h, pose) {
    ctx.save();

    // Body
    ctx.fillStyle = C.COLOR_PENGUIN_BODY;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h*0.55, w*0.42, h*0.45, 0, 0, Math.PI*2);
    ctx.fill();

    // Belly
    ctx.fillStyle = C.COLOR_PENGUIN_BELLY;
    ctx.beginPath();
    ctx.ellipse(x + w/2, y + h*0.58, w*0.25, h*0.32, 0, 0, Math.PI*2);
    ctx.fill();

    // Head
    ctx.fillStyle = C.COLOR_PENGUIN_BODY;
    ctx.beginPath();
    ctx.arc(x + w/2, y + h*0.22, w*0.32, 0, Math.PI*2);
    ctx.fill();

    // Eye
    ctx.fillStyle = C.COLOR_PENGUIN_EYE;
    ctx.beginPath();
    ctx.arc(x + w*0.62, y + h*0.19, w*0.08, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(x + w*0.64, y + h*0.19, w*0.04, 0, Math.PI*2);
    ctx.fill();

    // Beak
    ctx.fillStyle = C.COLOR_PENGUIN_BEAK;
    ctx.beginPath();
    ctx.moveTo(x + w*0.72, y + h*0.23);
    ctx.lineTo(x + w*0.88, y + h*0.26);
    ctx.lineTo(x + w*0.72, y + h*0.29);
    ctx.closePath();
    ctx.fill();

    // Feet (vary by pose)
    ctx.fillStyle = C.COLOR_PENGUIN_FEET;
    if (pose === POSE.JUMP || pose === POSE.FALL) {
      // Feet up
      ctx.fillRect(x + w*0.3, y + h*0.88, w*0.18, h*0.08);
      ctx.fillRect(x + w*0.55, y + h*0.88, w*0.18, h*0.08);
    } else {
      ctx.fillRect(x + w*0.22, y + h*0.92, w*0.22, h*0.08);
      ctx.fillRect(x + w*0.56, y + h*0.92, w*0.22, h*0.08);
    }

    // Win pose: little wings up
    if (pose === POSE.WIN) {
      ctx.fillStyle = C.COLOR_PENGUIN_BODY;
      ctx.beginPath();
      ctx.ellipse(x + w*0.1, y + h*0.45, w*0.12, h*0.22, -0.6, 0, Math.PI*2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w*0.9, y + h*0.45, w*0.12, h*0.22, 0.6, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  return { init, draw, getScale };
})();