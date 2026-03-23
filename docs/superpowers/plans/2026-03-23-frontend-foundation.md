# Frontend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立前端基礎結構，包含 HTML 骨架、純 CSS 樣式、模型卡片元件、API 服務層。

**Architecture:** 純 HTML/CSS/JS，無框架。使用 CSS Grid 做卡片佈局。Fetch API 呼叫後端 REST API。模組化 JS (ES6 import/export)。

**Tech Stack:** HTML5, CSS3 (vanilla, CSS Variables for theming), ES6+ JavaScript

---

## File Structure

```
frontend/
├── index.html               # 應用程式 entry point
├── css/
│   ├── reset.css            # CSS reset
│   ├── variables.css        # CSS custom properties (theme)
│   ├── base.css             # Base styles
│   ├── layout.css           # Grid and layout
│   └── components.css       # Component styles (cards, buttons, etc.)
├── js/
│   ├── api.js               # API service layer
│   ├── models.js            # Model management
│   ├── tags.js              # Tags management
│   ├── civitai.js           # Civitai integration
│   ├── settings.js          # Settings management
│   ├── router.js            # Simple hash-based router
│   ├── components/
│   │   ├── ModelCard.js     # Model card component
│   │   ├── ModelGrid.js     # Grid container component
│   │   ├── ModelDetail.js   # Model detail panel
│   │   └── common.js         # Shared UI utilities
│   └── main.js              # App initialization
└── assets/
    └── icons/               # SVG icons if needed
```

---

### Task 1: HTML 骨架

**Files:**
- Create: `frontend/index.html`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="zh-TW" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SD Local Model Manager</title>
  <link rel="stylesheet" href="/css/reset.css">
  <link rel="stylesheet" href="/css/variables.css">
  <link rel="stylesheet" href="/css/base.css">
  <link rel="stylesheet" href="/css/layout.css">
  <link rel="stylesheet" href="/css/components.css">
</head>
<body>
  <header class="app-header">
    <div class="header-left">
      <h1 class="app-title">SD Model Manager</h1>
    </div>
    <div class="header-center">
      <div class="search-bar">
        <input type="text" id="search-input" placeholder="搜尋模型..." autocomplete="off">
      </div>
    </div>
    <div class="header-right">
      <button class="btn btn-icon" id="btn-scan" title="掃描目錄">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </button>
      <button class="btn btn-icon" id="btn-download" title="下載模型">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
      <button class="btn btn-icon" id="btn-settings" title="設定">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>
    </div>
  </header>

  <main class="app-main">
    <aside class="sidebar">
      <div class="sidebar-section">
        <h3 class="sidebar-title">模型類型</h3>
        <ul class="filter-list" id="type-filters">
          <li><button class="filter-btn active" data-type="">全部</button></li>
          <li><button class="filter-btn" data-type="checkpoint">Checkpoint</button></li>
          <li><button class="filter-btn" data-type="vae">VAE</button></li>
          <li><button class="filter-btn" data-type="lora">LoRA</button></li>
          <li><button class="filter-btn" data-type="hypernet">Hypernet</button></li>
          <li><button class="filter-btn" data-type="embedding">Embedding</button></li>
          <li><button class="filter-btn" data-type="other">其他</button></li>
        </ul>
      </div>
      <div class="sidebar-section">
        <h3 class="sidebar-title">標籤</h3>
        <ul class="tag-list" id="tag-filters">
          <!-- Dynamically populated -->
        </ul>
      </div>
    </aside>

    <section class="content">
      <div class="content-header">
        <div class="sort-controls">
          <select id="sort-select" class="select-input">
            <option value="updated_at">最近更新</option>
            <option value="name">名稱</option>
            <option value="file_size">檔案大小</option>
          </select>
          <select id="sort-order" class="select-input">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </div>
        <div class="view-controls">
          <button class="btn btn-icon btn-view active" data-view="grid" title="網格視圖">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button class="btn btn-icon btn-view" data-view="list" title="列表視圖">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div id="model-grid" class="model-grid">
        <!-- Model cards rendered here -->
      </div>

      <div id="pagination" class="pagination">
        <!-- Pagination controls -->
      </div>
    </section>
  </main>

  <!-- Modal Container -->
  <div id="modal-container" class="modal-container hidden">
    <!-- Modals rendered here -->
  </div>

  <div id="toast-container" class="toast-container"></div>

  <script type="module" src="/js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat(frontend): add index.html skeleton"
