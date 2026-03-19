import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import prisma from '../lib/prisma.js';

/**
 * 為模型建立 Symlink
 * Windows 上使用 junction（不需管理員權限），Unix 上使用 symbolic link
 */
export async function createModelSymlink(
  modelId: number,
  targetDir: string,
): Promise<{ symlinkPath: string }> {
  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model) {
    throw new Error('Model not found');
  }

  // 確認來源檔案存在
  if (!existsSync(model.filePath)) {
    throw new Error(`Source file not found: ${model.filePath}`);
  }

  // 確保目標目錄存在
  await fs.mkdir(targetDir, { recursive: true });

  const symlinkPath = path.join(targetDir, model.fileName);

  // 檢查目標是否已存在
  if (existsSync(symlinkPath)) {
    const stat = await fs.lstat(symlinkPath);
    if (stat.isSymbolicLink()) {
      // 已經是 symlink，檢查是否指向同一檔案
      const existingTarget = await fs.readlink(symlinkPath);
      if (path.resolve(existingTarget) === path.resolve(model.filePath)) {
        return { symlinkPath }; // 已存在且正確
      }
      // 指向不同檔案，先刪除
      await fs.unlink(symlinkPath);
    } else {
      throw new Error(`Target already exists and is not a symlink: ${symlinkPath}`);
    }
  }

  // 建立 symlink
  // Windows 上對檔案使用 'file' type，對目錄使用 'junction'
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    // Windows 上建立 hard link 比較不需要權限問題
    // 但跨磁碟不能用 hard link，所以還是用 symlink
    try {
      await fs.symlink(model.filePath, symlinkPath, 'file');
    } catch (err: any) {
      if (err.code === 'EPERM') {
        // 權限不足，嘗試用 hard link（僅同磁碟有效）
        try {
          await fs.link(model.filePath, symlinkPath);
        } catch {
          throw new Error(
            'Symlink creation failed: insufficient permissions. ' +
            'Run as administrator or enable Developer Mode in Windows Settings.',
          );
        }
      } else {
        throw err;
      }
    }
  } else {
    await fs.symlink(model.filePath, symlinkPath);
  }

  return { symlinkPath };
}

/**
 * 列出模型的所有 symlink
 */
export async function listSymlinks(modelId: number): Promise<string[]> {
  // 此功能在未來可以擴充為從 DB 查詢已建立的 symlink 記錄
  // 目前僅回傳空陣列
  return [];
}
