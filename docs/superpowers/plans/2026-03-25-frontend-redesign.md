# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a glassmorphism-styled frontend redesign with 6 color themes for SD Local Model Manager.

**Architecture:** Pure HTML/CSS/JS frontend. Theme system via CSS custom properties with `data-theme` attribute selector. Google Fonts (Geist, Inter) loaded in base.css. No external UI libraries.

**Tech Stack:** Vanilla HTML/CSS/JS, Google Fonts, CSS Custom Properties

---

## File Structure

| File | Action | Purpose |
|------|--------|---------|
| `frontend/css/variables.css` | Rewrite | 6 theme CSS variables + base design tokens |
| `frontend/css/base.css` | Modify | Font loading + global resets + glass utility classes |
| `frontend/css/layout.css` | Modify | Header, Sidebar, Content layout with glass effects |
| `frontend/css/components.css` | Rewrite | All component styles (buttons, cards, modals, etc.) |
| `frontend/index.html` | Modify | HTML structure adjustments for new design |
| `frontend/js/components/ModelCard.js` | Modify | Update card HTML structure for new design |

---

## Task 1: CSS Variables + Theme System

**Files:**
- Modify: `frontend/css/variables.css`

- [ ] **Step 1: Rewrite variables.css with 6 themes**

Replace entire content with:

```css
/* ============================================
   CSS Variables - Glassmorphism Theme System
   ============================================ */

/* === Base Design Tokens === */
:root {
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;

  /* Typography Scale */
  --text-xs: 11px;
  --text-sm: 13px;
  --text-base: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
  --shadow-glow: 0 0 20px rgba(var(--accent-rgb), 0.3);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* === Theme: Light (Default) === */
[data-theme="light"],
:root {
  --bg-primary: #f8f9fc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --bg-card: #ffffff;
  --bg-glass: rgba(255, 255, 255, 0.75);
  --bg-glass-hover: rgba(255, 255, 255, 0.9);

  --text-primary: #1a1a2e;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;

  --accent: #4f46e5;
  --accent-hover: #4338ca;
  --accent-rgb: 79, 70, 229;
  --accent-secondary: #6366f1;

  --border: rgba(0, 0, 0, 0.08);
  --border-color: rgba(0, 0, 0, 0.1);

  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;

  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* === Theme: Dark === */
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-card: #1e293b;
  --bg-glass: rgba(30, 41, 59, 0.8);
  --bg-glass-hover: rgba(30, 41, 59, 0.95);

  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;

  --accent: #818cf8;
  --accent-hover: #6366f1;
  --accent-rgb: 129, 140, 248;
  --accent-secondary: #a5b4fc;

  --border: rgba(255, 255, 255, 0.1);
  --border-color: rgba(255, 255, 255, 0.15);

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}

/* === Theme: Red === */
[data-theme="red"] {
  --bg-primary: #0d0d0d;
  --bg-secondary: #1a1a1a;
  --bg-tertiary: #262626;
  --bg-card: #1a1a1a;
  --bg-glass: rgba(26, 26, 26, 0.85);
  --bg-glass-hover: rgba(26, 26, 26, 0.95);

  --text-primary: #fafafa;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;

  --accent: #f87171;
  --accent-hover: #ef4444;
  --accent-rgb: 248, 113, 113;
  --accent-secondary: #fca5a5;

  --border: rgba(248, 113, 113, 0.2);
  --border-color: rgba(248, 113, 113, 0.3);

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}

/* === Theme: Blue === */
[data-theme="blue"] {
  --bg-primary: #0c1929;
  --bg-secondary: #1e3a5f;
  --bg-tertiary: #264b6e;
  --bg-card: #1e3a5f;
  --bg-glass: rgba(30, 58, 95, 0.8);
  --bg-glass-hover: rgba(30, 58, 95, 0.95);

  --text-primary: #f0f9ff;
  --text-secondary: #7dd3fc;
  --text-muted: #38bdf8;

  --accent: #38bdf8;
  --accent-hover: #0ea5e9;
  --accent-rgb: 56, 189, 248;
  --accent-secondary: #7dd3fc;

  --border: rgba(56, 189, 248, 0.2);
  --border-color: rgba(56, 189, 248, 0.3);

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}

/* === Theme: Green === */
[data-theme="green"] {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --bg-tertiary: #21262d;
  --bg-card: #161b22;
  --bg-glass: rgba(22, 27, 34, 0.85);
  --bg-glass-hover: rgba(22, 27, 34, 0.95);

  --text-primary: #f0fdf4;
  --text-secondary: #86efac;
  --text-muted: #4ade80;

  --accent: #4ade80;
  --accent-hover: #22c55e;
  --accent-rgb: 74, 222, 128;
  --accent-secondary: #86efac;

  --border: rgba(74, 222, 128, 0.2);
  --border-color: rgba(74, 222, 128, 0.3);

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}

/* === Theme: Purple === */
[data-theme="purple"] {
  --bg-primary: #0c0a1d;
  --bg-secondary: #1a1333;
  --bg-tertiary: #251a47;
  --bg-card: #1a1333;
  --bg-glass: rgba(26, 19, 51, 0.85);
  --bg-glass-hover: rgba(26, 19, 51, 0.95);

  --text-primary: #faf5ff;
  --text-secondary: #d8b4fe;
  --text-muted: #c084fc;

  --accent: #c084fc;
  --accent-hover: #a855f7;
  --accent-rgb: 192, 132, 252;
  --accent-secondary: #d8b4fe;

  --border: rgba(192, 132, 252, 0.2);
  --border-color: rgba(192, 132, 252, 0.3);

  --success: #4ade80;
  --warning: #fbbf24;
  --error: #f87171;
}

/* === Glass Effect Utility Classes === */
.glass {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
}

.glass-strong {
  background: var(--bg-glass);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--border);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

/* === Badge Colors (by model type) === */
[data-theme="light"] {
  --badge-checkpoint: #7c3aed;
  --badge-vae: #0891b2;
  --badge-lora: #16a34a;
  --badge-hypernet: #d97706;
  --badge-embedding: #db2777;
  --badge-other: #6b7280;
}

[data-theme="dark"],
[data-theme="red"],
[data-theme="green"],
[data-theme="purple"] {
  --badge-checkpoint: #a78bfa;
  --badge-vae: #22d3ee;
  --badge-lora: #4ade80;
  --badge-hypernet: #fbbf24;
  --badge-embedding: #f472b6;
  --badge-other: #9ca3af;
}

[data-theme="blue"] {
  --badge-checkpoint: #a78bfa;
  --badge-vae: #67e8f9;
  --badge-lora: #86efac;
  --badge-hypernet: #fcd34d;
  --badge-embedding: #f9a8d4;
  --badge-other: #93c5fd;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/variables.css
git commit -m "feat: rewrite CSS variables with 6 theme system"
```

