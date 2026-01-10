
import { Track, Playlist, Category } from './types/types';

export const MOCK_TRACKS: Track[] = [
  { id: '1', title: 'Midnight City', artist: 'M83', album: 'Hurry Up, We\'re Dreaming', coverUrl: 'https://picsum.photos/seed/track1/400/400', duration: 243 },
  { id: '2', title: 'Starboy', artist: 'The Weeknd', album: 'Starboy', coverUrl: 'https://picsum.photos/seed/track2/400/400', duration: 230 },
  { id: '3', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', coverUrl: 'https://picsum.photos/seed/track3/400/400', duration: 203 },
  { id: '4', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', coverUrl: 'https://picsum.photos/seed/track4/400/400', duration: 200 },
  { id: '5', title: 'Save Your Tears', artist: 'The Weeknd', album: 'After Hours', coverUrl: 'https://picsum.photos/seed/track5/400/400', duration: 215 },
  { id: '6', title: 'Heat Waves', artist: 'Glass Animals', album: 'Dreamland', coverUrl: 'https://picsum.photos/seed/track6/400/400', duration: 238 },
  { id: '7', title: 'Cold Heart', artist: 'Elton John', album: 'The Lockdown Sessions', coverUrl: 'https://picsum.photos/seed/track7/400/400', duration: 202 },
  { id: '8', title: 'Bad Habits', artist: 'Ed Sheeran', album: '=', coverUrl: 'https://picsum.photos/seed/track8/400/400', duration: 231 },
];

export const MOCK_PLAYLISTS: Playlist[] = [
  {
    id: 'p1',
    name: 'Top 50 - Global',
    description: 'Your daily update of the most played tracks right now.',
    coverUrl: 'https://picsum.photos/seed/playlist1/600/600',
    tracks: MOCK_TRACKS.slice(0, 5),
    type: 'playlist'
  },
  {
    id: 'p2',
    name: 'Chill Vibes',
    description: 'Easy listening tracks for your relaxed afternoon.',
    coverUrl: 'https://picsum.photos/seed/playlist2/600/600',
    tracks: MOCK_TRACKS.slice(2, 8),
    type: 'playlist'
  },
  {
    id: 'p3',
    name: 'Workout Mix',
    description: 'High energy beats to keep you moving.',
    coverUrl: 'https://picsum.photos/seed/playlist3/600/600',
    tracks: MOCK_TRACKS,
    type: 'playlist'
  },
  {
    id: 'p4',
    name: 'Focus Flow',
    description: 'Deep focus for deep work.',
    coverUrl: 'https://picsum.photos/seed/playlist4/600/600',
    tracks: MOCK_TRACKS.slice(4, 7),
    type: 'playlist'
  }
];

export const CATEGORIES: Category[] = [
  { id: 'c1', name: 'Pop', color: 'bg-pink-600' },
  { id: 'c2', name: 'Hip-Hop', color: 'bg-orange-600' },
  { id: 'c3', name: 'Rock', color: 'bg-red-700' },
  { id: 'c4', name: 'Electronic', color: 'bg-purple-600' },
  { id: 'c5', name: 'Jazz', color: 'bg-blue-600' },
  { id: 'c6', name: 'Indie', color: 'bg-emerald-600' },
  { id: 'c7', name: 'Podcasts', color: 'bg-teal-700' },
  { id: 'c8', name: 'Sleep', color: 'bg-indigo-900' },
];

export const ACCENT_COLOR = '#1DB954'; // VibeStream Green
