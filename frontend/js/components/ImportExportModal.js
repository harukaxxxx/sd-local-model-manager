/** Import/Export modal component. */
import { showToast } from "./common.js";

export class ImportExportModal {
  constructor({ onComplete }) {
    this.onComplete = onComplete;
    this.element = this.render();
  }

  render() {
    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2 class="modal-title">匯入/匯出</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="settings-section">
            <h3 class="settings-section-title">匯出</h3>
            <button class="btn btn-secondary" id="export-json" style="width: 100%;">
              匯出資料庫（JSON）
            </button>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">
              匯出所有模型資料庫內容為 JSON 檔案
            </p>
          </div>

          <div class="settings-section">
            <h3 class="settings-section-title">匯入</h3>
            <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 24px; text-align: center;"
                 id="drop-zone">
              <p style="color: var(--text-muted);">拖放 JSON 檔案至此或</p>
              <input type="file" id="import-file" accept=".json" style="display: none;">
              <button class="btn btn-secondary" id="import-btn" style="margin-top: 8px;">選擇檔案</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-close">關閉</button>
        </div>
      </div>
    `;

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    // Export
    modal.querySelector("#export-json").addEventListener("click", async () => {
      try {
        const response = await fetch("/api/import/export/json", { method: "POST" });
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `sd-models-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showToast("已匯出", "success");
      } catch (e) {
        showToast(`匯出失敗: ${e.message}`, "error");
      }
    });

    // Import
    const fileInput = modal.querySelector("#import-file");
    modal.querySelector("#import-btn").addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/import/json", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error(await response.text());

        const result = await response.json();
        showToast(`已匯入 ${result.imported_models} 個模型`, "success");
        if (this.onComplete) this.onComplete();
        modal.remove();
      } catch (e) {
        showToast(`匯入失敗: ${e.message}`, "error");
      }
    });

    return modal;
  }
}