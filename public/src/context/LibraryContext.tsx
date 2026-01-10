
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Playlist } from '../types/types';
import { MOCK_PLAYLISTS } from '../constants';

interface LibraryContextType {
  playlists: Playlist[];
  addPlaylist: (name: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(MOCK_PLAYLISTS);

  const addPlaylist = useCallback((name: string) => {
    const newPlaylist: Playlist = {
      id: `user-p-${Date.now()}`,
      name: name || 'My New Playlist',
      description: 'A brand new playlist created by you.',
      coverUrl: `https://picsum.photos/seed/${Date.now()}/600/600`,
      tracks: [],
      type: 'playlist',
    };
    setPlaylists((prev) => [newPlaylist, ...prev]);
  }, []);

  return (
    <LibraryContext.Provider value={{ playlists, addPlaylist }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error('useLibrary must be used within LibraryProvider');
  return context;
};
