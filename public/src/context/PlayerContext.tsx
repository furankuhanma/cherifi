
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Track } from '../types/types';
import { MOCK_TRACKS } from '../constants';

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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(MOCK_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);

  // Mock playback progress
  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && currentTrack) {
      interval = window.setInterval(() => {
        setProgress((prev) => {
          if (prev >= currentTrack.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack]);

  const playTrack = useCallback((track: Track) => {
    setCurrentTrack(track);
    setProgress(0);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const nextTrack = useCallback(() => {
    if (!currentTrack) return;
    const currentIndex = MOCK_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % MOCK_TRACKS.length;
    playTrack(MOCK_TRACKS[nextIndex]);
  }, [currentTrack, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack) return;
    const currentIndex = MOCK_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + MOCK_TRACKS.length) % MOCK_TRACKS.length;
    playTrack(MOCK_TRACKS[prevIndex]);
  }, [currentTrack, playTrack]);

  const seek = useCallback((seconds: number) => {
    setProgress(seconds);
  }, []);

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
