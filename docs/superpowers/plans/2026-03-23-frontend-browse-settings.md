# Frontend Browse & Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 實作進階瀏覽功能（虛擬滾動、批次選取、排序優化）與設定面板完整功能。

**Architecture:** 在 Frontend Foundation 基礎上擴展。Virtual scrolling 使用 Intersection Observer 實現。批次作業透過 SelectionManager 管理。

**Tech Stack:** Pure HTML/CSS/JS (extends Frontend Foundation)

---

## File Structure

```
frontend/
├── js/
│   ├── selection.js          # Batch selection manager
│   ├── virtual-scroll.js     # Virtual scrolling for large lists
│   ├── components/
│   │   ├── BatchActions.js   # Batch action bar
│   │   ├── DownloadModal.js  # Download dialog
│   │   ├── ScanModal.js      # Scan directory dialog
│   │   └── TagManager.js     # Tag management modal
│   └── main.js              # Updated with new features
└── css/
    └── components.css       # Updated with new styles
```

---

### Task 1: 批次選取管理 (Selection Manager)

**Files:**
- Create: `frontend/js/selection.js`

- [ ] **Step 1: Write js/selection.js**

```javascript
/** Batch selection manager for model cards. */
export class SelectionManager {
  constructor() {
    this.selected = new Set();
    this.onChange = null;
  }

  select(modelId) {
    this.selected.add(modelId);
    this.notify();
  }

  deselect(modelId) {
    this.selected.delete(modelId);
    this.notify();
  }

  toggle(modelId) {
    if (this.selected.has(modelId)) {
      this.deselect(modelId);
    } else {
      this.select(modelId);
    }
  }

  selectAll(modelIds) {
    modelIds.forEach((id) => this.selected.add(id));
    this.notify();
  }

  clear() {
    this.selected.clear();
    this.notify();
  }

  isSelected(modelId) {
    return this.selected.has(modelId);
  }

  getSelected() {
    return Array.from(this.selected);
  }

  get count() {
    return this.selected.size;
  }

  notify() {
    if (this.onChange) {
      this.onChange(this.getSelected());
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/selection.js
git commit -m "feat(frontend): add selection manager for batch operations"
```

---

### Task 2: 批次操作列 (Batch Actions Bar)

**Files:**
- Create: `frontend/js/components/BatchActions.js`

- [ ] **Step 1: Write js/components/BatchActions.js**

```javascript
/** Batch action bar component. */
import { tagsAPI } from "../api.js";

export class BatchActions {
  constructor(selectionManager, { onTagAssign }) {
    this.selectionManager = selectionManager;
    this.onTagAssign = onTagAssign;
    this.element = this.render();
    this.selectionManager.onChange = () => this.updateVisibility();
  }

  render() {
    const bar = document.createElement("div");
    bar.className = "batch-actions hidden";
    bar.innerHTML = `
      <div class="batch-info">
        <span class="batch-count">0</span> 個模型已選取
      </div>
      <div class="batch-buttons">
        <button class="btn btn-secondary" id="batch-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          設定標籤
        </button>
        <button class="btn btn-secondary" id="batch-clear">取消選取</button>
      </div>
    `;

    bar.querySelector("#batch-tag").addEventListener("click", async () => {
      await this.showTagDialog();
    });

    bar.querySelector("#batch-clear").addEventListener("click", () => {
      this.selectionManager.clear();
    });

    return bar;
  }

  updateVisibility() {
    const count = this.selectionManager.count;
    this.element.classList.toggle("hidden", count === 0);
    this.element.querySelector(".batch-count").textContent = count;
  }

  async showTagDialog() {
    const tags = await tagsAPI.list();
    const selected = this.selectionManager.getSelected();

    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">設定標籤 (${selected.length} 個模型)</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div id="tag-options" class="tag-options" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
          <div class="form-group" style="margin-top: 12px;">
            <input type="text" class="form-input" id="new-tag-input" placeholder="新增標籤...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="apply-tags">套用</button>
        </div>
      </div>
    `;

    document.getElementById("modal-container").appendChild(modal);

    const container = modal.querySelector("#tag-options");
    container.innerHTML = tags
      .map((t) => `<button class="btn btn-secondary tag-option" data-tag-id="${t.id}">${t.name}</button>`)
      .join("");

    container.querySelectorAll(".tag-option").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("active"));
    });

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#apply-tags").addEventListener("click", async () => {
      const selectedTags = Array.from(container.querySelectorAll(".tag-option.active"))
        .map((b) => parseInt(b.dataset.tagId));

      const newTagInput = modal.querySelector("#new-tag-input").value.trim();
      let newTagId = null;
      if (newTagInput) {
        const newTag = await tagsAPI.create(newTagInput);
        newTagId = newTag.id;
        selectedTags.push(newTagId);
      }

      for (const modelId of selected) {
        await tagsAPI.updateModelTags(modelId, selectedTags);
      }

      this.selectionManager.clear();
      modal.remove();
      if (this.onTagAssign) this.onTagAssign();
    });
  }
}
```

- [ ] **Step 2: Update CSS**

Add to `css/components.css`:

```css
.batch-actions {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-lg);
  z-index: 500;
  transition: opacity 0.2s, transform 0.2s;
}

