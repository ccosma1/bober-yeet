(() => {
  const WORLD_W = 1280;
  const WORLD_H = 720;
  const WATER_Y = 676;
  const GRAV = 0.2;
  const WIND_K = 0.014;
  const BOBER_R = 24;
  const DRAW_H = 72;
  const HP_MAX = 100;
  const MAX_PULL = 140;
  const TUT_KEY = "bober-yeet-war-tut";
  const COIN_KEY = "bober-yeet-war-coins";
  const AMMO_KEY = "bober-yeet-war-ammo";
  const FAST = /(?:\?|&)selftest=1(?:&|$)/.test(location.search);
  const CPU_THINK = FAST ? 180 : 900;
  const CPU_SHOW = FAST ? 220 : 800;
  const DYN_COST = 35;
  const SAP_COST = 30;
  const MORTAR_COST = 45;
  const ICE_COST = 28;
  const START_COINS = 80;
  const CRATE_EVERY = 3;
  const FUSE_SEC = 2;
  const SAP_DOT = 8;
  const SAP_TICKS = 2;
  const MAP_KEY = "bober-yeet-war-map";
  const GRANT_KEY = "bober-yeet-war-p2grant";
  const PAID = ["dynamite", "sap", "mortar", "ice"];
  const LEDGES_PAD = 140;
  const BOWL_PAD = 220;

  const WEAPONS = {
    stick: { id: "stick", name: "Yeet Stick", dmg: 25, blast: 28, r: 7, inf: true },
    snow: { id: "snow", name: "Snowball", dmg: 15, blast: 36, r: 9, inf: true },
    dynamite: { id: "dynamite", name: "Dynamite", dmg: 45, blast: 48, r: 10, fuse: FUSE_SEC, cost: DYN_COST },
    sap: { id: "sap", name: "Sap Bomb", dmg: 30, blast: 40, r: 9, dot: SAP_DOT, ticks: SAP_TICKS, cost: SAP_COST },
    mortar: { id: "mortar", name: "Lodge Mortar", dmg: 38, blast: 42, r: 9, cost: MORTAR_COST, lob: true },
    ice: { id: "ice", name: "Ice Brace", dmg: 0, blast: 8, r: 8, cost: ICE_COST, wall: true },
  };

  const MAPS = {
    bowl: {
      id: "bowl",
      name: "Lodge Bowl",
      spawn: { lodge: [150, 250, 340], creek: [940, 1040, 1140] },
    },
    ledges: {
      id: "ledges",
      name: "Twin Ledges",
      spawn: { lodge: [140, 230, 320], creek: [960, 1050, 1140] },
    },
  };

  const LODGE_NAMES = ["Pip", "Nibs", "Paddle"];
  const CREEK_NAMES = ["Rime", "Chip", "Gnaw"];

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const splash = document.getElementById("splash");
  const endcard = document.getElementById("endcard");
  const toastEl = document.getElementById("toast");
  const hudTop = document.getElementById("hud-top");
  const dock = document.getElementById("dock");
  const turnChip = document.getElementById("turn-chip");
  const windFlag = document.getElementById("wind-flag");
  const windVal = document.getElementById("wind-val");
  const phaseChip = document.getElementById("phase-chip");
  const coinChip = document.getElementById("coin-chip");
  const muteBtn = document.getElementById("btn-mute");
  const leaveBtn = document.getElementById("btn-leave");
  const playBtn = document.getElementById("btn-play");
  const fireBtn = document.getElementById("btn-fire");
  const powerFill = document.getElementById("power-fill");
  const powerNum = document.getElementById("power-num");
  const endTitle = document.getElementById("end-title");
  const endMsg = document.getElementById("end-msg");
  const endRestart = document.getElementById("end-restart");
  const aimTutEl = document.getElementById("aim-tut");
  const aimTutOk = document.getElementById("aim-tut-ok");
  const tipStrip = document.getElementById("tip-strip");
  const howtoEl = document.getElementById("howto");
  const shopEl = document.getElementById("shop");

  const img = {};
  const bits = [];
  const pops = [];

  const terrain = document.createElement("canvas");
  terrain.width = WORLD_W;
  terrain.height = WORLD_H;
  const tctx = terrain.getContext("2d", { willReadFrequently: true });
  const under = document.createElement("canvas");
  under.width = WORLD_W;
  under.height = WORLD_H;
  const uctx = under.getContext("2d");
  const mask = new Uint8Array(WORLD_W * WORLD_H);

  let phase = "splash";
  let turn = "lodge";
  let turnN = 0;
  let wind = 0;
  let weapon = "stick";
  let angle = -0.95;
  let power = 50;
  let activeId = 0;
  let bobers = [];
  let shot = null;
  let lastBlast = null;
  let craterCount = 0;
  let settleT = 0;
  let cpuT = 0;
  let cpuReady = false;
  let dragging = false;
  let dragPos = null;
  let dragStart = null;
  let toastT = 0;
  let waveT = 0;
  let acc = 0;
  let lastTs = 0;
  let running = false;
  let camX = 0;
  let camY = 0;
  let camS = 1;
  let camInit = false;
  let view = { s: 1, camX: 0, camY: 0, cssW: 1, cssH: 1 };
  let winner = null;
  let aimTutOn = false;
  let endDelay = 0;
  let userPanX = 0;
  let panning = false;
  let panLast = null;
  let aimDrag = false;
  let coins = 0;
  let matchCoins = 0;
  let ammo = {
    lodge: { dynamite: 0, sap: 0, mortar: 0, ice: 0 },
    creek: { dynamite: 0, sap: 0, mortar: 0, ice: 0 },
  };
  let crates = [];
  let fuses = [];
  let walls = [];
  let mapId = "bowl";
  let shopFrom = "splash";
  let howtoFrom = "splash";
  let shopOpen = false;

  function $(id) {
    return document.getElementById(id);
  }

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  function emptyAmmo() {
    return { dynamite: 0, sap: 0, mortar: 0, ice: 0 };
  }

  function loadCoins() {
    const n = parseInt(localStorage.getItem(COIN_KEY) || String(START_COINS), 10);
    coins = Number.isFinite(n) && n >= 0 ? n : START_COINS;
    if (!localStorage.getItem(GRANT_KEY)) {
      coins = Math.max(coins, START_COINS);
      localStorage.setItem(GRANT_KEY, "1");
    }
    try {
      const raw = JSON.parse(localStorage.getItem(AMMO_KEY) || "{}");
      PAID.forEach((id) => {
        ammo.lodge[id] = Math.max(0, raw[id] | 0);
      });
    } catch (_) {}
    const m = localStorage.getItem(MAP_KEY);
    if (m && MAPS[m]) mapId = m;
  }

  function saveCoins() {
    localStorage.setItem(COIN_KEY, String(coins));
    localStorage.setItem(AMMO_KEY, JSON.stringify({
      dynamite: ammo.lodge.dynamite,
      sap: ammo.lodge.sap,
      mortar: ammo.lodge.mortar,
      ice: ammo.lodge.ice,
    }));
    localStorage.setItem(MAP_KEY, mapId);
  }

  function addCoins(n) {
    if (!n) return;
    coins += n;
    matchCoins += n;
    saveCoins();
    hud();
  }

  function toast(text, fail) {
    toastEl.textContent = text;
    toastEl.classList.toggle("fail", !!fail);
    toastEl.classList.add("show");
    toastT = 1.2;
  }

  function pop(x, y, text, color) {
    pops.push({ x, y, text, color, t: 0.8 });
  }

  function burst(x, y, kind) {
    const n = kind === "snow" ? 14 : kind === "sap" ? 12 : 10;
    for (let i = 0; i < n; i++) {
      bits.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.8) * 8,
        w: 5 + Math.random() * 7,
        h: 4 + Math.random() * 6,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        life: 0.4 + Math.random() * 0.45,
        kind,
      });
    }
  }

  function wallAt(x, y) {
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (w.hp <= 0) continue;
      if (x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h) return w;
    }
    return null;
  }

  function solid(x, y) {
    const ix = x | 0;
    const iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= WORLD_W || iy >= WORLD_H) return false;
    if (mask[iy * WORLD_W + ix] === 1) return true;
    return !!wallAt(ix, iy);
  }

  function rebuildMask() {
    const data = tctx.getImageData(0, 0, WORLD_W, WORLD_H).data;
    for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
      mask[i] = data[p + 3] > 40 ? 1 : 0;
    }
  }

  function smooth(t, a, b) {
    const x = clamp((t - a) / (b - a), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function hillPts(keys) {
    const pts = [];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      const steps = Math.max(4, ((b[0] - a[0]) / 8) | 0);
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        const tt = t * t * (3 - 2 * t);
        pts.push({ x: a[0] + (b[0] - a[0]) * tt, y: a[1] + (b[1] - a[1]) * tt });
      }
    }
    pts.push({ x: keys[keys.length - 1][0], y: keys[keys.length - 1][1] });
    return pts;
  }

  function fillMound(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, WATER_Y + 24);
    ctx.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.lineTo(pts[pts.length - 1].x, WATER_Y + 24);
    ctx.closePath();
    const topY = pts.reduce((m, p) => Math.min(m, p.y), WORLD_H);
    const g = ctx.createLinearGradient(0, topY, 0, WATER_Y);
    g.addColorStop(0, "#d4b896");
    g.addColorStop(0.08, "#c4a06a");
    g.addColorStop(0.22, "#a56c38");
    g.addColorStop(0.55, "#8B5A2B");
    g.addColorStop(0.82, "#5c3818");
    g.addColorStop(1, "#3a2410");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let y = topY | 0; y < WATER_Y + 8; y += 14) {
      ctx.fillStyle = ((y / 14) | 0) % 2 ? "rgba(62, 36, 16, 0.22)" : "rgba(212, 176, 120, 0.14)";
      ctx.fillRect(0, y, WORLD_W, 7);
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "#2a160c";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function snowCap(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "#e8d4a8";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.strokeStyle = "#fff6e0";
    ctx.lineWidth = 12;
    ctx.stroke();
    ctx.strokeStyle = "#fffef8";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  function drawIceBridge(ctx) {
    const x0 = 508;
    const x1 = 772;
    const deck = 468;
    const rise = 18;
    const thick = 24;
    ctx.beginPath();
    ctx.moveTo(x0, deck);
    ctx.quadraticCurveTo((x0 + x1) / 2, deck - rise, x1, deck);
    ctx.lineTo(x1 + 6, deck + 6);
    ctx.lineTo(x1, deck + thick);
    ctx.quadraticCurveTo((x0 + x1) / 2, deck - rise + thick + 6, x0, deck + thick);
    ctx.lineTo(x0 - 6, deck + 6);
    ctx.closePath();
    const g = ctx.createLinearGradient(0, deck - rise, 0, deck + thick);
    g.addColorStop(0, "#f7fcff");
    g.addColorStop(0.35, "#c5e0f0");
    g.addColorStop(1, "#6a9bb0");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#2a160c";
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 + 8, deck + 2);
    ctx.quadraticCurveTo((x0 + x1) / 2, deck - rise + 4, x1 - 8, deck + 2);
    ctx.strokeStyle = "#fffef8";
    ctx.lineWidth = 6;
    ctx.stroke();
  }

  function paintMoundFallback() {
    let left;
    let right;
    if (mapId === "ledges") {
      left = hillPts([
        [0, 560],
        [36, 500],
        [80, 448],
        [140, 428],
        [220, 422],
        [310, 426],
        [390, 438],
        [460, 478],
        [510, 530],
        [548, WATER_Y + 4],
      ]);
      right = hillPts([
        [732, WATER_Y + 4],
        [770, 530],
        [820, 478],
        [890, 438],
        [970, 426],
        [1060, 422],
        [1140, 428],
        [1200, 448],
        [1244, 500],
        [1280, 560],
      ]);
    } else {
      left = hillPts([
        [0, 580],
        [40, 520],
        [90, 470],
        [160, 442],
        [250, 432],
        [340, 438],
        [420, 470],
        [490, 540],
        [540, WATER_Y + 4],
      ]);
      right = hillPts([
        [740, WATER_Y + 4],
        [790, 540],
        [860, 470],
        [940, 438],
        [1030, 432],
        [1120, 442],
        [1190, 470],
        [1240, 520],
        [1280, 580],
      ]);
    }
    fillMound(tctx, left);
    fillMound(tctx, right);
    snowCap(tctx, left);
    snowCap(tctx, right);
    if (mapId === "ledges") drawIceBridge(tctx);
  }

  function makeTerrain() {
    tctx.clearRect(0, 0, WORLD_W, WORLD_H);
    tctx.imageSmoothingEnabled = true;
    tctx.imageSmoothingQuality = "high";
    tctx.lineJoin = "round";
    tctx.lineCap = "round";
    const plate = mapId === "ledges" ? img.ledges : img.bowl;
    const pad = mapId === "ledges" ? LEDGES_PAD : BOWL_PAD;
    if (plate && plate.width) {
      tctx.drawImage(plate, 0, pad);
    } else {
      paintMoundFallback();
    }
    uctx.clearRect(0, 0, WORLD_W, WORLD_H);
    uctx.fillStyle = "#4a2810";
    uctx.fillRect(0, 0, WORLD_W, WORLD_H);
    uctx.globalCompositeOperation = "destination-in";
    uctx.drawImage(terrain, 0, 0);
    uctx.globalCompositeOperation = "source-over";
    rebuildMask();
  }

  function surfaceY(x) {
    const x0 = clamp(x | 0, 0, WORLD_W - 1);
    for (let y = 0; y < WATER_Y; y++) {
      if (solid(x0, y)) return y;
    }
    return WATER_Y;
  }

  function carve(cx, cy, r) {
    tctx.save();
    tctx.globalCompositeOperation = "destination-out";
    tctx.beginPath();
    tctx.arc(cx, cy, r, 0, Math.PI * 2);
    tctx.fill();
    for (let i = 0; i < 6; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = r * (0.28 + Math.random() * 0.42);
      tctx.beginPath();
      tctx.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, rr, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.restore();
    rebuildMask();
    craterCount += 1;
    hurtWalls(cx, cy, r, 28);
  }

  function hurtWalls(cx, cy, r, dmg) {
    for (let i = walls.length - 1; i >= 0; i--) {
      const w = walls[i];
      const wx = w.x + w.w / 2;
      const wy = w.y + w.h / 2;
      if (Math.hypot(wx - cx, wy - cy) > r + 22) continue;
      w.hp -= dmg;
      pop(wx, w.y - 8, w.hp > 0 ? "ICE " + w.hp : "MELT", "#a8d8ff");
      if (w.hp <= 0) walls.splice(i, 1);
    }
  }

  function placeIceWall(x, y) {
    const gy = surfaceY(x);
    const top = Math.min(gy, y + 8);
    const wall = {
      x: clamp((x - 18) | 0, 8, WORLD_W - 44),
      y: clamp((top - 48) | 0, 40, WATER_Y - 50),
      w: 36,
      h: 48,
      hp: 60,
      bornTurn: turnN,
    };
    walls.push(wall);
    pop(wall.x + 18, wall.y - 8, "ICE BRACE", "#a8d8ff");
    BoberSfx.chip();
    return wall;
  }

  function meltOldWalls() {
    walls = walls.filter((w) => {
      if (turnN - w.bornTurn >= 2) {
        pop(w.x + 18, w.y, "MELT", "#a8d8ff");
        return false;
      }
      return true;
    });
  }

  function living(team) {
    return bobers.filter((b) => b.alive && (!team || b.team === team));
  }

  function getActive() {
    return bobers.find((b) => b.id === activeId) || living(turn)[0] || null;
  }

  function pickActive(team) {
    const list = living(team);
    if (!list.length) return;
    const keep = list.find((b) => b.id === activeId);
    const b = keep || list[0];
    activeId = b.id;
    b.facing = team === "lodge" ? 1 : -1;
  }

  function spawnCrew() {
    bobers = [];
    const spec = MAPS[mapId] || MAPS.bowl;
    const spots = [
      { team: "lodge", xs: spec.spawn.lodge, names: LODGE_NAMES, facing: 1 },
      { team: "creek", xs: spec.spawn.creek, names: CREEK_NAMES, facing: -1 },
    ];
    let id = 0;
    spots.forEach((side) => {
      side.xs.forEach((x, i) => {
        const y = surfaceY(x) - BOBER_R;
        bobers.push({
          id: id++,
          name: side.names[i],
          team: side.team,
          x,
          y,
          vx: 0,
          vy: 0,
          hp: HP_MAX,
          alive: true,
          facing: side.facing,
          standing: true,
          airborne: false,
          walkT: 0,
          walkDir: 0,
          sapTicks: 0,
          sapT: 0,
        });
      });
    });
  }

  function randWind() {
    return (Math.random() * 9 | 0) - 4;
  }

  function teamAmmo(team, id) {
    if (WEAPONS[id] && WEAPONS[id].inf) return 99;
    return (ammo[team] && ammo[team][id]) || 0;
  }

  function setWeapon(id) {
    if (!WEAPONS[id]) return false;
    if (!WEAPONS[id].inf && teamAmmo(turn, id) <= 0) return false;
    weapon = id;
    ["stick", "snow", "dynamite", "sap", "mortar", "ice"].forEach((w) => {
      const el = $("w-" + w);
      if (el) el.classList.toggle("on", w === id);
    });
    return true;
  }

  function setAim(rad, pwr) {
    angle = rad;
    power = clamp(pwr, 0, 100);
    hudAim();
  }

  function hudAim() {
    if (powerFill) powerFill.style.width = power + "%";
    if (powerNum) powerNum.textContent = String(Math.round(power));
  }

  function hud() {
    const cpu = turn === "creek";
    turnChip.textContent = cpu ? "CREEK" : "LODGE";
    const wtxt = wind === 0 ? "WIND 0" : wind > 0 ? "WIND +" + wind : "WIND " + wind;
    windVal.textContent = wtxt;
    windFlag.className = wind === 0 ? "calm" : wind < 0 ? "left" : "right";
    const labels = { aim: "AIM", fly: "YEET", settle: "SETTLE", cpu: "CPU", end: "END", fuse: "FUSE", ending: "END" };
    phaseChip.textContent = labels[phase] || phase.toUpperCase();
    if (coinChip) coinChip.textContent = "$BOBER " + coins;
    const mapChip = $("map-chip");
    if (mapChip) mapChip.textContent = (MAPS[mapId] || MAPS.bowl).name.toUpperCase();
    PAID.forEach((id) => {
      const n = teamAmmo("lodge", id);
      const el = $("ammo-" + id);
      if (el) el.textContent = String(n);
      const btn = $("w-" + id);
      if (btn) btn.classList.toggle("out", n <= 0);
    });
    const canFire = phase === "aim" && turn === "lodge" && !aimTutOn;
    fireBtn.disabled = !canFire;
    fireBtn.textContent = phase === "cpu" ? "CPU…" : phase === "fly" || phase === "fuse" ? "YEET" : "FIRE";
    if (tipStrip) {
      const showTip = (phase === "aim" || phase === "cpu") && turnN <= 2;
      tipStrip.classList.toggle("hidden", !showTip);
    }
    hudAim();
    hudShop();
  }

  function hudShop() {
    const sc = $("shop-coins");
    if (sc) sc.textContent = "$BOBER " + coins;
    const ids = [
      ["shop-dyn-n", "dynamite", "buy-dynamite", DYN_COST],
      ["shop-sap-n", "sap", "buy-sap", SAP_COST],
      ["shop-mortar-n", "mortar", "buy-mortar", MORTAR_COST],
      ["shop-ice-n", "ice", "buy-ice", ICE_COST],
    ];
    ids.forEach((row) => {
      const nEl = $(row[0]);
      if (nEl) nEl.textContent = String(ammo.lodge[row[1]] || 0);
      const b = $(row[2]);
      if (b) b.disabled = coins < row[3];
    });
    syncMapCards();
  }

  function syncMapCards() {
    document.querySelectorAll(".map-card").forEach((el) => {
      el.classList.toggle("on", el.getAttribute("data-map") === mapId);
    });
  }

  function setMap(id) {
    if (!MAPS[id]) return;
    mapId = id;
    localStorage.setItem(MAP_KEY, mapId);
    syncMapCards();
    hud();
  }

  function updateMuteBtn() {
    muteBtn.setAttribute("aria-pressed", BoberSfx.muted ? "true" : "false");
    muteBtn.textContent = BoberSfx.muted ? "🔇" : "🔊";
    muteBtn.title = BoberSfx.muted ? "Unmute" : "Mute";
  }

  function rollCrateKind() {
    const r = Math.random();
    if (r < 0.2) return "mortar";
    if (r < 0.45) return "ice";
    if (r < 0.75) return "dynamite";
    if (r < 0.95) return "sap";
    return "coin";
  }

  function spawnCrate(kind, x) {
    const kinds = ["dynamite", "sap", "coin", "mortar", "ice"];
    const k = kind && kinds.indexOf(kind) >= 0 ? kind : rollCrateKind();
    let cx = x;
    if (cx == null) {
      const left = Math.random() < 0.5;
      cx = left ? 90 + Math.random() * 280 : 900 + Math.random() * 280;
    }
    for (let tries = 0; tries < 14; tries++) {
      const gy = surfaceY(cx);
      const blocked =
        gy >= WATER_Y - 8 ||
        bobers.some((b) => b.alive && Math.hypot(b.x - cx, b.y - (gy - BOBER_R)) < 44);
      if (!blocked) {
        const crate = { x: cx, y: gy - 18, kind: k, life: 1 };
        crates.push(crate);
        pop(crate.x, crate.y - 24, "CRATE", "#ffe566");
        return crate;
      }
      cx = Math.random() < 0.5 ? 80 + Math.random() * 300 : 880 + Math.random() * 300;
    }
    return null;
  }

  function pickupCrates(b) {
    if (!b.alive) return;
    for (let i = crates.length - 1; i >= 0; i--) {
      const c = crates[i];
      if (Math.hypot(c.x - b.x, c.y - b.y) > 36) continue;
      crates.splice(i, 1);
      BoberSfx.pop();
      if (c.kind === "coin") {
        if (b.team === "lodge") {
          addCoins(10);
          pop(c.x, c.y, "+10 $BOBER", "#ffe566");
        } else pop(c.x, c.y, "NICKED", "#a8c4e8");
      } else {
        ammo[b.team][c.kind] = (ammo[b.team][c.kind] || 0) + 1;
        saveCoins();
        const tag = { sap: "SAP +1", dynamite: "DYN +1", mortar: "MORTAR +1", ice: "ICE +1" };
        pop(c.x, c.y, tag[c.kind] || "+1", "#ffe566");
      }
      hud();
    }
  }

  function beginTurn(team) {
    turn = team;
    turnN += 1;
    wind = randWind();
    shot = null;
    dragging = false;
    meltOldWalls();
    if (turnN > 0 && turnN % CRATE_EVERY === 0) spawnCrate();
    if (team === "lodge") {
      phase = "aim";
      pickActive("lodge");
      const a = getActive();
      if (a) {
        angle = -0.95;
        a.facing = 1;
        pickupCrates(a);
      }
      if (!WEAPONS[weapon] || (!WEAPONS[weapon].inf && teamAmmo("lodge", weapon) <= 0)) weapon = "stick";
      setWeapon(weapon);
      power = 50;
      BoberSfx.turn();
      toast("LODGE TURN");
    } else {
      phase = "cpu";
      pickActive("creek");
      cpuT = 0;
      cpuReady = false;
      toast("CREEK TURN");
    }
    hud();
  }

  function speedFromPower() {
    if (weapon === "mortar") return 3.6 + power * 0.11;
    if (weapon === "ice") return 2.4 + power * 0.12;
    return 2.2 + power * 0.172;
  }

  function launchVel(ang, pwr, id) {
    const oldW = weapon;
    weapon = id || weapon;
    const spd = 2.2 + pwr * 0.172;
    let vx, vy, grav;
    if (id === "mortar" || weapon === "mortar") {
      const mspd = 8 + pwr * 0.12;
      vx = Math.cos(ang) * mspd;
      vy = -3.6 + Math.sin(ang) * 0.9;
      if (vy > -2.6) vy = -2.6;
      grav = GRAV;
    } else if (id === "ice" || weapon === "ice") {
      const ispd = 2.4 + pwr * 0.12;
      vx = Math.cos(ang) * ispd * 0.72;
      vy = Math.sin(ang) * ispd * 0.88;
      grav = GRAV;
    } else {
      vx = Math.cos(ang) * (2.2 + pwr * 0.172);
      vy = Math.sin(ang) * (2.2 + pwr * 0.172);
      grav = GRAV;
    }
    weapon = oldW;
    return { vx, vy, grav };
  }

  function tryFire() {
    if (phase !== "aim" && phase !== "cpu") return false;
    if (phase === "aim" && turn !== "lodge") return false;
    const b = getActive();
    if (!b || !b.alive) return false;
    const wpn = WEAPONS[weapon];
    if (!wpn) return false;
    if (!wpn.inf) {
      if (teamAmmo(b.team, wpn.id) <= 0) {
        toast("NO CHARGE", true);
        return false;
      }
      ammo[b.team][wpn.id] -= 1;
      saveCoins();
    }
    const nose = BOBER_R + 10;
    const vel = launchVel(angle, power, wpn.id);
    shot = {
      x: b.x + Math.cos(angle) * nose,
      y: b.y + Math.sin(angle) * nose,
      vx: vel.vx,
      vy: vel.vy,
      grav: vel.grav,
      r: wpn.r,
      weapon: wpn.id,
      owner: b.id,
      team: b.team,
      age: 0,
    };
    phase = "fly";
    dragging = false;
    BoberSfx.yeet();
    hud();
    return true;
  }

  function drown(b, why) {
    if (!b.alive) return;
    b.alive = false;
    b.hp = 0;
    b.vx = 0;
    b.vy = 0;
    b.airborne = false;
    BoberSfx.splash();
    pop(b.x, b.y, why || "SPLASH", "#8ad4ff");
    maybeEnd();
  }

  function kill(b) {
    if (!b.alive) return;
    b.alive = false;
    b.hp = 0;
    b.vx = 0;
    b.airborne = false;
    BoberSfx.splat();
    pop(b.x, b.y - 20, "YEETED", "#ff8ad0");
    maybeEnd();
  }

  function explode(x, y, wpnId, fromTeam) {
    const wpn = WEAPONS[wpnId] || WEAPONS.stick;
    const r = wpn.blast;
    const dmgMax = wpn.dmg;
    carve(x, y, r);
    burst(x, y, wpn.id === "snow" ? "snow" : wpn.id === "sap" ? "sap" : "dirt");
    BoberSfx.boom();
    const hits = [];
    bobers.forEach((b) => {
      if (!b.alive) return;
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist >= r + BOBER_R * 0.35) return;
      const fall = clamp(1 - dist / r, 0, 1);
      const dmg = Math.max(1, Math.round(dmgMax * fall));
      b.hp -= dmg;
      hits.push({ id: b.id, name: b.name, dmg });
      pop(b.x, b.y - 28, "-" + dmg, "#ffe566");
      BoberSfx.hurt();
      const ang = Math.atan2(b.y - y, b.x - x);
      const k = fall;
      b.vx += Math.cos(ang) * k * 6.2;
      b.vy += Math.sin(ang) * k * 4.4 - 2.2;
      b.standing = false;
      b.airborne = true;
      b.walkT = 0;
      if (wpn.id === "sap") {
        b.sapTicks = SAP_TICKS;
        b.sapT = 0.9;
      }
      if (fromTeam === "lodge") addCoins(Math.max(1, Math.floor(dmg / 5)));
      if (b.hp <= 0) {
        if (fromTeam === "lodge") addCoins(8);
        kill(b);
      }
    });
    lastBlast = { x, y, r, dmg: dmgMax, weapon: wpn.id, hits };
    shot = null;
    phase = "settle";
    settleT = 0;
    hud();
    maybeEnd();
  }

  function plantFuse(x, y, wpnId, team) {
    fuses.push({ x, y, t: FUSE_SEC, weapon: wpnId, team });
    shot = null;
    phase = "fuse";
    BoberSfx.tick();
    pop(x, y - 16, "FUSE", "#ff8a4a");
    hud();
  }

  function splashShot() {
    if (shot) {
      burst(shot.x, WATER_Y, "snow");
      BoberSfx.splash();
    }
    shot = null;
    phase = "settle";
    settleT = 0.35;
    hud();
  }

  function onShotHit(x, y) {
    if (!shot) return;
    if (shot.weapon === "dynamite") plantFuse(x, y, "dynamite", shot.team);
    else if (shot.weapon === "ice") {
      placeIceWall(x, y);
      shot = null;
      phase = "settle";
      settleT = 0.2;
      hud();
    } else explode(x, y, shot.weapon, shot.team);
  }

  function stepShot() {
    if (!shot) return;
    shot.vx += wind * WIND_K;
    shot.vy += shot.grav || GRAV;
    const steps = Math.max(1, Math.ceil(Math.hypot(shot.vx, shot.vy) / 4));
    for (let i = 0; i < steps; i++) {
      shot.x += shot.vx / steps;
      shot.y += shot.vy / steps;
      shot.age += 1 / steps;
      if (shot.y >= WATER_Y) {
        splashShot();
        return;
      }
      if (shot.x < -40 || shot.x > WORLD_W + 40 || shot.y < -120) {
        shot = null;
        phase = "settle";
        settleT = 0.25;
        hud();
        return;
      }
      if (solid(shot.x, shot.y)) {
        onShotHit(shot.x, shot.y);
        return;
      }
      for (let k = 0; k < bobers.length; k++) {
        const b = bobers[k];
        if (!b.alive) continue;
        if (shot.age < 6 && b.id === shot.owner) continue;
        if (Math.hypot(b.x - shot.x, b.y - shot.y) < BOBER_R + shot.r) {
          onShotHit(shot.x, shot.y);
          return;
        }
      }
    }
  }

  function stepFuses(dt) {
    for (let i = fuses.length - 1; i >= 0; i--) {
      const f = fuses[i];
      f.t -= dt;
      if (f.t <= 0) {
        fuses.splice(i, 1);
        explode(f.x, f.y, f.weapon, f.team);
      }
    }
  }

  function snapStand(b) {
    const gy = surfaceY(b.x);
    if (gy >= WATER_Y) {
      drown(b, "SPLASH");
      return false;
    }
    b.y = gy - BOBER_R;
    b.vx = 0;
    b.vy = 0;
    b.standing = true;
    b.airborne = false;
    return true;
  }

  function stepBober(b) {
    if (b.alive && b.sapTicks > 0) {
      b.sapT -= 1 / 60;
      if (b.sapT <= 0) {
        b.sapTicks -= 1;
        b.sapT = 0.9;
        b.hp -= SAP_DOT;
        pop(b.x, b.y - 28, "-" + SAP_DOT, "#e8a020");
        if (b.hp <= 0) kill(b);
      }
    }
    if (!b.alive) {
      b.vy += GRAV * 0.85;
      b.y += b.vy;
      const g = surfaceY(b.x);
      if (b.y + BOBER_R >= g && g < WATER_Y) {
        b.y = g - BOBER_R;
        b.vy = 0;
        b.vx = 0;
      }
      if (b.y - 4 > WATER_Y) b.y = WATER_Y + 40;
      return;
    }
    if (b.walkT > 0) {
      b.walkT -= 1 / 60;
      b.x = clamp(b.x + b.walkDir * 1.55, 18, WORLD_W - 18);
      if (!snapStand(b)) return;
      pickupCrates(b);
      return;
    }
    if (!b.airborne) {
      const gy = surfaceY(b.x);
      if (gy >= WATER_Y) {
        drown(b, "SPLASH");
        return;
      }
      if (gy - BOBER_R > b.y + 10) {
        b.airborne = true;
        b.standing = false;
        b.vy = 0.15;
      } else {
        b.y = gy - BOBER_R;
        b.vx = 0;
        b.vy = 0;
        b.standing = true;
        pickupCrates(b);
        return;
      }
    }
    b.vy += GRAV;
    b.x += b.vx;
    b.y += b.vy;
    b.x = clamp(b.x, 18, WORLD_W - 18);
    if (b.y - BOBER_R > WATER_Y || b.y > WATER_Y + 8) {
      drown(b, "SPLASH");
      return;
    }
    const feet = b.y + BOBER_R;
    if (b.vy >= 0 && (solid(b.x, feet) || solid(b.x - 10, feet) || solid(b.x + 10, feet))) {
      if (Math.abs(b.vx) < 0.85 && b.vy < 4.5) {
        snapStand(b);
        pickupCrates(b);
      } else {
        let gy = feet;
        for (let i = 0; i < 28; i++) {
          if (!solid(b.x, gy) && !solid(b.x - 8, gy) && !solid(b.x + 8, gy)) break;
          gy -= 1;
        }
        b.y = gy - BOBER_R;
        b.vy *= -0.12;
        b.vx *= 0.35;
        if (Math.abs(b.vx) < 0.5 && Math.abs(b.vy) < 0.5) snapStand(b);
      }
    } else {
      b.standing = false;
    }
  }

  function walkActive(dir) {
    const b = getActive();
    if (!b || !b.alive || phase !== "aim" || turn !== "lodge") return;
    if (b.airborne) return;
    b.walkDir = dir < 0 ? -1 : 1;
    b.walkT = 0.28;
    b.facing = b.walkDir;
    b.airborne = false;
  }

  function allSettled() {
    return living().every((b) => b.standing && !b.airborne && Math.abs(b.vx) < 0.2 && Math.abs(b.vy) < 0.2) && fuses.length === 0;
  }

  function checkWin() {
    const lodgeN = living("lodge").length;
    const creekN = living("creek").length;
    if (lodgeN > 0 && creekN > 0) return null;
    if (lodgeN === 0 && creekN === 0) return "draw";
    if (creekN === 0) return "lodge";
    return "creek";
  }

  function maybeEnd() {
    if (phase === "end" || phase === "splash" || phase === "ending") return false;
    const who = checkWin();
    if (!who) return false;
    phase = "ending";
    endDelay = 0.4;
    shot = null;
    fuses.length = 0;
    dragging = false;
    hud();
    return true;
  }

  function endMatch(who) {
    if (phase === "end") return;
    winner = who;
    phase = "end";
    shot = null;
    fuses.length = 0;
    running = true;
    hudTop.classList.remove("live");
    dock.classList.add("hidden");
    if (tipStrip) tipStrip.classList.add("hidden");
    if (who === "lodge") {
      addCoins(20);
      endTitle.textContent = "YOU WIN";
      endMsg.textContent = "Bank cleared. Lodge still standing.";
      BoberSfx.win();
    } else if (who === "creek") {
      addCoins(4);
      endTitle.textContent = "YOU LOSE";
      endMsg.textContent = "Crew down. Creek took the bank.";
      BoberSfx.fail();
    } else {
      endTitle.textContent = "DRAW";
      endMsg.textContent = "Everybody yeeted. The bank is empty.";
      BoberSfx.fail();
    }
    const ec = $("end-coins");
    if (ec) ec.textContent = "This match +" + matchCoins + " · bag $BOBER " + coins;
    endcard.classList.remove("hidden");
    hud();
  }

  function finishSettle() {
    const who = checkWin();
    if (who) {
      endMatch(who);
      return;
    }
    userPanX = 0;
    beginTurn(turn === "lodge" ? "creek" : "lodge");
  }

  function guessCpuAim(me, target) {
    const dx = target.x - me.x;
    const dy = target.y - me.y;
    const dist = Math.hypot(dx, dy);
    let ang = Math.atan2(dy - 130, dx);
    let pwr = 30 + dist * 0.052 + Math.abs(wind) * 2.2;
    if (wind * Math.sign(dx) < 0) pwr += 8;
    if (wind * Math.sign(dx) > 0) pwr -= 3;
    ang += (Math.random() - 0.5) * 0.3;
    pwr += (Math.random() - 0.5) * 16;
    if (ang > 0) ang = -Math.abs(ang);
    return { angle: ang, power: clamp(pwr, 22, 86) };
  }

  function cpuPickWeapon() {
    if (teamAmmo("creek", "mortar") > 0 && Math.random() < 0.22) return "mortar";
    if (teamAmmo("creek", "ice") > 0 && Math.random() < 0.18) return "ice";
    if (teamAmmo("creek", "dynamite") > 0 && Math.random() < 0.28) return "dynamite";
    if (teamAmmo("creek", "sap") > 0 && Math.random() < 0.28) return "sap";
    return Math.random() < 0.45 ? "snow" : "stick";
  }

  function stepCpu(dt) {
    cpuT += dt * 1000;
    const me = getActive();
    if (!me || !me.alive) pickActive("creek");
    const shooter = getActive();
    if (shooter) pickupCrates(shooter);
    if (!cpuReady && cpuT >= CPU_THINK) {
      if (!shooter) {
        finishSettle();
        return;
      }
      const near = crates.find((c) => Math.abs(c.x - shooter.x) < 90 && Math.abs(c.y - shooter.y) < 50);
      if (near && !shooter.airborne) {
        shooter.walkDir = near.x < shooter.x ? -1 : 1;
        shooter.walkT = 0.3;
        shooter.facing = shooter.walkDir;
      }
      const foes = living("lodge");
      if (!foes.length) {
        finishSettle();
        return;
      }
      const target = foes[(Math.random() * foes.length) | 0];
      const g = guessCpuAim(shooter, target);
      angle = g.angle;
      power = g.power;
      shooter.facing = Math.cos(angle) >= 0 ? 1 : -1;
      setWeapon(cpuPickWeapon());
      cpuReady = true;
      hud();
    }
    if (cpuReady && cpuT >= CPU_THINK + CPU_SHOW) tryFire();
  }

  function step(dt) {
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.remove("show");
    }
    waveT += dt;
    if (shopOpen) return;
    if (phase === "cpu") stepCpu(dt);
    if (phase === "fly") stepShot();
    if (fuses.length && phase !== "ending" && phase !== "end") stepFuses(dt);
    bobers.forEach(stepBober);
    maybeEnd();
    if (phase === "ending") {
      endDelay -= dt;
      if (endDelay <= 0) endMatch(checkWin() || "draw");
    } else if (phase === "settle" || phase === "fuse") {
      settleT += dt;
      if (phase === "fuse" && fuses.length) return;
      if (phase === "fuse" && !fuses.length) phase = "settle";
      if ((allSettled() && settleT > 0.45) || settleT > 3.2) finishSettle();
    }
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.28;
      p.rot += p.vr;
      if (p.life <= 0) bits.splice(i, 1);
    }
    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].t -= dt;
      pops[i].y -= 18 * dt;
      if (pops[i].t <= 0) pops.splice(i, 1);
    }
  }

  function worldFromEvent(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (ev.clientX - r.left) / view.s + view.camX,
      y: (ev.clientY - r.top) / view.s + view.camY,
    };
  }

  function boberAt(x, y, team) {
    let best = null;
    let bestD = 48;
    bobers.forEach((b) => {
      if (!b.alive) return;
      if (team && b.team !== team) return;
      const d = Math.hypot(b.x - x, b.y - y);
      if (d < bestD) {
        bestD = d;
        best = b;
      }
    });
    return best;
  }

  function aimFromDrag() {
    const b = getActive();
    if (!b || !dragPos) return;
    const dx = b.x - dragPos.x;
    const dy = b.y - dragPos.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) return;
    angle = Math.atan2(dy, dx);
    power = clamp((dist / MAX_PULL) * 100, 0, 100);
    b.facing = Math.cos(angle) >= 0 ? 1 : -1;
    hudAim();
  }

  function simDots() {
    const b = getActive();
    if (!b) return [];
    const vel = launchVel(angle, power, weapon);
    let x = b.x + Math.cos(angle) * (BOBER_R + 10);
    let y = b.y + Math.sin(angle) * (BOBER_R + 10);
    let vx = vel.vx;
    let vy = vel.vy;
    const dots = [];
    const n = weapon === "mortar" ? 36 : 52;
    for (let i = 0; i < n; i++) {
      vx += wind * WIND_K;
      vy += vel.grav;
      x += vx;
      y += vy;
      if (y >= WATER_Y || x < -20 || x > WORLD_W + 20 || solid(x, y)) break;
      if (i % 2 === 0) dots.push({ x, y });
    }
    return dots;
  }

  function fightSpan() {
    return { x0: 0, x1: WORLD_W, y0: 0, y1: WORLD_H, w: WORLD_W, h: WORLD_H };
  }

  function layoutCam() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = Math.max(1, r.width);
    const cssH = Math.max(1, r.height);
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    let s = cssW / WORLD_W;
    let tx = 0;
    let ty = 0;
    const visH = cssH / s;
    if (visH >= WORLD_H) {
      ty = WORLD_H - visH;
    } else {
      s = Math.min(cssW / WORLD_W, cssH / WORLD_H);
      const visW = cssW / s;
      const visH2 = cssH / s;
      tx = visW >= WORLD_W ? (WORLD_W - visW) / 2 : 0;
      ty = visH2 >= WORLD_H ? WORLD_H - visH2 : Math.max(0, WORLD_H - visH2);
    }
    if (shot) {
      const visH2 = cssH / s;
      const want = shot.y - visH2 * 0.28;
      if (visH2 < WORLD_H) ty = clamp(want, 0, WORLD_H - visH2);
    }
    tx += userPanX;
    const visW = cssW / s;
    const viewH = cssH / s;
    const minTx = visW >= WORLD_W ? (WORLD_W - visW) / 2 : 0;
    const maxTx = visW >= WORLD_W ? minTx : WORLD_W - visW;
    tx = clamp(tx, minTx, maxTx);
    if (viewH < WORLD_H) ty = clamp(ty, 0, WORLD_H - viewH);
    if (!camInit) {
      camS = s;
      camX = tx;
      camY = ty;
      camInit = true;
    } else {
      camS += (s - camS) * 0.18;
      camX += (tx - camX) * 0.16;
      camY += (ty - camY) * 0.16;
    }
    view = {
      s: camS,
      camX,
      camY,
      cssW,
      cssH,
      dpr,
      showRadar: cssW / camS < WORLD_W - 80,
    };
  }

  function drawBober(b) {
    const flying = b.alive && b.airborne && Math.hypot(b.vx, b.vy) > 1.6;
    const sprite = !b.alive ? img.splat : flying ? img.fly : img.idle;
    const h = DRAW_H;
    const w = sprite ? (sprite.width / sprite.height) * h : h;
    const fid = b.standing && b.alive ? Math.sin(waveT * 1.35 + b.id * 1.7) * 1.15 : 0;
    const dx = Math.round(b.x);
    const dy = Math.round(b.y + 4 + fid);
    ctx.save();
    ctx.translate(dx, dy);
    ctx.scale(b.facing, 1);
    if (sprite) ctx.drawImage(sprite, Math.round(-w / 2), Math.round(-h / 2), w, h);
    else {
      ctx.fillStyle = "#8B5A2B";
      ctx.fillRect(-20, -24, 40, 40);
    }
    ctx.fillStyle = b.team === "lodge" ? "#F5C400" : "#A8C4E8";
    ctx.fillRect(-8, 6, 16, 6);
    ctx.restore();
    if (b.alive) {
      const bw = 36;
      const bh = 6;
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(b.x - bw / 2 - 1, b.y - h / 2 - 14, bw + 2, bh + 2);
      ctx.fillStyle = "#5a2030";
      ctx.fillRect(b.x - bw / 2, b.y - h / 2 - 13, bw, bh);
      ctx.fillStyle = b.team === "lodge" ? "#F5C400" : "#A8C4E8";
      ctx.fillRect(b.x - bw / 2, b.y - h / 2 - 13, bw * clamp(b.hp / HP_MAX, 0, 1), bh);
      ctx.fillStyle = "#fff6c4";
      ctx.font = "bold 11px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.name, b.x, b.y - h / 2 - 18);
      if (b.sapTicks > 0) {
        ctx.fillStyle = "#e8a020";
        ctx.fillText("SAP", b.x, b.y + h / 2 + 10);
      }
    }
    if (b.alive && b.id === activeId && (phase === "aim" || phase === "cpu")) {
      ctx.strokeStyle = b.team === "lodge" ? "#F5C400" : "#A8C4E8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BOBER_R + 10, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawRadar() {
    const rw = 168;
    const rh = 94;
    const x = view.cssW / 2 - rw / 2;
    const y = 44;
    ctx.save();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(26,16,32,0.72)";
    ctx.strokeStyle = "#1a1020";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, rw, rh, 8);
    else ctx.rect(x, y, rw, rh);
    ctx.fill();
    ctx.stroke();
    const sx = rw / WORLD_W;
    const sy = rh / WORLD_H;
    bobers.forEach((b) => {
      ctx.fillStyle = !b.alive ? "#6a6080" : b.team === "lodge" ? "#F5C400" : "#A8C4E8";
      ctx.beginPath();
      ctx.arc(x + b.x * sx, y + b.y * sy, b.id === activeId ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
    });
    crates.forEach((c) => {
      ctx.fillStyle = "#ffe566";
      ctx.fillRect(x + c.x * sx - 2, y + c.y * sy - 2, 4, 4);
    });
    ctx.restore();
  }

  function projSprite(id) {
    if (id === "snow") return img.snow;
    if (id === "dynamite") return img.dynamite;
    if (id === "sap") return img.sap;
    if (id === "mortar") return img.mortar;
    if (id === "ice") return img.ice;
    return img.stick;
  }

  function draw() {
    layoutCam();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#3A2A6A";
    ctx.fillRect(0, 0, view.cssW, view.cssH);
    ctx.save();
    ctx.translate(-view.camX * view.s, -view.camY * view.s);
    ctx.scale(view.s, view.s);

    if (img.sky) ctx.drawImage(img.sky, 0, 0, WORLD_W, WORLD_H);
    else {
      ctx.fillStyle = "#3A2A6A";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    const waterTop = mapId === "ledges" ? 500 : 430;
    const wg = ctx.createLinearGradient(0, waterTop, 0, WORLD_H);
    wg.addColorStop(0, "rgba(70, 140, 170, 0.55)");
    wg.addColorStop(0.18, "rgba(28, 90, 120, 0.82)");
    wg.addColorStop(0.55, "rgba(14, 52, 74, 0.92)");
    wg.addColorStop(1, "rgba(6, 24, 38, 0.97)");
    ctx.fillStyle = wg;
    ctx.fillRect(0, waterTop, WORLD_W, WORLD_H - waterTop);
    ctx.strokeStyle = "rgba(220, 245, 255, 0.5)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 14) {
      const yy = WATER_Y + Math.sin(x * 0.035 + waveT * 2.2) * 4;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.drawImage(under, 0, 0);
    ctx.drawImage(terrain, 0, 0);
    walls.forEach((w) => {
      if (img.ice) ctx.drawImage(img.ice, w.x, w.y, w.w, w.h);
      else {
        ctx.fillStyle = "rgba(168, 196, 232, 0.92)";
        ctx.fillRect(w.x, w.y, w.w, w.h);
      }
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(w.x, w.y - 7, w.w, 5);
      ctx.fillStyle = "#a8d8ff";
      ctx.fillRect(w.x, w.y - 7, w.w * clamp(w.hp / 60, 0, 1), 5);
    });

    crates.forEach((c) => {
      const spr = img.crate;
      if (spr) ctx.drawImage(spr, c.x - 16, c.y - 16, 32, 32);
      else {
        ctx.fillStyle = "#b8743b";
        ctx.fillRect(c.x - 12, c.y - 12, 24, 24);
      }
    });

    fuses.forEach((f) => {
      const spr = projSprite(f.weapon);
      if (spr) ctx.drawImage(spr, f.x - 14, f.y - 18, 28, 28);
      ctx.fillStyle = "#ff8a4a";
      ctx.font = "bold 12px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.t.toFixed(1), f.x, f.y - 22);
    });

    bobers.forEach((b) => {
      if (!b.alive) drawBober(b);
    });
    bobers.forEach((b) => {
      if (b.alive) drawBober(b);
    });

    if ((phase === "aim" && turn === "lodge") || phase === "cpu") {
      const b = getActive();
      if (b) {
        const dots = simDots();
        ctx.fillStyle = "#ffe566";
        dots.forEach((d, i) => {
          ctx.globalAlpha = weapon === "mortar" ? 0.42 - i / 90 : 0.85 - i / 70;
          ctx.beginPath();
          ctx.arc(d.x, d.y, weapon === "mortar" ? 5.2 : 3.2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
        if (dragging && dragPos) {
          ctx.strokeStyle = "#F5C400";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(dragPos.x, dragPos.y);
          ctx.stroke();
        }
        const len = 28 + power * 0.5;
        ctx.strokeStyle = "#fff6c4";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + Math.cos(angle) * len, b.y + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    if (shot) {
      const spr = projSprite(shot.weapon);
      const rot = Math.atan2(shot.vy, shot.vx);
      ctx.save();
      ctx.translate(shot.x, shot.y);
      ctx.rotate(rot);
      if (spr) ctx.drawImage(spr, -16, -16, 32, 32);
      else {
        ctx.fillStyle = "#F4E6C3";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    bits.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle = p.kind === "snow" ? "#F4E6C3" : p.kind === "sap" ? "#e8a020" : "#8B5A2B";
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    ctx.globalAlpha = 1;

    pops.forEach((p) => {
      ctx.globalAlpha = clamp(p.t * 2, 0, 1);
      ctx.fillStyle = p.color;
      ctx.font = "bold 18px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.strokeStyle = "#1a1020";
      ctx.lineWidth = 4;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
    });
    ctx.globalAlpha = 1;
    ctx.restore();

    if (phase !== "splash" && phase !== "end" && view.showRadar) drawRadar();
  }

  function loop(ts) {
    if (!running) return;
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    acc += dt;
    const stepDt = 1 / 60;
    let n = 0;
    while (acc >= stepDt && n < 5) {
      step(stepDt);
      acc -= stepDt;
      n += 1;
    }
    draw();
    requestAnimationFrame(loop);
  }

  function showTut() {
    if (localStorage.getItem(TUT_KEY) === "1") return;
    aimTutOn = true;
    aimTutEl.classList.remove("hidden");
    hud();
  }

  function hideTut() {
    aimTutOn = false;
    aimTutEl.classList.add("hidden");
    localStorage.setItem(TUT_KEY, "1");
    hud();
  }

  function openHowTo(from) {
    howtoFrom = from || "splash";
    howtoEl.classList.remove("hidden");
  }

  function closeHowTo() {
    howtoEl.classList.add("hidden");
    if (howtoFrom === "end") endcard.classList.remove("hidden");
    else if (howtoFrom === "shop") shopEl.classList.remove("hidden");
    else if (howtoFrom === "match") {
      /* stay in match */
    } else splash.classList.remove("hidden");
  }

  function shopAllowed() {
    return phase === "aim" || phase === "settle" || phase === "cpu";
  }

  function openShop(from) {
    shopFrom = from || "splash";
    if (from === "match") {
      if (!shopAllowed()) {
        toast("WAIT", true);
        return;
      }
      shopOpen = true;
    } else {
      shopOpen = false;
      splash.classList.add("hidden");
      endcard.classList.add("hidden");
    }
    const play = $("shop-play");
    if (play) play.textContent = from === "match" ? "BACK TO FIGHT" : "PLAY";
    hudShop();
    shopEl.classList.remove("hidden");
  }

  function closeShop() {
    shopEl.classList.add("hidden");
    if (shopFrom === "match") {
      shopOpen = false;
      hud();
      return;
    }
    shopOpen = false;
    if (shopFrom === "end") endcard.classList.remove("hidden");
    else splash.classList.remove("hidden");
  }

  function buy(id) {
    const wpn = WEAPONS[id];
    const cost = wpn && wpn.cost;
    if (!cost) return false;
    if (coins < cost) {
      toast("NEED $BOBER", true);
      return false;
    }
    coins -= cost;
    ammo.lodge[id] = (ammo.lodge[id] || 0) + 1;
    saveCoins();
    BoberSfx.pop();
    hud();
    return true;
  }

  function startMatch() {
    BoberSfx.ensure();
    loadCoins();
    splash.classList.add("hidden");
    endcard.classList.add("hidden");
    shopEl.classList.add("hidden");
    howtoEl.classList.add("hidden");
    if (window.BoberLore) BoberLore.close();
    makeTerrain();
    spawnCrew();
    crates = [];
    fuses = [];
    walls = [];
    shopOpen = false;
    craterCount = 0;
    lastBlast = null;
    winner = null;
    matchCoins = 0;
    turnN = 0;
    ammo.creek = emptyAmmo();
    weapon = "stick";
    setWeapon("stick");
    hudTop.classList.add("live");
    dock.classList.remove("hidden");
    camS = 1;
    camX = 0;
    camY = 0;
    camInit = false;
    userPanX = 0;
    endDelay = 0;
    const wasRunning = running;
    running = true;
    lastTs = performance.now();
    acc = 0;
    beginTurn("lodge");
    showTut();
    hud();
    if (!wasRunning) requestAnimationFrame(loop);
  }

  function leaveToSplash() {
    phase = "splash";
    running = false;
    shot = null;
    fuses.length = 0;
    hudTop.classList.remove("live");
    dock.classList.add("hidden");
    if (tipStrip) tipStrip.classList.add("hidden");
    endcard.classList.add("hidden");
    shopEl.classList.add("hidden");
    howtoEl.classList.add("hidden");
    splash.classList.remove("hidden");
  }

  function onPointerDown(ev) {
    if (phase === "end" || phase === "splash" || phase === "ending") return;
    ev.preventDefault();
    const w = worldFromEvent(ev);
    dragStart = w;
    panLast = { x: ev.clientX, y: ev.clientY };
    aimDrag = false;
    panning = false;
    dragging = false;
    if (phase === "aim" && turn === "lodge" && !aimTutOn) {
      const tapped = boberAt(w.x, w.y, "lodge");
      if (tapped) {
        activeId = tapped.id;
        BoberSfx.pop();
        aimDrag = true;
        dragging = true;
        dragPos = w;
        aimFromDrag();
      } else {
        panning = true;
      }
    } else {
      panning = true;
    }
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch (_) {}
  }

  function onPointerMove(ev) {
    if (aimDrag && dragging) {
      dragPos = worldFromEvent(ev);
      aimFromDrag();
      return;
    }
    if (panning && panLast) {
      const dx = ev.clientX - panLast.x;
      userPanX -= dx / (view.s || 1);
      panLast = { x: ev.clientX, y: ev.clientY };
    }
  }

  function onPointerUp(ev) {
    const w = worldFromEvent(ev);
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch (_) {}
    if (panning && dragStart && Math.hypot(w.x - dragStart.x, w.y - dragStart.y) < 16) {
      if (phase === "aim" && turn === "lodge" && !aimTutOn) {
        const tapped = boberAt(w.x, w.y, "lodge");
        if (!tapped) {
          const b = getActive();
          if (b && Math.abs(w.x - b.x) > 12) walkActive(w.x < b.x ? -1 : 1);
        }
      }
    }
    dragging = false;
    aimDrag = false;
    panning = false;
    panLast = null;
    dragStart = null;
  }

  function holdBtn(el, fn) {
    if (!el) return;
    let t = 0;
    const go = (e) => {
      e.preventDefault();
      fn();
      t = setInterval(fn, 70);
    };
    const stop = () => clearInterval(t);
    el.addEventListener("pointerdown", go);
    el.addEventListener("pointerup", stop);
    el.addEventListener("pointercancel", stop);
    el.addEventListener("pointerleave", stop);
  }

  function bind() {
    loadCoins();
    hud();
    playBtn.addEventListener("click", startMatch);
    endRestart.addEventListener("click", startMatch);
    const endSplash = $("end-splash");
    if (endSplash) endSplash.addEventListener("click", leaveToSplash);
    fireBtn.addEventListener("click", () => {
      BoberSfx.ensure();
      tryFire();
    });
    muteBtn.addEventListener("click", () => {
      BoberSfx.setMuted(!BoberSfx.muted);
      updateMuteBtn();
    });
    leaveBtn.addEventListener("click", leaveToSplash);
    $("w-stick").addEventListener("click", () => setWeapon("stick"));
    $("w-snow").addEventListener("click", () => setWeapon("snow"));
    $("w-dynamite").addEventListener("click", () => {
      if (!setWeapon("dynamite")) toast("BUY A CHARGE", true);
    });
    $("w-sap").addEventListener("click", () => {
      if (!setWeapon("sap")) toast("BUY A CHARGE", true);
    });
    holdBtn($("ang-l"), () => {
      if (phase !== "aim") return;
      angle -= 0.045;
      hudAim();
    });
    holdBtn($("ang-r"), () => {
      if (phase !== "aim") return;
      angle += 0.045;
      hudAim();
    });
    holdBtn($("pwr-d"), () => {
      if (phase !== "aim") return;
      power = clamp(power - 2, 0, 100);
      hudAim();
    });
    holdBtn($("pwr-u"), () => {
      if (phase !== "aim") return;
      power = clamp(power + 2, 0, 100);
      hudAim();
    });
    if (aimTutOk) aimTutOk.addEventListener("click", hideTut);
    const help = $("btn-help");
    if (help) help.addEventListener("click", () => openHowTo("match"));
    const btnHow = $("btn-howto");
    if (btnHow) btnHow.addEventListener("click", () => openHowTo("splash"));
    const endHow = $("end-howto");
    if (endHow) endHow.addEventListener("click", () => {
      endcard.classList.add("hidden");
      openHowTo("end");
    });
    const howClose = $("howto-close");
    if (howClose) howClose.addEventListener("click", closeHowTo);
    const btnGear = $("btn-gear");
    if (btnGear) btnGear.addEventListener("click", () => openShop("splash"));
    const onShopMatch = (ev) => {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      openShop("match");
    };
    ["btn-shop", "btn-shop-dock", "coin-chip"].forEach((id) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("click", onShopMatch);
      el.addEventListener("pointerdown", (e) => e.stopPropagation());
    });
    if (shopEl) shopEl.addEventListener("pointerdown", (e) => e.stopPropagation());
    $("w-mortar").addEventListener("click", () => {
      if (!setWeapon("mortar")) toast("BUY A CHARGE", true);
    });
    $("w-ice").addEventListener("click", () => {
      if (!setWeapon("ice")) toast("BUY A CHARGE", true);
    });
    $("buy-dynamite").addEventListener("click", () => buy("dynamite"));
    $("buy-sap").addEventListener("click", () => buy("sap"));
    $("buy-mortar").addEventListener("click", () => buy("mortar"));
    $("buy-ice").addEventListener("click", () => buy("ice"));
    $("shop-play").addEventListener("click", () => {
      if (shopFrom === "match") closeShop();
      else startMatch();
    });
    $("shop-back").addEventListener("click", closeShop);
    document.querySelectorAll(".map-card").forEach((el) => {
      el.addEventListener("click", () => setMap(el.getAttribute("data-map")));
    });
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", (ev) => {
      if (phase === "splash" && (ev.key === "Enter" || ev.key === " ")) {
        startMatch();
        return;
      }
      if (phase !== "aim") return;
      if (ev.key === "a" || ev.key === "A") walkActive(-1);
      if (ev.key === "d" || ev.key === "D") walkActive(1);
      if (ev.key === "ArrowLeft") angle -= 0.05;
      if (ev.key === "ArrowRight") angle += 0.05;
      if (ev.key === "ArrowUp") power = clamp(power + 3, 0, 100);
      if (ev.key === "ArrowDown") power = clamp(power - 3, 0, 100);
      if (ev.key === "1") setWeapon("stick");
      if (ev.key === "2") setWeapon("snow");
      if (ev.key === "3") setWeapon("dynamite");
      if (ev.key === "4") setWeapon("sap");
      if (ev.key === "5") setWeapon("mortar");
      if (ev.key === "6") setWeapon("ice");
      if (ev.key === " " || ev.key === "Enter") {
        ev.preventDefault();
        tryFire();
      }
      hudAim();
    });
    updateMuteBtn();
  }

  function snapshot() {
    return {
      phase,
      turn,
      turnN,
      wind,
      weapon,
      power,
      angle,
      craterCount,
      lastBlast,
      winner,
      coins,
      ammo: { lodge: { ...ammo.lodge }, creek: { ...ammo.creek } },
      mapId,
      crates: crates.map((c) => ({ x: c.x, y: c.y, kind: c.kind })),
      fuses: fuses.map((f) => ({ x: f.x, y: f.y, t: f.t, weapon: f.weapon })),
      walls: walls.map((w) => ({ x: w.x, y: w.y, hp: w.hp })),
      view: { s: view.s, camX: view.camX, camY: view.camY, cssW: view.cssW, cssH: view.cssH },
      bobers: bobers.map((b) => ({
        id: b.id,
        name: b.name,
        team: b.team,
        hp: b.hp,
        alive: b.alive,
        x: b.x,
        y: b.y,
        vx: b.vx,
        vy: b.vy,
        standing: b.standing,
        airborne: b.airborne,
        sapTicks: b.sapTicks,
      })),
    };
  }

  window.__yeetWar = {
    snapshot,
    startMatch,
    setAim: (deg, pwr) => setAim((deg * Math.PI) / 180, pwr),
    setWeapon,
    fire: tryFire,
    walk: walkActive,
    buy,
    spawnCrate,
    addCoins,
    setCoins(n) {
      coins = Math.max(0, n | 0);
      saveCoins();
      hud();
    },
    giveAmmo(team, id, n) {
      ammo[team][id] = (ammo[team][id] || 0) + (n || 1);
      saveCoins();
      hud();
    },
    killTeam(team) {
      living(team).forEach((b) => kill(b));
      maybeEnd();
    },
    setMap,
    openShop,
    shopAllowed,
    setWind(v) {
      wind = clamp(v | 0, -4, 4);
      hud();
    },
    get lastBlast() {
      return lastBlast;
    },
    get craterCount() {
      return craterCount;
    },
    solid,
    WEAPONS,
    HP_MAX,
    DYN_COST,
    SAP_COST,
  };

  Promise.all([
    loadImage("assets/sprites/bober-idle.png").then((i) => (img.idle = i)),
    loadImage("assets/sprites/bober-fly.png").then((i) => (img.fly = i)),
    loadImage("assets/sprites/bober-splat.png").then((i) => (img.splat = i)),
    loadImage("assets/sprites/yeet-stick.png").then((i) => (img.stick = i)),
    loadImage("assets/sprites/snowball.png").then((i) => (img.snow = i)),
    loadImage("assets/sprites/dynamite.png").then((i) => (img.dynamite = i)),
    loadImage("assets/sprites/sap-bomb.png").then((i) => (img.sap = i)),
    loadImage("assets/sprites/mortar.png").then((i) => (img.mortar = i)),
    loadImage("assets/sprites/ice-brace.png").then((i) => (img.ice = i)),
    loadImage("assets/sprites/crate.png").then((i) => (img.crate = i)),
    loadImage("assets/sprites/stage-sky.jpg").then((i) => (img.sky = i)),
    loadImage("assets/sprites/ledges-ground.png").then((i) => (img.ledges = i)),
    loadImage("assets/sprites/bowl-ground.png").then((i) => (img.bowl = i)),
  ])
    .catch((err) => console.error(err))
    .then(() => {
      bind();
      if (FAST) startMatch();
    });
})();
