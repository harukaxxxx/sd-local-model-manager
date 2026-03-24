# SD Local Model Manager - 前端 Redesign 設計規格

## 1. Concept & Vision

一個具備高級質感的 Stable Diffusion 模型管理器介面。設計語言融合**極簡主義**與**玻璃質感美學**，透過精緻的毛玻璃效果、柔和的陰影過渡、以及果斷的圓角設計，創造出專業且現代的視覺體驗。

## 2. Design Language

### 2.1 Aesthetic Direction
- **風格**: 極簡玻璃質感 (Minimalist Glassmorphism)
- **關鍵詞**: 留白、玻璃面板、纖細字體、專業優雅
- **參考**: Apple Human Interface + Linear App 美學

### 2.2 Color Themes (6 Themes)

所有主題共享相同的 CSS 變數結構，僅變更色彩值。

#### 淺色主題 (Light)
```css
--bg-primary: #f8f9fc;
--bg-secondary: #ffffff;
--bg-glass: rgba(255, 255, 255, 0.7);
--text-primary: #1a1a2e;
--text-secondary: #64748b;
--accent: #4f46e5;        /* 藍紫強調色 */
--accent-hover: #4338ca;
--border: rgba(0, 0, 0, 0.08);
```

#### 深色主題 (Dark)
```css
--bg-primary: #0f172a;
--bg-secondary: #1e293b;
--bg-glass: rgba(30, 41, 59, 0.8);
--text-primary: #f1f5f9;
--text-secondary: #94a3b8;
--accent: #818cf8;        /* 靛藍強調 */
--accent-hover: #6366f1;
--border: rgba(255, 255, 255, 0.1);
```

#### 熱情紅主題 (Red)
```css
--bg-primary: #0d0d0d;
--bg-secondary: #1a1a1a;
--bg-glass: rgba(26, 26, 26, 0.85);
--text-primary: #fafafa;
--text-secondary: #a1a1aa;
--accent: #f87171;        /* 玫瑰紅 */
--accent-hover: #ef4444;
--border: rgba(248, 113, 113, 0.2);
```

#### 靜謐藍主題 (Blue)
```css
--bg-primary: #0c1929;
--bg-secondary: #1e3a5f;
--bg-glass: rgba(30, 58, 95, 0.8);
--text-primary: #f0f9ff;
--text-secondary: #7dd3fc;
--accent: #38bdf8;        /* 天藍 */
--accent-hover: #0ea5e9;
--border: rgba(56, 189, 248, 0.2);
```

#### 自然綠主題 (Green)
```css
--bg-primary: #0d1117;
--bg-secondary: #161b22;
--bg-glass: rgba(22, 27, 34, 0.85);
--text-primary: #f0fdf4;
--text-secondary: #86efac;
--accent: #4ade80;        /* 薄荷綠 */
--accent-hover: #22c55e;
--border: rgba(74, 222, 128, 0.2);
```

#### 神祕紫主題 (Purple)
```css
--bg-primary: #0c0a1d;
--bg-secondary: #1a1333;
--bg-glass: rgba(26, 19, 51, 0.85);
--text-primary: #faf5ff;
--text-secondary: #d8b4fe;
--accent: #c084fc;        /* 薰衣草紫 */
--accent-hover: #a855f7;
--border: rgba(192, 132, 252, 0.2);
```

### 2.3 Typography
- **標題字體**: Geist (Google Fonts fallback: system-ui)
- **內文字體**: Inter
- **字重**: 400 (body), 500 (medium), 600 (semibold), 700 (bold)
- **尺寸 Scale**:
  - xs: 11px
  - sm: 13px
  - base: 14px
  - lg: 16px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 32px

### 2.4 Spacing System
- **Base unit**: 4px
- **Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- **Border Radius**:
  - sm: 8px
  - md: 12px
  - lg: 16px
  - xl: 24px
  - full: 9999px

### 2.5 Glass Effect System
```css
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
```

