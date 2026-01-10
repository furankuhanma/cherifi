
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_TRACKS } from '../constants';
import { Play } from 'lucide-react';
import { Playlist, Track } from '../types/types';
import { usePlayer } from '../context/PlayerContext';
import { useLibrary } from '../context/LibraryContext';

interface PlaylistCardProps {
  playlist: Playlist;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const navigate = useNavigate();
  return (
    <div 
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer w-[160px] md:w-[200px] flex-shrink-0"
    >
      <div className="relative mb-4 aspect-square shadow-lg overflow-hidden rounded-md">
        <img src={playlist.coverUrl} alt={playlist.name} className="object-cover w-full h-full" />
        <button className="absolute bottom-2 right-2 bg-[#1DB954] p-3 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
          <Play size={20} className="text-black fill-current" />
        </button>
      </div>
      <h3 className="font-bold text-sm md:text-base truncate mb-1">{playlist.name}</h3>
      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{playlist.description}</p>
    </div>
  );
};

interface HistoryCardProps {
  track: Track;
}

const HistoryCard: React.FC<HistoryCardProps> = ({ track }) => {
  const { playTrack } = usePlayer();
  return (
    <div 
      onClick={() => playTrack(track)}
      className="bg-zinc-900 bg-opacity-40 p-3 rounded-lg hover:bg-zinc-800 transition group cursor-pointer w-[140px] md:w-[180px] flex-shrink-0"
    >
      <div className="relative mb-3 aspect-square shadow-md overflow-hidden rounded-lg">
        <img src={track.coverUrl} alt={track.title} className="object-cover w-full h-full transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
            <button className="bg-[#1DB954] p-3 rounded-full shadow-2xl opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition duration-300">
              <Play size={20} className="text-black fill-current" />
            </button>
        </div>
      </div>
      <h3 className="font-bold text-xs md:text-sm truncate text-white">{track.title}</h3>
      <p className="text-[10px] md:text-xs text-zinc-400 truncate mt-0.5">{track.artist}</p>
    </div>
  );
};

const Home: React.FC = () => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const { playlists } = useLibrary();

  // Slice a mix of tracks for the "Recently Played" history section
  const historyTracks = MOCK_TRACKS.slice(0, 8);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* 1. Greeting & Quick Grid */}
      <header>
        <h1 className="text-2xl md:text-4xl font-black mb-6 tracking-tight">{greeting}</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {playlists.slice(0, 6).map((playlist) => (
            <div 
              key={playlist.id} 
              className="flex items-center gap-3 bg-white bg-opacity-5 rounded overflow-hidden hover:bg-white hover:bg-opacity-10 transition-all cursor-pointer group h-14 md:h-20"
              onClick={() => {}}
            >
              <img src={playlist.coverUrl} alt="" className="w-14 md:w-20 h-full object-cover shadow-2xl" />
              <span className="font-bold text-xs md:text-base pr-4 line-clamp-1">{playlist.name}</span>
              <button className="ml-auto mr-4 bg-[#1DB954] p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 shadow-xl hidden md:block">
                <Play size={18} className="text-black fill-current" />
              </button>
            </div>
          ))}
        </div>
      </header>

      {/* 2. Recently Played / Listening History Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">Listening History</h2>
          <button className="text-xs font-bold text-zinc-400 hover:underline">Show all</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth">
          {historyTracks.map(track => <HistoryCard key={track.id} track={track} />)}
        </div>
      </section>

      {/* 3. Made for You */}
      <section>
        <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight">Made for You</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {playlists.map(p => <PlaylistCard key={p.id} playlist={p} />)}
        </div>
      </section>

      {/* 4. Popular Playlists */}
      <section className="pb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4 tracking-tight">Jump Back In</h2>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {[...playlists].reverse().map(p => <PlaylistCard key={p.id} playlist={p} />)}
        </div>
      </section>
    </div>
  );
};

export default Home;
