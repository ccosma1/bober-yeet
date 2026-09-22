/* Link Battle: PeerJS datachannel over the internet. Vs AI never calls this. */
(function (global) {
  const PREFIX = "byw-";
  const ALPH = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const ICE_MSG = "ICE FAIL. Needs internet — same Wi-Fi not required. Retry Host / Join.";
  const RELAY = /(?:\?|&)relay=1(?:&|$)/.test(location.search);
  let peer = null;
  let conn = null;
  let role = null;
  let code = "";
  let onEvent = null;
  let beat = null;
  let iceInfo = { state: "", relay: false, srflx: false, host: false };

  function emit(e) {
    if (onEvent) onEvent(e);
  }

  function turn(urls) {
    return { urls: urls, username: "guest", credential: "password" };
  }

  function iceConfig() {
    const cfg = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun.cloudflare.com:3478" },
        turn("turn:turn.evan-brass.net:3478?transport=udp"),
        turn("turn:turn.evan-brass.net:3478?transport=tcp"),
        turn("turns:turn.evan-brass.net:443?transport=tcp"),
      ],
      iceCandidatePoolSize: 4,
    };
    if (RELAY) cfg.iceTransportPolicy = "relay";
    return cfg;
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
    if (t === "peer-unavailable") return "NO HOST for that code. Both players need internet.";
    if (t === "unavailable-id") return "CODE TAKEN. Retry Host.";
    if (t === "network" || t === "socket-error" || t === "socket-closed") return "LINK FAIL — no internet to the room server.";
    if (/ice/i.test(m) || t === "webrtc") return ICE_MSG;
    return m || "LINK FAIL";
  }

  function noteCandidate(cand) {
    const line = (cand && cand.candidate) || "";
    if (line.indexOf("typ relay") >= 0) iceInfo.relay = true;
    if (line.indexOf("typ srflx") >= 0) iceInfo.srflx = true;
    if (line.indexOf("typ host") >= 0) iceInfo.host = true;
  }

  function stopBeat() {
    if (beat) clearInterval(beat);
    beat = null;
  }

  function startBeat() {
    stopBeat();
    beat = setInterval(() => {
      send({ t: "ping" });
    }, 4000);
  }

  function refreshIce() {
    const pc = conn && conn.peerConnection;
    if (!pc || !pc.getStats) return Promise.resolve(iceInfo);
    return pc.getStats().then((stats) => {
      const byId = {};
      stats.forEach((row) => {
        byId[row.id] = row;
        if (row.type === "local-candidate" || row.type === "remote-candidate") {
          if (row.candidateType === "relay") iceInfo.relay = true;
          if (row.candidateType === "srflx") iceInfo.srflx = true;
          if (row.candidateType === "host") iceInfo.host = true;
        }
      });
      stats.forEach((row) => {
        if (row.type === "candidate-pair" && row.nominated && row.state === "succeeded") {
          const local = byId[row.localCandidateId];
          const remote = byId[row.remoteCandidateId];
          iceInfo.pair = (local && local.candidateType) + "->" + (remote && remote.candidateType);
        }
      });
      iceInfo.state = pc.iceConnectionState || iceInfo.state;
      return iceInfo;
    });
  }

  function armIce(c) {
    if (!c || c.__yeetIce) return;
    c.__yeetIce = true;
    const tryPc = () => {
      if (c.peerConnection) {
        watchIce(c);
        return true;
      }
      return false;
    };
    if (tryPc()) return;
    const timer = setInterval(() => {
      if (tryPc() || !peer) clearInterval(timer);
    }, 40);
  }

  function watchIce(c) {
    const pc = c && c.peerConnection;
    if (!pc || pc.__yeetWatch) return;
    pc.__yeetWatch = true;
    let grace = null;
    const clearGrace = () => {
      if (grace) clearTimeout(grace);
      grace = null;
    };
    pc.addEventListener("icecandidate", (ev) => {
      if (ev.candidate) noteCandidate(ev.candidate);
    });
    const fail = () => {
      iceInfo.state = pc.iceConnectionState || "failed";
      emit({ type: "error", msg: ICE_MSG });
      emit({ type: "drop" });
    };
    pc.addEventListener("iceconnectionstatechange", () => {
      const st = pc.iceConnectionState;
      iceInfo.state = st;
      if (st === "connected" || st === "completed") {
        clearGrace();
        emit({ type: "ice", state: st, relay: iceInfo.relay });
        return;
      }
      if (st === "disconnected") {
        clearGrace();
        grace = setTimeout(() => {
          const now = pc.iceConnectionState;
          if (now !== "connected" && now !== "completed") fail();
        }, 5000);
        return;
      }
      if (st === "failed") fail();
    });
  }

  function wireConn(c) {
    conn = c;
    armIce(c);
    refreshIce();
    startBeat();
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
    const opt = {
      host: "0.peerjs.com",
      port: 443,
      path: "/",
      secure: true,
      key: "peerjs",
      config: iceConfig(),
      debug: 0,
    };
    return id ? new global.Peer(id, opt) : new global.Peer(opt);
  }

  function host(cb) {
    close();
    onEvent = cb;
    role = "host";
    iceInfo = { state: "", relay: false, srflx: false, host: false };
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
              armIce(c);
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
    iceInfo = { state: "", relay: false, srflx: false, host: false };
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
            if (typ === "peer-unavailable" || typ === "network" || typ === "socket-error") boom(err);
            else emit({ type: "error", msg: iceMsg(err) });
          });
          const timer = setTimeout(() => boom(new Error(ICE_MSG)), 32000);
          peer.on("open", () => {
            const c = peer.connect(PREFIX + code.toLowerCase(), {
              reliable: true,
              serialization: "json",
              config: iceConfig(),
            });
            armIce(c);
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
    stopBeat();
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
    get ice() {
      return iceInfo;
    },
    refreshIce,
  };
})(window);
