const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const database = require('./config/database');
const trackRoutes = require('./routes/track');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const searchRoutes = require('./audio_cache/routes/search');
const streamRoutes = require('./routes/stream');
const aiRoutes = require('./routes/ai');
const playlistRoutes = require('./routes/playlist');
const authRoutes = require('./routes/auth');
const historyRoutes = require('./routes/history');

// ✅ UPDATED: Dynamic CORS for production
const allowedOrigins = [
  'http://localhost:5173',
  'http://100.84.3.61:3000',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Will be your Vercel URL
];

// Add any Vercel preview deployments
if (process.env.NODE_ENV === 'production') {
  allowedOrigins.push(/\.vercel\.app$/); // Allow all *.vercel.app domains
}

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      if (allowed instanceof RegExp) return allowed.test(origin);
      return false;
    })) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/tracks', trackRoutes);

// ✅ UPDATED: Remove local audio serving for cloud storage
// const audioDir = process.env.AUDIO_STORAGE_DIR || '/home/frank-loui-lapore/vibestream/audio';
// app.use('/audio', express.static(audioDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CheriFI Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test API key configuration
app.get('/api/config/test', async (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  const hasDBConfig = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
  const hasB2Config = !!(process.env.B2_KEY_ID && process.env.B2_APP_KEY && process.env.B2_BUCKET_NAME);

  // Test database connection
  let dbConnected = false;
  if (hasDBConfig) {
    try {
      dbConnected = await database.testConnection();
    } catch (error) {
      console.error('Database test failed:', error.message);
    }
  }

  res.json({
    openai_configured: hasOpenAIKey,
    youtube_configured: hasYouTubeKey,
    database_configured: hasDBConfig,
    database_connected: dbConnected,
    b2_storage_configured: hasB2Config, // ✅ NEW
    message: hasOpenAIKey && hasYouTubeKey && dbConnected && hasB2Config
      ? 'All services configured and connected ✅'
      : 'Some services missing or disconnected ❌'
  });
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await database.getStats();
    res.json({
      database: stats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/history', historyRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message
  });
});

// Initialize database
async function initializeDatabase() {
  try {
    console.log('🔌 Initializing database...');
    await database.ensureDatabase();
    await database.connect();
    await database.initializeTables();

    // Update tracks table for cloud storage
    console.log('🎵 Updating tracks table for cloud storage...');
    try {
      await database.query(`
        ALTER TABLE tracks 
        ADD COLUMN IF NOT EXISTS b2_key VARCHAR(255) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS is_cloud_stored BOOLEAN DEFAULT 0,
        ADD COLUMN IF NOT EXISTS file_size_mb FLOAT DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mime_type VARCHAR(50) DEFAULT 'audio/mpeg'
      `);
      console.log('✅ Tracks table updated');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('⚠️ Could not update tracks table:', error.message);
      }
    }

    // Create other tables...
    console.log('❤️ Creating liked_tracks table...');
    await database.query(`
      CREATE TABLE IF NOT EXISTS liked_tracks (
        user_id INT NOT NULL,
        track_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, track_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('👤 Creating users table...');
    await database.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT 1,
        INDEX idx_username (username),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('🔗 Updating playlists table...');
    try {
      await database.query(`
        ALTER TABLE playlists 
        ADD COLUMN user_id INT NULL AFTER id,
        ADD INDEX idx_user_playlists (user_id),
        ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      `);
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('⚠️ Could not add user_id to playlists:', error.message);
      }
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    throw error;
  }
}

// Start server
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log('\n🎵 CheriFI Backend Server Started');
      console.log('=====================================');
      console.log(`🌐 Server running on port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📋 Health check: /api/health`);
      console.log('=====================================\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await database.close();
  process.exit(0);
});

startServer();