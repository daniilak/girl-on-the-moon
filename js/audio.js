/**
 * Procedural SFX + ambient music via Web Audio API.
 */
window.AudioSFX = (() => {
  let ctxA = null;
  let master = null;
  let sfxGain = null;
  let musicGain = null;
  let stepT = 0;
  let fearOsc = null;
  let fearGain = null;
  let musicNodes = [];
  let musicMode = "off"; // off | night | chase | moon
  let musicTimer = null;

  function settings() {
    return window.GameSettings ? window.GameSettings.get() : { master: 0.7, music: 0.45, sfx: 1, mute: false };
  }

  function applyGains() {
    if (!master) return;
    const s = settings();
    const m = s.mute ? 0 : s.master;
    master.gain.value = 0.22 * m;
    if (sfxGain) sfxGain.gain.value = s.sfx;
    if (musicGain) musicGain.gain.value = s.music * 0.55;
  }

  function ensure() {
    if (ctxA) {
      applyGains();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctxA = new AC();
    master = ctxA.createGain();
    sfxGain = ctxA.createGain();
    musicGain = ctxA.createGain();
    sfxGain.connect(master);
    musicGain.connect(master);
    master.connect(ctxA.destination);
    applyGains();
    return true;
  }

  function resume() {
    if (!ensure()) return;
    if (ctxA.state === "suspended") ctxA.resume();
  }

  function tone(freq, dur, type, vol, slide) {
    if (!ensure()) return;
    const t0 = ctxA.currentTime;
    const o = ctxA.createOscillator();
    const g = ctxA.createGain();
    o.type = type || "square";
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t0 + dur);
    g.gain.setValueAtTime(vol == null ? 0.12 : vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g);
    g.connect(sfxGain);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol, hp) {
    if (!ensure()) return;
    const n = Math.max(1, (ctxA.sampleRate * dur) | 0);
    const buf = ctxA.createBuffer(1, n, ctxA.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctxA.createBufferSource();
    src.buffer = buf;
    const g = ctxA.createGain();
    g.gain.value = vol == null ? 0.08 : vol;
    let node = src;
    if (hp) {
      const f = ctxA.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp;
      src.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(sfxGain);
    src.start();
  }

  function stopMusicNodes() {
    for (const n of musicNodes) {
      try {
        if (n.stop) n.stop();
        if (n.disconnect) n.disconnect();
      } catch (_) {}
    }
    musicNodes = [];
    if (musicTimer) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function startPad(freqs, type, vol, filterFreq) {
    if (!ensure()) return;
    const t0 = ctxA.currentTime;
    const filter = ctxA.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq || 600;
    filter.connect(musicGain);
    musicNodes.push(filter);
    for (const f of freqs) {
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.type = type || "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 1.2);
      o.connect(g);
      g.connect(filter);
      o.start(t0);
      musicNodes.push(o, g);
    }
  }

  function scheduleMelody(notes, intervalMs, type, vol) {
    let i = 0;
    musicTimer = setInterval(() => {
      if (!ctxA || settings().mute) return;
      const note = notes[i % notes.length];
      i++;
      if (!note) return;
      const t0 = ctxA.currentTime;
      const o = ctxA.createOscillator();
      const g = ctxA.createGain();
      o.type = type || "triangle";
      o.frequency.value = note;
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.45);
      o.connect(g);
      g.connect(musicGain);
      o.start(t0);
      o.stop(t0 + 0.5);
    }, intervalMs);
  }

  function setMusic(mode) {
    if (mode === musicMode) {
      applyGains();
      return;
    }
    musicMode = mode;
    stopMusicNodes();
    if (mode === "off" || !ensure()) return;
    if (mode === "night") {
      startPad([110, 164.81, 220], "sine", 0.035, 480);
      scheduleMelody([220, 0, 246.94, 0, 196, 0, 164.81, 0], 900, "sine", 0.028);
    } else if (mode === "chase") {
      startPad([55, 82.5, 110], "sawtooth", 0.03, 350);
      scheduleMelody([110, 130.81, 98, 146.83, 82.41, 123.47], 420, "square", 0.022);
    } else if (mode === "moon") {
      startPad([174.61, 220, 261.63], "sine", 0.04, 900);
      scheduleMelody([349.23, 0, 392, 0, 440, 0, 392, 0], 1100, "triangle", 0.035);
    } else if (mode === "izba") {
      startPad([98, 146.83], "triangle", 0.025, 400);
      scheduleMelody([196, 0, 220, 0, 174.61, 0], 1200, "sine", 0.02);
    }
    applyGains();
  }

  return {
    resume,
    applyGains,
    setMusic,
    stopMusic() {
      setMusic("off");
    },
    step(moving, dt) {
      if (!moving) {
        stepT = 0;
        return;
      }
      stepT -= dt;
      if (stepT > 0) return;
      stepT = 0.28;
      noise(0.04, 0.045, 800);
      tone(90 + Math.random() * 30, 0.05, "triangle", 0.04);
    },
    interact() {
      tone(520, 0.07, "square", 0.08);
      tone(780, 0.09, "sine", 0.05);
    },
    dash() {
      noise(0.08, 0.1, 400);
      tone(180, 0.12, "sawtooth", 0.07, 60);
    },
    dlg() {
      tone(340, 0.04, "square", 0.05);
    },
    scoop() {
      noise(0.12, 0.09, 200);
      tone(220, 0.15, "sine", 0.08, 140);
    },
    witches() {
      tone(110, 0.35, "sawtooth", 0.1, 55);
      tone(165, 0.4, "square", 0.06, 80);
      setTimeout(() => tone(90, 0.25, "triangle", 0.08), 120);
    },
    fearOn(on) {
      if (!ensure()) return;
      if (on) {
        if (fearOsc) return;
        fearOsc = ctxA.createOscillator();
        fearGain = ctxA.createGain();
        fearOsc.type = "sine";
        fearOsc.frequency.value = 55;
        fearGain.gain.value = 0.04;
        fearOsc.connect(fearGain);
        fearGain.connect(sfxGain);
        fearOsc.start();
      } else if (fearOsc) {
        try {
          fearOsc.stop();
        } catch (_) {}
        fearOsc = null;
        fearGain = null;
      }
    },
    catch() {
      noise(0.15, 0.12, 100);
      tone(70, 0.2, "sawtooth", 0.1, 40);
    },
    safe() {
      tone(440, 0.15, "sine", 0.08);
      tone(660, 0.2, "sine", 0.06);
    },
    ascend() {
      tone(220, 0.8, "sine", 0.1, 880);
      setTimeout(() => tone(330, 1.0, "triangle", 0.08, 990), 200);
    },
    fade() {
      tone(160, 0.2, "sine", 0.04, 80);
    },
    pray() {
      tone(300, 0.1, "sine", 0.05);
      tone(450, 0.12, "triangle", 0.04);
    },
    wind() {
      noise(0.35, 0.035, 120);
    },
  };
})();
