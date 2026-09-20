/* Museum + History. Fan-game lore only. Does not start a run. */
(function (global) {
  const CARDS = [
    {
      cat: "Bober",
      title: "The beaver",
      img: "assets/sprites/splash-hero.png",
      blurb: "Square wood head, paddle tail, snow in the fur. Calm on the bank. He used to fly from a sling. Now he aims a stick.",
    },
    {
      cat: "Was Yeet",
      title: "Slingshot days",
      img: "assets/history/was-yeet.jpg",
      blurb: "This room was Bober Yeet: 100 myth levels, three shots, $BOBER on a board. That climb is history. Play is War now.",
    },
    {
      cat: "War",
      title: "The bank",
      img: "assets/history/bank-fight.jpg",
      blurb: "Turns. Three Lodge, three Creek. Aim, power, wind. Dig cover. Last beaver standing.",
    },
    {
      cat: "War",
      title: "Aim and wind",
      img: "assets/history/aim-wind.jpg",
      blurb: "Drag back for angle. Charge power. Read the yellow flag. Fire. The creek below is out.",
    },
    {
      cat: "War",
      title: "Yeet Stick",
      img: "assets/sprites/yeet-stick.png",
      blurb: "Twenty-five sting, blast 28, infinite. The honest lodge tool.",
    },
    {
      cat: "War",
      title: "Snowball",
      img: "assets/sprites/snowball.png",
      blurb: "Fifteen sting, blast 36, infinite. Softer hit, fatter crater.",
    },
    {
      cat: "War",
      title: "Dynamite",
      img: "assets/sprites/dynamite.png",
      blurb: "Forty-five sting, blast 48, fuse about two seconds. Buy a charge with $BOBER, or find a crate. Not a win button.",
    },
    {
      cat: "War",
      title: "Sap Bomb",
      img: "assets/sprites/sap-bomb.png",
      blurb: "Thirty sting, blast 40, sticky two ticks. Lodge sap. Charges only.",
    },
    {
      cat: "War",
      title: "Crates",
      img: "assets/history/crate-gear.jpg",
      blurb: "Every three turns a crate lands on solid ground. Walk on: Dynamite, Sap, Lodge Mortar, Ice Brace, or $BOBER. Between matches, spend coins on extra charges.",
    },
    {
      cat: "War",
      title: "Twin Ledges",
      img: "assets/history/twin-ledges.jpg",
      blurb: "Two high banks, a thin ice bridge, water in the ditch. Cut the bridge and the crews are cut off. Lodge Bowl is the other room.",
    },
    {
      cat: "War",
      title: "Lodge Mortar",
      img: "assets/sprites/mortar.png",
      blurb: "Thirty-eight sting, blast 42, a high lob. One charge. Soft preview. Not a win button.",
    },
    {
      cat: "War",
      title: "Ice Brace",
      img: "assets/sprites/ice-brace.png",
      blurb: "No sting. A wall of ice, sixty HP, two turns, then melt. Blocks shots and a short step.",
    },
  ];

  const STILLS = [
    CARDS[1],
    CARDS[2],
    CARDS[3],
    CARDS[8],
    CARDS[9],
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
          '<p class="hist-cap">The Green Home myth line. This room was Yeet. Play is War. Tap a still.</p>' +
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
