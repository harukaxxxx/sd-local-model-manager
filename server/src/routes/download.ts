import { Router } from 'express';
import { startDownload, pauseDownload, getDownloadTasks } from '../services/downloader.js';

const router = Router();

// POST /api/models/download - 提交下載任務
router.post('/download', async (req, res) => {
  try {
    const { url, targetDir, modelType } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'url is required' });
    }

    if (!targetDir) {
      return res.status(400).json({ error: 'targetDir is required' });
    }

    const result = await startDownload(url, targetDir, modelType || 'Checkpoint');
    res.json({ success: true, taskId: result.taskId });
  } catch (error: any) {
    console.error('Error starting download:', error);
    res.status(500).json({ error: error.message || 'Failed to start download' });
  }
});

// POST /api/models/download/:taskId/pause - 暫停下載
router.post('/download/:taskId/pause', (req, res) => {
  const success = pauseDownload(req.params.taskId);
  res.json({ success });
});

// GET /api/models/download/tasks - 取得所有下載任務狀態
router.get('/download/tasks', (_req, res) => {
  res.json(getDownloadTasks());
});

export default router;
