import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const clientPort = process.env.CLIENT_PORT || '5173';

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  previewDir: path.resolve(__dirname, '../../data/previews'),
  corsOrigins: [
    `http://localhost:${clientPort}`,
    'http://localhost:3000',
  ],
};
