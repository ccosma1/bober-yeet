/* Link Battle: PeerJS datachannel. Loaded only when someone hosts or joins. */
(function (global) {
  const PREFIX = "byw-";
  const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
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

  function load() {
    if (global.Peer) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("peerjs"));
      document.head.appendChild(s);
    });
  }

  function wireConn(c) {
    conn = c;
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
    c.on("error", () => emit({ type: "drop" }));
    emit({ type: "peer" });
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
            peer = new global.Peer(id);
            const retry = () => {
              tries += 1;
              if (tries < 8) attempt();
              else reject(new Error("host"));
            };
            peer.on("error", (err) => {
              const typ = err && err.type;
              if (typ === "unavailable-id") retry();
              else emit({ type: "error", msg: String((err && err.message) || err) });
            });
            peer.on("open", () => {
              emit({ type: "open", code });
              resolve({ code });
            });
            peer.on("connection", (c) => {
              c.on("open", () => wireConn(c));
            });
            peer.on("disconnected", () => emit({ type: "drop" }));
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
          peer = new global.Peer();
          const boom = (err) => reject(err || new Error("join"));
          peer.on("error", (err) => emit({ type: "error", msg: String((err && err.message) || err) }));
          const timer = setTimeout(() => boom(new Error("timeout")), 14000);
          peer.on("open", () => {
            const c = peer.connect(PREFIX + code.toLowerCase(), { reliable: true });
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
