window.Tabily = window.Tabily || {};

(function () {
  Tabily.ExcalidrawPane = {
    type: "excalidraw",
    label: "Excalidraw",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2l-2.8-2.8"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/></svg>`,

    defaultWidth: 8,
    defaultHeight: 3,

    defaultData: {
      sceneData: null,
    },

    render(pane) {
      const container = document.createElement("div");
      container.className = "pane-content-inner pane-excalidraw";
      container.dataset.paneId = pane.id;

      const iframe = document.createElement("iframe");
      iframe.className = "excalidraw-iframe";
      iframe.src = "https://excalidraw.com/?theme=dark&embed&iframe";
      iframe.allow = "clipboard-read; clipboard-write";
      iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";
      iframe.loading = "lazy";

      container.appendChild(iframe);

      let loaded = false;
      let saveTimeout = null;

      // Latest scene data received from Excalidraw (auto-sent on changes)
      let lastSceneData = null;

      const loadScene = () => {
        if (!loaded || !iframe.contentWindow || !pane.data.sceneData) return;
        try {
          iframe.contentWindow.postMessage(
            { type: "loadScene", sceneData: pane.data.sceneData },
            "*"
          );
        } catch (_) {}
      };

      const messageHandler = (e) => {
        if (e.source !== iframe.contentWindow) return;

        const msg = e.data;
        if (!msg || typeof msg !== "object") return;

        // Excalidraw embed signals readiness
        if (msg.type === "excalidraw-ready") {
          loaded = true;
          // Restore saved scene if we have one
          if (pane.data.sceneData) {
            loadScene();
          }
          return;
        }

        // Excalidraw sends scene data automatically on changes
        // messages can be { type: "sceneData", elements, appState }
        // or { type: "sceneModified", ... }
        if (msg.type === "sceneData" || msg.type === "sceneModified") {
          lastSceneData = msg;
          // Auto-save scene data to extension storage (debounced)
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            pane.data.sceneData = lastSceneData;
            Tabily.Storage.save(Tabily.getPanes());
          }, 800);
        }

        // Also handle { elements, appState } payload
        if (msg.elements && msg.appState) {
          lastSceneData = { elements: msg.elements, appState: msg.appState };
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            pane.data.sceneData = { elements: msg.elements, appState: msg.appState };
            Tabily.Storage.save(Tabily.getPanes());
          }, 800);
        }
      };

      window.addEventListener("message", messageHandler);

      // Exposed for main.js to wire the "Save" button
      container._excalidrawSave = () => {
        if (!loaded || !iframe.contentWindow) return;
        // Request fresh scene data from Excalidraw
        try {
          iframe.contentWindow.postMessage({ type: "requestScene" }, "*");
        } catch (_) {}
        // If we got no response, save whatever we have
        setTimeout(() => {
          if (lastSceneData) {
            pane.data.sceneData = lastSceneData;
            Tabily.Storage.save(Tabily.getPanes());
          }
        }, 200);
      };

      container._cleanup = () => {
        window.removeEventListener("message", messageHandler);
        if (saveTimeout) clearTimeout(saveTimeout);
      };

      return container;
    },
  };
})();
