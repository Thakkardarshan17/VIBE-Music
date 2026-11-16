import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { initDatabaseConnection, db } from './db/prisma.js';
import { seedDatabase } from './db/seed.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import musicRoutes from './routes/musicRoutes.js';
import playlistRoutes from './routes/playlistRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import meRoutes from './routes/meRoutes.js';
import youtubeRoutes from './routes/youtubeRoutes.js';

const app = express();

// Serverless warm-up middleware for Vercel
let dbReady = false;
app.use(async (req, res, next) => {
  if (!dbReady && process.env.VERCEL) {
    try {
      await initDatabaseConnection();
      await seedDatabase();
      dbReady = true;
    } catch (e) {
      console.warn('Serverless DB init warning:', e);
    }
  }
  next();
});

// Trust reverse proxy headers (Crucial for Vercel, Railway, Render, Cloudflare, Nginx)
app.set('trust proxy', 1);

// Security & Parsing Middleware with universal cross-origin support
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow any web origin, mobile browser, or native HTTP client
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-test-suite'],
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Rate Limiter
app.use('/api/', apiLimiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await db.checkHealth();
  res.json({
    status: 'online',
    appName: 'VIBE MUSIC API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: dbHealth,
  });
});

// Mount API routes with dual prefixes for universal compatibility (Vercel serverless + local standalone)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/music', '/music'], musicRoutes);
app.use(['/api/playlists', '/playlists'], playlistRoutes);
app.use(['/api/favorites', '/favorites'], favoriteRoutes);
app.use(['/api/history', '/history'], historyRoutes);
app.use(['/api/admin', '/admin'], adminRoutes);
app.use(['/api/search', '/search'], searchRoutes);
app.use(['/api/me', '/me'], meRoutes);
app.use(['/api/youtube', '/youtube'], youtubeRoutes);

// Fallback for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found on VIBE MUSIC server.` });
});

// Global Error Handler
app.use(errorHandler);

// Bootstrap Server & Database
async function startServer() {
  console.log('🚀 [VIBE MUSIC] Starting Server...');

  // Initialize DB & Seed
  await initDatabaseConnection();
  await seedDatabase();

  const server = app.listen(ENV.PORT, () => {
    console.log(`\n======================================================`);
    console.log(`🎵 VIBE MUSIC Server is live on http://localhost:${ENV.PORT}`);
    console.log(`🔗 API Base: http://localhost:${ENV.PORT}/api`);
    console.log(`📡 CORS active for: ${ENV.CLIENT_URL}`);
    console.log(`======================================================\n`);
  });

  return server;
}

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));
const isVercel = !!process.env.VERCEL;

if (!isTestEnv && !isVercel) {
  startServer().catch((err) => {
    console.error('Fatal error starting VIBE MUSIC Server:', err);
  });
}

export default app;

