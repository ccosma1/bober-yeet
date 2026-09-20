/* Museum + History. Fan-game lore only. Does not start a run. */
(function (global) {
  const CARDS = [
    {
      cat: "Bober",
      title: "The beaver",
      img: "assets/sprites/splash-hero.png",
      blurb: "Square wood head, paddle tail, snow in the fur. Calm when healthy. A limp and a kneel when the HP drops. He aims a stick across ten rooms.",
    },
    {
      cat: "Map",
      title: "Lodge Bowl",
      img: "assets/history/lodge-bowl.jpg",
      blurb: "Green Home snow bowl. Starfall over the banks. Rounded banks, a creek in the saddle. Classic Earth lodge fight.",
    },
    {
      cat: "Map",
      title: "Twin Ledges",
      img: "assets/history/twin-ledges.jpg",
      blurb: "Jet duel over the ice bridge. Two high banks, water in the ditch. Cut the bridge and the crews are cut off.",
    },
    {
      cat: "Map",
      title: "Red Mesa",
      img: "assets/history/red-mesa.jpg",
      blurb: "Mars colony. Rover tracks, a habitat dome, dust devils. Twin red tables. Fall in the dust pit and you are out.",
    },
    {
      cat: "Map",
      title: "Crater Rim",
      img: "assets/history/crater-rim.jpg",
      blurb: "Moon landing. A lander and flag on the rim. Low-g hop. Void pit in the middle. Step in the hole and you are gone.",
    },
    {
      cat: "Map",
      title: "Methane Shelf",
      img: "assets/history/methane-shelf.jpg",
      blurb: "Ice quake on the methane shelf. Cracks run the teal ice. Miss the shelf and you sink.",
    },
    {
      cat: "Map",
      title: "Acid Vents",
      img: "assets/history/acid-vents.jpg",
      blurb: "Venus vents pulse. Not a flamethrower. Twin sulfur shelves. Fall in the vents and you are cooked.",
    },
    {
      cat: "Map",
      title: "Ring Span",
      img: "assets/history/ring-span.jpg",
      blurb: "Ring debris drifts. The span chips. Thin ring-bridge mid, void below. Cut the ring and the crews are cut off.",
    },
    {
      cat: "Map",
      title: "Deep Pack",
      img: "assets/history/deep-pack.jpg",
      blurb: "Deep current. The pack surges between turns. Tall blue stacks, a narrow channel. Miss the pack and you sink.",
    },
    {
      cat: "Map",
      title: "Frost Pit",
      img: "assets/history/frost-pit.jpg",
      blurb: "Heart frost mist. A probe blinks in the dark. High rim, a low snow bowl. Soft pit, not a hole.",
    },
    {
      cat: "Map",
      title: "Dock Notch",
      img: "assets/history/dock-notch.jpg",
      blurb: "Asteroid mining. Tug drones and lasers. The notch sways. Floating mid island, void on the sides.",
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
      blurb: "Fifty-eight sting, blast 58, fuse about two seconds. Paid guns hit harder now. Buy a charge with $BOBER, or find a crate.",
    },
    {
      cat: "Gun",
      title: "Sap Bomb",
      img: "assets/sprites/sap-bomb.png",
      blurb: "Forty sting, blast 52, sticky two ticks. Lodge sap. Charges only.",
    },
    {
      cat: "Gun",
      title: "Lodge Mortar",
      img: "assets/sprites/mortar.png",
      blurb: "Fifty sting, blast 54, a high lob with a ground shadow. One charge. Soft preview. Not a win button.",
    },
    {
      cat: "Gun",
      title: "Ice Brace",
      img: "assets/sprites/ice-brace.png",
      blurb: "No sting. A wall of ice, sixty HP, two turns, then melt. Blocks shots and a short step.",
    },
    {
      cat: "Gun",
      title: "Pinecone Cluster",
      img: "assets/sprites/pinecone.png",
      blurb: "Sixteen sting three times, blast 28 each. Splits after the apex. One charge.",
    },
    {
      cat: "Gun",
      title: "Woodchip Mine",
      img: "assets/sprites/woodchip-mine.png",
      blurb: "Fifty-two sting, blast 42. Plants on hit. Arms next turn. Boom is a flame burst with embers, not a quiet puff.",
    },
    {
      cat: "Gun",
      title: "Bark Buckler",
      img: "assets/sprites/bark-buckler.png",
      blurb: "No sting. Thirty-five temp shield on the active Bober, two turns. One charge.",
    },
    {
      cat: "Gun",
      title: "Corkscrew Rocket",
      img: "assets/sprites/corkscrew-rocket.png",
      blurb: "Fifty-five sting, blast 46. One charge, fifty $BOBER. Flies with a visible twist smoke trail and a whoosh. Big crater.",
    },
    {
      cat: "Gun",
      title: "Lodge Chaingun",
      img: "assets/sprites/lodge-chaingun.png",
      blurb: "Fourteen sting five times, blast 12 each. One charge, forty-eight $BOBER. Short burst, muzzle flash, tracers, recoil kick. Wind tugs each round.",
    },
    {
      cat: "Gun",
      title: "Arc Zap",
      img: "assets/sprites/arc-zap.png",
      blurb: "Twenty-eight sting, then lightning jumps to the nearest two enemies for fourteen each. One charge, fifty-five $BOBER. Bright bolt, afterglow.",
    },
    {
      cat: "Gun",
      title: "Ricochet Fang",
      img: "assets/sprites/ricochet-fang.png",
      blurb: "Twenty-two sting. Bounces up to three banks, then a spark to the closest Bober in eighty pixels. One charge, forty-two $BOBER.",
    },
    {
      cat: "Gun",
      title: "Ember Cascade",
      img: "assets/sprites/ember-cascade.png",
      blurb: "Eighteen sting, then fire orbs hop bank to bank, up to four hops. One charge, sixty $BOBER. Trail flames.",
    },
    {
      cat: "Gear",
      title: "Crates and shop",
      img: "assets/history/crate-gear.jpg",
      blurb: "Every three turns a crate lands on solid ground. Both sides start with the same $BOBER bag (about 180) and the same charges. Tap SHOP mid-match for Arc Zap, Ricochet Fang, Ember Cascade, and the rest. Paid loadout is stronger; Bobers start at 85 HP. Short on coins? The shop says how many more you need.",
    },
    {
      cat: "Gear",
      title: "Link Battle",
      img: "assets/history/bank-fight.jpg",
      blurb: "Two phones. Host gets a 4-letter room code. Join types it. Same Wi-Fi is best; a short PeerJS hop (STUN, then TURN if needed) finds the other player. Host is Lodge, Join is Creek. Two devices, no account. ICE FAIL means retry on the same Wi-Fi.",
    },
  ];

  const STILLS = CARDS.filter((c) => c.cat === "Map" || c.cat === "Gear");

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
