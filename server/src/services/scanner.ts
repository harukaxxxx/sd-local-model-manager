import prisma from '../lib/prisma.js';
import { getIO } from '../websocket/index.js';
import { computeHash } from './hasher.js';
import { fetchCivitaiByHash } from './civitai.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const MODEL_EXTENSIONS = ['.safetensors', '.ckpt', '.pt', '.pth'];

interface ScanResult {
  added: number;
  skipped: number;
  errors: string[];
}

/**
 * 掃描指定 ScanPath 的目錄
 */
export async function scanDirectory(pathId?: number): Promise<ScanResult> {
  const io = getIO();
  const result: ScanResult = { added: 0, skipped: 0, errors: [] };

  // 取得要掃描的路徑
  const scanPaths = pathId
    ? await prisma.scanPath.findMany({ where: { id: pathId } })
    : await prisma.scanPath.findMany();

  if (scanPaths.length === 0) {
    io.emit('scan_progress', { status: 'error', message: 'No scan paths configured' });
    return result;
  }

  io.emit('scan_progress', { status: 'started', total: scanPaths.length });

  for (const scanPath of scanPaths) {
    try {
      const files = await walkDirectory(scanPath.path);
      const modelFiles = files.filter((f) =>
        MODEL_EXTENSIONS.includes(path.extname(f).toLowerCase()),
      );

      io.emit('scan_progress', {
        status: 'scanning',
        path: scanPath.path,
        totalFiles: modelFiles.length,
      });

      for (let i = 0; i < modelFiles.length; i++) {
        const filePath = modelFiles[i];
        const fileName = path.basename(filePath);

        // 檢查是否已存在
        const existing = await prisma.model.findUnique({ where: { filePath } });
        if (existing) {
          result.skipped++;
          io.emit('scan_progress', {
            status: 'skipped',
            file: fileName,
            current: i + 1,
            total: modelFiles.length,
          });
          continue;
        }

        // 取得檔案大小
        const stat = await fs.stat(filePath);

        io.emit('scan_progress', {
          status: 'hashing',
          file: fileName,
          current: i + 1,
          total: modelFiles.length,
          percent: 0,
        });

        // 計算 SHA256
        const sha256 = await computeHash(filePath, (percent) => {
          io.emit('scan_progress', {
            status: 'hashing',
            file: fileName,
            current: i + 1,
            total: modelFiles.length,
            percent,
          });
        });

        // 寫入資料庫
        const model = await prisma.model.create({
          data: {
            name: path.parse(fileName).name,
            fileName,
            type: scanPath.modelType,
            filePath,
            fileSize: BigInt(stat.size),
            sha256,
          },
        });

        // 非同步查詢 CivitAI（不阻塞掃描流程）
        fetchCivitaiByHash(sha256, model.id).catch((err) => {
          console.error(`CivitAI lookup failed for ${fileName}:`, err);
        });

        result.added++;
        io.emit('scan_progress', {
          status: 'added',
          file: fileName,
          current: i + 1,
          total: modelFiles.length,
        });
      }
    } catch (error: any) {
      result.errors.push(`${scanPath.path}: ${error.message}`);
      io.emit('scan_progress', {
        status: 'error',
        path: scanPath.path,
        message: error.message,
      });
    }
  }

  io.emit('scan_progress', {
    status: 'completed',
    ...result,
  });

  return result;
}

/**
 * 遞迴遍歷目錄
 */
async function walkDirectory(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDirectory(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}