---

## Task 2: Base CSS + Fonts

**Files:**
- Modify: `frontend/css/base.css`

- [ ] **Step 1: Update base.css with font loading and global styles**

Replace content with:

```css
/* ============================================
   Base Styles - Font Loading + Global Resets
   ============================================ */

/* Google Fonts: Geist + Inter */
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 14px;
  scroll-behavior: smooth;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: var(--text-base);
  line-height: 1.5;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: background-color var(--transition-base), color var(--transition-base);
}

#app {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Geist', system-ui, sans-serif;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

h1 { font-size: var(--text-2xl); }
h2 { font-size: var(--text-xl); }
h3 { font-size: var(--text-lg); }
h4 { font-size: var(--text-base); }

p {
  color: var(--text-secondary);
}

a {
  color: var(--accent);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent-hover);
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  transition: background var(--transition-fast);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}

/* Selection */
::selection {
  background: var(--accent);
  color: white;
}

/* Focus Visible */
*:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/base.css
git commit -m "feat: add Geist + Inter fonts and global base styles"
```

---

## Task 3: Layout CSS - Header, Sidebar, Content

**Files:**
- Modify: `frontend/css/layout.css`

- [ ] **Step 1: Rewrite layout.css with glassmorphism header and sidebar**

Replace content with:

