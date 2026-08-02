import browser from "webextension-polyfill";

const manifest = browser.runtime?.getManifest?.();
const name = manifest?.name ?? "stackytab";

document.querySelector("[data-app-name]").textContent = name;
