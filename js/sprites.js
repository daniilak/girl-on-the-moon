/**
 * Minecraft-style pixel textures:
 * each tile = 16×16 pixels of mixed shades (not flat fill).
 * World variation via hash(tx, ty) like block texture noise.
 */
window.Sprites = (() => {
  const T = 16;

  function hash(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return (n ^ (n >> 16)) >>> 0;
  }

  function make(w, h, fn) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    const img = g.createImageData(w, h);
    fn(img.data, w, h);
    g.putImageData(img, 0, 0);
    return c;
  }

  function set(data, w, h, x, y, rgb) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    data[i] = rgb[0];
    data[i + 1] = rgb[1];
    data[i + 2] = rgb[2];
    data[i + 3] = rgb[3] == null ? 255 : rgb[3];
  }

  function mix(a, b, t) {
    return [
      (a[0] + (b[0] - a[0]) * t) | 0,
      (a[1] + (b[1] - a[1]) * t) | 0,
      (a[2] + (b[2] - a[2]) * t) | 0,
    ];
  }

  function shade(base, n) {
    // n in -1..1
    const k = 1 + n * 0.22;
    return [
      Math.max(0, Math.min(255, (base[0] * k) | 0)),
      Math.max(0, Math.min(255, (base[1] * k) | 0)),
      Math.max(0, Math.min(255, (base[2] * k) | 0)),
    ];
  }

  /** Generate one tile texture variant (Minecraft dirt/snow style noise). */
  function tileTex(base, accent, opts = {}) {
    const grain = opts.grain || 0; // vertical wood grain
    const cracks = opts.cracks || false;
    const sparkle = opts.sparkle || false;
    const border = opts.border || null;
    return make(T, T, (data, w, h) => {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const r = ((x * 12 + y * 37) ^ (x * 7)) & 15;
          let n = ((r / 15) * 2 - 1);
          if (grain) {
            n += ((x % 4 === 1) ? -0.35 : 0.1) * grain;
            if (y % 5 === 2) n -= 0.15;
          }
          let col = shade(mix(base, accent, (r > 11 ? 0.55 : r > 7 ? 0.25 : 0.05)), n);
          if (sparkle && r === 14) col = [255, 255, 255];
          if (cracks && ((x + y * 3) % 11 === 0)) col = shade(base, -0.55);
          if (border && (x === 0 || y === 0 || x === w - 1 || y === h - 1) && r > 8) {
            col = border;
          }
          set(data, w, h, x, y, col);
        }
      }
    });
  }

  // —— Terrain atlas (like Minecraft block textures) ——
  const tiles = {
    snow: tileTex([198, 214, 232], [230, 238, 248], { sparkle: true }),
    snow2: tileTex([190, 208, 228], [220, 232, 245], { sparkle: true }),
    path: tileTex([150, 140, 120], [120, 110, 90], { cracks: true }),
    path2: tileTex([160, 148, 125], [110, 100, 82], { cracks: true }),
    wood: tileTex([140, 96, 52], [96, 64, 32], { grain: 1 }),
    woodDark: tileTex([90, 58, 30], [60, 38, 18], { grain: 1 }),
    wall: tileTex([42, 52, 72], [28, 34, 48], { cracks: true }),
    ice: tileTex([170, 220, 245], [220, 240, 255], { sparkle: true }),
    // Brighter animated-looking water variants (old style feel)
    water: tileTex([45, 120, 185], [90, 175, 230]),
    water2: tileTex([55, 140, 200], [110, 195, 245]),
    water3: tileTex([35, 100, 170], [75, 160, 220]),
    moon: tileTex([90, 98, 120], [120, 128, 150], { cracks: true }),
    hole: tileTex([140, 200, 235], [210, 235, 255], { sparkle: true, border: [50, 110, 160] }),
    drift: tileTex([210, 222, 238], [245, 250, 255], { sparkle: true }),
  };

  function tileFor(ch, tx, ty) {
    const v = hash(tx, ty) & 1;
    switch (ch) {
      case ".": return v ? tiles.snow : tiles.snow2;
      case "p": return v ? tiles.path : tiles.path2;
      case "=": return tiles.wood;
      case "H": return tiles.woodDark;
      case "#": return tiles.wall;
      case "~": return tiles.ice;
      case "w": {
        const frame = (hash(tx, ty) + ((performance.now() / 280) | 0)) % 3;
        return frame === 0 ? tiles.water : frame === 1 ? tiles.water2 : tiles.water3;
      }
      case "I": return tiles.hole;
      case "M": return tiles.moon;
      case "T": return v ? tiles.snow : tiles.snow2;
      case "F": return tiles.wood;
      case "B":
      case "D":
        return tiles.drift;
      default: return tiles.snow;
    }
  }

  // —— Character sprites (pixel-drawn, not blobs) ——
  function sprite(w, h, pixels) {
    // pixels: array of [x,y,w,h,color]
    return make(w, h, (data, W) => {
      // transparent
      for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
      for (const [x, y, pw, ph, c] of pixels) {
        for (let yy = y; yy < y + ph; yy++)
          for (let xx = x; xx < x + pw; xx++)
            set(data, W, h, xx, yy, c);
      }
    });
  }

  const C = {
    hair: [45, 32, 28],
    hair2: [30, 20, 16],
    skin: [240, 198, 168],
    skin2: [220, 170, 140],
    dress: [190, 75, 110],
    dress2: [150, 50, 85],
    boot: [40, 30, 28],
    eye: [25, 18, 16],
    yoke: [130, 85, 45],
    yoke2: [100, 65, 30],
    bucket: [90, 105, 125],
    bucket2: [70, 85, 105],
    witchH: [35, 25, 50],
    witchB: [55, 40, 70],
    witchEye: [220, 50, 50],
    momH: [25, 22, 35],
    momD: [70, 45, 95],
    momS: [190, 165, 145],
  };

  function girlPixels(leg, yoke) {
    const L = leg || 0; // -1 | 0 | 1 foot shift
    const body = [
      [5, 1, 6, 3, C.hair], [4, 2, 1, 2, C.hair2], [11, 2, 1, 2, C.hair2],
      [6, 3, 4, 4, C.skin], [6, 6, 4, 1, C.skin2],
      [7, 4, 1, 1, C.eye], [9, 4, 1, 1, C.eye],
      [5, 7, 6, 5, C.dress], [4, 8, 1, 3, C.dress2], [11, 8, 1, 3, C.dress2],
      [6, 12, 4, 1, C.dress2],
      [5 + (L < 0 ? -1 : 0), 13, 2, 3, C.boot],
      [9 + (L > 0 ? 1 : 0), 13, 2, 3, C.boot],
    ];
    if (yoke) {
      body.push(
        [1, 8, 14, 2, C.yoke], [1, 9, 14, 1, C.yoke2],
        [0, 9, 4, 4, C.bucket], [1, 10, 2, 2, C.bucket2],
        [12, 9, 4, 4, C.bucket], [13, 10, 2, 2, C.bucket2]
      );
    }
    return body;
  }

  const girl = sprite(16, 16, girlPixels(0, false));
  const girlWalkA = sprite(16, 16, girlPixels(-1, false));
  const girlWalkB = sprite(16, 16, girlPixels(1, false));
  const girlYoke = sprite(16, 16, girlPixels(0, true));
  const girlYokeWalkA = sprite(16, 16, girlPixels(-1, true));
  const girlYokeWalkB = sprite(16, 16, girlPixels(1, true));

  const stepmom = sprite(16, 16, [
    [4, 0, 8, 4, C.momH], [3, 2, 1, 2, C.momH], [12, 2, 1, 2, C.momH],
    [5, 4, 6, 3, C.momS], [6, 5, 1, 1, C.witchEye], [9, 5, 1, 1, C.witchEye],
    [4, 7, 8, 6, C.momD], [3, 8, 1, 4, C.momD], [12, 8, 1, 4, C.momD],
    [4, 14, 3, 2, C.boot], [9, 14, 3, 2, C.boot],
  ]);

  const witch = sprite(16, 16, [
    [7, 0, 2, 1, C.witchH], [5, 1, 6, 1, C.witchH], [3, 2, 10, 2, C.witchH],
    [2, 4, 12, 1, C.witchH],
    [5, 5, 6, 2, C.momS], [6, 6, 1, 1, C.witchEye], [9, 6, 1, 1, C.witchEye],
    [4, 7, 8, 5, C.witchB], [3, 8, 1, 3, C.witchB], [12, 8, 1, 3, C.witchB],
    [4, 13, 3, 3, C.boot], [9, 13, 3, 3, C.boot],
  ]);

  const yokeItem = sprite(16, 16, [
    [1, 6, 14, 2, C.yoke], [1, 7, 14, 1, C.yoke2],
    [0, 8, 5, 5, C.bucket], [1, 9, 3, 3, C.bucket2],
    [11, 8, 5, 5, C.bucket], [12, 9, 3, 3, C.bucket2],
  ]);

  const tree = make(16, 24, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    // trunk like Minecraft oak log
    for (let y = 14; y < 24; y++)
      for (let x = 6; x < 10; x++) {
        const n = ((x + y) % 3 === 0) ? -0.2 : 0.1;
        set(data, w, h, x, y, shade([110, 75, 40], n));
      }
    // leaves cluster
    const leaves = [
      [2, 4, 12, 10], [1, 6, 14, 6], [4, 1, 8, 6], [3, 8, 10, 6],
    ];
    for (const [lx, ly, lw, lh] of leaves) {
      for (let y = ly; y < ly + lh; y++)
        for (let x = lx; x < lx + lw; x++) {
          if ((x - 8) * (x - 8) + (y - 8) * (y - 8) > 55) continue;
          const r = (x * 3 + y * 5) & 7;
          const base = r > 5 ? [35, 90, 45] : r > 2 ? [45, 110, 55] : [28, 75, 38];
          set(data, w, h, x, y, base);
        }
    }
  });

  // маленький язычок огня (без анимации в спрайте)
  const fire = make(8, 8, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    const px = [
      [3, 6, 2, 2, [90, 50, 25]],
      [2, 3, 4, 4, [230, 110, 35]],
      [3, 2, 2, 3, [255, 190, 70]],
      [3, 1, 2, 1, [255, 240, 160]],
    ];
    for (const [x, y, pw, ph, c] of px)
      for (let yy = y; yy < y + ph; yy++)
        for (let xx = x; xx < x + pw; xx++) set(data, w, h, xx, yy, c);
  });

  // русская печь: белёный корпус, устье, один огонь по центру
  const pech = make(28, 24, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    // основание / лежанка
    for (let y = 14; y < 24; y++)
      for (let x = 1; x < 27; x++) {
        const n = (x % 5 === 0 ? -0.12 : 0.05) + (y === 14 ? -0.15 : 0);
        set(data, w, h, x, y, shade([210, 200, 175], n));
      }
    // свод / верх
    for (let y = 2; y < 15; y++)
      for (let x = 3; x < 25; x++) {
        if (y < 6 && (x < 6 || x > 21)) continue;
        const n = ((x + y) & 3) ? 0.05 : -0.08;
        set(data, w, h, x, y, shade([225, 215, 190], n));
      }
    // труба
    for (let y = 0; y < 6; y++)
      for (let x = 18; x < 24; x++) set(data, w, h, x, y, shade([160, 90, 70], (x + y) & 1 ? -0.1 : 0.1));
    // устье (тёмное)
    for (let y = 10; y < 18; y++)
      for (let x = 8; x < 16; x++) {
        const cx = Math.abs(x - 11.5);
        const cy = Math.abs(y - 13.5);
        if (cx * cx + cy * cy > 18) continue;
        set(data, w, h, x, y, [35, 25, 18]);
      }
    // один огонь в центре устья
    for (let y = 12; y < 17; y++)
      for (let x = 10; x < 14; x++) {
        if (Math.abs(x - 11.5) + Math.abs(y - 14.5) > 3) continue;
        set(data, w, h, x, y, y < 14 ? [255, 200, 80] : [230, 100, 40]);
      }
    set(data, w, h, 11, 11, [255, 240, 170]);
    set(data, w, h, 12, 12, [255, 220, 100]);
    // деревянная заслонка / полка снизу устья
    for (let y = 17; y < 19; y++)
      for (let x = 7; x < 17; x++) set(data, w, h, x, y, shade([120, 80, 45], (x % 2) ? -0.1 : 0.1));
  });

  const house = make(48, 40, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    // крыша остриём вверх (узко сверху, широко у стен)
    for (let y = 0; y < 16; y++) {
      const half = ((y + 1) * 48) / 16 / 2;
      for (let x = (24 - half) | 0; x < (24 + half) | 0; x++) {
        set(data, w, h, x, y, shade([130, 50, 45], ((x + y) & 3) ? -0.1 : 0.15));
      }
    }
    for (let y = 16; y < 40; y++)
      for (let x = 4; x < 44; x++) {
        const n = ((x % 4 === 0) ? -0.25 : 0) + ((y % 5 === 0) ? -0.1 : 0.05);
        set(data, w, h, x, y, shade([150, 105, 60], n));
      }
    for (let y = 24; y < 40; y++)
      for (let x = 20; x < 28; x++) set(data, w, h, x, y, shade([55, 35, 22], ((x + y) & 1) ? -0.1 : 0));
    // своя изба — окна ещё светятся
    for (let y = 22; y < 30; y++)
      for (let x of [8, 9, 10, 11, 12, 13, 34, 35, 36, 37, 38, 39])
        set(data, w, h, x, y, [230, 190, 90]);
  });

  // силуэт девушки на луне (без диска - диск рисуется отдельно)
  const moonGirl = make(24, 24, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    const sil = [35, 40, 58];
    for (const [x, y, pw, ph, c] of [
      [9, 2, 6, 3, sil],
      [10, 5, 4, 3, [200, 170, 140]],
      [8, 8, 8, 8, sil],
      [1, 10, 22, 2, [85, 65, 40]],
      [0, 11, 4, 4, [65, 75, 90]],
      [20, 11, 4, 4, [65, 75, 90]],
      [9, 16, 2, 5, sil],
      [13, 16, 2, 5, sil],
    ]) {
      for (let yy = y; yy < y + ph; yy++)
        for (let xx = x; xx < x + pw; xx++) set(data, w, h, xx, yy, c);
    }
  });

  // Big sky moon (craters, glow edge)
  const bigMoon = make(48, 48, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        const d = (x - 24) * (x - 24) + (y - 24) * (y - 24);
        if (d > 484) continue;
        let col = shade([235, 240, 250], ((x * 3 + y * 5) & 7) / 20 - 0.05);
        if (d > 420) col = [210, 220, 240];
        if ((x - 16) * (x - 16) + (y - 18) * (y - 18) < 28) col = [200, 208, 222];
        if ((x - 30) * (x - 30) + (y - 28) * (y - 28) < 18) col = [195, 205, 220];
        if ((x - 22) * (x - 22) + (y - 32) * (y - 32) < 12) col = [190, 198, 215];
        set(data, w, h, x, y, col);
      }
  });

  function prop(pixels, w = 16, h = 16) {
    return sprite(w, h, pixels);
  }

  const well = prop([
    [3, 4, 10, 8, [90, 95, 110]], [4, 5, 8, 6, [55, 70, 95]],
    [2, 3, 12, 2, [120, 100, 70]], [6, 1, 4, 3, [100, 80, 55]],
    [5, 11, 6, 3, [80, 70, 55]],
  ]);
  const bench = prop([
    // лавка: сиденье, спинка, четыре ножки
    [1, 7, 14, 2, [150, 105, 60]],
    [1, 6, 14, 1, [170, 125, 75]],
    [1, 4, 14, 2, [140, 95, 55]],
    [2, 9, 2, 5, [100, 70, 40]], [12, 9, 2, 5, [100, 70, 40]],
    [5, 9, 2, 4, [90, 60, 35]], [9, 9, 2, 4, [90, 60, 35]],
  ]);
  const hay = prop([
    // стог: купол сена
    [4, 2, 8, 3, [210, 185, 80]],
    [2, 5, 12, 4, [200, 170, 70]],
    [1, 9, 14, 5, [185, 155, 60]],
    [3, 7, 2, 1, [160, 130, 45]], [10, 8, 2, 1, [160, 130, 45]],
    [6, 11, 4, 1, [140, 110, 40]],
    [7, 1, 2, 2, [120, 90, 40]],
  ]);
  const barrel = prop([
    [4, 3, 8, 11, [130, 80, 40]], [5, 4, 6, 2, [90, 55, 25]],
    [5, 8, 6, 2, [90, 55, 25]], [5, 12, 6, 1, [90, 55, 25]],
    [3, 5, 1, 7, [110, 70, 35]], [12, 5, 1, 7, [110, 70, 35]],
  ]);
  const rock = prop([
    [3, 8, 10, 5, [110, 115, 125]], [5, 6, 7, 3, [130, 135, 145]],
    [6, 9, 2, 1, [90, 95, 105]],
  ]);
  const lantern = prop([
    [7, 1, 2, 3, [80, 70, 50]], [5, 4, 6, 7, [200, 160, 60]],
    [6, 5, 4, 5, [255, 220, 100]], [6, 11, 4, 2, [70, 60, 45]],
  ]);
  const sled = prop([
    // санки: полозья + сиденье + спинка
    [1, 12, 14, 2, [90, 95, 110]],
    [2, 11, 12, 1, [70, 75, 90]],
    [3, 7, 10, 4, [160, 110, 60]],
    [3, 6, 10, 1, [180, 130, 75]],
    [3, 4, 2, 3, [140, 95, 50]], [11, 4, 2, 3, [140, 95, 50]],
    [4, 3, 8, 1, [150, 105, 55]],
  ]);
  const scarecrow = prop([
    [7, 1, 2, 10, [120, 85, 45]], [4, 3, 8, 5, [180, 70, 60]],
    [5, 1, 6, 3, [200, 180, 100]], [6, 2, 1, 1, [30, 20, 20]], [9, 2, 1, 1, [30, 20, 20]],
    [3, 5, 2, 1, [120, 85, 45]], [11, 5, 2, 1, [120, 85, 45]],
  ]);
  const cart = prop([
    // телега: кузов, оглобли, колёса со спицами
    [4, 4, 10, 6, [140, 95, 55]],
    [4, 3, 10, 1, [160, 115, 70]],
    [2, 6, 2, 2, [120, 80, 45]],
    [0, 7, 4, 1, [110, 75, 40]],
    [3, 10, 4, 4, [55, 55, 65]], [11, 10, 4, 4, [55, 55, 65]],
    [4, 11, 2, 2, [90, 90, 100]], [12, 11, 2, 2, [90, 90, 100]],
    [5, 9, 1, 1, [40, 40, 48]], [13, 9, 1, 1, [40, 40, 48]],
  ]);
  const fence = prop([
    [1, 4, 2, 10, [110, 80, 45]], [7, 4, 2, 10, [110, 80, 45]],
    [13, 4, 2, 10, [110, 80, 45]], [1, 6, 14, 2, [130, 95, 55]],
    [1, 10, 14, 2, [130, 95, 55]],
  ]);
  const doghouse = prop([
    [2, 4, 12, 3, [140, 60, 50]], [3, 7, 10, 7, [160, 110, 60]],
    [6, 9, 4, 5, [40, 30, 25]],
  ]);
  const firewood = prop([
    // поленница: штабель круглых поленьев
    [1, 11, 14, 3, [100, 70, 40]],
    [2, 8, 4, 3, [130, 90, 50]], [7, 8, 4, 3, [120, 80, 45]], [12, 8, 3, 3, [125, 85, 48]],
    [3, 5, 4, 3, [140, 100, 55]], [8, 5, 4, 3, [135, 95, 52]],
    [5, 3, 4, 2, [150, 110, 60]],
    [3, 9, 1, 1, [70, 45, 25]], [9, 6, 1, 1, [70, 45, 25]], [13, 9, 1, 1, [70, 45, 25]],
  ]);
  const bush = prop([
    [3, 6, 10, 8, [40, 90, 50]], [2, 8, 12, 5, [35, 80, 45]],
    [5, 5, 6, 3, [50, 105, 60]], [4, 7, 2, 1, [230, 235, 245]], [10, 9, 2, 1, [230, 235, 245]],
  ]);
  const stump = prop([
    [4, 8, 8, 5, [110, 75, 40]], [5, 6, 6, 3, [140, 100, 55]],
    [11, 5, 3, 8, [90, 90, 100]],
  ]);
  const snowman = prop([
    [5, 9, 6, 5, [230, 235, 245]], [6, 5, 4, 4, [230, 235, 245]],
    [7, 6, 1, 1, [30, 20, 20]], [9, 6, 1, 1, [30, 20, 20]],
    [7, 2, 2, 3, [40, 30, 25]], [8, 8, 1, 1, [230, 120, 40]],
  ]);
  // чугунный горшок на ножках, с дужкой
  const pot = prop([
    [6, 2, 1, 3, [70, 70, 80]], [9, 2, 1, 3, [70, 70, 80]],
    [6, 1, 4, 1, [80, 80, 90]],
    [4, 5, 8, 2, [55, 50, 48]],
    [3, 7, 10, 5, [70, 65, 60]],
    [4, 12, 8, 2, [50, 45, 42]],
    [4, 14, 2, 2, [45, 40, 38]], [10, 14, 2, 2, [45, 40, 38]],
    [5, 8, 6, 3, [40, 35, 32]],
    [5, 6, 2, 1, [120, 110, 90]],
  ]);
  const sign = prop([
    [7, 4, 2, 10, [110, 80, 45]], [2, 3, 12, 6, [150, 120, 70]],
    [4, 5, 8, 1, [40, 35, 30]], [4, 7, 6, 1, [40, 35, 30]],
  ]);
  const cross = prop([
    [7, 2, 2, 12, [180, 175, 160]], [4, 5, 8, 2, [180, 175, 160]],
  ]);
  const crate = prop([
    [3, 5, 10, 9, [150, 110, 60]], [4, 6, 8, 2, [100, 70, 35]],
    [4, 10, 8, 2, [100, 70, 35]], [3, 5, 10, 1, [170, 130, 75]],
  ]);
  const mittens = prop([
    [2, 6, 5, 6, [180, 55, 70]], [3, 7, 3, 4, [210, 90, 100]],
    [9, 6, 5, 6, [180, 55, 70]], [10, 7, 3, 4, [210, 90, 100]],
    [3, 5, 3, 2, [140, 40, 55]], [10, 5, 3, 2, [140, 40, 55]],
  ]);
  const snowdrift = make(16, 16, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    for (let y = 4; y < 15; y++)
      for (let x = 1; x < 15; x++) {
        const cy = 14 - (y - 4);
        const half = 2 + ((cy * 6) / 10);
        if (Math.abs(x - 8) > half) continue;
        const n = ((x * 3 + y * 5) & 7) / 14;
        set(data, w, h, x, y, shade([225, 235, 248], n - 0.05));
        if (y === 5 && (x & 2) === 0) set(data, w, h, x, y, [255, 255, 255]);
      }
  });

  // дверь избы (вид сверху / торец)
  const door = prop([
    [2, 2, 12, 12, [90, 55, 30]],
    [3, 3, 10, 10, [120, 75, 40]],
    [4, 4, 8, 8, [100, 65, 35]],
    [11, 7, 2, 2, [200, 180, 80]],
    [2, 2, 12, 1, [60, 35, 18]],
    [2, 13, 12, 1, [60, 35, 18]],
  ]);

  // амулет на боковой тропе
  const amulet = prop([
    [6, 2, 4, 2, [180, 160, 60]],
    [5, 4, 6, 6, [90, 140, 200]],
    [7, 6, 2, 2, [220, 230, 255]],
    [6, 10, 4, 3, [160, 140, 50]],
  ]);

  // портреты для диалогов (24×24)
  function portrait(basePixels) {
    return sprite(24, 24, basePixels);
  }
  const portraitGirl = portrait([
    [8, 2, 8, 4, C.hair], [7, 3, 1, 3, C.hair2], [16, 3, 1, 3, C.hair2],
    [9, 5, 6, 6, C.skin], [10, 7, 1, 1, C.eye], [13, 7, 1, 1, C.eye],
    [8, 11, 8, 8, C.dress], [7, 12, 1, 5, C.dress2], [16, 12, 1, 5, C.dress2],
  ]);
  const portraitMom = portrait([
    [7, 1, 10, 5, C.momH], [6, 3, 1, 3, C.momH], [17, 3, 1, 3, C.momH],
    [9, 6, 6, 4, C.momS], [10, 8, 1, 1, C.witchEye], [13, 8, 1, 1, C.witchEye],
    [7, 10, 10, 9, C.momD],
  ]);
  const portraitWitch = portrait([
    [10, 0, 4, 2, C.witchH], [7, 2, 10, 3, C.witchH], [5, 5, 14, 2, C.witchH],
    [9, 7, 6, 3, C.momS], [10, 8, 1, 1, C.witchEye], [13, 8, 1, 1, C.witchEye],
    [7, 10, 10, 8, C.witchB],
  ]);
  const portraitNarrator = portrait([
    [4, 4, 16, 16, [40, 50, 70]],
    [8, 8, 8, 8, [180, 200, 230]],
    [10, 10, 4, 4, [220, 230, 250]],
  ]);
  const portraitMoon = portrait([
    [4, 4, 16, 16, [200, 210, 230]],
    [6, 6, 4, 4, [170, 180, 200]],
    [14, 12, 3, 3, [165, 175, 195]],
  ]);
  const portraitHint = portrait([
    [8, 4, 8, 12, [70, 120, 180]],
    [10, 6, 4, 4, [230, 240, 255]],
    [10, 12, 4, 2, [230, 240, 255]],
  ]);

  const houseSmall = make(36, 32, (data, w, h) => {
    for (let i = 0; i < data.length; i += 4) data[i + 3] = 0;
    // крыша остриём вверх
    for (let y = 0; y < 12; y++) {
      const half = ((y + 1) * 36) / 12 / 2;
      for (let x = (18 - half) | 0; x < (18 + half) | 0; x++)
        set(data, w, h, x, y, shade([110, 55, 50], ((x + y) & 3) ? -0.1 : 0.1));
    }
    for (let y = 12; y < 32; y++)
      for (let x = 3; x < 33; x++) {
        const n = (x % 4 === 0 ? -0.2 : 0.05);
        set(data, w, h, x, y, shade([145, 100, 58], n));
      }
    for (let y = 18; y < 32; y++)
      for (let x = 15; x < 21; x++) set(data, w, h, x, y, shade([50, 32, 20], 0));
    // чужие дома — тёмные окна (все спят)
    for (let y = 16; y < 22; y++)
      for (let x of [6, 7, 8, 9, 26, 27, 28, 29])
        set(data, w, h, x, y, [35, 40, 55]);
  });

  return {
    T,
    tiles,
    tileFor,
    girl,
    girlWalkA,
    girlWalkB,
    girlYoke,
    girlYokeWalkA,
    girlYokeWalkB,
    stepmom,
    witch,
    yokeItem,
    tree,
    fire,
    pech,
    house,
    houseSmall,
    moonGirl,
    bigMoon,
    well,
    bench,
    hay,
    barrel,
    rock,
    lantern,
    sled,
    scarecrow,
    cart,
    fence,
    doghouse,
    firewood,
    bush,
    stump,
    snowman,
    pot,
    sign,
    cross,
    crate,
    mittens,
    snowdrift,
    door,
    amulet,
    portraitGirl,
    portraitMom,
    portraitWitch,
    portraitNarrator,
    portraitMoon,
    portraitHint,
  };
})();
