import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, Smile, Frown, Zap, Coffee, Play } from 'lucide-react';
import { Track } from '../types/types';
import { usePlayer } from '../context/PlayerContext';
import { aiAPI } from '../services/api';

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
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { playTrack, setPlaylist } = usePlayer();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  /**
   * Send message to AI
   */
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

    try {
      // Build conversation history for API
      const conversationHistory = messages
        .filter(m => m.sender === 'user' || m.sender === 'ai')
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }));

      // Add current message
      conversationHistory.push({
        role: 'user',
        content: userMsg.text
      });

      console.log('💬 Sending message to AI...');
      
      // Send to AI with mood detection
      const response = await aiAPI.chat(conversationHistory, true);

      // Add AI response
      const aiMsg: Message = {
        id: Date.now() + 1,
        text: response.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Update mood if detected
      if (response.mood) {
        const detectedMood = response.mood.mood;
        console.log(`🎭 Detected mood: ${detectedMood} (${response.mood.confidence})`);
        setMood(detectedMood);

        // Get music recommendations for the detected mood
        if (detectedMood !== 'Neutral') {
          loadRecommendations(detectedMood);
        }
      }

    } catch (error: any) {
      console.error('❌ AI chat error:', error);
      
      const errorMsg: Message = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again!",
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  /**
   * Load music recommendations based on mood
   */
  const loadRecommendations = async (detectedMood: Mood) => {
    setIsLoadingRecommendations(true);

    try {
      console.log(`🎵 Getting recommendations for mood: ${detectedMood}`);
      
      const response = await aiAPI.recommend(detectedMood, '', true);
      
      if (response.tracks && response.tracks.length > 0) {
        setRecommendations(response.tracks);
        console.log(`✅ Got ${response.tracks.length} recommendations`);
      }
    } catch (error: any) {
      console.error('❌ Failed to get recommendations:', error);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  /**
   * Handle track click
   */
  const handleTrackClick = (track: Track) => {
    setPlaylist(recommendations);
    playTrack(track);
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
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Suggested for your mood
            </p>
            {isLoadingRecommendations && (
              <div className="w-4 h-4 border-2 border-[#1DB954] border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {isLoadingRecommendations ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 w-32">
                  <div className="aspect-square bg-zinc-800 rounded-lg mb-2 animate-pulse" />
                  <div className="h-3 bg-zinc-800 rounded mb-1 animate-pulse" />
                  <div className="h-2 bg-zinc-800 rounded w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {recommendations.slice(0, 5).map((track) => (
                <div 
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
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
          ) : (
            <p className="text-xs text-zinc-500 text-center py-4">
              Loading recommendations...
            </p>
          )}
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
            disabled={isTyping}
          />
          <button 
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
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