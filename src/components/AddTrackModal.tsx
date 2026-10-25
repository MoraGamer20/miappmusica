import React, { useState } from 'react';
import { X, Search, Plus, Music, Disc, Loader2, Check } from 'lucide-react';
import { Track } from '../types/music';
import { searchDeezerCatalog } from '../utils/deezerService';

interface AddTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Omit<Track, 'id'>) => void;
  availablePlaylists: string[];
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  isOpen,
  onClose,
  onAddTrack,
  availablePlaylists,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  // Manual form state
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [playlist, setPlaylist] = useState(availablePlaylists[0] || 'Biblioteca');
  const [deezerId, setDeezerId] = useState('');
  const [isrc, setIsrc] = useState('');

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchDeezerCatalog(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleAddFromSearch = (item: Track) => {
    onAddTrack({
      title: item.title,
      artist: item.artist,
      album: item.album,
      playlist: playlist,
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

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !artist.trim()) return;

    onAddTrack({
      title: title.trim(),
      artist: artist.trim(),
      album: album.trim() || 'Single',
      playlist: playlist.trim() || 'Biblioteca',
      type: 'Track',
      isrc: isrc.trim(),
      deezerId: deezerId.trim(),
      isFavorite: false,
    });

    // Reset & close
    setTitle('');
    setArtist('');
    setAlbum('');
    setDeezerId('');
    setIsrc('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Añadir Canción a la Biblioteca</h3>
              <p className="text-xs text-slate-400">Busca en Deezer o ingresa los datos manualmente</p>
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('search')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'search'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Buscar en Catálogo Deezer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Ingreso Manual
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Target Playlist Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Guardar en la Playlist:
            </label>
            <select
              value={playlist}
              onChange={(e) => setPlaylist(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {availablePlaylists.map((pl) => (
                <option key={pl} value={pl}>
                  {pl}
                </option>
              ))}
              <option value="Nueva Playlist">+ Otra playlist</option>
            </select>
          </div>

          {activeTab === 'search' ? (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. Morat Besos En Guerra, Bad Bunny, Coldplay..."
                    className="w-full bg-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500 placeholder-slate-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Buscar</span>
                </button>
              </form>

              {/* Search Results list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {searchResults.map((item) => {
                  const isAdded = addedIds.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-700">
                          {item.coverUrl ? (
                            <img src={item.coverUrl} alt={item.album} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Music className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-400 truncate">{item.artist} • {item.album}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddFromSearch(item)}
                        disabled={isAdded}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors ${
                          isAdded
                            ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-600 hover:bg-purple-500 text-white'
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
                            <span>Añadir</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}

                {searchResults.length === 0 && !isSearching && searchQuery && (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No se encontraron resultados para "{searchQuery}".
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Manual Form */
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nombre de la Canción *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Besos En Guerra"
                  className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Artista *
                </label>
                <input
                  type="text"
                  required
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Ej. Morat"
                  className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Álbum
                  </label>
                  <input
                    type="text"
                    value={album}
                    onChange={(e) => setAlbum(e.target.value)}
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
                    value={deezerId}
                    onChange={(e) => setDeezerId(e.target.value)}
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
                  value={isrc}
                  onChange={(e) => setIsrc(e.target.value)}
                  placeholder="Ej. ES5701700822"
                  className="w-full bg-slate-800 text-xs text-white px-3 py-2 rounded-xl border border-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all"
                >
                  Guardar Canción
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