```css
/* ============================================
   Layout - Header, Sidebar, Content
   ============================================ */

/* === App Header === */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  height: 56px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border);
  gap: var(--space-4);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 180px;
  gap: var(--space-3);
}

.app-title {
  font-family: 'Geist', system-ui, sans-serif;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.header-center {
  flex: 1;
  max-width: 480px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

/* === Search Bar === */
.search-bar {
  position: relative;
  width: 100%;
}

.search-bar input {
  width: 100%;
  padding: 10px 20px;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
  transition: all var(--transition-base);
}

.search-bar input::placeholder {
  color: var(--text-muted);
}

.search-bar input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.15);
  background: var(--bg-glass-hover);
}

/* === App Main === */
.app-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* === Sidebar === */
.sidebar {
  width: 240px;
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: var(--space-5);
  flex-shrink: 0;
}

.sidebar-section {
  margin-bottom: var(--space-6);
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-title {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: var(--space-3);
  padding-left: var(--space-2);
}

.filter-list,
.tag-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* === Filter Button === */
.filter-btn {
  width: 100%;
  text-align: left;
  padding: 10px var(--space-3);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.filter-btn:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

/* === Content Area === */
.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
}

.content-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.sort-controls {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.view-controls {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

/* === Model Grid === */
.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-5);
  flex: 1;
}

.model-grid.list-view {
  grid-template-columns: 1fr;
}

/* === Pagination === */
.pagination {
  display: flex;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-5) 0;
  margin-top: auto;
}

.pagination button {
  min-width: 36px;
  height: 36px;
  padding: 0 var(--space-3);
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--text-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.pagination button:hover:not(:disabled) {
  background: var(--bg-glass-hover);
  border-color: var(--accent);
  color: var(--accent);
}

.pagination button.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* === Responsive === */
@media (max-width: 1024px) {
  .sidebar {
    width: 200px;
  }

  .model-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--space-3);
    gap: var(--space-2);
  }

  .header-left {
    min-width: auto;
  }

  .header-center {
    display: none;
  }

  .sidebar {
    position: fixed;
    left: 0;
    top: 56px;
    height: calc(100% - 56px);
    z-index: 50;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
  }

  .sidebar.open {
    transform: translateX(0);
  }

  .model-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: var(--space-3);
  }

  .content {
    padding: var(--space-3);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/layout.css
git commit -m "feat: add glassmorphism layout for header and sidebar"
```

---

## Task 4: Components CSS - Buttons, Cards, Modal, etc.

**Files:**
- Modify: `frontend/css/components.css`

- [ ] **Step 1: Rewrite components.css with all component styles**

Replace content with:

```css
/* ============================================
   Components - Buttons, Cards, Modal, Forms
   ============================================ */

/* === Buttons === */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: none;
  outline: none;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Primary Button */
.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-glass-hover);
  border-color: var(--accent);
  color: var(--accent);
}

/* Icon Button */
.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-icon:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg-glass-hover);
}

.btn-icon.active {
  color: var(--accent);
  border-color: var(--accent);
}

/* Ghost Button */
.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid transparent;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-glass);
  color: var(--text-primary);
}

/* === Select Input === */
.select-input {
  padding: var(--space-2) var(--space-3);
  padding-right: var(--space-8);
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}

.select-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

.select-input:hover {
  border-color: var(--text-muted);
}

/* === Model Card === */
.model-card {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
}

.model-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--accent);
  transform: translateY(-2px);
}

.model-card-image {
  position: relative;
  aspect-ratio: 4 / 3;
  background: var(--bg-tertiary);
  overflow: hidden;
}

.model-card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-base);
}

.model-card:hover .model-card-image img {
  transform: scale(1.05);
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
  top: var(--space-3);
  left: var(--space-3);
  padding: var(--space-1) var(--space-3);
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
}

.model-card-badge.checkpoint { background: var(--badge-checkpoint); }
.model-card-badge.vae { background: var(--badge-vae); }
.model-card-badge.lora { background: var(--badge-lora); }
.model-card-badge.hypernet { background: var(--badge-hypernet); }
.model-card-badge.embedding { background: var(--badge-embedding); }
.model-card-badge.other { background: var(--badge-other); }

.model-card-body {
  padding: var(--space-4);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.model-card-name {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-card-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
  display: flex;
  gap: var(--space-3);
}

.model-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin-top: auto;
  padding-top: var(--space-2);
}

/* === Tag Chip === */
.tag-chip {
  padding: var(--space-1) var(--space-3);
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.tag-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* === Modal === */
.modal-container {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-base);
}

.modal-container:not(.hidden) {
  opacity: 1;
  visibility: visible;
}

.modal-container.hidden {
  display: none;
}

.modal {
  background: var(--bg-glass);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  max-width: 560px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  transform: scale(0.95) translateY(10px);
  transition: transform var(--transition-base);
}

.modal-container:not(.hidden) .modal {
  transform: scale(1) translateY(0);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-family: 'Geist', system-ui, sans-serif;
  font-size: var(--text-lg);
  font-weight: 600;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-5);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-5);
  border-top: 1px solid var(--border);
}

/* === Toast === */
.toast-container {
  position: fixed;
  bottom: var(--space-6);
  right: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: 2000;
}

.toast {
  padding: var(--space-3) var(--space-4);
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: var(--text-sm);
  animation: toast-in 0.3s ease-out;
}

.toast.success { border-left: 3px solid var(--success); }
.toast.error { border-left: 3px solid var(--error); }
.toast.warning { border-left: 3px solid var(--warning); }

@keyframes toast-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* === Settings Panel === */
.settings-panel {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}

.settings-section {
  margin-bottom: var(--space-6);
}

.settings-section:last-child {
  margin-bottom: 0;
}

.settings-section-title {
  font-size: var(--text-sm);
  font-weight: 600;
  margin-bottom: var(--space-4);
  color: var(--text-primary);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--border);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-label {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* === Form Controls === */
.form-group {
  margin-bottom: var(--space-4);
}

.form-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--space-2);
}

.form-input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-size: var(--text-sm);
  outline: none;
  transition: all var(--transition-fast);
}

.form-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}

.form-textarea {
  min-height: 80px;
  resize: vertical;
}

/* === Batch Actions === */
.batch-actions {
  position: fixed;
  bottom: var(--space-6);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-5);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  box-shadow: var(--shadow-lg);
  z-index: 500;
  opacity: 0;
  visibility: hidden;
  transform: translateX(-50%) translateY(20px);
  transition: all var(--transition-base);
}

.batch-actions:not(.hidden) {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.batch-actions.hidden {
  display: flex;
}

.batch-info {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.batch-count {
  font-weight: 600;
  color: var(--accent);
}

.batch-buttons {
  display: flex;
  gap: var(--space-2);
}

/* === Loading Skeleton === */
.model-card.skeleton {
  pointer-events: none;
}

.model-card.skeleton .model-card-image {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 25%,
    var(--bg-glass-hover) 50%,
    var(--bg-tertiary) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* === Empty State === */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  text-align: center;
}

.empty-state-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-4);
  color: var(--text-muted);
}

.empty-state-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.empty-state-description {
  font-size: var(--text-sm);
  color: var(--text-muted);
  max-width: 300px;
}

/* === Search Results === */
.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.search-result-item:hover {
  background: var(--bg-glass-hover);
}

.search-result-item.selected {
  background: var(--accent);
  color: white;
}

.search-result-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
}

.search-result-name {
  font-size: var(--text-sm);
  font-weight: 500;
}

.search-result-meta {
  font-size: var(--text-xs);
  color: var(--text-muted);
}

.search-result-item.selected .search-result-meta {
  color: rgba(255, 255, 255, 0.8);
}

/* === Detail Labels === */
.detail-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: var(--text-sm);
  color: var(--text-primary);
}

.detail-link {
  color: var(--accent-secondary);
}

.detail-link:hover {
  text-decoration: underline;
}

/* === Theme Switcher (for settings) === */
.theme-switcher {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.theme-option {
  padding: var(--space-3);
  background: var(--bg-glass);
  border: 2px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: center;
}

.theme-option:hover {
  border-color: var(--text-muted);
}

.theme-option.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.2);
}

.theme-option-preview {
  width: 100%;
  height: 40px;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-2);
}

.theme-option-label {
  font-size: var(--text-xs);
  color: var(--text-secondary);
}

.theme-option.active .theme-option-label {
  color: var(--accent);
  font-weight: 600;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/components.css
git commit -m "feat: rewrite components with glassmorphism styles"
```

