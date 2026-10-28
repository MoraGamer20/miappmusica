import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Download,
  Heart,
  ExternalLink,
  MoreVertical,
  CheckSquare,
  Square,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  List,
  Music,
  Disc,
  FolderPlus,
  Trash2,
  FileArchive,
  Search,
  Check,
  Share2,
  Edit,
  Sparkles,
  HardDrive,
} from 'lucide-react';
import { Track, SortField, SortOrder } from '../types/music';
import { getStreamingLinks } from '../utils/downloadHelper';

interface TrackTableProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track, newQueue?: Track[]) => void;
  onTogglePlay: () => void;
  onToggleFavorite: (trackId: string) => void;
  onDeleteTrack: (trackId: string) => void;
  onEditTrack: (track: Track) => void;
  onBatchDownloadZip: (selectedTracks: Track[]) => void;
  onBatchExportM3U: (selectedTracks: Track[]) => void;
  onBatchExportCSV: (selectedTracks: Track[]) => void;
  onBatchAddToPlaylist: (selectedTracks: Track[], playlistName: string) => void;
  onBatchDelete: (selectedTrackIds: string[]) => void;
  onBatchMarkFavorite: (selectedTrackIds: string[]) => void;
  availablePlaylists: string[];
  searchQuery: string;
  onOpenDownloadModal: (track: Track) => void;
  onOpenSearchModal?: (query?: string) => void;
  offlineTrackIds?: Set<string>;
  activePlaylist?: string;
  isFolderOffline?: boolean;
  onToggleFolderOffline?: (folderName: string) => void;
  onDirectDownloadTrack?: (track: Track) => void;
}

