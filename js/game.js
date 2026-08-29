(() => {
  const W = 1280;
  const H = 720;
  const GROUND_TOP = 640;
  const SLING = { x: 188, y: 528 };
  const MAX_PULL = 150;
  const POWER = 0.185;
  const SHOTS = 3;
  const LEVEL_TIME = 20;
  const LEVEL_COUNT = BoberLevels.COUNT;

  if (typeof Matter === "undefined") {
    const b = document.getElementById("btn-play");
    if (b) {
      b.disabled = false;
      b.textContent = "YEET";
    }
    console.error("Matter.js failed to load");
    return;
  }
  const { Engine, World, Bodies, Body, Events } = Matter;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;

  const splash = document.getElementById("splash");
  const endcard = document.getElementById("endcard");
  const toastEl = document.getElementById("toast");
  const hintEl = document.getElementById("hint");
  const scoreEl = document.getElementById("score");
  const levelEl = document.getElementById("level");
  const timeEl = document.getElementById("time");
  const ammoEl = document.getElementById("ammo");
  const muteBtn = document.getElementById("btn-mute");
  const restartBtn = document.getElementById("btn-restart");
  const nextBtn = document.getElementById("btn-next");
  const playBtn = document.getElementById("btn-play");
  const endTitle = document.getElementById("end-title");
  const endMsg = document.getElementById("end-msg");
  const endQuote = document.getElementById("end-quote");
  const endRestart = document.getElementById("end-restart");
  const endNext = document.getElementById("end-next");
  const nameInput = document.getElementById("player-name");
  const nameErr = document.getElementById("name-err");
  const playerChip = document.getElementById("player-chip");
  const boardEl = document.getElementById("board");
  const boardList = document.getElementById("board-list");
  const boardClose = document.getElementById("board-close");
  const btnBoard = document.getElementById("btn-board");
  const btnSplashBoard = document.getElementById("btn-splash-board");
  const endBoard = document.getElementById("end-board");

  const img = {};
  const pops = [];
  const bits = [];

  let engine, world;
  let state = "splash";
  let levelIndex = 0;
  let shotsLeft = SHOTS;
  let score = 0;
  let levelScore = 0;
  let scoreAtLevelStart = 0;
  let timeLeft = LEVEL_TIME;
  let lastTs = 0;
  let tickAcc = 0;
  let bober = null;
  let blocks = [];
  let starBodies = [];
  let starGot = false;
  let charge = 0;
  let chargedYeet = 0;
  let currentTheme = BoberLevels.themeFor(0);
  let dragging = false;
  let dragPos = null;
  let flight = false;
  let flightAge = 0;
  let levelAge = 0;
  let settleT = 0;
  let splatT = 0;
  let splatted = false;
  let toastT = 0;
  let shownHint = false;
  let hintT = 0;
  let structureLive = false;
  let unfreezeGrace = 0;
  let hitBlockThisShot = false;
  let uranusA = 0;
  let clouds = [];
  let playerName = "";
  let boardOpen = false;
  const starChip = document.getElementById("star-chip");

  const FACEPLANTS = [
    "FACEPLANT!",
    "Bóbr down.",
    "That's not a dam.",
    "Uranus saw that.",
    "Teeth first. Bold.",
    "Holder down!",
    "Yeet... adjacent.",
    "Let that sink in.",
    "The bird is not freed.",
    "Mars can wait.",
  ];

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
  }

  function worldFromEvent(ev) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - r.left) / r.width) * W,
      y: ((ev.clientY - r.top) / r.height) * H,
    };
  }

  function toast(text, fail) {
    toastEl.textContent = text;
    toastEl.classList.toggle("fail", !!fail);
    toastEl.classList.add("show");
    toastT = 1.25;
  }

  function pop(x, y, text, color) {
    pops.push({ x, y, text, color, t: 0.7 });
  }

  function burst(x, y, kind) {
    const n = kind === "stone" ? 8 : 12;
    for (let i = 0; i < n; i++) {
      bits.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 9,
        vy: (Math.random() - 0.8) * 8,
        w: 6 + Math.random() * 8,
        h: 5 + Math.random() * 7,
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.4,
        life: 0.45 + Math.random() * 0.4,
        kind,
      });
    }
  }

  function updateMuteBtn() {
    muteBtn.setAttribute("aria-pressed", BoberSfx.muted ? "true" : "false");
    muteBtn.textContent = BoberSfx.muted ? "🔇" : "🔊";
    muteBtn.title = BoberSfx.muted ? "Unmute" : "Mute";
  }

  function renderAmmo() {
    ammoEl.innerHTML = "";
    for (let i = 0; i < SHOTS; i++) {
      const el = document.createElement("img");
      el.src = "assets/sprites/bober-idle.png";
      el.alt = "";
      if (i >= shotsLeft) el.classList.add("used");
      ammoEl.appendChild(el);
    }
  }

  function hud() {
    scoreEl.textContent = "SCORE " + score;
    levelEl.textContent = "LV " + (levelIndex + 1) + "/" + LEVEL_COUNT;
    playerChip.textContent = playerName || BoberScores.defaultName;
    const ch = document.getElementById("charge-chip");
    if (ch) {
      ch.textContent = charge ? "⚡".repeat(charge) + " CHARGE" : "CHARGE";
      ch.classList.toggle("got", charge > 0);
      ch.classList.remove("hidden");
    }
    const s = Math.max(0, Math.ceil(timeLeft));
    timeEl.textContent = "0:" + String(s).padStart(2, "0");
    timeEl.classList.toggle("warn", s <= 5);
    renderAmmo();
  }

  function makeClouds() {
    clouds = [
      { x: 320, y: 90, s: 1 },
      { x: 540, y: 140, s: 0.7 },
      { x: 980, y: 80, s: 1.1 },
      { x: 1100, y: 180, s: 0.6 },
    ];
  }

  function clearWorld() {
    if (engine) {
      World.clear(world, false);
      Engine.clear(engine);
    }
    engine = Engine.create({ enableSleeping: true });
    engine.gravity.y = 1.15;
    world = engine.world;
    blocks = [];
    starBodies = [];
    starGot = false;
    chargedYeet = 0;
    bober = null;
    flight = false;
    dragging = false;
    dragPos = null;
    settleT = 0;
    splatT = 0;
    splatted = false;
    structureLive = false;
    unfreezeGrace = 0;
    hitBlockThisShot = false;
    bits.length = 0;
    pops.length = 0;

    const ground = Bodies.rectangle(W / 2, GROUND_TOP + 48, W + 200, 96, {
      isStatic: true,
      friction: 0.9,
      label: "ground",
    });
    const left = Bodies.rectangle(-40, H / 2, 80, H * 2, { isStatic: true, label: "wall" });
    World.add(world, [ground, left]);

    Events.on(engine, "collisionStart", onCollision);
  }

  const BLOCK_STATS = {
    wood: { d: 0.0009, hp: 2, rest: 0.08 },
    stone: { d: 0.003, hp: 2, rest: 0.02 },
    truck: { d: 0.0045, hp: 4, rest: 0.04 },
    rocket: { d: 0.0022, hp: 3, rest: 0.05 },
    xblock: { d: 0.0032, hp: 3, rest: 0.03 },
    sink: { d: 0.0026, hp: 3, rest: 0.06 },
    doge: { d: 0.0014, hp: 2, rest: 0.12 },
  };

  function addBlock(spec) {
    const st = BLOCK_STATS[spec.kind] || BLOCK_STATS.wood;
    const body = Bodies.rectangle(spec.x, spec.y, spec.w, spec.h, {
      isStatic: true,
      density: st.d,
      friction: 0.85,
      frictionStatic: 1.2,
      restitution: st.rest,
      chamfer: { radius: 3 },
      sleepThreshold: 20,
    });
    body.kind = spec.kind;
    body.maxHp = st.hp;
    body.hp = st.hp;
    body.bw = spec.w;
    body.bh = spec.h;
    body.label = spec.kind;
    World.add(world, body);
    blocks.push(body);
    return body;
  }

  function unfreezeStructure() {
    if (structureLive) return;
    structureLive = true;
    unfreezeGrace = 0.22;
    for (const b of blocks) {
      if (b._dead) continue;
      Body.setStatic(b, false);
      Body.setVelocity(b, { x: 0, y: 0 });
      Body.setAngularVelocity(b, 0);
    }
  }

  function spawnBober() {
    if (bober) {
      World.remove(world, bober);
    }
    bober = Bodies.circle(SLING.x, SLING.y - 6, 28, {
      density: 0.0036,
      restitution: 0.38,
      friction: 0.35,
      frictionAir: 0.006,
      label: "bober",
      sleepThreshold: 30,
    });
    Body.setStatic(bober, true);
    World.add(world, bober);
    flight = false;
    flightAge = 0;
    splatted = false;
    splatT = 0;
  }

  function loadLevel(i) {
    levelIndex = i;
    shotsLeft = SHOTS;
    levelScore = 0;
    scoreAtLevelStart = score;
    const L = BoberLevels.get(i);
    currentTheme = L.theme || BoberLevels.themeFor(i);
    timeLeft = L.time || LEVEL_TIME;
    levelAge = 0;
    tickAcc = 0;
    shownHint = true;
    hintT = 3.4;
    hintEl.textContent = L.hint || (i === 0 ? "PULL BACK" : "");
    hintEl.classList.toggle("hidden", !hintEl.textContent);
    starChip.classList.toggle("hidden", !(L.stars && L.stars.length));
    starChip.classList.remove("got");
    clearWorld();
    L.blocks.forEach(addBlock);
    starBodies = (L.stars || []).map((s) => {
      const b = Bodies.circle(s.x, s.y, s.r || 16, {
        isStatic: true,
        isSensor: true,
        label: "star",
      });
      World.add(world, b);
      return b;
    });
    spawnBober();
    hud();
    document.getElementById("hud").classList.add("live");
    endcard.classList.add("hidden");
    state = "play";
  }

  function smash(body) {
    if (!body || body._dead) return;
    body._dead = true;
    burst(body.position.x, body.position.y, body.kind);
    pop(body.position.x, body.position.y - 20, "+1", "#f5c400");
    score += 1;
    levelScore += 1;
    if (body.kind === "stone") BoberSfx.stone();
    else BoberSfx.wood();
    World.remove(world, body);
    blocks = blocks.filter((b) => b !== body);
    hud();
    if (structureCleared()) winLevel();
  }

  function collectStar(at, body) {
    if (!body || body._dead) return;
    body._dead = true;
    World.remove(world, body);
    starBodies = starBodies.filter((s) => s !== body);
    starGot = true;
    charge = Math.min(3, charge + 1);
    score += 3;
    levelScore += 3;
    pop(at.x, at.y, "CHARGE +1", "#ffe566");
    toast(charge === 1 ? "CHARGED!" : "CHARGE x" + charge + "!");
    BoberSfx.star();
    starChip.classList.add("got");
    hud();
  }

  function isKeyKind(kind) {
    return !!(BoberLevels.KEYS && BoberLevels.KEYS[kind]);
  }

  function structureCleared() {
    if (blocks.some((b) => isKeyKind(b.kind))) return false;
    const standing = blocks.filter((b) => {
      const reach = Math.max(b.bw, b.bh) * 0.5;
      const onFloor = b.position.y + reach >= GROUND_TOP - 16;
      const gone = b.position.x > W + 30 || b.position.x < -20 || b.position.y > H + 40;
      return !onFloor && !gone;
    });
    return standing.length === 0;
  }

  function failWhy() {
    const keys = blocks.filter((b) => isKeyKind(b.kind)).length;
    if (keys) return keys + " heavy bit" + (keys === 1 ? "" : "s") + " still holding.";
    if (blocks.length) return "Still stacked. Hit the base or CHARGE a star.";
    return "The dam is still standing.";
  }

  function relSpeed(a, b) {
    return Math.hypot(a.velocity.x - b.velocity.x, a.velocity.y - b.velocity.y);
  }

  function onCollision(ev) {
    for (const pair of ev.pairs) {
      const A = pair.bodyA;
      const B = pair.bodyB;
      const kinds = [A.label, B.label];

      if (kinds.includes("star") && flight) {
        const star = A.label === "star" ? A : B;
        const other = star === A ? B : A;
        const byBober = other.label === "bober";
        const byDebris = other.kind && structureLive && other.speed > 7;
        if (byBober || byDebris) collectStar(star.position, star);
      }

      const speed = relSpeed(A, B);
      for (const body of [A, B]) {
        if (!body.kind || body._dead) continue;
        const other = body === A ? B : A;
        const hitByBober = other.label === "bober" && flight;
        if (hitByBober) {
          hitBlockThisShot = true;
          unfreezeStructure();
          let dmg = speed >= 13 ? 2 : speed >= 7 ? 1 : 0;
          dmg += chargedYeet;
          const need = isKeyKind(body.kind) ? (chargedYeet ? 6 : 9) : 6;
          if (speed < need && chargedYeet === 0) continue;
          if (dmg) {
            body.hp -= dmg;
            if (body.hp <= 0) smash(body);
          }
          continue;
        }
        if (!structureLive || unfreezeGrace > 0) continue;
        if (isKeyKind(body.kind)) {
          if (isKeyKind(other.kind) && speed >= 14) {
            body.hp -= 1;
            if (body.hp <= 0) smash(body);
          }
          continue;
        }
        if (speed >= 11) {
          body.hp -= 1;
          if (body.hp <= 0) smash(body);
        }
      }

      if (state === "play" && flight && !splatted && !hitBlockThisShot) {
        const groundHit =
          (A.label === "bober" && B.label === "ground") ||
          (B.label === "bober" && A.label === "ground");
        if (groundHit && bober) {
          const spd = bober.speed;
          const faceDown = Math.abs(Math.sin(bober.angle)) > 0.72;
          if (spd > 6 && (faceDown || bober.velocity.y > 9)) {
            splatted = true;
            splatT = 1.4;
            toast(FACEPLANTS[(Math.random() * FACEPLANTS.length) | 0], true);
            BoberSfx.splat();
          }
        }
      }
    }
  }

  function clampPull(p) {
    const dx = p.x - SLING.x;
    const dy = p.y - SLING.y;
    const d = Math.hypot(dx, dy) || 1;
    const m = Math.min(d, MAX_PULL);
    return { x: SLING.x + (dx / d) * m, y: SLING.y + (dy / d) * m };
  }

  function launch() {
    if (!bober || !dragPos) return;
    const p = dragPos;
    chargedYeet = charge;
    charge = 0;
    const boost = 1 + chargedYeet * 0.32;
    const vx = (SLING.x - p.x) * POWER * boost;
    const vy = (SLING.y - p.y) * POWER * boost;
    World.remove(world, bober);
    bober = Bodies.circle(p.x, p.y, 28 + chargedYeet * 5, {
      density: 0.004 * (1 + chargedYeet * 0.45),
      restitution: 0.38,
      friction: 0.35,
      frictionAir: 0.004,
      label: "bober",
      sleepThreshold: Infinity,
    });
    World.add(world, bober);
    Body.setVelocity(bober, { x: vx, y: vy });
    Body.setAngularVelocity(bober, (p.x - SLING.x) * 0.003);
    flight = true;
    flightAge = 0;
    hitBlockThisShot = false;
    dragging = false;
    dragPos = null;
    shotsLeft -= 1;
    shownHint = false;
    hintEl.classList.add("hidden");
    if (chargedYeet) toast(chargedYeet >= 2 ? "SUPER YEET!" : "CHARGED YEET!");
    BoberSfx.twang();
    hud();
  }

  function remainingBlocksOnscreen() {
    return blocks.filter((b) => {
      const { x, y } = b.position;
      return x > -30 && x < W + 40 && y < H + 60;
    });
  }

  function sweepOffscreen() {
    for (const b of [...blocks]) {
      const { x, y } = b.position;
      if (x < -40 || x > W + 80 || y > H + 80) smash(b);
    }
  }

  function bodiesQuiet() {
    if (!bober) return true;
    const bobSlow =
      bober.speed < 0.55 ||
      bober.position.x > W + 20 ||
      bober.position.x < -40 ||
      bober.position.y > H + 20;
    const pileSlow = remainingBlocksOnscreen().every((b) => b.speed < 0.45 || b.isSleeping);
    return bobSlow && pileSlow;
  }

  function winLevel() {
    if (state !== "play") return;
    const bonus = shotsLeft;
    score += bonus;
    if (levelIndex >= LEVEL_COUNT - 1) {
      finishGame();
      return;
    }
    state = "win";
    BoberSfx.win();
    if (endQuote) endQuote.classList.add("hidden");
    endTitle.textContent = "YEET!";
    endMsg.textContent =
      BoberLevels.get(levelIndex).name +
      " smashed. +" +
      levelScore +
      (starGot ? " + charge" : "") +
      (bonus ? " +" + bonus + " leftover shot" + (bonus === 1 ? "" : "s") : "") +
      ".";
    endNext.textContent = "NEXT LEVEL";
    endcard.classList.remove("hidden");
    hud();
    submitRun();
  }

  function failLevel() {
    if (state !== "play") return;
    state = "fail";
    BoberSfx.fail();
    if (endQuote) endQuote.classList.add("hidden");
    endTitle.textContent = timeLeft <= 0 ? "TIME'S UP" : "NO BOBER LEFT";
    endMsg.textContent = failWhy() + " Restart or skip.";
    endNext.textContent = levelIndex >= LEVEL_COUNT - 1 ? "DONE" : "NEXT LEVEL";
    endcard.classList.remove("hidden");
    submitRun();
  }

  function finishGame() {
    state = "done";
    BoberSfx.win();
    endcard.classList.remove("hidden");
    endTitle.textContent = "MARS IS FULL";
    endMsg.textContent =
      (playerName || "online player") +
      " cleared all 100 dams. Score " +
      score +
      ".";
    if (endQuote) {
      endQuote.classList.remove("hidden");
      endQuote.innerHTML =
        "bober is now a multiplanetary species.\n" +
        "100 dams. zero ads. the bird is freed.\n" +
        "cybertruck could never.\n" +
        "see you on uranus. then mars. then whatever’s next.\n" +
        "let that sink in." +
        "<cite>— a totally real memo from Elon, probably</cite>";
    }
    endNext.textContent = "PLAY AGAIN";
    hud();
    submitRun(LEVEL_COUNT);
  }

  async function submitRun(levelsDone) {
    const name = playerName || BoberScores.defaultName;
    if (score <= 0) return;
    const levels = levelsDone || Math.max(1, levelIndex + 1);
    try {
      await BoberScores.submit({
        name,
        score,
        levels: Math.min(LEVEL_COUNT, levels),
        at: Date.now(),
      });
    } catch (_) {}
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  async function openBoard() {
    boardOpen = true;
    boardEl.classList.remove("hidden");
    boardList.innerHTML = '<div class="board-empty">Loading yeets...</div>';
    const rows = await BoberScores.list();
    if (!rows.length) {
      boardList.innerHTML = '<div class="board-empty">No yeets yet. Be the first dam.</div>';
      return;
    }
    const medals = ["🥇", "🥈", "🥉"];
    const head =
      '<div class="board-row head"><span>#</span><span>PLAYER</span><span>SCORE</span><span>LV</span></div>';
    const body = rows
      .slice(0, 15)
      .map((r, i) => {
        const me = playerName && r.name.toLowerCase() === playerName.toLowerCase() ? " me" : "";
        const rank = medals[i] || String(i + 1);
        return (
          '<div class="board-row' +
          me +
          '"><span>' +
          rank +
          "</span><span>" +
          escapeHtml(r.name) +
          "</span><span>" +
          r.score +
          "</span><span>" +
          r.levels +
          "/" +
          LEVEL_COUNT +
          "</span></div>"
        );
      })
      .join("");
    boardList.innerHTML = head + body;
  }

  function closeBoard() {
    boardOpen = false;
    boardEl.classList.add("hidden");
  }

  function refreshNameGate() {
    playBtn.disabled = false;
    nameErr.classList.add("hidden");
  }

  function nextLevel() {
    if (levelIndex >= LEVEL_COUNT - 1) {
      if (state === "done") {
        score = 0;
        charge = 0;
        loadLevel(0);
        return;
      }
      finishGame();
      return;
    }
    loadLevel(levelIndex + 1);
  }

  function maybeEndShot() {
    if (state !== "play" || !flight) return;
    if (flightAge < 0.55) return;
    if (splatted && splatT > 0) return;
    if (!bodiesQuiet()) {
      settleT = 0;
      return;
    }
    settleT += 1 / 60;
    if (settleT < 0.7) return;
    settleT = 0;
    sweepOffscreen();
    if (state !== "play") return;
    if (structureCleared()) {
      winLevel();
      return;
    }
    if (shotsLeft <= 0) {
      failLevel();
      return;
    }
    spawnBober();
  }

  function onDown(ev) {
    BoberSfx.ensure();
    if (state !== "play" || flight || !bober) return;
    const p = worldFromEvent(ev);
    if (Math.hypot(p.x - bober.position.x, p.y - bober.position.y) > 90) return;
    dragging = true;
    dragPos = clampPull(p);
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch (_) {}
    ev.preventDefault();
  }

  function onMove(ev) {
    if (!dragging) return;
    dragPos = clampPull(worldFromEvent(ev));
    ev.preventDefault();
  }

  function onUp(ev) {
    if (!dragging) return;
    dragPos = clampPull(worldFromEvent(ev));
    const d = Math.hypot(dragPos.x - SLING.x, dragPos.y - SLING.y);
    if (d < 18) {
      dragging = false;
      dragPos = null;
      Body.setPosition(bober, { x: SLING.x, y: SLING.y - 6 });
      return;
    }
    launch();
    ev.preventDefault();
  }

  function drawPlanet(kind) {
    uranusA += 0.003;
    ctx.save();
    ctx.translate(1080, 128);
    ctx.rotate(kind === "uranus" ? uranusA : uranusA * 0.6);
    if (kind === "uranus" && img.uranus) {
      const uw = 210;
      const uh = uw * (img.uranus.height / img.uranus.width);
      ctx.drawImage(img.uranus, -uw / 2, -uh / 2, uw, uh);
    } else {
      const g = ctx.createRadialGradient(-20, -20, 10, 0, 0, 90);
      if (kind === "mars") {
        g.addColorStop(0, "#f08a4a");
        g.addColorStop(1, "#8a2810");
      } else if (kind === "moon") {
        g.addColorStop(0, "#eee8d8");
        g.addColorStop(1, "#8a8478");
      } else if (kind === "earth") {
        g.addColorStop(0, "#7ec8f0");
        g.addColorStop(0.55, "#3d8a3a");
        g.addColorStop(1, "#1a4a8a");
      } else {
        g.addColorStop(0, "#c8c8d8");
        g.addColorStop(1, "#444");
      }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 88, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#1a1020";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSky() {
    const th = currentTheme || BoberLevels.themeFor(levelIndex);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(0.5, th.sky[1]);
    g.addColorStop(1, th.sky[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    if (th.planet && th.planet !== "none") drawPlanet(th.planet);
    ctx.fillStyle = th.cloud || "rgba(255,255,255,0.5)";
    for (const c of clouds) {
      c.x += 0.12 * c.s;
      if (c.x > W + 80) c.x = -80;
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, 48 * c.s, 22 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + 28 * c.s, c.y + 4, 34 * c.s, 18 * c.s, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - 26 * c.s, c.y + 6, 30 * c.s, 16 * c.s, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawGround() {
    const th = currentTheme || BoberLevels.themeFor(levelIndex);
    ctx.fillStyle = th.dirt;
    ctx.fillRect(0, GROUND_TOP, W, H - GROUND_TOP);
    ctx.fillStyle = th.grass;
    ctx.fillRect(0, GROUND_TOP, W, 18);
    ctx.fillStyle = th.dirt;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(0, GROUND_TOP + 14, W, 6);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#1a1020";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_TOP);
    ctx.lineTo(W, GROUND_TOP);
    ctx.stroke();
  }

  function drawSling() {
    if (!img.sling) return;
    const sh = 236;
    const sw = sh * (img.sling.width / img.sling.height);
    ctx.drawImage(img.sling, SLING.x - sw / 2, GROUND_TOP - sh + 20, sw, sh);
  }

  function forkTips() {
    return [
      { x: SLING.x - 28, y: SLING.y - 72 },
      { x: SLING.x + 30, y: SLING.y - 70 },
    ];
  }

  function drawBands(to) {
    const [L, R] = forkTips();
    ctx.lineCap = "round";
    ctx.strokeStyle = "#c9a000";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.quadraticCurveTo((L.x + to.x) / 2, to.y + 18, to.x - 12, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(R.x, R.y);
    ctx.quadraticCurveTo((R.x + to.x) / 2, to.y + 18, to.x + 12, to.y);
    ctx.stroke();
    ctx.strokeStyle = "#ffe566";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y);
    ctx.quadraticCurveTo((L.x + to.x) / 2, to.y + 18, to.x - 12, to.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(R.x, R.y);
    ctx.quadraticCurveTo((R.x + to.x) / 2, to.y + 18, to.x + 12, to.y);
    ctx.stroke();
  }

  function drawAimPreview(from) {
    let x = from.x;
    let y = from.y;
    const boost = 1 + charge * 0.32;
    let vx = (SLING.x - from.x) * POWER * boost;
    let vy = (SLING.y - from.y) * POWER * boost;
    ctx.fillStyle = charge ? "rgba(255, 120, 40, 0.95)" : "rgba(255, 230, 90, 0.9)";
    for (let i = 0; i < 16; i++) {
      vx *= 0.996;
      vy = vy * 0.996 + 0.32;
      x += vx;
      y += vy;
      if (y > GROUND_TOP - 8) break;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2.2, 5.2 - i * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawBlock(body) {
    const { x, y } = body.position;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(body.angle);
    const w = body.bw;
    const h = body.bh;
    if (body.kind === "wood") {
      ctx.fillStyle = "#c4894a";
      roundRect(-w / 2, -h / 2, w, h, 7);
      ctx.fill();
      ctx.fillStyle = "#a86b32";
      roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 5);
      ctx.fill();
      ctx.strokeStyle = "#6a4020";
      ctx.lineWidth = 2;
      for (let i = -h / 2 + 10; i < h / 2 - 6; i += 9) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, i);
        ctx.lineTo(w / 2 - 8, i + 1);
        ctx.stroke();
      }
    } else if (body.kind === "truck") {
      ctx.fillStyle = "#c8ccc4";
      roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.fillStyle = "#9aa090";
      roundRect(-w / 2 + 6, -h / 2 + 6, w * 0.38, h - 12, 4);
      ctx.fill();
      ctx.fillStyle = "#1a1020";
      ctx.fillRect(-w / 2 + 10, h / 2 - 10, 10, 8);
      ctx.fillRect(w / 2 - 22, h / 2 - 10, 10, 8);
    } else if (body.kind === "rocket") {
      ctx.fillStyle = "#e8e4dc";
      roundRect(-w / 2, -h / 2, w, h, 10);
      ctx.fill();
      ctx.fillStyle = "#c03020";
      ctx.fillRect(-w / 2 + 4, h / 2 - 12, w - 8, 10);
      ctx.fillStyle = "#3a6aaa";
      ctx.beginPath();
      ctx.arc(0, -h / 4, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (body.kind === "xblock") {
      ctx.fillStyle = "#141418";
      roundRect(-w / 2, -h / 2, w, h, 6);
      ctx.fill();
      ctx.strokeStyle = "#f0f0f0";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-w / 4, -h / 4);
      ctx.lineTo(w / 4, h / 4);
      ctx.moveTo(w / 4, -h / 4);
      ctx.lineTo(-w / 4, h / 4);
      ctx.stroke();
    } else if (body.kind === "sink") {
      ctx.fillStyle = "#d8dce2";
      roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.fillStyle = "#9aa4b0";
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.28, h * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (body.kind === "doge") {
      ctx.fillStyle = "#e8b030";
      roundRect(-w / 2, -h / 2, w, h, 10);
      ctx.fill();
      ctx.fillStyle = "#fff6c4";
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(w, h) * 0.22, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#9aa0aa";
      roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
      ctx.fillStyle = "#7a7e86";
      roundRect(-w / 2 + 4, -h / 2 + 4, w - 8, h - 8, 6);
      ctx.fill();
      ctx.fillStyle = "#b3b7be";
      ctx.beginPath();
      ctx.arc(-w / 6, -h / 6, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    if (body.hp < body.maxHp) {
      ctx.strokeStyle = "#1a1020";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w / 4, -h / 3);
      ctx.lineTo(w / 8, h / 5);
      ctx.moveTo(w / 5, -h / 4);
      ctx.lineTo(-w / 6, h / 3);
      ctx.stroke();
    }
    ctx.strokeStyle = "#1a1020";
    ctx.lineWidth = 4;
    roundRect(-w / 2, -h / 2, w, h, 7);
    ctx.stroke();
    ctx.restore();
  }

  function drawStar() {
    if (!img.star) return;
    const t = Date.now() / 400;
    starBodies.forEach((st, i) => {
      if (!st || st._dead) return;
      const x = st.position.x;
      const y = st.position.y + Math.sin(t + i) * 4;
      const s = 44;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 0.4);
      ctx.drawImage(img.star, -s / 2, -s / 2, s, s);
      ctx.restore();
    });
  }

  function drawBober() {
    if (!bober) return;
    let { x, y } = bober.position;
    let spr = img.idle;
    let ang = 0;
    let size = 84;
    if (splatted && img.splat) {
      spr = img.splat;
      ang = 0;
      size = 92;
      y = Math.min(y, GROUND_TOP - 30);
    } else if (flight && img.fly) {
      spr = img.fly;
      ang = bober.angle;
      size = 112;
    }
    if (!spr) return;
    const ratio = spr.height / spr.width;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    if (charge > 0 && !flight) {
      ctx.shadowColor = "#ff9a2a";
      ctx.shadowBlur = 18 + charge * 10;
    }
    if (chargedYeet > 0 && flight) {
      ctx.shadowColor = "#ff5a00";
      ctx.shadowBlur = 22 + chargedYeet * 8;
      size += chargedYeet * 8;
    }
    ctx.drawImage(spr, -size / 2, -(size * ratio) / 2, size, size * ratio);
    ctx.restore();
  }

  function drawBits(dt) {
    for (let i = bits.length - 1; i >= 0; i--) {
      const p = bits[i];
      p.life -= dt;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 18 * dt;
      p.rot += p.vr;
      if (p.life <= 0) {
        bits.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.kind === "stone" ? "#8a8e96" : "#b8743b";
      ctx.strokeStyle = "#1a1020";
      ctx.lineWidth = 2;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }

  function drawPops(dt) {
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i];
      p.t -= dt;
      p.y -= 28 * dt;
      if (p.t <= 0) {
        pops.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = Math.min(1, p.t * 3);
      ctx.font = "900 22px Trebuchet MS, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#1a1020";
      ctx.fillStyle = p.color;
      ctx.strokeText(p.text, p.x, p.y);
      ctx.fillText(p.text, p.x, p.y);
      ctx.restore();
    }
  }

  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;

    if (state === "play" && !boardOpen) {
      Engine.update(engine, 1000 / 120);
      Engine.update(engine, 1000 / 120);
      levelAge += dt;
      if (unfreezeGrace > 0) unfreezeGrace -= dt;
      if (hintT > 0) {
        hintT -= dt;
        if (hintT <= 0) hintEl.classList.add("hidden");
      }
      timeLeft -= dt;
      if (timeLeft <= 5 && timeLeft > 0) {
        tickAcc += dt;
        if (tickAcc >= 1) {
          tickAcc = 0;
          BoberSfx.tick();
        }
      }
      timeEl.textContent = "0:" + String(Math.max(0, Math.ceil(timeLeft))).padStart(2, "0");
      timeEl.classList.toggle("warn", timeLeft <= 5);
      if (timeLeft <= 0) {
        timeLeft = 0;
        sweepOffscreen();
        if (structureCleared()) winLevel();
        else failLevel();
      }
      if (dragging && bober && dragPos) {
        Body.setPosition(bober, dragPos);
      }
      if (flight) {
        flightAge += dt;
        maybeEndShot();
      }
      if (splatT > 0) splatT -= dt;
    }

    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.remove("show");
    }

    drawSky();
    drawGround();
    if (state !== "splash") drawSling();
    drawStar();
    for (const b of blocks) drawBlock(b);

    const hold = dragging && dragPos ? dragPos : bober ? bober.position : SLING;
    if (!flight && bober) drawBands(hold);
    if (dragging && dragPos) drawAimPreview(dragPos);
    drawBober();
    drawBits(dt);
    drawPops(dt);

    requestAnimationFrame(frame);
  }

  muteBtn.addEventListener("click", () => {
    BoberSfx.ensure();
    BoberSfx.setMuted(!BoberSfx.muted);
    updateMuteBtn();
  });
  restartBtn.addEventListener("click", () => {
    BoberSfx.ensure();
    score = scoreAtLevelStart;
    loadLevel(levelIndex);
  });
  nextBtn.addEventListener("click", () => {
    BoberSfx.ensure();
    if (levelIndex >= LEVEL_COUNT - 1 && (state === "win" || state === "done")) finishGame();
    else nextLevel();
  });
  let assetsReady = false;
  let startWhenReady = false;

  function beginRun() {
    const n = BoberScores.setSavedName(nameInput.value || BoberScores.defaultName);
    playerName = n || BoberScores.defaultName;
    splash.classList.add("hidden");
    score = 0;
    charge = 0;
    loadLevel(0);
  }

  playBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    BoberSfx.ensure();
    if (!assetsReady) {
      playBtn.textContent = "LOADING...";
      startWhenReady = true;
      return;
    }
    beginRun();
  });
  nameInput.addEventListener("input", refreshNameGate);
  nameInput.addEventListener("change", refreshNameGate);
  nameInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") playBtn.click();
  });
  btnBoard.addEventListener("click", () => {
    BoberSfx.ensure();
    openBoard();
  });
  btnSplashBoard.addEventListener("click", () => {
    BoberSfx.ensure();
    openBoard();
  });
  endBoard.addEventListener("click", () => {
    BoberSfx.ensure();
    openBoard();
  });
  boardClose.addEventListener("click", closeBoard);
  endRestart.addEventListener("click", () => {
    BoberSfx.ensure();
    if (state === "done") {
      score = 0;
      charge = 0;
      loadLevel(0);
      return;
    }
    score = scoreAtLevelStart;
    loadLevel(levelIndex);
  });
  endNext.addEventListener("click", () => {
    BoberSfx.ensure();
    nextLevel();
  });

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener(
    "touchmove",
    (e) => {
      if (e.target.closest && e.target.closest("input, textarea, .board-list, button")) return;
      e.preventDefault();
    },
    { passive: false }
  );

  playBtn.disabled = false;
  refreshNameGate();
  if (!nameInput.value) nameInput.value = BoberScores.getSavedName() || BoberScores.defaultName;

  Promise.allSettled([
    loadImage("assets/sprites/bober-idle.png").then((i) => (img.idle = i)),
    loadImage("assets/sprites/bober-fly.png").then((i) => (img.fly = i)),
    loadImage("assets/sprites/bober-splat.png").then((i) => (img.splat = i)),
    loadImage("assets/sprites/uranus.png").then((i) => (img.uranus = i)),
    loadImage("assets/sprites/slingshot.png").then((i) => (img.sling = i)),
    loadImage("assets/sprites/star.png").then((i) => (img.star = i)),
  ]).then(() => {
    assetsReady = true;
    playBtn.textContent = "YEET";
    makeClouds();
    updateMuteBtn();
    if (!nameInput.value.trim()) nameInput.value = BoberScores.getSavedName() || BoberScores.defaultName;
    refreshNameGate();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") submitRun();
    });
    window.addEventListener("pagehide", () => submitRun());
    requestAnimationFrame(frame);
    if (startWhenReady) beginRun();
  });
})();
