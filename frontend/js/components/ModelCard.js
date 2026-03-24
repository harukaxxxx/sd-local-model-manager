/** Model card component. */
import { formatFileSize } from "./common.js";

export class ModelCard {
  constructor(model, onClick) {
    this.model = model;
    this.onClick = onClick;
    this.element = this.render();
  }

  formatSize(bytes) {
    return formatFileSize(bytes);
  }

  render() {
    const { id, name, file_path, file_size, model_type, preview_url, description, sha256 } = this.model;

    const card = document.createElement("article");
    card.className = "model-card";
    card.dataset.modelId = id;

    // Image section
    const imageDiv = document.createElement("div");
    imageDiv.className = "model-card-image";

    if (preview_url) {
      const img = document.createElement("img");
      img.src = preview_url;
      img.alt = name;
      img.loading = "lazy";
      img.onerror = () => {
        img.style.display = "none";
        imageDiv.innerHTML = `<div class="placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
      };
      imageDiv.appendChild(img);
    } else {
      imageDiv.innerHTML = `
        <div class="placeholder">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      `;
    }

    // Badge
    const badge = document.createElement("span");
    badge.className = `model-card-badge ${model_type || "other"}`;
    badge.textContent = model_type || "other";
    imageDiv.appendChild(badge);

    card.appendChild(imageDiv);

    // Body
    const body = document.createElement("div");
    body.className = "model-card-body";
    body.innerHTML = `
      <h3 class="model-card-name" title="${name}">${name}</h3>
      <div class="model-card-meta">
        ${file_size ? `<span>${this.formatSize(file_size)}</span>` : ""}
        ${sha256 ? `<span title="${sha256}">${sha256.substring(0, 8)}...</span>` : ""}
      </div>
    `;
    card.appendChild(body);

    // Click handler
    card.addEventListener("click", () => this.onClick && this.onClick(this.model));

    return card;
  }
}