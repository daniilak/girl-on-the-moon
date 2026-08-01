(() => {
  "use strict";

  const L = window.LEVELS;
  const T = L.T;
  const ACTS = L.ACTS;
  const POS = L.POS;
  const DRIFT = POS.DRIFT;
  const DRIFT2 = POS.DRIFT2;
  const HOLE_POS = POS.HOLE;
  const ALTAR_POS = POS.ALTAR;
  const MITTENS_POS = POS.MITTENS;
  const BUCKETS_NEED = 2;
  const PRAY_NEED = 2.2;
  const AudioSFX = window.AudioSFX;
  const Settings = window.GameSettings;
  const S = window.Sprites;
  const CP = window.ChuvashPatterns;

  // вышивка на платье / коромысле
  if (CP) CP.decorateGirlSprites(S);

  const patternSprites = {
    amulet: CP
      ? CP.raster("keske_iz_serdtsa", 16, { color: "#a8d0ff", lineWidth: 1.1 })
      : S.amulet,
    altarSun: CP ? CP.raster("zvezda", 20, { color: "#dce8ff", lineWidth: 1.2 }) : null,
    altarHeart: CP ? CP.raster("serdtse", 14, { color: "#c8b0d8", lineWidth: 1 }) : null,
    carpet: CP
      ? CP.raster("center_fill", 16, {
          color: "#8a5040",
          fillColor: "#a06048",
          lineWidth: 1,
        })
      : null,
    wall: CP
      ? CP.raster("snezhinka1", 28, { color: "#c8a878", lineWidth: 1 })
      : null,
  };

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ui = {
    objective: document.getElementById("objective"),
    fearWrap: document.getElementById("fearWrap"),
    fearFill: document.getElementById("fearFill"),
    prayWrap: document.getElementById("prayWrap"),
    prayFill: document.getElementById("prayFill"),
    bucketWrap: document.getElementById("bucketWrap"),
    bucketCount: document.getElementById("bucketCount"),
    prompt: document.getElementById("prompt"),
    dialogue: document.getElementById("dialogue"),
    dlgSpeaker: document.getElementById("dlgSpeaker"),
    dlgText: document.getElementById("dlgText"),
    dlgNext: document.getElementById("dlgNext"),
    dlgPortrait: document.getElementById("dlgPortrait"),
    menu: document.getElementById("menu"),
    pause: document.getElementById("pause"),
    settings: document.getElementById("settings"),
    credits: document.getElementById("credits"),
    creditsText: document.getElementById("creditsText"),
    btnNew: document.getElementById("btnNew"),
    btnContinue: document.getElementById("btnContinue"),
    btnMenu: document.getElementById("btnMenu"),
    btnPause: document.getElementById("btnPause"),
    btnResume: document.getElementById("btnResume"),
    btnPauseMenu: document.getElementById("btnPauseMenu"),
    btnSettings: document.getElementById("btnSettings"),
    btnPauseSettings: document.getElementById("btnPauseSettings"),
    btnSettingsBack: document.getElementById("btnSettingsBack"),
    btnAct: document.getElementById("btnAct"),
    btnDash: document.getElementById("btnDash"),
    menuArt: document.getElementById("menuArt"),
    dpad: document.getElementById("dpad"),
    setMaster: document.getElementById("setMaster"),
    setMusic: document.getElementById("setMusic"),
    setSfx: document.getElementById("setSfx"),
    setMute: document.getElementById("setMute"),
    setVibrate: document.getElementById("setVibrate"),
    setSwipe: document.getElementById("setSwipe"),
  };

  const pad = { up: false, down: false, left: false, right: false };
  const portraitCtx = ui.dlgPortrait.getContext("2d");

  const PORTRAITS = {
    Рассказчик: S.portraitNarrator,
    Подсказка: S.portraitHint,
    Мачеха: S.portraitMom,
    Девушка: S.portraitGirl,
    Ведьмы: S.portraitWitch,
    Луна: S.portraitMoon,
    Месяц: S.portraitMoon,
  };

  function defState() {
    return {
      act: "izba",
      hasYoke: false,
      hasMittens: false,
      sawMittens: false,
      needMittens: false,
      metStepmother: false,
      hasWater: false,
      waterCount: 0,
      clearedDrift: false,
      clearedDrift2: false,
      hasAmulet: false,
      heardRiver: false,
      chase: false,
      escaped: false,
      finished: false,
      badEnd: false,
      fear: 0,
      px: 0,
      py: 0,
      check: { x: 0, y: 0 },
    };
  }

  let st = defState();
  let playing = false;
  let paused = false;
  let locked = false;
  let queue = [];
  let onDlgEnd = null;
  let witches = [];
  let objs = [];
  let cam = { x: 0, y: 0 };
  let camLook = { x: 0, y: 0 };
  let input = { x: 0, y: 0 };
  let facing = { x: 0, y: 1 };
  let dashT = 0;
  let dashCd = 0;
  let dashFlash = 0;
  let ascend = -1;
  let keys = {};
  let viewW = 180;
  let viewH = 260;
  let scale = 2;
  let nearObj = null;
  let anim = 0;
  let shake = 0;
  let fade = 0;
  let fadeDir = 0;
  let fadeCb = null;
  let fadeDone = null;
  let snow = [];
  let footprints = [];
  let ghosts = [];
  let breath = [];
  let windT = 0;
  let footTimer = 0;
  let typeFull = "";
  let typeShown = 0;
  let typeSpeed = 42;
  let fearing = false;
  let transitioning = false;
  let walkPhase = 0;
  let mapPatch = {};
  let prayHold = false;
  let prayProgress = 0;
  let praying = false;
  let coverHintShown = false;
  let settingsFrom = "menu";
  let zoom = 1;
  let swipeId = null;
  let swipeOrigin = null;

  function map() {
    return ACTS[st.act].map;
  }
  function mw() {
    return map()[0].length * T;
  }
  function mh() {
    return map().length * T;
  }
  function cell(tx, ty) {
    const key = tx + "," + ty;
    if (mapPatch[key]) return mapPatch[key];
    const row = map()[ty];
    if (!row || tx < 0 || tx >= row.length) return "#";
    return row[tx];
  }
  function solid(tx, ty) {
    const ch = cell(tx, ty);
    return ch === "#" || ch === "H" || ch === "T" || ch === "w" || ch === "B" || ch === "D" || ch === "F";
  }

  function applyPatches() {
    mapPatch = {};
    if (st.act === "outside") {
      if (st.clearedDrift) mapPatch[DRIFT.tx + "," + DRIFT.ty] = "p";
      if (st.clearedDrift2) mapPatch[DRIFT2.tx + "," + DRIFT2.ty] = "p";
    }
  }

  function syncMusic() {
    if (!playing || paused) {
      if (!playing) AudioSFX.setMusic("off");
      return;
    }
    if (st.act === "moon") AudioSFX.setMusic("moon");
    else if (st.act === "izba") AudioSFX.setMusic("izba");
    else if (st.chase && !st.escaped) AudioSFX.setMusic("chase");
    else AudioSFX.setMusic("night");
  }

  function refreshOutsideObjective() {
    if (st.act === "moon") {
      setObj("Поговорите с месяцем");
      return;
    }
    if (st.act !== "outside") return;
    if (st.needMittens && !st.hasMittens) setObj("Возьмите варежки у дома");
    else if (!st.clearedDrift && !st.clearedDrift2) setObj("Идите к проруби по тропе");
    else if (!st.chase && st.waterCount === 0) setObj("Наберите воды у проруби");
    else if (!st.chase && st.waterCount === 1) setObj("Наполните второе ведро");
    else if (st.chase && !st.escaped) setObj("Убегайте к лунному камню!");
    else if (st.escaped) setObj("Удерживайте Действие у камня");
  }

  function unstick() {
    if (!collide(st.px, st.py)) return;
    for (let r = 1; r <= 48; r += 4) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2;
        const nx = st.px + Math.cos(ang) * r;
        const ny = st.py + Math.sin(ang) * r;
        if (!collide(nx, ny)) {
          st.px = nx;
          st.py = ny;
          return;
        }
      }
    }
    st.px = ACTS[st.act].spawn.x;
    st.py = ACTS[st.act].spawn.y;
  }

  function save() {
    window.GameSave.write(st);
    ui.btnContinue.disabled = false;
  }
  function load() {
    const d = window.GameSave.read(defState);
    if (!d) return false;
    st = d;
    if (st.waterCount >= BUCKETS_NEED) st.hasWater = true;
    if (st.hasWater && st.waterCount < BUCKETS_NEED) st.waterCount = BUCKETS_NEED;
    return true;
  }

  function setObj(text) {
    ui.objective.textContent = text;
  }

  function updateBucketHud() {
    const show = st.act === "outside" && (st.clearedDrift || st.clearedDrift2) && !st.escaped;
    ui.bucketWrap.classList.toggle("hidden", !show);
    if (show) ui.bucketCount.textContent = Math.min(st.waterCount, BUCKETS_NEED) + "/" + BUCKETS_NEED;
  }

  function updateChaseHud() {
    const chasing = st.act === "outside" && st.chase && !st.escaped;
    ui.btnDash.classList.toggle("hidden", !chasing);
    ui.fearWrap.classList.toggle("hidden", !chasing && !praying);
    ui.prayWrap.classList.toggle("hidden", !praying);
    updateBucketHud();
  }

  function initSnow() {
    snow = [];
    breath = [];
    const base = st.act === "izba" ? 0 : st.chase ? 72 : 48;
    for (let i = 0; i < base; i++) {
      snow.push({
        x: Math.random() * 500,
        y: Math.random() * 500,
        sp: 18 + Math.random() * 36,
        drift: (Math.random() - 0.5) * 18,
        size: Math.random() > 0.65 ? 2 : 1,
      });
    }
  }

  function drawPortrait(speaker) {
    const spr = PORTRAITS[speaker] || S.portraitNarrator;
    portraitCtx.imageSmoothingEnabled = false;
    portraitCtx.fillStyle = "#0b1524";
    portraitCtx.fillRect(0, 0, 48, 48);
    portraitCtx.drawImage(spr, 0, 0, 48, 48);
  }

  function talk(id, cb) {
    const lines = window.DIALOGUE[id];
    if (!lines) {
      if (cb) cb();
      return;
    }
    queue = lines.map((l) => ({ s: l.s, t: l.t }));
    onDlgEnd = cb || null;
    locked = true;
    showLine();
  }

  function showLine() {
    if (!queue.length) {
      ui.dialogue.classList.add("hidden");
      locked = false;
      typeFull = "";
      typeShown = 0;
      const cb = onDlgEnd;
      onDlgEnd = null;
      if (cb) cb();
      return;
    }
    const L0 = queue.shift();
    ui.dlgSpeaker.textContent = L0.s;
    drawPortrait(L0.s);
    typeFull = L0.t;
    typeShown = 0;
    ui.dlgText.textContent = "";
    ui.dialogue.classList.remove("hidden");
    AudioSFX.dlg();
  }

  function advanceDialogue() {
    if (ui.dialogue.classList.contains("hidden")) return false;
    if (typeShown < typeFull.length) {
      typeShown = typeFull.length;
      ui.dlgText.textContent = typeFull;
      return true;
    }
    showLine();
    return true;
  }

  function startFade(midCb, afterCb) {
    transitioning = true;
    locked = true;
    fade = Math.max(fade, 0.001);
    fadeDir = 1;
    fadeCb = midCb || null;
    fadeDone = afterCb || null;
    AudioSFX.fade();
  }

  function goAct(name, opts) {
    const after = opts && opts.after;
    const doSwap = () => {
      st.act = name;
      const a = ACTS[name];
      if (!opts || !opts.keepPos) {
        st.px = a.spawn.x;
        st.py = a.spawn.y;
      }
      st.check = { x: st.px, y: st.py };
      witches = [];
      footprints = [];
      ghosts = [];
      breath = [];
      ascend = -1;
      praying = false;
      prayProgress = 0;
      applyPatches();
      buildObjects();
      setObj(a.obj);
      refreshOutsideObjective();
      updateChaseHud();
      initSnow();
      unstick();
      syncMusic();
      save();
    };
    if (opts && opts.instant) {
      doSwap();
      fade = 0;
      fadeDir = 0;
      transitioning = false;
      fadeCb = null;
      fadeDone = null;
      return;
    }
    startFade(doSwap, after || null);
  }

  function flavor(id, x, y, spr, label) {
    objs.push({
      id,
      x,
      y,
      r: 16,
      label,
      draw: (dx, dy) => ctx.drawImage(spr, dx - 8, dy - 8),
      use() {
        AudioSFX.interact();
        talk(id);
      },
    });
  }

  function makeDriftObj(which) {
    const D = which === 2 ? DRIFT2 : DRIFT;
    const cleared = which === 2 ? st.clearedDrift2 : st.clearedDrift;
    if (cleared) return;
    objs.push({
      id: which === 2 ? "drift2" : "drift",
      x: (D.tx + 0.5) * T,
      y: (D.ty + 0.5) * T,
      r: 20,
      label: "Сугроб",
      draw: (x, y) => ctx.drawImage(S.snowdrift, x - 8, y - 8),
          use() {
            if (!st.hasYoke) {
              talk("needYoke");
              return;
            }
            if (!st.hasMittens) {
              st.needMittens = true;
              refreshOutsideObjective();
              save();
              talk(st.sawMittens ? "needMittensRemember" : "needMittens");
              buildObjects();
              return;
            }
            AudioSFX.interact();
            if (which === 2) st.clearedDrift2 = true;
            else st.clearedDrift = true;
            applyPatches();
            refreshOutsideObjective();
            updateBucketHud();
            save();
            // после расчистки — только «найти прорубь», без спойлера про лёд
            talk(which === 2 ? "drift2" : "drift");
            buildObjects();
          },
    });
  }

  function buildObjects() {
    objs = [];
    if (st.act === "izba") {
      objs.push({
        id: "mom",
        x: 11.5 * T,
        y: 6.5 * T,
        r: 20,
        label: "Мачеха",
        draw: (x, y) => ctx.drawImage(S.stepmom, x - 8, y - 8),
        use() {
          AudioSFX.interact();
          st.metStepmother = true;
          setObj("Возьмите коромысло у стены");
          save();
          talk("stepmother");
        },
      });
      if (!st.hasYoke) {
        objs.push({
          id: "yoke",
          x: 3.5 * T,
          y: 6.5 * T,
          r: 18,
          label: "Коромысло",
          draw: (x, y) => ctx.drawImage(S.yokeItem, x - 8, y - 8),
          use() {
            const takeYoke = () => {
              AudioSFX.interact();
              st.hasYoke = true;
              if (st.metStepmother) setObj("Выйдите наружу через дверь");
              else setObj("Поговорите с мачехой");
              save();
              talk("yoke");
              buildObjects();
            };
            // коромысло всегда просто коромысло — диалог мачехи только у неё
            takeYoke();
          },
        });
      }
      objs.push({
        id: "door",
        x: 8 * T,
        y: 9.5 * T,
        r: 18,
        label: "Дверь",
        draw: (x, y) => ctx.drawImage(S.door, x - 8, y - 8),
        use() {
          if (!st.hasYoke) {
            talk("needYoke");
            return;
          }
          AudioSFX.interact();
          talk("leave", () => {
            goAct("outside", { after: () => talk("path") });
          });
        },
      });
      objs.push({
        id: "window",
        x: 5.5 * T,
        y: 3.2 * T,
        r: 16,
        label: "Окно",
        draw() {},
        use() {
          AudioSFX.interact();
          talk("window");
        },
      });
      flavor("pot", 4 * T, 5.5 * T, S.pot, "Горшок");
      flavor("barrel", 12 * T, 6 * T, S.barrel, "Бочка");
      flavor("crate", 11.5 * T, 7.5 * T, S.crate, "Ящик");
    }

    if (st.act === "outside") {
      if (!st.hasMittens) {
        objs.push({
          id: "mittens",
          x: MITTENS_POS.x,
          y: MITTENS_POS.y,
          r: 18,
          label: "Варежки",
          draw: (x, y) => ctx.drawImage(S.mittens, x - 8, y - 8),
          use() {
            if (!st.needMittens) {
              st.sawMittens = true;
              save();
              talk("mittensEarly");
              return;
            }
            AudioSFX.interact();
            st.hasMittens = true;
            st.sawMittens = true;
            refreshOutsideObjective();
            save();
            talk("mittens");
            buildObjects();
          },
        });
      }

      makeDriftObj(1);
      makeDriftObj(2);

      if (!st.hasAmulet && st.clearedDrift2) {
        objs.push({
          id: "amulet",
          x: 18.5 * T,
          y: 16.5 * T,
          r: 16,
          label: "Амулет",
          draw: (x, y) => {
            ctx.drawImage(patternSprites.amulet, x - 8, y - 8);
            if (CP) {
              ctx.globalAlpha = 0.45 + 0.25 * Math.sin(anim * 4);
              CP.draw(ctx, "serdtse", {
                x,
                y: y - 1,
                scale: 0.7,
                color: "#e8f0ff",
                lineWidth: 0.8,
              });
              ctx.globalAlpha = 1;
            }
          },
          use() {
            AudioSFX.interact();
            st.hasAmulet = true;
            st.fear = Math.max(0, st.fear - 25);
            ui.fearFill.style.width = st.fear + "%";
            save();
            talk("amulet");
            buildObjects();
          },
        });
      }

      objs.push({
        id: "hole",
        x: HOLE_POS.x,
        y: HOLE_POS.y,
        r: 20,
        label: st.chase || !(st.clearedDrift || st.clearedDrift2) || st.waterCount >= BUCKETS_NEED ? "" : "Прорубь",
        draw() {},
        use() {
          if (st.chase) return;
          if (!st.hasYoke) {
            talk("needYoke");
            return;
          }
          if (!st.hasMittens) {
            talk("needMittens");
            return;
          }
          if (!st.clearedDrift && !st.clearedDrift2) {
            talk("needDrift");
            return;
          }
          if (st.waterCount >= BUCKETS_NEED) return;
          // прорубь видна — только здесь рассказываем про неё
          if (!st.heardRiver) {
            st.heardRiver = true;
            save();
            talk("river", () => {
              AudioSFX.scoop();
              st.waterCount += 1;
              st.px = HOLE_POS.x;
              st.py = HOLE_POS.y - T;
              updateBucketHud();
              refreshOutsideObjective();
              save();
              talk("water1");
            });
            return;
          }
          AudioSFX.scoop();
          st.waterCount += 1;
          st.px = HOLE_POS.x;
          st.py = HOLE_POS.y - T;
          updateBucketHud();
          refreshOutsideObjective();
          if (st.waterCount === 1) {
            save();
            talk("water1");
          } else {
            st.hasWater = true;
            save();
            talk("water2", startChase);
          }
        },
      });

      objs.push({
        id: "altar",
        x: ALTAR_POS.x,
        y: ALTAR_POS.y,
        r: 24,
        label: st.escaped ? "Взмолиться" : st.chase ? "Укрыться" : "Камень",
        draw: (x, y) => {
          const pulse = 0.18 + 0.08 * Math.sin(anim * 3);
          ctx.fillStyle = `rgba(180,210,255,${pulse})`;
          ctx.beginPath();
          ctx.arc(x, y, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#8a92a8";
          ctx.fillRect(x - 7, y - 5, 14, 11);
          ctx.fillStyle = "#b0b8c8";
          ctx.fillRect(x - 5, y - 8, 10, 5);
          ctx.fillStyle = "#6a7288";
          ctx.fillRect(x - 6, y + 4, 12, 3);
          if (CP) {
            ctx.globalAlpha = 0.55 + pulse;
            CP.draw(ctx, "zvezda", {
              x,
              y: y - 2,
              scale: 1.35,
              color: "#eaf2ff",
              lineWidth: 1,
            });
            ctx.globalAlpha = 0.4 + pulse * 0.5;
            CP.draw(ctx, "serdtse", {
              x,
              y: y + 6,
              scale: 0.85,
              color: "#c8b8e0",
              lineWidth: 0.9,
            });
            ctx.globalAlpha = 1;
          } else if (patternSprites.altarSun) {
            ctx.globalAlpha = 0.7;
            ctx.drawImage(patternSprites.altarSun, x - 10, y - 12);
            ctx.globalAlpha = 1;
          }
        },
        use() {
          if (!st.hasWater || !st.chase) {
            talk("earlyAltar");
            return;
          }
          if (!st.escaped) {
            escapeWitches();
            return;
          }
          // молитва запускается удержанием — tap показывает подсказку
          if (!praying) {
            startPray();
          }
        },
      });

      objs.push({
        id: "houseOther1",
        x: 16 * T,
        y: 3.5 * T,
        r: 22,
        label: "Дом",
        draw() {},
        use() {
          AudioSFX.interact();
          talk("houseOther");
        },
      });
      objs.push({
        id: "houseOther2",
        x: 20 * T,
        y: 6 * T,
        r: 22,
        label: "Дом",
        draw() {},
        use() {
          AudioSFX.interact();
          talk("houseOther");
        },
      });

      flavor("well", 7 * T, 3 * T, S.well, "Колодец");
      flavor("bench", 3 * T, 5.5 * T, S.bench, "Лавка");
      flavor("fence", 2.5 * T, 4 * T, S.fence, "Забор");
      flavor("sled", 9 * T, 6 * T, S.sled, "Санки");
      flavor("lantern", 6 * T, 7 * T, S.lantern, "Фонарь");
      flavor("cart", 14 * T, 7 * T, S.cart, "Телега");
      flavor("firewood", 3 * T, 7.5 * T, S.firewood, "Дрова");
      flavor("sign", 7 * T, 8.2 * T, S.sign, "Указатель");
      flavor("snowman", 11 * T, 5 * T, S.snowman, "Снеговик");
      flavor("fence", 13.5 * T, 4.2 * T, S.fence, "Забор");
      flavor("sled", 17.2 * T, 3.8 * T, S.sled, "Санки");
      flavor("firewood", 15.8 * T, 4.8 * T, S.firewood, "Дрова");
      flavor("lantern", 19.2 * T, 5.5 * T, S.lantern, "Фонарь");
      flavor("bench", 21.5 * T, 6.8 * T, S.bench, "Лавка");
      flavor("doghouse", 22.5 * T, 5.2 * T, S.doghouse, "Будка");
      flavor("barrel", 17.8 * T, 7.2 * T, S.barrel, "Бочка");
      if (st.clearedDrift || st.clearedDrift2) {
        flavor("hay", 5 * T, 22 * T, S.hay, "Стог");
        flavor("rock", 18 * T, 23 * T, S.rock, "Камень");
        flavor("bush", 7 * T, 24 * T, S.bush, "Куст");
        flavor("cross", 16 * T, 21 * T, S.cross, "Крест");
        flavor("stump", 4 * T, 20 * T, S.stump, "Пень");
        flavor("scarecrow", POS.SCARECROW.x, POS.SCARECROW.y, S.scarecrow, "Пугало");
      }
    }

    if (st.act === "moon") {
      objs.push({
        id: "month",
        x: 8 * T,
        y: 8 * T,
        r: 28,
        label: "Месяц",
        draw: (x, y) => {
          if (CP) {
            ctx.globalAlpha = 0.35 + 0.1 * Math.sin(anim * 2);
            CP.draw(ctx, "zvezda", {
              x,
              y,
              scale: 4.5,
              color: "#c8dcff",
              lineWidth: 1.2,
            });
            ctx.globalAlpha = 1;
          }
          ctx.globalAlpha = 0.85;
          ctx.drawImage(S.bigMoon, x - 24, y - 24, 48, 48);
          ctx.globalAlpha = 1;
          if (CP) {
            ctx.globalAlpha = 0.55;
            CP.draw(ctx, "serdtse", {
              x,
              y: y + 18,
              scale: 1.6,
              color: "#d0b8d8",
              lineWidth: 1,
            });
            ctx.globalAlpha = 1;
          }
        },
        use() {
          AudioSFX.interact();
          talk("moonEpilogue", () => {
            talk("end", () => {
              st.finished = true;
              st.badEnd = false;
              save();
              playing = false;
              ui.btnPause.classList.add("hidden");
              ui.creditsText.textContent = "Падчерица ушла на луну - и ведьмы её не достали.";
              ui.credits.classList.remove("hidden");
              AudioSFX.setMusic("moon");
            });
          });
        },
      });
    }
  }

  function inCover(x, y) {
    if (!(st.clearedDrift || st.clearedDrift2)) return false;
    for (const c of POS.COVER) {
      if (Math.hypot(x - c.x, y - c.y) < c.r) return true;
    }
    return false;
  }

  function hasLOS(ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const dist = Math.hypot(dx, dy) || 1;
    const steps = Math.ceil(dist / 6);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = ax + dx * t;
      const y = ay + dy * t;
      if (solid((x / T) | 0, (y / T) | 0)) return false;
      if (inCover(x, y) && inCover(bx, by)) return false;
    }
    if (inCover(bx, by) && !inCover(ax, ay)) return false;
    return true;
  }

  function startChase() {
    st.chase = true;
    st.fear = 0;
    st.check = { x: HOLE_POS.x, y: HOLE_POS.y - T * 2 };
    witches = [
      { x: 8 * T, y: 27 * T, sp: 52, phase: 0 },
      { x: 18 * T, y: 27 * T, sp: 58, phase: 1.2 },
      { x: 13 * T, y: 25 * T, sp: 48, phase: 2.4 },
    ];
    refreshOutsideObjective();
    updateChaseHud();
    ui.fearFill.style.width = "0%";
    AudioSFX.witches();
    Settings.vibrate([40, 30, 40]);
    save();
    buildObjects();
    unstick();
    shake = 0.35;
    syncMusic();
    initSnow();
  }

  function escapeWitches() {
    st.escaped = true;
    witches = [
      { x: 10 * T, y: 24 * T, sp: 40, phase: 0 },
      { x: 16 * T, y: 25 * T, sp: 44, phase: 1 },
      { x: 13 * T, y: 22 * T, sp: 38, phase: 2 },
    ];
    AudioSFX.fearOn(false);
    fearing = false;
    refreshOutsideObjective();
    updateChaseHud();
    AudioSFX.safe();
    save();
    talk("safe");
    buildObjects();
    syncMusic();
  }

  function startPray() {
    praying = true;
    prayProgress = 0;
    prayHold = true;
    locked = false;
    updateChaseHud();
    setObj("Удерживайте Действие!");
    AudioSFX.pray();
  }

  function finishPray() {
    praying = false;
    prayProgress = 0;
    prayHold = false;
    witches = [];
    updateChaseHud();
    AudioSFX.interact();
    talk("pray", () => beginAscend());
  }

  function failPray() {
    praying = false;
    prayProgress = 0;
    prayHold = false;
    locked = true;
    AudioSFX.catch();
    Settings.vibrate([80, 40, 80, 40, 120]);
    shake = 0.5;
    updateChaseHud();
    talk("caughtPray", () => {
      st.finished = true;
      st.badEnd = true;
      save();
      playing = false;
      ui.btnPause.classList.add("hidden");
      ui.creditsText.textContent = "Молитва не успела… Попробуйте снова.";
      ui.credits.classList.remove("hidden");
      AudioSFX.setMusic("off");
    });
  }

  function onCaught() {
    locked = true;
    AudioSFX.catch();
    Settings.vibrate([60, 40, 60]);
    shake = 0.45;
    st.fear = 0;
    ui.fearFill.style.width = "0%";
    talk("caught", () => {
      st.px = st.check.x;
      st.py = st.check.y;
      witches.forEach((w, i) => {
        w.x = HOLE_POS.x + (i - 1) * 40;
        w.y = HOLE_POS.y - 20;
      });
      locked = false;
      unstick();
    });
  }

  function beginAscend() {
    locked = true;
    ascend = 0;
    witches = [];
    AudioSFX.ascend();
    AudioSFX.setMusic("moon");
  }

  function moonSafe(x, y) {
    return Math.hypot(x - ALTAR_POS.x, y - ALTAR_POS.y) < 36;
  }

  function findNear() {
    let best = null;
    let bd = 22;
    for (const o of objs) {
      if (!o.label && o.id !== "hole") continue;
      if (o.id === "hole" && (st.chase || !(st.clearedDrift || st.clearedDrift2) || st.waterCount >= BUCKETS_NEED)) continue;
      const d = Math.hypot(o.x - st.px, o.y - st.py);
      const reach = o.r != null ? Math.max(o.r, 16) : 22;
      if (d < bd && d <= reach + 4) {
        bd = d;
        best = o;
      }
    }
    return best;
  }

  function playerSprite() {
    const moving = Math.hypot(input.x, input.y) > 0.1 && !locked;
    const frame = moving ? (((walkPhase * 2) | 0) % 2 === 0 ? "A" : "B") : "";
    if (st.hasYoke) {
      if (frame === "A") return S.girlYokeWalkA;
      if (frame === "B") return S.girlYokeWalkB;
      return S.girlYoke;
    }
    if (frame === "A") return S.girlWalkA;
    if (frame === "B") return S.girlWalkB;
    return S.girl;
  }

  function drawActor(spr, x, y, flip) {
    if (flip) {
      ctx.save();
      ctx.translate(x + 8, y);
      ctx.scale(-1, 1);
      ctx.drawImage(spr, -8, 0);
      ctx.restore();
    } else {
      ctx.drawImage(spr, x, y);
    }
  }

  function interact() {
    if (paused || locked || !playing) return;
    if (praying) {
      prayHold = true;
      return;
    }
    const o = findNear();
    if (o) o.use();
  }

  function tryDash() {
    if (paused) return;
    if (!(st.act === "outside" && st.chase && !st.escaped) || locked) return;
    if (dashCd > 0 || dashT > 0) return;
    dashT = 0.15;
    dashCd = 0.7;
    dashFlash = 0.12;
    AudioSFX.dash();
    Settings.vibrate(15);
    const spr = playerSprite();
    for (let i = 0; i < 3; i++) {
      ghosts.push({
        x: st.px - facing.x * i * 6,
        y: st.py - facing.y * i * 6,
        life: 0.18 + i * 0.04,
        spr,
        flip: facing.x < 0,
        a: 0.45 - i * 0.12,
      });
    }
  }

  function collide(x, y) {
    const r = 3;
    return [
      [x - r, y - r],
      [x + r, y - r],
      [x - r, y + r],
      [x + r, y + r],
    ].some(([a, b]) => solid((a / T) | 0, (b / T) | 0));
  }

  function moveEntity(ent, vx, vy, dt, spd) {
    const nx = ent.x + vx * spd * dt;
    if (!collide(nx, ent.y)) ent.x = nx;
    const ny = ent.y + vy * spd * dt;
    if (!collide(ent.x, ny)) ent.y = ny;
  }

  function readPad() {
    const left = pad.left || keys.ArrowLeft || keys.a || keys.A;
    const right = pad.right || keys.ArrowRight || keys.d || keys.D;
    const up = pad.up || keys.ArrowUp || keys.w || keys.W;
    const down = pad.down || keys.ArrowDown || keys.s || keys.S;
    let vx = 0;
    let vy = 0;
    if (left && !right) vx = -1;
    else if (right && !left) vx = 1;
    if (up && !down) vy = -1;
    else if (down && !up) vy = 1;
    if (vx !== 0 && vy !== 0) {
      if (Math.abs(facing.x) >= Math.abs(facing.y)) vy = 0;
      else vx = 0;
    }
    return { vx, vy };
  }

  function setPaused(v) {
    if (!playing || ascend >= 0) return;
    paused = v;
    ui.pause.classList.toggle("hidden", !v);
    if (v) {
      AudioSFX.fearOn(false);
      fearing = false;
      prayHold = false;
    }
    syncMusic();
  }

  function openSettings(from) {
    settingsFrom = from;
    syncSettingsUI();
    ui.settings.classList.remove("hidden");
    if (from === "pause") ui.pause.classList.add("hidden");
    else ui.menu.classList.add("hidden");
  }

  function closeSettings() {
    ui.settings.classList.add("hidden");
    if (settingsFrom === "pause") {
      ui.pause.classList.remove("hidden");
    } else {
      ui.menu.classList.remove("hidden");
    }
  }

  function syncSettingsUI() {
    const s = Settings.get();
    ui.setMaster.value = (s.master * 100) | 0;
    ui.setMusic.value = (s.music * 100) | 0;
    ui.setSfx.value = (s.sfx * 100) | 0;
    ui.setMute.checked = !!s.mute;
    ui.setVibrate.checked = !!s.vibrate;
    ui.setSwipe.checked = !!s.swipeMove;
    ui.dpad.classList.toggle("swipe-mode", !!s.swipeMove);
  }

  function applySettingsFromUI() {
    Settings.set({
      master: (+ui.setMaster.value) / 100,
      music: (+ui.setMusic.value) / 100,
      sfx: (+ui.setSfx.value) / 100,
      mute: ui.setMute.checked,
      vibrate: ui.setVibrate.checked,
      swipeMove: ui.setSwipe.checked,
    });
    AudioSFX.applyGains();
    ui.dpad.classList.toggle("swipe-mode", ui.setSwipe.checked);
  }

  function update(dt) {
    anim += dt;

    if (!ui.dialogue.classList.contains("hidden") && typeShown < typeFull.length) {
      typeShown = Math.min(typeFull.length, typeShown + typeSpeed * dt);
      ui.dlgText.textContent = typeFull.slice(0, typeShown | 0);
    }

    if (fadeDir !== 0) {
      fade += fadeDir * dt * 3.2;
      if (fadeDir > 0 && fade >= 1) {
        fade = 1;
        const cb = fadeCb;
        fadeCb = null;
        if (cb) cb();
        fadeDir = -1;
      } else if (fadeDir < 0 && fade <= 0) {
        fade = 0;
        fadeDir = 0;
        transitioning = false;
        const done = fadeDone;
        fadeDone = null;
        locked = false;
        if (done) done();
      }
    }

    if (shake > 0) shake = Math.max(0, shake - dt);

    const targetZoom = st.chase && !st.escaped && st.act === "outside" ? 0.88 : 1;
    zoom += (targetZoom - zoom) * Math.min(1, dt * 3);

    camLook.x += (facing.x * 18 - camLook.x) * Math.min(1, dt * 4);
    camLook.y += (facing.y * 14 - camLook.y) * Math.min(1, dt * 4);

    if (st.act !== "izba") {
      windT -= dt;
      if (windT <= 0) {
        windT = 4 + Math.random() * 6;
        if (Math.random() > 0.4) AudioSFX.wind();
        for (const p of snow) p.drift += (Math.random() - 0.5) * 10;
      }
      const windMul = st.chase ? 1.6 : 1;
      for (const p of snow) {
        p.y += p.sp * dt * windMul;
        p.x += p.drift * dt * windMul + Math.sin(anim * 2 + p.y * 0.05) * 10 * dt;
        if (p.y > mh() + 20) {
          p.y = -4;
          p.x = Math.random() * mw();
        }
        if (p.x < -10) p.x = mw() + 5;
        if (p.x > mw() + 10) p.x = -5;
      }
    }
    for (let i = footprints.length - 1; i >= 0; i--) {
      footprints[i].life -= dt;
      if (footprints[i].life <= 0) footprints.splice(i, 1);
    }
    for (let i = ghosts.length - 1; i >= 0; i--) {
      ghosts[i].life -= dt;
      ghosts[i].a *= 0.92;
      if (ghosts[i].life <= 0) ghosts.splice(i, 1);
    }
    for (let i = breath.length - 1; i >= 0; i--) {
      breath[i].life -= dt;
      breath[i].y -= 8 * dt;
      breath[i].a *= 0.96;
      if (breath[i].life <= 0) breath.splice(i, 1);
    }
    if (dashFlash > 0) dashFlash -= dt;

    if (!playing || paused) return;

    if (ascend >= 0) {
      if (ascend < 99) {
        ascend += dt;
        if (ascend < 2.8) st.py -= 22 * dt;
        if (ascend >= 3.2) {
          ascend = 99;
          goAct("moon", {
            after: () => {
              setObj("Поговорите с месяцем");
            },
          });
        }
      }
      return;
    }

    if (praying) {
      const holding =
        prayHold ||
        keys.e ||
        keys.E ||
        keys.Enter ||
        keys[" "];
      if (holding) {
        prayProgress += dt * (st.hasAmulet ? 1.25 : 1);
        ui.prayFill.style.width = Math.min(100, (prayProgress / PRAY_NEED) * 100) + "%";
        if ((prayProgress * 8) | 0 !== ((prayProgress - dt) * 8) | 0) AudioSFX.pray();
        if (prayProgress >= PRAY_NEED) {
          finishPray();
          return;
        }
      } else {
        prayProgress = Math.max(0, prayProgress - dt * 0.35);
        ui.prayFill.style.width = Math.min(100, (prayProgress / PRAY_NEED) * 100) + "%";
      }
      // ведьмы подходят во время молитвы
      if (!locked) {
        for (const w of witches) {
          const dx = ALTAR_POS.x - w.x;
          const dy = ALTAR_POS.y - w.y;
          const d = Math.hypot(dx, dy) || 1;
          moveEntity(w, dx / d, dy / d, dt, w.sp * 0.85);
          if (d < 18) {
            failPray();
            return;
          }
        }
      }
      nearObj = findNear();
      return;
    }

    if (!locked) {
      let { vx, vy } = readPad();
      if (vx || vy) facing = { x: vx, y: vy };
      input.x = vx;
      input.y = vy;
      let spd = 88;
      if (dashT > 0) {
        dashT -= dt;
        spd = 165;
        vx = facing.x;
        vy = facing.y;
      }
      dashCd = Math.max(0, dashCd - dt);
      if (vx || vy) {
        const ent = { x: st.px, y: st.py };
        moveEntity(ent, vx, vy, dt, spd);
        st.px = ent.x;
        st.py = ent.y;
      }
      st.px = Math.max(T, Math.min(mw() - T, st.px));
      st.py = Math.max(T, Math.min(mh() - T, st.py));
      unstick();

      const moving = !!(vx || vy);
      if (moving) walkPhase += dt * 6;
      else walkPhase = 0;
      AudioSFX.step(moving && st.act !== "izba", dt);

      if (moving && st.act !== "izba") {
        footTimer -= dt;
        if (footTimer <= 0) {
          footTimer = 0.22;
          footprints.push({
            x: st.px - facing.x * 3,
            y: st.py + 5,
            life: 1.4,
            w: facing.x !== 0 ? 3 : 5,
            h: facing.y !== 0 ? 3 : 5,
          });
          if (Math.random() > 0.55) {
            breath.push({
              x: st.px + (facing.x < 0 ? -4 : 4),
              y: st.py - 6,
              life: 0.55,
              a: 0.35,
            });
          }
        }
      }

      if (st.chase && !st.escaped && inCover(st.px, st.py)) {
        st.fear = Math.max(0, st.fear - 12 * dt);
        ui.fearFill.style.width = st.fear + "%";
        if (!coverHintShown) {
          coverHintShown = true;
          // лёгкая подсказка без блокировки — только первый раз через prompt уже есть
        }
      }
    }

    let nearFear = false;
    if (st.act === "outside" && st.chase && !st.escaped && !locked && !paused) {
      const playerHidden = inCover(st.px, st.py);
      for (const w of witches) {
        if (moonSafe(w.x, w.y)) continue;
        const dx = st.px - w.x;
        const dy = st.py - w.y;
        const d = Math.hypot(dx, dy) || 1;
        const sees = hasLOS(w.x, w.y, st.px, st.py) && !playerHidden;
        if (sees) {
          moveEntity(w, dx / d, dy / d, dt, w.sp);
        } else {
          // блуждание / потеря цели
          const ang = anim * 0.7 + w.phase;
          moveEntity(w, Math.cos(ang), Math.sin(ang), dt, w.sp * 0.35);
        }
        if (d < 14 && sees) {
          nearFear = true;
          shake = Math.max(shake, 0.12);
          const fearRate = st.hasAmulet ? 22 : 35;
          st.fear = Math.min(100, st.fear + fearRate * dt);
          ui.fearFill.style.width = st.fear + "%";
          if (st.fear >= 100) {
            onCaught();
            break;
          }
        }
      }
    }
    // после побега ведьмы ещё бродят у поляны, но слабее
    if (st.act === "outside" && st.escaped && !praying && !locked && witches.length) {
      for (const w of witches) {
        if (moonSafe(w.x, w.y)) continue;
        const dx = st.px - w.x;
        const dy = st.py - w.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > 40) moveEntity(w, dx / d, dy / d, dt, w.sp * 0.55);
      }
    }

    if (nearFear !== fearing) {
      fearing = nearFear;
      AudioSFX.fearOn(nearFear);
    }

    nearObj = findNear();
    if (nearObj && nearObj.label && !locked && !praying) {
      const verb = nearObj.id === "altar" && st.escaped ? "удерживайте" : "Действие";
      ui.prompt.textContent = nearObj.label + " · " + verb;
      ui.prompt.classList.remove("hidden");
    } else if (praying) {
      ui.prompt.textContent = "Удерживайте Действие";
      ui.prompt.classList.remove("hidden");
    } else {
      ui.prompt.classList.add("hidden");
    }
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    viewW = 160;
    viewH = Math.round(viewW * (rect.height / Math.max(1, rect.width)));
    viewH = Math.max(200, Math.min(300, viewH));
    scale = Math.max(2, Math.floor((rect.width * dpr) / viewW));
    canvas.width = viewW * scale;
    canvas.height = viewH * scale;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  function drawTile(ch, sx, sy, tx, ty) {
    if (ch === "w") {
      ctx.drawImage(S.tiles.ice, sx, sy);
      ctx.globalAlpha = 0.88;
      ctx.drawImage(S.tileFor("w", tx, ty), sx, sy);
      ctx.globalAlpha = 1;
      const wave = ((anim * 6 + tx + ty) | 0) % 4;
      ctx.fillStyle = "rgba(200,235,255,0.55)";
      ctx.fillRect(sx + 2, sy + 3 + wave, 10, 1);
      ctx.fillRect(sx + 4, sy + 8 + ((wave + 2) % 4), 7, 1);
      ctx.fillStyle = "rgba(20,60,110,0.35)";
      ctx.fillRect(sx, sy, 16, 1);
      ctx.fillRect(sx, sy + 15, 16, 1);
      return;
    }
    if (ch === "I") {
      ctx.drawImage(S.tiles.ice, sx, sy);
      ctx.fillStyle = "#071828";
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 8, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(160,200,230,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 8, 6.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(40,90,140,0.45)";
      ctx.beginPath();
      ctx.arc(sx + 8, sy + 8, 3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    ctx.drawImage(S.tileFor(ch, tx, ty), sx, sy);
  }

  function drawSky(W, H, withMoon) {
    const g = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    g.addColorStop(0, "#050a18");
    g.addColorStop(1, "#0b1830");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, Math.ceil(H * 0.42));

    for (let i = 0; i < 40; i++) {
      const sx = (i * 47 + ((anim * 2) | 0)) % W;
      const sy = (i * 29) % Math.floor(H * 0.38);
      const tw = 0.5 + 0.5 * Math.sin(anim * 3 + i);
      ctx.fillStyle = `rgba(255,255,255,${0.35 + tw * 0.55})`;
      ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
    }

    if (!withMoon || ascend >= 0) return;
    const mx = W - 36;
    const my = 28;
    ctx.fillStyle = "rgba(200,220,255,0.12)";
    ctx.beginPath();
    ctx.arc(mx, my, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(S.bigMoon, mx - 24, my - 24);
  }

  function draw() {
    const W = viewW;
    const H = viewH;
    const shx = shake > 0 ? (Math.random() - 0.5) * 5 * shake : 0;
    const shy = shake > 0 ? (Math.random() - 0.5) * 5 * shake : 0;

    const zw = W / zoom;
    const zh = H / zoom;

    cam.x = st.px - zw / 2 + camLook.x + shx;
    cam.y = st.py - zh / 2 + camLook.y + shy;
    cam.x = Math.max(0, Math.min(Math.max(0, mw() - zw), cam.x));
    cam.y = Math.max(0, Math.min(Math.max(0, mh() - zh), cam.y));

    ctx.save();
    ctx.scale(zoom, zoom);

    ctx.fillStyle = st.act === "izba" ? "#1a120e" : st.act === "moon" ? "#0a0e1a" : "#070e1c";
    ctx.fillRect(0, 0, zw, zh);

    if (st.act === "outside") drawSky(zw, zh, true);
    if (st.act === "moon") {
      drawSky(zw, zh, false);
      for (let i = 0; i < 60; i++) {
        const sx = (i * 37) % zw;
        const sy = (i * 53) % zh;
        ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.4 * Math.sin(anim + i)})`;
        ctx.fillRect(sx, sy, 1, 1);
      }
    }

    const x0 = Math.max(0, (cam.x / T) | 0);
    const y0 = Math.max(0, (cam.y / T) | 0);
    const x1 = Math.min(map()[0].length, ((cam.x + zw) / T) | 0) + 1;
    const y1 = Math.min(map().length, ((cam.y + zh) / T) | 0) + 1;

    if (ascend < 99) {
      for (let ty = y0; ty < y1; ty++) {
        for (let tx = x0; tx < x1; tx++) {
          const ch = cell(tx, ty);
          const sx = tx * T - cam.x;
          const sy = ty * T - cam.y;
          drawTile(ch === " " ? "." : ch, sx, sy, tx, ty);
          if (ch === "T") {
            const jx = ((tx * 17 + ty * 13) % 7) - 3;
            const jy = ((tx * 11 + ty * 5) % 5) - 1;
            ctx.drawImage(S.tree, sx + jx, sy - 10 - jy);
          }
          if (ch === "B" || ch === "D") ctx.drawImage(S.snowdrift, sx, sy);
          if (ch === "F") {
            ctx.drawImage(S.pech, sx - 6, sy - 8);
            // мерцание огня
            const flick = 0.55 + 0.45 * Math.sin(anim * 12);
            ctx.globalAlpha = flick;
            ctx.drawImage(S.fire, sx + 4, sy + 2);
            ctx.globalAlpha = 1;
          }
          // лунный блик на полу избы
          if (st.act === "izba" && ch === "=") {
            const glow = 0.04 + 0.03 * Math.sin(anim * 1.5 + tx);
            ctx.fillStyle = `rgba(180,210,255,${glow})`;
            ctx.fillRect(sx, sy, T, T);
          }
        }
      }

      // узоры только на брёвнах стен (H), не посреди пола
      if (st.act === "izba" && CP) {
        const wallOrn = [
          { tx: 3, ty: 1, id: "snezhinka3", scale: 1.1 },
          { tx: 12, ty: 1, id: "tree", scale: 1.0 },
          { tx: 1, ty: 4, id: "center", scale: 1.2 },
          { tx: 14, ty: 5, id: "serdtse", scale: 1.0 },
        ];
        ctx.globalAlpha = 0.75;
        for (const o of wallOrn) {
          if (cell(o.tx, o.ty) !== "H") continue;
          CP.draw(ctx, o.id, {
            x: (o.tx + 0.5) * T - cam.x,
            y: (o.ty + 0.5) * T - cam.y,
            scale: o.scale,
            color: "#c8a878",
            lineWidth: 1,
          });
        }
        ctx.globalAlpha = 1;
      }

      for (const f of footprints) {
        ctx.globalAlpha = Math.min(0.35, f.life * 0.25);
        ctx.fillStyle = "#9ab0c8";
        ctx.fillRect(f.x - cam.x - f.w / 2, f.y - cam.y - f.h / 2, f.w, f.h);
        ctx.globalAlpha = 1;
      }

      if (st.act === "outside") {
        ctx.drawImage(S.house, 1.2 * T - cam.x, 0.1 * T - cam.y);
        ctx.drawImage(S.houseSmall, 14.5 * T - cam.x, 1.8 * T - cam.y);
        ctx.drawImage(S.houseSmall, 18.5 * T - cam.x, 4.2 * T - cam.y);
        const mx = ALTAR_POS.x - cam.x;
        const my = ALTAR_POS.y - cam.y;
        const g = ctx.createRadialGradient(mx, my, 4, mx, my, 44);
        g.addColorStop(0, "rgba(200,220,255,0.35)");
        g.addColorStop(1, "rgba(200,220,255,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(mx, my, 44, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const o of objs) {
        o.draw(o.x - cam.x, o.y - cam.y);
      }

      for (const g of ghosts) {
        ctx.globalAlpha = Math.max(0, g.a);
        drawActor(g.spr, g.x - cam.x - 8, g.y - cam.y - 8, g.flip);
        ctx.globalAlpha = 1;
      }

      for (const w of witches) {
        const dim = moonSafe(w.x, w.y);
        const bob = Math.sin(anim * 5 + w.phase) * 2;
        const pulse = 0.75 + 0.25 * Math.sin(anim * 6 + w.phase);
        ctx.globalAlpha = dim ? 0.3 : pulse;
        ctx.drawImage(S.witch, w.x - cam.x - 8, w.y - cam.y - 8 + bob);
        ctx.globalAlpha = 1;
      }

      if (ascend < 0) {
        const spr = playerSprite();
        const moving = Math.hypot(input.x, input.y) > 0.1 && !locked;
        const bob = moving ? Math.sin(walkPhase * Math.PI) * 1 : 0;
        drawActor(spr, st.px - cam.x - 8, st.py - cam.y - 8 + bob, facing.x < 0);
      } else if (ascend < 2.4) {
        const fadeP = Math.max(0, 1 - ascend / 2.4);
        ctx.globalAlpha = fadeP;
        const spr = playerSprite();
        drawActor(spr, st.px - cam.x - 8, st.py - cam.y - 8, facing.x < 0);
        // лучи вознесения
        ctx.globalAlpha = Math.min(0.55, ascend * 0.25);
        ctx.strokeStyle = "#c8dcff";
        ctx.lineWidth = 2;
        for (let i = 0; i < 7; i++) {
          const ang = -Math.PI / 2 + (i - 3) * 0.12;
          ctx.beginPath();
          ctx.moveTo(st.px - cam.x, st.py - cam.y);
          ctx.lineTo(st.px - cam.x + Math.cos(ang) * (40 + ascend * 30), st.py - cam.y + Math.sin(ang) * (40 + ascend * 30));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      for (const b of breath) {
        ctx.globalAlpha = Math.max(0, b.a);
        ctx.fillStyle = "#dce8f8";
        ctx.fillRect(b.x - cam.x, b.y - cam.y, 3, 2);
        ctx.globalAlpha = 1;
      }

      if (st.act !== "izba" && st.act !== "moon") {
        for (const p of snow) {
          const sx = p.x - cam.x;
          const sy = p.y - cam.y;
          if (sx < -4 || sy < -4 || sx > zw + 4 || sy > zh + 4) continue;
          ctx.fillStyle = "rgba(235,245,255,0.85)";
          ctx.fillRect(sx, sy, p.size, p.size);
        }
      }
    }

    // vignette страха
    if (st.chase && !st.escaped && st.fear > 20) {
      const v = Math.min(0.55, (st.fear - 20) / 120);
      const grd = ctx.createRadialGradient(zw / 2, zh / 2, zh * 0.2, zw / 2, zh / 2, zh * 0.75);
      grd.addColorStop(0, "rgba(40,0,10,0)");
      grd.addColorStop(1, `rgba(40,0,10,${v})`);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, zw, zh);
    }

    if (ascend >= 0 && ascend < 99) {
      const cover = Math.min(0.92, ascend / 2.4);
      ctx.fillStyle = `rgba(8, 14, 32,${cover})`;
      ctx.fillRect(0, 0, zw, zh);
      // лучи к луне
      ctx.save();
      ctx.globalAlpha = Math.min(0.7, ascend * 0.3);
      ctx.strokeStyle = "#a8c8ff";
      ctx.lineWidth = 3;
      for (let i = 0; i < 9; i++) {
        const ang = -Math.PI / 2 + (i - 4) * 0.08;
        ctx.beginPath();
        ctx.moveTo(zw / 2, zh * 0.85);
        ctx.lineTo(zw / 2 + Math.cos(ang) * zh, zh * 0.85 + Math.sin(ang) * zh);
        ctx.stroke();
      }
      ctx.restore();
      ctx.drawImage(S.bigMoon, zw / 2 - 44, 10, 88, 88);
      if (ascend > 1.0) {
        const a = Math.min(1, (ascend - 1.0) / 0.8);
        ctx.globalAlpha = a;
        ctx.drawImage(S.moonGirl, zw / 2 - 12, 36, 24, 24);
        ctx.globalAlpha = 1;
      }
    }

    if (dashFlash > 0) {
      ctx.fillStyle = `rgba(200,220,255,${dashFlash * 1.2})`;
      ctx.fillRect(0, 0, zw, zh);
    }

    if (ascend < 0) {
      if (st.act !== "izba") {
        ctx.fillStyle = "rgba(15,30,60,0.1)";
        ctx.fillRect(0, 0, zw, zh);
      } else {
        ctx.fillStyle = "rgba(80,50,20,0.08)";
        ctx.fillRect(0, 0, zw, zh);
      }
    }

    if (fade > 0) {
      ctx.fillStyle = `rgba(5,10,22,${Math.min(1, fade)})`;
      ctx.fillRect(0, 0, zw, zh);
    }

    ctx.restore();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    if (playing || ascend >= 0 || fade > 0) draw();
    requestAnimationFrame(frame);
  }

  function hasSave() {
    return window.GameSave.has();
  }

  function startNew() {
    AudioSFX.resume();
    window.GameSave.clear();
    st = defState();
    ui.menu.classList.add("hidden");
    ui.credits.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.settings.classList.add("hidden");
    paused = false;
    playing = true;
    praying = false;
    coverHintShown = false;
    ui.btnPause.classList.remove("hidden");
    goAct("izba", { instant: true });
    talk("intro");
    resize();
    draw();
  }

  function startContinue() {
    AudioSFX.resume();
    if (!load()) return startNew();
    ui.menu.classList.add("hidden");
    ui.pause.classList.add("hidden");
    ui.settings.classList.add("hidden");
    paused = false;

    if (st.act === "path" || st.act === "chase") st.act = "outside";
    // moon сейв — оставляем moon, если уже эпилог
    if (!ACTS[st.act]) st.act = "izba";

    if (st.finished) {
      playing = false;
      ui.btnPause.classList.add("hidden");
      ui.creditsText.textContent = st.badEnd
        ? "Молитва не успела… Попробуйте снова."
        : "Падчерица ушла на луну - и ведьмы её не достали.";
      ui.credits.classList.remove("hidden");
      return;
    }

    ui.credits.classList.add("hidden");
    playing = true;
    ui.btnPause.classList.remove("hidden");
    const act = st.act || "izba";
    const px = st.px,
      py = st.py;
    goAct(act, { instant: true, keepPos: true });
    if (px && py) {
      st.px = px;
      st.py = py;
    }
    applyPatches();
    if (act === "outside" && st.chase && !st.escaped) {
      startChase();
      st.px = px;
      st.py = py;
    } else if (act === "outside" && st.escaped) {
      witches = [
        { x: 10 * T, y: 24 * T, sp: 40, phase: 0 },
        { x: 16 * T, y: 25 * T, sp: 44, phase: 1 },
        { x: 13 * T, y: 22 * T, sp: 38, phase: 2 },
      ];
    }
    if (st.hasYoke && act === "izba") setObj("Выйдите наружу через дверь");
    if (st.metStepmother && !st.hasYoke && act === "izba") setObj("Возьмите коромысло у стены");
    refreshOutsideObjective();
    buildObjects();
    updateChaseHud();
    unstick();
    syncMusic();
    resize();
    draw();
  }

  function bindPad(el, dir) {
    const on = (e) => {
      e.preventDefault();
      AudioSFX.resume();
      if (Settings.get().swipeMove) return;
      pad[dir] = true;
      el.classList.add("pressed");
    };
    const off = (e) => {
      e.preventDefault();
      pad[dir] = false;
      el.classList.remove("pressed");
    };
    el.addEventListener("pointerdown", on);
    el.addEventListener("pointerup", off);
    el.addEventListener("pointercancel", off);
    el.addEventListener("pointerleave", off);
  }
  bindPad(document.getElementById("dUp"), "up");
  bindPad(document.getElementById("dDown"), "down");
  bindPad(document.getElementById("dLeft"), "left");
  bindPad(document.getElementById("dRight"), "right");

  // swipe movement on dpad area
  ui.dpad.addEventListener("pointerdown", (e) => {
    if (!Settings.get().swipeMove) return;
    e.preventDefault();
    AudioSFX.resume();
    swipeId = e.pointerId;
    swipeOrigin = { x: e.clientX, y: e.clientY };
    ui.dpad.setPointerCapture(e.pointerId);
  });
  ui.dpad.addEventListener("pointermove", (e) => {
    if (swipeId !== e.pointerId || !swipeOrigin) return;
    const dx = e.clientX - swipeOrigin.x;
    const dy = e.clientY - swipeOrigin.y;
    const dead = 18;
    pad.left = dx < -dead;
    pad.right = dx > dead;
    pad.up = dy < -dead;
    pad.down = dy > dead;
  });
  function endSwipe(e) {
    if (swipeId !== e.pointerId) return;
    swipeId = null;
    swipeOrigin = null;
    pad.left = pad.right = pad.up = pad.down = false;
  }
  ui.dpad.addEventListener("pointerup", endSwipe);
  ui.dpad.addEventListener("pointercancel", endSwipe);

  ui.btnAct.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    AudioSFX.resume();
    if (!ui.dialogue.classList.contains("hidden")) advanceDialogue();
    else {
      prayHold = true;
      interact();
    }
  });
  ui.btnAct.addEventListener("pointerup", () => {
    prayHold = false;
  });
  ui.btnAct.addEventListener("pointercancel", () => {
    prayHold = false;
  });
  ui.btnDash.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    AudioSFX.resume();
    tryDash();
  });
  ui.dlgNext.addEventListener("click", () => {
    AudioSFX.resume();
    advanceDialogue();
  });
  ui.btnNew.addEventListener("click", startNew);
  ui.btnContinue.addEventListener("click", startContinue);
  ui.btnMenu.addEventListener("click", () => {
    ui.credits.classList.add("hidden");
    ui.menu.classList.remove("hidden");
    ui.btnPause.classList.add("hidden");
    playing = false;
    paused = false;
    AudioSFX.setMusic("off");
  });
  ui.btnPause.addEventListener("click", () => {
    AudioSFX.resume();
    setPaused(true);
  });
  ui.btnResume.addEventListener("click", () => {
    AudioSFX.resume();
    setPaused(false);
  });
  ui.btnPauseMenu.addEventListener("click", () => {
    paused = false;
    playing = false;
    praying = false;
    ui.pause.classList.add("hidden");
    ui.menu.classList.remove("hidden");
    ui.btnPause.classList.add("hidden");
    ui.btnContinue.disabled = !hasSave();
    AudioSFX.fearOn(false);
    AudioSFX.setMusic("off");
  });
  ui.btnSettings.addEventListener("click", () => openSettings("menu"));
  ui.btnPauseSettings.addEventListener("click", () => openSettings("pause"));
  ui.btnSettingsBack.addEventListener("click", closeSettings);
  ["input", "change"].forEach((ev) => {
    ui.setMaster.addEventListener(ev, applySettingsFromUI);
    ui.setMusic.addEventListener(ev, applySettingsFromUI);
    ui.setSfx.addEventListener(ev, applySettingsFromUI);
    ui.setMute.addEventListener(ev, applySettingsFromUI);
    ui.setVibrate.addEventListener(ev, applySettingsFromUI);
    ui.setSwipe.addEventListener(ev, applySettingsFromUI);
  });

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    AudioSFX.resume();
    if (e.key === "Escape") {
      if (!ui.settings.classList.contains("hidden")) {
        closeSettings();
        return;
      }
      if (playing && ui.dialogue.classList.contains("hidden") && ascend < 0) {
        setPaused(!paused);
      }
      return;
    }
    if (paused) return;
    if (e.key === "e" || e.key === "E" || e.key === "Enter") {
      if (!ui.dialogue.classList.contains("hidden")) advanceDialogue();
      else {
        prayHold = true;
        interact();
      }
    }
    if (e.key === " ") {
      e.preventDefault();
      if (praying) prayHold = true;
      else tryDash();
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    if (e.key === "e" || e.key === "E" || e.key === "Enter" || e.key === " ") {
      if (!(keys.e || keys.E || keys.Enter || keys[" "])) prayHold = false;
    }
  });
  window.addEventListener("resize", () => {
    resize();
    if (playing) draw();
  });

  {
    const g = ui.menuArt.getContext("2d");
    const W = ui.menuArt.width;
    const H = ui.menuArt.height;
    g.imageSmoothingEnabled = false;
    g.fillStyle = "#0b1524";
    g.fillRect(0, 0, W, H);
    if (CP) CP.paintMenuFrame(g, W, H);
    // одна девушка — силуэт на луне (без второй снизу)
    g.drawImage(S.bigMoon, W / 2 - 48, 20, 96, 96);
    if (CP) {
      CP.draw(g, "zvezda", {
        x: W / 2,
        y: 60,
        scale: 4.4,
        color: "rgba(220,230,255,0.35)",
        lineWidth: 1.5,
      });
    }
    g.drawImage(S.moonGirl, W / 2 - 24, 44, 48, 48);
  }

  if (CP) {
    const pauseOrn = document.getElementById("pauseOrnament");
    const creditsOrn = document.getElementById("creditsOrnament");
    if (pauseOrn) {
      const g = pauseOrn.getContext("2d");
      g.clearRect(0, 0, pauseOrn.width, pauseOrn.height);
      CP.draw(g, "keske_iz_serdtsa", {
        x: pauseOrn.width / 2,
        y: pauseOrn.height / 2,
        scale: 2.4,
        color: "rgba(180,210,255,0.4)",
        lineWidth: 1.2,
      });
    }
    if (creditsOrn) {
      const g = creditsOrn.getContext("2d");
      g.clearRect(0, 0, creditsOrn.width, creditsOrn.height);
      CP.draw(g, "snezhinka1", {
        x: creditsOrn.width / 2,
        y: creditsOrn.height / 2,
        scale: 6.0,
        color: "rgba(200,220,255,0.4)",
        lineWidth: 1.5,
      });
      CP.draw(g, "serdtse", {
        x: creditsOrn.width / 2,
        y: creditsOrn.height / 2 + 8,
        scale: 6.6,
        color: "rgba(220,180,200,0.55)",
        lineWidth: 1.6,
      });
    }
  }

  syncSettingsUI();
  ui.btnContinue.disabled = !hasSave();
  window.GameSave.scrubOld();
  resize();
  requestAnimationFrame(frame);
})();
