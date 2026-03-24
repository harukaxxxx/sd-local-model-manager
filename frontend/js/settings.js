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