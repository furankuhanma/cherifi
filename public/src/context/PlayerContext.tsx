import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Track } from '../types/types';
import { streamAPI } from '../services/api';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  volume: number;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setVolume: (vol: number) => void;
  seek: (seconds: number) => void;
  playlist: Track[];
  setPlaylist: (tracks: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playlist, setPlaylist] = useState<Track[]>([]);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    // Audio event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleTrackEnd);
    audio.addEventListener('error', handleAudioError);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleTrackEnd);
      audio.removeEventListener('error', handleAudioError);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Handle time update
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
    }
  };

  // Handle track end
  const handleTrackEnd = () => {
    console.log('🎵 Track ended, playing next...');
    nextTrack();
  };

  // Handle audio error
  const handleAudioError = (e: Event) => {
    console.error('❌ Audio playback error:', e);
    setIsPlaying(false);
    // Could show toast notification here
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    console.log('✅ Audio metadata loaded');
  };

  // Play a track
  const playTrack = useCallback((track: Track) => {
    if (!track || !track.videoId) {
      console.error('❌ Invalid track data');
      return;
    }

    console.log('🎵 Playing track:', track.title);
    setCurrentTrack(track);
    setProgress(0);

    // Get stream URL from backend
    const streamUrl = streamAPI.getStreamUrl(track.videoId);
    
    if (audioRef.current) {
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      
      // Play audio
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('✅ Playback started');
        })
        .catch((error) => {
          console.error('❌ Playback failed:', error);
          setIsPlaying(false);
        });
    }
  }, []);

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('⏸️ Paused');
    } else {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          console.log('▶️ Resumed');
        })
        .catch((error) => {
          console.error('❌ Resume failed:', error);
        });
    }
  }, [isPlaying, currentTrack]);

  // Next track
  const nextTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    
    console.log('⏭️ Next track');
    playTrack(playlist[nextIndex]);
  }, [currentTrack, playlist, playTrack]);

  // Previous track
  const prevTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    
    console.log('⏮️ Previous track');
    playTrack(playlist[prevIndex]);
  }, [currentTrack, playlist, playTrack]);

  // Seek to position
  const seek = useCallback((seconds: number) => {
    if (audioRef.current && currentTrack) {
      audioRef.current.currentTime = Math.min(seconds, currentTrack.duration);
      setProgress(seconds);
      console.log(`⏩ Seeked to ${seconds}s`);
    }
  }, [currentTrack]);

  // Set volume
  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        volume,
        playTrack,
        togglePlay,
        nextTrack,
        prevTrack,
        setVolume,
        seek,
        playlist,
        setPlaylist,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error('usePlayer must be used within PlayerProvider');
  return context;
};