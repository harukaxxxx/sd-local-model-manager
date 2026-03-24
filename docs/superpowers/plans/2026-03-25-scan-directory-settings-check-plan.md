# 掃描目錄設定檢查 - 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 當使用者按下「掃描目錄」按鈕時，先檢查「模型根目錄」是否已設定，有就直接掃描，沒有則開啟設定頁面。

**Architecture:** 修改 `main.js` 中掃描按鈕的點擊事件，在執行掃描前先透過 `settingsAPI` 檢查 `model_root_path` 是否已有值。

**Tech Stack:** Pure JavaScript (ES6 modules), FastAPI backend

---

## 實作範圍

### 修改檔案

- `frontend/js/main.js` — 改寫掃描按鈕邏輯
- `frontend/js/settings.js` — 將 `openSettings` 改為 export

---

## Task 1: 修改掃描按鈕邏輯

**Files:**
- Modify: `frontend/js/main.js:193-208` (btn-scan click handler)
- Modify: `frontend/js/settings.js:51` (openSettings function - add export)

### 實作步驟

- [ ] **Step 1: 修改 settings.js 的 openSettings 為 export**

在 `frontend/js/settings.js` line 51，將：
```javascript
async function openSettings() {
```
改為：
```javascript
export async function openSettings() {
```

- [ ] **Step 2: 更新 main.js 的 import**

在 `frontend/js/main.js` line 8，將：
```javascript
import { initSettings } from "./settings.js";
```
改為：
```javascript
import { initSettings, openSettings } from "./settings.js";
```

- [ ] **Step 3: 替換 btn-scan 點擊事件處理函式**

在 `frontend/js/main.js` line 193-208，將原本的：
```javascript
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
```

替換為：
```javascript
// Scan button
document.getElementById("btn-scan").addEventListener("click", async () => {
  const btn = document.getElementById("btn-scan");
  btn.disabled = true;
  try {
    // 檢查模型根目錄設定
    const settings = await settingsAPI.get("model_root_path");
    const modelRootPath = settings?.value;

    if (!modelRootPath) {
      // 未設定路徑 → 開啟設定頁面
      showToast("請先設定模型根目錄", "warning");
      openSettings();
      return;
    }

    // 已設定路徑 → 直接掃描
    const result = await modelsAPI.scan(modelRootPath);
    showToast(`已掃描 ${result.scanned} 個模型，新增 ${result.added} 個`, "success");
    loadModels();
  } catch (e) {
    showToast(`掃描失敗: ${e.message}`, "error");
  } finally {
    btn.disabled = false;
  }
});
```

- [ ] **Step 4: 提交變更**

```bash
git add frontend/js/main.js frontend/js/settings.js
git commit -m "feat: scan button checks model_root_path setting before scanning

- If model_root_path not set, open settings modal with toast warning
- If model_root_path is set, scan directly using saved path
- Export openSettings function from settings.js"
```

---

## 成功標準

- [ ] 未設定 `model_root_path` 時，點擊掃描按鈕會顯示 Toast 並開啟設定頁面
- [ ] 已設定 `model_root_path` 時，點擊掃描按鈕直接執行掃描（不再彈 prompt）
- [ ] `openSettings` 正確 export 並可被 main.js 呼叫
