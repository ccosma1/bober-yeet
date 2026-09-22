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
      blurb: "Twenty-five sting, blast 28, infinite. The weaker opener. Paid guns hit harder.",
    },
    {
      cat: "Gun",
      title: "Dynamite",
      img: "assets/sprites/dynamite.png",
      blurb: "Eighty-seven sting, blast 87, fuse about two seconds. Hits harder. Buy a charge with $BOBER, or find a crate.",
    },
    {
      cat: "Gun",
      title: "Sap Bomb",
      img: "assets/sprites/sap-bomb.png",
      blurb: "Sixty sting, blast 78, sticky two ticks. Hits harder. Lodge sap. Charges only.",
    },
    {
      cat: "Gun",
      title: "Lodge Mortar",
      img: "assets/sprites/mortar.png",
      blurb: "Seventy-five sting, blast 81, a high lob with a ground shadow. Hits harder. One charge. Not a win button.",
    },
    {
      cat: "Gun",
      title: "Pinecone Cluster",
      img: "assets/sprites/pinecone.png",
      blurb: "Twenty-four sting three times, blast 42 each. Hits harder. Splits after the apex. One charge.",
    },
    {
      cat: "Gun",
      title: "Woodchip Mine",
      img: "assets/sprites/woodchip-mine.png",
      blurb: "Seventy-eight sting, blast 63. Hits harder. Plants on hit. Arms next turn. Boom is a flame burst with embers, not a quiet puff.",
    },
    {
      cat: "Gun",
      title: "Corkscrew Rocket",
      img: "assets/sprites/corkscrew-rocket.png",
      blurb: "Eighty-three sting, blast 69. Hits harder. One charge, fifty $BOBER. Flies with a visible twist smoke trail and a whoosh. Big crater.",
    },
    {
      cat: "Gun",
      title: "Lodge Chaingun",
      img: "assets/sprites/lodge-chaingun.png",
      blurb: "Twenty-one sting five times, blast 18 each. Hits harder. One charge, forty-eight $BOBER. Short burst, muzzle flash, tracers, recoil kick. Wind tugs each round.",
    },
    {
      cat: "Gun",
      title: "Arc Zap",
      img: "assets/sprites/arc-zap.png",
      blurb: "Forty-two sting, then lightning jumps to the nearest two enemies for twenty-one each. Hits harder. One charge, fifty-five $BOBER. Bright bolt, afterglow.",
    },
    {
      cat: "Gun",
      title: "Ricochet Fang",
      img: "assets/sprites/ricochet-fang.png",
      blurb: "Thirty-three sting. Hits harder. Bounces up to three banks, then a spark to the closest Bober in eighty pixels. One charge, forty-two $BOBER.",
    },
    {
      cat: "Gun",
      title: "Ember Cascade",
      img: "assets/sprites/ember-cascade.png",
      blurb: "Twenty-seven sting, then fire orbs hop, up to two hops. Hits harder. One charge, sixty $BOBER. Trail flames.",
    },
    {
      cat: "Gun",
      title: "Sap Snare",
      img: "assets/sprites/sap-snare.png",
      blurb: "Twelve sting. Hits harder. Sticky sap zone, two turns. Walk slows to a crawl inside it. One charge, thirty $BOBER.",
    },
    {
      cat: "Gun",
      title: "Stun Cone",
      img: "assets/sprites/stun-cone.png",
      blurb: "Eighteen sting. Hits harder. Stunned next turn — no aim, no Fire. One charge, thirty-eight $BOBER.",
    },
    {
      cat: "Gun",
      title: "Grav Lure",
      img: "assets/sprites/grav-lure.png",
      blurb: "Fifteen sting. Hits harder. Pulls one or two enemies to the impact on a visible tether. One charge, forty-five $BOBER.",
    },
    {
      cat: "Gear",
      title: "Crates and shop",
      img: "assets/history/crate-gear.jpg",
      blurb: "Every three turns a crate lands on solid ground. Both sides start with the same $BOBER bag (about 180) and the same charges. Tap SHOP mid-match for Arc Zap, Ricochet Fang, Ember Cascade, and the rest. Paid guns hit harder. Bobers start at 80 HP. Each turn Walk left caps how far you step. Short on coins? The shop says how many more you need.",
    },
    {
      cat: "Gear",
      title: "Link Battle",
      img: "assets/history/bank-fight.jpg",
      blurb: "Two phones. Host gets a 4-letter room code. Join types it. Needs internet — same Wi-Fi not required. PeerJS finds the other player with public STUN, then TURN if the direct path fails. Host is Lodge, Join is Creek. Two devices, no account. Vs AI stays offline. ICE FAIL means both sides need internet. Retry Host / Join.",
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
