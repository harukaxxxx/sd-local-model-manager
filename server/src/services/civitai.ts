import prisma from '../lib/prisma.js';
import { config } from '../lib/config.js';
import fs from 'node:fs/promises';
import path from 'node:path';

const CIVITAI_API_BASE = 'https://civitai.com/api/v1';

interface CivitaiVersionResponse {
  id: number;
  modelId: number;
  name: string;
  baseModel: string;
  description?: string;
  model: {
    name: string;
    type: string;
    tags: string[];
  };
  images: Array<{
    url: string;
    nsfwLevel: number;
    width: number;
    height: number;
  }>;
}

/**
 * 透過 SHA256 Hash 查詢 CivitAI API，更新模型資料
 */
export async function fetchCivitaiByHash(hash: string, modelId: number): Promise<void> {
  try {
    const response = await fetch(`${CIVITAI_API_BASE}/model-versions/by-hash/${hash}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`CivitAI: No match found for hash ${hash.substring(0, 10)}...`);
        return;
      }
      throw new Error(`CivitAI API returned ${response.status}`);
    }

    const data: CivitaiVersionResponse = await response.json();

    // 處理 Tags
    const tagNames = data.model.tags || [];
    for (const tagName of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName },
        create: { name: tagName },
        update: {},
      });

      await prisma.modelTag.upsert({
        where: { modelId_tagId: { modelId, tagId: tag.id } },
        create: { modelId, tagId: tag.id },
        update: {},
      });
    }

    // 取得模型的 filePath
    const model = await prisma.model.findUnique({
      where: { id: modelId },
      select: { filePath: true },
    });

    if (!model?.filePath) {
      console.warn(`Model ${modelId} has no filePath, skipping preview check`);
    }

    // 檢查本地是否已有預覽圖
    let previewUrl: string | null = null;
    if (model?.filePath) {
      const modelDir = path.dirname(model.filePath);
      const modelName = path.parse(model.filePath).name;

      // 檢查模型目錄中是否存在預覽圖
      const previewExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
      for (const ext of previewExtensions) {
        const previewPath = path.join(modelDir, `${modelName}${ext}`);
        try {
          await fs.access(previewPath);
          // 檔案存在
          previewUrl = previewPath;
          break;
        } catch {
          // 檔案不存在，繼續檢查下一個副檔名
        }
      }

      // 如果本地沒有預覽圖，從 CivitAI 下載
      if (!previewUrl && data.images && data.images.length > 0) {
        const previewImage = data.images.find((img) => img.nsfwLevel <= 2) || data.images[0];
        if (previewImage) {
          previewUrl = await downloadPreview(previewImage.url, modelDir, modelName);
        }
      }
    }

    // 更新 Model
    await prisma.model.update({
      where: { id: modelId },
      data: {
        name: data.model.name,
        civitaiId: data.id,
        civitaiModelId: data.modelId,
        baseModel: data.baseModel,
        description: data.description || null,
        previewUrl,
      },
    });

    console.log(`CivitAI: Updated model ${modelId} with data from ${data.model.name}`);
  } catch (error) {
    console.error(`CivitAI lookup failed for model ${modelId}:`, error);
    throw error;
  }
}

/**
 * 下載預覽圖到模型目錄
 */
async function downloadPreview(imageUrl: string, modelDir: string, modelName: string): Promise<string> {
  const ext = path.extname(new URL(imageUrl).pathname) || '.jpeg';
  const fileName = `${modelName}${ext}`;
  const filePath = path.join(modelDir, fileName);

  // 確保模型目錄存在
  await fs.mkdir(modelDir, { recursive: true });

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download preview: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // 回傳完整檔案路徑
  return filePath;
}