### 2.6 Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.15);
--shadow-glow: 0 0 20px rgba(var(--accent-rgb), 0.3);
```

### 2.7 Motion Philosophy
- **Duration**: 150ms (micro), 200ms (standard), 300ms (emphasis)
- **Easing**: cubic-bezier(0.4, 0, 0.2, 1)
- **原則**:
  - 玻璃面板邊角微微發光
  - 按鈕 hover 時輕微上浮 + 發光
  - 卡片 hover 時邊框變亮 + 陰影加深
  - 過渡平滑，不搶眼

---

## 3. Layout & Structure

### 3.1 Header
- **高度**: 56px
- **背景**: glass 效果 (backdrop-filter: blur)
- **內容**:
  - 左: Logo + 標題 (Geist Bold, 16px)
  - 中: 搜尋列 (圓角膠囊形狀，glass 效果)
  - 右: 操作按鈕群（Scan, Download, Settings）

### 3.2 Sidebar
- **寬度**: 240px (desktop), 可折疊
- **背景**: glass 效果
- **內容**:
  - 模型類型篩選器 (全部, Checkpoint, VAE, LoRA, Hypernet, Embedding, 其他)
  - 標籤篩選器 (動態生成)
- **效果**: 圓角邊框，柔和陰影

### 3.3 Content Area
- **響應式網格**:
  - Desktop: repeat(auto-fill, minmax(260px, 1fr))
  - Tablet: repeat(auto-fill, minmax(200px, 1fr))
  - Mobile: 1 column
- **間距**: 20px gap

### 3.4 Card Grid
- **佈局**: CSS Grid, 響應式
- **卡片高度**: auto (內容驅動)

---

## 4. Component Specifications

### 4.1 Model Card
```css
.model-card {
  background: var(--bg-glass);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);  /* 16px */
  overflow: hidden;
  transition: all 0.2s ease;
}

.model-card:hover {
  border-color: var(--accent);
  box-shadow: var(--shadow-lg), 0 0 0 1px var(--accent);
  transform: translateY(-2px);
}
```

**結構**:
- **圖片區**: 4:3 aspect ratio, 漸層或圖片
- **Badge**: 絕對定位左上角, 圓角 pill 形狀
- **內容區**: 名稱 + 元數據（大小、hash）+ 標籤晶片

### 4.2 Button Variants

**Primary Button**:
```css
.btn-primary {
  background: var(--accent);
  color: white;
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: var(--shadow-glow);
  transform: translateY(-1px);
}
```

**Icon Button**:
```css
.btn-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.btn-icon:hover {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--bg-glass);
}
```

### 4.3 Search Bar
```css
.search-bar input {
  background: var(--bg-glass);
  backdrop-filter: blur(10px);
  border: 1px solid var(--border);
  border-radius: 9999px;  /* 膠囊形 */
  padding: 10px 20px;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.search-bar input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(var(--accent-rgb), 0.1);
}
```

### 4.4 Filter Button
```css
.filter-btn {
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  text-align: left;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  background: var(--bg-glass);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}
```

### 4.5 Modal
```css
.modal {
  background: var(--bg-glass);
  backdrop-filter: blur(40px);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
```

### 4.6 Tag Chip
```css
.tag-chip {
  padding: 4px 10px;
  background: var(--bg-glass);
  border: 1px solid var(--border);
  border-radius: 9999px;
  font-size: 11px;
  color: var(--text-secondary);
  transition: all 0.15s ease;
}

.tag-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}
```

---

## 5. Animations & Transitions

### 5.1 Page Load
- Header: fade-in, 300ms
- Sidebar: slide-in-left, 300ms, 50ms delay
- Cards: stagger fade-in-up, 200ms each, 30ms stagger

### 5.2 Hover States
- Cards: translateY(-2px) + border glow
- Buttons: scale(1.02) + glow
- Icons: color transition 150ms

### 5.3 Theme Switch
- Full-page crossfade: 200ms
- CSS transition on all color variables

---

## 6. Theme Switching Implementation

### 6.1 HTML Attribute Strategy
```javascript
// 切換主題
document.documentElement.setAttribute('data-theme', 'light');
document.documentElement.setAttribute('data-theme', 'dark');
document.documentElement.setAttribute('data-theme', 'red');
// ... etc
```

### 6.2 CSS Variables
每個主題定義完整的 CSS 變數集，通過 `data-theme` 屬性選擇器切換。

### 6.3 Settings Storage
- 主題偏好保存到 localStorage
- 支援系統偏好偵測 (prefers-color-scheme)

---

## 7. Technical Approach

### 7.1 File Changes
- `css/variables.css` - 重寫所有 CSS 變數 + 主題定義
- `css/base.css` - 字體加載 + 全域样式
- `css/layout.css` - 調整佈局結構
- `css/components.css` - 重寫所有元件樣式
- `index.html` - 結構微調以適配新設計
- `js/components/ModelCard.js` - 更新卡片結構

### 7.2 External Dependencies
- Google Fonts: Geist, Inter
- 無其他外部 UI 庫

### 7.3 Responsive Breakpoints
- Desktop: > 1024px
- Tablet: 768px - 1024px
- Mobile: < 768px

---

## 8. Accessibility

- 所有 interactive elements 有明确的 focus-visible 狀態
- 按鈕和連結有足夠的對比度
- 支援鍵盤導航
- ARIA labels for icon buttons
- 尊重 `prefers-reduced-motion`

---

## 9. Implementation Priority

1. **Phase 1**: CSS Variables + 主題系統
2. **Phase 2**: Layout + Header + Sidebar
3. **Phase 3**: Model Card 元件
4. **Phase 4**: Modal + Toast 系統
5. **Phase 5**: Animations + Polish
6. **Phase 6**: 主題切換 UI
