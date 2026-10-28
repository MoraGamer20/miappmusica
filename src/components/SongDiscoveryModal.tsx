import React, { useState } from 'react';
import {
  X,
  Search,
  Plus,
  Play,
  Pause,
  Download,
  FolderPlus,
  Check,
  Disc,
  Music,
  Loader2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Track } from '../types/music';
import { searchDeezerCatalog } from '../utils/deezerService';

interface SongDiscoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrackToPlaylist: (track: Omit<Track, 'id'>, playlistName: string) => void;
  availablePlaylists: string[];
  onCreatePlaylist: (name: string) => void;
  onPlayTrackDirect: (track: Track) => void;
  onOpenDownloadModal: (track: Track) => void;
}

export const SongDiscoveryModal: React.FC<SongDiscoveryModalProps> = ({
  isOpen,
  onClose,
  onAddTrackToPlaylist,
  availablePlaylists,
  onCreatePlaylist,
  onPlayTrackDirect,
  onOpenDownloadModal,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>(availablePlaylists[0] || 'Favorite Tracks');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [playingPreviewId, setPlayingPreviewId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);

    try {
      // 1. Search Deezer
      let foundTracks = await searchDeezerCatalog(searchQuery);

      // 2. If Deezer returned 0 (e.g. deployed on Vercel without proxy), fallback to iTunes Search API (100% CORS compliant everywhere)
      if (foundTracks.length === 0) {
        try {
          const itunesRes = await fetch(
            `https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=20`
          );
          if (itunesRes.ok) {
            const itunesData = await itunesRes.json();
            if (itunesData.results) {
              foundTracks = itunesData.results.map((song: any, idx: number) => ({
                id: `itunes-${song.trackId}-${idx}`,
                title: song.trackName,
                artist: song.artistName,
                album: song.collectionName || 'Single',
                playlist: selectedPlaylist,
                type: 'Track',
                isrc: '',
                deezerId: '',
                previewUrl: song.previewUrl,
                coverUrl: song.artworkUrl100 ? song.artworkUrl100.replace('100x100bb', '600x600bb') : undefined,
                duration: Math.round(song.trackTimeMillis / 1000) || 180,
                isFavorite: false,
              }));
            }
          }
        } catch {}
      }

      setResults(foundTracks);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddTrack = (track: Track) => {
    const targetPlaylist = isCreatingNewList && newPlaylistName.trim() ? newPlaylistName.trim() : selectedPlaylist;

    if (isCreatingNewList && newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setIsCreatingNewList(false);
      setNewPlaylistName('');
    }

    onAddTrackToPlaylist(
      {
        title: track.title,
        artist: track.artist,
        album: track.album || 'Single',
        playlist: targetPlaylist,
        type: 'Track',
        isrc: track.isrc || '',
        deezerId: track.deezerId || '',
        previewUrl: track.previewUrl,
        coverUrl: track.coverUrl,
        duration: track.duration,
        isFavorite: targetPlaylist.toLowerCase().includes('favorit'),
      },
      targetPlaylist
    );

    setAddedIds((prev) => new Set(prev).add(track.id));
  };

  const quickGenres = ['Morat', 'Bad Bunny', 'Twenty One Pilots', 'Ed Maverick', 'Milo j', 'Coldplay', 'Beret'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Explorar y Agregar Canciones</h3>
              <p className="text-xs text-slate-400">
                Busca en el catálogo musical web, escucha y agrégalas a tus listas de reproducción
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Destination Playlist */}
        <div className="my-4 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(query);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe el nombre de cualquier canción o artista (ej. Morat, Bad Bunny, Queen...)"
                className="w-full bg-slate-800 text-xs text-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-slate-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>Buscar</span>
            </button>
          </form>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <span className="text-slate-500 font-medium whitespace-nowrap">Sugerencias:</span>
            {quickGenres.map((artist) => (
              <button
                key={artist}
                type="button"
                onClick={() => {
                  setQuery(artist);
                  handleSearch(artist);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap border border-slate-700/60"
              >
                {artist}
              </button>
            ))}
          </div>

          {/* Target Playlist Selector & Create New */}
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-purple-300">Playlist de destino:</span>
              {!isCreatingNewList ? (
                <select
                  value={selectedPlaylist}
                  onChange={(e) => setSelectedPlaylist(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  {availablePlaylists.map((pl) => (
                    <option key={pl} value={pl}>
                      {pl}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nombre de la nueva playlist..."
                  className="bg-slate-900 border border-purple-500 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                  autoFocus
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCreatingNewList(!isCreatingNewList)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>{isCreatingNewList ? 'Usar existente' : '+ Crear nueva playlist'}</span>
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {results.map((song) => {
            const isAdded = addedIds.has(song.id);

            return (
              <div
                key={song.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Cover Art / Play Preview */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-slate-800 group/art shadow-sm">
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt={song.album} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-700 to-indigo-700 flex items-center justify-center text-white">
                        <Disc className="w-5 h-5" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onPlayTrackDirect(song)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/art:opacity-100 flex items-center justify-center transition-opacity text-white"
                      title="Reproducir preview"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {song.artist} • <span className="text-slate-500">{song.album}</span>
                    </p>
                  </div>
                </div>

                {/* Actions: Add to Playlist, Download */}
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <button
                    type="button"
                    onClick={() => onOpenDownloadModal(song)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/70 rounded-xl transition-colors"
                    title="Descargar MP3"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddTrack(song)}
                    disabled={isAdded}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isAdded
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Agregada</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          {results.length === 0 && !isSearching && query && (
            <div className="text-center py-12 text-slate-500">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No se encontraron canciones para "{query}".</p>
              <p className="text-[11px] text-slate-600">Prueba buscando solo el artista o título.</p>
            </div>
          )}

          {results.length === 0 && !isSearching && !query && (
            <div className="text-center py-12 text-slate-500">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400 opacity-60" />
              <p className="text-xs font-medium text-slate-400">Escribe algo arriba o pulsa en una sugerencia</p>
              <p className="text-[11px] text-slate-600">
                Podrás escuchar cualquier canción y añadirla a tus listas en 1 clic.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
