const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'VibeStream Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Test API key configuration
app.get('/api/config/test', (req, res) => {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;
  
  res.json({
    openai_configured: hasOpenAIKey,
    youtube_configured: hasYouTubeKey,
    message: hasOpenAIKey && hasYouTubeKey 
      ? 'All API keys configured ✅' 
      : 'Missing API keys - check .env file ❌'
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

// Start server
app.listen(PORT, () => {
  console.log(`🎵 VibeStream Backend running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔑 Config test: http://localhost:${PORT}/api/config/test`);
});