/**
 * Persistent player settings (volume, vibrate, swipe).
 */
window.GameSettings = (() => {
  const KEY = "gom-html5-settings";
  const defaults = () => ({
    master: 0.7,
    music: 0.45,
    sfx: 1,
    mute: false,
    vibrate: true,
    swipeMove: false,
  });

  let data = defaults();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) data = Object.assign(defaults(), JSON.parse(raw));
    } catch (_) {
      data = defaults();
    }
    return data;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() {
    return data;
  }

  function set(partial) {
    Object.assign(data, partial);
    save();
    return data;
  }

  function vibrate(pattern) {
    if (!data.vibrate || data.mute) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  }

  load();
  return { load, save, get, set, vibrate, defaults };
})();
