/** Move modal for relocating model files. */
import { showToast } from "./common.js";

export class MoveModal {
  constructor(models, { onMoved }) {
    this.models = models;
    this.onMoved = onMoved;
    this.element = this.render();
  }

  render() {
    const modal = document.createElement("div");
    modal.className = "modal-container";
    const modelNames = this.models.length <= 3
      ? this.models.map((m) => m.name).join(", ")
      : `${this.models.length} 個模型`;

    modal.innerHTML = `
      <div class="modal" style="max-width: 480px;">
        <div class="modal-header">
          <h2 class="modal-title">搬移模型</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 16px; color: var(--text-secondary);">
            將搬移：<strong>${modelNames}</strong>
          </p>
          <div class="form-group">
            <label class="form-label">目標資料夾</label>
            <input type="text" class="form-input" id="move-dest" placeholder="例如：C:/models/ckpt">
          </div>
          <div class="form-group">
            <label class="form-label">
              <input type="checkbox" id="move-rename"> 同時重新命名
            </label>
            <input type="text" class="form-input" id="move-name-prefix" placeholder="前置文字（選填）" style="margin-top: 8px;">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary modal-cancel">取消</button>
          <button class="btn btn-primary" id="move-confirm">搬移</button>
        </div>
      </div>
    `;

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.querySelector(".modal-cancel").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#move-confirm").addEventListener("click", async () => {
      const dest = modal.querySelector("#move-dest").value.trim();
      if (!dest) {
        showToast("請輸入目標資料夾", "warning");
        return;
      }

      const btn = modal.querySelector("#move-confirm");
      btn.disabled = true;
      btn.textContent = "搬移中...";

      try {
        // Move via API
        const response = await fetch("/api/models/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model_ids: this.models.map((m) => m.id),
            dest_path: dest,
            rename_prefix: modal.querySelector("#move-rename").checked
              ? modal.querySelector("#move-name-prefix").value.trim()
              : null,
          }),
        });

        if (!response.ok) throw new Error("Move failed");

        showToast(`${this.models.length} 個模型已搬移`, "success");
        if (this.onMoved) this.onMoved();
        modal.remove();
      } catch (e) {
        showToast(`搬移失敗: ${e.message}`, "error");
        btn.disabled = false;
        btn.textContent = "搬移";
      }
    });

    return modal;
  }
}