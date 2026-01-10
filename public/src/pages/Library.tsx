
import React, { useState } from 'react';
import { Music, Mic2, Disc, Play } from 'lucide-react';
import { useLibrary } from '../context/LibraryContext';
import { useNavigate } from 'react-router-dom';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playlists' | 'artists' | 'albums'>('playlists');
  const { playlists } = useLibrary();
  const navigate = useNavigate();

  const tabs = [
    { id: 'playlists', name: 'Playlists', icon: <Music size={18} /> },
    { id: 'artists', name: 'Artists', icon: <Mic2 size={18} /> },
    { id: 'albums', name: 'Albums', icon: <Disc size={18} /> },
  ];

  const renderContent = () => {
    if (activeTab === 'playlists') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {playlists.map((playlist) => (
            <div 
              key={playlist.id} 
              onClick={() => navigate(`/playlist/${playlist.id}`)}
              className="bg-zinc-900 bg-opacity-40 p-4 rounded-lg hover:bg-zinc-800 transition group cursor-pointer"
            >
              <div className="relative mb-4 aspect-square shadow-lg overflow-hidden rounded-md">
                <img src={playlist.coverUrl} alt={playlist.name} className="object-cover w-full h-full" />
                <button className="absolute bottom-2 right-2 bg-[#1DB954] p-3 rounded-full shadow-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition duration-300">
                  <Play size={20} className="text-black fill-current" />
                </button>
              </div>
              <h3 className="font-bold text-sm md:text-base truncate mb-1">{playlist.name}</h3>
              <p className="text-xs text-zinc-500 line-clamp-1 leading-relaxed">Playlist • VibeStream</p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="bg-zinc-800 p-8 rounded-full">
          {activeTab === 'artists' ? <Mic2 size={64} className="text-zinc-400" /> : <Disc size={64} className="text-zinc-400" />}
        </div>
        <div className="max-w-xs">
          <h3 className="text-xl font-bold mb-2">Build your collection</h3>
          <p className="text-zinc-400 text-sm">Follow your favorite artists and albums to see them here.</p>
        </div>
        <button 
          onClick={() => navigate('/search')}
          className="bg-white text-black px-8 py-3 rounded-full font-bold hover:scale-105 transition mt-4"
        >
          Browse Categories
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold">Your Library</h1>
      </div>
      
      <div className="flex items-center gap-4 border-b border-zinc-800 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-2 py-2 text-sm font-bold transition ${activeTab === tab.id ? 'text-[#1DB954] border-b-2 border-[#1DB954]' : 'text-zinc-400 hover:text-white'}`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      <div>
        {renderContent()}
      </div>
    </div>
  );
};

export default Library;
