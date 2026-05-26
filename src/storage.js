window.Tabily = window.Tabily || {};

(function () {
  const LAYOUT_KEY = "layout";
  const SETTINGS_KEY = "settings";

  const DEFAULT_SETTINGS = {
    gridPadding: 16,
    paneGap: 12,
  };

  Tabily.Storage = {
    async save(panes) {
      await browser.storage.local.set({ [LAYOUT_KEY]: { panes } });
    },

    async load() {
      const result = await browser.storage.local.get(LAYOUT_KEY);
      return result[LAYOUT_KEY] || { panes: [] };
    },

    async saveSettings(settings) {
      const merged = { ...DEFAULT_SETTINGS, ...settings };
      await browser.storage.local.set({ [SETTINGS_KEY]: merged });
    },

    async loadSettings() {
      const result = await browser.storage.local.get(SETTINGS_KEY);
      return { ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) };
    },

    async exportLayout() {
      const [layout, settings] = await Promise.all([
        Tabily.Storage.load(),
        Tabily.Storage.loadSettings(),
      ]);
      const { panes } = layout;
      const blob = new Blob(
        [
          JSON.stringify(
            { panes, settings, version: 1, exportedAt: new Date().toISOString() },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tabily-layout-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },

    importLayout(jsonStr) {
      try {
        const data = JSON.parse(jsonStr);
        if (!data || !Array.isArray(data.panes)) throw new Error("Invalid format");
        data.panes.forEach((p, i) => {
          if (!p.id) p.id = crypto.randomUUID();
          if (!p.type) throw new Error(`Pane ${i} missing type`);
          if (p.col == null || p.row == null || p.width == null || p.height == null)
            throw new Error(`Pane ${i} missing position`);
        });
        const settings = data.settings ? { ...DEFAULT_SETTINGS, ...data.settings } : null;
        return { panes: data.panes, settings };
      } catch (e) {
        throw new Error("Invalid layout file: " + e.message);
      }
    },
  };
})();
