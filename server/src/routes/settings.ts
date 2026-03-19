import { Router } from 'express';
import prisma from '../lib/prisma.js';
import fs from 'node:fs/promises';

const router = Router();

// GET /api/settings/scan-paths - 取得掛載點列表
router.get('/scan-paths', async (_req, res) => {
  try {
    const paths = await prisma.scanPath.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(paths);
  } catch (error) {
    console.error('Error fetching scan paths:', error);
    res.status(500).json({ error: 'Failed to fetch scan paths' });
  }
});

// POST /api/settings/scan-paths - 新增掛載點
router.post('/scan-paths', async (req, res) => {
  try {
    const { path: dirPath, modelType } = req.body;

    if (!dirPath || !modelType) {
      return res.status(400).json({ error: 'path and modelType are required' });
    }

    // 驗證路徑是否存在
    try {
      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        return res.status(400).json({ error: 'Path is not a directory' });
      }
    } catch {
      return res.status(400).json({ error: 'Path does not exist' });
    }

    const scanPath = await prisma.scanPath.create({
      data: { path: dirPath, modelType },
    });

    res.json(scanPath);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Path already exists' });
    }
    console.error('Error creating scan path:', error);
    res.status(500).json({ error: 'Failed to create scan path' });
  }
});

// DELETE /api/settings/scan-paths/:id - 刪除掛載點
router.delete('/scan-paths/:id', async (req, res) => {
  try {
    await prisma.scanPath.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting scan path:', error);
    res.status(500).json({ error: 'Failed to delete scan path' });
  }
});

export default router;
