/**
 * Save / load helpers for «Девушка на луне».
 */
window.GameSave = (() => {
  const SAVE = "gom-html5-v9";
  const LEGACY = ["gom-html5-v8", "gom-html5-v7", "gom-html5-v6"];

  function key() {
    return SAVE;
  }

  function has() {
    if (localStorage.getItem(SAVE)) return true;
    return LEGACY.some((k) => localStorage.getItem(k));
  }

  function write(st) {
    localStorage.setItem(SAVE, JSON.stringify(st));
  }

  function read(defState) {
    try {
      let raw = localStorage.getItem(SAVE);
      if (!raw) {
        for (const k of LEGACY) {
          raw = localStorage.getItem(k);
          if (raw) break;
        }
      }
      if (!raw) return null;
      return Object.assign(defState(), JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(SAVE);
    for (const k of LEGACY) localStorage.removeItem(k);
  }

  function scrubOld() {
    ["girl-on-moon-html5-v1", "gom-html5-v3", "gom-html5-v4", "gom-html5-v5"].forEach((k) =>
      localStorage.removeItem(k)
    );
  }

  return { key, has, write, read, clear, scrubOld };
})();
