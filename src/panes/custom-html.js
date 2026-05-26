window.Tabily = window.Tabily || {};

(function () {
  Tabily.CustomHtmlPane = {
    type: "custom-html",
    label: "Custom HTML",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,

    defaultWidth: 6,
    defaultHeight: 3,

    defaultData: {
      html: '<h1>Hello</h1>\n<p>Edit this code in the pane controls.</p>\n<style>\n  body { font-family: sans-serif; padding: 16px; background: #f8fafc; }\n  h1 { color: #6366f1; }\n</style>',
      showingEditor: false,
    },

    render(pane) {
      const container = document.createElement("div");
      container.className = "pane-content-inner pane-custom-html";
      container.dataset.paneId = pane.id;

      /* ---- Editor ---- */
      const editor = document.createElement("textarea");
      editor.className = "custom-html-editor";
      editor.spellcheck = false;
      const mode = pane.data.showingEditor;

      /* ---- Preview iframe ---- */
      const iframe = document.createElement("iframe");
      iframe.className = "custom-iframe";
      iframe.sandbox = "allow-scripts";
      iframe.loading = "lazy";

      container.appendChild(editor);
      container.appendChild(iframe);

      let saveTimeout = null;

      const renderPreview = () => {
        iframe.srcdoc = pane.data.html || '<html><body></body></html>';
      };

      const showEditor = () => {
        pane.data.showingEditor = true;
        editor.style.display = "block";
        iframe.style.display = "none";
        editor.value = pane.data.html || "";
        editor.focus();
      };

      const showPreview = () => {
        pane.data.showingEditor = false;
        editor.style.display = "none";
        iframe.style.display = "block";
        renderPreview();
      };

      // Set initial visibility
      if (mode) {
        showEditor();
      } else {
        showPreview();
      }

      // Expose toggle for pane controls
      container._toggleMode = () => {
        if (pane.data.showingEditor) {
          // Save and switch to preview
          pane.data.html = editor.value;
          showPreview();
        } else {
          showEditor();
        }
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => Tabily.Storage.save(Tabily.getPanes()), 300);
      };

      // Auto-save on edit (debounced)
      editor.addEventListener("input", () => {
        pane.data.html = editor.value;
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => Tabily.Storage.save(Tabily.getPanes()), 400);
      });

      // Ctrl+S / Cmd+S to save and preview
      editor.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
          e.preventDefault();
          pane.data.html = editor.value;
          showPreview();
          if (saveTimeout) clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => Tabily.Storage.save(Tabily.getPanes()), 300);
        }
        e.stopPropagation();
      });

      container._cleanup = () => {
        if (saveTimeout) clearTimeout(saveTimeout);
      };

      return container;
    },
  };
})();
