/**
 * Чувашские узоры из https://github.com/daniilak/chuvash-patterns (CC0 1.0).
 * Координаты: Y вверх → при отрисовке инвертируется.
 */
window.ChuvashPatterns = (() => {
  const DATA = {"version":1,"license":"CC0-1.0","license_url":"https://creativecommons.org/publicdomain/zero/1.0/","source":"https://daniilak.ru/pattern_editor","coordinate_system":{"y_axis":"up","segment":"[[x1, y1], [x2, y2]]","fill":"polygon [[x, y], ...]"},"patterns":{"center":{"id":"center","name":"Ромб","tag":"CENTER","segments":[[[0,2],[-2,4]],[[-2,4],[0,6]],[[0,6],[2,4]],[[2,4],[0,2]]],"compact":true},"center_fill":{"id":"center_fill","name":"Ромб заливка","tag":"CENTER_FILL","segments":[[[0,2],[-2,4]],[[-2,4],[0,6]],[[0,6],[2,4]],[[2,4],[0,2]]],"fills":[[[0,2],[-2,4],[0,6],[2,4]]],"compact":true},"chelovech":{"id":"chelovech","name":"Человечек","tag":"ЧЕЛОВЕЧЕК","segments":[[[4,6],[4,8]],[[4,8],[3,9]],[[3,9],[4,10]],[[4,10],[5,9]],[[5,9],[4,8]],[[4,6],[2,8]],[[2,8],[0,6]],[[0,6],[2,4]],[[2,4],[3,5]],[[3,5],[2,6]],[[4,6],[6,8]],[[6,8],[8,6]],[[8,6],[6,4]],[[6,4],[5,5]],[[5,5],[6,6]],[[4,4],[4,6]],[[4,2],[4,4]],[[4,2],[6,0]],[[6,0],[7,1]],[[7,1],[6,2]],[[4,2],[2,0]],[[2,0],[1,1]],[[1,1],[2,2]]]},"snezhinka1":{"id":"snezhinka1","name":"Кӗскӗ 1","tag":"КӖСКӖ_1","segments":[[[10,18],[9,19]],[[9,19],[10,20]],[[10,20],[11,19]],[[11,19],[10,18]],[[10,16],[8,14]],[[8,14],[6,16]],[[6,16],[8,18]],[[8,18],[9,17]],[[9,17],[8,16]],[[10,16],[12,14]],[[12,14],[14,16]],[[14,16],[12,18]],[[12,18],[11,17]],[[11,17],[12,16]],[[10,16],[10,18]],[[10,6],[9,5]],[[9,5],[10,4]],[[10,4],[11,5]],[[11,5],[10,6]],[[10,8],[8,10]],[[8,10],[6,8]],[[6,8],[8,6]],[[8,6],[9,7]],[[9,7],[8,8]],[[10,8],[12,10]],[[12,10],[14,8]],[[14,8],[12,6]],[[12,6],[11,7]],[[11,7],[12,8]],[[10,8],[10,6]],[[18,10],[19,9]],[[19,9],[20,10]],[[20,10],[19,11]],[[19,11],[18,10]],[[16,10],[14,8]],[[14,8],[16,6]],[[16,6],[18,8]],[[18,8],[17,9]],[[17,9],[16,8]],[[16,10],[14,12]],[[14,12],[16,14]],[[16,14],[18,12]],[[18,12],[17,11]],[[17,11],[16,12]],[[16,10],[18,10]],[[2,10],[1,11]],[[1,11],[0,10]],[[0,10],[1,9]],[[1,9],[2,10]],[[4,10],[6,12]],[[6,12],[4,14]],[[4,14],[2,12]],[[2,12],[3,11]],[[3,11],[4,12]],[[4,10],[6,8]],[[6,8],[4,6]],[[4,6],[2,8]],[[2,8],[3,9]],[[3,9],[4,8]],[[4,10],[2,10]],[[10,14],[9,15]],[[9,15],[10,16]],[[10,16],[11,15]],[[11,15],[10,14]],[[10,12],[8,10]],[[8,10],[6,12]],[[6,12],[8,14]],[[8,14],[9,13]],[[9,13],[8,12]],[[10,12],[12,10]],[[12,10],[14,12]],[[14,12],[12,14]],[[12,14],[11,13]],[[11,13],[12,12]],[[10,12],[10,14]],[[10,2],[9,1]],[[9,1],[10,0]],[[10,0],[11,1]],[[11,1],[10,2]],[[10,4],[8,6]],[[8,6],[6,4]],[[6,4],[8,2]],[[8,2],[9,3]],[[9,3],[8,4]],[[10,4],[12,6]],[[12,6],[14,4]],[[14,4],[12,2]],[[12,2],[11,3]],[[11,3],[12,4]],[[10,4],[10,2]]]},"snezhinka3":{"id":"snezhinka3","name":"Кӗскӗ 3","tag":"КӖСКӖ_3","segments":[[[0,8],[-2,10]],[[-2,10],[-4,8]],[[-4,8],[-2,6]],[[-2,6],[-1,7]],[[-1,7],[-2,8]],[[0,8],[2,10]],[[2,10],[4,8]],[[4,8],[2,6]],[[2,8],[1,7]],[[1,7],[2,6]],[[0,4],[-1,5]],[[-1,5],[0,6]],[[0,6],[1,5]],[[1,5],[0,4]],[[5,3],[7,1]],[[7,1],[5,-1]],[[5,-1],[3,1]],[[3,1],[4,2]],[[4,2],[5,1]],[[5,3],[7,5]],[[7,5],[5,7]],[[5,7],[3,5]],[[5,5],[4,4]],[[4,4],[3,5]],[[1,3],[2,2]],[[2,2],[3,3]],[[3,3],[2,4]],[[2,4],[1,3]],[[-5,3],[-7,1]],[[-7,1],[-5,-1]],[[-5,-1],[-3,1]],[[-3,1],[-4,2]],[[-4,2],[-5,1]],[[-5,3],[-7,5]],[[-7,5],[-5,7]],[[-5,7],[-3,5]],[[-5,5],[-4,4]],[[-4,4],[-3,5]],[[-1,3],[-2,2]],[[-2,2],[-3,3]],[[-3,3],[-2,4]],[[-2,4],[-1,3]],[[0,-2],[-2,-4]],[[-2,-4],[-4,-2]],[[-4,-2],[-2,0]],[[-2,0],[-1,-1]],[[-1,-1],[-2,-2]],[[0,-2],[2,-4]],[[2,-4],[4,-2]],[[4,-2],[2,0]],[[2,-2],[1,-1]],[[1,-1],[2,0]],[[0,2],[-1,1]],[[-1,1],[0,0]],[[0,0],[1,1]],[[1,1],[0,2]]]},"keske_iz_serdtsa":{"id":"keske_iz_serdtsa","name":"Кеске из сердца","tag":"КЕСКЕ_ИЗ_СЕРДЦА","segments":[[[-5,1],[-3,3]],[[-3,3],[-1,5]],[[-5,1],[-7,3]],[[-7,3],[-9,5]],[[-2,4],[0,6]],[[0,6],[-2,8]],[[-2,8],[-4,6]],[[-4,6],[-3,5]],[[-3,5],[-2,6]],[[-8,4],[-10,6]],[[-10,6],[-8,8]],[[-8,8],[-6,6]],[[-8,6],[-7,5]],[[-7,5],[-6,6]],[[-4,0],[-2,-2]],[[-2,-2],[0,-4]],[[-4,0],[-2,2]],[[-2,2],[0,4]],[[-1,-3],[1,-5]],[[1,-5],[3,-3]],[[3,-3],[1,-1]],[[1,-1],[0,-2]],[[0,-2],[1,-3]],[[-1,3],[1,5]],[[1,5],[3,3]],[[3,3],[1,1]],[[1,3],[0,2]],[[0,2],[1,1]],[[-6,0],[-8,-2]],[[-8,-2],[-10,-4]],[[-6,0],[-8,2]],[[-8,2],[-10,4]],[[-9,-3],[-11,-5]],[[-11,-5],[-13,-3]],[[-13,-3],[-11,-1]],[[-11,-1],[-10,-2]],[[-10,-2],[-11,-3]],[[-9,3],[-11,5]],[[-11,5],[-13,3]],[[-13,3],[-11,1]],[[-11,3],[-10,2]],[[-10,2],[-11,1]],[[-5,-1],[-3,-3]],[[-3,-3],[-1,-5]],[[-5,-1],[-7,-3]],[[-7,-3],[-9,-5]],[[-2,-4],[0,-6]],[[0,-6],[-2,-8]],[[-2,-8],[-4,-6]],[[-4,-6],[-3,-5]],[[-3,-5],[-2,-6]],[[-8,-4],[-10,-6]],[[-10,-6],[-8,-8]],[[-8,-8],[-6,-6]],[[-8,-6],[-7,-5]],[[-7,-5],[-6,-6]]]},"zvezda":{"id":"zvezda","name":"Солнце","tag":"СОЛНЦЕ","segments":[[[2,6],[2,8]],[[4,6],[6,8]],[[6,6],[6,8]],[[2,8],[4,6]],[[6,6],[8,6]],[[6,4],[8,2]],[[6,2],[8,2]],[[8,6],[6,4]],[[2,6],[0,6]],[[2,4],[0,2]],[[2,2],[0,2]],[[0,6],[2,4]],[[2,2],[2,0]],[[4,2],[6,0]],[[6,2],[6,0]],[[2,0],[4,2]]]},"serdtse":{"id":"serdtse","name":"Сердце","tag":"СЕРДЦЕ","segments":[[[4,0],[6,2]],[[2,2],[0,4]],[[0,4],[2,6]],[[2,6],[4,4]],[[2,4],[3,3]],[[3,3],[4,4]],[[2,2],[4,0]],[[6,2],[8,4]],[[8,4],[6,6]],[[6,6],[4,4]],[[4,4],[5,3]],[[5,3],[6,4]]]},"tree":{"id":"tree","name":"Дерево","tag":"TREE","segments":[[[0,0],[0,2]],[[0,2],[-2,4]],[[-2,4],[0,6]],[[0,6],[2,4]],[[2,4],[0,2]],[[-2,4],[-4,6]],[[-4,6],[-6,4]],[[-6,4],[-4,2]],[[-4,2],[-3,3]],[[-3,3],[-4,4]],[[2,4],[4,6]],[[4,6],[6,4]],[[6,4],[4,2]],[[4,4],[3,3]],[[3,3],[4,2]],[[0,6],[-2,8]],[[-2,8],[-3,7]],[[-3,7],[-2,6]],[[0,6],[2,8]],[[2,8],[3,7]],[[3,7],[2,6]]]}}};

  function bbox(pat) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const hit = (x, y) => {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    };
    for (const seg of pat.segments || []) {
      hit(seg[0][0], seg[0][1]);
      hit(seg[1][0], seg[1][1]);
    }
    for (const fill of pat.fills || []) {
      for (const pt of fill) hit(pt[0], pt[1]);
    }
    if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1, w: 1, h: 1 };
    return { minX, minY, maxX, maxY, w: maxX - minX || 1, h: maxY - minY || 1 };
  }

  function get(id) {
    return DATA.patterns[id] || null;
  }

  /**
   * Рису узор в ctx. opts: x,y — центр; scale — пикселей на единицу узора;
   * color, fillColor, lineWidth; flipY (default true).
   */
  function draw(ctx, id, opts = {}) {
    const pat = get(id);
    if (!pat) return;
    const b = bbox(pat);
    const scale = opts.scale == null ? 2 : opts.scale;
    const cx = opts.x == null ? 0 : opts.x;
    const cy = opts.y == null ? 0 : opts.y;
    const flipY = opts.flipY !== false;
    const color = opts.color || "#c8d8f0";
    const fillColor = opts.fillColor || color;
    const lw = opts.lineWidth == null ? Math.max(1, scale * 0.35) : opts.lineWidth;
    const ox = (b.minX + b.maxX) / 2;
    const oy = (b.minY + b.maxY) / 2;

    const tx = (x, y) => {
      const px = cx + (x - ox) * scale;
      const py = flipY ? cy - (y - oy) * scale : cy + (y - oy) * scale;
      return [px, py];
    };

    ctx.save();
    for (const fill of pat.fills || []) {
      if (!fill.length) continue;
      ctx.beginPath();
      const [x0, y0] = tx(fill[0][0], fill[0][1]);
      ctx.moveTo(x0, y0);
      for (let i = 1; i < fill.length; i++) {
        const [x, y] = tx(fill[i][0], fill[i][1]);
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = "square";
    ctx.lineJoin = "miter";
    for (const seg of pat.segments || []) {
      const [a, b2] = seg;
      const [x1, y1] = tx(a[0], a[1]);
      const [x2, y2] = tx(b2[0], b2[1]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Растеризация в offscreen canvas (для спрайтов/UI). */
  function raster(id, size, opts = {}) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    if (opts.bg) {
      g.fillStyle = opts.bg;
      g.fillRect(0, 0, size, size);
    }
    const pat = get(id);
    if (!pat) return c;
    const b = bbox(pat);
    const pad = opts.pad == null ? 2 : opts.pad;
    const scale = (size - pad * 2) / Math.max(b.w, b.h);
    draw(g, id, {
      x: size / 2,
      y: size / 2,
      scale,
      color: opts.color || "#e8f0ff",
      fillColor: opts.fillColor || opts.color || "#e8f0ff",
      lineWidth: opts.lineWidth == null ? Math.max(1, scale * 0.4) : opts.lineWidth,
    });
    return c;
  }

  const cache = {};

  function sprite(id, size, opts) {
    const key = id + "|" + size + "|" + JSON.stringify(opts || {});
    if (!cache[key]) cache[key] = raster(id, size, opts);
    return cache[key];
  }

  /** Мелкий орнамент на платье девушки. */
  function decorateGirlSprites(S) {
    if (!S) return;
    const stamp = raster("serdtse", 8, {
      color: "#f0c8d8",
      lineWidth: 1,
    });
    const yokeStamp = raster("center", 6, {
      color: "#e8d090",
      lineWidth: 1,
    });
    function stampOn(cnv, dx, dy, spr) {
      const g = cnv.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(spr, dx, dy);
    }
    [S.girl, S.girlWalkA, S.girlWalkB].forEach((c) => stampOn(c, 4, 8, stamp));
    [S.girlYoke, S.girlYokeWalkA, S.girlYokeWalkB].forEach((c) => {
      stampOn(c, 5, 9, stamp);
      stampOn(c, 2, 8, yokeStamp);
      stampOn(c, 9, 8, yokeStamp);
    });
    if (S.yokeItem) {
      stampOn(S.yokeItem, 5, 5, yokeStamp);
      stampOn(S.yokeItem, 10, 5, yokeStamp);
    }
  }

  function paintMenuFrame(g, w, h) {
    const k = Math.max(1, Math.min(w, h) / 96);
    const m = 8 * k;
    const corner = 14 * k;
    const sc = 1.1 * k;
    const lw = Math.max(1, k);
    g.strokeStyle = "rgba(180,210,255,0.55)";
    g.lineWidth = Math.max(2, 2 * k);
    g.strokeRect(m / 2, m / 2, w - m, h - m);
    const corners = [
      [corner, corner],
      [w - corner, corner],
      [corner, h - corner],
      [w - corner, h - corner],
    ];
    for (const [cx, cy] of corners) {
      draw(g, "snezhinka3", { x: cx, y: cy, scale: sc, color: "#9ec4ff", lineWidth: lw });
    }
    draw(g, "serdtse", {
      x: w / 2,
      y: h - 10 * k,
      scale: 1.2 * k,
      color: "#c8a0b8",
      lineWidth: lw,
    });
  }

  function paintCardOrnament(canvas) {
    const g = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    g.clearRect(0, 0, w, h);
    g.imageSmoothingEnabled = false;
    draw(g, "keske_iz_serdtsa", { x: w / 2, y: h / 2, scale: 2.2, color: "rgba(180,210,255,0.35)", lineWidth: 1.2 });
  }

  return {
    DATA,
    get,
    bbox,
    draw,
    raster,
    sprite,
    decorateGirlSprites,
    paintMenuFrame,
    paintCardOrnament,
    ids: Object.keys(DATA.patterns),
  };
})();
