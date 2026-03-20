import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { config } from './lib/config.js';
import { setupWebSocket } from './websocket/index.js';
import modelsRouter from './routes/models.js';
import scanRouter from './routes/scan.js';
import settingsRouter from './routes/settings.js';
import downloadRouter from './routes/download.js';
import symlinkRouter from './routes/symlink.js';
import filesRouter from './routes/files.js';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

// 靜態檔案 - 預覽圖
app.use('/previews', express.static(config.previewDir));

// Routes
app.use('/api/models', modelsRouter);
app.use('/api/scan', scanRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/models', downloadRouter);
app.use('/api/models', symlinkRouter);
app.use('/api/files', filesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket
const io = setupWebSocket(httpServer, config.corsOrigins);

// Export io for use in services
export { io };

httpServer.listen(config.port, () => {
  console.log(`🚀 Server running at http://localhost:${config.port}`);
});