```

---

### Task 2: CSS 樣式系統

**Files:**
- Create: `frontend/css/reset.css`
- Create: `frontend/css/variables.css`
- Create: `frontend/css/base.css`
- Create: `frontend/css/layout.css`
- Create: `frontend/css/components.css`

- [ ] **Step 1: Write css/reset.css**

```css
*, *::before, *::after {
  box-sizing: border-box;
}
* { margin: 0; padding: 0; }
html { height: 100%; }
body { height: 100%; line-height: 1.5; }
img, picture, video, canvas, svg { display: block; max-width: 100%; }
input, button, textarea, select { font: inherit; }
button { cursor: pointer; border: none; background: none; }
a { color: inherit; text-decoration: none; }
ul, ol { list-style: none; }
```

- [ ] **Step 2: Write css/variables.css (dark theme default)**

```css
:root {
  /* Colors - Dark Theme */
  --bg-primary: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #242424;
  --bg-card: #1e1e1e;
  --bg-hover: #2a2a2a;

  --text-primary: #e8e8e8;
  --text-secondary: #a0a0a0;
  --text-muted: #666666;

  --accent-primary: #7c3aed;
  --accent-primary-hover: #8b5cf6;
  --accent-secondary: #06b6d4;

  --border-color: #333333;
  --border-subtle: #2a2a2a;

  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.5);

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --font-sans: system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono: ui-monospace, "SF Mono", monospace;
}

