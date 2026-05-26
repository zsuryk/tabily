window.Tabily = window.Tabily || {};

(function () {
  Tabily.MarkdownPane = {
    type: "markdown",
    label: "Markdown Note",
    icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,

    defaultWidth: 6,
    defaultHeight: 2,

    defaultData: {
      content: "# New Note\n\nStart typing here...",
    },

    render(pane) {
      const container = document.createElement("div");
      container.className = "pane-content-inner pane-markdown";
      container.dataset.paneId = pane.id;

      const md = pane.data.content || "";

      const renderView = document.createElement("div");
      renderView.className = "markdown-render";
      try {
        renderView.innerHTML = marked.parse(md);
      } catch (_) {
        renderView.textContent = md;
      }

      const editor = document.createElement("textarea");
      editor.className = "markdown-editor";
      editor.value = md;
      editor.spellcheck = true;

      container.appendChild(renderView);
      container.appendChild(editor);

      let saveTimeout = null;

      const startEdit = () => {
        renderView.style.display = "none";
        editor.style.display = "block";
        editor.focus();
        editor.selectionStart = editor.selectionEnd = editor.value.length;
      };

      const finishEdit = () => {
        const newContent = editor.value;
        pane.data.content = newContent;
        try {
          renderView.innerHTML = marked.parse(newContent);
        } catch (_) {
          renderView.textContent = newContent;
        }
        renderView.style.display = "block";
        editor.style.display = "none";
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => Tabily.Storage.save(Tabily.getPanes()), 300);
      };

      container.addEventListener("click", (e) => {
        if (e.target.closest(".pane-controls") || e.target.closest(".resize-handle")) return;
        if (editor.style.display !== "block") startEdit();
      });

      editor.addEventListener("mousedown", (e) => e.stopPropagation());

      const blurHandler = (e) => {
        if (editor.style.display === "block" && !container.contains(e.target)) {
          finishEdit();
        }
      };
      document.addEventListener("mousedown", blurHandler);

      editor.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          editor.value = pane.data.content || "";
          finishEdit();
        }
        e.stopPropagation();
      });

      container._cleanup = () => {
        document.removeEventListener("mousedown", blurHandler);
        if (saveTimeout) clearTimeout(saveTimeout);
      };

      return container;
    },
  };
})();
