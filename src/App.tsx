import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Track, LibraryStats, SortField, PlaybackSource } from './types/music';
import { parseCSV, exportToCSV, generateM3U, findDuplicateTracks } from './utils/csvParser';
import { getTrackDetails, initTrackCache } from './utils/deezerService';
import { playSynthesizedPreview, stopSynthesizedPreview } from './utils/audioSynthesizer';
import { getFullTrackVideoId, initVideoIdCache } from './utils/fullAudioService';
import {
  downloadTracksAsCSV,
  downloadTracksAsM3U,
  downloadTracksAsJSON,
  downloadBatchZip,
} from './utils/downloadHelper';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { TrackTable } from './components/TrackTable';
import { MusicPlayer } from './components/MusicPlayer';
import { FullPlayerModal } from './components/FullPlayerModal';
import { AddTrackModal } from './components/AddTrackModal';
import { StatsModal } from './components/StatsModal';
import { BatchDownloadModal } from './components/BatchDownloadModal';
import { QueueDrawer } from './components/QueueDrawer';
import { EditTrackModal } from './components/EditTrackModal';
import { YouTubeAudioEmbed } from './components/YouTubeAudioEmbed';
import { FullTrackDownloadModal } from './components/FullTrackDownloadModal';
import { BulkLibraryDownloadModal } from './components/BulkLibraryDownloadModal';
import { VercelDeployModal } from './components/VercelDeployModal';

