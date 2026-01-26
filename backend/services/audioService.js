const youtubedl = require('youtube-dl-exec');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const Track = require('../models/Track');
const { uploadFile, fileExists, getStreamUrl } = require('../config/b2');

class AudioService {
  constructor() {
    // Use temp directory for downloads (will be uploaded to B2)
    this.tempDir = path.join(os.tmpdir(), 'cherifi-audio');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Temp audio directory initialized');
    } catch (error) {
      console.error('❌ Failed to create temp directory:', error);
    }
  }

  /**
   * Download from YouTube and upload to B2
   */
  async downloadAudio(videoId) {
    const filename = `${videoId}.mp3`;
    const tempPath = path.join(this.tempDir, filename);

    try {
      // 1. Check if already in B2
      const existsInB2 = await fileExists(filename);
      if (existsInB2) {
        console.log(`⚡ B2 cache hit: ${videoId}`);
        
        // Get metadata from DB
        const track = await Track.findByVideoId(videoId);
        const streamUrl = await getStreamUrl(filename);
        
        return {
          videoId,
          streamUrl,
          cached: true,
          metadata: track ? {
            title: track.title,
            artist: track.artist,
            album: track.album,
            thumbnail: track.coverUrl,
            duration: track.duration,
            uploader: track.channelTitle,
            channel: track.channelTitle,
            view_count: track.viewCount
          } : null
        };
      }

      console.log(`⬇️ Downloading from YouTube: ${videoId}`);

      // 2. Fetch metadata
      const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        skipDownload: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      const metadata = {
        title: info.title || 'Unknown Title',
        artist: info.artist || info.uploader || 'Unknown Artist',
        album: info.album || 'YouTube Music',
        thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails[0] ? info.thumbnails[0].url : ''),
        duration: info.duration || 0,
        uploader: info.uploader || 'Unknown',
        channel: info.channel || info.uploader || 'Unknown',
        view_count: info.view_count || 0
      };

      console.log(`📋 Metadata: ${metadata.title} - ${metadata.artist}`);

      // 3. Download audio to temp
      await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '9',
        output: tempPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      // 4. Wait for file to be ready
      let fileReady = false;
      let attempts = 0;
      while (!fileReady && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          await fs.access(tempPath);
          fileReady = true;
        } catch {
          attempts++;
        }
      }

      if (!fileReady) {
        throw new Error('Download completed but file not accessible');
      }

      console.log(`⬆️ Uploading to B2: ${filename}`);

      // 5. Upload to B2
      await uploadFile(tempPath, filename, 'audio/mpeg');

      // 6. Get file size
      const stats = await fs.stat(tempPath);
      const fileSizeMB = parseFloat((stats.size / (1024 * 1024)).toFixed(2));

      // 7. Update database
      await Track.save({
        videoId,
        title: metadata.title,
        artist: metadata.artist,
        album: metadata.album,
        coverUrl: metadata.thumbnail,
        duration: metadata.duration,
        channelTitle: metadata.uploader,
        viewCount: metadata.view_count
      });

      // 8. Clean up temp file
      try {
        await fs.unlink(tempPath);
      } catch (err) {
        console.warn('Could not delete temp file:', err.message);
      }

      console.log(`✅ Upload complete: ${videoId} (${fileSizeMB} MB)`);

      // 9. Return stream URL from B2
      const streamUrl = await getStreamUrl(filename);

      return {
        videoId,
        streamUrl,
        cached: false,
        metadata
      };

    } catch (error) {
      console.error(`❌ Download/upload failed for ${videoId}:`, error.message);
      
      // Cleanup temp file
      try {
        await fs.unlink(tempPath).catch(() => {});
      } catch {}
      
      throw error;
    }
  }

  /**
   * Get metadata without downloading
   */
  async getMetadata(videoId) {
    try {
      const info = await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        skipDownload: true
      });

      return {
        title: info.title || 'Unknown Title',
        artist: info.artist || info.uploader || 'Unknown Artist',
        album: info.album || 'YouTube Music',
        thumbnail: info.thumbnail || (info.thumbnails && info.thumbnails[0] ? info.thumbnails[0].url : ''),
        duration: info.duration || 0,
        uploader: info.uploader || 'Unknown',
        channel: info.channel || info.uploader || 'Unknown',
        view_count: info.view_count || 0
      };
    } catch (error) {
      console.error(`⚠️ Failed to fetch metadata for ${videoId}:`, error.message);
      return null;
    }
  }
}

module.exports = AudioService;