---

## Task 5: ModelCard JS Component

**Files:**
- Modify: `frontend/js/components/ModelCard.js`

- [ ] **Step 1: Update ModelCard.js structure**

Replace content with:

```javascript
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
        imageDiv.innerHTML = `
          <div class="placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        `;
      };
      imageDiv.appendChild(img);
    } else {
      // Gradient placeholder
      const gradients = {
        checkpoint: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        vae: 'linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)',
        lora: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
        hypernet: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
        embedding: 'linear-gradient(135deg, #db2777 0%, #ec4899 100%)',
        other: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
      };
      imageDiv.style.background = gradients[model_type] || gradients.other;
      imageDiv.innerHTML = `
        <div class="placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" opacity="0.7">
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

- [ ] **Step 2: Commit**

```bash
git add frontend/js/components/ModelCard.js
git commit -m "feat: update ModelCard with gradient placeholders and glass styles"
```

---

## Task 6: HTML Structure Adjustments

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: Update index.html structure**

Update the header-right buttons to have proper ARIA labels:

```html
<button class="btn btn-icon" id="btn-scan" title="掃描目錄" aria-label="掃描目錄">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
</button>
```

Update data-theme attribute to support themes (add to html tag):

```html
<html lang="zh-TW" data-theme="dark">
```

Add theme switcher to settings modal (in settings.js or inline):

```javascript
// Theme switcher dropdown in settings
const themeOptions = `
  <div class="theme-switcher">
    <button class="theme-option" data-theme="light" aria-label="Light theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #f8f9fc, #e8eaef);"></div>
      <span class="theme-option-label">淺色</span>
    </button>
    <button class="theme-option active" data-theme="dark" aria-label="Dark theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #1e293b, #0f172a);"></div>
      <span class="theme-option-label">深色</span>
    </button>
    <button class="theme-option" data-theme="red" aria-label="Red theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #1a1a1a, #0d0d0d);"></div>
      <span class="theme-option-label">熱情紅</span>
    </button>
    <button class="theme-option" data-theme="blue" aria-label="Blue theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #1e3a5f, #0c1929);"></div>
      <span class="theme-option-label">靜謐藍</span>
    </button>
    <button class="theme-option" data-theme="green" aria-label="Green theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #161b22, #0d1117);"></div>
      <span class="theme-option-label">自然綠</span>
    </button>
    <button class="theme-option" data-theme="purple" aria-label="Purple theme">
      <div class="theme-option-preview" style="background: linear-gradient(135deg, #1a1333, #0c0a1d);"></div>
      <span class="theme-option-label">神秘紫</span>
    </button>
  </div>
`;
```

- [ ] **Step 2: Commit**

```bash
git add frontend/index.html
git commit -m "feat: update HTML with ARIA labels and theme support"
```

---

## Task 7: Theme Switching Logic

**Files:**
- Modify: `frontend/js/settings.js` (or create if needed)

- [ ] **Step 1: Add theme switching function**

Add theme management to settings.js:

```javascript
// Theme Management
const ThemeManager = {
  STORAGE_KEY: 'sd-theme-preference',

  themes: ['light', 'dark', 'red', 'blue', 'green', 'purple'],

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    this.setTheme(theme);
    this.setupThemeSwitcher();
  },

  setTheme(theme) {
    if (!this.themes.includes(theme)) theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.updateThemeSwitcherUI(theme);
  },

  getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  },

  updateThemeSwitcherUI(activeTheme) {
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === activeTheme);
    });
  },

  setupThemeSwitcher() {
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.addEventListener('click', () => {
        this.setTheme(btn.dataset.theme);
      });
    });
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
```

- [ ] **Step 2: Commit**

```bash
git add frontend/js/settings.js
git commit -m "feat: add theme switching with localStorage persistence"
```

---

## Task 8: Page Load Animations

**Files:**
- Modify: `frontend/css/base.css` (add animation keyframes)

- [ ] **Step 1: Add entrance animations**

Add to base.css:

```css
/* === Entrance Animations === */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Staggered card animation */
.model-card {
  animation: fade-in-up 0.3s ease-out backwards;
}

