export interface Track {
  id: string; // unique internal identifier
  title: string;
  artist: string;
  album: string;
  playlist: string;
  type: string;
  isrc: string;
  deezerId: string;
  previewUrl?: string;
  coverUrl?: string;
  albumCover?: string;
  duration?: number;
  isFavorite?: boolean;
  isOfflineAvailable?: boolean;
  notes?: string;
  addedAt?: number;
  videoId?: string;
}

export type SortField = 'title' | 'artist' | 'album' | 'playlist' | 'deezerId';
export type SortOrder = 'asc' | 'desc';
export type PlaybackSource = 'full' | 'preview';

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  isShuffle: boolean;
  queue: Track[];
  queueIndex: number;
  playbackSource: PlaybackSource;
}

export interface LibraryStats {
  totalTracks: number;
  uniqueArtists: number;
  uniqueAlbums: number;
  playlistCounts: Record<string, number>;
  topArtists: { name: string; count: number }[];
  duplicateCount: number;
}