const STORAGE_KEY = 'deezer_library_tracks_v2';
const CUSTOM_PLAYLISTS_KEY = 'deezer_custom_playlists_v2';
const DEFAULT_CSV_PATH = '/assets/aistudio/My_Deezer_Library_e6092c00.csv';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylist, setActivePlaylist] = useState<string>('ALL');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [customPlaylists, setCustomPlaylists] = useState<string[]>([]);

  // Player state
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [playbackSource, setPlaybackSource] = useState<PlaybackSource>('full');
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [seekTimestamp, setSeekTimestamp] = useState<number | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchModalInitialQuery, setSearchModalInitialQuery] = useState('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [downloadModalTrack, setDownloadModalTrack] = useState<Track | null>(null);
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);

  // Batch download state
  const [batchDownloadState, setBatchDownloadState] = useState<{
    isOpen: boolean;
    current: number;
    total: number;
    currentTrackTitle: string;
    isComplete: boolean;
  }>({
    isOpen: false,
    current: 0,
    total: 0,
    currentTrackTitle: '',
    isComplete: false,
  });

  // HTML5 Audio Reference
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthStopRef = useRef<(() => void) | null>(null);

  // 1. Initial Load: Read CSV or LocalStorage
  useEffect(() => {
    initTrackCache();

    try {
      const savedCustom = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      if (savedCustom) {
        setCustomPlaylists(JSON.parse(savedCustom));
      }
    } catch {}

    const loadLibrary = async () => {
      try {
        const savedTracks = localStorage.getItem(STORAGE_KEY);
        if (savedTracks) {
          const parsed = JSON.parse(savedTracks);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTracks(parsed);
            setIsLoading(false);
            return;
          }
        }

        // Fetch CSV attachment
        const response = await fetch(DEFAULT_CSV_PATH);
        if (response.ok) {
          const text = await response.text();
          const parsed = parseCSV(text);
          setTracks(parsed);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load initial library', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadLibrary();
  }, []);

  // Persist tracks when modified
  const updateTracks = useCallback((newTracks: Track[]) => {
    setTracks(newTracks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTracks));
    } catch (err) {
      console.warn('LocalStorage limit reached when saving library', err);
    }
  }, []);

  // Save custom playlists
  const handleCreatePlaylist = (name: string) => {
    if (!name || customPlaylists.includes(name)) return;
    const next = [...customPlaylists, name];
    setCustomPlaylists(next);
    setActivePlaylist(name);
    try {
      localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleDeleteCustomPlaylist = (name: string) => {
    const next = customPlaylists.filter((p) => p !== name);
    setCustomPlaylists(next);
    if (activePlaylist === name) {
      setActivePlaylist('ALL');
    }
    try {
      localStorage.setItem(CUSTOM_PLAYLISTS_KEY, JSON.stringify(next));
    } catch {}
  };

  // Playback engine
  const playTrackDirect = useCallback(
    async (track: Track, newQueue?: Track[]) => {
      // Stop any active synth
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }

      if (newQueue) {
        setQueue(newQueue);
        const idx = newQueue.findIndex((t) => t.id === track.id);
        setQueueIndex(idx >= 0 ? idx : 0);
      }

      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(0);

      // Fetch cover art & details
      let previewUrl = track.previewUrl;
      let coverUrl = track.coverUrl;
      let songDuration = track.duration || 210;

      if (!previewUrl || !coverUrl) {
        const details = await getTrackDetails(track);
        if (details.previewUrl) previewUrl = details.previewUrl;
        if (details.coverUrl) coverUrl = details.coverUrl;
        if (details.duration) songDuration = details.duration;

        setCurrentTrack((prev) =>
          prev && prev.id === track.id
            ? { ...prev, previewUrl, coverUrl, duration: songDuration }
            : prev
        );
      }

      setDuration(songDuration > 30 ? songDuration : 210);

      // Full Audio Mode (Full song, not 30s)
      if (playbackSource === 'full') {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const vid = await getFullTrackVideoId(track);
        if (vid) {
          setActiveVideoId(vid);
          setIsPlaying(true);
          return;
        }
      }

      // Preview mode (30s) or fallback
      setActiveVideoId(null);
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      const audio = audioRef.current;
      audio.volume = isMuted ? 0 : volume;

      if (previewUrl) {
        audio.src = previewUrl;
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            synthStopRef.current = playSynthesizedPreview(
              track.title,
              track.artist,
              () => handleNextTrack(),
              (curr, dur) => {
                setCurrentTime(curr);
                setDuration(dur);
              }
            );
          });
      } else {
        synthStopRef.current = playSynthesizedPreview(
          track.title,
          track.artist,
          () => handleNextTrack(),
          (curr, dur) => {
            setCurrentTime(curr);
            setDuration(dur);
          }
        );
      }
    },
    [volume, isMuted, playbackSource]
  );

  const handleTogglePlaybackSource = () => {
    const nextSource = playbackSource === 'full' ? 'preview' : 'full';
    setPlaybackSource(nextSource);
    if (currentTrack) {
      if (nextSource === 'full') {
        if (audioRef.current) audioRef.current.pause();
        getFullTrackVideoId(currentTrack).then((vid) => {
          if (vid) {
            setActiveVideoId(vid);
            setIsPlaying(true);
          }
        });
      } else {
        setActiveVideoId(null);
        if (currentTrack.previewUrl && audioRef.current) {
          audioRef.current.src = currentTrack.previewUrl;
          audioRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }
    }
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (tracks.length > 0) {
        playTrackDirect(tracks[0], tracks);
      }
      return;
    }

    if (isPlaying) {
      if (playbackSource === 'preview' && audioRef.current) {
        audioRef.current.pause();
      }
      if (synthStopRef.current) {
        synthStopRef.current();
        synthStopRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (playbackSource === 'full' && activeVideoId) {
        setIsPlaying(true);
      } else if (audioRef.current && audioRef.current.src) {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      } else {
        synthStopRef.current = playSynthesizedPreview(
          currentTrack.title,
          currentTrack.artist,
          () => handleNextTrack(),
          (curr, dur) => {
            setCurrentTime(curr);
            setDuration(dur);
          }
        );
        setIsPlaying(true);
      }
    }
  };

  const handleNextTrack = useCallback(() => {
    if (queue.length === 0) return;

    if (repeatMode === 'one' && currentTrack) {
      playTrackDirect(currentTrack);
      return;
    }

    let nextIndex = queueIndex + 1;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      if (repeatMode === 'all') {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
    }

    setQueueIndex(nextIndex);
    playTrackDirect(queue[nextIndex]);
  }, [queue, queueIndex, isShuffle, repeatMode, currentTrack, playTrackDirect]);

  const handlePreviousTrack = () => {
    if (queue.length === 0) return;
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    const prevIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    setQueueIndex(prevIndex);
    playTrackDirect(queue[prevIndex]);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    if (playbackSource === 'full' && activeVideoId) {
      setSeekTimestamp(time);
      setTimeout(() => setSeekTimestamp(null), 150);
    } else if (audioRef.current && !isNaN(audioRef.current.duration)) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(vol === 0);
    if (audioRef.current) {
      audioRef.current.volume = vol;
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audioRef.current) {
      audioRef.current.volume = nextMuted ? 0 : volume;
    }
  };

  const handleCycleRepeat = () => {
    const modes: ('off' | 'all' | 'one')[] = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    setRepeatMode(modes[nextIdx]);
  };

  // Setup Audio element listeners
  useEffect(() => {
    const audio = audioRef.current || new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onLoadedMetadata = () => {
      if (!isNaN(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const onEnded = () => {
      handleNextTrack();
    };

    const onError = () => {
      console.warn('Audio playback error, falling back to melodic synthesizer');
      if (currentTrack) {
        synthStopRef.current = playSynthesizedPreview(
          currentTrack.title,
          currentTrack.artist,
          () => handleNextTrack(),
          (curr, dur) => {
            setCurrentTime(curr);
            setDuration(dur);
          }
        );
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [handleNextTrack, currentTrack]);

  // Keyboard shortcuts (Space, ArrowLeft, ArrowRight, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePreviousTrack();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.dispatchEvent(new Event('focus'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Library Mutations
  const handleToggleFavorite = (trackId: string) => {
    const next = tracks.map((t) => (t.id === trackId ? { ...t, isFavorite: !t.isFavorite } : t));
    updateTracks(next);
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDeleteTrack = (trackId: string) => {
    const next = tracks.filter((t) => t.id !== trackId);
    updateTracks(next);
  };

  const handleSaveTrack = (updated: Track) => {
    const next = tracks.map((t) => (t.id === updated.id ? updated : t));
    updateTracks(next);
    if (currentTrack?.id === updated.id) {
      setCurrentTrack(updated);
    }
  };

  const handleAddTrack = (trackData: Omit<Track, 'id'>) => {
    const newTrack: Track = {
      ...trackData,
      id: `track-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: Date.now(),
    };
    const next = [newTrack, ...tracks];
    updateTracks(next);
  };

  const handleBatchAddTracks = (trackDataList: Omit<Track, 'id'>[]) => {
    const newTracks: Track[] = trackDataList.map((td, idx) => ({
      ...td,
      id: `track-custom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: Date.now(),
    }));
    const next = [...newTracks, ...tracks];
    updateTracks(next);
  };

  // Batch Operations
  const handleBatchDownloadZip = (selected: Track[]) => {
    setBatchDownloadState({
      isOpen: true,
      current: 0,
      total: selected.length,
      currentTrackTitle: selected[0]?.title || '',
      isComplete: false,
    });

    downloadBatchZip(
      selected,
      `Deezer_${activePlaylist === 'ALL' ? 'Seleccion' : activePlaylist}.zip`,
      (curr, tot, title) => {
        setBatchDownloadState({
          isOpen: true,
          current: curr,
          total: tot,
          currentTrackTitle: title,
          isComplete: curr === tot,
        });
      }
    );
  };

  const handleBatchExportM3U = (selected: Track[]) => {
    downloadTracksAsM3U(selected, `Deezer_${activePlaylist}`);
  };

  const handleBatchExportCSV = (selected: Track[]) => {
    downloadTracksAsCSV(selected, `Deezer_${activePlaylist}.csv`);
  };

  const handleBatchAddToPlaylist = (selected: Track[], targetPlaylist: string) => {
    const selectedIds = new Set(selected.map((t) => t.id));
    const next = tracks.map((t) =>
      selectedIds.has(t.id) ? { ...t, playlist: targetPlaylist } : t
    );
    updateTracks(next);
  };

  const handleBatchDelete = (selectedIds: string[]) => {
    const set = new Set(selectedIds);
    const next = tracks.filter((t) => !set.has(t.id));
    updateTracks(next);
  };

  const handleBatchMarkFavorite = (selectedIds: string[]) => {
    const set = new Set(selectedIds);
    const next = tracks.map((t) => (set.has(t.id) ? { ...t, isFavorite: true } : t));
    updateTracks(next);
  };

  // Import CSV File
  const handleImportCSVFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length > 0) {
        const next = [...parsed, ...tracks];
        updateTracks(next);
        alert(`¡Se importaron con éxito ${parsed.length} canciones!`);
      } else {
        alert('No se encontraron canciones válidas en el archivo CSV.');
      }
    } catch (err) {
      alert('Error al leer el archivo CSV.');
    }
  };

  // Deduplication
  const handleDeduplicate = () => {
    const { uniqueTracks, duplicates } = findDuplicateTracks(tracks);
    if (duplicates.length === 0) {
      alert('No se encontraron canciones duplicadas en tu biblioteca.');
      return;
    }
    if (
      confirm(
        `Se detectaron ${duplicates.length} canciones duplicadas. ¿Deseas eliminarlas y conservar las ${uniqueTracks.length} únicas?`
      )
    ) {
      updateTracks(uniqueTracks);
      alert(`¡Biblioteca optimizada! Se eliminaron ${duplicates.length} duplicados.`);
      setIsStatsModalOpen(false);
    }
  };

  // Analytics & Statistics
  const stats: LibraryStats = useMemo(() => {
    const artistCounts: Record<string, number> = {};
    const playlistCounts: Record<string, number> = {};
    const albumSet = new Set<string>();

    for (const t of tracks) {
      if (t.artist) {
        artistCounts[t.artist] = (artistCounts[t.artist] || 0) + 1;
      }
      if (t.playlist) {
        playlistCounts[t.playlist] = (playlistCounts[t.playlist] || 0) + 1;
      }
      if (t.album) {
        albumSet.add(t.album);
      }
    }

    const topArtists = Object.entries(artistCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const { duplicates } = findDuplicateTracks(tracks);

    return {
      totalTracks: tracks.length,
      uniqueArtists: Object.keys(artistCounts).length,
      uniqueAlbums: albumSet.size,
      playlistCounts,
      topArtists,
      duplicateCount: duplicates.length,
    };
  }, [tracks]);

  // Playlist list
  const playlistsList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tracks) {
      const name = t.playlist || 'Biblioteca';
      counts[name] = (counts[name] || 0) + 1;
    }

    const list: { name: string; count: number; isCustom?: boolean }[] = [];
    for (const [name, count] of Object.entries(counts)) {
      list.push({ name, count, isCustom: customPlaylists.includes(name) });
    }

    // Include custom playlists that have 0 songs yet
    for (const cp of customPlaylists) {
      if (!counts[cp]) {
        list.push({ name: cp, count: 0, isCustom: true });
      }
    }

    return list;
  }, [tracks, customPlaylists]);

  const availablePlaylistNames = useMemo(() => {
    return Array.from(new Set([...playlistsList.map((p) => p.name), ...customPlaylists]));
  }, [playlistsList, customPlaylists]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    let result = tracks;

    // Filter by Playlist
    if (activePlaylist !== 'ALL') {
      result = result.filter((t) => t.playlist.toLowerCase() === activePlaylist.toLowerCase());
    }

    // Filter by Artist
    if (selectedArtist) {
      result = result.filter(
        (t) => t.artist.toLowerCase() === selectedArtist.toLowerCase()
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.artist.toLowerCase().includes(q) ||
          t.album.toLowerCase().includes(q) ||
          t.deezerId.includes(q) ||
          t.isrc.toLowerCase().includes(q)
      );
    }

    return result;
  }, [tracks, activePlaylist, selectedArtist, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalTracks={tracks.length}
        filteredCount={filteredTracks.length}
        uniqueArtistsCount={stats.uniqueArtists}
        onOpenAddModal={() => {
          setSearchModalInitialQuery('');
          setIsAddModalOpen(true);
        }}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenDuplicatesModal={handleDeduplicate}
        duplicateCount={stats.duplicateCount}
        onExportCSV={() => downloadTracksAsCSV(filteredTracks, `Deezer_Export_${activePlaylist}.csv`)}
        onExportM3U={() => downloadTracksAsM3U(filteredTracks, `Deezer_${activePlaylist}`)}
        onExportJSON={() => downloadTracksAsJSON(filteredTracks, `Deezer_Export_${activePlaylist}.json`)}
        onImportCSVFile={handleImportCSVFile}
        activePlaylist={activePlaylist}
        onOpenBulkDownloadModal={() => setIsBulkDownloadOpen(true)}
        onOpenVercelGuide={() => setIsVercelModalOpen(true)}
      />

      {/* Main Layout: Sidebar + Track Table */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0">
        {/* Mobile Horizontal Playlist Pills Bar */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto p-3 bg-slate-900 border-b border-slate-800 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActivePlaylist('ALL');
              setSelectedArtist(null);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              activePlaylist === 'ALL' && selectedArtist === null
                ? 'bg-purple-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Todas ({tracks.length})
          </button>
          {playlistsList.map((pl) => (
            <button
              key={pl.name}
              type="button"
              onClick={() => {
                setActivePlaylist(pl.name);
                setSelectedArtist(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activePlaylist === pl.name && selectedArtist === null
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {pl.name} ({pl.count})
            </button>
          ))}
        </div>

        <Sidebar
          playlists={playlistsList}
          activePlaylist={activePlaylist}
          onSelectPlaylist={setActivePlaylist}
          onCreatePlaylist={handleCreatePlaylist}
          onDeleteCustomPlaylist={handleDeleteCustomPlaylist}
          topArtists={stats.topArtists}
          selectedArtist={selectedArtist}
          onSelectArtist={setSelectedArtist}
          totalTracks={tracks.length}
          onOpenAddModal={() => {
            setSearchModalInitialQuery('');
            setIsAddModalOpen(true);
          }}
          onOpenVercelGuide={() => setIsVercelModalOpen(true)}
        />

        <TrackTable
          tracks={filteredTracks}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayTrack={playTrackDirect}
          onTogglePlay={handleTogglePlay}
          onToggleFavorite={handleToggleFavorite}
          onDeleteTrack={handleDeleteTrack}
          onEditTrack={(track) => setEditingTrack(track)}
          onBatchDownloadZip={handleBatchDownloadZip}
          onBatchExportM3U={handleBatchExportM3U}
          onBatchExportCSV={handleBatchExportCSV}
          onBatchAddToPlaylist={handleBatchAddToPlaylist}
          onBatchDelete={handleBatchDelete}
          onBatchMarkFavorite={handleBatchMarkFavorite}
          availablePlaylists={availablePlaylistNames}
          searchQuery={searchQuery}
          onOpenDownloadModal={(track) => setDownloadModalTrack(track)}
          onOpenSearchModal={(query) => {
            setSearchModalInitialQuery(query || '');
            setIsAddModalOpen(true);
          }}
        />
      </div>

      {/* Background Full Audio Stream Player */}
      <YouTubeAudioEmbed
        videoId={playbackSource === 'full' ? activeVideoId : null}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        onTimeUpdate={(curr, dur) => {
          setCurrentTime(curr);
          if (dur > 0 && Math.abs(dur - duration) > 2) {
            setDuration(dur);
          }
        }}
        onEnded={handleNextTrack}
        seekTime={seekTimestamp}
      />

      {/* Persistent Bottom Music Player */}
      <MusicPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onCycleRepeat={handleCycleRepeat}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onToggleFavorite={handleToggleFavorite}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenFullPlayer={() => setIsFullPlayerOpen(true)}
        queueLength={queue.length}
        playbackSource={playbackSource}
        onTogglePlaybackSource={handleTogglePlaybackSource}
        onOpenDownloadModal={(track) => setDownloadModalTrack(track)}
      />

      {/* Fullscreen Player Modal */}
      <FullPlayerModal
        isOpen={isFullPlayerOpen}
        onClose={() => setIsFullPlayerOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onNextTrack={handleNextTrack}
        onPreviousTrack={handlePreviousTrack}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isShuffle={isShuffle}
        onToggleShuffle={() => setIsShuffle(!isShuffle)}
        repeatMode={repeatMode}
        onCycleRepeat={handleCycleRepeat}
        onToggleFavorite={handleToggleFavorite}
        playbackSource={playbackSource}
        onTogglePlaybackSource={handleTogglePlaybackSource}
        onOpenDownloadModal={(track) => setDownloadModalTrack(track)}
      />

      {/* Queue Drawer */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        queueIndex={queueIndex}
        onPlayQueueIndex={(idx) => {
          setQueueIndex(idx);
          playTrackDirect(queue[idx]);
        }}
        onClearQueue={() => {
          setQueue([]);
          setQueueIndex(0);
        }}
      />

      {/* Single Full Song Download Modal */}
      <FullTrackDownloadModal
        isOpen={downloadModalTrack !== null}
        onClose={() => setDownloadModalTrack(null)}
        track={downloadModalTrack}
        onOpenBulkDownloadModal={() => setIsBulkDownloadOpen(true)}
      />

      {/* Bulk Library Download Modal */}
      <BulkLibraryDownloadModal
        isOpen={isBulkDownloadOpen}
        onClose={() => setIsBulkDownloadOpen(false)}
        tracks={tracks}
        availablePlaylists={availablePlaylistNames}
      />

      {/* Add Track & Web Music Searcher/Downloader Modal */}
      <AddTrackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddTrack={handleAddTrack}
        onBatchAddTracks={handleBatchAddTracks}
        availablePlaylists={availablePlaylistNames}
        onCreatePlaylist={handleCreatePlaylist}
        onOpenDownloadModal={(track) => setDownloadModalTrack(track)}
        initialQuery={searchModalInitialQuery}
        onOpenVercelGuide={() => setIsVercelModalOpen(true)}
      />

      {/* Vercel & GitHub Deployment Guide Modal */}
      <VercelDeployModal
        isOpen={isVercelModalOpen}
        onClose={() => setIsVercelModalOpen(false)}
      />

      {/* Edit Track Modal */}
      <EditTrackModal
        isOpen={editingTrack !== null}
        onClose={() => setEditingTrack(null)}
        track={editingTrack}
        onSaveTrack={handleSaveTrack}
        availablePlaylists={availablePlaylistNames}
      />

      {/* Statistics Modal */}
      <StatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        stats={stats}
        onDeduplicate={handleDeduplicate}
      />

      {/* Batch ZIP Download Progress Modal */}
      <BatchDownloadModal
        isOpen={batchDownloadState.isOpen}
        onClose={() =>
          setBatchDownloadState((prev) => ({ ...prev, isOpen: false }))
        }
        current={batchDownloadState.current}
        total={batchDownloadState.total}
        currentTrackTitle={batchDownloadState.currentTrackTitle}
        isComplete={batchDownloadState.isComplete}
      />
    </div>
  );
}
