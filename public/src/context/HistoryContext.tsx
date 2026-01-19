import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Track } from '../types/types';
import { historyAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface HistoryContextType {
  recentlyPlayed: Track[];
  isLoading: boolean;
  addToHistory: (track: Track) => Promise<void>;
  clearHistory: () => Promise<void>;
  getRecentTracks: (limit?: number) => Track[];
  refreshHistory: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();

  /**
   * Load listening history from backend on mount
   */
  const fetchHistory = useCallback(async () => {
    if (!user) {
      setRecentlyPlayed([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('📜 Loading listening history from database...');
      const history = await historyAPI.getHistory(50);
      setRecentlyPlayed(history);
      console.log(`✅ Loaded ${history.length} tracks from history`);
    } catch (error) {
      console.error('❌ Failed to load history:', error);
      setRecentlyPlayed([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load history when user logs in
  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setRecentlyPlayed([]);
    }
  }, [user, fetchHistory]);

  /**
   * Add track to listening history
   * Updates both backend and local state
   */
  const addToHistory = useCallback(async (track: Track) => {
    if (!user) return;

    try {
      // Optimistic update - add to local state immediately
      setRecentlyPlayed((prev) => {
        // Remove track if it already exists (to avoid duplicates)
        const filtered = prev.filter((t) => t.id !== track.id);
        // Add track to the beginning
        return [track, ...filtered];
      });

      // Sync with backend
      await historyAPI.addToHistory(track);
      console.log(`📝 Added to history: ${track.title}`);
    } catch (error) {
      console.error('❌ Failed to add to history:', error);
      // Rollback on error - refresh from backend
      fetchHistory();
    }
  }, [user, fetchHistory]);

  /**
   * Clear all listening history
   */
  const clearHistory = useCallback(async () => {
    if (!user) return;

    try {
      // Optimistic update
      setRecentlyPlayed([]);

      // Sync with backend
      await historyAPI.clearHistory();
      console.log('🗑️ Listening history cleared');
    } catch (error) {
      console.error('❌ Failed to clear history:', error);
      // Rollback on error
      fetchHistory();
    }
  }, [user, fetchHistory]);

  /**
   * Get recent tracks with optional limit
   */
  const getRecentTracks = useCallback((limit: number = 20): Track[] => {
    return recentlyPlayed.slice(0, limit);
  }, [recentlyPlayed]);

  /**
   * Refresh history from backend
   */
  const refreshHistory = useCallback(async () => {
    await fetchHistory();
  }, [fetchHistory]);

  return (
    <HistoryContext.Provider
      value={{
        recentlyPlayed,
        isLoading,
        addToHistory,
        clearHistory,
        getRecentTracks,
        refreshHistory,
      }}
    >
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (!context) throw new Error('useHistory must be used within HistoryProvider');
  return context;
};