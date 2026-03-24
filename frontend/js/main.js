/** Main application entry point. */
import { modelsAPI, tagsAPI, settingsAPI } from "./api.js";
import { ModelGrid } from "./components/ModelGrid.js";
import { ModelDetail } from "./components/ModelDetail.js";
import { DownloadModal } from "./components/DownloadModal.js";
import { showToast, debounce } from "./components/common.js";
import { initRouter } from "./router.js";
import { initSettings, openSettings } from "./settings.js";

let currentFilters = {
  page: 1,
  page_size: 20,
  model_type: "",
  tag: "",
  search: "",
  sort: "updated_at",
  order: "desc",
};

let modelGrid;

async function loadModels() {
  try {
    const params = { ...currentFilters };
    // Remove empty filters
    if (!params.tag) delete params.tag;
    if (!params.model_type) delete params.model_type;
    if (!params.search) delete params.search;
    const response = await modelsAPI.list(params);
    modelGrid.setModels(response.items);
    renderPagination(response.total, response.page, response.page_size);
  } catch (e) {
    showToast(`載入失敗: ${e.message}`, "error");
  }
}

function renderPagination(total, page, pageSize) {
  const container = document.getElementById("pagination");
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="btn btn-secondary ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  container.innerHTML = html;

  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilters.page = parseInt(btn.dataset.page);
      loadModels();
    });
  });
}

function openModelDetail(model) {
  const container = document.getElementById("modal-container");
  const detail = new ModelDetail(model, {
    onClose: () => {
      container.innerHTML = "";
      container.classList.add("hidden");
    },
    onUpdate: async (id, data) => {
      try {
        await modelsAPI.update(id, data);
        showToast("已儲存", "success");
        loadModels();
      } catch (e) {
        showToast(`儲存失敗: ${e.message}`, "error");
      }
    },
    onDelete: async (id) => {
      try {
        await modelsAPI.delete(id);
        showToast("已移除", "success");
        container.innerHTML = "";
        container.classList.add("hidden");
        loadModels();
      } catch (e) {
        showToast(`刪除失敗: ${e.message}`, "error");
      }
    },
  });

  container.innerHTML = "";
  container.appendChild(detail.element);
  container.classList.remove("hidden");
}

function openDownloadModal() {
  const container = document.getElementById("modal-container");
  const modal = new DownloadModal({
    onDownloadComplete: () => {
      loadModels();
    },
  });
  container.innerHTML = "";
  container.appendChild(modal.element);
  container.classList.remove("hidden");
}

async function initTags() {
  try {
    const tags = await tagsAPI.list();
    const container = document.getElementById("tag-filters");
    container.innerHTML = tags
      .map((t) => `<li><button class="filter-btn tag-filter" data-tag="${t.id}">${t.name}</button></li>`)
      .join("");

    // Tag filter click handlers
    container.querySelectorAll(".tag-filter").forEach((btn) => {
      btn.addEventListener("click", () => {
        const wasActive = btn.classList.contains("active");
        // Deselect all tag filters
        container.querySelectorAll(".tag-filter").forEach((b) => b.classList.remove("active"));
        if (wasActive) {
          // Toggle off if already selected
          currentFilters.tag = "";
        } else {
          btn.classList.add("active");
          currentFilters.tag = btn.dataset.tag;
        }
        currentFilters.page = 1;
        loadModels();
      });
    });
  } catch (e) {
    console.error("Failed to load tags:", e);
  }
}

async function init() {
  // Initialize components
  const gridContainer = document.getElementById("model-grid");
  modelGrid = new ModelGrid(gridContainer, {
    onModelClick: openModelDetail,
  });

  // Router
  initRouter();

  // Settings
  initSettings();

  // Load initial data
  await Promise.all([loadModels(), initTags()]);

  // Search
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      currentFilters.search = e.target.value;
      currentFilters.page = 1;
      loadModels();
    }, 300)
  );

  // Type filters
  document.getElementById("type-filters").addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-btn");
    if (!btn) return;
    document.querySelectorAll("#type-filters .filter-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilters.model_type = btn.dataset.type || "";
    currentFilters.page = 1;
    loadModels();
  });

  // Sort
  document.getElementById("sort-select").addEventListener("change", (e) => {
    currentFilters.sort = e.target.value;
    loadModels();
  });

  document.getElementById("sort-order").addEventListener("change", (e) => {
    currentFilters.order = e.target.value;
    loadModels();
  });

  // View toggle
  document.querySelectorAll(".btn-view").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-view").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      modelGrid.setViewMode(btn.dataset.view);
    });
  });

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

  // Download button
  document.getElementById("btn-download").addEventListener("click", openDownloadModal);
}

// Start app
document.addEventListener("DOMContentLoaded", init);