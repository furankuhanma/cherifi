const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const database = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Import routes
const searchRoutes = require('./audio_cache/routes/search');
const streamRoutes = require('./routes/stream');
const aiRoutes = require('./routes/ai');
const playlistRoutes = require('./routes/playlist');

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Serve static audio files from storage directory
const audioDir = process.env.AUDIO_STORAGE_DIR || '/var/www/vibestream/audio';
app.use('/audio', express.static(audioDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'VibeStream Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test API key configuration
app.get('/api/config/test', async (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  const hasDBConfig = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
  
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
    message: hasOpenAIKey && hasYouTubeKey && dbConnected
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
app.use('/api/search', searchRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/playlists', playlistRoutes);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
    availableRoutes: [
      'GET /api/health',
      'GET /api/config/test',
      'GET /api/stats',
      'GET /api/search?q=query',
      'GET /api/search/trending',
      'GET /api/stream/:videoId',
      'POST /api/ai/chat',
      'POST /api/ai/mood',
      'POST /api/ai/recommend',
      'GET /api/playlists',
      'POST /api/playlists',
      'GET /api/playlists/:id'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Ensure database exists
    console.log('🔌 Initializing database...');
    await database.ensureDatabase();
    
    // Connect to database
    await database.connect();
    
    // Initialize tables
    await database.initializeTables();
    
    console.log('✅ Database ready');

    // Start server
    app.listen(PORT, () => {
      console.log('\n🎵 VibeStream Backend Server Started');
      console.log('=====================================');
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔑 Config test: http://localhost:${PORT}/api/config/test`);
      console.log(`📊 Statistics: http://localhost:${PORT}/api/stats`);
      console.log('=====================================\n');
      console.log('Available API Endpoints:');
      console.log('  - GET  /api/search?q=query');
      console.log('  - GET  /api/search/trending');
      console.log('  - GET  /api/stream/:videoId');
      console.log('  - POST /api/ai/chat');
      console.log('  - POST /api/ai/recommend');
      console.log('  - GET  /api/playlists');
      console.log('  - POST /api/playlists');
      console.log('=====================================\n');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
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

// Start the server
startServer();