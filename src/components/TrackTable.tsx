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
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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
  };

  const selectedTracksList = useMemo(() => {
    return tracks.filter((t) => selectedIds.has(t.id));
  }, [tracks, selectedIds]);

  // Single track download modal trigger
  const handleDownloadSingle = (track: Track) => {
    onOpenDownloadModal(track);
  };

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
    <div className="flex-1 flex flex-col min-w-0 w-full max-w-full bg-slate-950 pb-36 overflow-x-hidden">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/60 sticky top-14 sm:top-16 z-20 backdrop-blur-md w-full max-w-full">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={handleSelectAllVisible}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors shrink-0"
          >
            {paginatedTracks.length > 0 && paginatedTracks.every((t) => selectedIds.has(t.id)) ? (
              <CheckSquare className="w-4 h-4 text-purple-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">Página ({paginatedTracks.length})</span>
          </button>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <span className="text-xs text-slate-400 truncate">
            <strong className="text-slate-200">{tracks.length.toLocaleString()}</strong> canciones
            {searchQuery && (
              <span className="ml-1 text-purple-400 font-medium hidden sm:inline">para "{searchQuery}"</span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Page size selector */}
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span className="hidden md:inline">Por pág:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-800 border border-slate-700 text-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={250}>250</option>
              <option value={1000}>1,000</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
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
        <div className="fixed bottom-32 sm:bottom-24 left-1/2 -translate-x-1/2 z-40 bg-slate-900 border border-purple-500/50 rounded-2xl shadow-2xl shadow-purple-900/40 px-3 sm:px-5 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-2xl w-[94%] sm:w-auto overflow-x-auto">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-xs">
              {selectedIds.size}
            </span>
            <span className="font-semibold text-slate-200 hidden sm:inline">seleccionadas</span>
          </div>

          <div className="h-5 w-[1px] bg-slate-700 shrink-0" />

          {/* Action: Play Selected */}
          <button
            type="button"
            onClick={() => onPlayTrack(selectedTracksList[0], selectedTracksList)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-colors shadow-sm shrink-0"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Reproducir</span>
          </button>

          {/* Action: Download ZIP */}
          <button
            type="button"
            onClick={() => onBatchDownloadZip(selectedTracksList)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors shadow-sm shrink-0"
            title="Descargar paquete ZIP con MP3s y Playlist M3U"
          >
            <FileArchive className="w-3.5 h-3.5" />
            <span>ZIP</span>
          </button>

          {/* Action: Add to Playlist */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowPlaylistDropdown(!showPlaylistDropdown)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
            >
              <FolderPlus className="w-3.5 h-3.5 text-blue-400" />
              <span>Playlist</span>
            </button>
            {showPlaylistDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowPlaylistDropdown(false)} />
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400">
                    Añadir a playlist:
                  </div>
                  {availablePlaylists.map((pl) => (
                    <button
                      key={pl}
                      type="button"
                      onClick={() => {
                        onBatchAddToPlaylist(selectedTracksList, pl);
                        setShowPlaylistDropdown(false);
                        handleClearSelection();
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 truncate"
                    >
                      {pl}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Action: Mark Favorite */}
          <button
            type="button"
            onClick={() => {
              onBatchMarkFavorite(Array.from(selectedIds));
              handleClearSelection();
            }}
            className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Marcar como favoritas"
          >
            <Heart className="w-4 h-4" />
          </button>

          {/* Action: Delete */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Seguro que deseas eliminar ${selectedIds.size} canciones de la biblioteca?`)) {
                onBatchDelete(Array.from(selectedIds));
                handleClearSelection();
              }
            }}
            className="p-1.5 text-slate-300 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Eliminar seleccionadas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClearSelection}
            className="text-[11px] text-slate-400 hover:text-white underline ml-auto shrink-0"
          >
            Limpiar
          </button>
        </div>
      )}

      {/* Empty State */}
      {paginatedTracks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <Music className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-200 mb-1">No se encontraron canciones</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {searchQuery
              ? `No hay coincidencias para "${searchQuery}" en tu biblioteca local.`
              : 'Tu biblioteca está vacía o no hay canciones en este filtro.'}
          </p>

          {searchQuery && onOpenSearchModal && (
            <button
              type="button"
              onClick={() => onOpenSearchModal(searchQuery)}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar "{searchQuery}" en la Web</span>
            </button>
          )}
        </div>
      )}

      {/* 1. MOBILE NATIVE LIST VIEW (< sm) */}
      {viewMode === 'table' && paginatedTracks.length > 0 && (
        <div className="sm:hidden divide-y divide-slate-800/60 w-full max-w-full">
          {paginatedTracks.map((track) => {
            const isSelected = selectedIds.has(track.id);
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`flex items-center gap-2.5 px-3 py-2.5 transition-colors w-full ${
                  isSelected
                    ? 'bg-purple-900/25'
                    : isCurrent
                    ? 'bg-purple-950/40 border-l-2 border-purple-500'
                    : 'active:bg-slate-900/80'
                }`}
              >
                {/* Select Checkbox (40px hitbox) */}
                <label className="min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(track.id)}
                    aria-label={`Seleccionar ${track.title}`}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Album Cover with Play/Pause Button (44x44px target) */}
                <div
                  onClick={() => {
                    if (isCurrent) {
                      onTogglePlay();
                    } else {
                      onPlayTrack(track, sortedTracks);
                    }
                  }}
                  className="relative w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-800 cursor-pointer shadow-sm active:scale-95 transition-transform"
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
                      )} flex items-center justify-center text-white`}
                    >
                      <Disc className={`w-5 h-5 ${isCurrent && isPlaying ? 'animate-spin' : ''}`} />
                    </div>
                  )}

                  {/* Play/Pause Badge Overlay */}
                  <div
                    className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                      isCurrent ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-5 h-5 text-purple-400 fill-purple-400" />
                    ) : (
                      <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                    )}
                  </div>
                </div>

                {/* Track Info (Title, Artist, Album, Playlist) */}
                <div
                  onClick={() => {
                    if (isCurrent) {
                      onTogglePlay();
                    } else {
                      onPlayTrack(track, sortedTracks);
                    }
                  }}
                  className="flex-1 min-w-0 cursor-pointer pr-1"
                >
                  <p
                    className={`text-sm font-medium truncate ${
                      isCurrent ? 'text-purple-400 font-semibold' : 'text-slate-100'
                    }`}
                  >
                    {track.title}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
                    <span className="truncate">{track.artist}</span>
                    {track.album && (
                      <>
                        <span className="text-slate-600">·</span>
                        <span className="truncate text-slate-500">{track.album}</span>
                      </>
                    )}
                  </div>
                  {track.playlist && track.playlist !== 'Biblioteca' && (
                    <span className="inline-block text-[10px] text-purple-400/90 font-medium truncate max-w-[140px]">
                      {track.playlist}
                    </span>
                  )}
                </div>

                {/* Actions: Heart + Download + More (Touch Targets >= 44px) */}
                <div className="flex items-center shrink-0">
                  {/* Heart button */}
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(track.id)}
                    aria-label={track.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    className="w-10 h-10 flex items-center justify-center rounded-lg active:scale-90 transition-transform"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        track.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-500'
                      }`}
                    />
                  </button>

                  {/* Download single MP3 button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadSingle(track)}
                    aria-label={`Descargar ${track.title}`}
                    className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 active:text-emerald-400 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* More Menu */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveMenuId(activeMenuId === track.id ? null : track.id)}
                      aria-label="Más opciones"
                      className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 active:text-white transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === track.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="fixed sm:absolute bottom-4 sm:bottom-auto right-4 sm:right-0 sm:mt-1 w-64 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 p-2 text-left text-xs animate-in fade-in slide-in-from-bottom duration-150">
                          <div className="px-3 py-2 border-b border-slate-800">
                            <p className="font-semibold text-white truncate">{track.title}</p>
                            <p className="text-[11px] text-slate-400 truncate">{track.artist}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onEditTrack(track);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                          >
                            <span>Editar detalles</span>
                          </button>
                          <a
                            href={getStreamingLinks(track).spotify}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                          >
                            <span>Buscar en Spotify</span>
                          </a>
                          <a
                            href={getStreamingLinks(track).youtubeMusic}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                          >
                            <span>Buscar en YouTube</span>
                          </a>
                          {track.deezerId && (
                            <a
                              href={`https://www.deezer.com/track/${track.deezerId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full px-3 py-2 text-slate-200 hover:bg-slate-800 rounded-lg flex items-center gap-2"
                            >
                              <span>Abrir en Deezer</span>
                            </a>
                          )}
                          <div className="border-t border-slate-800 my-1" />
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar "${track.title}" de la biblioteca?`)) {
                                onDeleteTrack(track.id);
                              }
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3 py-2 text-rose-400 hover:bg-rose-950/30 rounded-lg flex items-center gap-2"
                          >
                            <span>Eliminar pista</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. DESKTOP RICH TABLE VIEW (sm and up) */}
      {viewMode === 'table' && paginatedTracks.length > 0 && (
        <div className="hidden sm:block w-full max-w-full overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-semibold select-none">
                <th className="py-3 px-4 w-10 text-center">#</th>
                <th
                  onClick={() => handleSort('title')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Título</span>
                    {sortField === 'title' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
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
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('album')}
                  className="py-3 px-3 hidden md:table-cell cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Álbum</span>
                    {sortField === 'album' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('playlist')}
                  className="py-3 px-3 hidden lg:table-cell cursor-pointer hover:text-slate-200 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Playlist</span>
                    {sortField === 'playlist' ? (
                      sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-purple-400" /> : <ArrowDown className="w-3.5 h-3.5 text-purple-400" />
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
                    {/* Index & Selection Checkbox */}
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
                        {/* Play/Pause Button / Thumbnail */}
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
                            aria-label={isCurrent && isPlaying ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
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

                        {/* Title text */}
                        <div className="min-w-0">
                          <p
                            className={`font-medium truncate ${
                              isCurrent ? 'text-purple-400 font-semibold' : 'text-slate-100'
                            }`}
                          >
                            {track.title}
                          </p>
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
                    <td className="py-2.5 px-3 text-slate-400 hidden md:table-cell truncate max-w-[180px]">
                      {track.album || '—'}
                    </td>

                    {/* Playlist Badge */}
                    <td className="py-2.5 px-3 hidden lg:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/80 truncate max-w-[120px]">
                        {track.playlist}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Favorite button */}
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(track.id)}
                          aria-label={track.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                          className={`p-1.5 rounded-md transition-colors ${
                            track.isFavorite
                              ? 'text-rose-500 hover:text-rose-400 fill-rose-500'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current' : ''}`} />
                        </button>

                        {/* Download MP3 Preview button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadSingle(track)}
                          disabled={downloadingId === track.id}
                          aria-label={`Descargar ${track.title}`}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors disabled:opacity-50"
                          title="Descargar audio MP3 de la canción"
                        >
                          <Download className={`w-4 h-4 ${downloadingId === track.id ? 'animate-bounce text-emerald-400' : ''}`} />
                        </button>

                        {/* Deezer External Link */}
                        {track.deezerId && (
                          <a
                            href={`https://www.deezer.com/track/${track.deezerId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Ver ${track.title} en Deezer`}
                            className="p-1.5 text-slate-400 hover:text-purple-400 hover:bg-slate-800 rounded-md transition-colors"
                            title="Abrir en Deezer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {/* More Menu Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuId(activeMenuId === track.id ? null : track.id)}
                            aria-label={`Opciones para ${track.title}`}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeMenuId === track.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setActiveMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50 py-1 text-left text-xs animate-in fade-in duration-150">
                                <button
                                  type="button"
                                  onClick={() => {
                                    onEditTrack(track);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-slate-200 hover:bg-slate-700/80 flex items-center gap-2"
                                >
                                  <span>Editar detalles</span>
                                </button>
                                <a
                                  href={getStreamingLinks(track).spotify}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3 py-1.5 text-slate-200 hover:bg-slate-700/80 flex items-center gap-2"
                                >
                                  <span>Buscar en Spotify</span>
                                </a>
                                <a
                                  href={getStreamingLinks(track).youtubeMusic}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full px-3 py-1.5 text-slate-200 hover:bg-slate-700/80 flex items-center gap-2"
                                >
                                  <span>Buscar en YouTube</span>
                                </a>
                                <div className="border-t border-slate-700 my-1" />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`¿Eliminar "${track.title}" de la biblioteca?`)) {
                                      onDeleteTrack(track.id);
                                    }
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                                >
                                  <span>Eliminar pista</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. GRID CARDS VIEW */}
      {viewMode === 'grid' && paginatedTracks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 p-3 sm:p-6 w-full max-w-full">
          {paginatedTracks.map((track) => {
            const isSelected = selectedIds.has(track.id);
            const isCurrent = currentTrack?.id === track.id;

            return (
              <div
                key={track.id}
                className={`group relative rounded-2xl p-2.5 sm:p-3 bg-slate-900 border transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/30'
                    : isCurrent
                    ? 'border-purple-600/60 bg-purple-950/30'
                    : 'border-slate-800 hover:border-slate-700 hover:bg-slate-850 hover:shadow-xl'
                }`}
              >
                {/* Checkbox badge on card */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(track.id)}
                    aria-label={`Seleccionar ${track.title}`}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900/80 text-purple-600 focus:ring-0 cursor-pointer shadow-md"
                  />
                </div>

                {/* Album Cover with Play Overlay */}
                <div className="relative aspect-square rounded-xl overflow-hidden mb-2 sm:mb-3 bg-slate-800 shadow-inner">
                  {track.coverUrl ? (
                    <img
                      src={track.coverUrl}
                      alt={track.album}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`w-full h-full bg-gradient-to-tr ${getGradientForArtist(
                        track.artist
                      )} flex items-center justify-center text-white`}
                    >
                      <Disc className={`w-10 h-10 ${isCurrent && isPlaying ? 'animate-spin' : ''}`} />
                    </div>
                  )}

                  {/* Play Button Overlay */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isCurrent) {
                        onTogglePlay();
                      } else {
                        onPlayTrack(track, sortedTracks);
                      }
                    }}
                    aria-label={isCurrent && isPlaying ? `Pausar ${track.title}` : `Reproducir ${track.title}`}
                    className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-black/50 transition-all ${
                      isCurrent
                        ? 'opacity-100 scale-100'
                        : 'opacity-90 sm:opacity-0 group-hover:opacity-100 scale-100 sm:scale-90 group-hover:scale-100'
                    }`}
                  >
                    {isCurrent && isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>

                {/* Song Meta */}
                <h4 className="font-semibold text-slate-100 text-xs truncate mb-0.5" title={track.title}>
                  {track.title}
                </h4>
                <p className="text-[11px] text-slate-400 truncate mb-1.5 sm:mb-2" title={track.artist}>
                  {track.artist}
                </p>

                {/* Footer on Card: Playlist & Heart */}
                <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-500 truncate max-w-[70px] sm:max-w-[80px]">
                    {track.playlist}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(track.id)}
                      className={`p-1 rounded ${track.isFavorite ? 'text-rose-500 fill-rose-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${track.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(track)}
                      disabled={downloadingId === track.id}
                      className="p-1 text-slate-400 hover:text-emerald-400 rounded transition-colors"
                      title="Descargar MP3"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === track.id ? 'animate-bounce text-emerald-400' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400 w-full max-w-full">
          <div>
            Pág <span className="text-white font-semibold">{currentPage}</span> /{' '}
            <span className="text-white font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