[data-theme="light"] {
  --bg-primary: #f5f5f5;
  --bg-secondary: #ffffff;
  --bg-tertiary: #e5e5e5;
  --bg-card: #ffffff;
  --bg-hover: #f0f0f0;

  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --text-muted: #999999;

  --accent-primary: #6d28d9;
  --accent-primary-hover: #7c3aed;

  --border-color: #d4d4d4;
  --border-subtle: #e5e5e5;
}
```

- [ ] **Step 3: Write css/base.css**

```css
html, body {
  height: 100%;
  font-family: var(--font-sans);
  font-size: 14px;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

- [ ] **Step 4: Write css/layout.css**

```css
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 56px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; min-width: 180px; }
.header-center { flex: 1; max-width: 500px; }
.header-right { display: flex; align-items: center; gap: 8px; }

.app-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.search-bar input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.2s;
}

.search-bar input:focus {
  border-color: var(--accent-primary);
}

.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 220px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  padding: 16px;
  flex-shrink: 0;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.filter-list, .tag-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.filter-btn {
  width: 100%;
  text-align: left;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
}

.filter-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent-primary);
  color: white;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  gap: 12px;
}

.sort-controls, .view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  flex: 1;
}

.model-grid.list-view {
  grid-template-columns: 1fr;
}

.model-grid.list-view .model-card {
  flex-direction: row;
  height: 120px;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 16px 0;
  margin-top: auto;
}
```

- [ ] **Step 5: Write css/components.css**

```css
/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  transition: background 0.15s, opacity 0.15s;
}

.btn-primary {
  background: var(--accent-primary);
  color: white;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-icon {
  padding: 8px;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
}

.btn-icon:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-icon.active {
  color: var(--accent-primary);
}

/* Select */
.select-input {
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.select-input:focus {
  border-color: var(--accent-primary);
}

/* Model Card */
.model-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
  display: flex;
  flex-direction: column;
}

.model-card:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.model-card-image {
  position: relative;
  aspect-ratio: 4/3;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.model-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-card-image .placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
}

.model-card-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.model-card-badge.checkpoint { background: #7c3aed; }
.model-card-badge.vae { background: #06b6d4; }
.model-card-badge.lora { background: #22c55e; }
.model-card-badge.hypernet { background: #f59e0b; }
.model-card-badge.embedding { background: #ec4899; }

.model-card-body {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.model-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-card-meta {
  font-size: 12px;
  color: var(--text-muted);
  display: flex;
  gap: 8px;
}

.model-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: auto;
}

.tag-chip {
  padding: 2px 6px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--text-secondary);
}

/* Modal */
.modal-container {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-container.hidden {
  display: none;
}

.modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
}

.modal-close {
  padding: 4px;
  color: var(--text-muted);
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 16px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

/* Toast */
.toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 2000;
}

.toast {
  padding: 12px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: 13px;
  animation: slide-in 0.2s ease-out;
}

.toast.success { border-left: 3px solid var(--success); }
.toast.error { border-left: 3px solid var(--error); }
.toast.warning { border-left: 3px solid var(--warning); }

@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* Settings Panel */
.settings-panel {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.settings-label {
  font-size: 13px;
  color: var(--text-secondary);
}

/* Form controls */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent-primary);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/css/reset.css frontend/css/variables.css frontend/css/base.css frontend/css/layout.css frontend/css/components.css
git commit -m "feat(frontend): add CSS foundation with theme support"
```

---

### Task 3: JavaScript 服務層 (API)

**Files:**
- Create: `frontend/js/api.js`

- [ ] **Step 1: Write js/api.js**

```javascript
/** API service layer for backend communication. */
const API_BASE = "/api";

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new APIError(error.detail || "Request failed", response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Models API
export const modelsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/models${qs ? `?${qs}` : ""}`);
  },

  get: (id) => request(`/models/${encodeURIComponent(id)}`),

  scan: (directory, recursive = true) =>
    request("/models/scan", {
      method: "POST",
      body: JSON.stringify({ directory, recursive }),
    }),

  update: (id, data) =>
    request(`/models/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/models/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// Tags API
export const tagsAPI = {
  list: () => request("/tags"),

  create: (name) =>
    request("/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateModelTags: (modelId, tagIds) =>
    request("/tags/model", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId, tag_ids: tagIds }),
    }),
};

// Civitai API
export const civitaiAPI = {
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/civitai/models/search${qs ? `?${qs}` : ""}`);
  },

  getModel: (id) => request(`/civitai/models/${id}`),

  download: (data) =>
    request("/civitai/download", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  findByHash: (sha256) => request(`/civitai/models/by-hash/${sha256}`),

  computeHashAndLink: (modelId) =>
    request(`/civitai/models/${modelId}/hash-and-link`, { method: "POST" }),
};

