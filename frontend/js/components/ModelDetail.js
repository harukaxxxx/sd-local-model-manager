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