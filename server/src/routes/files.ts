import { Router } from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const router = Router();

// GET /api/files - 讀取檔案
router.get('/', async (req, res) => {
  const { path: filePath } = req.query;

  if (!filePath || typeof filePath !== 'string') {
    return res.status(400).json({ error: 'path is required' });
  }

  try {
    // 讀取檔案
    const buffer = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

    // 根據副檔名設定 content-type
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';
    res.set('Content-Type', contentType);
    res.send(buffer);
  } catch (error: any) {
    res.status(404).json({ error: 'File not found' });
  }
});

export default router;