// Settings API
export const settingsAPI = {
  get: (key) => request(`/settings/${key}`),

  set: (key, value) =>
    request(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  list: () => request("/settings"),
};

// Health check
export const healthAPI = {
  check: () => request("/health"),
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/api.js
git commit -m "feat(frontend): add API service layer"
```

---

### Task 4: ModelCard 元件

**Files:**
- Create: `frontend/js/components/ModelCard.js`

- [ ] **Step 1: Write js/components/ModelCard.js**

```javascript
/** Model card component. */
import { formatFileSize } from "./common.js";

export class ModelCard {
  constructor(model, onClick) {
    this.model = model;
    this.onClick = onClick;
    this.element = this.render();
  }

  formatSize(bytes) {
    return formatFileSize(bytes);
  }

  render() {
    const { id, name, file_path, file_size, model_type, preview_url, description, sha256 } = this.model;

    const card = document.createElement("article");
    card.className = "model-card";
    card.dataset.modelId = id;

    // Image section
    const imageDiv = document.createElement("div");
    imageDiv.className = "model-card-image";

    if (preview_url) {
      const img = document.createElement("img");
      img.src = preview_url;
      img.alt = name;
      img.loading = "lazy";
      img.onerror = () => {
        img.style.display = "none";
        imageDiv.innerHTML = `<div class="placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      };
      imageDiv.appendChild(img);
    } else {
      imageDiv.innerHTML = `
        <div class="placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      `;
    }

    // Badge
    const badge = document.createElement("span");
    badge.className = `model-card-badge ${model_type || "other"}`;
    badge.textContent = model_type || "other";
    imageDiv.appendChild(badge);

    card.appendChild(imageDiv);

    // Body
    const body = document.createElement("div");
    body.className = "model-card-body";
    body.innerHTML = `
      <h3 class="model-card-name" title="${name}">${name}</h3>
      <div class="model-card-meta">
        ${file_size ? `<span>${this.formatSize(file_size)}</span>` : ""}
        ${sha256 ? `<span title="${sha256}">${sha256.substring(0, 8)}...</span>` : ""}
      </div>
    `;
    card.appendChild(body);

    // Click handler
    card.addEventListener("click", () => this.onClick && this.onClick(this.model));

    return card;
  }
}
```

- [ ] **Step 2: Write js/components/common.js**

```javascript
/** Shared UI utilities. */

export function formatFileSize(bytes) {
  if (!bytes) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slide-in 0.2s ease-out reverse";
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

export function formatDate(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp * 1000).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/js/components/ModelCard.js frontend/js/components/common.js
git commit -m "feat(frontend): add ModelCard component and shared utilities"
```

---

### Task 5: ModelGrid 元件

**Files:**
- Create: `frontend/js/components/ModelGrid.js`

- [ ] **Step 1: Write js/components/ModelGrid.js**

```javascript
/** Model grid container with virtual scrolling support. */
import { ModelCard } from "./ModelCard.js";

export class ModelGrid {
  constructor(container, { onModelClick }) {
    this.container = container;
    this.onModelClick = onModelClick;
    this.models = [];
    this.viewMode = "grid"; // grid | list
  }

  setModels(models) {
    this.models = models;
    this.render();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.container.classList.toggle("list-view", mode === "list");
  }

  render() {
    this.container.innerHTML = "";

    if (this.models.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px;">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <p>尚無模型</p>
          <p style="font-size: 12px; margin-top: 4px;">點擊上方「掃描目錄」新增模型</p>
        </div>
      `;
      return;
    }

    this.models.forEach((model) => {
      const card = new ModelCard(model, this.onModelClick);
      this.container.appendChild(card.element);
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/components/ModelGrid.js
git commit -m "feat(frontend): add ModelGrid container component"
```

---

### Task 6: ModelDetail 面板

**Files:**
- Create: `frontend/js/components/ModelDetail.js`

- [ ] **Step 1: Write js/components/ModelDetail.js**

```javascript
/** Model detail panel/modal. */
import { formatFileSize, formatDate } from "./common.js";
import { tagsAPI } from "../api.js";

export class ModelDetail {
  constructor(model, { onClose, onUpdate, onDelete }) {
    this.model = model;
    this.onClose = onClose;
    this.onUpdate = onUpdate;
    this.onDelete = onDelete;
    this.tags = [];
    this.element = this.render();
  }

  async loadTags() {
    try {
      const allTags = await tagsAPI.list();
      this.tags = allTags;
      this.renderTags();
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  }

  renderTags() {
    const container = this.element.querySelector("#detail-tags");
    if (!container) return;
    container.innerHTML = this.tags.map((t) => {
      const isSelected = this.model.tag_ids?.includes(t.id);
      return `<span class="tag-chip ${isSelected ? "selected" : ""}" data-tag-id="${t.id}">${t.name}</span>`;
    }).join("");

    container.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.addEventListener("click", async () => {
        const tagId = parseInt(chip.dataset.tagId);
        const current = this.model.tag_ids || [];
        const newTags = current.includes(tagId)
          ? current.filter((t) => t !== tagId)
          : [...current, tagId];
        this.model.tag_ids = newTags;
        chip.classList.toggle("selected");
        try {
          await tagsAPI.updateModelTags(this.model.id, newTags);
        } catch (e) {
          console.error("Failed to update tags:", e);
        }
      });
    });
  }

  render() {
    const {
      name, file_path, file_size, model_type, sha256, md5,
      civitai_url, preview_url, description, nsfw, created_at, updated_at,
    } = this.model;

    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${name}</h2>
          <button class="modal-close btn-icon" id="detail-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${preview_url ? `
            <div style="margin-bottom: 16px; border-radius: var(--radius-md); overflow: hidden; ${nsfw ? 'filter: blur(20px);' : ''}">
              <img src="${preview_url}" alt="${name}" style="width: 100%;">
            </div>
          ` : ""}

          <div class="detail-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
            <div class="detail-item">
              <span class="detail-label">類型</span>
              <span class="detail-value">${model_type || "—"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">大小</span>
              <span class="detail-value">${formatFileSize(file_size)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">SHA256</span>
              <span class="detail-value" style="font-family: var(--font-mono); font-size: 12px;">${sha256 || "—"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">MD5</span>
              <span class="detail-value" style="font-family: var(--font-mono); font-size: 12px;">${md5 || "—"}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">建立時間</span>
              <span class="detail-value">${formatDate(created_at)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">更新時間</span>
              <span class="detail-value">${formatDate(updated_at)}</span>
            </div>
          </div>

          <div class="detail-item" style="margin-bottom: 12px;">
            <span class="detail-label">檔案路徑</span>
            <span class="detail-value" style="font-size: 12px; word-break: break-all;">${file_path}</span>
          </div>

          ${civitai_url ? `
            <div class="detail-item" style="margin-bottom: 12px;">
              <span class="detail-label">Civitai</span>
              <a href="${civitai_url}" target="_blank" class="detail-link">${civitai_url}</a>
            </div>
          ` : ""}

          <div style="margin-bottom: 12px;">
            <span class="detail-label" style="display: block; margin-bottom: 4px;">標籤</span>
            <div id="detail-tags" class="model-card-tags" style="gap: 6px;"></div>
          </div>

          ${description ? `
            <div class="detail-item">
              <span class="detail-label" style="display: block; margin-bottom: 4px;">描述</span>
              <div class="detail-description" style="font-size: 13px; color: var(--text-secondary); white-space: pre-wrap;">${description}</div>
            </div>
          ` : ""}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="detail-hash">比對 Civitai</button>
          <button class="btn btn-secondary" id="detail-delete" style="color: var(--error);">刪除</button>
          <button class="btn btn-primary" id="detail-save">儲存</button>
        </div>
      </div>
    `;

    // Event listeners
    modal.querySelector("#detail-close").addEventListener("click", this.onClose);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) this.onClose();
    });

    modal.querySelector("#detail-delete").addEventListener("click", async () => {
      if (confirm(`確定要移除「${name}」嗎？檔案不會被刪除。`)) {
        await this.onDelete(this.model.id);
      }
    });

    modal.querySelector("#detail-save").addEventListener("click", async () => {
      await this.onUpdate(this.model.id, {
        name: this.model.name,
        description: this.model.description,
      });
    });

    modal.querySelector("#detail-hash").addEventListener("click", async () => {
      const btn = modal.querySelector("#detail-hash");
      btn.textContent = "計算中...";
      btn.disabled = true;
      try {
        const result = await import("../api.js").then((m) => m.civitaiAPI.computeHashAndLink(this.model.id));
        if (result.civitai_linked) {
          this.model.civitai_url = result.civitai_info?.url;
          this.model.civitai_id = result.civitai_info?.id;
          this.render();
        }
      } finally {
        btn.textContent = "比對 Civitai";
        btn.disabled = false;
      }
    });

    this.loadTags();

    return modal;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/components/ModelDetail.js
git commit -m "feat(frontend): add ModelDetail panel component"
```

---

### Task 7: 主程式初始化

**Files:**
- Create: `frontend/js/main.js`

- [ ] **Step 1: Write js/main.js**

```javascript
/** Main application entry point. */
import { modelsAPI, tagsAPI } from "./api.js";
import { ModelGrid } from "./components/ModelGrid.js";
import { ModelDetail } from "./components/ModelDetail.js";
import { showToast, debounce } from "./components/common.js";
import { initRouter } from "./router.js";
import { initSettings } from "./settings.js";

let currentFilters = {
  page: 1,
  page_size: 20,
  model_type: "",
  tag: "",
  search: "",
  sort: "updated_at",
  order: "desc",
};

let modelGrid;

async function loadModels() {
  try {
    const params = { ...currentFilters };
    // Remove empty filters
    if (!params.tag) delete params.tag;
    if (!params.model_type) delete params.model_type;
    if (!params.search) delete params.search;
    const response = await modelsAPI.list(params);
    modelGrid.setModels(response.items);
    renderPagination(response.total, response.page, response.page_size);
  } catch (e) {
    showToast(`載入失敗: ${e.message}`, "error");
  }
}

function renderPagination(total, page, pageSize) {
  const container = document.getElementById("pagination");
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-secondary ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilters.page = parseInt(btn.dataset.page);
      loadModels();
    });
  });
}

