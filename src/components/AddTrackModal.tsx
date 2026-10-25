import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Music,
  Disc,
  Loader2,
  Check,
  Play,
  Pause,
  Download,
  FolderPlus,
  Sparkles,
  ExternalLink,
  CheckSquare,
  Square,
  Globe,
  Radio,
} from 'lucide-react';
import { Track } from '../types/music';
import { searchOnlineMusicCatalog } from '../utils/deezerService';
import { downloadTrackAudio } from '../utils/downloadHelper';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Omit<Track, 'id'>) => void;
  onBatchAddTracks?: (tracks: Omit<Track, 'id'>[]) => void;
  availablePlaylists: string[];
  onCreatePlaylist?: (name: string) => void;
  onOpenDownloadModal?: (track: Track) => void;
  initialQuery?: string;
  onOpenVercelGuide?: () => void;
}

const QUICK_TRENDING_CHIPS = [
  'Morat',
  'Bad Bunny',
  'Twenty One Pilots',
  'Ed Maverick',
  'Rock en Español',
  'Reggaeton 2024',
  'Pop Latino',
  'Kevin Kaarl',
  'Coldplay',
  'Måneskin',
];

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  onBatchAddTracks,
  availablePlaylists,
  onCreatePlaylist,
  onOpenDownloadModal,
  initialQuery = '',
  onOpenVercelGuide,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [selectedResultIds, setSelectedResultIds] = useState<Set<string>>(new Set());

  // Playlist selection & creation
  const [targetPlaylist, setTargetPlaylist] = useState(availablePlaylists[0] || 'Biblioteca');
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistInput, setNewPlaylistInput] = useState('');

  // In-modal audio preview player
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Manual form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualAlbum, setManualAlbum] = useState('');
  const [manualDeezerId, setManualDeezerId] = useState('');
  const [manualIsrc, setManualIsrc] = useState('');

  // Stop audio when modal closes or unmounts
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
      setPlayingPreviewId(null);
    } else if (initialQuery && initialQuery.trim()) {
      setSearchQuery(initialQuery);
      handleSearchQuery(initialQuery);
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  const handleSearchQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchOnlineMusicCatalog(queryText);
      setSearchResults(results);
      setSelectedResultIds(new Set());
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchQuery(searchQuery);
  };

  const handleSelectQuickChip = (chip: string) => {
    setSearchQuery(chip);
    handleSearchQuery(chip);
  };

  const handleCreateNewPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPlaylistInput.trim();
    if (!trimmed) return;
    if (onCreatePlaylist) {
      onCreatePlaylist(trimmed);
    }
    setTargetPlaylist(trimmed);
    setNewPlaylistInput('');
    setIsCreatingPlaylist(false);
  };

  // Preview Playback
  const handleTogglePreview = (item: Track) => {
    if (!item.previewUrl) return;

    if (playingPreviewId === item.id) {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
      setPlayingPreviewId(null);
      return;
    }

    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio();
    }

    const audio = previewAudioRef.current;
    audio.src = item.previewUrl;
    audio.volume = 0.85;
    audio
      .play()
      .then(() => {
        setPlayingPreviewId(item.id);
      })
      .catch((err) => {
        console.warn('Could not play preview', err);
        setPlayingPreviewId(null);
      });

    audio.onended = () => {
      setPlayingPreviewId(null);
    };
    audio.onerror = () => {
      setPlayingPreviewId(null);
    };
  };

  // Add individual track
  const handleAddFromSearch = (item: Track) => {
    onAddTrack({
      title: item.title,
      artist: item.artist,
      album: item.album || 'Single',
      playlist: targetPlaylist,
      type: 'Track',
      isrc: item.isrc || '',
      deezerId: item.deezerId || '',
      previewUrl: item.previewUrl,
      coverUrl: item.coverUrl,
      duration: item.duration,
      isFavorite: false,
    });
    setAddedIds((prev) => new Set(prev).add(item.id));
  };

  // Batch Add selected
  const handleAddSelected = () => {
    const toAdd = searchResults.filter(
      (r) => selectedResultIds.has(r.id) && !addedIds.has(r.id)
    );
    if (toAdd.length === 0) return;

    if (onBatchAddTracks) {
      onBatchAddTracks(
        toAdd.map((item) => ({
          title: item.title,
          artist: item.artist,
          album: item.album || 'Single',
          playlist: targetPlaylist,
          type: 'Track',
          isrc: item.isrc || '',
          deezerId: item.deezerId || '',
          previewUrl: item.previewUrl,
          coverUrl: item.coverUrl,
          duration: item.duration,
          isFavorite: false,
        }))
      );
    } else {
      toAdd.forEach((item) => handleAddFromSearch(item));
    }

    setAddedIds((prev) => {
      const next = new Set(prev);
      toAdd.forEach((t) => next.add(t.id));
      return next;
    });
    setSelectedResultIds(new Set());
  };

  // Toggle selection for batch
  const handleToggleSelectResult = (id: string) => {
    setSelectedResultIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllResults = () => {
    if (selectedResultIds.size === searchResults.length) {
      setSelectedResultIds(new Set());
    } else {
      setSelectedResultIds(new Set(searchResults.map((r) => r.id)));
    }
  };

  // Direct download action
  const handleDirectDownload = async (track: Track) => {
    if (onOpenDownloadModal) {
      onOpenDownloadModal({
        ...track,
        playlist: targetPlaylist,
      });
    } else {
      await downloadTrackAudio(track);
    }
  };

  // Manual Form submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualArtist.trim()) return;

    onAddTrack({
      title: manualTitle.trim(),
      artist: manualArtist.trim(),
      album: manualAlbum.trim() || 'Single',
      playlist: targetPlaylist,
      type: 'Track',
      isrc: manualIsrc.trim(),
      deezerId: manualDeezerId.trim(),
      isFavorite: false,
    });

    setManualTitle('');
    setManualArtist('');
    setManualAlbum('');
    setManualDeezerId('');
    setManualIsrc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Buscador & Descargador de Canciones
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  Catálogo Global
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Encuentra cualquier canción, escúchala, descárgala en MP3 y agrégala a tus listas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onOpenVercelGuide && (
              <button
                type="button"
                onClick={onOpenVercelGuide}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Cómo desplegar en Vercel"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Desplegar en Vercel</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch & Target Playlist bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/60 px-6 py-2.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className={`py-1.5 px-3.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'search'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Buscar en la Web
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`py-1.5 px-3.5 text-xs font-semibold rounded-xl transition-all ${
                activeTab === 'manual'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Entrada Manual
            </button>
          </div>

          {/* Playlist selector & quick new button */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 hidden sm:inline">Guardar en:</span>
            {!isCreatingPlaylist ? (
              <div className="flex items-center gap-1.5">
                <select
                  value={targetPlaylist}
                  onChange={(e) => setTargetPlaylist(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  {availablePlaylists.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(true)}
                  className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Crear nueva lista"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateNewPlaylist} className="flex items-center gap-1">
                <input
                  type="text"
                  value={newPlaylistInput}
                  onChange={(e) => setNewPlaylistInput(e.target.value)}
                  placeholder="Nombre de la nueva lista..."
                  className="bg-slate-800 border border-purple-500 text-white rounded-xl px-2.5 py-1 text-xs focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingPlaylist(false)}
                  className="p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'search' ? (
            <>
              {/* Search Bar Form */}
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Escribe el nombre de cualquier canción o artista (ej. Morat, Bad Bunny, Queen)..."
                    className="w-full bg-slate-800 text-xs sm:text-sm text-white pl-10 pr-10 py-2.5 rounded-2xl border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60 placeholder-slate-400 shadow-inner"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-2xl flex items-center gap-2 transition-all shadow-md shadow-purple-600/30 disabled:opacity-50 shrink-0"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>Buscar</span>
                </button>
              </form>

              {/* Quick trending chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-400" /> Sugeridos:
                </span>
                {QUICK_TRENDING_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSelectQuickChip(chip)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-purple-900/30 hover:border-purple-500/40 border border-slate-700/60 text-slate-300 hover:text-purple-200 text-[11px] whitespace-nowrap transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Selection Bar & Controls (if results exist) */}
              {searchResults.length > 0 && (
                <div className="flex items-center justify-between px-2 py-1.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSelectAllResults}
                      className="flex items-center gap-1.5 text-slate-400 hover:text-white"
                    >
                      {selectedResultIds.size === searchResults.length ? (
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Seleccionar todas ({searchResults.length})</span>
                    </button>
                    {selectedResultIds.size > 0 && (
                      <span className="text-purple-300 font-semibold">
                        {selectedResultIds.size} seleccionadas
                      </span>
                    )}
                  </div>

                  {selectedResultIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleAddSelected}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir {selectedResultIds.size} a "{targetPlaylist}"</span>
                    </button>
                  )}
                </div>
              )}

              {/* Results List */}
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {searchResults.map((item) => {
                  const isAdded = addedIds.has(item.id);
                  const isSelected = selectedResultIds.has(item.id);
                  const isPlayingThis = playingPreviewId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-2xl border transition-all gap-3 ${
                        isPlayingThis
                          ? 'bg-purple-950/30 border-purple-500/50 shadow-md'
                          : isAdded
                          ? 'bg-slate-800/30 border-emerald-500/20'
                          : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                      }`}
                    >
                      {/* Left: Checkbox, Artwork, Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectResult(item.id)}
                          className="text-slate-400 hover:text-white shrink-0 p-1"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>

                        <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 group">
                          {item.coverUrl ? (
                            <img
                              src={item.coverUrl}
                              alt={item.album}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <Music className="w-6 h-6" />
                            </div>
                          )}

                          {/* Quick play preview button on thumbnail */}
                          {item.previewUrl && (
                            <button
                              type="button"
                              onClick={() => handleTogglePreview(item)}
                              className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
                                isPlayingThis ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}
                              title={isPlayingThis ? 'Pausar muestra' : 'Escuchar muestra de 30s'}
                            >
                              {isPlayingThis ? (
                                <Pause className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                              ) : (
                                <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.title}
                            </p>
                            {isPlayingThis && (
                              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                <Radio className="w-3 h-3 animate-pulse" />
                                Sonando muestra
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            <span className="text-slate-300">{item.artist}</span> •{' '}
                            <span>{item.album}</span>
                            {item.duration && (
                              <span className="ml-1.5 text-slate-500">
                                ({Math.floor(item.duration / 60)}:
                                {String(item.duration % 60).padStart(2, '0')})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions (Escuchar, Descargar, Añadir) */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {/* Preview play button */}
                        {item.previewUrl && (
                          <button
                            type="button"
                            onClick={() => handleTogglePreview(item)}
                            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                              isPlayingThis
                                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                                : 'bg-slate-700/60 hover:bg-slate-700 text-slate-200'
                            }`}
                            title={isPlayingThis ? 'Pausar' : 'Escuchar muestra'}
                          >
                            {isPlayingThis ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden md:inline">
                              {isPlayingThis ? 'Pausar' : 'Muestra'}
                            </span>
                          </button>
                        )}

                        {/* Download button */}
                        <button
                          type="button"
                          onClick={() => handleDirectDownload(item)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors shadow-sm"
                          title="Descargar canción completa en MP3"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Descargar</span>
                        </button>

                        {/* Add to playlist button */}
                        <button
                          type="button"
                          onClick={() => handleAddFromSearch(item)}
                          disabled={isAdded}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isAdded
                              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20 active:scale-95'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Añadida</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>Añadir a lista</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <div className="text-center py-10 space-y-2">
                    <p className="text-sm font-semibold text-slate-300">
                      No encontramos resultados para "{searchQuery}"
                    </p>
                    <p className="text-xs text-slate-500">
                      Prueba con el nombre del artista, el título en español o inglés, o usa la pestaña de entrada manual.
                    </p>
                  </div>
                )}

                {searchResults.length === 0 && !searchQuery && (
                  <div className="text-center py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-900/30 text-purple-400 flex items-center justify-center mx-auto border border-purple-500/20">
                      <Music className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        Busca cualquier canción para descargar y añadir
                      </p>
                      <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                        Escribe el artista o título arriba, o haz clic en alguno de los temas sugeridos.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Manual Form */
            <form onSubmit={handleManualSubmit} className="space-y-3.5 max-w-xl mx-auto py-2">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de la Canción *
                </label>
                <input
                  type="text"
                  required
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Ej. Besos En Guerra"
                  className="w-full bg-slate-800 text-xs sm:text-sm text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Artista *
                </label>
                <input
                  type="text"
                  required
                  value={manualArtist}
                  onChange={(e) => setManualArtist(e.target.value)}
                  placeholder="Ej. Morat"
                  className="w-full bg-slate-800 text-xs sm:text-sm text-white px-3.5 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Álbum
                  </label>
                  <input
                    type="text"
                    value={manualAlbum}
                    onChange={(e) => setManualAlbum(e.target.value)}
                    placeholder="Ej. Balas Perdidas"
                    className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Deezer ID (Opcional)
                  </label>
                  <input
                    type="text"
                    value={manualDeezerId}
                    onChange={(e) => setManualDeezerId(e.target.value)}
                    placeholder="Ej. 422245482"
                    className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Código ISRC (Opcional)
                </label>
                <input
                  type="text"
                  value={manualIsrc}
                  onChange={(e) => setManualIsrc(e.target.value)}
                  placeholder="Ej. ES5701700822"
                  className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  Guardar en "{targetPlaylist}"
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
