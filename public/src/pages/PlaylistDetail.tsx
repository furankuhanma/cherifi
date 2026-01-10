import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock, ArrowLeft, Trash2, Edit2, RefreshCw, Loader } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';
import { playlistAPI } from '../services/api';
import { Playlist } from '../types/types';

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying, setPlaylist: setPlayerPlaylist } = usePlayer();
  const { playlists, refreshPlaylists } = useLibrary();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load playlist from backend on mount and when id changes
  useEffect(() => {
    if (id) {
      loadPlaylist(id);
    }
  }, [id]);

  /**
   * Load playlist from backend
   */
  const loadPlaylist = async (playlistId: string, showLoader = true) => {
    if (showLoader) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      console.log(`📋 Loading playlist: ${playlistId}`);
      const data = await playlistAPI.getById(playlistId);
      setPlaylist(data);
      console.log(`✅ Loaded playlist with ${data.tracks?.length || 0} tracks`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load playlist';
      console.error('❌ Failed to load playlist:', errorMsg);
      setError(errorMsg);
      setPlaylist(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * Refresh playlist data
   */
  const handleRefresh = () => {
    if (id) {
      loadPlaylist(id, false);
    }
  };

  /**
   * Handle play entire playlist
   */
  const handlePlayPlaylist = () => {
    if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
      console.warn('⚠️ No tracks to play');
      return;
    }

    console.log('▶️ Playing playlist:', playlist.name);
    setPlayerPlaylist(playlist.tracks);
    playTrack(playlist.tracks[0]);
  };

  /**
   * Handle play specific track
   */
  const handlePlayTrack = (index: number) => {
    if (!playlist || !playlist.tracks || !playlist.tracks[index]) {
      return;
    }

    console.log(`▶️ Playing track: ${playlist.tracks[index].title}`);
    setPlayerPlaylist(playlist.tracks);
    playTrack(playlist.tracks[index]);
  };

  /**
   * Format duration to MM:SS
   */
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Calculate total playlist duration
   */
  const getTotalDuration = (): string => {
    if (!playlist || !playlist.tracks) return '0 min';
    
    const totalSeconds = playlist.tracks.reduce((acc, track) => acc + track.duration, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    }
    return `${minutes} min`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
        <div className="w-16 h-16 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-400">Loading playlist...</p>
      </div>
    );
  }

  // Error state
  if (error || !playlist) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] animate-in fade-in">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md text-center">
          <p className="text-red-400 mb-4">❌ {error || 'Playlist not found'}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => navigate('/library')}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm font-medium transition"
            >
              Go to Library
            </button>
            {id && (
              <button 
                onClick={() => loadPlaylist(id)}
                className="px-4 py-2 bg-[#1DB954] text-black hover:bg-[#1ed760] rounded-full text-sm font-medium transition"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 -mx-4 md:mx-0">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-4 md:p-0 md:mb-8 bg-gradient-to-b from-zinc-800 to-transparent pt-12 md:pt-0">
        <button 
          onClick={() => navigate(-1)} 
          className="md:hidden absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 transition"
        >
          <ArrowLeft size={24} />
        </button>
        
        <img 
          src={playlist.coverUrl} 
          alt={playlist.name} 
          className="w-48 h-48 md:w-64 md:h-64 shadow-2xl rounded-md mx-auto md:mx-0"
        />
        
        <div className="flex flex-col gap-2 text-center md:text-left">
          <span className="uppercase text-xs font-bold hidden md:inline">Playlist</span>
          <h1 className="text-3xl md:text-7xl font-bold tracking-tighter">{playlist.name}</h1>
          <p className="text-zinc-400 text-sm md:text-base mt-2">{playlist.description}</p>
          <div className="flex items-center gap-2 text-sm mt-4 justify-center md:justify-start">
            <span className="font-bold">VibeStream</span>
            <span className="text-zinc-400">
              • {playlist.tracks?.length || 0} songs, {getTotalDuration()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-6 p-4 md:px-0 mb-6">
        <button 
          onClick={handlePlayPlaylist}
          disabled={!playlist.tracks || playlist.tracks.length === 0}
          className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
        >
          <Play size={28} className="ml-1 fill-current" />
        </button>
        
        <Heart 
          size={32} 
          className="text-zinc-400 hover:text-white transition cursor-pointer" 
        />
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="text-zinc-400 hover:text-white transition disabled:opacity-50"
          title="Refresh playlist"
        >
          <RefreshCw size={28} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
        
        <MoreHorizontal 
          size={32} 
          className="text-zinc-400 hover:text-white transition cursor-pointer ml-auto" 
        />
      </div>

      {/* Track List */}
      <div className="bg-black bg-opacity-20 md:bg-transparent rounded-lg">
        {/* Header (Desktop) */}
        <div className="hidden md:grid grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 border-b border-zinc-800 text-zinc-400 text-sm mb-4">
          <span>#</span>
          <span>Title</span>
          <span>Album</span>
          <div className="flex justify-end"><Clock size={16} /></div>
        </div>

        {/* Tracks */}
        <div className="flex flex-col">
          {playlist.tracks && playlist.tracks.length > 0 ? (
            playlist.tracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id}
                  onClick={() => handlePlayTrack(index)}
                  className={`grid grid-cols-[auto_1fr_40px] md:grid-cols-[16px_1fr_1fr_40px] items-center gap-4 px-4 py-3 rounded-md hover:bg-zinc-800 transition cursor-pointer group ${
                    isCurrent ? 'bg-zinc-800/50' : ''
                  }`}
                >
                  <span className={`hidden md:inline text-sm ${isCurrent ? 'text-[#1DB954]' : 'text-zinc-400 group-hover:text-white'}`}>
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3">
                        <div className="w-1 h-2 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 h-3 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
                        <div className="w-1 h-2 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      index + 1
                    )}
                  </span>
                  
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="relative w-10 h-10 md:hidden rounded overflow-hidden flex-shrink-0">
                      <img src={track.coverUrl} alt="" className="object-cover w-full h-full" />
                      {isCurrent && isPlaying && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="flex items-end gap-[1px] h-3">
                            <div className="w-0.5 h-1 bg-white animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.1s' }} />
                            <div className="w-0.5 h-2 bg-white animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
                            <div className="w-0.5 h-1 bg-white animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.2s' }} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-sm font-medium truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">{track.artist}</span>
                    </div>
                  </div>

                  <span className="hidden md:inline text-sm text-zinc-400 truncate">{track.album}</span>

                  <div className="text-xs text-zinc-400 text-right">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center text-zinc-500 italic">
              <div className="mb-4">
                <Play size={64} className="mx-auto text-zinc-700" />
              </div>
              <p className="text-lg font-medium mb-2">This playlist is empty</p>
              <p className="text-sm mb-6">Add some tracks to get started!</p>
              <button 
                onClick={() => navigate('/search')}
                className="px-6 py-3 bg-[#1DB954] text-black rounded-full font-bold hover:scale-105 transition"
              >
                Search for Music
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Playlist Info Footer (Mobile) */}
      {playlist.tracks && playlist.tracks.length > 0 && (
        <div className="md:hidden mt-8 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
          <p className="text-xs text-zinc-500 mb-1">About this playlist</p>
          <p className="text-sm text-zinc-300">
            <span className="font-bold">{playlist.tracks.length}</span> songs • 
            <span className="font-bold"> {getTotalDuration()}</span>
          </p>
          {playlist.createdAt && (
            <p className="text-xs text-zinc-500 mt-2">
              Created {new Date(playlist.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaylistDetail;