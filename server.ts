import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { connectDB, db } from './server/db.js';
import apiRouter from './server/routes.js';
import { initSocketIO } from './server/socket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Initialize real-time Socket.IO on the HTTP server
  initSocketIO(httpServer);
  console.log('⚡ Socket.IO real-time notification engine initialized.');

  // Parse JSON with generous limit for vehicle damage photos
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // Connect to Database (Mongoose if MONGO_URI present, or persistent fallback)
  await connectDB();

  // Mount API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    const dbStatus = db.getStatus();
    res.json({
      status: 'ok',
      service: 'SmartTag Emergency Vehicle Communication System',
      storageEngine: dbStatus.engine,
      databaseConnected: dbStatus.connected,
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      websocketsActive: true,
      timestamp: new Date().toISOString()
    });
  });

  if (!isProduction) {
    // Development mode: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    console.log('🚀 Vite dev server middleware mounted.');
  } else {
    // Production mode: serve built assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('🚀 Serving production static build from /dist.');
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ SmartTag server running on http://0.0.0.0:${PORT} (HTTP + WebSockets)`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
