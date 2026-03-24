/** Model grid container with virtual scrolling support. */
import { ModelCard } from "./ModelCard.js";

export class ModelGrid {
  constructor(container, { onModelClick }) {
    this.container = container;
    this.onModelClick = onModelClick;
    this.models = [];
    this.viewMode = "grid"; // grid | list
  }

  setModels(models) {
    this.models = models;
    this.render();
  }

  setViewMode(mode) {
    this.viewMode = mode;
    this.container.classList.toggle("list-view", mode === "list");
  }

  render() {
    this.container.innerHTML = "";

    if (this.models.length === 0) {
      this.container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 48px; color: var(--text-muted);">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 16px;">
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
            <polyline points="13 2 13 9 20 9"/>
          </svg>
          <p>尚無模型</p>
          <p style="font-size: 12px; margin-top: 4px;">點擊上方「掃描目錄」新增模型</p>
        </div>
      `;
      return;
    }

    this.models.forEach((model) => {
      const card = new ModelCard(model, this.onModelClick);
      this.container.appendChild(card.element);
    });
  }
}