.model-card:nth-child(1) { animation-delay: 0ms; }
.model-card:nth-child(2) { animation-delay: 30ms; }
.model-card:nth-child(3) { animation-delay: 60ms; }
.model-card:nth-child(4) { animation-delay: 90ms; }
.model-card:nth-child(5) { animation-delay: 120ms; }
.model-card:nth-child(6) { animation-delay: 150ms; }
.model-card:nth-child(7) { animation-delay: 180ms; }
.model-card:nth-child(8) { animation-delay: 210ms; }

/* Header animation */
.app-header {
  animation: fade-in 0.3s ease-out;
}

/* Sidebar animation */
.sidebar {
  animation: slide-in-left 0.3s ease-out 0.05s backwards;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/css/base.css
git commit -m "feat: add page load entrance animations"
```

---

## Task 9: Final Polish & Review

- [ ] **Step 1: Review all changes**

Check each file matches the spec:
- [ ] variables.css - 6 themes defined with all required tokens
- [ ] base.css - Fonts loaded, global styles set
- [ ] layout.css - Header 56px, sidebar 240px, glass effects
- [ ] components.css - All component styles with glassmorphism
- [ ] ModelCard.js - Gradient placeholders, badge classes
- [ ] index.html - ARIA labels, data-theme attribute
- [ ] settings.js - Theme switching logic

- [ ] **Step 2: Test in browser**

```bash
# Start the server
python -m server.main
```

- [ ] **Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete frontend redesign - glassmorphism UI"
```

---

## Summary

| Task | Files | Status |
|------|-------|--------|
| 1. CSS Variables + Themes | `variables.css` | ⬜ |
| 2. Base CSS + Fonts | `base.css` | ⬜ |
| 3. Layout CSS | `layout.css` | ⬜ |
| 4. Components CSS | `components.css` | ⬜ |
| 5. ModelCard JS | `ModelCard.js` | ⬜ |
| 6. HTML Structure | `index.html` | ⬜ |
| 7. Theme Switching | `settings.js` | ⬜ |
| 8. Animations | `base.css` | ⬜ |
| 9. Final Polish | All | ⬜ |
