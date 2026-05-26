window.Tabily = window.Tabily || {};

(function () {
  "use strict";

  const GRID_COLS = 12;
  const ROW_HEIGHT = 180;

  const PANE_REGISTRY = {
    markdown: Tabily.MarkdownPane,
    excalidraw: Tabily.ExcalidrawPane,
    "custom-html": Tabily.CustomHtmlPane,
  };

  let panes = [];
  let settings = { gridPaddingX: 16, gridPaddingY: 16, paneGap: 12 };
  let gridEl, configToggle, configOverlay, configMenu, dragGhost, dropIndicator, importInput;
  let dragState = null;
  let resizeState = null;
  let configOpen = false;

  /* ------------------------------------------------------------------ */
  /*  Init                                                               */
  /* ------------------------------------------------------------------ */

  async function init() {
    cacheDOM();
    setupConfigToggle();
    setupConfigMenu();
    setupKeyboard();
    setupImportExport();
    await loadLayout();
    await loadSettings();
    applySettings();
    setupSettingsControls();
    renderGrid();
  }

  /* ------------------------------------------------------------------ */
  /*  Settings                                                           */
  /* ------------------------------------------------------------------ */

  async function loadSettings() {
    try {
      settings = await Tabily.Storage.loadSettings();
    } catch (_) {}
  }

  async function saveSettings() {
    try {
      await Tabily.Storage.saveSettings(settings);
    } catch (_) {}
  }

  function applySettings() {
    document.documentElement.style.setProperty("--grid-padding-x", settings.gridPaddingX + "px");
    document.documentElement.style.setProperty("--grid-padding-y", settings.gridPaddingY + "px");
    document.documentElement.style.setProperty("--grid-gap", settings.paneGap + "px");
  }

  function setupSettingsControls() {
    const padXInput = document.getElementById("setting-padding-x");
    const padYInput = document.getElementById("setting-padding-y");
    const gapInput = document.getElementById("setting-gap");

    if (!padXInput || !padYInput || !gapInput) return;

    padXInput.value = settings.gridPaddingX;
    padYInput.value = settings.gridPaddingY;
    gapInput.value = settings.paneGap;

    const onPadX = () => {
      const v = Math.max(0, parseInt(padXInput.value, 10) || 0);
      settings.gridPaddingX = v;
      padXInput.value = v;
      applySettings();
      saveSettings();
    };

    const onPadY = () => {
      const v = Math.max(0, parseInt(padYInput.value, 10) || 0);
      settings.gridPaddingY = v;
      padYInput.value = v;
      applySettings();
      saveSettings();
    };

    const onGap = () => {
      const v = Math.max(0, parseInt(gapInput.value, 10) || 0);
      settings.paneGap = v;
      gapInput.value = v;
      applySettings();
      saveSettings();
    };

    padXInput.addEventListener("input", onPadX);
    padXInput.addEventListener("change", onPadX);
    padYInput.addEventListener("input", onPadY);
    padYInput.addEventListener("change", onPadY);
    gapInput.addEventListener("input", onGap);
    gapInput.addEventListener("change", onGap);
  }

  function cacheDOM() {
    gridEl = document.getElementById("grid");
    configToggle = document.getElementById("config-toggle");
    configOverlay = document.getElementById("config-overlay");
    configMenu = document.getElementById("config-menu");
    dragGhost = document.getElementById("drag-ghost");
    importInput = document.getElementById("import-input");

    dropIndicator = document.createElement("div");
    dropIndicator.className = "grid-drop-indicator hidden";
    document.getElementById("dashboard").appendChild(dropIndicator);
  }

  /* ------------------------------------------------------------------ */
  /*  Expose getPanes for child modules                                  */
  /* ------------------------------------------------------------------ */

  Tabily.getPanes = () => panes;

  /* ------------------------------------------------------------------ */
  /*  Layout Persistence                                                 */
  /* ------------------------------------------------------------------ */

  async function loadLayout() {
    try {
      const { panes: saved } = await Tabily.Storage.load();
      if (saved && saved.length > 0) {
        panes = saved.map(normalizePane);
      } else {
        panes = [createWelcomePane()];
      }
    } catch (_) {
      panes = [createWelcomePane()];
    }
  }

  function createWelcomePane() {
    return normalizePane({
      id: crypto.randomUUID(),
      type: "markdown",
      title: "Welcome",
      col: 1,
      row: 1,
      width: 12,
      height: 2,
      data: {
        content:
          "# Welcome to tabily\n\nYour modular dashboard. Click the **gear** button in the bottom-right to add panes.\n\n- Click on this note to edit\n- Click outside to save\n- Drag the header to reposition\n- Drag the bottom-right corner to resize",
      },
    });
  }

  function normalizePane(p) {
    const def = PANE_REGISTRY[p.type];
    return {
      id: p.id || crypto.randomUUID(),
      type: p.type,
      title: p.title || (def ? def.label : p.type),
      col: Math.max(1, Math.min(GRID_COLS, p.col || 1)),
      row: Math.max(1, p.row || 1),
      width: def
        ? Math.max(2, Math.min(GRID_COLS, p.width || def.defaultWidth || 4))
        : Math.max(2, Math.min(GRID_COLS, p.width || 4)),
      height: Math.max(1, p.height || (def ? def.defaultHeight || 2 : 2)),
      zIndex: p.zIndex || 0,
      data: { ...((def && def.defaultData) || {}), ...(p.data || {}) },
    };
  }

  async function saveLayout() {
    try {
      await Tabily.Storage.save(panes);
    } catch (_) {}
  }

  /* ------------------------------------------------------------------ */
  /*  Grid Rendering                                                     */
  /* ------------------------------------------------------------------ */

  function renderGrid() {
    const sorted = [...panes].sort((a, b) => a.row - b.row || a.col - b.col);

    gridEl.innerHTML = "";

    if (sorted.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          <h3>Your dashboard is empty</h3>
          <p>Click the <strong>gear</strong> button at the bottom-right to add your first pane.</p>
        </div>`;
      return;
    }

    /* Normalise z-indices so they are always sequential 0,1,2,… */
    panes
      .slice()
      .sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
      .forEach((p, i) => {
        p.zIndex = i;
      });

    sorted.forEach((p) => {
      const def = PANE_REGISTRY[p.type];
      if (!def) return;

      const paneEl = document.createElement("div");
      paneEl.className = "pane";
      paneEl.dataset.paneId = p.id;
      paneEl.style.gridColumn = `${p.col} / span ${p.width}`;
      paneEl.style.gridRow = `${p.row} / span ${p.height}`;
      paneEl.style.zIndex = p.zIndex;

      /* ---- Header ---- */
      const header = document.createElement("div");
      header.className = "pane-header";
      header.draggable = false;

      const hLeft = document.createElement("div");
      hLeft.className = "pane-header-left";
      hLeft.innerHTML = `<span class="pane-header-icon">${def.icon}</span><span>${escHtml(p.title)}</span>`;

      const controls = document.createElement("div");
      controls.className = "pane-controls";

      header.appendChild(hLeft);
      header.appendChild(controls);

      /* ---- Content ---- */
      const content = document.createElement("div");
      content.className = "pane-content";

      let inner;
      if (p.type === "markdown") {
        inner = def.render(p, false);
      } else {
        inner = def.render(p);
      }
      content.appendChild(inner);

      /* ---- Type-specific buttons ---- */
      if (p.type === "excalidraw" && inner._excalidrawSave) {
        const saveBtn = document.createElement("button");
        saveBtn.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
        saveBtn.title = "Save drawing";
        saveBtn.tabIndex = 0;
        saveBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          inner._excalidrawSave();
        });
        controls.appendChild(saveBtn);
      }

      if (p.type === "custom-html" && inner._toggleMode) {
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = p.data.showingEditor ? "\u25B6" : "\u270E";
        toggleBtn.title = p.data.showingEditor ? "Preview" : "Edit code";
        toggleBtn.tabIndex = 0;
        toggleBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          inner._toggleMode();
          const isEditor = p.data.showingEditor;
          toggleBtn.textContent = isEditor ? "\u25B6" : "\u270E";
          toggleBtn.title = isEditor ? "Preview" : "Edit code";
        });
        controls.appendChild(toggleBtn);
      }

      /* ---- Z-order buttons ---- */
      const zUpBtn = document.createElement("button");
      zUpBtn.className = "z-order-btn";
      zUpBtn.innerHTML = "&#9650;";
      zUpBtn.title = "Bring forward";
      zUpBtn.tabIndex = 0;
      zUpBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        moveZIndex(p.id, 1);
      });
      controls.appendChild(zUpBtn);

      const zDownBtn = document.createElement("button");
      zDownBtn.className = "z-order-btn";
      zDownBtn.innerHTML = "&#9660;";
      zDownBtn.title = "Send backward";
      zDownBtn.tabIndex = 0;
      zDownBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        moveZIndex(p.id, -1);
      });
      controls.appendChild(zDownBtn);

      const rmBtn = document.createElement("button");
      rmBtn.innerHTML = "&#x2715;";
      rmBtn.title = "Remove pane";
      rmBtn.tabIndex = 0;
      rmBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removePane(p.id);
      });
      controls.appendChild(rmBtn);

      /* ---- Resize Handle ---- */
      const rsz = document.createElement("div");
      rsz.className = "resize-handle";

      paneEl.appendChild(header);
      paneEl.appendChild(content);
      paneEl.appendChild(rsz);

      /* ---- Events ---- */
      setupReposition(header, p.id);
      setupResize(rsz, p.id);

      gridEl.appendChild(paneEl);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Pane CRUD                                                          */
  /* ------------------------------------------------------------------ */

  function addPane(type, col, row) {
    const def = PANE_REGISTRY[type];
    if (!def) return;

    const w = def.defaultWidth || 4;
    const h = def.defaultHeight || 2;

    if (col != null && row != null) {
      const blocked = panes.some((p) => p.col === col && p.row === row && p.width === w && p.height === h);
      if (blocked) {
        const free = findFreePosition(w, h);
        col = free.col;
        row = free.row;
      }
    } else {
      const free = findFreePosition(w, h);
      col = free.col;
      row = free.row;
    }

    col = Math.max(1, Math.min(GRID_COLS - w + 1, col));
    row = Math.max(1, row);

    const maxZ = panes.reduce((m, p) => Math.max(m, p.zIndex || 0), -1);

    const pane = {
      id: crypto.randomUUID(),
      type,
      title: def.label,
      col,
      row,
      width: w,
      height: h,
      zIndex: maxZ + 1,
      data: { ...(def.defaultData || {}) },
    };

    panes.push(pane);
    renderGrid();
    saveLayout();
  }

  function removePane(id) {
    panes = panes.filter((p) => p.id !== id);
    renderGrid();
    saveLayout();
  }

  function updatePanePosition(id, col, row) {
    const p = panes.find((x) => x.id === id);
    if (!p) return;
    const blocked = panes.some(
      (x) => x.id !== id && x.col === col && x.row === row && x.width === p.width && x.height === p.height
    );
    if (blocked) {
      const free = findFreePosition(p.width, p.height, id);
      col = free.col;
      row = free.row;
    }
    p.col = Math.max(1, Math.min(GRID_COLS - p.width + 1, col));
    p.row = Math.max(1, row);
    renderGrid();
    saveLayout();
  }

  function moveZIndex(id, dir) {
    const p = panes.find((x) => x.id === id);
    if (!p) return;
    const target = panes.find((x) => x.zIndex === p.zIndex + dir);
    if (!target) return;
    const tmp = p.zIndex;
    p.zIndex = target.zIndex;
    target.zIndex = tmp;
    renderGrid();
    saveLayout();
  }

  function findFreePosition(w, h, excludeId) {
    const maxRow = Math.max(...panes.filter((p) => p.id !== excludeId).map((p) => p.row + p.height - 1), 0) + 20;
    for (let r = 1; r <= maxRow; r++) {
      for (let c = 1; c <= GRID_COLS - w + 1; c++) {
        if (!hasOverlap(c, r, w, h, excludeId)) return { col: c, row: r };
      }
    }
    return { col: 1, row: maxRow };
  }

  function hasOverlap(col, row, w, h, excludeId) {
    return panes.some(
      (p) =>
        p.id !== excludeId &&
        col < p.col + p.width &&
        col + w > p.col &&
        row < p.row + p.height &&
        row + h > p.row
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Grid Cell Calculation                                              */
  /* ------------------------------------------------------------------ */

  function getCellFromPoint(clientX, clientY, w, h) {
    const rect = gridEl.getBoundingClientRect();
    const padX = settings.gridPaddingX;
    const padY = settings.gridPaddingY;
    const cellW = (rect.width - 2 * padX) / GRID_COLS;
    const stepX = cellW;
    const stepY = ROW_HEIGHT;

    const relX = clientX - rect.left - padX;
    const relY = clientY - rect.top - padY;

    w = w || 1;
    h = h || 1;

    let col = Math.floor(relX / stepX) + 1;
    let row = Math.floor(relY / stepY) + 1;

    col = Math.max(1, Math.min(GRID_COLS - w + 1, col));
    row = Math.max(1, row);

    return { col, row };
  }

  function getCellRect(col, row, w, h) {
    const rect = gridEl.getBoundingClientRect();
    const padX = settings.gridPaddingX;
    const padY = settings.gridPaddingY;
    const gap = settings.paneGap;
    const cellW = (rect.width - 2 * padX) / GRID_COLS;
    const stepX = cellW;
    const stepY = ROW_HEIGHT;

    return {
      left: rect.left + padX + (col - 1) * stepX + gap,
      top: rect.top + padY + (row - 1) * stepY + gap,
      width: w * cellW - 2 * gap,
      height: h * ROW_HEIGHT - 2 * gap,
    };
  }

  function showDropIndicator(col, row, w, h) {
    const r = getCellRect(col, row, w, h);
    dropIndicator.style.left = r.left + "px";
    dropIndicator.style.top = r.top + "px";
    dropIndicator.style.width = r.width + "px";
    dropIndicator.style.height = r.height + "px";
    dropIndicator.classList.remove("hidden");
  }

  function hideDropIndicator() {
    dropIndicator.classList.add("hidden");
  }

  /* ------------------------------------------------------------------ */
  /*  Reposition (drag header)                                           */
  /* ------------------------------------------------------------------ */

  function cleanupStuckState() {
    if (dragState) {
      const el = document.querySelector(`.pane[data-pane-id="${dragState.paneId}"]`);
      if (el) el.classList.remove("dragging");
      hideDropIndicator();
      gridEl.classList.remove("dragging-active");
      dragState = null;
    }
    if (resizeState) {
      document.querySelectorAll(".resize-handle.resizing").forEach((h) => h.classList.remove("resizing"));
      gridEl.classList.remove("dragging-active");
      resizeState = null;
    }
  }

  function getCellAtPoint(clientX, clientY) {
    const rect = gridEl.getBoundingClientRect();
    const cellW = (rect.width - 2 * settings.gridPaddingX) / GRID_COLS;
    const relX = clientX - rect.left - settings.gridPaddingX;
    const relY = clientY - rect.top - settings.gridPaddingY;
    return {
      col: Math.floor(relX / cellW) + 1,
      row: Math.floor(relY / ROW_HEIGHT) + 1,
    };
  }

  function setupReposition(header, paneId) {
    const DRAG_THRESHOLD = 4;

    const onDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest(".pane-controls")) return;
      cleanupStuckState();
      e.preventDefault();

      const p = panes.find((x) => x.id === paneId);
      if (!p) return;

      const { col: downCol, row: downRow } = getCellAtPoint(e.clientX, e.clientY);

      dragState = {
        paneId,
        startCol: p.col,
        startRow: p.row,
        downCol,
        downRow,
        startX: e.clientX,
        startY: e.clientY,
        width: p.width,
        height: p.height,
        pointerId: e.pointerId,
      };

      header.setPointerCapture(e.pointerId);
      header.classList.add("dragging");
      gridEl.classList.add("dragging-active");
    };

    const onMove = (e) => {
      if (!dragState || dragState.paneId !== paneId) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;

      const cellW = (gridEl.getBoundingClientRect().width - 2 * settings.gridPaddingX) / GRID_COLS;
      const colDelta = Math.round((e.clientX - dragState.startX) / cellW);
      const rowDelta = Math.round((e.clientY - dragState.startY) / ROW_HEIGHT);

      let col = Math.max(1, Math.min(GRID_COLS - dragState.width + 1, dragState.startCol + colDelta));
      let row = Math.max(1, dragState.startRow + rowDelta);

      showDropIndicator(col, row, dragState.width, dragState.height);
    };

    const onUp = (e) => {
      if (!dragState || dragState.paneId !== paneId) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      hideDropIndicator();
      header.classList.remove("dragging");
      gridEl.classList.remove("dragging-active");

      if (Math.abs(dx) >= DRAG_THRESHOLD || Math.abs(dy) >= DRAG_THRESHOLD) {
        const cellW = (gridEl.getBoundingClientRect().width - 2 * settings.gridPaddingX) / GRID_COLS;
        const colDelta = Math.round(dx / cellW);
        const rowDelta = Math.round(dy / ROW_HEIGHT);

        let col = Math.max(1, Math.min(GRID_COLS - dragState.width + 1, dragState.startCol + colDelta));
        let row = Math.max(1, dragState.startRow + rowDelta);

        if (col !== dragState.startCol || row !== dragState.startRow) {
          updatePanePosition(paneId, col, row);
        }
      }
      dragState = null;
    };

    header.addEventListener("pointerdown", onDown);
    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerup", onUp);
    header.addEventListener("pointercancel", onUp);
  }

  /* ------------------------------------------------------------------ */
  /*  Resize                                                             */
  /* ------------------------------------------------------------------ */

  function updatePaneSize(paneId, width, height) {
    const p = panes.find((x) => x.id === paneId);
    if (!p) return;
    p.width = Math.max(2, Math.min(GRID_COLS - p.col + 1, width));
    p.height = Math.max(1, height);
    renderGrid();
    saveLayout();
  }

  function setupResize(handle, paneId) {
    const onDown = (e) => {
      if (e.button !== 0) return;
      cleanupStuckState();
      e.preventDefault();
      e.stopPropagation();

      const p = panes.find((x) => x.id === paneId);
      if (!p) return;

      resizeState = {
        paneId,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: p.width,
        startHeight: p.height,
        startCol: p.col,
        startRow: p.row,
        lastW: p.width,
        lastH: p.height,
        curW: p.width,
        curH: p.height,
      };

      handle.setPointerCapture(e.pointerId);
      handle.classList.add("resizing");
      gridEl.classList.add("dragging-active");
    };

    const onMove = (e) => {
      if (!resizeState || resizeState.paneId !== paneId) return;
      const rect = gridEl.getBoundingClientRect();
      const cellW = (rect.width - 2 * settings.gridPaddingX) / GRID_COLS;
      const stepX = cellW;
      const stepY = ROW_HEIGHT;

      const dx = Math.round((e.clientX - resizeState.startX) / stepX);
      const dy = Math.round((e.clientY - resizeState.startY) / stepY);

      const nw = Math.max(2, Math.min(GRID_COLS - resizeState.startCol + 1, resizeState.startWidth + dx));
      const nh = Math.max(1, resizeState.startHeight + dy);

      if (nw === resizeState.lastW && nh === resizeState.lastH) return;
      resizeState.lastW = nw;
      resizeState.lastH = nh;
      resizeState.curW = nw;
      resizeState.curH = nh;

      const el = document.querySelector(`.pane[data-pane-id="${CSS.escape(paneId)}"]`);
      if (el) {
        el.style.gridColumn = `${resizeState.startCol} / span ${nw}`;
        el.style.gridRow = `${resizeState.startRow} / span ${nh}`;
      }
    };

    const onUp = (_e) => {
      if (!resizeState || resizeState.paneId !== paneId) return;
      handle.classList.remove("resizing");
      gridEl.classList.remove("dragging-active");

      if (resizeState.curW !== resizeState.startWidth || resizeState.curH !== resizeState.startHeight) {
        updatePaneSize(resizeState.paneId, resizeState.curW, resizeState.curH);
      }
      resizeState = null;
    };

    handle.addEventListener("pointerdown", onDown);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
    handle.addEventListener("pointercancel", onUp);
  }

  /* ------------------------------------------------------------------ */
  /*  Config Toggle                                                      */
  /* ------------------------------------------------------------------ */

  function setupConfigToggle() {
    configToggle.addEventListener("click", () => {
      configOpen = !configOpen;
      configOverlay.classList.toggle("open", configOpen);
      configToggle.classList.toggle("open", configOpen);
      document.body.style.overflow = configOpen ? "hidden" : "";
    });

    // Click backdrop to close
    configOverlay.addEventListener("click", (e) => {
      if (e.target === configOverlay) closeConfig();
    });

    // Close button
    document.getElementById("config-close").addEventListener("click", closeConfig);
  }

  function closeConfig() {
    configOpen = false;
    configOverlay.classList.remove("open");
    configToggle.classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ------------------------------------------------------------------ */
  /*  Config Menu — Drag & Click to Add                                  */
  /* ------------------------------------------------------------------ */

  function setupConfigMenu() {
    const items = configMenu.querySelectorAll(".pane-list-item");
    let didDrag = false;

    items.forEach((item) => {
      const type = item.dataset.paneType;

      /* Drag to add at precise position */
      item.addEventListener("dragstart", (e) => {
        didDrag = true;
        configOverlay.classList.add("drag-hide");
        e.dataTransfer.setData("text/plain", type);
        e.dataTransfer.effectAllowed = "copy";

        const ghost = item.cloneNode(true);
        ghost.style.cssText =
          "width:180px;padding:12px;background:var(--bg-card);border:2px solid var(--accent);border-radius:8px;position:absolute;top:-1000px;left:-1000px;";
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 90, 25);
        requestAnimationFrame(() => document.body.removeChild(ghost));
      });

      item.addEventListener("dragend", () => {
        didDrag = false;
        configOverlay.classList.remove("drag-hide");
        hideDropIndicator();
        gridEl.classList.remove("drop-target");
      });

      /* Click to add at free position – only fires if no drag happened */
      item.addEventListener("click", () => {
        if (didDrag) {
          didDrag = false;
          return;
        }
        addPane(type);
        closeConfig();
      });
    });

    /* Grid drop zone */
    gridEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";

      let hasPlainText = false;
      try {
        hasPlainText = Array.from(e.dataTransfer.types).indexOf("text/plain") !== -1;
      } catch (_) {}
      const type = hasPlainText ? "markdown" : null;
      const def = PANE_REGISTRY[type] || PANE_REGISTRY.markdown;
      const w = def.defaultWidth || 4;
      const h = def.defaultHeight || 2;
      const { col, row } = getCellFromPoint(e.clientX, e.clientY, w, h);
      showDropIndicator(col, row, w, h);
      gridEl.classList.add("drop-target");
      gridEl.style.setProperty("--drop-x", e.clientX + "px");
      gridEl.style.setProperty("--drop-y", e.clientY + "px");
    });

    gridEl.addEventListener("dragleave", (e) => {
      if (!e.relatedTarget || !gridEl.contains(e.relatedTarget)) {
        hideDropIndicator();
        gridEl.classList.remove("drop-target");
      }
    });

    gridEl.addEventListener("drop", (e) => {
      e.preventDefault();
      hideDropIndicator();
      gridEl.classList.remove("drop-target");

      const type = e.dataTransfer.getData("text/plain");
      if (!type || !PANE_REGISTRY[type]) return;

      const def = PANE_REGISTRY[type];
      const w = def.defaultWidth || 4;
      const h = def.defaultHeight || 2;
      const { col, row } = getCellFromPoint(e.clientX, e.clientY, w, h);
      addPane(type, col, row);
      closeConfig();
    });

    /* Global DnD cleanup — ensures indicator vanishes even if drag ends unexpectedly */
    document.addEventListener("dragend", () => {
      hideDropIndicator();
      gridEl.classList.remove("drop-target");
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Keyboard shortcuts                                                 */
  /* ------------------------------------------------------------------ */

  function setupKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (configOpen) closeConfig();
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Import / Export                                                    */
  /* ------------------------------------------------------------------ */

  function setupImportExport() {
    document.getElementById("export-layout").addEventListener("click", () => {
      Tabily.Storage.exportLayout();
    });

    document.getElementById("import-layout").addEventListener("click", () => {
      importInput.click();
    });

    importInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = Tabily.Storage.importLayout(text);
        panes = imported.panes.map(normalizePane);
        if (imported.settings) {
          settings = imported.settings;
          applySettings();
          saveSettings();
        }
        renderGrid();
        saveLayout();
        closeConfig();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
      importInput.value = "";
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  function escHtml(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /* ------------------------------------------------------------------ */
  /*  Boot                                                               */
  /* ------------------------------------------------------------------ */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
