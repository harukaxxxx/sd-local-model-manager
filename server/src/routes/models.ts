import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/models - 模型列表（分頁 + 過濾）
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string | undefined;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;

    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.name = { contains: search };
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    const [models, total] = await Promise.all([
      prisma.model.findMany({
        where,
        include: {
          tags: {
            include: { tag: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.model.count({ where }),
    ]);

    // 轉換 BigInt 為 string (JSON 不支援 BigInt)
    const serialized = models.map((m) => ({
      ...m,
      fileSize: m.fileSize.toString(),
      tags: m.tags.map((t) => t.tag.name),
    }));

    res.json({
      data: serialized,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching models:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

// GET /api/models/:id - 單一模型詳情
router.get('/:id', async (req, res) => {
  try {
    const model = await prisma.model.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    res.json({
      ...model,
      fileSize: model.fileSize.toString(),
      tags: model.tags.map((t) => t.tag.name),
    });
  } catch (error) {
    console.error('Error fetching model:', error);
    res.status(500).json({ error: 'Failed to fetch model' });
  }
});

// DELETE /api/models/:id - 從資料庫移除（不刪檔案）
router.delete('/:id', async (req, res) => {
  try {
    await prisma.model.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting model:', error);
    res.status(500).json({ error: 'Failed to delete model' });
  }
});

export default router;
