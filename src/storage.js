// window.storage shim — backed by browser localStorage.
// Matches the async API used by FacilityDesigner: get / set / list.
// This keeps Save / Load working for anyone using the app in a browser.

const PREFIX = "_fd_storage_";

window.storage = {
  async get(key) {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? null : { value: v };
  },
  async set(key, value) {
    localStorage.setItem(PREFIX + key, value);
  },
  async list(prefix = "") {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const real = k.slice(PREFIX.length);
        if (real.startsWith(prefix)) keys.push(real);
      }
    }
    return { keys };
  },
};
