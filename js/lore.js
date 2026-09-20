/* Museum + History. Fan-game lore only. Does not start a run. */
(function (global) {
  const CARDS = [
    {
      cat: "Bober",
      title: "The beaver",
      img: "assets/sprites/splash-hero.png",
      blurb: "Square wood head, paddle tail, snow in the fur. Calm on the bank. He aims a stick across five rooms.",
    },
    {
      cat: "Map",
      title: "Lodge Bowl",
      img: "assets/history/lodge-bowl.jpg",
      blurb: "Green Home snow bowl. Rounded banks, a creek in the saddle. Classic Earth lodge fight.",
    },
    {
      cat: "Map",
      title: "Twin Ledges",
      img: "assets/history/twin-ledges.jpg",
      blurb: "Two high banks, a thin ice bridge, water in the ditch. Cut the bridge and the crews are cut off.",
    },
    {
      cat: "Map",
      title: "Red Mesa",
      img: "assets/history/red-mesa.jpg",
      blurb: "Mars. Twin red rock tables, a dry dust canyon between them. No ice. Dig the soft dust shelves. Fall in the dust pit and you are out.",
    },
    {
      cat: "Map",
      title: "Crater Rim",
      img: "assets/history/crater-rim.jpg",
      blurb: "Moon. Wide grey rims, a low crater floor, a void pit in the middle. No bridge. Step in the hole and you are gone.",
    },
    {
      cat: "Map",
      title: "Methane Shelf",
      img: "assets/history/methane-shelf.jpg",
      blurb: "Uranus ice. Left shelf high, right shelf mid. Thin brittle teal. Dark methane below. Miss the shelf and you sink.",
    },
    {
      cat: "Gun",
      title: "Yeet Stick",
      img: "assets/sprites/yeet-stick.png",
      blurb: "Twenty-five sting, blast 28, infinite. The honest lodge tool.",
    },
    {
      cat: "Gun",
      title: "Snowball",
      img: "assets/sprites/snowball.png",
      blurb: "Fifteen sting, blast 36, infinite. Softer hit, fatter crater.",
    },
    {
      cat: "Gun",
      title: "Dynamite",
      img: "assets/sprites/dynamite.png",
      blurb: "Forty-five sting, blast 48, fuse about two seconds. Buy a charge with $BOBER, or find a crate.",
    },
    {
      cat: "Gun",
      title: "Sap Bomb",
      img: "assets/sprites/sap-bomb.png",
      blurb: "Thirty sting, blast 40, sticky two ticks. Lodge sap. Charges only.",
    },
    {
      cat: "Gun",
      title: "Lodge Mortar",
      img: "assets/sprites/mortar.png",
      blurb: "Thirty-eight sting, blast 42, a high lob. One charge. Soft preview. Not a win button.",
    },
    {
      cat: "Gun",
      title: "Ice Brace",
      img: "assets/sprites/ice-brace.png",
      blurb: "No sting. A wall of ice, sixty HP, two turns, then melt. Blocks shots and a short step.",
    },
    {
      cat: "Gear",
      title: "Crates and shop",
      img: "assets/history/crate-gear.jpg",
      blurb: "Every three turns a crate lands on solid ground. Tap SHOP mid-match to buy Dynamite, Sap, Lodge Mortar, or Ice Brace with $BOBER.",
    },
  ];

  const STILLS = [
    CARDS[1],
    CARDS[2],
    CARDS[3],
    CARDS[4],
    CARDS[5],
    CARDS[12],
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
    hide($("history-detail"));
    const grid = $("museum-grid");
    if (grid) grid.classList.remove("hidden");
    const body = $("history-body");
    if (body) body.classList.remove("hidden");
  }

  function cardHtml(c, i, prefix) {
    return (
      '<button type="button" class="museum-card" data-i="' +
      i +
      '" data-set="' +
      prefix +
      '"><span class="museum-cat">' +
      c.cat +
      '</span><img src="' +
      c.img +
      '" alt="" /><span class="museum-card-title">' +
      c.title +
      "</span></button>"
    );
  }

  function fillDetail(detail, grid, c) {
    if (!detail || !c) return;
    hide(grid);
    detail.innerHTML =
      '<button type="button" class="play play-ghost museum-back" data-back="1">BACK</button>' +
      '<img class="museum-detail-img still" src="' +
      c.img +
      '" alt="" />' +
      "<h3>" +
      c.title +
      "</h3>" +
      "<p>" +
      c.blurb +
      "</p>";
    show(detail);
    const back = detail.querySelector("[data-back]");
    if (back) {
      back.addEventListener("click", () => {
        hide(detail);
        show(grid);
      });
    }
  }

  function openMuseum() {
    hide($("history"));
    hide($("museum-detail"));
    const grid = $("museum-grid");
    if (grid) {
      grid.classList.remove("hidden");
      if (!grid.dataset.ready) {
        grid.innerHTML = CARDS.map((c, i) => cardHtml(c, i, "m")).join("");
        grid.dataset.ready = "1";
      }
    }
    show($("museum"));
  }

  function openHistory() {
    hide($("museum"));
    hide($("history-detail"));
    const body = $("history-body");
    if (body) {
      body.classList.remove("hidden");
      if (!body.dataset.ready) {
        body.innerHTML =
          '<p class="hist-cap">Bank fights from the Green Home to deep space. Tap a still.</p>' +
          '<div class="museum-grid hist-stills">' +
          STILLS.map((c, i) => cardHtml(c, i, "h")).join("") +
          "</div>";
        body.dataset.ready = "1";
      }
    }
    show($("history"));
  }

  function bind() {
    const m = $("btn-museum");
    const h = $("btn-history");
    const mc = $("museum-close");
    const hc = $("history-close");
    const grid = $("museum-grid");
    const body = $("history-body");
    const endM = $("end-museum");
    if (m) m.addEventListener("click", openMuseum);
    if (h) h.addEventListener("click", openHistory);
    if (mc) mc.addEventListener("click", closeAll);
    if (hc) hc.addEventListener("click", closeAll);
    if (endM) endM.addEventListener("click", openMuseum);
    function onCard(ev) {
      const card = ev.target.closest && ev.target.closest(".museum-card");
      if (!card) return;
      const i = Number(card.getAttribute("data-i"));
      const set = card.getAttribute("data-set");
      if (set === "h") fillDetail($("history-detail"), $("history-body"), STILLS[i]);
      else fillDetail($("museum-detail"), $("museum-grid"), CARDS[i]);
    }
    if (grid) grid.addEventListener("click", onCard);
    if (body) body.addEventListener("click", onCard);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();

  global.BoberLore = { openMuseum, openHistory, close: closeAll };
})(window);
