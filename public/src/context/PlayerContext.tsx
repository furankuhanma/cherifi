import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { Track } from "../types/types";
import { streamAPI, searchAPI, aiAPI } from "../services/api";
import { useDownloads } from "./DownloadContext";
import { useHistory } from "./HistoryContext";

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
  isPlayingOffline: boolean;
  playbackMode: PlaybackMode;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  refreshSmartShuffle: (track: Track) => Promise<void>;
}

interface Toast {
  message: string;
  visible: boolean;
}

export type PlaybackMode = "normal" | "repeat-one" | "smart-shuffle";

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { addToHistory } = useHistory();

  const [toast, setToast] = useState<Toast>({ message: "", visible: false });
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("normal");
  const [aiQueue, setAiQueue] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [isPlayingOffline, setIsPlayingOffline] = useState(false);

  // ✅ NEW: Track which song has been prefetched
  const prefetchedTrackRef = useRef<string | null>(null);
  const hasPrefetchedRef = useRef<boolean>(false);

  // ============================================
  // 🎵 REPLACE the refreshSmartShuffle function in PlayerContext.tsx
  // Find this function (around line 47) and REPLACE it with this:
  // ============================================

  const refreshSmartShuffle = useCallback(
    async (track: Track) => {
      try {
        console.log(
          "🎯 Fetching Spotify-style recommendations for:",
          track.title,
        );

        // Get last 5 tracks from playlist for context
        const recentTracks = playlist.slice(-5);

        // Call new AI-powered recommendations endpoint
        const { analysis, recommendations } =
          await aiAPI.getSmartRecommendations(
            track,
            recentTracks,
            20, // Get 20 recommendations for better variety
          );

        if (recommendations.length === 0) {
          console.warn("⚠️ No AI recommendations, falling back to search");
          // Fallback to simple search if AI fails
          const fallbackResults = await searchAPI.search(`${track.artist} mix`);
          const filtered = fallbackResults
            .filter((t) => t.videoId !== track.videoId)
            .slice(0, 15);
          setAiQueue(filtered);
          return filtered;
        }

        console.log(`✅ Got ${recommendations.length} smart recommendations`);
        console.log(`📊 Genre: ${analysis.genre}, Mood: ${analysis.mood}`);

        setAiQueue(recommendations);
        return recommendations;
      } catch (err) {
        console.error("❌ Smart Shuffle failed:", err);

        // Fallback: Use simple search if AI completely fails
        try {
          console.log("🔄 Using fallback search...");
          const fallbackResults = await searchAPI.search(
            `${track.artist} similar`,
          );
          const filtered = fallbackResults
            .filter((t) => t.videoId !== track.videoId)
            .slice(0, 15);
          setAiQueue(filtered);
          return filtered;
        } catch (fallbackErr) {
          console.error("❌ Fallback also failed:", fallbackErr);
          return [];
        }
      }
    },
    [playlist],
  );

  // ============================================
  // Important: Add aiAPI to the imports at the top of the file:
  // import { streamAPI, searchAPI, aiAPI } from "../services/api";
  // ============================================

  const { isDownloaded, getOfflineAudioUrl } = useDownloads();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 2000);
  };

  const toggleShuffle = useCallback(() => {
    setPlaybackMode((prev) => {
      const newMode = prev === "smart-shuffle" ? "normal" : "smart-shuffle";
      showToast(
        newMode === "smart-shuffle" ? "smart-shuffle on" : "shuffle off",
      );
      if (newMode === "smart-shuffle" && currentTrack) {
        refreshSmartShuffle(currentTrack);
      }
      return newMode;
    });
  }, [currentTrack, refreshSmartShuffle]);

  const toggleRepeat = useCallback(() => {
    setPlaybackMode((prev) => {
      const newMode = prev === "repeat-one" ? "normal" : "repeat-one";
      showToast(newMode === "repeat-one" ? "repeat song" : "repeat off");
      return newMode;
    });
  }, []);

  // ✅ NEW: Get the next track that will play
  const getNextTrack = useCallback((): Track | null => {
    if (!currentTrack) return null;

    if (playbackMode === "repeat-one") {
      return currentTrack; // Same track repeats
    }

    if (playbackMode === "smart-shuffle" && aiQueue.length > 0) {
      return aiQueue[0]; // Next AI recommendation
    }

    if (playlist.length === 0) return null;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    return playlist[nextIndex];
  }, [currentTrack, playlist, playbackMode, aiQueue]);

  // ✅ NEW: Prefetch next track in background
  const prefetchNextTrack = useCallback(async () => {
    const nextTrack = getNextTrack();

    if (!nextTrack || !nextTrack.videoId) {
      console.log("⏭️ No next track to prefetch");
      return;
    }

    // Don't prefetch if already downloaded or already prefetched
    if (isDownloaded(nextTrack.id)) {
      console.log("✅ Next track already cached:", nextTrack.title);
      return;
    }

    if (prefetchedTrackRef.current === nextTrack.videoId) {
      console.log("✅ Next track already prefetching:", nextTrack.title);
      return;
    }

    try {
      console.log("⬇️ Prefetching next track:", nextTrack.title);
      prefetchedTrackRef.current = nextTrack.videoId;

      // ✅ Call dedicated prefetch endpoint that downloads without streaming
      const token = localStorage.getItem("auth_token");
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;

      const response = await fetch(
        `${BASE_URL}/api/stream/prefetch/${nextTrack.videoId}`,
        {
          method: "POST",
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `✅ Prefetch complete: ${nextTrack.title} (${data.cached ? "was cached" : "downloaded"})`,
        );
      } else {
        throw new Error(`Prefetch failed: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Prefetch failed:", error);
      prefetchedTrackRef.current = null;
    }
  }, [getNextTrack, isDownloaded]);

  // ✅ ENHANCED: Handle time update with prefetch trigger
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const currentTime = audioRef.current.currentTime;
      setProgress(currentTime);

      // ✅ Trigger prefetch at 50% progress
      const progressPercent = (currentTime / currentTrack.duration) * 100;

      if (progressPercent >= 50 && !hasPrefetchedRef.current) {
        console.log("🎯 50% reached - starting prefetch");
        hasPrefetchedRef.current = true;
        prefetchNextTrack();
      }
    }
  }, [currentTrack, prefetchNextTrack]);

  const handleAudioError = async (e: Event) => {
    setIsPlaying(false);

    if (isPlayingOffline && currentTrack?.videoId) {
      console.log("🔄 Offline playback failed, trying online stream...");
      setIsPlayingOffline(false);

      try {
        const streamUrl = await streamAPI.getStreamUrl(currentTrack.videoId);
        currentObjectUrlRef.current = streamUrl;

        if (audioRef.current) {
          audioRef.current.src = streamUrl;
          audioRef.current.load();
          audioRef.current.play().catch((err) => {
            console.error("❌ Online playback also failed:", err);
          });
        }
      } catch (err) {
        console.error("❌ Failed to get authenticated stream:", err);
      }
    }
  };

  const handleLoadedMetadata = () => {
    console.log("✅ Audio metadata loaded");
  };

  const handleTrackEnd = useCallback(() => {
    if (playbackMode === "repeat-one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (playbackMode === "smart-shuffle" && aiQueue.length > 0) {
      const nextAiTrack = aiQueue[0];
      setAiQueue((prev) => prev.slice(1));
      playTrack(nextAiTrack);
    } else {
      nextTrack();
    }
  }, [playbackMode, aiQueue]);

  const playTrack = useCallback(
    async (track: Track) => {
      if (!track || !track.videoId) return;

      addToHistory(track);

      // ✅ Reset prefetch state for new track
      hasPrefetchedRef.current = false;
      prefetchedTrackRef.current = null;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
      }

      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(false);

      console.log("🎵 Fetching stream for:", track.title);

      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }

      // Check offline first
      if (track.videoId && isDownloaded(track.id)) {
        try {
          console.log("🔌 Playing from offline cache:", track.title);
          const offlineUrl = await getOfflineAudioUrl(track.videoId);

          if (offlineUrl) {
            setIsPlayingOffline(true);
            currentObjectUrlRef.current = offlineUrl;

            if (audioRef.current) {
              audioRef.current.src = offlineUrl;
              audioRef.current.load();

              audioRef.current
                .play()
                .then(() => {
                  setIsPlaying(true);
                  console.log("✅ Offline playback started");
                })
                .catch(async (error) => {
                  console.error("❌ Offline playback failed:", error);
                  setIsPlaying(false);
                  setIsPlayingOffline(false);

                  const streamUrl = await streamAPI.getStreamUrl(track.videoId);
                  currentObjectUrlRef.current = streamUrl;

                  if (audioRef.current) {
                    audioRef.current.src = streamUrl;
                    audioRef.current.load();
                    audioRef.current.play();
                  }
                });
            }
            return;
          }
        } catch (error) {
          console.error("❌ Failed to get offline audio:", error);
          setIsPlayingOffline(false);
        }
      }

      // Play online
      console.log("🌐 Playing online:", track.title);
      setIsPlayingOffline(false);

      try {
        const streamUrl = await streamAPI.getStreamUrl(track.videoId);
        currentObjectUrlRef.current = streamUrl;

        if (audioRef.current) {
          audioRef.current.src = streamUrl;
          audioRef.current.load();

          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
              console.log("✅ Online playback started");
            })
            .catch((error) => {
              console.error("❌ Online playback failed:", error);
              setIsPlaying(false);
            });
        }
      } catch (error) {
        console.error("❌ Failed to get stream:", error);
        setIsPlaying(false);
      }
    },
    [isDownloaded, getOfflineAudioUrl, addToHistory],
  );

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log("⏸️ Paused");
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          console.log("▶️ Resumed");
        })
        .catch((error) => {
          console.error("❌ Resume failed:", error);
        });
    }
  }, [isPlaying, currentTrack]);

  const nextTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;

    console.log("⏭️ Next track");
    playTrack(playlist[nextIndex]);
  }, [currentTrack, playlist, playTrack]);

  const prevTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;

    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;

    console.log("⏮️ Previous track");
    playTrack(playlist[prevIndex]);
  }, [currentTrack, playlist, playTrack]);

  const seek = useCallback(
    (seconds: number) => {
      if (audioRef.current && currentTrack) {
        audioRef.current.currentTime = Math.min(seconds, currentTrack.duration);
        setProgress(seconds);
        console.log(`⏩ Seeked to ${seconds}s`);
      }
    },
    [currentTrack],
  );

  const setVolume = useCallback((vol: number) => {
    const clampedVolume = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVolume);

    if (audioRef.current) {
      audioRef.current.volume = clampedVolume;
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleTrackEnd);
    audio.addEventListener("error", handleAudioError);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleTrackEnd);
      audio.removeEventListener("error", handleAudioError);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.pause();
      audio.src = "";

      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
        currentObjectUrlRef.current = null;
      }
    };
  }, [handleTrackEnd, handleTimeUpdate]);

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
        isPlayingOffline,
        playbackMode,
        toggleShuffle,
        toggleRepeat,
        refreshSmartShuffle,
      }}
    >
      {children}
      {toast.visible && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-zinc-900 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2">
            {toast.message}
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
