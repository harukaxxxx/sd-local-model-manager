/** Batch action bar component. */
import { tagsAPI } from "../api.js";

export class BatchActions {
  constructor(selectionManager, { onTagAssign }) {
    this.selectionManager = selectionManager;
    this.onTagAssign = onTagAssign;
    this.element = this.render();
    this.selectionManager.onChange = () => this.updateVisibility();
  }

  render() {
    const bar = document.createElement("div");
    bar.className = "batch-actions hidden";
    bar.innerHTML = `
      <div class="batch-info">
        <span class="batch-count">0</span> 個模型已選取
      </div>
      <div class="batch-buttons">
        <button class="btn btn-secondary" id="batch-tag">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          設定標籤
        </button>
        <button class="btn btn-secondary" id="batch-clear">取消選取</button>
      </div>
    `;

    bar.querySelector("#batch-tag").addEventListener("click", async () => {
      await this.showTagDialog();
    });

    bar.querySelector("#batch-clear").addEventListener("click", () => {
      this.selectionManager.clear();
    });

    return bar;
  }

  updateVisibility() {
    const count = this.selectionManager.count;
    this.element.classList.toggle("hidden", count === 0);
    this.element.querySelector(".batch-count").textContent = count;
  }

  async showTagDialog() {
    const tags = await tagsAPI.list();
    const selected = this.selectionManager.getSelected();

    const modal = document.createElement("div");
    modal.className = "modal-container";
    modal.innerHTML = `
      <div class="modal" style="max-width: 400px;">
        <div class="modal-header">
          <h2 class="modal-title">設定標籤 (${selected.length} 個模型)</h2>
          <button class="modal-close btn-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <div id="tag-options" class="tag-options" style="display: flex; flex-wrap: wrap; gap: 8px;"></div>
          <div class="form-group" style="margin-top: 12px;">
            <input type="text" class="form-input" id="new-tag-input" placeholder="新增標籤...">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" id="apply-tags">套用</button>
        </div>
      </div>
    `;

    document.getElementById("modal-container").appendChild(modal);

    const container = modal.querySelector("#tag-options");
    container.innerHTML = tags
      .map((t) => `<button class="btn btn-secondary tag-option" data-tag-id="${t.id}">${t.name}</button>`)
      .join("");

    container.querySelectorAll(".tag-option").forEach((btn) => {
      btn.addEventListener("click", () => btn.classList.toggle("active"));
    });

    modal.querySelector(".modal-close").addEventListener("click", () => modal.remove());
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector("#apply-tags").addEventListener("click", async () => {
      const selectedTags = Array.from(container.querySelectorAll(".tag-option.active"))
        .map((b) => parseInt(b.dataset.tagId));

      const newTagInput = modal.querySelector("#new-tag-input").value.trim();
      let newTagId = null;
      if (newTagInput) {
        const newTag = await tagsAPI.create(newTagInput);
        newTagId = newTag.id;
        selectedTags.push(newTagId);
      }

      for (const modelId of selected) {
        await tagsAPI.updateModelTags(modelId, selectedTags);
      }

      this.selectionManager.clear();
      modal.remove();
      if (this.onTagAssign) this.onTagAssign();
    });
  }
}