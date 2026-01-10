
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Smile, Frown, Zap, Coffee, Play } from 'lucide-react';
import { MOCK_TRACKS } from '../constants';
import { Track } from '../types/types';
import { usePlayer } from '../context/PlayerContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

type Mood = 'Happy' | 'Sad' | 'Energetic' | 'Relaxed' | 'Neutral';

const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hey! I'm your VibeStream Assistant. Tell me how you're feeling, and I'll suggest some music!",
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mood, setMood] = useState<Mood>('Neutral');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playTrack } = usePlayer();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const detectMood = (text: string): Mood => {
    const lowText = text.toLowerCase();
    if (lowText.includes('happy') || lowText.includes('good') || lowText.includes('great') || lowText.includes('love')) return 'Happy';
    if (lowText.includes('sad') || lowText.includes('bad') || lowText.includes('cry') || lowText.includes('lonely')) return 'Sad';
    if (lowText.includes('party') || lowText.includes('gym') || lowText.includes('energy') || lowText.includes('run') || lowText.includes('workout')) return 'Energetic';
    if (lowText.includes('chill') || lowText.includes('relax') || lowText.includes('sleep') || lowText.includes('tired')) return 'Relaxed';
    return 'Neutral';
  };

  const getSuggestedTracks = (detectedMood: Mood): Track[] => {
    switch (detectedMood) {
      case 'Happy': return [MOCK_TRACKS[2], MOCK_TRACKS[3], MOCK_TRACKS[0]]; // Levitating, Blinding Lights, Midnight City
      case 'Sad': return [MOCK_TRACKS[4], MOCK_TRACKS[6], MOCK_TRACKS[1]]; // Save Your Tears, Cold Heart, Starboy
      case 'Energetic': return [MOCK_TRACKS[0], MOCK_TRACKS[1], MOCK_TRACKS[7]]; // Midnight City, Starboy, Bad Habits
      case 'Relaxed': return [MOCK_TRACKS[5], MOCK_TRACKS[6], MOCK_TRACKS[4]]; // Heat Waves, Cold Heart, Save Your Tears
      default: return MOCK_TRACKS.slice(0, 4);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    const newMood = detectMood(userMsg.text);
    setMood(newMood);

    // Mock AI response delay
    setTimeout(() => {
      const aiResponses: Record<Mood, string> = {
        Happy: "I'm so glad to hear that! Energy is contagious. Here are some upbeat tracks to keep that vibe going!",
        Sad: "I'm sorry you're feeling down. Sometimes the right music can be a good companion. I've picked some soulful tracks for you.",
        Energetic: "Let's go! Time to push those limits. I've found some high-bpm tracks for your session.",
        Relaxed: "Taking it easy is essential. Lean back and listen to these smooth selections I've put together.",
        Neutral: "I hear you. Whatever you're up to, here's some great music to accompany your day!",
      };

      const aiMsg: Message = {
        id: Date.now() + 1,
        text: aiResponses[newMood],
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const moodIcons = {
    Happy: <Smile className="text-yellow-400" size={20} />,
    Sad: <Frown className="text-blue-400" size={20} />,
    Energetic: <Zap className="text-orange-400" size={20} />,
    Relaxed: <Coffee className="text-emerald-400" size={20} />,
    Neutral: <Sparkles className="text-[#1DB954]" size={20} />,
  };

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] md:h-[calc(100vh-120px)] animate-in fade-in duration-500">
      {/* Header / Mood Indicator */}
      <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-t-2xl border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1DB954]/20 rounded-full flex items-center justify-center border border-[#1DB954]/40">
            <Bot className="text-[#1DB954]" size={24} />
          </div>
          <div>
            <h2 className="font-bold text-sm">VibeStream AI</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-[#1DB954] rounded-full animate-pulse" />
              <span className="text-[10px] text-zinc-400">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800/80 px-3 py-1.5 rounded-full border border-zinc-700">
          <span className="text-xs text-zinc-300 font-medium">Mood: {mood}</span>
          {moodIcons[mood]}
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar"
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-sm animate-in zoom-in-95 duration-200 ${
                msg.sender === 'user' 
                  ? 'bg-[#1DB954] text-black rounded-tr-none font-medium' 
                  : 'bg-zinc-800 text-white rounded-tl-none'
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
              <span className={`text-[9px] block mt-1 opacity-60 ${msg.sender === 'user' ? 'text-black' : 'text-zinc-400'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in slide-in-from-left-2">
            <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggestions Section */}
      {mood !== 'Neutral' && (
        <div className="p-4 bg-zinc-900/30 border-t border-zinc-800/50">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Suggested for your mood</p>
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {getSuggestedTracks(mood).map((track) => (
              <div 
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex-shrink-0 w-32 group cursor-pointer"
              >
                <div className="relative aspect-square mb-2 overflow-hidden rounded-lg shadow-md">
                  <img src={track.coverUrl} alt="" className="object-cover w-full h-full transition group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="fill-white text-white" size={24} />
                  </div>
                </div>
                <h4 className="text-[11px] font-bold truncate text-zinc-100">{track.title}</h4>
                <p className="text-[9px] text-zinc-500 truncate">{track.artist}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Input */}
      <div className="p-4 bg-zinc-900 rounded-b-2xl">
        <div className="flex items-center gap-2 bg-zinc-800 p-1.5 pl-4 rounded-full border border-zinc-700 focus-within:border-[#1DB954] transition">
          <input 
            type="text" 
            placeholder="Tell me your vibe..." 
            className="flex-1 bg-transparent text-sm py-2 focus:outline-none placeholder:text-zinc-500"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="bg-[#1DB954] text-black p-2.5 rounded-full hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:hover:scale-100"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
