/* 100 frozen-until-hit layouts. Star = charge for a stronger yeet, not a win gate. */
(function (global) {
  const GROUND_TOP = 640;
  const S = 50;
  const C = 800;
  const COUNT = 100;

  const THEMES = [
    { id: "uranus", sky: ["#24164a", "#3c2a78", "#8f6bb0"], dirt: "#4a2e18", grass: "#3d8a3a", planet: "uranus", cloud: "rgba(255,255,255,0.5)" },
    { id: "mars", sky: ["#2a100c", "#8a2e18", "#d45a28"], dirt: "#6a3018", grass: "#9a4a24", planet: "mars", cloud: "rgba(255,170,130,0.35)" },
    { id: "xnight", sky: ["#050508", "#14141c", "#2c2c38"], dirt: "#121214", grass: "#2a2a30", planet: "none", cloud: "rgba(200,200,220,0.22)" },
    { id: "cyber", sky: ["#181a14", "#3a4030", "#8a9870"], dirt: "#4a4a42", grass: "#6e6e5a", planet: "none", cloud: "rgba(200,210,180,0.3)" },
    { id: "boca", sky: ["#163048", "#3a78a8", "#7eb8dc"], dirt: "#c2a070", grass: "#3d8a3a", planet: "earth", cloud: "rgba(255,255,255,0.5)" },
    { id: "doge", sky: ["#3a2808", "#c48918", "#f4d060"], dirt: "#6a4a12", grass: "#d4a028", planet: "moon", cloud: "rgba(255,230,160,0.4)" },
    { id: "tunnel", sky: ["#08080c", "#16161c", "#2a2a32"], dirt: "#1a1a1e", grass: "#2c2c32", planet: "none", cloud: "rgba(120,120,130,0.25)" },
    { id: "sink", sky: ["#242038", "#4a4468", "#8a84a8"], dirt: "#3a3a44", grass: "#5a5a66", planet: "none", cloud: "rgba(220,210,255,0.3)" },
    { id: "colony", sky: ["#180808", "#8a2210", "#e04818"], dirt: "#5a2010", grass: "#8a341c", planet: "mars", cloud: "rgba(255,140,100,0.3)" },
    { id: "finale", sky: ["#120820", "#4a1478", "#f5c400"], dirt: "#2a1a08", grass: "#c9a000", planet: "uranus", cloud: "rgba(255,230,120,0.4)" },
  ];

  function wood(x, yOff, w, h) {
    w = w || S;
    h = h || S;
    return { kind: "wood", x, y: GROUND_TOP - yOff - h / 2, w, h };
  }
  function stone(x, yOff, w, h) {
    w = w || S;
    h = h || S;
    return { kind: "stone", x, y: GROUND_TOP - yOff - h / 2, w, h };
  }
  function spec(kind, x, yOff, w, h) {
    w = w || S;
    h = h || S;
    return { kind, x, y: GROUND_TOP - yOff - h / 2, w, h };
  }
  function starAt(x, yOff) {
    return { x, y: GROUND_TOP - yOff - 16, r: 16 };
  }
  function cell(col, row) {
    return { x: C + col * S + S / 2, yOff: row * S };
  }

  function rng(seed) {
    let x = (seed * 1103515245 + 12345) >>> 0;
    return function () {
      x = (Math.imul(x, 1664525) + 1013904223) >>> 0;
      return x / 4294967296;
    };
  }

  function themeFor(i) {
    return THEMES[Math.min(THEMES.length - 1, Math.floor(i / 10))];
  }

  function stack(kindFn, cols, rows, extra) {
    const blocks = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const p = cell(c, r);
        blocks.push(kindFn(c, r, p));
      }
    }
    if (extra) extra(blocks, cols, rows);
    return blocks;
  }

  function build(i) {
    const t = themeFor(i);
    const rnd = rng(i * 97 + 13);
    const stars = [];
    let name = "Dam " + (i + 1);
    let hint = "Hit the supports.";
    let blocks = [];

    if (i === 0) {
      return { name: "Tiny Dam", hint: "Hit the bottom log.", theme: t, blocks: [
        wood(cell(0, 0).x, 0), wood(cell(1, 0).x, 0), wood(cell(0, 1).x + S / 2, S),
      ], stars: [] };
    }
    if (i === 1) {
      return { name: "Log Stack", hint: "Take the base, not the roof.", theme: t, blocks: [
        wood(cell(0, 0).x, 0), wood(cell(1, 0).x, 0),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S),
        wood(cell(0, 2).x, S * 2), wood(cell(1, 2).x, S * 2),
        wood(cell(0, 3).x + S / 2, S * 3, S * 2, 22),
      ], stars: [] };
    }
    if (i === 2) {
      return { name: "Stone Feet", hint: "Grey holds it. Grab the star to CHARGE.", theme: t, blocks: [
        stone(cell(0, 0).x, 0), stone(cell(1, 0).x, 0),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S),
        wood(cell(0, 2).x, S * 2), wood(cell(1, 2).x, S * 2),
        wood(cell(0, 3).x + S / 2, S * 3, S * 2, 22),
      ], stars: [starAt(cell(1, 0).x, 8)] };
    }

    const pack = i % 12;
    const tall = 3 + Math.min(5, Math.floor(i / 14));
    const wide = 2 + (i > 20 ? 1 : 0) + (i > 55 ? 1 : 0);

    if (pack === 0) {
      name = "Jenga Mood";
      hint = "Kick a grey foot.";
      blocks = stack((c, r, p) => (r === 0 ? stone(p.x, p.yOff) : wood(p.x, p.yOff)), 2, tall, (b, cols, rows) => {
        b.push(wood(cell(0, rows).x + S / 2, rows * S, S * 2, 22));
      });
      stars.push(starAt(cell(0, 2).x + S / 2, S * 2 + 8));
    } else if (pack === 1) {
      name = "Dumb Hat";
      hint = "The hat is bait. Punch the pillar.";
      blocks = [
        stone(cell(1, 0).x + S / 2, 0, S, S * 2),
        wood(cell(0, 2).x, S * 2), wood(cell(1, 2).x, S * 2), wood(cell(2, 2).x, S * 2), wood(cell(3, 2).x, S * 2),
        wood(cell(0, 3).x, S * 3), wood(cell(3, 3).x, S * 3),
        wood(cell(1, 3).x + S / 2, S * 3, S * 2, 22),
      ];
      stars.push(starAt(cell(1, 0).x + S / 2, S * 0.4));
    } else if (pack === 2) {
      name = "Room Service";
      hint = "Drop a pillar. Charge the star.";
      blocks = [
        stone(cell(0, 0).x, 0), wood(cell(1, 0).x, 0), wood(cell(2, 0).x, 0), stone(cell(3, 0).x, 0),
        wood(cell(0, 1).x, S), wood(cell(3, 1).x, S),
        wood(cell(0, 2).x, S * 2), wood(cell(1, 2).x, S * 2), wood(cell(2, 2).x, S * 2), wood(cell(3, 2).x, S * 2),
        wood(cell(0, 3).x, S * 3, S * 4, 22),
      ];
      if (i > 25) {
        blocks.push(wood(cell(4, 3).x, S * 3 + 22));
        blocks.push(wood(cell(4, 4).x, S * 4 + 22));
      }
      stars.push(starAt(cell(1, 0).x + S / 2, 10));
    } else if (pack === 3) {
      name = i >= 10 ? "Cybertruck Parking" : "Wide Base";
      hint = i >= 10 ? "Stainless is tanky. Charge first." : "Take the corners.";
      const k = i >= 10 ? "truck" : "stone";
      blocks = [
        spec(k, cell(0, 0).x + S / 2, 0, S * 2, S),
        spec(k, cell(2, 0).x + S / 2, 0, S * 2, S),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S), wood(cell(2, 1).x, S), wood(cell(3, 1).x, S),
        wood(cell(1, 2).x, S * 2), wood(cell(2, 2).x, S * 2),
        wood(cell(1, 3).x + S / 2, S * 3, S * 2, 22),
      ];
      stars.push(starAt(cell(1, 1).x + S / 2, S + 8));
    } else if (pack === 4) {
      name = i >= 20 ? "Starship Stack" : "Tall Boy";
      hint = i >= 20 ? "Don't nibble the nose cone." : "Side shot the grey.";
      blocks = stack((c, r, p) => {
        if (r === 0) return stone(p.x, p.yOff);
        if (i >= 20 && r === tall - 1) return spec("rocket", p.x, p.yOff);
        return wood(p.x, p.yOff);
      }, 2, Math.min(7, tall + 1));
      stars.push(starAt(cell(0, 3).x + S / 2, S * 3));
    } else if (pack === 5) {
      name = i >= 30 ? "The Bird Is Freed" : "Arch";
      hint = i >= 30 ? "X marks the load-bearing post." : "Collapse one leg.";
      const post = i >= 30 ? "xblock" : "stone";
      blocks = [
        spec(post, cell(0, 0).x, 0), spec(post, cell(3, 0).x, 0),
        spec(post, cell(0, 1).x, S), spec(post, cell(3, 1).x, S),
        wood(cell(0, 2).x, S * 2), wood(cell(1, 2).x, S * 2), wood(cell(2, 2).x, S * 2), wood(cell(3, 2).x, S * 2),
        wood(cell(1, 3).x, S * 3), wood(cell(2, 3).x, S * 3),
      ];
      stars.push(starAt(cell(1, 0).x + S / 2, 8));
    } else if (pack === 6) {
      name = i >= 40 ? "Let That Sink In" : "Overhang";
      hint = i >= 40 ? "The sink is the joke and the key." : "Undercut the shelf.";
      blocks = [
        stone(cell(0, 0).x, 0), stone(cell(1, 0).x, 0),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S),
        wood(cell(2, 1).x, S), wood(cell(3, 1).x, S),
        wood(cell(2, 2).x, S * 2), wood(cell(3, 2).x, S * 2),
      ];
      if (i >= 40) blocks.push(spec("sink", cell(2, 0).x + S / 2, 0, S * 2, S));
      else blocks.push(wood(cell(2, 0).x, 0), wood(cell(3, 0).x, 0));
      stars.push(starAt(cell(3, 2).x, S * 2 + 8));
    } else if (pack === 7) {
      name = i >= 50 ? "Doge Pyramid" : "Triangle";
      hint = i >= 50 ? "Much dam. Very yeet." : "Bottom-left.";
      const topK = i >= 50 ? "doge" : "wood";
      blocks = [
        stone(cell(0, 0).x, 0), stone(cell(1, 0).x, 0), stone(cell(2, 0).x, 0),
        wood(cell(0, 1).x + S / 2, S), wood(cell(1, 1).x + S / 2, S),
        spec(topK, cell(1, 2).x, S * 2),
      ];
      stars.push(starAt(cell(1, 0).x, 8));
    } else if (pack === 8) {
      name = i >= 60 ? "Boring Tunnel" : "Twin Towers";
      hint = i >= 60 ? "One good hit. The tunnel falls." : "Two grey feet. Two shots if you miss.";
      blocks = stack((c, r, p) => (r === 0 ? stone(p.x, p.yOff) : wood(p.x, p.yOff)), 2, tall);
      blocks.push(...stack((c, r, p) => (r === 0 ? stone(p.x, p.yOff) : wood(p.x, p.yOff)), 2, Math.max(3, tall - 1)).map((b) => {
        b.x += S * 3;
        return b;
      }));
      if (i >= 60) blocks.push(spec("xblock", cell(2, 2).x, S * 2));
      stars.push(starAt(cell(0, 2).x + S / 2, S * 2));
      if (i > 70) stars.push(starAt(cell(3, 1).x + S * 3, S));
    } else if (pack === 9) {
      name = i >= 70 ? "Hyperloop Stop" : "Shelf";
      hint = "Low shot under the shelf.";
      blocks = [
        stone(cell(0, 0).x, 0),
        wood(cell(0, 1).x, S),
        wood(cell(0, 2).x, S * 2, S * (2 + (wide > 2 ? 1 : 0)) + S, 22),
        wood(cell(1, 2).x + S, S * 2 + 22),
        wood(cell(2, 2).x + S, S * 2 + 22),
        stone(cell(3, 0).x, 0),
      ];
      stars.push(starAt(cell(2, 2).x + S, S * 2 + 30));
    } else if (pack === 10) {
      name = i >= 80 ? "Mars Colony" : "Fort";
      hint = i >= 80 ? "To Mars. Charge, then yeet the feet." : "Fort has two stones. Don't farm wood.";
      blocks = [
        stone(cell(0, 0).x, 0), stone(cell(3, 0).x, 0),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S), wood(cell(2, 1).x, S), wood(cell(3, 1).x, S),
        wood(cell(0, 2).x, S * 2), wood(cell(3, 2).x, S * 2),
        wood(cell(0, 3).x, S * 3, S * 4, 22),
        spec(i >= 20 ? "rocket" : "wood", cell(1, 3).x + S / 2, S * 3 + 22, S, S * (i > 40 ? 2 : 1)),
      ];
      stars.push(starAt(cell(1, 1).x + S / 2, S + 8));
    } else {
      name = i >= 90 ? "Why Is Elon Like This" : "Chaos Dam";
      hint = i >= 90 ? "Everything is a bit. Charge twice if you can." : "Find the grey. Ignore the hat.";
      blocks = [
        stone(cell(0, 0).x, 0),
        spec(i >= 30 ? "truck" : "stone", cell(2, 0).x + S / 2, 0, S * 2, S),
        wood(cell(0, 1).x, S), wood(cell(1, 1).x, S), wood(cell(2, 1).x, S), wood(cell(3, 1).x, S),
        wood(cell(1, 2).x, S * 2), wood(cell(2, 2).x, S * 2),
        spec(i >= 40 ? "sink" : "wood", cell(3, 2).x, S * 2),
        spec(i >= 50 ? "doge" : "wood", cell(0, 2).x, S * 2),
        wood(cell(1, 3).x + S / 2, S * 3, S * 2, 22),
      ];
      if (rnd() > 0.4) blocks.push(spec(i >= 30 ? "xblock" : "stone", cell(4, 0).x, 0));
      stars.push(starAt(cell(1, 2).x + S / 2, S * 2 + 8));
      if (i >= 50) stars.push(starAt(cell(3, 0).x, 8));
    }

    if (i >= 15 && stars.length === 0) stars.push(starAt(cell(1, 1).x, S + 8));
    if (i >= 45 && stars.length < 2 && rnd() > 0.5) stars.push(starAt(cell(0, 0).x, 8));

    return { name, hint, theme: t, blocks, stars, time: 20 + Math.min(8, Math.floor(i / 12)) };
  }

  const cache = [];
  function get(i) {
    const n = Math.max(0, Math.min(COUNT - 1, i | 0));
    if (!cache[n]) cache[n] = build(n);
    return cache[n];
  }

  global.BoberLevels = { COUNT, get, themeFor, KEYS: { stone: 1, truck: 1, rocket: 1, xblock: 1, sink: 1 } };
})(window);
