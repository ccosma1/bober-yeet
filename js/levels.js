/* Same-screen layouts. Identical tile size, no air gaps — they stand until you yeet.
   Strategy: grey stone is the dam. Wood is padding. Star is required on 3–6. */
(function (global) {
  const GROUND_TOP = 640;
  const S = 50;

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
  function star(x, yOff) {
    return { x, y: GROUND_TOP - yOff - 16, r: 16 };
  }
  function cell(c0, col, row) {
    return { x: c0 + col * S + S / 2, yOff: row * S };
  }

  const C = 800;

  global.BOBER_LEVELS = [
    {
      name: "Tiny Dam",
      hint: "Hit the bottom log.",
      needAll: true,
      blocks: [
        wood(cell(C, 0, 0).x, cell(C, 0, 0).yOff),
        wood(cell(C, 1, 0).x, cell(C, 1, 0).yOff),
        wood(cell(C, 0, 1).x + S / 2, cell(C, 0, 1).yOff),
      ],
    },
    {
      name: "Log Stack",
      hint: "Take the base, not the roof.",
      needAll: true,
      blocks: [
        wood(cell(C, 0, 0).x, 0),
        wood(cell(C, 1, 0).x, 0),
        wood(cell(C, 0, 1).x, S),
        wood(cell(C, 1, 1).x, S),
        wood(cell(C, 0, 2).x, S * 2),
        wood(cell(C, 1, 2).x, S * 2),
        wood(cell(C, 0, 3).x + S / 2, S * 3, S * 2, 22),
      ],
    },
    {
      name: "Stone Feet",
      hint: "Grey holds it. Star is tucked behind.",
      blocks: [
        stone(cell(C, 0, 0).x, 0),
        stone(cell(C, 1, 0).x, 0),
        wood(cell(C, 0, 1).x, S),
        wood(cell(C, 1, 1).x, S),
        wood(cell(C, 0, 2).x, S * 2),
        wood(cell(C, 1, 2).x, S * 2),
        wood(cell(C, 0, 3).x + S / 2, S * 3, S * 2, 22),
      ],
      star: star(cell(C, 1, 0).x, S * 0.15),
    },
    {
      name: "Dumb Hat",
      hint: "The hat is bait. Punch the pillar.",
      blocks: [
        stone(cell(C, 1, 0).x + S / 2, 0, S, S * 2),
        wood(cell(C, 0, 2).x, S * 2),
        wood(cell(C, 1, 2).x, S * 2),
        wood(cell(C, 2, 2).x, S * 2),
        wood(cell(C, 3, 2).x, S * 2),
        wood(cell(C, 0, 3).x, S * 3),
        wood(cell(C, 3, 3).x, S * 3),
        wood(cell(C, 1, 3).x + S / 2, S * 3, S * 2, 22),
        wood(cell(C, 1, 4).x + S / 2, S * 3 + 22),
      ],
      star: star(cell(C, 1, 0).x + S / 2, S * 0.4),
    },
    {
      name: "Two Legs",
      hint: "Kick a grey foot. Side shot.",
      blocks: [
        stone(cell(C, 0, 0).x, 0),
        stone(cell(C, 1, 0).x, 0),
        wood(cell(C, 0, 1).x, S),
        wood(cell(C, 1, 1).x, S),
        wood(cell(C, 0, 2).x, S * 2),
        wood(cell(C, 1, 2).x, S * 2),
        wood(cell(C, 0, 3).x, S * 3),
        wood(cell(C, 1, 3).x, S * 3),
        wood(cell(C, 0, 4).x, S * 4),
        wood(cell(C, 1, 4).x, S * 4),
        wood(cell(C, 0, 5).x, S * 5),
        wood(cell(C, 1, 5).x, S * 5),
        wood(cell(C, 0, 6).x + S / 2, S * 6, S * 2, 22),
      ],
      star: star(cell(C, 0, 2).x + S / 2, S * 2 + 8),
    },
    {
      name: "Why Is This A Dam",
      hint: "Drop a pillar. Open the room. Grab the star.",
      blocks: [
        stone(cell(C, 0, 0).x, 0),
        wood(cell(C, 1, 0).x, 0),
        wood(cell(C, 2, 0).x, 0),
        stone(cell(C, 3, 0).x, 0),
        wood(cell(C, 0, 1).x, S),
        wood(cell(C, 3, 1).x, S),
        wood(cell(C, 0, 2).x, S * 2),
        wood(cell(C, 1, 2).x, S * 2),
        wood(cell(C, 2, 2).x, S * 2),
        wood(cell(C, 3, 2).x, S * 2),
        wood(cell(C, 0, 3).x, S * 3, S * 4, 22),
        wood(cell(C, 3, 3).x + 10, S * 3 + 22),
        wood(cell(C, 4, 3).x + 10, S * 3 + 22),
        wood(cell(C, 3, 4).x + 10, S * 4 + 22),
      ],
      star: star(cell(C, 1, 0).x + S / 2, 10),
    },
  ];
})(window);
