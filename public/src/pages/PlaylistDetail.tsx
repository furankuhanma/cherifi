
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Clock, ArrowLeft } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { playlists } = useLibrary();
  
  const playlist = playlists.find(p => p.id === id);

  if (!playlist) {
    return <div className="p-8 text-center">Playlist not found</div>;
  }

  const handlePlayPlaylist = () => {
    if (playlist.tracks.length > 0) {
      playTrack(playlist.tracks[0]);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 -mx-4 md:mx-0">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row items-end gap-6 p-4 md:p-0 md:mb-8 bg-gradient-to-b from-zinc-800 to-transparent pt-12 md:pt-0">
        <button onClick={() => navigate(-1)} className="md:hidden absolute top-4 left-4 bg-black bg-opacity-50 p-2 rounded-full">
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
            <span className="text-zinc-400">• {playlist.tracks.length} songs, approx. 18 min</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center gap-8 p-4 md:px-0 mb-6">
        <button 
          onClick={handlePlayPlaylist}
          className="w-14 h-14 bg-[#1DB954] rounded-full flex items-center justify-center text-black hover:scale-105 transition shadow-lg"
        >
          <Play size={28} className="ml-1 fill-current" />
        </button>
        <Heart size={32} className="text-zinc-400 hover:text-white transition cursor-pointer" />
        <MoreHorizontal size={32} className="text-zinc-400 hover:text-white transition cursor-pointer" />
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
          {playlist.tracks.length > 0 ? (
            playlist.tracks.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div 
                  key={track.id}
                  onClick={() => playTrack(track)}
                  className={`grid grid-cols-[auto_1fr_40px] md:grid-cols-[16px_1fr_1fr_40px] items-center gap-4 px-4 py-3 rounded-md hover:bg-zinc-800 transition cursor-pointer group`}
                >
                  <span className={`hidden md:inline text-sm ${isCurrent ? 'text-[#1DB954]' : 'text-zinc-400'}`}>
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-[2px] h-3">
                        <div className="w-1 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.1s' }} />
                        <div className="w-1 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.3s' }} />
                        <div className="w-1 bg-[#1DB954] animate-[bounce_0.6s_infinite]" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : index + 1}
                  </span>
                  
                  <div className="flex items-center gap-4 overflow-hidden">
                    <img src={track.coverUrl} className="w-10 h-10 md:hidden rounded" alt="" />
                    <div className="flex flex-col overflow-hidden">
                      <span className={`text-sm font-medium truncate ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                        {track.title}
                      </span>
                      <span className="text-xs text-zinc-400 truncate">{track.artist}</span>
                    </div>
                  </div>

                  <span className="hidden md:inline text-sm text-zinc-400 truncate">{track.album}</span>

                  <div className="text-xs text-zinc-400 text-right">
                    {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-20 text-center text-zinc-500 italic">
              This playlist is empty. Add some tracks!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistDetail;