export const TrackTable: React.FC<TrackTableProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleFavorite,
  onDeleteTrack,
  onEditTrack,
  onBatchDownloadZip,
  onBatchExportM3U,
  onBatchExportCSV,
  onBatchAddToPlaylist,
  onBatchDelete,
  onBatchMarkFavorite,
  availablePlaylists,
  searchQuery,
  onOpenDownloadModal,
  onOpenSearchModal,
  offlineTrackIds,
  activePlaylist,
  isFolderOffline,
  onToggleFolderOffline,
  onDirectDownloadTrack,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [activeMenuTrack, setActiveMenuTrack] = useState<Track | null>(null);
  const [isSelectModeActive, setIsSelectModeActive] = useState(false);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);

  // Sorting logic
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => {
      const valA = (a[sortField] || '').toLowerCase();
      const valB = (b[sortField] || '').toLowerCase();
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tracks, sortField, sortOrder]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(sortedTracks.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedTracks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTracks.slice(start, start + pageSize);
  }, [sortedTracks, currentPage, pageSize]);

  // Handle sort header click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllVisible = () => {
    const allVisible = paginatedTracks.every((t) => selectedIds.has(t.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisible) {
        paginatedTracks.forEach((t) => next.delete(t.id));
      } else {
        paginatedTracks.forEach((t) => next.add(t.id));
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
    setIsSelectModeActive(false);
  };

  const selectedTracksList = useMemo(() => {
    return tracks.filter((t) => selectedIds.has(t.id));
  }, [tracks, selectedIds]);

  // Color generator for album art fallback
  const getGradientForArtist = (artist: string) => {
    const gradients = [
      'from-purple-600 to-indigo-700',
      'from-rose-600 to-amber-600',
      'from-emerald-600 to-teal-700',
      'from-blue-600 to-cyan-700',
      'from-fuchsia-600 to-pink-700',
      'from-violet-600 to-purple-800',
    ];
    let hash = 0;
    for (let i = 0; i < artist.length; i++) {
      hash = artist.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full max-w-full bg-slate-950 pb-44 overflow-x-hidden">
      {/* =========================================================================
          OFFLINE FOLDER DOWNLOAD SWITCH: Download whole folder for offline listening
          ========================================================================= */}
      {onToggleFolderOffline && (
        <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isFolderOffline
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                Descargar para escuchar sin conexión
                {isFolderOffline && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    ✓ Activado
                  </span>
                )}
              </span>
              <p className="text-[10px] text-slate-400 truncate">
                {isFolderOffline
                  ? 'Canciones descargadas en este dispositivo • Se reproducen sin internet'
                  : 'Activa el switch para descargar todas las canciones y reproducir sin internet'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Batch Download Block Button */}
            <button
              type="button"
              onClick={() => onBatchDownloadZip(tracks)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-purple-600/25 text-purple-300 border border-purple-500/40 hover:bg-purple-600/40 active:scale-95 transition-all shadow-sm"
              title="Descargar este bloque de canciones completo en archivo ZIP"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Descargar Bloque ({tracks.length})</span>
              <span className="sm:hidden">Bloque</span>
            </button>

            {/* Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isFolderOffline}
              onClick={() => onToggleFolderOffline(activePlaylist || 'ALL')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isFolderOffline ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
              title={
                isFolderOffline
                  ? 'Desactivar descarga sin conexión'
                  : 'Descargar toda esta carpeta para escuchar sin conexión'
              }
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isFolderOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          CONTROLS TOOLBAR: Opaque background, no conflicting sticky offsets or blurs
          ========================================================================= */}
      <div className="flex items-center justify-between gap-2 px-3.5 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800/90 bg-slate-950 sticky top-0 md:top-16 z-20 w-full max-w-full">
        {/* Left: Select All / Count info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Select Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSelectModeActive) {
                handleClearSelection();
              } else {
                setIsSelectModeActive(true);
              }
            }}
            className={`md:hidden px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              isSelectModeActive || selectedIds.size > 0
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {isSelectModeActive || selectedIds.size > 0
              ? `${selectedIds.size} elegidas`
              : 'Seleccionar'}
          </button>

          {/* Desktop Select All Checkbox */}
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors shrink-0"
          >
            {paginatedTracks.length > 0 && paginatedTracks.every((t) => selectedIds.has(t.id)) ? (
              <CheckSquare className="w-4 h-4 text-purple-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Página ({paginatedTracks.length})</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Track count badge */}
          <span className="text-xs text-slate-400 truncate">
            <strong className="text-slate-100 font-bold">{tracks.length.toLocaleString()}</strong> canciones
            {searchQuery && (
              <span className="ml-1 text-purple-400 font-medium">para "{searchQuery}"</span>
            )}
          </span>
        </div>

        {/* Right: Sort & Layout controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-');
                setSortField(f as SortField);
                setSortOrder(o as SortOrder);
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              aria-label="Ordenar canciones por"
            >
              <option value="title-asc">Título (A-Z)</option>
              <option value="title-desc">Título (Z-A)</option>
              <option value="artist-asc">Artista (A-Z)</option>
              <option value="artist-desc">Artista (Z-A)</option>
              <option value="album-asc">Álbum (A-Z)</option>
              <option value="playlist-asc">Playlist</option>
            </select>
          </div>

          {/* Desktop View Mode Toggle */}
          <div className="hidden sm:flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista de lista"
              aria-label="Vista de lista"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista de cuadrícula"
              aria-label="Vista de cuadrícula"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Batch Actions Bar (visible when 1+ tracks are checked) */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-36 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-purple-500/60 rounded-2xl shadow-2xl shadow-purple-950/80 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-2xl w-[94%] sm:w-auto overflow-x-auto backdrop-blur-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
              {selectedIds.size}
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">elegidas</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 shrink-0" />

          {/* Download ZIP */}
          <button
            type="button"
            onClick={() => onBatchDownloadZip(selectedTracksList)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/40 transition-colors font-medium shrink-0"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>Descargar ZIP (Completas)</span>
          </button>

          {/* Mark Favorites */}
          <button
            type="button"
            onClick={() => {
              onBatchMarkFavorite(Array.from(selectedIds));
              handleClearSelection();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-colors font-medium shrink-0"
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>Favoritas</span>
          </button>

          {/* Add to Playlist */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/40 transition-colors font-medium"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>A Playlist</span>
            </button>

            {showPlaylistDropdown && (
              <div className="absolute bottom-full mb-2 left-0 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 z-50">
                <p className="px-3 py-1 text-[10px] text-slate-400 uppercase font-bold">
                  Seleccionar Playlist
                </p>
                {availablePlaylists.map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => {
                      onBatchAddToPlaylist(selectedTracksList, pl);
                      setShowPlaylistDropdown(false);
                      handleClearSelection();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-purple-600 hover:text-white transition-colors truncate"
                  >
                    {pl}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Selection */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Eliminar ${selectedIds.size} canciones seleccionadas?`)) {
                onBatchDelete(Array.from(selectedIds));
                handleClearSelection();
              }
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 text-rose-400 border border-rose-800 hover:bg-rose-900/60 transition-colors font-medium shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-slate-400 hover:text-white text-xs underline shrink-0 px-1"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Empty Search Result State */}
      {paginatedTracks.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/10 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/20">
            <Music className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No se encontraron canciones</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {searchQuery
              ? `No hay coincidencias en tu biblioteca local para "${searchQuery}".`
              : 'Esta playlist o filtro no tiene canciones registradas aún.'}
          </p>
          {onOpenSearchModal && (
            <button
              type="button"
              onClick={() => onOpenSearchModal(searchQuery)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Buscar & Descargar en la Web</span>
            </button>
          )}
        </div>
      )}

      {/* =========================================================================
          1. DEDICATED MOBILE VIEW (< md): Native touch-friendly song cards feed
          No HTML table, no weird blur cuts, high touch targets, smooth scrolling
          ========================================================================= */}
      <div className="md:hidden flex flex-col divide-y divide-slate-800/60 px-2 sm:px-3 pt-1">
        {paginatedTracks.map((track) => {
          const isCurrent = currentTrack?.id === track.id;
          const isSelected = selectedIds.has(track.id);

          return (
            <div
              key={track.id}
              className={`flex items-center justify-between py-2.5 px-2 rounded-2xl transition-all ${
                isSelected
                  ? 'bg-purple-900/30'
                  : isCurrent
                  ? 'bg-purple-950/40 ring-1 ring-purple-500/40'
                  : 'active:bg-slate-900/80'
              }`}
            >
              {/* Optional Selection Checkbox in Select Mode */}
              {(isSelectModeActive || selectedIds.size > 0) && (
                <button
                  type="button"
                  onClick={() => handleToggleSelect(track.id)}
                  className="mr-2 p-1 text-slate-400"
                  aria-label={`Seleccionar ${track.title}`}
                >
                  {isSelected ? (
                    <CheckSquare className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              )}

              {/* Album Art + Play Button */}
              <div
                onClick={() => {
                  if (isCurrent) {
                    onTogglePlay();
                  } else {
                    onPlayTrack(track, sortedTracks);
                  }
                }}
                className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 cursor-pointer shadow-md active:scale-95 transition-transform"
              >
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    alt={track.album}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-tr ${getGradientForArtist(
                      track.artist
                    )} flex items-center justify-center text-white font-bold text-xs shadow-inner`}
                  >
                    <Disc className={`w-5 h-5 ${isCurrent && isPlaying ? 'animate-spin' : ''}`} />
                  </div>
                )}

                {/* Active Playing Equalizer Indicator Overlay */}
                {isCurrent && isPlaying && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3.5 bg-purple-400 rounded-full animate-bounce" />
                    <span className="w-1 h-5 bg-pink-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                )}

                {/* Paused Current Track Overlay */}
                {isCurrent && !isPlaying && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Play className="w-5 h-5 text-purple-400 fill-purple-400 ml-0.5" />
                  </div>
                )}
              </div>

              {/* Title & Artist details (Tap to play) */}
              <div
                onClick={() => {
                  if (isCurrent) {
                    onTogglePlay();
                  } else {
                    onPlayTrack(track, sortedTracks);
                  }
                }}
                className="flex-1 min-w-0 px-3 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      isCurrent ? 'text-purple-400 font-bold' : 'text-slate-100'
                    }`}
                  >
                    {track.title}
                  </p>
                  {(offlineTrackIds?.has(track.id) || track.isOfflineAvailable) && (
                    <span title="Audio descargado / En disco" className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded shrink-0">
                      Offline
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate mt-0.5">
                  <span className="truncate">{track.artist}</span>
                  {track.album && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="truncate text-slate-500">{track.album}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Actions (Heart + Download + Menu) */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Heart Button */}
                <button
                  type="button"
                  onClick={() => onToggleFavorite(track.id)}
                  aria-label={track.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 active:scale-90 transition-transform"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      track.isFavorite ? 'text-rose-500 fill-rose-500' : 'hover:text-white'
                    }`}
                  />
                </button>

                {/* 1-Tap Download Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onDirectDownloadTrack) {
                      onDirectDownloadTrack(track);
                    } else {
                      onOpenDownloadModal(track);
                    }
                  }}
                  aria-label={`Descargar ${track.title}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-400 active:scale-90 transition-transform"
                  title="Descargar archivo MP3 directo"
                >
                  <Download className={`w-4 h-4 ${offlineTrackIds?.has(track.id) ? 'text-emerald-400' : ''}`} />
                </button>

                {/* 3-Dots Action Sheet Button */}
                <button
                  type="button"
                  onClick={() => setActiveMenuTrack(track)}
                  aria-label="Más opciones"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          2. DESKTOP VIEW (>= md): Full data table with rich headers & actions
          ========================================================================= */}
      <div className="hidden md:block flex-1 min-w-0 overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-semibold select-none sticky top-16 z-10 backdrop-blur-md">
              <th className="py-3 px-4 w-10 text-center">#</th>
              <th
                onClick={() => handleSort('title')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Título</span>
                  {sortField === 'title' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('artist')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Artista</span>
                  {sortField === 'artist' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('album')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Álbum</span>
                  {sortField === 'album' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('playlist')}
                className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Playlist</span>
                  {sortField === 'playlist' ? (
                    sortOrder === 'asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    )
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-600" />
                  )}
                </div>
              </th>
              <th className="py-3 px-4 text-right w-28">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedTracks.map((track) => {
              const isSelected = selectedIds.has(track.id);
              const isCurrent = currentTrack?.id === track.id;

              return (
                <tr
                  key={track.id}
                  className={`group transition-colors ${
                    isSelected
                      ? 'bg-purple-900/20 hover:bg-purple-900/30'
                      : isCurrent
                      ? 'bg-purple-950/40 hover:bg-purple-950/60'
                      : 'hover:bg-slate-900/70'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="py-2.5 px-4 text-center text-slate-500 font-mono text-[11px] relative">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(track.id)}
                        aria-label={`Seleccionar ${track.title}`}
                        className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Title with Play Button & Cover */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 group/cover">
                        {track.coverUrl ? (
                          <img
                            src={track.coverUrl}
                            alt={track.album}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${getGradientForArtist(
                              track.artist
                            )} flex items-center justify-center text-white font-bold text-xs shadow-inner`}
                          >
                            <Disc className={`w-5 h-5 ${isCurrent && isPlaying ? 'animate-spin' : ''}`} />
                          </div>
                        )}

                        {/* Hover Play Button Overlay */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrent) {
                              onTogglePlay();
                            } else {
                              onPlayTrack(track, sortedTracks);
                            }
                          }}
                          aria-label={
                            isCurrent && isPlaying ? `Pausar ${track.title}` : `Reproducir ${track.title}`
                          }
                          className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                            isCurrent ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-5 h-5 text-purple-400 fill-purple-400" />
                          ) : (
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          )}
                        </button>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p
                            className={`font-semibold truncate ${
                              isCurrent ? 'text-purple-400 font-bold' : 'text-slate-100'
                            }`}
                          >
                            {track.title}
                          </p>
                          {(offlineTrackIds?.has(track.id) || track.isOfflineAvailable) && (
                            <span title="Audio descargado / En disco" className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded shrink-0">
                              Offline
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate md:hidden">
                          {track.artist}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="py-2.5 px-3 text-slate-300 font-medium truncate max-w-[160px]">
                    {track.artist}
                  </td>

                  {/* Album */}
                  <td className="py-2.5 px-3 text-slate-400 truncate max-w-[180px]">
                    {track.album || '—'}
                  </td>

                  {/* Playlist Badge */}
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80 truncate max-w-[120px]">
                      {track.playlist || 'Sin lista'}
                    </span>
                  </td>

                  {/* Desktop Actions */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(track.id)}
                        aria-label={track.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            track.isFavorite ? 'text-rose-500 fill-rose-500' : ''
                          }`}
                        />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onDirectDownloadTrack) {
                            onDirectDownloadTrack(track);
                          } else {
                            onOpenDownloadModal(track);
                          }
                        }}
                        aria-label={`Descargar ${track.title}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Descargar archivo MP3 directo"
                      >
                        <Download className={`w-4 h-4 ${offlineTrackIds?.has(track.id) ? 'text-emerald-400' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveMenuTrack(track)}
                        aria-label="Más opciones"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          PAGINATION BAR: Mobile & Desktop friendly
          ========================================================================= */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950 text-xs text-slate-400">
          <div>
            Página <strong className="text-white">{currentPage}</strong> de{' '}
            <strong className="text-white">{totalPages}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors font-medium"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors font-medium"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TRACK OPTIONS BOTTOM SHEET / MODAL
          ========================================================================= */}
      {activeMenuTrack && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-150 p-0 sm:p-4"
          onClick={() => setActiveMenuTrack(null)}
        >
          <div
            className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-4 shadow-2xl space-y-3 pb-safe animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto sm:hidden" />

            {/* Track Info Header */}
            <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-800 overflow-hidden shrink-0 shadow">
                {activeMenuTrack.coverUrl ? (
                  <img
                    src={activeMenuTrack.coverUrl}
                    alt={activeMenuTrack.album}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-purple-600/30 text-purple-300">
                    <Disc className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{activeMenuTrack.title}</h4>
                <p className="text-xs text-slate-400 truncate">{activeMenuTrack.artist}</p>
                <p className="text-[10px] text-purple-400 truncate">
                  Playlist: {activeMenuTrack.playlist || 'Biblioteca principal'}
                </p>
              </div>
            </div>

            {/* Menu options list */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onPlayTrack(activeMenuTrack, sortedTracks);
                  setActiveMenuTrack(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Play className="w-4 h-4 text-purple-400" />
                <span>Reproducir ahora</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenDownloadModal(activeMenuTrack);
                  setActiveMenuTrack(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40 transition-colors"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Descargar Canción Completa MP3 (320kbps)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleFavorite(activeMenuTrack.id);
                  setActiveMenuTrack(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Heart
                  className={`w-4 h-4 ${
                    activeMenuTrack.isFavorite
                      ? 'text-rose-500 fill-rose-500'
                      : 'text-slate-400'
                  }`}
                />
                <span>
                  {activeMenuTrack.isFavorite ? 'Quitar de Favoritas' : 'Marcar como Favorita'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onEditTrack(activeMenuTrack);
                  setActiveMenuTrack(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
              >
                <Edit className="w-4 h-4 text-blue-400" />
                <span>Editar información de la canción</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Eliminar "${activeMenuTrack.title}" de tu biblioteca?`)) {
                    onDeleteTrack(activeMenuTrack.id);
                    setActiveMenuTrack(null);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar de la biblioteca</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveMenuTrack(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