function openModelDetail(model) {
  const container = document.getElementById("modal-container");
  const detail = new ModelDetail(model, {
    onClose: () => {
      container.innerHTML = "";
      container.classList.add("hidden");
    },
    onUpdate: async (id, data) => {
      try {
        await modelsAPI.update(id, data);
        showToast("已儲存", "success");
        loadModels();
      } catch (e) {
        showToast(`儲存失敗: ${e.message}`, "error");
      }
    },
    onDelete: async (id) => {
      try {
        await modelsAPI.delete(id);
        showToast("已移除", "success");
        container.innerHTML = "";
        container.classList.add("hidden");
        loadModels();
      } catch (e) {
        showToast(`刪除失敗: ${e.message}`, "error");
      }
    },
  });

  container.innerHTML = "";
  container.appendChild(detail.element);
  container.classList.remove("hidden");
}

async function initTags() {
  try {
    const tags = await tagsAPI.list();
    const container = document.getElementById("tag-filters");
    container.innerHTML = tags
      .map((t) => `<li><button class="filter-btn tag-filter" data-tag="${t.id}">${t.name}</button></li>`)
      .join("");

    // Tag filter click handlers
    container.querySelectorAll(".tag-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wasActive = btn.classList.contains("active");
        // Deselect all tag filters
        container.querySelectorAll(".tag-filter").forEach((b) => b.classList.remove("active"));
        if (wasActive) {
          // Toggle off if already selected
          currentFilters.tag = "";
        } else {
          btn.classList.add("active");
          currentFilters.tag = btn.dataset.tag;
        }
        currentFilters.page = 1;
        loadModels();
      });
    });
  } catch (e) {
    console.error("Failed to load tags:", e);
  }
}

