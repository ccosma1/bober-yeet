/* Link Battle: PeerJS datachannel. Loaded only when someone hosts or joins. */
(function (global) {
  const PREFIX = "byw-";
  const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const ICE = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun.cloudflare.com:3478" },
      {
        urls: [
          "turn:eu-0.turn.peerjs.com:3478",
          "turn:us-0.turn.peerjs.com:3478",
          "turn:eu-0.turn.peerjs.com:3478?transport=tcp",
          "turn:us-0.turn.peerjs.com:3478?transport=tcp",
        ],
        username: "peerjs",
        credential: "peerjsp",
      },
    ],
    iceCandidatePoolSize: 8,
    sdpSemantics: "unified-plan",
  };
  const CLOUD = {
    host: "0.peerjs.com",
    port: 443,
    path: "/",
    secure: true,
    key: "peerjs",
    config: ICE,
    debug: 0,
  };
  let peer = null;
  let conn = null;
  let role = null;
  let code = "";
  let onEvent = null;

  function emit(e) {
    if (onEvent) onEvent(e);
  }

  function randCode() {
    let s = "";
    for (let i = 0; i < 4; i++) s += ALPH[(Math.random() * ALPH.length) | 0];
    return s;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("peerjs"));
      document.head.appendChild(s);
    });
  }

  function load() {
    if (global.Peer) return Promise.resolve();
    return loadScript("https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js").catch(() =>
      loadScript("https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js")
    );
  }

  function iceMsg(err) {
    const t = (err && err.type) || "";
    const m = String((err && err.message) || err || "");
    if (t === "peer-unavailable") return "NO HOST for that code.";
    if (t === "unavailable-id") return "CODE TAKEN. Retry Host.";
    if (t === "network" || t === "socket-error" || t === "socket-closed") return "LINK FAIL — network.";
    if (/ice/i.test(m) || t === "webrtc") return "ICE FAIL. Same Wi-Fi is best. Retry Host / Join.";
    return m || "LINK FAIL";
  }

  function watchIce(c) {
    const pc = c && c.peerConnection;
    if (!pc) return;
    pc.addEventListener("iceconnectionstatechange", () => {
      const st = pc.iceConnectionState;
      if (st === "failed") {
        emit({ type: "error", msg: "ICE FAIL. Same Wi-Fi is best. Retry Host / Join." });
        emit({ type: "drop" });
      }
    });
  }

  function wireConn(c) {
    conn = c;
    watchIce(c);
    c.on("data", (raw) => {
      let msg = raw;
      if (typeof raw === "string") {
        try {
          msg = JSON.parse(raw);
        } catch (_) {
          return;
        }
      }
      if (!msg || typeof msg !== "object") return;
      if (msg.t === "ping") {
        send({ t: "pong" });
        return;
      }
      if (msg.t === "pong") return;
      emit({ type: "data", msg });
    });
    c.on("close", () => emit({ type: "drop" }));
    c.on("error", (err) => emit({ type: "error", msg: iceMsg(err) }));
    emit({ type: "peer" });
  }

  function makePeer(id) {
    return id ? new global.Peer(id, CLOUD) : new global.Peer(CLOUD);
  }

  function host(cb) {
    close();
    onEvent = cb;
    role = "host";
    return load().then(
      () =>
        new Promise((resolve, reject) => {
          let tries = 0;
          const attempt = () => {
            code = randCode();
            const id = PREFIX + code.toLowerCase();
            if (peer) {
              try {
                peer.destroy();
              } catch (_) {}
            }
            peer = makePeer(id);
            const retry = () => {
              tries += 1;
              if (tries < 8) attempt();
              else reject(new Error("host"));
            };
            peer.on("error", (err) => {
              const typ = err && err.type;
              if (typ === "unavailable-id") retry();
              else emit({ type: "error", msg: iceMsg(err) });
            });
            peer.on("open", () => {
              emit({ type: "open", code });
              resolve({ code });
            });
            peer.on("connection", (c) => {
              if (c.open) wireConn(c);
              else c.on("open", () => wireConn(c));
            });
            peer.on("disconnected", () => {
              try {
                peer.reconnect();
              } catch (_) {
                emit({ type: "drop" });
              }
            });
          };
          attempt();
        })
    );
  }

  function join(raw, cb) {
    close();
    onEvent = cb;
    role = "guest";
    code = String(raw || "")
      .toUpperCase()
      .replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ]/g, "")
      .slice(0, 4);
    if (code.length !== 4) return Promise.reject(new Error("code"));
    return load().then(
      () =>
        new Promise((resolve, reject) => {
          peer = makePeer();
          const boom = (err) => {
            const msg = iceMsg(err);
            emit({ type: "error", msg });
            reject(err || new Error(msg));
          };
          peer.on("error", (err) => {
            const typ = err && err.type;
            if (typ === "peer-unavailable") boom(err);
            else emit({ type: "error", msg: iceMsg(err) });
          });
          const timer = setTimeout(() => boom(new Error("ICE FAIL. Same Wi-Fi is best. Retry Host / Join.")), 20000);
          peer.on("open", () => {
            const c = peer.connect(PREFIX + code.toLowerCase(), { reliable: true, serialization: "json" });
            c.on("open", () => {
              clearTimeout(timer);
              wireConn(c);
              resolve({ code });
            });
            c.on("error", boom);
          });
        })
    );
  }

  function send(obj) {
    if (!conn || !conn.open) return false;
    try {
      conn.send(obj);
      return true;
    } catch (_) {
      return false;
    }
  }

  function close() {
    try {
      if (conn) conn.close();
    } catch (_) {}
    try {
      if (peer) peer.destroy();
    } catch (_) {}
    conn = null;
    peer = null;
    role = null;
    code = "";
    onEvent = null;
  }

  global.BoberNet = {
    load,
    host,
    join,
    send,
    close,
    get code() {
      return code;
    },
    get role() {
      return role;
    },
    get connected() {
      return !!(conn && conn.open);
    },
  };
})(window);
