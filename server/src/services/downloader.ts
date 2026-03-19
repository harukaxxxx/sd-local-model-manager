import { createWriteStream, existsSync, statSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { getIO } from '../websocket/index.js';
import prisma from '../lib/prisma.js';
import { computeHash } from './hasher.js';
import { fetchCivitaiByHash } from './civitai.js';

interface DownloadTask {
  id: string;
  url: string;
  targetDir: string;
  fileName: string;
  filePath: string;
  totalSize: number;
  downloadedSize: number;
  status: 'queued' | 'downloading' | 'completed' | 'failed' | 'paused';
  error?: string;
  abortController?: AbortController;
}

const activeTasks = new Map<string, DownloadTask>();

/**
 * 從 CivitAI URL 解析下載資訊並開始下載
 */
export async function startDownload(
  downloadUrl: string,
  targetDir: string,
  modelType: string = 'Checkpoint',
): Promise<{ taskId: string }> {
  const io = getIO();
  const taskId = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // 確保目標目錄存在
  await mkdir(targetDir, { recursive: true });

  // 先 HEAD 取得檔案資訊
  const headRes = await fetch(downloadUrl, { method: 'HEAD', redirect: 'follow' });
  if (!headRes.ok) {
    throw new Error(`Failed to fetch download info: ${headRes.status}`);
  }

  const contentLength = parseInt(headRes.headers.get('content-length') || '0');
  const contentDisposition = headRes.headers.get('content-disposition');

  // 從 Content-Disposition 解析檔名
  let fileName = 'model.safetensors';
  if (contentDisposition) {
    const match = contentDisposition.match(/filename[*]?=(?:UTF-8''|"?)([^";]+)/i);
    if (match) {
      fileName = decodeURIComponent(match[1].replace(/"/g, ''));
    }
  } else {
    // 從 URL 解析
    const urlPath = new URL(headRes.url).pathname;
    const urlFileName = path.basename(urlPath);
    if (urlFileName && urlFileName.includes('.')) {
      fileName = urlFileName;
    }
  }

  const filePath = path.join(targetDir, fileName);

  // 檢查是否有已下載的部分（斷點續傳）
  let downloadedSize = 0;
  if (existsSync(filePath)) {
    downloadedSize = statSync(filePath).size;
  }

  const task: DownloadTask = {
    id: taskId,
    url: downloadUrl,
    targetDir,
    fileName,
    filePath,
    totalSize: contentLength,
    downloadedSize,
    status: 'queued',
  };

  activeTasks.set(taskId, task);

  // 非同步開始下載
  performDownload(task, modelType).catch((err) => {
    task.status = 'failed';
    task.error = err.message;
    io.emit('download_progress', {
      taskId: task.id,
      status: 'failed',
      error: err.message,
    });
  });

  return { taskId };
}

/**
 * 執行下載（支援斷點續傳）
 */
async function performDownload(task: DownloadTask, modelType: string): Promise<void> {
  const io = getIO();
  task.status = 'downloading';

  const headers: Record<string, string> = {};

  // 斷點續傳：如果已有部分下載，從斷點繼續
  if (task.downloadedSize > 0 && task.downloadedSize < task.totalSize) {
    headers['Range'] = `bytes=${task.downloadedSize}-`;
  }

  const abortController = new AbortController();
  task.abortController = abortController;

  const response = await fetch(task.url, {
    headers,
    signal: abortController.signal,
    redirect: 'follow',
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(`Download failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is null');
  }

  // 以 append 模式寫入（斷點續傳）
  const flags = task.downloadedSize > 0 ? 'a' : 'w';
  const writeStream = createWriteStream(task.filePath, { flags });

  const reader = response.body.getReader();
  let lastProgressTime = Date.now();
  let lastBytes = task.downloadedSize;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      writeStream.write(Buffer.from(value));
      task.downloadedSize += value.length;

      // 每 500ms 推送一次進度
      const now = Date.now();
      if (now - lastProgressTime >= 500) {
        const elapsed = (now - lastProgressTime) / 1000;
        const bytesPerSec = (task.downloadedSize - lastBytes) / elapsed;
        const remaining = task.totalSize - task.downloadedSize;
        const eta = bytesPerSec > 0 ? Math.round(remaining / bytesPerSec) : 0;

        io.emit('download_progress', {
          taskId: task.id,
          fileName: task.fileName,
          status: 'downloading',
          percent: Math.round((task.downloadedSize / task.totalSize) * 100),
          speed: formatSpeed(bytesPerSec),
          eta: formatEta(eta),
          downloaded: task.downloadedSize,
          total: task.totalSize,
        });

        lastProgressTime = now;
        lastBytes = task.downloadedSize;
      }
    }
  } finally {
    writeStream.end();
  }

  task.status = 'completed';

  io.emit('download_progress', {
    taskId: task.id,
    fileName: task.fileName,
    status: 'completed',
    percent: 100,
  });

  // 下載完成後自動計算 Hash 並入庫
  io.emit('download_progress', {
    taskId: task.id,
    fileName: task.fileName,
    status: 'hashing',
  });

  const sha256 = await computeHash(task.filePath, (percent) => {
    io.emit('download_progress', {
      taskId: task.id,
      fileName: task.fileName,
      status: 'hashing',
      percent,
    });
  });

  const stat = statSync(task.filePath);

  const model = await prisma.model.create({
    data: {
      name: path.parse(task.fileName).name,
      fileName: task.fileName,
      type: modelType,
      filePath: task.filePath,
      fileSize: BigInt(stat.size),
      sha256,
    },
  });

  // 查詢 CivitAI 並更新
  fetchCivitaiByHash(sha256, model.id).catch((err) => {
    console.error(`CivitAI lookup failed after download:`, err);
  });

  io.emit('download_progress', {
    taskId: task.id,
    fileName: task.fileName,
    status: 'done',
    modelId: model.id,
  });

  activeTasks.delete(task.id);
}

/**
 * 暫停下載
 */
export function pauseDownload(taskId: string): boolean {
  const task = activeTasks.get(taskId);
  if (!task || task.status !== 'downloading') return false;

  task.abortController?.abort();
  task.status = 'paused';
  return true;
}

/**
 * 取得所有下載任務狀態
 */
export function getDownloadTasks(): Omit<DownloadTask, 'abortController'>[] {
  return Array.from(activeTasks.values()).map(({ abortController, ...rest }) => rest);
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${Math.round(bytesPerSec)} B/s`;
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}
