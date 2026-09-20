(() => {
  const WORLD_W = 1280;
  const WORLD_H = 720;
  const WATER_Y = 676;
  const GRAV = 0.2;
  const WIND_K = 0.014;
  const BOBER_R = 24;
  const DRAW_H = 72;
  const HP_MAX = 85;
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
  const PINE_COST = 40;
  const MINE_COST = 32;
  const BUCK_COST = 26;
  const ROCKET_COST = 50;
  const CHAIN_COST = 48;
  const START_COINS = 80;
  const CRATE_EVERY = 3;
  const FUSE_SEC = 2;
  const SAP_DOT = 8;
  const SAP_TICKS = 2;
  const MAP_KEY = "bober-yeet-war-map";
  const DIFF_KEY = "bober-yeet-war-diff";
  const GRANT_KEY = "bober-yeet-war-p2grant";
  const SD_TURN = 12;
  const DIFFS = {
    easy: { ang: 0.58, pwr: 30, mortar: 0.05, dyn: 0.07, sap: 0.08, ice: 0.04, pine: 0.06, mine: 0.04, buck: 0.04, rocket: 0.04, chain: 0.04, buy: false, cover: 0.2, lowHp: false, coins: 0 },
    normal: { ang: 0.22, pwr: 12, mortar: 0.28, dyn: 0.3, sap: 0.22, ice: 0.2, pine: 0.18, mine: 0.16, buck: 0.14, rocket: 0.22, chain: 0.2, buy: true, cover: 0.48, lowHp: false, coins: 60 },
    hard: { ang: 0.07, pwr: 4, mortar: 0.52, dyn: 0.38, sap: 0.24, ice: 0.34, pine: 0.22, mine: 0.3, buck: 0.3, rocket: 0.4, chain: 0.36, buy: true, cover: 0.4, lowHp: true, coins: 110 },
  };
  const PAID = ["dynamite", "sap", "mortar", "ice", "pine", "mine", "buckler", "rocket", "chain"];
  const WEP_IDS = ["stick", "snow", "dynamite", "sap", "mortar", "ice", "pine", "mine", "buckler", "rocket", "chain"];
  const LEDGES_PAD = 140;
  const BOWL_PAD = 80;

  const WEAPONS = {
    stick: { id: "stick", name: "Yeet Stick", dmg: 25, blast: 28, r: 7, inf: true },
    snow: { id: "snow", name: "Snowball", dmg: 15, blast: 36, r: 9, inf: true },
    dynamite: { id: "dynamite", name: "Dynamite", dmg: 58, blast: 58, r: 10, fuse: FUSE_SEC, cost: DYN_COST },
    sap: { id: "sap", name: "Sap Bomb", dmg: 40, blast: 52, r: 9, dot: SAP_DOT, ticks: SAP_TICKS, cost: SAP_COST },
    mortar: { id: "mortar", name: "Lodge Mortar", dmg: 50, blast: 54, r: 9, cost: MORTAR_COST, lob: true },
    ice: { id: "ice", name: "Ice Brace", dmg: 0, blast: 8, r: 8, cost: ICE_COST, wall: true },
    pine: { id: "pine", name: "Pinecone Cluster", dmg: 16, blast: 28, r: 7, cost: PINE_COST, cluster: 3 },
    mine: { id: "mine", name: "Woodchip Mine", dmg: 52, blast: 42, r: 8, cost: MINE_COST, mine: true },
    buckler: { id: "buckler", name: "Bark Buckler", dmg: 0, blast: 0, r: 6, cost: BUCK_COST, shield: 35 },
    rocket: { id: "rocket", name: "Corkscrew Rocket", dmg: 55, blast: 46, r: 10, cost: ROCKET_COST, twist: true },
    chain: { id: "chain", name: "Lodge Chaingun", dmg: 14, blast: 12, r: 5, cost: CHAIN_COST, burst: 5 },
  };

  const MAPS = {
    bowl: {
      id: "bowl",
      name: "Lodge Bowl",
      spawn: { lodge: [180, 280, 380], creek: [900, 1000, 1100] },
      pad: BOWL_PAD,
      plate: "bowl",
      sky: "skyEarth",
      hazard: "water",
      hazardY: 640,
      hazardWord: "SPLASH",
      hazardColor: "#8ad4ff",
      under: "#4a2810",
      washFrom: 430,
    },
    ledges: {
      id: "ledges",
      name: "Twin Ledges",
      spawn: { lodge: [140, 230, 320], creek: [960, 1050, 1140] },
      pad: LEDGES_PAD,
      plate: "ledges",
      sky: "skyEarth",
      hazard: "water",
      hazardY: 676,
      hazardWord: "SPLASH",
      hazardColor: "#8ad4ff",
      under: "#4a2810",
      washFrom: 500,
    },
    mesa: {
      id: "mesa",
      name: "Red Mesa",
      spawn: { lodge: [100, 180, 260], creek: [1020, 1100, 1180] },
      pad: 110,
      plate: "mesa",
      sky: "skyMars",
      hazard: "dust",
      hazardY: 700,
      hazardWord: "DUST",
      hazardColor: "#e8a060",
      under: "#6a3010",
      washFrom: 620,
    },
    crater: {
      id: "crater",
      name: "Crater Rim",
      spawn: { lodge: [90, 170, 250], creek: [1030, 1110, 1190] },
      pad: 130,
      plate: "crater",
      sky: "skyMoon",
      hazard: "void",
      hazardY: 680,
      hazardWord: "VOID",
      hazardColor: "#c8c0e0",
      under: "#2a2a32",
      washFrom: 520,
      pit: { x: 640, y: 470, r: 118 },
    },
    methane: {
      id: "methane",
      name: "Methane Shelf",
      spawn: { lodge: [140, 230, 320], creek: [980, 1080, 1180] },
      pad: 130,
      plate: "methane",
      sky: "skyUranus",
      hazard: "methane",
      hazardY: 640,
      hazardWord: "SINK",
      hazardColor: "#6ad4c8",
      under: "#0a2830",
      washFrom: 470,
    },
    acid: {
      id: "acid",
      name: "Acid Vents",
      spawn: { lodge: [120, 200, 320], creek: [960, 1100, 1200] },
      pad: 80,
      plate: "acid",
      sky: "skyVenus",
      hazard: "acid",
      hazardY: 660,
      hazardWord: "COOKED",
      hazardColor: "#c8e040",
      under: "#5a4010",
      washFrom: 520,
    },
    ring: {
      id: "ring",
      name: "Ring Span",
      spawn: { lodge: [80, 160, 240], creek: [1000, 1100, 1180] },
      pad: 70,
      plate: "ring",
      sky: "skySaturn",
      hazard: "void",
      hazardY: 680,
      hazardWord: "VOID",
      hazardColor: "#c8c0e0",
      under: "#3a3018",
      washFrom: 500,
    },
    pack: {
      id: "pack",
      name: "Deep Pack",
      spawn: { lodge: [80, 160, 280], creek: [960, 1100, 1200] },
      pad: 90,
      plate: "pack",
      sky: "skyNeptune",
      hazard: "water",
      hazardY: 670,
      hazardWord: "SPLASH",
      hazardColor: "#8ad4ff",
      under: "#1a3048",
      washFrom: 560,
    },
    frost: {
      id: "frost",
      name: "Frost Pit",
      spawn: { lodge: [80, 160, 240], creek: [1000, 1100, 1200] },
      pad: 40,
      plate: "frost",
      sky: "skyPluto",
      hazard: "water",
      hazardY: 690,
      hazardWord: "SPLASH",
      hazardColor: "#a8c4e8",
      under: "#2a3040",
      washFrom: 520,
    },
    dock: {
      id: "dock",
      name: "Dock Notch",
      spawn: { lodge: [160, 220, 280], creek: [980, 1080, 1160] },
      pad: 40,
      plate: "dock",
      sky: "skyAsteroid",
      hazard: "void",
      hazardY: 670,
      hazardWord: "VOID",
      hazardColor: "#c8c0e0",
      under: "#1a1a1e",
      washFrom: 480,
    },
  };

  function spec() {
    return MAPS[mapId] || MAPS.bowl;
  }

  function hazardY() {
    const y = spec().hazardY;
    return (y == null ? WATER_Y : y) - sdRise;
  }

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
    lodge: { dynamite: 0, sap: 0, mortar: 0, ice: 0, pine: 0, mine: 0, buckler: 0, rocket: 0, chain: 0 },
    creek: { dynamite: 0, sap: 0, mortar: 0, ice: 0, pine: 0, mine: 0, buckler: 0, rocket: 0, chain: 0 },
  };
  let crates = [];
  let fuses = [];
  let walls = [];
  let mines = [];
  let pellets = [];
  let mapId = "bowl";
  let diff = "normal";
  let sudden = false;
  let sdRise = 0;
  let sdTickAt = 0;
  let cpuCoins = 0;
  let shopFrom = "splash";
  let howtoFrom = "splash";
  let shopOpen = false;
  let lastPortrait = null;
  let playMode = "vsai";
  let netRole = null;
  let netReady = false;
  let carveLog = [];
  let carveN = 0;
  let lastNetSend = 0;
  let guestBag = null;
  let netFireLock = false;
  let shake = 0;
  let flashes = [];
  let trails = [];
  let gunBurst = null;

  function $(id) {
    return document.getElementById(id);
  }

  function isLink() {
    return playMode === "link" && !!netRole;
  }
  function isHost() {
    return isLink() && netRole === "host";
  }
  function isGuest() {
    return isLink() && netRole === "guest";
  }
  function myTeam() {
    return isGuest() ? "creek" : "lodge";
  }
  function canControl() {
    return phase === "aim" && turn === myTeam() && !aimTutOn;
  }
  function netSend(msg) {
    if (window.BoberNet && BoberNet.connected) BoberNet.send(msg);
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
    return { dynamite: 0, sap: 0, mortar: 0, ice: 0, pine: 0, mine: 0, buckler: 0, rocket: 0, chain: 0 };
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
    const d = localStorage.getItem(DIFF_KEY);
    if (d && DIFFS[d]) diff = d;
  }

  function saveCoins() {
    if (isGuest()) return;
    localStorage.setItem(COIN_KEY, String(coins));
    localStorage.setItem(AMMO_KEY, JSON.stringify({
      dynamite: ammo.lodge.dynamite,
      sap: ammo.lodge.sap,
      mortar: ammo.lodge.mortar,
      ice: ammo.lodge.ice,
      pine: ammo.lodge.pine,
      mine: ammo.lodge.mine,
      buckler: ammo.lodge.buckler,
      rocket: ammo.lodge.rocket,
      chain: ammo.lodge.chain,
    }));
    localStorage.setItem(MAP_KEY, mapId);
    localStorage.setItem(DIFF_KEY, diff);
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
    const fire = kind === "fire" || kind === "ember" || kind === "mine" || kind === "rocket";
    const n = kind === "snow" ? 24 : fire ? 38 : kind === "sap" ? 20 : 26;
    for (let i = 0; i < n; i++) {
      const k = fire
        ? i % 3 === 0
          ? "ember"
          : i % 3 === 1
            ? "fire"
            : "smoke"
        : kind === "sap"
          ? "sap"
          : kind === "snow"
            ? "snow"
            : i % 2 === 0
              ? "dirt"
              : "snow";
      bits.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 14,
        vx: (Math.random() - 0.5) * (fire ? 16 : 12),
        vy: (Math.random() - 0.85) * (fire ? 16 : 11),
        w: (fire ? 10 : 7) + Math.random() * (fire ? 16 : 11),
        h: (fire ? 8 : 6) + Math.random() * (fire ? 14 : 9),
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.5,
        life: 0.55 + Math.random() * 0.7,
        kind: k,
      });
    }
    if (fire) {
      for (let j = 0; j < 12; j++) {
        bits.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y - Math.random() * 8,
          vx: (Math.random() - 0.5) * 5,
          vy: -5 - Math.random() * 9,
          w: 14 + Math.random() * 16,
          h: 18 + Math.random() * 22,
          rot: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          life: 0.55 + Math.random() * 0.65,
          kind: j % 2 ? "fire" : "smoke",
        });
      }
    }
    for (let i = 0; i < 12; i++) {
      bits.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 14,
        vy: -3 - Math.random() * 8,
        w: 8 + Math.random() * 12,
        h: 7 + Math.random() * 10,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.6,
        life: 0.45 + Math.random() * 0.5,
        kind: i % 2 ? "dirt" : "snow",
      });
    }
  }

  function boomShake(r) {
    shake = Math.max(shake, Math.min(22, 5 + r * 0.22));
  }

  function flash(x, y, r, color) {
    flashes.push({ x, y, r: r || 28, color: color || "#ffe566", t: 0.22 });
  }

  function trailAt(x, y, kind) {
    const smoke = kind === "smoke";
    const tracer = kind === "tracer";
    trails.push({
      x,
      y,
      kind: kind || "smoke",
      t: smoke ? 0.52 : tracer ? 0.22 : 0.36,
      w: smoke ? 14 + Math.random() * 14 : tracer ? 6 + Math.random() * 6 : 9 + Math.random() * 10,
    });
    if (trails.length > 110) trails.splice(0, trails.length - 110);
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
    const s = spec();
    const plate = img[s.plate];
    const pad = s.pad || 0;
    if (plate && plate.width) {
      tctx.drawImage(plate, 0, pad);
      if (s.pit) {
        tctx.save();
        tctx.globalCompositeOperation = "destination-out";
        tctx.beginPath();
        tctx.arc(s.pit.x, s.pit.y + pad, s.pit.r, 0, Math.PI * 2);
        tctx.fill();
        tctx.restore();
      }
    } else {
      paintMoundFallback();
    }
    uctx.clearRect(0, 0, WORLD_W, WORLD_H);
    uctx.fillStyle = s.under || "#4a2810";
    uctx.fillRect(0, 0, WORLD_W, WORLD_H);
    uctx.globalCompositeOperation = "destination-in";
    uctx.drawImage(terrain, 0, 0);
    uctx.globalCompositeOperation = "source-over";
    rebuildMask();
  }

  function surfaceY(x) {
    const x0 = clamp(x | 0, 0, WORLD_W - 1);
    const hy = hazardY();
    for (let y = 0; y < hy; y++) {
      if (solid(x0, y)) return y;
    }
    return hy;
  }

  function carve(cx, cy, r, fromNet) {
    tctx.save();
    tctx.globalCompositeOperation = "destination-out";
    tctx.beginPath();
    tctx.arc(cx, cy, r, 0, Math.PI * 2);
    tctx.fill();
    let seed = ((cx * 131) + (cy * 17) + (r * 9)) | 0;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < 6; i++) {
      const a = rnd() * Math.PI * 2;
      const rr = r * (0.28 + rnd() * 0.42);
      tctx.beginPath();
      tctx.arc(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, rr, 0, Math.PI * 2);
      tctx.fill();
    }
    tctx.restore();
    rebuildMask();
    craterCount += 1;
    hurtWalls(cx, cy, r, 28);
    if (!fromNet && isHost()) {
      carveLog.push({ x: cx, y: cy, r });
      carveN += 1;
      netSend({ t: "cv", x: cx, y: cy, r, n: carveN });
    }
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
      y: clamp((top - 48) | 0, 40, hazardY() - 50),
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
          shield: 0,
          shieldTurns: 0,
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
    WEP_IDS.forEach((w) => {
      const el = $("w-" + w);
      if (el) el.classList.toggle("on", w === id);
    });
    const nm = WEAPONS[id].name;
    const chip = $("wep-chip");
    if (chip) chip.textContent = nm.toUpperCase();
    const now = $("wep-now");
    if (now) now.textContent = nm;
    if (isGuest() && canControl()) netSend({ t: "in", k: "weapon", id });
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
    const sdChip = $("sd-chip");
    if (sdChip) sdChip.classList.toggle("hidden", !sudden);
    if (coinChip) coinChip.textContent = "$BOBER " + (myTeam() === "creek" ? cpuCoins : coins);
    const mapChip = $("map-chip");
    if (mapChip) mapChip.textContent = (MAPS[mapId] || MAPS.bowl).name.toUpperCase();
    PAID.forEach((id) => {
      const n = teamAmmo(myTeam(), id);
      const el = $("ammo-" + id);
      if (el) el.textContent = String(n);
      const btn = $("w-" + id);
      if (btn) btn.classList.toggle("out", n <= 0);
    });
    const canFire = canControl();
    fireBtn.disabled = !canFire;
    fireBtn.textContent =
      phase === "cpu"
        ? "CPU…"
        : phase === "fly" || phase === "fuse"
          ? "YEET"
          : isLink() && phase === "aim" && turn !== myTeam()
            ? "WAIT"
            : "FIRE";
    if (tipStrip) {
      const showTip = (phase === "aim" || phase === "cpu") && turnN <= 2;
      tipStrip.classList.toggle("hidden", !showTip);
    }
    const nm = (WEAPONS[weapon] || WEAPONS.stick).name;
    const chip = $("wep-chip");
    if (chip) chip.textContent = nm.toUpperCase();
    const now = $("wep-now");
    if (now) now.textContent = nm;
    hudAim();
    hudShop();
    syncTrayChevs();
  }

  function hudShop() {
    const sc = $("shop-coins");
    if (sc) sc.textContent = "$BOBER " + (myTeam() === "creek" ? cpuCoins : coins);
    const ids = [
      ["shop-dyn-n", "dynamite", "buy-dynamite", DYN_COST],
      ["shop-sap-n", "sap", "buy-sap", SAP_COST],
      ["shop-mortar-n", "mortar", "buy-mortar", MORTAR_COST],
      ["shop-ice-n", "ice", "buy-ice", ICE_COST],
      ["shop-pine-n", "pine", "buy-pine", PINE_COST],
      ["shop-mine-n", "mine", "buy-mine", MINE_COST],
      ["shop-buck-n", "buckler", "buy-buckler", BUCK_COST],
      ["shop-rocket-n", "rocket", "buy-rocket", ROCKET_COST],
      ["shop-chain-n", "chain", "buy-chain", CHAIN_COST],
    ];
    ids.forEach((row) => {
      const nEl = $(row[0]);
      if (nEl) nEl.textContent = String(ammo[myTeam()][row[1]] || 0);
      const b = $(row[2]);
      if (!b) return;
      const purse = myTeam() === "creek" ? cpuCoins : coins;
      const need = row[3] - purse;
      if (need > 0) {
        b.disabled = true;
        b.textContent = "NEED " + need + " MORE $BOBER";
      } else {
        b.disabled = false;
        b.textContent = "BUY";
      }
    });
    syncMapCards();
    syncDiffCards();
  }

  function syncMapCards() {
    document.querySelectorAll(".map-card").forEach((el) => {
      el.classList.toggle("on", el.getAttribute("data-map") === mapId);
    });
  }

  function syncDiffCards() {
    document.querySelectorAll(".diff-card[data-diff]").forEach((el) => {
      el.classList.toggle("on", el.getAttribute("data-diff") === diff);
    });
  }

  function setDiff(id) {
    if (!DIFFS[id]) return;
    diff = id;
    localStorage.setItem(DIFF_KEY, diff);
    syncDiffCards();
    hud();
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
    const bag = ["dynamite", "sap", "mortar", "ice", "pine", "mine", "buckler", "rocket", "chain", "coin", "dynamite", "ice"];
    return bag[(Math.random() * bag.length) | 0];
  }

  function spawnCrate(kind, x) {
    const kinds = ["dynamite", "sap", "coin", "mortar", "ice", "pine", "mine", "buckler", "rocket", "chain"];
    const k = kind && kinds.indexOf(kind) >= 0 ? kind : rollCrateKind();
    let cx = x;
    if (cx == null) {
      const left = Math.random() < 0.5;
      cx = left ? 90 + Math.random() * 280 : 900 + Math.random() * 280;
    }
    for (let tries = 0; tries < 14; tries++) {
      const gy = surfaceY(cx);
      const blocked =
        gy >= hazardY() - 8 ||
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
        } else {
          cpuCoins += 10;
          pop(c.x, c.y, isLink() ? "+10 $BOBER" : "NICKED", isLink() ? "#ffe566" : "#a8c4e8");
        }
      } else {
        ammo[b.team][c.kind] = (ammo[b.team][c.kind] || 0) + 1;
        saveCoins();
        const tag = {
          sap: "SAP +1",
          dynamite: "DYN +1",
          mortar: "MORTAR +1",
          ice: "ICE +1",
          pine: "PINE +1",
          mine: "MINE +1",
          buckler: "BUCKLER +1",
          rocket: "ROCKET +1",
          chain: "CHAIN +1",
        };
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
    armMines();
    tickShields();
    tickSuddenDeath();
    if (turnN > 0 && turnN % CRATE_EVERY === 0) spawnCrate();
    if (team === "creek" && !isLink()) {
      phase = "cpu";
      pickActive("creek");
      cpuT = 0;
      cpuReady = false;
      cpuShop();
      toast("CREEK TURN");
    } else {
      phase = "aim";
      pickActive(team);
      const a = getActive();
      if (a) {
        angle = team === "lodge" ? -0.95 : -2.2;
        a.facing = team === "lodge" ? 1 : -1;
        pickupCrates(a);
      }
      if (!WEAPONS[weapon] || (!WEAPONS[weapon].inf && teamAmmo(team, weapon) <= 0)) weapon = "stick";
      setWeapon(weapon);
      power = 50;
      BoberSfx.turn();
      toast(team === "lodge" ? "LODGE TURN" : "CREEK TURN");
    }
    hud();
    netPush(true);
  }

  function tickSuddenDeath() {
    const twoLeft = living().length <= 2;
    if (!sudden && (turnN >= SD_TURN || twoLeft)) {
      sudden = true;
      sdTickAt = turnN;
      toast("SUDDEN DEATH");
      pop(WORLD_W / 2, hazardY() - 40, "SUDDEN DEATH", "#ffe566");
      riseSudden();
      return;
    }
    if (sudden && turnN - sdTickAt >= 2) {
      sdTickAt = turnN;
      riseSudden();
    }
  }

  function riseSudden() {
    sdRise += 32;
    shrinkMidTerrain();
    living().forEach((b) => {
      if (b.y + BOBER_R >= hazardY()) drown(b, spec().hazardWord);
    });
    hud();
  }

  function shrinkMidTerrain() {
    const hy = hazardY();
    const r = 34 + Math.min(40, sdRise * 0.2);
    carve(WORLD_W / 2, hy - 36, r);
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
    } else if (id === "rocket" || weapon === "rocket") {
      const rspd = 5.2 + pwr * 0.155;
      vx = Math.cos(ang) * rspd;
      vy = Math.sin(ang) * rspd;
      grav = GRAV * 0.72;
    } else if (id === "chain" || weapon === "chain") {
      const cspd = 9 + pwr * 0.1;
      vx = Math.cos(ang) * cspd;
      vy = Math.sin(ang) * cspd * 0.82;
      grav = GRAV * 0.55;
    } else {
      vx = Math.cos(ang) * (2.2 + pwr * 0.172);
      vy = Math.sin(ang) * (2.2 + pwr * 0.172);
      grav = GRAV;
    }
    weapon = oldW;
    return { vx, vy, grav };
  }

  function tryFire(fromNet) {
    if (isGuest() && !fromNet) {
      if (!canControl() || netFireLock) return false;
      netFireLock = true;
      netSend({ t: "in", k: "fire", angle, power, weapon, activeId });
      return true;
    }
    if (phase !== "aim" && phase !== "cpu") return false;
    if (isLink()) {
      if (phase !== "aim") return false;
      if (!fromNet && turn !== myTeam()) return false;
    } else if (phase === "aim" && turn !== "lodge") return false;
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
    if (wpn.id === "buckler") {
      b.shield = 35;
      b.shieldTurns = 2;
      pop(b.x, b.y - 28, "SHIELD +35", "#c8a060");
      BoberSfx.pop();
      phase = "settle";
      settleT = 0.25;
      hud();
      netPush(true);
      return true;
    }
    const nose = BOBER_R + 10;
    if (wpn.id === "chain") {
      gunBurst = {
        n: 5,
        wait: 0,
        ang: angle,
        pwr: power,
        owner: b.id,
        team: b.team,
        x: b.x,
        y: b.y,
      };
      b.vx -= Math.cos(angle) * 2.4;
      b.standing = false;
      flash(b.x + Math.cos(angle) * 28, b.y + Math.sin(angle) * 28, 22, "#ffe8a0");
      spawnChainRound();
      phase = "fly";
      dragging = false;
      BoberSfx.yeet();
      if (BoberSfx.whoosh) BoberSfx.whoosh();
      hud();
      netPush(true);
      return true;
    }
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
      split: false,
      spin: 0,
    };
    phase = "fly";
    dragging = false;
    BoberSfx.yeet();
    if (wpn.id === "rocket" && BoberSfx.whoosh) BoberSfx.whoosh();
    flash(shot.x, shot.y, 16, "#fff6c4");
    hud();
    netPush(true);
    return true;
  }

  function spawnChainRound() {
    const b = bobers.find((x) => x.id === (gunBurst && gunBurst.owner)) || getActive();
    if (!b || !gunBurst) return;
    const jitter = (Math.random() - 0.5) * 0.06;
    const ang = gunBurst.ang + jitter;
    const vel = launchVel(ang, gunBurst.pwr, "chain");
    vel.vx += wind * WIND_K * 4;
    const nose = BOBER_R + 12;
    pellets.push({
      x: b.x + Math.cos(ang) * nose,
      y: b.y + Math.sin(ang) * nose,
      vx: vel.vx,
      vy: vel.vy,
      grav: vel.grav,
      r: 5,
      weapon: "chain",
      owner: b.id,
      team: gunBurst.team,
      age: 0,
      tracer: true,
    });
    flash(b.x + Math.cos(ang) * 30, b.y + Math.sin(ang) * 30, 18, "#ffd36a");
    b.x -= Math.cos(ang) * 3.2;
    b.vx -= Math.cos(ang) * 1.4;
    if (BoberSfx.chip) BoberSfx.chip();
    gunBurst.n -= 1;
    gunBurst.wait = 0.15;
  }

  function drown(b, why) {
    if (!b.alive) return;
    b.alive = false;
    b.hp = 0;
    b.vx = 0;
    b.vy = 0;
    b.airborne = false;
    BoberSfx.splash();
    pop(b.x, b.y, why || spec().hazardWord || "SPLASH", spec().hazardColor || "#8ad4ff");
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
    const fx =
      wpn.id === "snow"
        ? "snow"
        : wpn.id === "sap"
          ? "sap"
          : wpn.id === "mine" || wpn.id === "dynamite" || wpn.id === "rocket"
            ? "fire"
            : "dirt";
    burst(x, y, fx);
    flash(x, y, r * 1.15, wpn.id === "mine" || wpn.id === "rocket" || wpn.id === "dynamite" ? "#ff9a3a" : "#ffe566");
    boomShake(r);
    BoberSfx.boom();
    const hits = [];
    bobers.forEach((b) => {
      if (!b.alive) return;
      const dist = Math.hypot(b.x - x, b.y - y);
      if (dist >= r + BOBER_R * 0.35) return;
      const fall = clamp(1 - dist / r, 0, 1);
      let dmg = Math.max(1, Math.round(dmgMax * fall));
      if (b.shield > 0) {
        const abs = Math.min(b.shield, dmg);
        b.shield -= abs;
        dmg -= abs;
        pop(b.x, b.y - 40, "SHIELD -" + abs, "#c8a060");
      }
      if (dmg <= 0) return;
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
    if (shot && Math.hypot(shot.x - x, shot.y - y) < 22) shot = null;
    const bursting = gunBurst && gunBurst.n > 0;
    if (!shot && pellets.length === 0 && !bursting) {
      phase = "settle";
      settleT = 0;
    } else {
      phase = "fly";
    }
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
      burst(shot.x, hazardY(), "snow");
      BoberSfx.splash();
    }
    shot = null;
    if (!pellets.length) {
      phase = "settle";
      settleT = 0.35;
    }
    hud();
  }

  function onShotHit(x, y, src) {
    const s = src || shot;
    if (!s) return;
    bumpMines(x, y);
    if (s.weapon === "dynamite") plantFuse(x, y, "dynamite", s.team);
    else if (s.weapon === "ice") {
      placeIceWall(x, y);
      if (s === shot) shot = null;
      phase = "settle";
      settleT = 0.2;
      hud();
    } else if (s.weapon === "mine") {
      plantMine(x, y, s.team);
      if (s === shot) shot = null;
      phase = "settle";
      settleT = 0.2;
      hud();
    } else explode(x, y, s.weapon, s.team);
    if (s !== shot && pellets.indexOf(s) >= 0) pellets.splice(pellets.indexOf(s), 1);
  }

  function flyOne(s, isMain) {
    s.vx += wind * WIND_K;
    s.vy += s.grav || GRAV;
    const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) / 4));
    for (let i = 0; i < steps; i++) {
      s.x += s.vx / steps;
      s.y += s.vy / steps;
      s.age += 1 / steps;
      if (s.weapon === "rocket") {
        s.spin = (s.spin || 0) + 0.62 / steps;
        const spd = Math.hypot(s.vx, s.vy) || 1;
        s.ox = (-s.vy / spd) * Math.sin(s.spin) * 22;
        s.oy = (s.vx / spd) * Math.sin(s.spin) * 22;
      } else {
        s.ox = 0;
        s.oy = 0;
      }
      const hx = s.x + (s.ox || 0);
      const hy = s.y + (s.oy || 0);
      if (i === 0) {
        trailAt(hx, hy, s.weapon === "rocket" ? "smoke" : s.weapon === "chain" ? "tracer" : "puff");
        if (s.weapon === "rocket") trailAt(s.x, s.y, "smoke");
      }
      if (s.weapon === "pine" && !s.split && s.vy > 0 && s.age > 10) {
        splitPine(s);
        return "ok";
      }
      if (hy >= hazardY()) {
        if (isMain) splashShot();
        return "dead";
      }
      if (hx < -40 || hx > WORLD_W + 40 || hy < -120) {
        if (isMain) {
          shot = null;
          phase = "settle";
          settleT = 0.25;
          hud();
        }
        return "dead";
      }
      if (solid(hx, hy)) {
        onShotHit(hx, hy, s);
        return "hit";
      }
      for (let k = 0; k < bobers.length; k++) {
        const b = bobers[k];
        if (!b.alive) continue;
        if (s.age < 6 && b.id === s.owner) continue;
        if (Math.hypot(b.x - hx, b.y - hy) < BOBER_R + s.r) {
          onShotHit(hx, hy, s);
          return "hit";
        }
      }
    }
    return "ok";
  }

  function splitPine(s) {
    s.split = true;
    const spd = Math.hypot(s.vx, s.vy) || 6;
    const base = Math.atan2(s.vy, s.vx);
    [-0.42, 0, 0.42].forEach((da, i) => {
      const p = {
        x: s.x,
        y: s.y,
        vx: Math.cos(base + da) * spd,
        vy: Math.sin(base + da) * spd,
        grav: s.grav,
        r: 7,
        weapon: "pine",
        owner: s.owner,
        team: s.team,
        age: s.age,
        split: true,
      };
      if (i === 1) {
        s.vx = p.vx;
        s.vy = p.vy;
      } else pellets.push(p);
    });
    pop(s.x, s.y, "SPLIT", "#c08040");
  }

  function stepShot() {
    if (shot) flyOne(shot, true);
    for (let i = pellets.length - 1; i >= 0; i--) {
      const st = flyOne(pellets[i], false);
      if (st !== "ok") pellets.splice(i, 1);
    }
    if (!shot && !pellets.length && !(gunBurst && gunBurst.n > 0) && phase === "fly") {
      phase = "settle";
      settleT = 0.2;
      hud();
    }
  }

  function stepGunBurst(dt) {
    if (!gunBurst) return;
    if (gunBurst.n <= 0) {
      if (!pellets.length && !shot) gunBurst = null;
      return;
    }
    gunBurst.wait -= dt;
    if (gunBurst.wait <= 0) spawnChainRound();
  }

  function plantMine(x, y, team) {
    const gy = surfaceY(x);
    const mine = {
      x: clamp(x | 0, 12, WORLD_W - 12),
      y: clamp((gy - 10) | 0, 20, hazardY() - 12),
      team: team || "lodge",
      armed: false,
      bornTurn: turnN,
    };
    mines.push(mine);
    pop(mine.x, mine.y - 16, "MINE", "#c08040");
    BoberSfx.chip();
    return mine;
  }

  function armMines() {
    mines.forEach((m) => {
      if (!m.armed && turnN > m.bornTurn) {
        m.armed = true;
        pop(m.x, m.y - 14, "ARMED", "#ffe566");
      }
    });
  }

  function tickShields() {
    bobers.forEach((b) => {
      if (b.shieldTurns > 0) {
        b.shieldTurns -= 1;
        if (b.shieldTurns <= 0) {
          b.shield = 0;
          if (b.alive) pop(b.x, b.y - 20, "SHIELD OUT", "#c8a060");
        }
      }
    });
  }

  function bumpMines(x, y) {
    for (let i = mines.length - 1; i >= 0; i--) {
      const m = mines[i];
      if (!m.armed) continue;
      if (Math.hypot(m.x - x, m.y - y) > 28) continue;
      mines.splice(i, 1);
      explode(m.x, m.y, "mine", m.team);
    }
  }

  function stepMines() {
    bobers.forEach((b) => {
      if (!b.alive) return;
      for (let i = mines.length - 1; i >= 0; i--) {
        const m = mines[i];
        if (!m.armed) continue;
        if (Math.hypot(m.x - b.x, m.y - b.y) > 28) continue;
        mines.splice(i, 1);
        explode(m.x, m.y, "mine", m.team);
      }
    });
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
    const hy = hazardY();
    if (gy >= hy) {
      drown(b, spec().hazardWord);
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
      const hy = hazardY();
      if (b.y + BOBER_R >= g && g < hy) {
        b.y = g - BOBER_R;
        b.vy = 0;
        b.vx = 0;
      }
      if (b.y - 4 > hy) b.y = hy + 40;
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
      if (gy >= hazardY()) {
        drown(b, spec().hazardWord);
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
    if (b.y - BOBER_R > hazardY() || b.y > hazardY() + 8) {
      drown(b, spec().hazardWord);
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

  function walkActive(dir, fromNet) {
    if (isGuest() && !fromNet) {
      if (!canControl()) return;
      netSend({ t: "in", k: "walk", dir: dir < 0 ? -1 : 1 });
      return;
    }
    const b = getActive();
    if (!b || !b.alive || phase !== "aim") return;
    if (!fromNet && turn !== myTeam()) return;
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
    if (!who) {
      if (!sudden && living().length <= 2) tickSuddenDeath();
      return false;
    }
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
    const appEl = $("app");
    if (appEl) {
      appEl.classList.remove("live");
    }
    dock.classList.add("hidden");
    if (tipStrip) tipStrip.classList.add("hidden");
    const mine = myTeam();
    if (who === "draw") {
      endTitle.textContent = "DRAW";
      endMsg.textContent = "Everybody yeeted. The bank is empty.";
      BoberSfx.fail();
    } else if (who === mine) {
      if (!isGuest()) addCoins(20);
      endTitle.textContent = "YOU WIN";
      endMsg.textContent = mine === "lodge" ? "Bank cleared. Lodge still standing." : "Creek took the bank.";
      BoberSfx.win();
    } else {
      if (!isGuest()) addCoins(4);
      endTitle.textContent = "YOU LOSE";
      endMsg.textContent = who === "creek" ? "Crew down. Creek took the bank." : "Bank cleared. Lodge still standing.";
      BoberSfx.fail();
    }
    const ec = $("end-coins");
    if (ec) ec.textContent = "This match +" + matchCoins + " · bag $BOBER " + (mine === "creek" ? cpuCoins : coins);
    endcard.classList.remove("hidden");
    hud();
    netPush(true);
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

  function diffSpec() {
    return DIFFS[diff] || DIFFS.normal;
  }

  function cpuTarget() {
    const foes = living("lodge");
    if (!foes.length) return null;
    const d = diffSpec();
    if (d.lowHp) {
      foes.sort((a, b) => a.hp - b.hp || a.x - b.x);
      return foes[0];
    }
    return foes[(Math.random() * foes.length) | 0];
  }

  function guessCpuAim(me, target) {
    const d = diffSpec();
    const dx = target.x - me.x;
    const dy = target.y - me.y;
    const dist = Math.hypot(dx, dy);
    const lob = weapon === "mortar";
    let ang = Math.atan2(dy - (lob ? 190 : 130), dx);
    let pwr = (lob ? 40 : 30) + dist * (lob ? 0.038 : 0.052) + Math.abs(wind) * (lob ? 1.4 : 2.2);
    if (wind * Math.sign(dx) < 0) pwr += lob ? 4 : 8;
    if (wind * Math.sign(dx) > 0) pwr -= lob ? 2 : 3;
    ang += (Math.random() - 0.5) * d.ang;
    pwr += (Math.random() - 0.5) * d.pwr;
    if (ang > 0) ang = -Math.abs(ang);
    return { angle: ang, power: clamp(pwr, 18, 92) };
  }

  function cpuPickWeapon(shooter, target) {
    const d = diffSpec();
    const has = (id) => teamAmmo("creek", id) > 0;
    if (shooter && shooter.hp <= 42 && has("buckler") && Math.random() < d.buck) return "buckler";
    if (target && Math.abs(target.x - (WORLD_W / 2)) < 80 && has("mine") && Math.random() < d.mine) return "mine";
    if (has("ice") && Math.random() < d.ice) return "ice";
    if (has("rocket") && Math.random() < (d.rocket || 0)) return "rocket";
    if (has("chain") && Math.random() < (d.chain || 0)) return "chain";
    if (has("mortar") && Math.random() < d.mortar) return "mortar";
    if (has("dynamite") && Math.random() < d.dyn) return "dynamite";
    if (has("sap") && Math.random() < d.sap) return "sap";
    if (has("pine") && Math.random() < d.pine) return "pine";
    if (has("mine") && Math.random() < d.mine) return "mine";
    if (d.cover && Math.random() < d.cover) return "snow";
    return Math.random() < 0.4 ? "snow" : "stick";
  }

  function cpuShop() {
    const d = diffSpec();
    if (!d.buy) return;
    const order = d.lowHp
      ? ["rocket", "chain", "mortar", "ice", "mine", "buckler", "dynamite", "pine", "sap"]
      : ["dynamite", "rocket", "chain", "mortar", "sap", "ice", "pine", "mine", "buckler"];
    order.forEach((id) => {
      const wpn = WEAPONS[id];
      if (!wpn || !wpn.cost) return;
      if (teamAmmo("creek", id) > 0) return;
      if (cpuCoins < wpn.cost) return;
      cpuCoins -= wpn.cost;
      ammo.creek[id] = (ammo.creek[id] || 0) + 1;
    });
  }

  function stepCpu(dt) {
    cpuT += dt * 1000;
    const cap = FAST ? 700 : 2800;
    const me = getActive();
    if (!me || !me.alive) pickActive("creek");
    const shooter = getActive();
    if (shooter) pickupCrates(shooter);
    if (!cpuReady && cpuT >= CPU_THINK) {
      if (!shooter || !shooter.alive) {
        finishSettle();
        return;
      }
      const near = crates.find((c) => Math.abs(c.x - shooter.x) < 90 && Math.abs(c.y - shooter.y) < 50);
      if (near && !shooter.airborne) {
        shooter.walkDir = near.x < shooter.x ? -1 : 1;
        shooter.walkT = 0.3;
        shooter.facing = shooter.walkDir;
      }
      const target = cpuTarget();
      if (!target) {
        finishSettle();
        return;
      }
      const pick = cpuPickWeapon(shooter, target);
      if (!setWeapon(pick)) setWeapon("stick");
      const g = guessCpuAim(shooter, target);
      angle = g.angle;
      power = g.power;
      shooter.facing = Math.cos(angle) >= 0 ? 1 : -1;
      cpuReady = true;
      hud();
    }
    if (cpuReady && cpuT >= CPU_THINK + CPU_SHOW) {
      if (!tryFire()) finishSettle();
      return;
    }
    if (cpuT >= cap) {
      if (!tryFire()) finishSettle();
    }
  }

  function step(dt) {
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.remove("show");
    }
    waveT += dt;
    if (shake > 0.15) shake *= 0.86;
    else shake = 0;
    for (let i = trails.length - 1; i >= 0; i--) {
      trails[i].t -= dt;
      trails[i].w += 22 * dt;
      if (trails[i].t <= 0) trails.splice(i, 1);
    }
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t -= dt;
      if (flashes[i].t <= 0) flashes.splice(i, 1);
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
    if (isGuest()) {
      if (shot) {
        trailAt(
          shot.x + (shot.ox || 0),
          shot.y + (shot.oy || 0),
          shot.weapon === "rocket" ? "smoke" : shot.weapon === "chain" ? "tracer" : "puff"
        );
        if (shot.weapon === "rocket") trailAt(shot.x, shot.y, "smoke");
      }
      pellets.forEach((p) => {
        trailAt(p.x + (p.ox || 0), p.y + (p.oy || 0), p.weapon === "chain" ? "tracer" : p.weapon === "rocket" ? "smoke" : "puff");
      });
      return;
    }
    if (shopOpen) return;
    if (phase === "cpu") stepCpu(dt);
    if (phase === "fly") {
      stepShot();
      stepGunBurst(dt);
    }
    if (fuses.length && phase !== "ending" && phase !== "end") stepFuses(dt);
    bobers.forEach(stepBober);
    stepMines();
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
    netPush(false);
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
      if (y >= hazardY() || x < -20 || x > WORLD_W + 20 || solid(x, y)) break;
      if (i % 2 === 0) dots.push({ x, y });
    }
    return dots;
  }

  function fightSpan() {
    let y0 = WORLD_H;
    let y1 = 0;
    bobers.forEach((b) => {
      if (!b.alive) return;
      y0 = Math.min(y0, b.y - 96);
      y1 = Math.max(y1, b.y + 56);
    });
    if (shot) {
      y0 = Math.min(y0, shot.y - 48);
      y1 = Math.max(y1, shot.y + 36);
    }
    y1 = Math.max(y1, hazardY() + 12, 8);
    if (y0 >= y1) {
      y0 = 0;
      y1 = WORLD_H;
    }
    return { x0: 0, x1: WORLD_W, y0, y1, w: WORLD_W, h: y1 - y0 };
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
    const sW = cssW / WORLD_W;
    const sH = cssH / WORLD_H;
    const landscape = cssW >= cssH;
    let s = Math.max(sW, sH);
    const minVisW = WORLD_W * 0.92;
    if (cssW / s < minVisW) s = cssW / minVisW;
    const visW = cssW / s;
    const visH = cssH / s;
    let tx = visW >= WORLD_W ? (WORLD_W - visW) / 2 : (WORLD_W - visW) / 2;
    tx += userPanX;
    const minTx = visW >= WORLD_W ? (WORLD_W - visW) / 2 : 0;
    const maxTx = visW >= WORLD_W ? minTx : WORLD_W - visW;
    tx = clamp(tx, minTx, maxTx);
    const span = fightSpan();
    let ty;
    if (visH >= WORLD_H) {
      ty = WORLD_H - visH;
    } else {
      ty = WORLD_H - visH;
      const teamTop = clamp(span.y0, 0, WORLD_H);
      if (teamTop < ty) ty = teamTop;
      if (shot) {
        const want = shot.y - visH * 0.28;
        ty = clamp(want, 0, WORLD_H - visH);
      }
      ty = clamp(ty, 0, WORLD_H - visH);
    }
    const snap = !camInit || Math.abs(s - camS) > 0.18;
    if (snap) {
      camS = s;
      camX = tx;
      camY = ty;
      camInit = true;
    } else {
      camS += (s - camS) * 0.28;
      camX += (tx - camX) * 0.2;
      camY += (ty - camY) * 0.2;
    }
    view = {
      s: camS,
      camX,
      camY,
      cssW,
      cssH,
      dpr,
      landscape,
      cover: camS * WORLD_H >= cssH - 1.5 && camS * WORLD_W >= cssW * 0.9,
      skyFill: true,
      showRadar: cssW / camS < WORLD_W - 80,
    };
  }

  function drawSkyCover(sky) {
    if (sky) {
      const iw = sky.width || WORLD_W;
      const ih = sky.height || WORLD_H;
      const sc = Math.max(view.cssW / iw, view.cssH / ih);
      const dw = iw * sc;
      const dh = ih * sc;
      ctx.drawImage(sky, (view.cssW - dw) / 2, (view.cssH - dh) / 2, dw, dh);
      return;
    }
    ctx.fillStyle = "#1a1035";
    ctx.fillRect(0, 0, view.cssW, view.cssH);
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
      if (b.shield > 0) {
        ctx.strokeStyle = "#c8a060";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, BOBER_R + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#c8a060";
        ctx.fillText("SH " + b.shield, b.x, b.y + h / 2 + 10);
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
    if (id === "pine") return img.pine;
    if (id === "mine") return img.mine;
    if (id === "buckler") return img.buckler;
    if (id === "rocket") return img.rocket;
    if (id === "chain") return img.chain;
    return img.stick;
  }

  function draw() {
    layoutCam();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    if (shake > 0.2) ctx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const s = spec();
    const sky = img[s.sky] || img.skyEarth;
    drawSkyCover(sky);
    ctx.save();
    ctx.translate(-view.camX * view.s, -view.camY * view.s);
    ctx.scale(view.s, view.s);

    if (sky) {
      const visW = view.cssW / view.s;
      const visH = view.cssH / view.s;
      const iw = sky.width || WORLD_W;
      const ih = sky.height || WORLD_H;
      const sc = Math.max(visW / iw, visH / ih);
      const dw = iw * sc;
      const dh = ih * sc;
      ctx.drawImage(sky, view.camX + (visW - dw) / 2, view.camY + (visH - dh) / 2, dw, dh);
    } else {
      ctx.fillStyle = "#24143c";
      ctx.fillRect(view.camX, view.camY, view.cssW / view.s, view.cssH / view.s);
    }
    const waterTop = (s.washFrom || 500) - sdRise;
    const hy = hazardY();
    const wg = ctx.createLinearGradient(0, waterTop, 0, WORLD_H);
    if (s.hazard === "dust") {
      wg.addColorStop(0, "rgba(180, 90, 40, 0.28)");
      wg.addColorStop(0.45, "rgba(120, 50, 20, 0.7)");
      wg.addColorStop(1, "rgba(50, 18, 8, 0.92)");
    } else if (s.hazard === "acid") {
      wg.addColorStop(0, "rgba(180, 200, 40, 0.35)");
      wg.addColorStop(0.4, "rgba(120, 140, 20, 0.78)");
      wg.addColorStop(1, "rgba(50, 70, 8, 0.94)");
    } else if (s.hazard === "void") {
      wg.addColorStop(0, "rgba(20, 16, 32, 0.2)");
      wg.addColorStop(0.4, "rgba(8, 8, 14, 0.85)");
      wg.addColorStop(1, "rgba(0, 0, 0, 0.96)");
    } else if (s.hazard === "methane") {
      wg.addColorStop(0, "rgba(20, 80, 90, 0.35)");
      wg.addColorStop(0.4, "rgba(8, 40, 55, 0.82)");
      wg.addColorStop(1, "rgba(2, 16, 24, 0.96)");
    } else {
      wg.addColorStop(0, "rgba(70, 140, 170, 0.55)");
      wg.addColorStop(0.18, "rgba(28, 90, 120, 0.82)");
      wg.addColorStop(0.55, "rgba(14, 52, 74, 0.92)");
      wg.addColorStop(1, "rgba(6, 24, 38, 0.97)");
    }
    ctx.fillStyle = wg;
    ctx.fillRect(0, waterTop, WORLD_W, WORLD_H - waterTop);
    if (s.hazard === "water") {
      ctx.strokeStyle = "rgba(220, 245, 255, 0.5)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let x = 0; x <= WORLD_W; x += 14) {
        const yy = hy + Math.sin(x * 0.035 + waveT * 2.2) * 4;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
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
    mines.forEach((m) => {
      const spr = img.mine;
      if (spr) ctx.drawImage(spr, m.x - 14, m.y - 14, 28, 28);
      else {
        ctx.fillStyle = m.armed ? "#c08040" : "#6a5030";
        ctx.beginPath();
        ctx.arc(m.x, m.y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      if (m.armed) {
        ctx.fillStyle = "#ffe566";
        ctx.font = "bold 10px Trebuchet MS, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("ARMED", m.x, m.y - 18);
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

    if ((phase === "aim" && turn === myTeam()) || (phase === "cpu" && !isLink())) {
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

    trails.forEach((tr) => {
      ctx.globalAlpha = clamp(tr.t * 3, 0, 0.7);
      ctx.fillStyle = tr.kind === "tracer" ? "#ffe566" : tr.kind === "smoke" ? "rgba(80,70,90,0.9)" : "#f4e6c3";
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, tr.w * 0.45, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    flashes.forEach((f) => {
      ctx.globalAlpha = clamp(f.t * 5, 0, 0.9);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r * (1.4 - f.t * 2), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    function drawProj(p) {
      const spr = projSprite(p.weapon);
      const rot = Math.atan2(p.vy, p.vx) + (p.weapon === "rocket" ? p.spin || 0 : 0);
      const px = p.x + (p.ox || 0);
      const py = p.y + (p.oy || 0);
      if (p.weapon === "mortar") {
        const gy = surfaceY(px);
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "#1a1020";
        ctx.beginPath();
        ctx.ellipse(px, gy + 4, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (p.weapon === "rocket") {
        const spd = Math.hypot(p.vx, p.vy) || 1;
        ctx.save();
        ctx.strokeStyle = "rgba(90, 78, 104, 0.55)";
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        for (let k = 0; k < 10; k++) {
          const t = (p.spin || 0) - k * 0.42;
          const ox = (-p.vy / spd) * Math.sin(t) * 22;
          const oy = (p.vx / spd) * Math.sin(t) * 22;
          const bx = p.x - p.vx * k * 0.32;
          const by = p.y - p.vy * k * 0.32;
          if (k === 0) ctx.moveTo(bx + ox, by + oy);
          else ctx.lineTo(bx + ox, by + oy);
        }
        ctx.stroke();
        ctx.restore();
      }
      if (p.tracer || p.weapon === "chain") {
        ctx.strokeStyle = "#ffe566";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(px - Math.cos(rot) * 26, py - Math.sin(rot) * 26);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(rot);
      const sz = p.weapon === "rocket" ? 26 : p.weapon === "chain" ? 12 : 16;
      if (spr) ctx.drawImage(spr, -sz, -sz, sz * 2, sz * 2);
      else {
        ctx.fillStyle = p.weapon === "chain" ? "#ffe566" : "#F4E6C3";
        ctx.beginPath();
        ctx.arc(0, 0, p.weapon === "chain" ? 5 : 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (shot) drawProj(shot);
    pellets.forEach(drawProj);

    bits.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = clamp(p.life * 2, 0, 1);
      ctx.fillStyle =
        p.kind === "snow"
          ? "#F4E6C3"
          : p.kind === "sap"
            ? "#e8a020"
            : p.kind === "fire"
              ? "#ff6a1a"
              : p.kind === "ember"
                ? "#ffd36a"
                : p.kind === "smoke"
                  ? "#5a4a62"
                  : "#8B5A2B";
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
    if (isLink()) return phase === "aim" && turn === myTeam();
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

  function buy(id, fromNet) {
    const wpn = WEAPONS[id];
    const cost = wpn && wpn.cost;
    if (!cost) return false;
    if (isGuest() && !fromNet) {
      netSend({ t: "in", k: "buy", id });
      return true;
    }
    const team = fromNet ? "creek" : myTeam();
    const purse = team === "creek" ? cpuCoins : coins;
    if (purse < cost) {
      toast("NEED " + (cost - purse) + " MORE $BOBER", true);
      return false;
    }
    if (team === "creek") cpuCoins -= cost;
    else coins -= cost;
    ammo[team][id] = (ammo[team][id] || 0) + 1;
    saveCoins();
    BoberSfx.pop();
    hud();
    netPush(true);
    return true;
  }

  function startMatch() {
    if (isGuest()) return;
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
    mines = [];
    pellets = [];
    bits.length = 0;
    pops.length = 0;
    flashes.length = 0;
    trails.length = 0;
    gunBurst = null;
    shake = 0;
    shot = null;
    carveLog = [];
    carveN = 0;
    shopOpen = false;
    craterCount = 0;
    lastBlast = null;
    winner = null;
    matchCoins = 0;
    turnN = 0;
    sudden = false;
    sdRise = 0;
    sdTickAt = 0;
    if (isLink() && guestBag) {
      cpuCoins = guestBag.coins | 0;
      ammo.creek = guestBag.ammo || emptyAmmo();
    } else {
      cpuCoins = diffSpec().coins;
      ammo.creek = emptyAmmo();
    }
    weapon = "stick";
    setWeapon("stick");
    hudTop.classList.add("live");
    const appEl = $("app");
    if (appEl) appEl.classList.add("live");
    dock.classList.remove("hidden");
    lastPortrait = null;
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
    syncOrient();
    if (isHost()) netSend({ t: "go", mapId, carves: carveLog, n: carveN, st: packState() });
    if (!wasRunning) requestAnimationFrame(loop);
  }

  function leaveToSplash() {
    phase = "splash";
    running = false;
    shot = null;
    fuses.length = 0;
    hudTop.classList.remove("live");
    const appEl = $("app");
    if (appEl) {
      appEl.classList.remove("live");
    }
    dock.classList.add("hidden");
    if (tipStrip) tipStrip.classList.add("hidden");
    endcard.classList.add("hidden");
    shopEl.classList.add("hidden");
    howtoEl.classList.add("hidden");
    splash.classList.remove("hidden");
    const drop = $("net-drop");
    if (drop) drop.classList.add("hidden");
    if (window.BoberNet) BoberNet.close();
    netRole = null;
    netReady = false;
    guestBag = null;
  }

  function syncOrient() {
    const portrait = window.innerHeight > window.innerWidth + 40;
    if (lastPortrait !== null && lastPortrait !== portrait) camInit = false;
    lastPortrait = portrait;
    syncTrayChevs();
  }

  function syncTrayChevs() {
    const el = $("weapons");
    const l = $("tray-l");
    const r = $("tray-r");
    if (!el || !l || !r) return;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    l.disabled = el.scrollLeft <= 4;
    r.disabled = el.scrollLeft >= max - 4;
  }

  function scrollTray(dir) {
    const el = $("weapons");
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(96, el.clientWidth * 0.55), behavior: "smooth" });
    setTimeout(syncTrayChevs, 180);
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
    if (canControl()) {
      const tapped = boberAt(w.x, w.y, myTeam());
      if (tapped) {
        activeId = tapped.id;
        if (isGuest()) netSend({ t: "in", k: "active", id: tapped.id });
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
      if (canControl()) {
        const tapped = boberAt(w.x, w.y, myTeam());
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

  function packState() {
    return {
      t: "st",
      phase,
      turn,
      turnN,
      wind,
      weapon,
      power,
      angle,
      sudden,
      sdRise,
      mapId,
      winner,
      coinsL: coins,
      coinsC: cpuCoins,
      ammoL: { ...ammo.lodge },
      ammoC: { ...ammo.creek },
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
        facing: b.facing,
        standing: b.standing,
        airborne: b.airborne,
        sapTicks: b.sapTicks,
        shield: b.shield || 0,
        shieldTurns: b.shieldTurns || 0,
      })),
      crates: crates.map((c) => ({ x: c.x, y: c.y, kind: c.kind })),
      fuses: fuses.map((f) => ({ x: f.x, y: f.y, t: f.t, weapon: f.weapon, team: f.team })),
      walls: walls.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h, hp: w.hp, bornTurn: w.bornTurn })),
      mines: mines.map((m) => ({ x: m.x, y: m.y, armed: m.armed, bornTurn: m.bornTurn, team: m.team })),
      shot: shot ? { ...shot } : null,
      pellets: pellets.map((p) => ({ ...p })),
      gunBurst: gunBurst ? { ...gunBurst } : null,
      carveN,
      lastCarve: carveLog.length ? carveLog[carveLog.length - 1] : null,
    };
  }

  function netPush(force) {
    if (!isHost() || !netReady) return;
    const now = performance.now();
    const busy = phase === "fly" || phase === "fuse" || phase === "settle";
    if (!force && now - lastNetSend < (busy ? 80 : 280)) return;
    lastNetSend = now;
    netSend(packState());
  }

  function applyState(s) {
    if (!s) return;
    const wasEnd = phase === "end";
    phase = s.phase;
    turn = s.turn;
    turnN = s.turnN;
    wind = s.wind;
    sudden = !!s.sudden;
    sdRise = s.sdRise || 0;
    winner = s.winner;
    const keepAim = isGuest() && s.phase === "aim" && s.turn === "creek";
    if (!keepAim && !dragging) {
      weapon = s.weapon;
      power = s.power;
      angle = s.angle;
    }
    coins = s.coinsL | 0;
    cpuCoins = s.coinsC | 0;
    if (s.ammoL) ammo.lodge = s.ammoL;
    if (s.ammoC) ammo.creek = s.ammoC;
    if (s.bobers) {
      s.bobers.forEach((nb) => {
        const b = bobers.find((x) => x.id === nb.id);
        if (!b) return;
        Object.assign(b, nb);
      });
    }
    crates = (s.crates || []).map((c) => ({ ...c }));
    fuses = (s.fuses || []).map((f) => ({ ...f }));
    walls = (s.walls || []).map((w) => ({ ...w }));
    mines = (s.mines || []).map((m) => ({ ...m }));
    shot = s.shot ? { ...s.shot } : null;
    pellets = (s.pellets || []).map((p) => ({ ...p }));
    gunBurst = s.gunBurst ? { ...s.gunBurst } : null;
    if (s.lastCarve && s.carveN > carveN) {
      const lc = s.lastCarve;
      carve(lc.x, lc.y, lc.r, true);
      carveN = s.carveN;
      const fire = lc.r >= 40;
      burst(lc.x, lc.y, fire ? "fire" : "dirt");
      flash(lc.x, lc.y, lc.r * 1.1, fire ? "#ff9a3a" : "#ffe566");
      boomShake(lc.r);
    }
    hud();
    if (s.phase !== "aim") netFireLock = false;
    if (s.phase === "end" && !wasEnd) {
      const drop = $("net-drop");
      if (drop) drop.classList.add("hidden");
      hudTop.classList.remove("live");
      dock.classList.add("hidden");
      const mine = myTeam();
      if (s.winner === "draw") {
        endTitle.textContent = "DRAW";
        endMsg.textContent = "Everybody yeeted. The bank is empty.";
      } else if (s.winner === mine) {
        endTitle.textContent = "YOU WIN";
        endMsg.textContent = mine === "creek" ? "Creek took the bank." : "Bank cleared. Lodge still standing.";
      } else {
        endTitle.textContent = "YOU LOSE";
        endMsg.textContent = s.winner === "creek" ? "Crew down. Creek took the bank." : "Bank cleared. Lodge still standing.";
      }
      endcard.classList.remove("hidden");
    }
  }

  function guestGo(msg) {
    mapId = msg.mapId || mapId;
    splash.classList.add("hidden");
    endcard.classList.add("hidden");
    const drop = $("net-drop");
    if (drop) drop.classList.add("hidden");
    makeTerrain();
    carveLog = msg.carves || [];
    carveN = 0;
    carveLog.forEach((c) => carve(c.x, c.y, c.r, true));
    carveN = msg.n || carveLog.length;
    spawnCrew();
    applyState(msg.st);
    hudTop.classList.add("live");
    const appEl = $("app");
    if (appEl) appEl.classList.add("live");
    dock.classList.remove("hidden");
    const wasRunning = running;
    running = true;
    lastTs = performance.now();
    acc = 0;
    camInit = false;
    if (!wasRunning) requestAnimationFrame(loop);
  }

  function onNetEvent(ev) {
    if (ev.type === "open" && ev.code) {
      const el = $("room-code");
      if (el) el.textContent = ev.code;
      const st = $("host-status");
      if (st) st.textContent = "Waiting for friend…";
    }
    if (ev.type === "peer") {
      netReady = true;
      const st = $("host-status");
      if (isHost() && st) st.textContent = "Friend joined. Pick a map and START.";
      if (isHost()) {
        const play = $("btn-play");
        if (play) play.classList.remove("hidden");
        netSend({ t: "ok" });
      }
      if (isGuest()) {
        netSend({ t: "hello", coins, ammo: { ...ammo.lodge } });
        const js = $("join-status");
        if (js) js.textContent = "Connected. Host picks the map.";
      }
    }
    if (ev.type === "drop" || ev.type === "error") {
      if (phase !== "splash" && phase !== "end") showNetDrop();
      else if (ev.type === "error") toast("LINK FAIL", true);
    }
    if (ev.type !== "data" || !ev.msg) return;
    const msg = ev.msg;
    if (msg.t === "hello" && isHost()) {
      guestBag = { coins: msg.coins | 0, ammo: msg.ammo || emptyAmmo() };
    }
    if (msg.t === "go" && isGuest()) guestGo(msg);
    if (msg.t === "st" && isGuest()) applyState(msg);
    if (msg.t === "cv" && isGuest()) {
      carve(msg.x, msg.y, msg.r, true);
      carveN = msg.n || carveN + 1;
    }
    if (msg.t === "in" && isHost()) onGuestInput(msg);
  }

  function onGuestInput(msg) {
    if (turn !== "creek" || phase !== "aim") return;
    if (msg.k === "weapon") setWeapon(msg.id);
    if (msg.k === "active" && msg.id != null) {
      const b = bobers.find((x) => x.id === msg.id && x.team === "creek" && x.alive);
      if (b) activeId = b.id;
    }
    if (msg.k === "walk") walkActive(msg.dir, true);
    if (msg.k === "buy") buy(msg.id, true);
    if (msg.k === "fire") {
      if (msg.weapon) setWeapon(msg.weapon);
      if (msg.activeId != null) {
        const b = bobers.find((x) => x.id === msg.activeId && x.team === "creek" && x.alive);
        if (b) activeId = b.id;
      }
      angle = msg.angle;
      power = msg.power;
      tryFire(true);
    }
  }

  function showNetDrop() {
    netReady = false;
    const el = $("net-drop");
    if (el) el.classList.remove("hidden");
  }

  function setPlayMode(mode) {
    playMode = mode === "link" ? "link" : "vsai";
    document.querySelectorAll("#mode-pick .diff-card").forEach((el) => {
      el.classList.toggle("on", el.getAttribute("data-mode") === playMode);
    });
    const link = $("link-panel");
    const diffEl = $("splash-diff");
    const play = $("btn-play");
    if (playMode === "link") {
      if (link) link.classList.remove("hidden");
      if (diffEl) diffEl.classList.add("hidden");
      if (play) play.classList.add("hidden");
      showLinkPick();
    } else {
      if (link) link.classList.add("hidden");
      if (diffEl) diffEl.classList.remove("hidden");
      if (play) play.classList.remove("hidden");
      if (window.BoberNet) BoberNet.close();
      netRole = null;
      netReady = false;
    }
  }

  function showLinkPick() {
    const pick = $("link-pick");
    const hw = $("host-wait");
    const jb = $("join-box");
    if (pick) pick.classList.remove("hidden");
    if (hw) hw.classList.add("hidden");
    if (jb) jb.classList.add("hidden");
    const play = $("btn-play");
    if (play && playMode === "link") play.classList.add("hidden");
  }

  function bind() {
    loadCoins();
    hud();
    playBtn.addEventListener("click", () => {
      if (playMode === "link" && !isHost()) return;
      startMatch();
    });
    endRestart.addEventListener("click", () => {
      if (playMode === "link") {
        if (isHost() && netReady) startMatch();
        else toast("HOST STARTS", true);
        return;
      }
      startMatch();
    });
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
      if (!canControl()) return;
      angle -= 0.045;
      hudAim();
    });
    holdBtn($("ang-r"), () => {
      if (!canControl()) return;
      angle += 0.045;
      hudAim();
    });
    holdBtn($("pwr-d"), () => {
      if (!canControl()) return;
      power = clamp(power - 2, 0, 100);
      hudAim();
    });
    holdBtn($("pwr-u"), () => {
      if (!canControl()) return;
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
    const shopBtn = $("btn-shop");
    if (shopBtn) {
      shopBtn.addEventListener("click", onShopMatch);
      shopBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
    }
    if (coinChip) {
      coinChip.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        toast("$BOBER " + coins);
      });
      coinChip.addEventListener("pointerdown", (e) => e.stopPropagation());
    }
    if (shopEl) shopEl.addEventListener("pointerdown", (e) => e.stopPropagation());
    window.addEventListener("resize", syncOrient);
    window.addEventListener("orientationchange", () => setTimeout(syncOrient, 80));
    const wepsEl = $("weapons");
    if (wepsEl) wepsEl.addEventListener("scroll", syncTrayChevs);
    const trayL = $("tray-l");
    const trayR = $("tray-r");
    if (trayL) trayL.addEventListener("click", () => scrollTray(-1));
    if (trayR) trayR.addEventListener("click", () => scrollTray(1));
    $("w-mortar").addEventListener("click", () => {
      if (!setWeapon("mortar")) toast("BUY A CHARGE", true);
    });
    $("w-ice").addEventListener("click", () => {
      if (!setWeapon("ice")) toast("BUY A CHARGE", true);
    });
    $("w-pine").addEventListener("click", () => {
      if (!setWeapon("pine")) toast("BUY A CHARGE", true);
    });
    $("w-mine").addEventListener("click", () => {
      if (!setWeapon("mine")) toast("BUY A CHARGE", true);
    });
    $("w-buckler").addEventListener("click", () => {
      if (!setWeapon("buckler")) toast("BUY A CHARGE", true);
    });
    $("w-rocket").addEventListener("click", () => {
      if (!setWeapon("rocket")) toast("BUY A CHARGE", true);
    });
    $("w-chain").addEventListener("click", () => {
      if (!setWeapon("chain")) toast("BUY A CHARGE", true);
    });
    $("buy-dynamite").addEventListener("click", () => buy("dynamite"));
    $("buy-sap").addEventListener("click", () => buy("sap"));
    $("buy-mortar").addEventListener("click", () => buy("mortar"));
    $("buy-ice").addEventListener("click", () => buy("ice"));
    $("buy-pine").addEventListener("click", () => buy("pine"));
    $("buy-mine").addEventListener("click", () => buy("mine"));
    $("buy-buckler").addEventListener("click", () => buy("buckler"));
    $("buy-rocket").addEventListener("click", () => buy("rocket"));
    $("buy-chain").addEventListener("click", () => buy("chain"));
    $("shop-play").addEventListener("click", () => {
      if (shopFrom === "match") closeShop();
      else startMatch();
    });
    $("shop-back").addEventListener("click", closeShop);
    document.querySelectorAll(".map-card").forEach((el) => {
      el.addEventListener("click", () => setMap(el.getAttribute("data-map")));
    });
    document.querySelectorAll(".diff-card[data-diff]").forEach((el) => {
      el.addEventListener("click", () => setDiff(el.getAttribute("data-diff")));
    });
    syncDiffCards();
    const modeVs = $("mode-vsai");
    const modeLink = $("mode-link");
    if (modeVs) modeVs.addEventListener("click", () => setPlayMode("vsai"));
    if (modeLink) modeLink.addEventListener("click", () => setPlayMode("link"));
    const btnHost = $("btn-host");
    if (btnHost) {
      btnHost.addEventListener("click", () => {
        playMode = "link";
        netRole = "host";
        $("link-pick").classList.add("hidden");
        $("join-box").classList.add("hidden");
        $("host-wait").classList.remove("hidden");
        $("room-code").textContent = "…";
        $("host-status").textContent = "Waiting for friend…";
        BoberNet.host(onNetEvent).catch(() => {
          toast("LINK FAIL", true);
          showLinkPick();
        });
      });
    }
    const btnJoin = $("btn-join");
    if (btnJoin) {
      btnJoin.addEventListener("click", () => {
        $("link-pick").classList.add("hidden");
        $("host-wait").classList.add("hidden");
        $("join-box").classList.remove("hidden");
        $("join-status").textContent = "";
        const inp = $("join-code");
        if (inp) inp.focus();
      });
    }
    const btnConnect = $("btn-connect");
    if (btnConnect) {
      btnConnect.addEventListener("click", () => {
        const inp = $("join-code");
        const code = inp ? inp.value : "";
        playMode = "link";
        netRole = "guest";
        $("join-status").textContent = "Connecting…";
        BoberNet.join(code, onNetEvent).catch(() => {
          toast("LINK FAIL", true);
          $("join-status").textContent = "Could not connect. Check the code.";
        });
      });
    }
    ["btn-host-cancel", "btn-join-cancel"].forEach((id) => {
      const el = $(id);
      if (el) el.addEventListener("click", () => {
        if (window.BoberNet) BoberNet.close();
        netRole = null;
        netReady = false;
        showLinkPick();
      });
    });
    const dropR = $("drop-rematch");
    if (dropR) dropR.addEventListener("click", () => {
      $("net-drop").classList.add("hidden");
      leaveToSplash();
      setPlayMode("link");
    });
    const dropS = $("drop-splash");
    if (dropS) dropS.addEventListener("click", () => {
      $("net-drop").classList.add("hidden");
      leaveToSplash();
      setPlayMode("vsai");
    });
    const joinInp = $("join-code");
    if (joinInp) {
      joinInp.addEventListener("input", () => {
        joinInp.value = joinInp.value.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, "").slice(0, 4);
      });
    }
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
      if (ev.key === "7") setWeapon("pine");
      if (ev.key === "8") setWeapon("mine");
      if (ev.key === "9") setWeapon("buckler");
      if (ev.key === "0") setWeapon("rocket");
      if (ev.key === "-" || ev.key === "c" || ev.key === "C") setWeapon("chain");
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
      playMode,
      netRole,
      diff,
      sudden,
      sdRise,
      cpuCoins,
      crates: crates.map((c) => ({ x: c.x, y: c.y, kind: c.kind })),
      fuses: fuses.map((f) => ({ x: f.x, y: f.y, t: f.t, weapon: f.weapon })),
      walls: walls.map((w) => ({ x: w.x, y: w.y, hp: w.hp })),
      mines: mines.map((m) => ({ x: m.x, y: m.y, armed: m.armed })),
      view: {
        s: view.s,
        camX: view.camX,
        camY: view.camY,
        cssW: view.cssW,
        cssH: view.cssH,
        landscape: !!view.landscape,
        cover: !!view.cover,
        skyFill: !!view.skyFill,
      },
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
        shield: b.shield || 0,
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
    setDiff,
    MAPS,
    DIFFS,
    get diff() {
      return diff;
    },
    get sudden() {
      return sudden;
    },
    get sdRise() {
      return sdRise;
    },
    hazardY,
    forceSudden() {
      turnN = Math.max(turnN, SD_TURN);
      tickSuddenDeath();
      hud();
    },
    setTurnN(n) {
      turnN = Math.max(0, n | 0);
      tickSuddenDeath();
      hud();
    },
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
    loadImage("assets/sprites/pinecone.png").then((i) => (img.pine = i)),
    loadImage("assets/sprites/woodchip-mine.png").then((i) => (img.mine = i)),
    loadImage("assets/sprites/bark-buckler.png").then((i) => (img.buckler = i)),
    loadImage("assets/sprites/corkscrew-rocket.png").then((i) => (img.rocket = i)),
    loadImage("assets/sprites/lodge-chaingun.png").then((i) => (img.chain = i)),
    loadImage("assets/sprites/crate.png").then((i) => (img.crate = i)),
    loadImage("assets/sprites/stage-sky.jpg").then((i) => (img.skyEarth = i)),
    loadImage("assets/sprites/sky-mars.jpg").then((i) => (img.skyMars = i)),
    loadImage("assets/sprites/sky-moon.jpg").then((i) => (img.skyMoon = i)),
    loadImage("assets/sprites/sky-uranus.jpg").then((i) => (img.skyUranus = i)),
    loadImage("assets/sprites/ledges-ground.png").then((i) => (img.ledges = i)),
    loadImage("assets/sprites/bowl-ground.png").then((i) => (img.bowl = i)),
    loadImage("assets/sprites/mesa-ground.png").then((i) => (img.mesa = i)),
    loadImage("assets/sprites/crater-ground.png").then((i) => (img.crater = i)),
    loadImage("assets/sprites/methane-ground.png").then((i) => (img.methane = i)),
    loadImage("assets/sprites/acid-ground.png").then((i) => (img.acid = i)),
    loadImage("assets/sprites/ring-ground.png").then((i) => (img.ring = i)),
    loadImage("assets/sprites/pack-ground.png").then((i) => (img.pack = i)),
    loadImage("assets/sprites/frost-ground.png").then((i) => (img.frost = i)),
    loadImage("assets/sprites/dock-ground.png").then((i) => (img.dock = i)),
    loadImage("assets/sprites/sky-venus.jpg").then((i) => (img.skyVenus = i)),
    loadImage("assets/sprites/sky-saturn.jpg").then((i) => (img.skySaturn = i)),
    loadImage("assets/sprites/sky-neptune.jpg").then((i) => (img.skyNeptune = i)),
    loadImage("assets/sprites/sky-pluto.jpg").then((i) => (img.skyPluto = i)),
    loadImage("assets/sprites/sky-asteroid.jpg").then((i) => (img.skyAsteroid = i)),
  ])
    .catch((err) => console.error(err))
    .then(() => {
      bind();
      if (FAST) startMatch();
    });
})();
