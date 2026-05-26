(function () {
  if (typeof browser !== "undefined" && browser.storage) return;

  const polyfill = {};

  if (typeof chrome !== "undefined" && chrome.storage) {
    polyfill.storage = { local: {} };

    polyfill.storage.local.get = (keys) =>
      new Promise((resolve) => chrome.storage.local.get(keys, resolve));

    polyfill.storage.local.set = (items) =>
      new Promise((resolve) => chrome.storage.local.set(items, resolve));

    polyfill.storage.local.remove = (keys) =>
      new Promise((resolve) => chrome.storage.local.remove(keys, resolve));

    polyfill.storage.local.clear = () =>
      new Promise((resolve) => chrome.storage.local.clear(resolve));

    polyfill.runtime = {
      lastError: null,
      onInstalled: { addListener: (cb) => chrome.runtime.onInstalled.addListener(cb) },
    };
  }

  window.browser = polyfill;
})();

if (!crypto.randomUUID) {
  crypto.randomUUID = function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  };
}