async function init() {
  // Initialize components
  const gridContainer = document.getElementById("model-grid");
  modelGrid = new ModelGrid(gridContainer, {
    onModelClick: openModelDetail,
  });

  // Router
  initRouter();

  // Settings
  initSettings();

  // Load initial data
  await Promise.all([loadModels(), initTags()]);

  // Search
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      currentFilters.search = e.target.value;
      currentFilters.page = 1;
      loadModels();
    }, 300)
  );

  // Type filters
  document.getElementById("type-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#type-filters .filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilters.model_type = btn.dataset.type || "";
    currentFilters.page = 1;
    loadModels();
  });

  // Sort
  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentFilters.sort = e.target.value;
    loadModels();
  });

  document.getElementById("sort-order").addEventListener("change", (e) => {
    currentFilters.order = e.target.value;
    loadModels();
  });

  // View toggle
  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-view").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      modelGrid.setViewMode(btn.dataset.view);
    });
  });

  // Scan button
  document.getElementById("btn-scan").addEventListener("click", async () => {
    const directory = prompt("請輸入要掃描的目錄路徑：");
    if (!directory) return;
    const btn = document.getElementById("btn-scan");
    btn.disabled = true;
    try {
      const result = await modelsAPI.scan(directory);
      showToast(`已掃描 ${result.scanned} 個模型，新增 ${result.added} 個`, "success");
      loadModels();
    } catch (e) {
      showToast(`掃描失敗: ${e.message}`, "error");
    } finally {
      btn.disabled = false;
    }
  });
}

