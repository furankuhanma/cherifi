const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

class AudioService {
  constructor() {
    // Audio storage directory (will be on your Ubuntu server)
    this.audioDir = process.env.AUDIO_STORAGE_DIR || '/var/www/vibestream/audio';
    this.tempDir = process.env.TEMP_STORAGE_DIR || '/tmp/vibestream';
    this.maxCacheSizeMB = parseInt(process.env.MAX_CACHE_SIZE_MB) || 5000;
    
    this.ensureDirectories();
  }

  /**
   * Ensure storage directories exist
   */
  async ensureDirectories() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
      console.log('✅ Audio directories initialized');
    } catch (error) {
      console.error('❌ Failed to create directories:', error);
    }
  }

  /**
   * Download and convert YouTube video to MP3
   * @param {string} videoId - YouTube video ID
   * @returns {Promise<Object>} - File path and metadata
   */
  async downloadAudio(videoId) {
    const outputFilename = `${videoId}.mp3`;
    const outputPath = path.join(this.audioDir, outputFilename);
    const tempPath = path.join(this.tempDir, `${videoId}_temp`);

    try {
      // Check if file already exists
      const exists = await this.fileExists(outputPath);
      if (exists) {
        console.log(`✅ Audio already cached: ${videoId}`);
        return {
          videoId,
          filePath: outputPath,
          url: `/audio/${outputFilename}`,
          cached: true
        };
      }

      console.log(`⬇️ Downloading audio for: ${videoId}`);

      // Download audio using yt-dlp (better than youtube-dl)
      await youtubedl(`https://www.youtube.com/watch?v=${videoId}`, {
        extractAudio: true,
        audioFormat: 'mp3',
        audioQuality: '192K',
        output: tempPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      // Find the downloaded file (yt-dlp adds extension)
      const files = await fs.readdir(this.tempDir);
      const downloadedFile = files.find(f => f.startsWith(`${videoId}_temp`));
      
      if (!downloadedFile) {
        throw new Error('Downloaded file not found');
      }

      const downloadedPath = path.join(this.tempDir, downloadedFile);

      // Convert to MP3 if not already (and normalize audio)
      await this.convertToMP3(downloadedPath, outputPath);

      // Clean up temp file
      await fs.unlink(downloadedPath).catch(() => {});

      console.log(`✅ Audio ready: ${videoId}`);

      // Check and cleanup old files if storage is full
      await this.cleanupOldFiles();

      return {
        videoId,
        filePath: outputPath,
        url: `/audio/${outputFilename}`,
        cached: false
      };

    } catch (error) {
      console.error(`❌ Download failed for ${videoId}:`, error.message);
      
      // Cleanup any partial downloads
      await this.cleanupTempFiles(videoId);
      
      throw new Error(`Failed to download audio: ${error.message}`);
    }
  }

  /**
   * Convert audio file to MP3 with normalization
   * @param {string} inputPath - Input file path
   * @param {string} outputPath - Output MP3 path
   */
  async convertToMP3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('mp3')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100)
        .audioFilters('loudnorm') // Normalize audio levels
        .on('end', () => {
          console.log('✅ Conversion completed');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Conversion error:', err);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * Check if file exists
   * @param {string} filePath
   * @returns {Promise<boolean>}
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file size in MB
   * @param {string} filePath
   * @returns {Promise<number>}
   */
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size / (1024 * 1024); // Convert to MB
    } catch {
      return 0;
    }
  }

  /**
   * Get total storage usage
   * @returns {Promise<number>} - Size in MB
   */
  async getStorageUsage() {
    try {
      const files = await fs.readdir(this.audioDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.audioDir, file);
        totalSize += await this.getFileSize(filePath);
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   * Cleanup old files if storage exceeds limit
   */
  async cleanupOldFiles() {
    try {
      const totalSize = await this.getStorageUsage();

      if (totalSize > this.maxCacheSizeMB) {
        console.log(`🧹 Storage full (${totalSize.toFixed(2)}MB), cleaning up...`);

        const files = await fs.readdir(this.audioDir);
        const fileStats = [];

        // Get file stats
        for (const file of files) {
          const filePath = path.join(this.audioDir, file);
          const stats = await fs.stat(filePath);
          fileStats.push({
            name: file,
            path: filePath,
            atime: stats.atime // Last access time
          });
        }

        // Sort by oldest access time
        fileStats.sort((a, b) => a.atime - b.atime);

        // Delete oldest 20% of files
        const deleteCount = Math.ceil(fileStats.length * 0.2);
        for (let i = 0; i < deleteCount; i++) {
          await fs.unlink(fileStats[i].path);
          console.log(`🗑️ Deleted: ${fileStats[i].name}`);
        }

        console.log(`✅ Cleaned up ${deleteCount} files`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  /**
   * Cleanup temp files for a video
   * @param {string} videoId
   */
  async cleanupTempFiles(videoId) {
    try {
      const files = await fs.readdir(this.tempDir);
      const tempFiles = files.filter(f => f.startsWith(`${videoId}_temp`));
      
      for (const file of tempFiles) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Delete specific audio file
   * @param {string} videoId
   */
  async deleteAudio(videoId) {
    const filePath = path.join(this.audioDir, `${videoId}.mp3`);
    try {
      await fs.unlink(filePath);
      console.log(`🗑️ Deleted audio: ${videoId}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get storage statistics
   * @returns {Promise<Object>}
   */
  async getStorageStats() {
    try {
      const files = await fs.readdir(this.audioDir);
      const totalSize = await this.getStorageUsage();
      
      return {
        totalFiles: files.length,
        totalSizeMB: parseFloat(totalSize.toFixed(2)),
        maxSizeMB: this.maxCacheSizeMB,
        usagePercent: parseFloat(((totalSize / this.maxCacheSizeMB) * 100).toFixed(2)),
        audioDir: this.audioDir
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = AudioService;