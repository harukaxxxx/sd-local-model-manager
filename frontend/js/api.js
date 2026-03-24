/** API service layer for backend communication. */
const API_BASE = "/api";

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new APIError(error.detail || "Request failed", response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

// Models API
export const modelsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/models${qs ? `?${qs}` : ""}`);
  },

  get: (id) => request(`/models/${encodeURIComponent(id)}`),

  scan: (directory, recursive = true) =>
    request("/models/scan", {
      method: "POST",
      body: JSON.stringify({ directory, recursive }),
    }),

  update: (id, data) =>
    request(`/models/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    request(`/models/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

// Tags API
export const tagsAPI = {
  list: () => request("/tags"),

  create: (name) =>
    request("/tags", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  updateModelTags: (modelId, tagIds) =>
    request("/tags/model", {
      method: "POST",
      body: JSON.stringify({ model_id: modelId, tag_ids: tagIds }),
    }),
};

// Civitai API
export const civitaiAPI = {
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/civitai/models/search${qs ? `?${qs}` : ""}`);
  },

  getModel: (id) => request(`/civitai/models/${id}`),

  download: (data) =>
    request("/civitai/download", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  findByHash: (sha256) => request(`/civitai/models/by-hash/${sha256}`),

  computeHashAndLink: (modelId) =>
    request(`/civitai/models/${modelId}/hash-and-link`, { method: "POST" }),
};

// Settings API
export const settingsAPI = {
  get: (key) => request(`/settings/${key}`),

  set: (key, value) =>
    request(`/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),

  list: () => request("/settings"),
};

// Health check
export const healthAPI = {
  check: () => request("/health"),
};