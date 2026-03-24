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