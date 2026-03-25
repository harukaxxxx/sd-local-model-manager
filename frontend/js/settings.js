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

export async function openSettings() {
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
                <option value="light">淺色 Light</option>
                <option value="dark">深色 Dark</option>
                <option value="red">熱情紅 Red</option>
                <option value="blue">靜謐藍 Blue</option>
                <option value="green">自然綠 Green</option>
                <option value="purple">神秘紫 Purple</option>
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