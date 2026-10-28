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
import { FolderDownloadModal } from './components/FolderDownloadModal';
import { SongDiscoveryModal } from './components/SongDiscoveryModal';
import { VercelDeployModal } from './components/VercelDeployModal';
import { LyricsModal } from './components/LyricsModal';
import { EqualizerModal } from './components/EqualizerModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MobileBottomNav, MobileTabType } from './components/MobileBottomNav';
import { MobilePlaylistsView } from './components/MobilePlaylistsView';
import { MobileArtistsView } from './components/MobileArtistsView';
import { MobileToolsView } from './components/MobileToolsView';
import { equalizer } from './utils/equalizerService';
import { updateMediaSession, updateMediaSessionPosition } from './utils/mediaSessionManager';
import {
  getAllOfflineTrackIds,
  getOfflineAudioUrl,
  importLocalAudioFiles,
  downloadAndSavePlaylistOffline,
  removePlaylistOffline,
} from './utils/offlineAudioStorage';
import { downloadTrackAudio } from './utils/downloadHelper';
import defaultCsvRaw from '../public/assets/aistudio/My_Deezer_Library_e6092c00.csv?raw';
import { Heart, Play, Shuffle, Sliders, Download, Sparkles, ListMusic, Users, Clock, RotateCcw, X, Music, HardDrive, FolderDown, Upload, Disc, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'deezer_library_tracks_v4_authentic';
const CUSTOM_PLAYLISTS_KEY = 'deezer_custom_playlists_v2';
const RECENTLY_PLAYED_KEY = 'deezer_recently_played_v1';
const OFFLINE_PLAYLISTS_KEY = 'deezer_offline_playlists_v1';
const DEFAULT_CSV_PATH = '/assets/aistudio/My_Deezer_Library_e6092c00.csv';

export const isFavoritesPlaylist = (name: string): boolean => {
  if (!name) return false;
  const lower = name.toLowerCase().trim();
  return (
    lower === 'favorite tracks' ||
    lower === 'favoritas' ||
    lower === 'favoritos' ||
    lower === 'canciones favoritas' ||
    lower.includes('favorit')
  );
};

// Parse authentic user library directly from the bundled CSV (2,117 Deezer tracks)
const ORIGINAL_DEEZER_TRACKS: Track[] = parseCSV(defaultCsvRaw).map((t: Track) => ({
  ...t,
  isFavorite: Boolean(
    t.isFavorite || isFavoritesPlaylist(t.playlist) || t.type?.toLowerCase().includes('fav')
  ),
}));

const getInitialTracks = (): Track[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length >= 1000) {
        return parsed.map((t: Track) => ({
          ...t,
          isFavorite: Boolean(
            t.isFavorite || isFavoritesPlaylist(t.playlist) || t.type?.toLowerCase().includes('fav')
          ),
        }));
      }
    }
  } catch {}
  return ORIGINAL_DEEZER_TRACKS;
};

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(getInitialTracks);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlaylist, setActivePlaylist] = useState<string>('ALL');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [customPlaylists, setCustomPlaylists] = useState<string[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([]);
  const [mobileTab, setMobileTab] = useState<MobileTabType>('tracks');

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
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState(false);
  const [isFolderDownloadOpen, setIsFolderDownloadOpen] = useState(false);
  const [folderDownloadInitialName, setFolderDownloadInitialName] = useState<string>('ALL');

  const handleOpenFolderDownload = (folderName?: string) => {
    setFolderDownloadInitialName(folderName || (activePlaylist === 'ALL' ? 'ALL' : activePlaylist));
    setIsFolderDownloadOpen(true);
  };

  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [offlinePlaylists, setOfflinePlaylists] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_PLAYLISTS_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [offlineSyncProgress, setOfflineSyncProgress] = useState<{
    current: number;
    total: number;
    trackTitle: string;
    playlistName: string;
  } | null>(null);
  const localAudioInputRef = useRef<HTMLInputElement | null>(null);
  const [searchModalInitialQuery, setSearchModalInitialQuery] = useState('');
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [downloadModalTrack, setDownloadModalTrack] = useState<Track | null>(null);
  const [isBulkDownloadOpen, setIsBulkDownloadOpen] = useState(false);
  const [isVercelModalOpen, setIsVercelModalOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [sleepTimerSecondsRemaining, setSleepTimerSecondsRemaining] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const originalVolumeRef = useRef<number>(volume);
  const lastTickTimeRef = useRef<number>(performance.now());
  const playbackSourceRef = useRef<PlaybackSource>(playbackSource);
  playbackSourceRef.current = playbackSource;
  const durationRef = useRef<number>(duration);
  durationRef.current = duration;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

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

  // 1. Initial Load: Read CSV or LocalStorage & Offline tracks
  useEffect(() => {
    initTrackCache();
    initVideoIdCache();

    // Query all locally cached offline audio files
    getAllOfflineTrackIds()
      .then((ids) => {
        setOfflineTrackIds(ids);
      })
      .catch(() => {});

    try {
      const savedCustom = localStorage.getItem(CUSTOM_PLAYLISTS_KEY);
      if (savedCustom) {
        setCustomPlaylists(JSON.parse(savedCustom));
      }
      const savedRecent = localStorage.getItem(RECENTLY_PLAYED_KEY);
      if (savedRecent) {
        setRecentlyPlayed(JSON.parse(savedRecent));
      }
    } catch {}

    // Ensure authentic library is persisted in storage
    try {
      const savedTracks = localStorage.getItem(STORAGE_KEY);
      if (!savedTracks) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ORIGINAL_DEEZER_TRACKS));
      }
    } catch {}
    setIsLoading(false);
  }, []);

  // Restore original library callback
  const handleRestoreOriginalLibrary = useCallback(() => {
    setTracks(ORIGINAL_DEEZER_TRACKS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ORIGINAL_DEEZER_TRACKS));
    } catch {}
    setActivePlaylist('ALL');
    setSelectedArtist(null);
    setSearchQuery('');
    showToast(`Biblioteca Deezer restaurada: ${ORIGINAL_DEEZER_TRACKS.length.toLocaleString()} canciones auténticas`);
  }, [showToast]);

  // Persist tracks when modified
  const updateTracks = useCallback((newTracks: Track[]) => {
    setTracks(newTracks);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTracks));
    } catch (err) {
      console.warn('LocalStorage limit reached when saving library', err);
    }
  }, []);

  // Import local user audio files (.mp3, .m4a, .wav) directly into the app
  const handleImportLocalAudioFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    try {
      const imported = await importLocalAudioFiles(fileList);
      if (imported.length > 0) {
        const next = [...imported, ...tracks];
        updateTracks(next);
        const newIds = await getAllOfflineTrackIds();
        setOfflineTrackIds(newIds);
        setActivePlaylist('OFFLINE');
        showToast(`¡${imported.length} canciones importadas a tu biblioteca y listas para reproducir offline! 💾`);
      } else {
        showToast('No se encontraron archivos de audio compatibles (.mp3, .m4a, .wav, .flac)');
      }
    } catch (err) {
      console.error('Error importing local audio', err);
      showToast('Error al importar archivos locales');
    }
  };

  // Toggle offline download for an entire playlist/folder
  const handleTogglePlaylistOffline = async (playlistName: string) => {
    const isCurrentlyOffline = Boolean(offlinePlaylists[playlistName]);
    const isFav = isFavoritesPlaylist(playlistName);
    const targetTracks =
      playlistName === 'ALL'
        ? tracks
        : isFav
        ? tracks.filter((t) => Boolean(t.isFavorite || t.playlist?.toLowerCase().includes('favorit')))
        : tracks.filter((t) => (t.playlist || 'General').toLowerCase() === playlistName.toLowerCase());

    if (isCurrentlyOffline) {
      // Turn OFF
      await removePlaylistOffline(targetTracks);
      const updated = { ...offlinePlaylists, [playlistName]: false };
      setOfflinePlaylists(updated);
      try {
        localStorage.setItem(OFFLINE_PLAYLISTS_KEY, JSON.stringify(updated));
      } catch {}
      const newIds = await getAllOfflineTrackIds();
      setOfflineTrackIds(newIds);
      showToast(`Descarga sin conexión desactivada para "${playlistName}"`);
    } else {
      // Turn ON
      setOfflineSyncProgress({
        current: 0,
        total: targetTracks.length,
        trackTitle: 'Iniciando descarga...',
        playlistName,
      });

      try {
        const savedIds = await downloadAndSavePlaylistOffline(targetTracks, (curr, tot, title) => {
          setOfflineSyncProgress({
            current: curr,
            total: tot,
            trackTitle: title,
            playlistName,
          });
        });

        const updated = { ...offlinePlaylists, [playlistName]: true };
        setOfflinePlaylists(updated);
        try {
          localStorage.setItem(OFFLINE_PLAYLISTS_KEY, JSON.stringify(updated));
        } catch {}
        const newIds = await getAllOfflineTrackIds();
        setOfflineTrackIds(newIds);
        showToast(`¡"${playlistName}" descargada para escuchar sin conexión! (${savedIds.length} canciones) 🎧`);
      } catch (e) {
        console.error('Error downloading playlist offline', e);
        showToast('Error al descargar playlist para offline');
      } finally {
        setOfflineSyncProgress(null);
      }
    }
  };

  // Direct MP3 download handler without redirects
  const handleDirectDownloadTrack = async (track: Track) => {
    showToast(`Descargando "${track.title}" en MP3...`);
    const ok = await downloadTrackAudio(track);
    if (ok) {
      showToast(`¡"${track.title}" descargada con éxito!`);
      const newIds = await getAllOfflineTrackIds();
      setOfflineTrackIds(newIds);
    } else {
      setDownloadModalTrack(track);
    }
  };

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

      // Record in recently played
      setRecentlyPlayed((prev) => {
        const next = [track, ...prev.filter((t) => t.id !== track.id)].slice(0, 30);
        try {
          localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });

      // 0. CHECK OFFLINE STORAGE FIRST (Direct in-app playback without internet!)
      const offlineBlobUrl = await getOfflineAudioUrl(track.id);
      if (offlineBlobUrl) {
        setActiveVideoId(null);
        if (!audioRef.current) {
          const newAud = new Audio();
          newAud.crossOrigin = 'anonymous';
          audioRef.current = newAud;
          equalizer.attachAudioElement(newAud);
        } else if (!audioRef.current.crossOrigin) {
          audioRef.current.crossOrigin = 'anonymous';
        }
        equalizer.resume();
        const audio = audioRef.current;
        audio.src = offlineBlobUrl;
        audio.volume = isMuted ? 0 : volume;
        setDuration(track.duration || 180);
        try {
          await audio.play();
          setIsPlaying(true);
          return;
        } catch (e) {
          console.warn('Offline playback error, falling through', e);
        }
      }

      // Fetch cover art & details if missing
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
        const newAud = new Audio();
        newAud.crossOrigin = 'anonymous';
        audioRef.current = newAud;
        equalizer.attachAudioElement(newAud);
      } else if (!audioRef.current.crossOrigin) {
        audioRef.current.crossOrigin = 'anonymous';
      }

      equalizer.resume();

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
    const clamped = Math.max(0, Math.min(duration, time));
    setCurrentTime(clamped);
    lastTickTimeRef.current = performance.now();
    if (playbackSource === 'full' && activeVideoId) {
      setSeekTimestamp(clamped);
      setTimeout(() => setSeekTimestamp(null), 150);
    } else if (audioRef.current) {
      try {
        audioRef.current.currentTime = clamped;
      } catch {}
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    originalVolumeRef.current = vol;
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

  // Setup Audio element listeners & Equalizer integration
  useEffect(() => {
    const audio = audioRef.current || new Audio();
    if (!audio.crossOrigin) {
      audio.crossOrigin = 'anonymous';
    }
    audioRef.current = audio;
    equalizer.attachAudioElement(audio);

    const onTimeUpdate = () => {
      if (playbackSourceRef.current === 'preview' && !audio.paused && audio.currentTime > 0) {
        setCurrentTime(audio.currentTime);
      }
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

  // Master Progress Timer: guarantees progress bar moves fluidly (10 times per second)
  useEffect(() => {
    if (!isPlaying) return;

    lastTickTimeRef.current = performance.now();

    const timer = setInterval(() => {
      const now = performance.now();
      const deltaSec = Math.max(0, (now - lastTickTimeRef.current) / 1000);
      lastTickTimeRef.current = now;

      // If preview mode with native HTML5 audio playing
      if (
        playbackSourceRef.current === 'preview' &&
        audioRef.current &&
        !audioRef.current.paused &&
        audioRef.current.currentTime > 0
      ) {
        setCurrentTime(audioRef.current.currentTime);
        return;
      }

      // Full track mode (YouTube) or synth audio: advance smoothly by deltaSec
      setCurrentTime((prev) => {
        const next = prev + deltaSec;
        const currentDur = durationRef.current;
        if (currentDur > 0 && next >= currentDur) {
          handleNextTrack();
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [isPlaying, handleNextTrack]);

  // Sleep timer engine
  const handleSetSleepTimer = (minutes: number) => {
    originalVolumeRef.current = volume;
    setSleepTimerSecondsRemaining(minutes * 60);
    showToast(`Temporizador programado para ${minutes} minutos 🌙`);
  };

  const handleCancelSleepTimer = () => {
    setSleepTimerSecondsRemaining(null);
    if (volume !== originalVolumeRef.current) {
      setVolume(originalVolumeRef.current);
      if (audioRef.current) audioRef.current.volume = originalVolumeRef.current;
    }
    showToast('Temporizador de apagado cancelado');
  };

  useEffect(() => {
    if (sleepTimerSecondsRemaining === null) return;

    if (sleepTimerSecondsRemaining <= 0) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
      setSleepTimerSecondsRemaining(null);
      setVolume(originalVolumeRef.current);
      if (audioRef.current) audioRef.current.volume = originalVolumeRef.current;
      showToast('Música pausada por temporizador de apagado 🌙');
      return;
    }

    const timer = setInterval(() => {
      setSleepTimerSecondsRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) return 0;
        const next = prev - 1;
        // Fade out smoothly in the last 15 seconds
        if (next <= 15 && next > 0) {
          const fadeRatio = next / 15;
          const fadedVol = Math.max(0, originalVolumeRef.current * fadeRatio);
          setVolume(fadedVol);
          if (audioRef.current) audioRef.current.volume = fadedVol;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerSecondsRemaining, showToast]);

  // Native Media Session API (lock-screen controls, notification drawer, multimedia keyboard)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Single',
        artwork: currentTrack.coverUrl
          ? [
              { src: currentTrack.coverUrl, sizes: '96x96', type: 'image/jpeg' },
              { src: currentTrack.coverUrl, sizes: '256x256', type: 'image/jpeg' },
              { src: currentTrack.coverUrl, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [
              { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            ],
      });

      navigator.mediaSession.setActionHandler('play', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('pause', () => handleTogglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePreviousTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNextTrack());
      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (typeof details.seekTime === 'number') {
          handleSeek(details.seekTime);
        }
      });
    } catch {}
  }, [currentTrack, handleNextTrack]);

  useEffect(() => {
    if (!('mediaSession' in navigator) || duration <= 0) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
      if (!isNaN(currentTime) && currentTime >= 0) {
        navigator.mediaSession.setPositionState({
          duration: Math.max(1, duration),
          playbackRate: isPlaying ? 1 : 0,
          position: Math.min(duration, Math.max(0, currentTime)),
        });
      }
    } catch {}
  }, [isPlaying, currentTime, duration]);

  // Keyboard shortcuts (Space, ArrowLeft, ArrowRight, M, L, E, T, ?, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        handleNextTrack();
      } else if (e.code === 'ArrowLeft' || e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePreviousTrack();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      } else if (e.key === '/') {
        e.preventDefault();
        document.querySelector('input[type="text"]')?.dispatchEvent(new Event('focus'));
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        if (currentTrack) setIsLyricsOpen((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setIsEqualizerOpen((prev) => !prev);
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setIsSleepTimerOpen((prev) => !prev);
      } else if (e.key === '?' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsLyricsOpen(false);
        setIsEqualizerOpen(false);
        setIsSleepTimerOpen(false);
        setIsShortcutsOpen(false);
        setIsFullPlayerOpen(false);
        setIsQueueOpen(false);
        setIsAddModalOpen(false);
        setIsStatsModalOpen(false);
        setEditingTrack(null);
        setDownloadModalTrack(null);
        setIsBulkDownloadOpen(false);
        setIsVercelModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Library Mutations
  const handleToggleFavorite = (trackId: string) => {
    let msg = '';
    const next = tracks.map((t) => {
      if (t.id === trackId) {
        const nextFav = !t.isFavorite;
        msg = nextFav
          ? `"${t.title}" se unió a Favoritos ♥`
          : `"${t.title}" se retiró de Favoritos`;
        return {
          ...t,
          isFavorite: nextFav,
          type: nextFav ? 'Favorite' : (t.type === 'Favorite' ? 'Track' : t.type),
        };
      }
      return t;
    });
    updateTracks(next);
    if (currentTrack?.id === trackId) {
      setCurrentTrack((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
    if (msg) showToast(msg);
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
    const isFav = Boolean(trackData.isFavorite || isFavoritesPlaylist(trackData.playlist));
    const newTrack: Track = {
      ...trackData,
      isFavorite: isFav,
      type: isFav ? 'Favorite' : (trackData.type || 'Track'),
      id: `track-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      addedAt: Date.now(),
    };
    const next = [newTrack, ...tracks];
    updateTracks(next);
  };

  const handleBatchAddTracks = (trackDataList: Omit<Track, 'id'>[]) => {
    const newTracks: Track[] = trackDataList.map((td, idx) => {
      const isFav = Boolean(td.isFavorite || isFavoritesPlaylist(td.playlist));
      return {
        ...td,
        isFavorite: isFav,
        type: isFav ? 'Favorite' : (td.type || 'Track'),
        id: `track-custom-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        addedAt: Date.now(),
      };
    });
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
    let favoriteCount = 0;

    for (const t of tracks) {
      if (t.isFavorite) {
        favoriteCount++;
      }
      const name = t.playlist || 'Biblioteca';
      if (!isFavoritesPlaylist(name)) {
        counts[name] = (counts[name] || 0) + 1;
      }
    }

    // "Favorite Tracks" is always first, reflecting all favorited tracks
    const list: { name: string; count: number; isCustom?: boolean }[] = [
      { name: 'Favorite Tracks', count: favoriteCount, isCustom: false },
    ];

    for (const [name, count] of Object.entries(counts)) {
      list.push({ name, count, isCustom: customPlaylists.includes(name) });
    }

    // Include custom playlists that have 0 songs yet
    for (const cp of customPlaylists) {
      if (!counts[cp] && !isFavoritesPlaylist(cp)) {
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
      if (activePlaylist === 'OFFLINE') {
        result = result.filter(
          (t) => offlineTrackIds.has(t.id) || Boolean(t.isOfflineAvailable)
        );
      } else if (isFavoritesPlaylist(activePlaylist)) {
        result = result.filter((t) => Boolean(t.isFavorite));
      } else {
        result = result.filter((t) => (t.playlist || '').toLowerCase() === activePlaylist.toLowerCase());
      }
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
  }, [tracks, activePlaylist, selectedArtist, searchQuery, offlineTrackIds]);

  // All authentic favorite tracks
  const favoriteTracks = useMemo(() => {
    return tracks.filter(
      (t) => Boolean(t.isFavorite || isFavoritesPlaylist(t.playlist) || t.type?.toLowerCase().includes('fav'))
    );
  }, [tracks]);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        totalTracks={tracks.length}
        filteredCount={filteredTracks.length}
        uniqueArtistsCount={stats.uniqueArtists}
        onOpenAddModal={() => setIsDiscoveryModalOpen(true)}
        onOpenStatsModal={() => setIsStatsModalOpen(true)}
        onOpenDuplicatesModal={handleDeduplicate}
        duplicateCount={stats.duplicateCount}
        onExportCSV={() => downloadTracksAsCSV(filteredTracks, `Deezer_Export_${activePlaylist}.csv`)}
        onExportM3U={() => downloadTracksAsM3U(filteredTracks, `Deezer_${activePlaylist}`)}
        onExportJSON={() => downloadTracksAsJSON(filteredTracks, `Deezer_Export_${activePlaylist}.json`)}
        onImportCSVFile={handleImportCSVFile}
        activePlaylist={activePlaylist}
        onOpenBulkDownloadModal={() => setIsBulkDownloadOpen(true)}
        onOpenFolderDownloadModal={() => setIsFolderDownloadOpen(true)}
        onOpenVercelGuide={() => setIsVercelModalOpen(true)}
        onOpenKeyboardShortcuts={() => setIsShortcutsOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenLyrics={() => setIsLyricsOpen(true)}
        hasActiveTrack={currentTrack !== null}
      />

      {/* Main Layout: Desktop Sidebar + Track Table, OR Mobile Dedicated Tabs */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 w-full max-w-full overflow-x-hidden">
        {/* DESKTOP SIDEBAR (hidden on mobile) */}
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
          offlineCount={tracks.filter((t) => offlineTrackIds.has(t.id) || t.isOfflineAvailable).length}
          onOpenAddModal={() => setIsDiscoveryModalOpen(true)}
          onOpenFolderDownloadModal={(folderName) => handleOpenFolderDownload(folderName)}
          onImportLocalAudio={() => localAudioInputRef.current?.click()}
          onOpenVercelGuide={() => setIsVercelModalOpen(true)}
          onOpenLyrics={() => setIsLyricsOpen(true)}
          onOpenEqualizer={() => setIsEqualizerOpen(true)}
          onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
          hasCurrentTrack={currentTrack !== null}
          offlinePlaylists={offlinePlaylists}
          onToggleFolderOffline={handleTogglePlaylistOffline}
        />

        {/* =========================================
            MOBILE VIEW (< md): 4 Dedicated Full Tabs
            ========================================= */}
        <div className="md:hidden flex-1 min-w-0 w-full">
          {mobileTab === 'tracks' && (
            <div className="flex flex-col w-full">
              {/* Sleek Mobile Hero Section (First Impression) */}
              <div className="px-4 pt-3.5 pb-3 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800/80">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <span>Mi Biblioteca Deezer</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                        {tracks.length.toLocaleString()} canciones
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {favoriteTracks.length} favoritas • {stats.uniqueArtists} artistas • Alta fidelidad
                    </p>
                  </div>

                  {/* Shuffle Play Hero Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredTracks.length > 0) {
                        const randomIdx = Math.floor(Math.random() * filteredTracks.length);
                        playTrackDirect(filteredTracks[randomIdx], filteredTracks);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-xs active:scale-95 transition-all shadow-md shadow-purple-600/30 shrink-0"
                    title="Reproducir en modo aleatorio"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Aleatorio</span>
                  </button>
                </div>

                {/* Quick Filter Horizontal Scroll Pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 -mx-1 px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActivePlaylist('ALL');
                      setSelectedArtist(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border ${
                      activePlaylist === 'ALL' && !selectedArtist
                        ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-800'
                    }`}
                  >
                    ✨ Todas ({tracks.length.toLocaleString()})
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('favorites')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border bg-slate-800/90 text-rose-300 border-rose-500/30 hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                    <span>Favoritas ({favoriteTracks.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('playlists')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border bg-slate-800/90 text-purple-300 border-purple-500/30 hover:bg-slate-800 flex items-center gap-1"
                  >
                    <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                    <span>Playlists ({playlistsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMobileTab('artists')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Artistas ({stats.uniqueArtists})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEqualizerOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border bg-slate-800/90 text-indigo-300 border-indigo-500/30 hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ecualizador</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsBulkDownloadOpen(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 border bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50 flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Descargar BD MP3</span>
                  </button>
                </div>

                {/* Mobile Active Folder Quick Bar */}
                <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {isFavoritesPlaylist(activePlaylist)
                        ? '❤️ Favoritas'
                        : activePlaylist === 'ALL'
                        ? '🎵 Toda la música'
                        : activePlaylist === 'OFFLINE'
                        ? '💾 Offline'
                        : `📁 ${activePlaylist}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">({filteredTracks.length})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenFolderDownload(activePlaylist === 'ALL' ? 'ALL' : activePlaylist)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow shrink-0 active:scale-95 transition-all"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Descargar Carpeta</span>
                  </button>
                </div>

                {/* Active Filter Banner if artist or playlist selected */}
                {(selectedArtist || (activePlaylist !== 'ALL' && !isFavoritesPlaylist(activePlaylist))) && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-xs">
                    <span className="text-purple-200 truncate">
                      Filtrando por:{' '}
                      <strong className="text-white">
                        {selectedArtist ? `Artista "${selectedArtist}"` : activePlaylist}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePlaylist('ALL');
                        setSelectedArtist(null);
                      }}
                      className="text-purple-400 hover:text-white font-bold ml-2 shrink-0 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Limpiar</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Track Table */}
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
                  setIsDiscoveryModalOpen(true);
                }}
                offlineTrackIds={offlineTrackIds}
                activePlaylist={activePlaylist}
                isFolderOffline={Boolean(offlinePlaylists[activePlaylist])}
                onToggleFolderOffline={handleTogglePlaylistOffline}
                onDirectDownloadTrack={handleDirectDownloadTrack}
              />
            </div>
          )}

          {mobileTab === 'playlists' && (
            <MobilePlaylistsView
              playlists={playlistsList}
              activePlaylist={activePlaylist}
              onSelectPlaylist={setActivePlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              onDeleteCustomPlaylist={handleDeleteCustomPlaylist}
              topArtists={stats.topArtists}
              selectedArtist={selectedArtist}
              onSelectArtist={setSelectedArtist}
              totalTracks={tracks.length}
              offlineCount={tracks.filter((t) => offlineTrackIds.has(t.id) || t.isOfflineAvailable).length}
              onNavigateToTracks={() => setMobileTab('tracks')}
              offlinePlaylists={offlinePlaylists}
              onToggleFolderOffline={handleTogglePlaylistOffline}
              onBatchDownloadZip={handleBatchDownloadZip}
              tracks={tracks}
            />
          )}

          {mobileTab === 'artists' && (
            <MobileArtistsView
              topArtists={stats.topArtists}
              selectedArtist={selectedArtist}
              onSelectArtist={setSelectedArtist}
              onNavigateToTracks={() => setMobileTab('tracks')}
              onPlayArtistSongs={(artist) => {
                const artistSongs = tracks.filter((t) => t.artist.toLowerCase() === artist.toLowerCase());
                if (artistSongs.length > 0) {
                  playTrackDirect(artistSongs[0], artistSongs);
                }
              }}
              tracks={tracks}
            />
          )}

          {mobileTab === 'favorites' && (
            <div className="flex flex-col w-full">
              {/* Active Favorites Header */}
              <div className="px-4 pt-3.5 pb-3 bg-gradient-to-b from-rose-950/60 via-slate-900 to-slate-950 border-b border-rose-500/30">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shrink-0 shadow-lg shadow-rose-900/20">
                      <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-bold text-white truncate">
                        Tus Canciones Favoritas
                      </h2>
                      <p className="text-xs text-rose-300 truncate">
                        {favoriteTracks.length} canciones con corazón ❤️
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {favoriteTracks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => playTrackDirect(favoriteTracks[0], favoriteTracks)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold text-xs active:scale-95 transition-transform shadow-md shadow-rose-600/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Reproducir</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenFolderDownload('Favorite Tracks')}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs active:scale-95 transition-all shadow-md shadow-emerald-600/25"
                      title="Descargar todas las canciones con corazón en MP3 completas para escuchar offline"
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                      <span>Descargar Carpeta</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Favorites Track Table */}
              <TrackTable
                tracks={favoriteTracks}
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
                  setIsDiscoveryModalOpen(true);
                }}
                offlineTrackIds={offlineTrackIds}
                activePlaylist="Favorite Tracks"
                isFolderOffline={Boolean(offlinePlaylists['Favorite Tracks'])}
                onToggleFolderOffline={handleTogglePlaylistOffline}
                onDirectDownloadTrack={handleDirectDownloadTrack}
              />
            </div>
          )}

          {mobileTab === 'tools' && (
            <MobileToolsView
              totalTracks={tracks.length}
              uniqueArtists={stats.uniqueArtists}
              duplicateCount={stats.duplicateCount}
              activePlaylist={activePlaylist}
              onOpenStats={() => setIsStatsModalOpen(true)}
              onOpenDuplicates={handleDeduplicate}
              onOpenBulkDownload={() => setIsBulkDownloadOpen(true)}
              onOpenFolderDownload={() => setIsFolderDownloadOpen(true)}
              onOpenEqualizer={() => setIsEqualizerOpen(true)}
              onOpenLyrics={() => setIsLyricsOpen(true)}
              onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
              onExportCSV={() => downloadTracksAsCSV(filteredTracks, `Deezer_Export_${activePlaylist}.csv`)}
              onExportM3U={() => downloadTracksAsM3U(filteredTracks, `Deezer_${activePlaylist}`)}
              onExportJSON={() => downloadTracksAsJSON(filteredTracks, `Deezer_Export_${activePlaylist}.json`)}
              onImportCSVFile={handleImportCSVFile}
              onRestoreOriginalLibrary={handleRestoreOriginalLibrary}
              hasActiveTrack={currentTrack !== null}
              sleepTimerRemaining={sleepTimerSecondsRemaining}
            />
          )}
        </div>

        {/* DESKTOP TRACK TABLE (hidden on mobile, visible on md and up) */}
        <div className="hidden md:flex flex-1 min-w-0 flex-col">
          {/* Active Folder Header Banner */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  isFavoritesPlaylist(activePlaylist)
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-rose-900/30'
                    : activePlaylist === 'OFFLINE'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-900/30'
                    : 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-purple-900/30'
                }`}
              >
                {isFavoritesPlaylist(activePlaylist) ? (
                  <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
                ) : activePlaylist === 'OFFLINE' ? (
                  <HardDrive className="w-5 h-5 text-emerald-400" />
                ) : activePlaylist === 'ALL' ? (
                  <ListMusic className="w-5 h-5 text-purple-400" />
                ) : (
                  <Disc className="w-5 h-5 text-purple-400" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white truncate">
                    {isFavoritesPlaylist(activePlaylist)
                      ? 'Carpeta de Canciones Favoritas'
                      : activePlaylist === 'ALL'
                      ? 'Todas las canciones'
                      : activePlaylist === 'OFFLINE'
                      ? 'Descargadas / Offline'
                      : `Carpeta: ${activePlaylist}`}
                  </h2>
                  {isFavoritesPlaylist(activePlaylist) && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                      ♥ Todas con corazón
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 truncate">
                  <strong className="text-slate-200">{filteredTracks.length}</strong> canciones
                  {selectedArtist && ` • Artista: ${selectedArtist}`}
                  {searchQuery && ` • Búsqueda: "${searchQuery}"`}
                  {' • '}
                  Audio Completo disponible para escuchar y descargar
                </p>
              </div>
            </div>

            {/* Folder Actions: Play & Download Complete Folder */}
            <div className="flex items-center gap-2 shrink-0">
              {filteredTracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => playTrackDirect(filteredTracks[0], filteredTracks)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md shadow-purple-600/30 active:scale-95 transition-all"
                  title="Reproducir canciones de esta carpeta"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reproducir</span>
                </button>
              )}

              {/* REQUESTED BUTTON: Descargar Carpeta Completa (Offline) */}
              <button
                type="button"
                onClick={() => handleOpenFolderDownload(activePlaylist === 'ALL' ? 'ALL' : activePlaylist)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 active:scale-95 transition-all border border-emerald-400/30"
                title="Descargar todas las canciones de esta carpeta en MP3 completo para escuchar offline"
              >
                <FolderDown className="w-4 h-4" />
                <span>Descargar Carpeta Completa (Offline)</span>
              </button>

              <button
                type="button"
                onClick={() => localAudioInputRef.current?.click()}
                className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                title="Importar archivos MP3 desde tu equipo a esta carpeta"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Importar MP3</span>
              </button>
            </div>
          </div>

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
              setIsDiscoveryModalOpen(true);
            }}
            offlineTrackIds={offlineTrackIds}
            activePlaylist={activePlaylist}
            isFolderOffline={Boolean(offlinePlaylists[activePlaylist])}
            onToggleFolderOffline={handleTogglePlaylistOffline}
            onDirectDownloadTrack={handleDirectDownloadTrack}
          />
        </div>
      </div>

      {/* Background Full Audio Stream Player */}
      <YouTubeAudioEmbed
        videoId={playbackSource === 'full' ? activeVideoId : null}
        isPlaying={isPlaying}
        volume={volume}
        isMuted={isMuted}
        onTimeUpdate={(curr, dur) => {
          if (typeof curr === 'number' && !isNaN(curr) && curr > 0.5) {
            setCurrentTime((prev) => {
              if (Math.abs(curr - prev) > 2.0) {
                lastTickTimeRef.current = performance.now();
                return curr;
              }
              return prev;
            });
          }
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
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        sleepTimerRemaining={sleepTimerSecondsRemaining}
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
        onOpenLyrics={() => setIsLyricsOpen(true)}
        onOpenEqualizer={() => setIsEqualizerOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        sleepTimerRemaining={sleepTimerSecondsRemaining}
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
        recentlyPlayed={recentlyPlayed}
        onPlayTrack={(track) => playTrackDirect(track)}
        onClearRecentlyPlayed={() => {
          setRecentlyPlayed([]);
          try {
            localStorage.removeItem(RECENTLY_PLAYED_KEY);
          } catch {}
        }}
      />

      {/* Synced Lyrics / Karaoke Modal */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
        onSeek={handleSeek}
      />

      {/* 5-Band Sound Equalizer Modal */}
      <EqualizerModal
        isOpen={isEqualizerOpen}
        onClose={() => setIsEqualizerOpen(false)}
        playbackSource={playbackSource}
        onTogglePlaybackSource={handleTogglePlaybackSource}
      />

      {/* Sleep Timer Modal */}
      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        timerMinutesRemaining={sleepTimerSecondsRemaining}
        onSetTimer={handleSetSleepTimer}
        onCancelTimer={handleCancelSleepTimer}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Single Full Song Download Modal */}
      <FullTrackDownloadModal
        isOpen={downloadModalTrack !== null}
        onClose={() => setDownloadModalTrack(null)}
        track={downloadModalTrack}
        onOpenBulkDownloadModal={() => setIsBulkDownloadOpen(true)}
        onTrackSavedOffline={(trackId) => {
          setOfflineTrackIds((prev) => new Set([...prev, trackId]));
          showToast('Canción guardada en el reproductor para escuchar sin conexión 💾');
        }}
      />

      {/* Folder Download Modal (Complete Songs & Structured ZIP per playlist) */}
      <FolderDownloadModal
        isOpen={isFolderDownloadOpen}
        onClose={() => setIsFolderDownloadOpen(false)}
        tracks={tracks}
        availablePlaylists={availablePlaylistNames}
        initialFolder={folderDownloadInitialName}
        onTriggerImportLocal={() => localAudioInputRef.current?.click()}
        offlinePlaylists={offlinePlaylists}
        onToggleFolderOffline={handleTogglePlaylistOffline}
      />

      {/* Song Discovery & Web Add Modal */}
      <SongDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        onAddTrackToPlaylist={(trackData, playlistName) => {
          handleAddTrack({ ...trackData, playlist: playlistName });
          showToast(`"${trackData.title}" agregada a ${playlistName}`);
        }}
        availablePlaylists={availablePlaylistNames}
        onCreatePlaylist={handleCreatePlaylist}
        onPlayTrackDirect={(track) => playTrackDirect(track)}
        onOpenDownloadModal={(track) => setDownloadModalTrack(track)}
      />

      {/* Hidden File Input for Importing Local Audio (.mp3, .m4a, .wav) */}
      <input
        type="file"
        ref={localAudioInputRef}
        multiple
        accept="audio/*,.mp3,.m4a,.wav,.flac,.ogg,.aac"
        className="hidden"
        onChange={(e) => {
          handleImportLocalAudioFiles(e.target.files);
          e.target.value = '';
        }}
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

      {/* Offline Sync Progress Modal */}
      {offlineSyncProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 shadow-lg shadow-emerald-950/50">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Descargando para modo Offline
            </h3>
            <p className="text-xs text-emerald-400 font-semibold mb-3">
              Carpeta: {offlineSyncProgress.playlistName}
            </p>
            <p className="text-xs text-slate-300 truncate max-w-full px-2 mb-4 font-medium">
              {offlineSyncProgress.trackTitle}
            </p>
            {/* Progress Bar */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden mb-2 border border-slate-700/60">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-200 rounded-full"
                style={{
                  width: `${Math.round((offlineSyncProgress.current / Math.max(1, offlineSyncProgress.total)) * 100)}%`,
                }}
              />
            </div>
            <div className="flex justify-between w-full text-[11px] text-slate-400 font-mono">
              <span>{offlineSyncProgress.current} de {offlineSyncProgress.total} canciones</span>
              <span>{Math.round((offlineSyncProgress.current / Math.max(1, offlineSyncProgress.total)) * 100)}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 bg-slate-800/60 rounded-xl px-3 py-1.5 border border-slate-700/40">
              Al finalizar, podrás escuchar todas las canciones sin conexión a internet ni consumo de datos.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Toast Notifications */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-purple-500/50 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2 pointer-events-none">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Persistent Mobile Bottom Navigation Bar (md:hidden) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={setMobileTab}
        tracksCount={filteredTracks.length}
        playlistsCount={playlistsList.length}
        favoritesCount={favoriteTracks.length}
      />
    </div>
  );
}
