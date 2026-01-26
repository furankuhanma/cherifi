const express = require('express');
const router = express.Router();
const AudioService = require('../services/audioService');
const Track = require('../models/Track');
const { optionalAuth } = require('../middleware/auth');

const audioService = new AudioService();

/**
 * GET /api/stream/:videoId
 * Returns a signed B2 URL for streaming
 */
router.get('/:videoId', optionalAuth, async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user?.id;

  try {
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID',
        message: 'Video ID must be 11 characters'
      });
    }

    console.log(`🎵 Stream request: ${videoId}${userId ? ` (User: ${userId})` : ' (Anonymous)'}`);

    // Get audio (from B2 or download + upload)
    const audioData = await audioService.downloadAudio(videoId);

    // Record play
    if (userId && userId !== 'anonymous') {
      Track.recordPlay(videoId, userId).catch(err => {
        console.error('❌ Play log error:', err.message);
      });
    }

    // Redirect to B2 signed URL
    res.redirect(audioData.streamUrl);

  } catch (error) {
    console.error(`❌ Stream error for ${videoId}:`, error);
    res.status(500).json({ error: 'Streaming failed', message: error.message });
  }
});

/**
 * GET /api/stream/info/:videoId
 */
router.get('/info/:videoId', async (req, res) => {
  const { videoId } = req.params;
  try {
    const track = await Track.findByVideoId(videoId);
    res.json({
      videoId,
      title: track?.title || 'Unknown',
      artist: track?.artist || 'Unknown',
      cached: !!track
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get info', message: error.message });
  }
});

module.exports = router;