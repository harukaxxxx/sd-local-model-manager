import { Router } from 'express';
import { createModelSymlink } from '../services/symlink.js';

const router = Router();

// POST /api/models/:id/symlink - 建立軟連結
router.post('/:id/symlink', async (req, res) => {
  try {
    const modelId = parseInt(req.params.id);
    const { targetDir } = req.body;

    if (!targetDir) {
      return res.status(400).json({ error: 'targetDir is required' });
    }

    const result = await createModelSymlink(modelId, targetDir);
    res.json({ success: true, symlinkPath: result.symlinkPath });
  } catch (error: any) {
    console.error('Error creating symlink:', error);
    res.status(500).json({ error: error.message || 'Failed to create symlink' });
  }
});

export default router;