.batch-actions.hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

.batch-info {
  font-size: 14px;
  color: var(--text-primary);
}

.batch-count {
  font-weight: 600;
  color: var(--accent-primary);
}

.batch-buttons {
  display: flex;
  gap: 8px;
}

.tag-options .active {
  background: var(--accent-primary);
  color: white;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/js/selection.js frontend/js/components/BatchActions.js
git commit -m "feat(frontend): add batch selection and actions"
```

---

### Task 3: 下載對話框 (Download Modal)

**Files:**
- Create: `frontend/js/components/DownloadModal.js`

- [ ] **Step 1: Write js/components/DownloadModal.js**

```javascript
/** Download dialog for Civitai models. */
import { civitaiAPI } from "../api.js";
import { showToast } from "./common.js";

export class DownloadModal {
  constructor({ onDownloadComplete }) {
    this.onDownloadComplete = onDownloadComplete;
    this.searchResults = [];
    this.selectedVersion = null;
    this.element = this.render();
  }

  async search(query) {
    try {
      const result = await civitaiAPI.search({ query, pageSize: 20 });
      this.searchResults = result.items || [];
      this.renderSearchResults();
    } catch (e) {
      showToast(`搜尋失敗: ${e.message}`, "error");
    }
  }

  renderSearchResults() {
    const container = this.element.querySelector("#search-results");
    if (!container) return;

    if (this.searchResults.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">無結果</p>';
      return;
    }

    container.innerHTML = this.searchResults.map((m) => `
      <div class="search-result-item" data-model-id="${m.id}">
        <img src="${m.thumbnailUrl || ""}" alt="${m.name}" class="search-result-thumb">
        <div class="search-result-info">
          <div class="search-result-name">${m.name}</div>
          <div class="search-result-meta">${m.type} · ${m.downloadCount ? m.downloadCount.toLocaleString() + " 下載" : ""}</div>
        </div>
      </div>
    `).join("");

    container.querySelectorAll(".search-result-item").forEach((item) => {
      item.addEventListener("click", async () => {
        container.querySelectorAll(".search-result-item").forEach((i) => i.classList.remove("selected"));
        item.classList.add("selected");
        await this.selectModel(parseInt(item.dataset.modelId));
      });
    });
  }

  async selectModel(modelId) {
    try {
      const info = await civitaiAPI.getModel(modelId);
      this.selectedModel = info;
      this.selectedVersion = info.versions?.[0];
      this.renderVersionSelect();
    } catch (e) {
      showToast(`載入模型詳情失敗: ${e.message}`, "error");
    }
  }

  renderVersionSelect() {
    const versionSelect = this.element.querySelector("#version-select");
    const info = this.selectedModel;
    if (!info || !versionSelect) return;

    if (info.versions && info.versions.length > 1) {
      versionSelect.innerHTML = info.versions.map((v, i) =>
        `<option value="${v.id}">${v.name || `Version ${i + 1}`}</option>`
      ).join("");
      versionSelect.parentElement.style.display = "";
    } else {
      versionSelect.parentElement.style.display = "none";
    }

    // Update preview
    const preview = this.element.querySelector("#download-preview");
    if (preview && info.images?.[0]) {
      preview.innerHTML = `<img src="${info.images[0].url}" alt="preview" style="max-width: 200px; border-radius: var(--radius-md);">`;
    }
  }

  async startDownload() {
    const destPath = this.element.querySelector("#dest-path").value.trim();
    const destFilename = this.element.querySelector("#dest-filename").value.trim();
    const downloadPreview = this.element.querySelector("#download-preview-check").checked;
    const resizePreview = this.element.querySelector("#resize-preview-check").checked;

    if (!destPath) {
      showToast("請輸入存放路徑", "warning");
      return;
    }

    const btn = this.element.querySelector("#start-download");
    btn.disabled = true;
    btn.textContent = "下載中...";

    try {
      const result = await civitaiAPI.download({
        model_id: this.selectedModel.id,
        version_id: this.selectedVersion?.id,
        dest_path: destPath,
        dest_filename: destFilename || undefined,
        download_preview: downloadPreview,
        resize_preview: resizePreview,
      });

      showToast("下載完成", "success");
      if (this.onDownloadComplete) this.onDownloadComplete(result);
      this.element.remove();
    } catch (e) {
      showToast(`下載失敗: ${e.message}`, "error");
      btn.disabled = false;
      btn.textContent = "開始下載";
    }
  }

  render() {
    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal" style="max-width: 640px;">
        <div class="modal-header">
          <h2 class="modal-title">下載模型</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">搜尋模型</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" class="form-input" id="search-input" placeholder="輸入名稱或 Civitai URL...">
              <button class="btn btn-primary" id="search-btn">搜尋</button>
            </div>
          </div>

          <div id="search-results" class="search-results" style="max-height: 200px; overflow-y: auto; margin-bottom: 16px;">
            <p style="color: var(--text-muted); text-align: center;">搜尋後顯示結果</p>
          </div>

          <div id="download-preview" style="margin-bottom: 16px; text-align: center;"></div>

          <div class="form-group" style="display: none;">
            <label class="form-label">版本</label>
            <select class="form-input select-input" id="version-select"></select>
          </div>

          <div class="form-group">
            <label class="form-label">存放路徑 *</label>
            <input type="text" class="form-input" id="dest-path" placeholder="例如：C:/models/ckpt">
          </div>

          <div class="form-group">
            <label class="form-label">檔案名稱（選填）</label>
            <input type="text" class="form-input" id="dest-filename" placeholder="留空則使用預設名稱">
          </div>

          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);">
              <input type="checkbox" id="download-preview-check" checked> 下載預覽圖
            </label>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary);">
              <input type="checkbox" id="resize-preview-check" checked> 縮圖（512x512）
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">取消</button>
          <button class="btn btn-primary" id="start-download" disabled>開始下載</button>
        </div>
      </div>
    `;

    const searchInput = modal.querySelector("#search-input");
    const searchBtn = modal.querySelector("#search-btn");
    let searchTimeout;

    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const val = searchInput.value.trim();
        if (val) this.search(val);
      }, 500);
    });

    searchBtn.addEventListener("click", () => {
      const val = searchInput.value.trim();
      if (val) this.search(val);
    });

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".modal-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#start-download").addEventListener("click", () => this.startDownload());

    return modal;
  }
}
```

- [ ] **Step 2: Update main.js to use DownloadModal**

Add to the imports in `js/main.js`:

```javascript
import { DownloadModal } from "./components/DownloadModal.js";
```

Add this function to `main.js`:

```javascript
function openDownloadModal() {
  const container = document.getElementById("modal-container");
  const modal = new DownloadModal({
    onDownloadComplete: () => {
      loadModels();
    },
  });
  container.innerHTML = "";
  container.appendChild(modal.element);
  container.classList.remove("hidden");
}
```

Add this event listener in the `init()` function:

```javascript
// Download button
document.getElementById("btn-download").addEventListener("click", openDownloadModal);
```

- [ ] **Step 3: Commit**

```bash
git add frontend/js/components/DownloadModal.js
git commit -m "feat(frontend): add download modal with Civitai search"
```

---

### Task 4: 虛擬滾動 (Virtual Scrolling)

**Files:**
- Create: `frontend/js/virtual-scroll.js`

- [ ] **Step 1: Write js/virtual-scroll.js**

```javascript
/** Virtual scrolling for large model lists. */
export class VirtualScroll {
  constructor(container, { itemHeight, gap, renderItem }) {
    this.container = container;
    this.itemHeight = itemHeight;
    this.gap = gap;
    this.renderItem = renderItem;
    this.items = [];
    this.columns = 1;
    this.scrollTop = 0;

    this.container.style.overflow = "auto";
    this.content = document.createElement("div");
    this.content.style.display = "grid";
    this.content.style.gap = `${gap}px`;
    this.container.appendChild(this.content);

    this.container.addEventListener("scroll", () => {
      this.scrollTop = this.container.scrollTop;
      this.render();
    });
  }

  setItems(items) {
    this.items = items;
    this.updateColumns();
    this.content.style.gridTemplateColumns = `repeat(${this.columns}, 1fr)`;
    this.content.style.height = `${this.getTotalHeight()}px`;
    this.render();
  }

  updateColumns() {
    const containerWidth = this.container.clientWidth;
    const itemWidth = 240; // minmax in CSS
    this.columns = Math.max(1, Math.floor(containerWidth / (itemWidth + this.gap)));
  }

  getTotalHeight() {
    const rows = Math.ceil(this.items.length / this.columns);
    return rows * (this.itemHeight + this.gap);
  }

  render() {
    const containerHeight = this.container.clientHeight;
    const startRow = Math.floor(this.scrollTop / (this.itemHeight + this.gap));
    const visibleRows = Math.ceil(containerHeight / (this.itemHeight + this.gap)) + 2;
    const startIndex = startRow * this.columns;
    const endIndex = Math.min(startIndex + visibleRows * this.columns, this.items.length);

    // Remove off-screen items
    const existingItems = this.content.querySelectorAll(".virtual-item");
    existingItems.forEach((el) => {
      const index = parseInt(el.dataset.index);
      if (index < startIndex || index >= endIndex) el.remove();
    });

    // Add visible items
    for (let i = startIndex; i < endIndex; i++) {
      const existing = this.content.querySelector(`[data-index="${i}"]`);
      if (!existing) {
        const row = Math.floor(i / this.columns);
        const col = i % this.columns;
        const wrapper = document.createElement("div");
        wrapper.className = "virtual-item";
        wrapper.dataset.index = i;
        wrapper.style.gridRow = `${row + 1}`;
        wrapper.style.gridColumn = `${col + 1}`;
        wrapper.style.height = `${this.itemHeight}px`;
        wrapper.appendChild(this.renderItem(this.items[i]));
        this.content.appendChild(wrapper);
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/virtual-scroll.js
git commit -m "feat(frontend): add virtual scrolling for large lists"
```

---

### Task 5: 完整設定面板

**Files:**
- Modify: `frontend/js/settings.js`

- [ ] **Step 1: Replace settings.js with full implementation**

```javascript
/** Settings management - full version. */
import { showToast } from "./components/common.js";
import { settingsAPI } from "./api.js";

const SETTINGS_KEYS = {
  theme: "theme",
  auto_preview: "auto_preview",
  resize_preview: "resize_preview",
  model_root_path: "model_root_path",
  nsfw_blur: "nsfw_blur",
  default_paths: "default_paths",  // JSON: { checkpoint: "/path", lora: "/path", ... }
};

const DEFAULT_PATHS = {
  checkpoint: "",
  vae: "",
  lora: "",
  hypernet: "",
  embedding: "",
  other: "",
};

export async function initSettings() {
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  // Apply saved theme on startup
  try {
    const theme = await settingsAPI.get("theme");
    if (theme?.value) {
      document.documentElement.dataset.theme = theme.value;
    } else {
      document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";
    }
  } catch {
    document.documentElement.dataset.theme = localStorage.getItem("theme") || "dark";
  }
}

async function loadAllSettings() {
  const settings = {};
  for (const [localKey, remoteKey] of Object.entries(SETTINGS_KEYS)) {
    try {
      const res = await settingsAPI.get(remoteKey);
      settings[localKey] = res.value;
    } catch {
      settings[localKey] = null;
    }
  }
  return settings;
}

async function openSettings() {
  const container = document.getElementById("modal-container");
  const currentSettings = await loadAllSettings();

  let defaultPaths = DEFAULT_PATHS;
  if (currentSettings.default_paths) {
    try { defaultPaths = { ...DEFAULT_PATHS, ...JSON.parse(currentSettings.default_paths) }; } catch {}
  }

  container.innerHTML = `
    <div class="modal" style="max-width: 520px;">
      <div class="modal-header">
        <h2 class="modal-title">設定</h2>
        <button class="modal-close btn-icon" id="settings-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <div class="settings-panel">
          <div class="settings-section">
            <h3 class="settings-section-title">外觀</h3>
            <div class="settings-row">
              <span class="settings-label">主題</span>
              <select class="select-input" id="setting-theme">
                <option value="dark">深色</option>
                <option value="light">淺色</option>
              </select>
            </div>
            <div class="settings-row">
              <span class="settings-label">NSFW 內容模糊</span>
              <input type="checkbox" id="setting-nsfw-blur">
            </div>
          </div>

          <div class="settings-section">
            <h3 class="settings-section-title">下載設定</h3>
            <div class="settings-row">
              <span class="settings-label">自動下載預覽圖</span>
              <input type="checkbox" id="setting-auto-preview">
            </div>
            <div class="settings-row">
              <span class="settings-label">預覽圖自動縮圖</span>
              <input type="checkbox" id="setting-resize-preview">
            </div>
          </div>

          <div class="settings-section">
            <h3 class="settings-section-title">目錄設定</h3>
            <div class="form-group">
              <label class="form-label">模型根目錄</label>
              <input type="text" class="form-input" id="setting-model-root" placeholder="例如：C:/models">
            </div>
            ${["checkpoint", "vae", "lora", "hypernet", "embedding"].map((type) => `
              <div class="form-group" style="margin-top: 8px;">
                <label class="form-label" style="font-size: 12px; color: var(--text-muted);">${type} 預設路徑</label>
                <input type="text" class="form-input" id="setting-path-${type}" placeholder="留空使用根目錄">
              </div>
            `).join("")}
          </div>

          <div class="settings-section">
            <h3 class="settings-section-title">資料庫</h3>
            <div class="settings-row">
              <span class="settings-label">資料庫位置</span>
              <span class="settings-label" style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">metadata.db（不可修改）</span>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary modal-cancel">取消</button>
        <button class="btn btn-primary" id="settings-save">儲存</button>
      </div>
    </div>
  `;
  container.classList.remove("hidden");

  // Populate current values
  document.getElementById("setting-theme").value = currentSettings.theme || "dark";
  document.getElementById("setting-nsfw-blur").checked = currentSettings.nsfw_blur === "true";
  document.getElementById("setting-auto-preview").checked = currentSettings.auto_preview === "true";
  document.getElementById("setting-resize-preview").checked = currentSettings.resize_preview !== "false"; // default true
  document.getElementById("setting-model-root").value = currentSettings.model_root_path || "";
  for (const [type, path] of Object.entries(defaultPaths)) {
    const el = document.getElementById(`setting-path-${type}`);
    if (el) el.value = path;
  }

  // Theme change (live preview)
  document.getElementById("setting-theme").addEventListener("change", (e) => {
    document.documentElement.dataset.theme = e.target.value;
  });

  // Close handlers
  container.querySelector("#settings-close").addEventListener("click", () => container.classList.add("hidden"));
  container.querySelector(".modal-cancel").addEventListener("click", () => container.classList.add("hidden"));
  container.addEventListener("click", (e) => { if (e.target === container) container.classList.add("hidden"); });

  // Save
  document.getElementById("settings-save").addEventListener("click", async () => {
    const theme = document.getElementById("setting-theme").value;
    const nsfwBlur = document.getElementById("setting-nsfw-blur").checked;
    const autoPreview = document.getElementById("setting-auto-preview").checked;
    const resizePreview = document.getElementById("setting-resize-preview").checked;
    const modelRoot = document.getElementById("setting-model-root").value.trim();
    const paths = {};
    for (const type of ["checkpoint", "vae", "lora", "hypernet", "embedding"]) {
      const val = document.getElementById(`setting-path-${type}`).value.trim();
      if (val) paths[type] = val;
    }

    try {
      await Promise.all([
        settingsAPI.set("theme", theme),
        settingsAPI.set("nsfw_blur", String(nsfwBlur)),
        settingsAPI.set("auto_preview", String(autoPreview)),
        settingsAPI.set("resize_preview", String(resizePreview)),
        settingsAPI.set("model_root_path", modelRoot),
        settingsAPI.set("default_paths", JSON.stringify(paths)),
      ]);
      localStorage.setItem("theme", theme);
      showToast("設定已儲存", "success");
      container.classList.add("hidden");
    } catch (e) {
      showToast(`儲存失敗: ${e.message}`, "error");
    }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/settings.js
git commit -m "feat(frontend): enhance settings panel with all options"
```

---

### Task 6: 驗證

- [ ] **Step 1: Manual test checklist**

- [ ] Grid view displays model cards correctly
- [ ] List view displays model cards correctly
- [ ] Search filters models by name
- [ ] Type filters work
- [ ] Sort by name/size/date works
- [ ] Model detail modal opens and displays info
- [ ] Settings panel theme toggle works
- [ ] Download modal searches Civitai
- [ ] Batch selection and tag assignment works

- [ ] **Step 2: Commit**

```bash
git commit -m "test(frontend): verify browse and settings functionality"
```
