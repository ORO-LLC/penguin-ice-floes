
/**
 * assets.js — asset loader with placeholder fallback
 * All images and audio are optional; the game runs with placeholders.
 */
'use strict';

const Assets = (() => {
  const images = {};
  const audio  = {};
  let _loaded  = false;

  const IMAGE_MANIFEST = [
    { key: 'penguin_stand', src: 'assets/images/penguin_stand.png' },
    { key: 'penguin_walk',  src: 'assets/images/penguin_walk.png'  },
    { key: 'penguin_jump',  src: 'assets/images/penguin_jump.png'  },
    { key: 'penguin_fall',  src: 'assets/images/penguin_fall.png'  },
    { key: 'penguin_win',   src: 'assets/images/penguin_win.png'   },
    { key: 'floe',          src: 'assets/images/floe.png'          },
    { key: 'family',        src: 'assets/images/family.png'        },
    { key: 'bg',            src: 'assets/images/bg.png'            },
  ];

  const AUDIO_MANIFEST = [
    { key: 'jump',   src: 'assets/audio/jump.mp3'   },
    { key: 'land',   src: 'assets/audio/land.mp3'   },
    { key: 'splash', src: 'assets/audio/splash.mp3' },
    { key: 'win',    src: 'assets/audio/win.mp3'    },
    { key: 'tick',   src: 'assets/audio/tick.mp3'   },
  ];

  function loadImages() {
    return IMAGE_MANIFEST.map(({ key, src }) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => { images[key] = img; resolve(); };
        img.onerror = () => { images[key] = null; resolve(); }; // graceful fallback
        img.src = src;
      })
    );
  }

  function loadAudio() {
    return AUDIO_MANIFEST.map(({ key, src }) =>
      new Promise(resolve => {
        const a = new Audio();
        a.oncanplaythrough = () => { audio[key] = a; resolve(); };
        a.onerror          = () => { audio[key] = null; resolve(); };
        // Some browsers block audio until user gesture — that's fine
        a.src = src;
        // Resolve after short timeout even if audio never loads
        setTimeout(resolve, 2000);
      })
    );
  }

  function load() {
    return Promise.all([...loadImages(), ...loadAudio()])
      .then(() => { _loaded = true; });
  }

  function get(key) {
    return images[key] || null;
  }

  function playSound(key) {
    const a = audio[key];
    if (!a) return;
    try {
      const clone = a.cloneNode();
      clone.volume = 0.6;
      clone.play().catch(() => {});
    } catch (e) {}
  }

  function isLoaded() { return _loaded; }

  return { load, get, playSound, isLoaded };
})();