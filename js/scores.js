(function (global) {
  const KEY = "bober-yeet-board";
  const NAME_KEY = "bober-yeet-name";
  const LOCAL_API = "/api/scores";
  const CLOUD_URL =
    "https://crudcrud.com/api/e03e7485b9b14bc7ad4a2ee420c17036/board/6a92cb1392884803e8f672ba";

  function cleanName(raw) {
    const s = String(raw || "")
      .replace(/[^\w \-.'àáâãäåèéêëìíîïòóôõöùúûüçñ]/gi, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 16);
    return s;
  }

  function isLocalHost() {
    const h = location.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "";
  }

  function localList() {
    try {
      const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
      return Array.isArray(rows) ? rows : [];
    } catch (_) {
      return [];
    }
  }

  function localSave(rows) {
    localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 50)));
  }

  function sortRows(rows) {
    return rows
      .slice()
      .sort((a, b) => b.score - a.score || b.levels - a.levels || a.at - b.at);
  }

  function upsert(rows, entry) {
    const name = cleanName(entry.name);
    if (!name || entry.score < 0) return rows;
    const next = {
      name,
      score: Math.floor(Number(entry.score) || 0),
      levels: Math.max(1, Math.min(6, Math.floor(Number(entry.levels) || 1))),
      at: entry.at || Date.now(),
    };
    const idx = rows.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
    if (idx >= 0) {
      if (next.score > rows[idx].score) rows[idx] = next;
    } else {
      rows.push(next);
    }
    return sortRows(rows).slice(0, 50);
  }

  async function fetchJson(url, opts, ms) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms || 9000);
    try {
      const r = await fetch(url, Object.assign({ cache: "no-store", signal: ctrl.signal }, opts || {}));
      if (!r.ok) throw new Error("http " + r.status);
      const text = await r.text();
      return text ? JSON.parse(text) : {};
    } finally {
      clearTimeout(t);
    }
  }

  async function cloudGet() {
    const data = await fetchJson(CLOUD_URL);
    const rows = Array.isArray(data) ? data : data.rows;
    return Array.isArray(rows) ? rows : [];
  }

  async function cloudPut(rows) {
    await fetchJson(
      CLOUD_URL,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: sortRows(rows).slice(0, 50) }),
      },
      9000
    );
  }

  async function localApiGet() {
    const r = await fetch(LOCAL_API, { cache: "no-store" });
    if (!r.ok) throw new Error("local api");
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  }

  async function localApiPost(entry) {
    const r = await fetch(LOCAL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (!r.ok) throw new Error("local post");
    const rows = await r.json();
    return Array.isArray(rows) ? rows : [];
  }

  const Scores = {
    cleanName,
    getSavedName() {
      return cleanName(localStorage.getItem(NAME_KEY) || "");
    },
    setSavedName(name) {
      const n = cleanName(name);
      if (n) localStorage.setItem(NAME_KEY, n);
      return n;
    },

    async list() {
      try {
        const rows = isLocalHost() ? await localApiGet() : await cloudGet();
        const sorted = sortRows(rows);
        localSave(sorted);
        return sorted;
      } catch (_) {
        return sortRows(localList());
      }
    },

    async submit(entry) {
      let rows = upsert(localList(), entry);
      localSave(rows);
      try {
        if (isLocalHost()) {
          rows = await localApiPost(entry);
        } else {
          const remote = await cloudGet();
          rows = upsert(remote, entry);
          await cloudPut(rows);
        }
        localSave(sortRows(rows));
        return sortRows(rows);
      } catch (_) {
        return rows;
      }
    },
  };

  global.BoberScores = Scores;
})(window);
