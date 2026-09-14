/* Museum + History. Fan-game lore only. Does not start a run. */
(function (global) {
  const CARDS = [
    {
      cat: "Bober",
      title: "The beaver",
      img: "assets/sprites/splash-hero.png",
      blurb: "Square wood head, paddle tail, snow in the fur. You yeet him. He is the whole joke.",
    },
    {
      cat: "Moment",
      title: "First dam",
      img: "assets/sprites/slingshot.png",
      blurb: "Three logs. Pull back. Hit the feet. The myth starts small on purpose.",
    },
    {
      cat: "Moment",
      title: "Charged yeet",
      img: "assets/sprites/star.png",
      blurb: "Grab a star, then fire. CHARGE is power for the next shot — not a loot box.",
    },
    {
      cat: "Moment",
      title: "Faceplant",
      img: "assets/sprites/bober-splat.png",
      blurb: "Teeth first, Uranus watching. Clips beat farms. Miss, laugh, pull again.",
    },
    {
      cat: "Milestone",
      title: "100 levels",
      img: "assets/sprites/uranus.png",
      blurb: "Uranus to Mars to worse ideas. Three shots a dam. Grey holds the stack.",
    },
    {
      cat: "Milestone",
      title: "$BOBER coins",
      img: "assets/sprites/star.png",
      blurb: "Smash loot is $BOBER. A number you leave on the board. No wallet. No IAP.",
    },
    {
      cat: "Milestone",
      title: "Green Home",
      img: "assets/sprites/bober-idle.png",
      blurb: "Yeet → Dam → Lodge → Nightfall → Crown. One holder universe. This room is Yeet.",
    },
  ];

  const ARC = [
    { name: "Yeet", cap: "Aim. Smash. Leave $BOBER." },
    { name: "Dam", cap: "Hold the river." },
    { name: "Lodge", cap: "Warm rooms, cold jokes." },
    { name: "Nightfall", cap: "Lights out on the ice." },
    { name: "Crown", cap: "Whoever lasts." },
  ];

  const CLIMB = [
    { name: "Uranus", lv: "1–10", h: 22 },
    { name: "Mars", lv: "11–20", h: 30 },
    { name: "Night", lv: "21–30", h: 38 },
    { name: "Cyber", lv: "31–40", h: 46 },
    { name: "Boca", lv: "41–50", h: 54 },
    { name: "Doge", lv: "51–60", h: 62 },
    { name: "Tunnel", lv: "61–70", h: 70 },
    { name: "Sink", lv: "71–80", h: 78 },
    { name: "Colony", lv: "81–90", h: 88 },
    { name: "Finale", lv: "91–100", h: 100 },
  ];

  function $(id) {
    return document.getElementById(id);
  }

  function show(el) {
    if (el) el.classList.remove("hidden");
  }
  function hide(el) {
    if (el) el.classList.add("hidden");
  }

  function closeAll() {
    hide($("museum"));
    hide($("history"));
    hide($("museum-detail"));
    const grid = $("museum-grid");
    if (grid) grid.classList.remove("hidden");
  }

  function openMuseum() {
    hide($("history"));
    hide($("museum-detail"));
    const grid = $("museum-grid");
    if (grid) {
      grid.classList.remove("hidden");
      if (!grid.dataset.ready) {
        grid.innerHTML = CARDS.map((c, i) => {
          return (
            '<button type="button" class="museum-card" data-i="' +
            i +
            '"><span class="museum-cat">' +
            c.cat +
            '</span><img src="' +
            c.img +
            '" alt="" /><span class="museum-card-title">' +
            c.title +
            "</span></button>"
          );
        }).join("");
        grid.dataset.ready = "1";
      }
    }
    show($("museum"));
  }

  function openCard(i) {
    const c = CARDS[i];
    if (!c) return;
    const detail = $("museum-detail");
    const grid = $("museum-grid");
    if (!detail) return;
    hide(grid);
    detail.innerHTML =
      '<button type="button" class="play play-ghost museum-back" id="museum-back">BACK</button>' +
      '<img class="museum-detail-img" src="' +
      c.img +
      '" alt="" />' +
      "<h3>" +
      c.title +
      "</h3>" +
      "<p>" +
      c.blurb +
      "</p>";
    show(detail);
    const back = $("museum-back");
    if (back) {
      back.addEventListener("click", () => {
        hide(detail);
        show(grid);
      });
    }
  }

  function openHistory() {
    hide($("museum"));
    const body = $("history-body");
    if (body && !body.dataset.ready) {
      const arc =
        '<div class="hist-arc">' +
        ARC.map((n, i) => {
          return (
            (i ? '<span class="hist-join" aria-hidden="true"></span>' : "") +
            '<div class="hist-node"><strong>' +
            n.name +
            "</strong><span>" +
            n.cap +
            "</span></div>"
          );
        }).join("") +
        "</div>" +
        '<p class="hist-cap">The Green Home myth line. Yeet is this room. The others wait on the hub.</p>';
      const maxH = 100;
      const bars =
        '<div class="hist-climb" aria-hidden="false">' +
        CLIMB.map((d) => {
          return (
            '<div class="hist-bar"><i style="height:' +
            Math.max(12, (d.h / maxH) * 88) +
            'px"></i><b>' +
            d.name +
            "</b><span>" +
            d.lv +
            "</span></div>"
          );
        }).join("") +
        "</div>" +
        '<p class="hist-cap">100-level climb. Each decade a new sky. Skill aim, not a token farm.</p>';
      body.innerHTML = arc + bars;
      body.dataset.ready = "1";
    }
    show($("history"));
  }

  function bind() {
    const m = $("btn-museum");
    const h = $("btn-history");
    const mc = $("museum-close");
    const hc = $("history-close");
    const grid = $("museum-grid");
    if (m) m.addEventListener("click", openMuseum);
    if (h) h.addEventListener("click", openHistory);
    if (mc) mc.addEventListener("click", closeAll);
    if (hc) hc.addEventListener("click", closeAll);
    if (grid) {
      grid.addEventListener("click", (ev) => {
        const card = ev.target.closest && ev.target.closest(".museum-card");
        if (!card) return;
        openCard(Number(card.getAttribute("data-i")));
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  global.BoberLore = { openMuseum, openHistory, close: closeAll };
})(window);
