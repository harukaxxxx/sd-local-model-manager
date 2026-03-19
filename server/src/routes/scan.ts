import { Router } from 'express';
import { scanDirectory } from '../services/scanner.js';

const router = Router();

// POST /api/scan - 觸發掃描
router.post('/', async (req, res) => {
  try {
    const { pathId } = req.body;
    // 開始非同步掃描，立即回應
    scanDirectory(pathId).catch((err) => {
      console.error('Scan error:', err);
    });
    res.json({ success: true, message: 'Scan started' });
  } catch (error) {
    console.error('Error starting scan:', error);
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

export default router;
