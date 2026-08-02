import browser from "webextension-polyfill";

document.querySelector("[data-app-name]").textContent =
  browser.runtime.getManifest().name;
