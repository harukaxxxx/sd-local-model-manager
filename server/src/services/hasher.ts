import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { stat } from 'node:fs/promises';

/**
 * 使用 Stream 計算檔案的 SHA256 Hash
 * 支援進度回報 callback
 */
export function computeHash(
  filePath: string,
  onProgress?: (percent: number) => void,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const fileInfo = await stat(filePath);
      const totalSize = fileInfo.size;
      let processedSize = 0;

      const hash = createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        processedSize += chunk.length;
        if (onProgress) {
          const percent = Math.round((processedSize / totalSize) * 100);
          onProgress(percent);
        }
      });

      stream.on('end', () => {
        const result = hash.digest('hex').toUpperCase();
        resolve(result);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}
