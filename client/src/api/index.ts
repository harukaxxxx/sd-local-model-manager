import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export interface ModelData {
  id: number;
  name: string;
  fileName: string;
  type: string;
  filePath: string;
  fileSize: string;
  sha256: string | null;
  civitaiId: number | null;
  civitaiModelId: number | null;
  baseModel: string | null;
  description: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ScanPath {
  id: number;
  path: string;
  modelType: string;
  createdAt: string;
}

// Models
export const getModels = (params?: {
  page?: number;
  limit?: number;
  type?: string;
  tag?: string;
  search?: string;
}) => api.get<PaginatedResponse<ModelData>>('/models', { params });

export const getModel = (id: number) => api.get<ModelData>(`/models/${id}`);

export const deleteModel = (id: number) => api.delete(`/models/${id}`);

// Scan
export const triggerScan = (pathId?: number) =>
  api.post('/scan', { pathId });

// Settings
export const getScanPaths = () => api.get<ScanPath[]>('/settings/scan-paths');

export const addScanPath = (path: string, modelType: string) =>
  api.post<ScanPath>('/settings/scan-paths', { path, modelType });

export const deleteScanPath = (id: number) =>
  api.delete(`/settings/scan-paths/${id}`);

// Download
export const downloadModel = (url: string, targetPath?: string) =>
  api.post('/models/download', { url, targetPath });

// Symlink
export const createSymlink = (modelId: number, targetDir: string) =>
  api.post(`/models/${modelId}/symlink`, { targetDir });

export default api;
