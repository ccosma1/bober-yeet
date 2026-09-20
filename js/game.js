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
  const FAST = /(?:\?|&)selftest=1(?:&|$)/.test(location.search);
  const CPU_THINK = FAST ? 180 : 900;
  const CPU_SHOW = FAST ? 220 : 800;

  const WEAPONS = {
    stick: { id: "stick", name: "Yeet Stick", dmg: 25, blast: 28, r: 7 },
    snow: { id: "snow", name: "Snowball", dmg: 15, blast: 36, r: 9 },
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
    const n = kind === "snow" ? 14 : 10;
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

  function solid(x, y) {
    const ix = x | 0;
    const iy = y | 0;
    if (ix < 0 || iy < 0 || ix >= WORLD_W || iy >= WORLD_H) return false;
    return mask[iy * WORLD_W + ix] === 1;
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

  function heightAt(x) {
    const cx = ((x / 5) | 0) * 5;
    const u = cx / WORLD_W;
    const left = 358 + 26 * Math.sin(cx * 0.02) + 12 * Math.sin(cx * 0.07);
    const right = 350 + 30 * Math.sin(cx * 0.017 + 2) + 10 * Math.sin(cx * 0.053);
    let y = WATER_Y + 24;
    if (u < 0.44) {
      const k = smooth(u, 0.015, 0.09) * (1 - smooth(u, 0.34, 0.45));
      y = WATER_Y + 24 - k * (WATER_Y + 24 - left);
    }
    if (u > 0.56) {
      const k = smooth(u, 0.55, 0.66) * (1 - smooth(u, 0.91, 0.985));
      y = WATER_Y + 24 - k * (WATER_Y + 24 - right);
    }
    return (y / 4) * 4;
  }

  function makeTerrain() {
    tctx.clearRect(0, 0, WORLD_W, WORLD_H);
    const im = tctx.createImageData(WORLD_W, WORLD_H);
    const d = im.data;
    const SNOW = [244, 230, 195];
    const SNOW2 = [255, 248, 230];
    const ICE = [168, 196, 232];
    const DIRT = [139, 90, 43];
    const DIRT2 = [110, 68, 32];
    const DIRT3 = [84, 52, 28];
    for (let x = 0; x < WORLD_W; x++) {
      const gy = heightAt(x) | 0;
      for (let y = gy; y < WORLD_H; y++) {
        const i = (y * WORLD_W + x) * 4;
        const depth = y - gy;
        let c;
        if (depth < 11) c = (x + y) % 7 === 0 ? SNOW2 : SNOW;
        else if (depth < 16) c = ICE;
        else if (depth < 78) c = (Math.sin(x * 0.18) + Math.sin(y * 0.14) > 0.35) ? DIRT : DIRT2;
        else c = DIRT3;
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = 255;
      }
    }
    tctx.putImageData(im, 0, 0);
    uctx.clearRect(0, 0, WORLD_W, WORLD_H);
    uctx.fillStyle = "#1a1028";
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
    const spots = [
      { team: "lodge", xs: [108, 236, 364], names: LODGE_NAMES, facing: 1 },
      { team: "creek", xs: [916, 1044, 1172], names: CREEK_NAMES, facing: -1 },
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
        });
      });
    });
  }

  function randWind() {
    return (Math.random() * 9 | 0) - 4;
  }

  function setWeapon(id) {
    if (!WEAPONS[id]) return;
    weapon = id;
    $("w-stick").classList.toggle("on", id === "stick");
    $("w-snow").classList.toggle("on", id === "snow");
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
    const labels = { aim: "AIM", fly: "YEET", settle: "SETTLE", cpu: "CPU", end: "END" };
    phaseChip.textContent = labels[phase] || phase.toUpperCase();
    const canFire = phase === "aim" && turn === "lodge" && !aimTutOn;
    fireBtn.disabled = !canFire;
    fireBtn.textContent = phase === "cpu" ? "CPU…" : phase === "fly" ? "YEET" : "FIRE";
    hudAim();
  }

  function updateMuteBtn() {
    muteBtn.setAttribute("aria-pressed", BoberSfx.muted ? "true" : "false");
    muteBtn.textContent = BoberSfx.muted ? "🔇" : "🔊";
    muteBtn.title = BoberSfx.muted ? "Unmute" : "Mute";
  }

  function beginTurn(team) {
    turn = team;
    wind = randWind();
    shot = null;
    dragging = false;
    if (team === "lodge") {
      phase = "aim";
      pickActive("lodge");
      const a = getActive();
      if (a) {
        angle = -0.95;
        a.facing = 1;
      }
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
    return 2.2 + power * 0.172;
  }

  function tryFire() {
    if (phase !== "aim" && phase !== "cpu") return false;
    if (phase === "aim" && turn !== "lodge") return false;
    const b = getActive();
    if (!b || !b.alive) return false;
    const wpn = WEAPONS[weapon];
    const spd = speedFromPower();
    const nose = BOBER_R + 10;
    shot = {
      x: b.x + Math.cos(angle) * nose,
      y: b.y + Math.sin(angle) * nose,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      r: wpn.r,
      weapon: wpn.id,
      owner: b.id,
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
    BoberSfx.splash();
    pop(b.x, b.y, why || "SPLASH", "#8ad4ff");
  }

  function kill(b) {
    if (!b.alive) return;
    b.alive = false;
    b.hp = 0;
    BoberSfx.splat();
    pop(b.x, b.y - 20, "YEETED", "#ff8ad0");
  }

  function explode(x, y) {
    const wpn = WEAPONS[shot ? shot.weapon : weapon];
    const r = wpn.blast;
    const dmgMax = wpn.dmg;
    carve(x, y, r);
    burst(x, y, wpn.id === "snow" ? "snow" : "dirt");
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
      if (b.hp <= 0) kill(b);
    });
    lastBlast = { x, y, r, dmg: dmgMax, weapon: wpn.id, hits };
    shot = null;
    phase = "settle";
    settleT = 0;
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

  function stepShot() {
    if (!shot) return;
    shot.vx += wind * WIND_K;
    shot.vy += GRAV;
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
        explode(shot.x, shot.y);
        return;
      }
      for (let k = 0; k < bobers.length; k++) {
        const b = bobers[k];
        if (!b.alive) continue;
        if (shot.age < 6 && b.id === shot.owner) continue;
        if (Math.hypot(b.x - shot.x, b.y - shot.y) < BOBER_R + shot.r) {
          explode(shot.x, shot.y);
          return;
        }
      }
    }
  }

  function stepBober(b) {
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
    b.vy += GRAV;
    b.vx *= 0.992;
    b.x += b.vx;
    b.y += b.vy;
    b.x = clamp(b.x, 18, WORLD_W - 18);
    if (b.y - BOBER_R > WATER_Y || b.y > WATER_Y + 8) {
      drown(b, "SPLASH");
      return;
    }
    const feet = b.y + BOBER_R;
    if (b.vy >= 0 && (solid(b.x, feet) || solid(b.x - 10, feet) || solid(b.x + 10, feet))) {
      let gy = feet;
      for (let i = 0; i < 28; i++) {
        if (!solid(b.x, gy) && !solid(b.x - 8, gy) && !solid(b.x + 8, gy)) break;
        gy -= 1;
      }
      b.y = gy - BOBER_R;
      b.vy = 0;
      b.vx *= 0.4;
      if (Math.abs(b.vx) < 0.35) b.vx = 0;
      b.standing = true;
    } else {
      b.standing = false;
    }
  }

  function allSettled() {
    return living().every((b) => b.standing && Math.abs(b.vx) < 0.4 && Math.abs(b.vy) < 0.4);
  }

  function checkWin() {
    const lodge = living("lodge").length;
    const creek = living("creek").length;
    if (lodge > 0 && creek > 0) return null;
    if (lodge === 0 && creek === 0) return "draw";
    if (creek === 0) return "lodge";
    return "creek";
  }

  function endMatch(who) {
    winner = who;
    phase = "end";
    shot = null;
    hudTop.classList.remove("live");
    dock.classList.add("hidden");
    if (who === "lodge") {
      endTitle.textContent = "BANK CLEARED";
      endMsg.textContent = "Lodge still standing. The creek crew got yeeted.";
      BoberSfx.win();
    } else if (who === "creek") {
      endTitle.textContent = "CREW DOWN";
      endMsg.textContent = "Creek took the bank. Shake it off. Play again.";
      BoberSfx.fail();
    } else {
      endTitle.textContent = "EVERYBODY YEETED";
      endMsg.textContent = "The bank is empty. Draw.";
      BoberSfx.fail();
    }
    endcard.classList.remove("hidden");
    hud();
  }

  function finishSettle() {
    const who = checkWin();
    if (who) {
      endMatch(who);
      return;
    }
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

  function stepCpu(dt) {
    cpuT += dt * 1000;
    const me = getActive();
    if (!me || !me.alive) {
      pickActive("creek");
    }
    if (!cpuReady && cpuT >= CPU_THINK) {
      const shooter = getActive();
      const foes = living("lodge");
      if (!shooter || !foes.length) {
        finishSettle();
        return;
      }
      const target = foes[(Math.random() * foes.length) | 0];
      const g = guessCpuAim(shooter, target);
      angle = g.angle;
      power = g.power;
      shooter.facing = Math.cos(angle) >= 0 ? 1 : -1;
      setWeapon(Math.random() < 0.45 ? "snow" : "stick");
      cpuReady = true;
      hud();
    }
    if (cpuReady && cpuT >= CPU_THINK + CPU_SHOW) {
      tryFire();
    }
  }

  function step(dt) {
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.classList.remove("show");
    }
    waveT += dt;
    if (phase === "cpu") stepCpu(dt);
    if (phase === "fly") stepShot();
    bobers.forEach(stepBober);
    if (phase === "settle") {
      settleT += dt;
      if ((allSettled() && settleT > 0.45) || settleT > 4.2) finishSettle();
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
    const wpn = WEAPONS[weapon];
    const spd = speedFromPower();
    let x = b.x + Math.cos(angle) * (BOBER_R + 10);
    let y = b.y + Math.sin(angle) * (BOBER_R + 10);
    let vx = Math.cos(angle) * spd;
    let vy = Math.sin(angle) * spd;
    const dots = [];
    for (let i = 0; i < 52; i++) {
      vx += wind * WIND_K;
      vy += GRAV;
      x += vx;
      y += vy;
      if (y >= WATER_Y || x < -20 || x > WORLD_W + 20 || solid(x, y)) break;
      if (i % 2 === 0) dots.push({ x, y });
    }
    return dots;
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
    const minBober = 36;
    const sContain = Math.min(cssW / WORLD_W, cssH / WORLD_H);
    let s;
    let tx = 0;
    let ty = 0;
    let focusX = WORLD_W / 2;
    let focusY = WORLD_H * 0.58;
    const active = getActive();
    if (shot) {
      focusX = shot.x;
      focusY = shot.y;
    } else if (lastBlast && phase === "settle" && settleT < 0.7) {
      focusX = lastBlast.x;
      focusY = lastBlast.y;
    } else if (active) {
      focusX = active.x;
      focusY = active.y - 20;
    }
    if (sContain * DRAW_H >= minBober) {
      s = sContain;
      tx = (WORLD_W - cssW / s) / 2;
      ty = (WORLD_H - cssH / s) / 2;
    } else {
      s = Math.max(cssW / WORLD_W, minBober / DRAW_H);
      const visW = cssW / s;
      const visH = cssH / s;
      tx = visW >= WORLD_W ? (WORLD_W - visW) / 2 : clamp(focusX - visW / 2, 0, WORLD_W - visW);
      ty = visH >= WORLD_H ? (WORLD_H - visH) / 2 : clamp(focusY - visH * 0.62, 0, WORLD_H - visH);
    }
    if (!camInit) {
      camS = s;
      camX = tx;
      camY = ty;
      camInit = true;
    } else {
      camS += (s - camS) * 0.2;
      camX += (tx - camX) * 0.14;
      camY += (ty - camY) * 0.14;
    }
    view = { s: camS, camX, camY, cssW, cssH, dpr, showRadar: cssW / s < WORLD_W - 40 };
  }

  function drawBober(b) {
    const sprite = !b.alive ? img.splat : b.standing ? img.idle : img.fly;
    const h = DRAW_H;
    const w = sprite ? (sprite.width / sprite.height) * h : h;
    ctx.save();
    ctx.translate(b.x, b.y + 4);
    ctx.scale(b.facing, 1);
    if (sprite) ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
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
    ctx.roundRect ? ctx.roundRect(x, y, rw, rh, 8) : ctx.rect(x, y, rw, rh);
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
    const vx = x + view.camX * sx;
    const vy = y + view.camY * sy;
    ctx.strokeStyle = "#ffe566";
    ctx.lineWidth = 1;
    ctx.strokeRect(vx, vy, (view.cssW / view.s) * sx, (view.cssH / view.s) * sy);
    ctx.restore();
  }

  function draw() {
    layoutCam();
    ctx.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
    ctx.clearRect(0, 0, view.cssW, view.cssH);
    ctx.save();
    ctx.translate(-view.camX * view.s, -view.camY * view.s);
    ctx.scale(view.s, view.s);

    if (img.sky) ctx.drawImage(img.sky, 0, 0, WORLD_W, WORLD_H);
    else {
      ctx.fillStyle = "#3A2A6A";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
    ctx.drawImage(under, 0, 0);
    ctx.drawImage(terrain, 0, 0);

    ctx.fillStyle = "rgba(20, 70, 90, 0.72)";
    ctx.fillRect(0, WATER_Y, WORLD_W, WORLD_H - WATER_Y);
    ctx.strokeStyle = "rgba(200, 230, 255, 0.45)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 16) {
      const yy = WATER_Y + Math.sin(x * 0.04 + waveT * 2.4) * 3.5;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();

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
          ctx.globalAlpha = 0.85 - i / 70;
          ctx.beginPath();
          ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
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
      const spr = shot.weapon === "snow" ? img.snow : img.stick;
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
      ctx.fillStyle = p.kind === "snow" ? "#F4E6C3" : "#8B5A2B";
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

  function startMatch() {
    BoberSfx.ensure();
    splash.classList.add("hidden");
    endcard.classList.add("hidden");
    if (window.BoberLore) BoberLore.close();
    makeTerrain();
    spawnCrew();
    craterCount = 0;
    lastBlast = null;
    winner = null;
    weapon = "stick";
    setWeapon("stick");
    hudTop.classList.add("live");
    dock.classList.remove("hidden");
    camS = 1;
    camX = 0;
    camY = 0;
    camInit = false;
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
    hudTop.classList.remove("live");
    dock.classList.add("hidden");
    endcard.classList.add("hidden");
    splash.classList.remove("hidden");
  }

  function onPointerDown(ev) {
    if (phase !== "aim" || turn !== "lodge" || aimTutOn) return;
    ev.preventDefault();
    const w = worldFromEvent(ev);
    const tapped = boberAt(w.x, w.y, "lodge");
    if (tapped) {
      activeId = tapped.id;
      BoberSfx.pop();
    }
    dragging = true;
    dragPos = w;
    aimFromDrag();
    try {
      canvas.setPointerCapture(ev.pointerId);
    } catch (_) {}
  }

  function onPointerMove(ev) {
    if (!dragging) return;
    dragPos = worldFromEvent(ev);
    aimFromDrag();
  }

  function onPointerUp(ev) {
    if (!dragging) return;
    dragging = false;
    try {
      canvas.releasePointerCapture(ev.pointerId);
    } catch (_) {}
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
    playBtn.addEventListener("click", startMatch);
    endRestart.addEventListener("click", startMatch);
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
      if (ev.key === "ArrowLeft") angle -= 0.05;
      if (ev.key === "ArrowRight") angle += 0.05;
      if (ev.key === "ArrowUp") power = clamp(power + 3, 0, 100);
      if (ev.key === "ArrowDown") power = clamp(power - 3, 0, 100);
      if (ev.key === "1") setWeapon("stick");
      if (ev.key === "2") setWeapon("snow");
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
      wind,
      weapon,
      power,
      angle,
      craterCount,
      lastBlast,
      winner,
      bobers: bobers.map((b) => ({
        id: b.id,
        name: b.name,
        team: b.team,
        hp: b.hp,
        alive: b.alive,
        x: b.x,
        y: b.y,
      })),
    };
  }

  window.__yeetWar = {
    snapshot,
    startMatch,
    setAim: (deg, pwr) => setAim((deg * Math.PI) / 180, pwr),
    setWeapon,
    fire: tryFire,
    killTeam(team) {
      living(team).forEach((b) => kill(b));
      if (phase === "aim" || phase === "cpu") {
        phase = "settle";
        settleT = 0.5;
      }
    },
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
  };

  Promise.all([
    loadImage("assets/sprites/bober-idle.png").then((i) => (img.idle = i)),
    loadImage("assets/sprites/bober-fly.png").then((i) => (img.fly = i)),
    loadImage("assets/sprites/bober-splat.png").then((i) => (img.splat = i)),
    loadImage("assets/sprites/yeet-stick.png").then((i) => (img.stick = i)),
    loadImage("assets/sprites/snowball.png").then((i) => (img.snow = i)),
    loadImage("assets/sprites/bank-sky.jpg").then((i) => (img.sky = i)),
  ])
    .catch((err) => console.error(err))
    .then(() => {
      bind();
      if (FAST) startMatch();
    });
})();