// Start app
document.addEventListener("DOMContentLoaded", init);
```

- [ ] **Step 2: Write js/router.js**

```javascript
/** Simple hash-based router. */
export function initRouter() {
  window.addEventListener("hashchange", () => {
    const hash = window.location.hash.slice(1) || "/";
    handleRoute(hash);
  });
  handleRoute(window.location.hash.slice(1) || "/");
}

function handleRoute(route) {
  // Route handling for future expansion (e.g., /model/:id, /settings)
  console.log("Route:", route);
}
```

- [ ] **Step 3: Write js/settings.js**

```javascript
/** Settings management. */
import { showToast } from "./components/common.js";
import { settingsAPI } from "./api.js";

const SETTINGS_KEYS = {
  theme: "theme",
  auto_preview: "auto_preview",
  resize_preview: "resize_preview",
  model_root_path: "model_root_path",
};

export async function initSettings() {
  document.getElementById("btn-settings").addEventListener("click", openSettings);
  // Load and apply theme on startup
  try {
    const theme = await settingsAPI.get("theme");
    if (theme?.value) {
      document.documentElement.dataset.theme = theme.value;
    }
  } catch {
    // Fall back to localStorage
    const theme = localStorage.getItem("theme") || "dark";
    document.documentElement.dataset.theme = theme;
  }
}

async function loadAllSettings() {
  const keys = Object.values(SETTINGS_KEYS);
  const settings = {};
  await Promise.all(
    keys.map(async (key) => {
      try {
        const res = await settingsAPI.get(key);
        settings[key] = res.value;
      } catch {
        settings[key] = null;
      }
    })
  );
  return settings;
}

async function openSettings() {
  const container = document.getElementById("modal-container");
  const currentSettings = await loadAllSettings();

  container.innerHTML = `
    <div class="modal">
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
            <h3 class="settings-section-title">模型目錄</h3>
            <div class="form-group">
              <label class="form-label">模型根目錄</label>
              <input type="text" class="form-input" id="setting-model-root-path" placeholder="例如：C:/models">
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary" id="settings-save">儲存</button>
      </div>
    </div>
  `;
  container.classList.remove("hidden");

  // Populate current values
  document.getElementById("setting-theme").value = currentSettings.theme || "dark";
  document.getElementById("setting-auto-preview").checked = currentSettings.auto_preview === "true";
  document.getElementById("setting-resize-preview").checked = currentSettings.resize_preview === "true";
  document.getElementById("setting-model-root-path").value = currentSettings.model_root_path || "";

  // Close handlers
  container.querySelector("#settings-close").addEventListener("click", () => {
    container.classList.add("hidden");
  });
  container.addEventListener("click", (e) => {
    if (e.target === container) container.classList.add("hidden");
  });

  // Theme change (live preview)
  document.getElementById("setting-theme").addEventListener("change", (e) => {
    document.documentElement.dataset.theme = e.target.value;
  });

  // Save all settings
  document.getElementById("settings-save").addEventListener("click", async () => {
    const theme = document.getElementById("setting-theme").value;
    const autoPreview = document.getElementById("setting-auto-preview").checked;
    const resizePreview = document.getElementById("setting-resize-preview").checked;
    const modelRootPath = document.getElementById("setting-model-root-path").value.trim();

    try {
      await Promise.all([
        settingsAPI.set("theme", theme),
        settingsAPI.set("auto_preview", String(autoPreview)),
        settingsAPI.set("resize_preview", String(resizePreview)),
        modelRootPath ? settingsAPI.set("model_root_path", modelRootPath) : Promise.resolve(),
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

- [ ] **Step 4: Commit**

```bash
git add frontend/js/main.js frontend/js/router.js frontend/js/settings.js
git commit -m "feat(frontend): add main app initialization, router and settings"
```

---

### Task 8: 驗證

- [ ] **Step 1: 驗證靜態檔案可被 FastAPI serve**

Ensure `server/main.py` mounts `frontend` as static files (already in plan 1).

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(frontend): complete frontend foundation"
```
