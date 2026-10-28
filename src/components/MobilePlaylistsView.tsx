import React, { useState } from 'react';
import {
  FolderPlus,
  Play,
  Heart,
  Music2,
  ListMusic,
  Trash2,
  Users,
  Sparkles,
  ChevronRight,
  Disc,
  HardDrive,
  FileArchive,
  Download,
} from 'lucide-react';
import { Track } from '../types/music';
import { isFavoritesPlaylist } from '../App';

interface MobilePlaylistsViewProps {
  playlists: { name: string; count: number; isCustom?: boolean }[];
  activePlaylist: string;
  onSelectPlaylist: (name: string) => void;
  onCreatePlaylist: (name: string) => void;
  onDeleteCustomPlaylist: (name: string) => void;
  topArtists: { name: string; count: number }[];
  selectedArtist: string | null;
  onSelectArtist: (artist: string | null) => void;
  totalTracks: number;
  offlineCount?: number;
  onNavigateToTracks: () => void;
  onPlayPlaylist?: (playlistName: string) => void;
  offlinePlaylists?: Record<string, boolean>;
  onToggleFolderOffline?: (folderName: string) => void;
  onBatchDownloadZip?: (tracks: Track[]) => void;
  tracks?: Track[];
}

export const MobilePlaylistsView: React.FC<MobilePlaylistsViewProps> = ({
  playlists,
  activePlaylist,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeleteCustomPlaylist,
  topArtists,
  selectedArtist,
  onSelectArtist,
  totalTracks,
  offlineCount = 0,
  onNavigateToTracks,
  offlinePlaylists = {},
  onToggleFolderOffline,
  onBatchDownloadZip,
  tracks = [],
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      onSelectPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
      onNavigateToTracks();
    }
  };

  const handlePickPlaylist = (name: string) => {
    onSelectPlaylist(name);
    onSelectArtist(null);
    onNavigateToTracks();
  };

  const handlePickArtist = (artist: string) => {
    onSelectArtist(artist);
    onNavigateToTracks();
  };

  const favoritesItem = playlists.find((p) => isFavoritesPlaylist(p.name));
  const otherPlaylists = playlists.filter((p) => !isFavoritesPlaylist(p.name));

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] px-4 py-4 pb-36 text-slate-100 flex flex-col gap-6">
      {/* Header with Title and Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-purple-400" />
            Playlists & Carpetas
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organiza y reproduce tu música por carpetas
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 text-white shadow-md shadow-purple-600/30 active:scale-95 transition-transform"
        >
          <FolderPlus className="w-4 h-4" />
          <span>+ Crear</span>
        </button>
      </div>

      {/* Inline Create Form Modal/Box */}
      {isCreating && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-purple-500/50 rounded-2xl p-4 shadow-xl flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-purple-300">Nueva Playlist</span>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="Ej: Gimnasio, Tarea, En Carretera..."
            autoFocus
            className="w-full bg-slate-800 text-sm text-white placeholder-slate-400 px-3.5 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              disabled={!newPlaylistName.trim()}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-semibold rounded-xl shadow disabled:opacity-50"
            >
              Guardar Playlist
            </button>
          </div>
        </form>
      )}

      {/* Featured Primary Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Todas las Canciones Card */}
        <div
          onClick={() => handlePickPlaylist('ALL')}
          className={`cursor-pointer rounded-2xl p-3 sm:p-4 border transition-all active:scale-98 flex flex-col justify-between h-28 sm:h-32 relative overflow-hidden shadow-lg ${
            activePlaylist === 'ALL' && !selectedArtist
              ? 'bg-gradient-to-br from-purple-900/80 to-indigo-950 border-purple-400/80 ring-2 ring-purple-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/30">
              <Music2 className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded-full">
              {totalTracks}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Todas</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">Biblioteca</p>
          </div>
        </div>

        {/* Favoritas Card */}
        <div
          onClick={() => handlePickPlaylist('Favorite Tracks')}
          className={`cursor-pointer rounded-2xl p-3 sm:p-4 border transition-all active:scale-98 flex flex-col justify-between h-28 sm:h-32 relative overflow-hidden shadow-lg ${
            isFavoritesPlaylist(activePlaylist) && !selectedArtist
              ? 'bg-gradient-to-br from-rose-950/80 to-pink-950 border-rose-400/80 ring-2 ring-rose-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-rose-600/30 text-rose-300 flex items-center justify-center border border-rose-500/30">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 fill-rose-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 bg-slate-800/80 px-1.5 py-0.5 rounded-full">
              {favoritesItem?.count || 0}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Favoritas</h3>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">Con ❤️</p>
          </div>
        </div>

        {/* Descargadas / Offline Card */}
        <div
          onClick={() => handlePickPlaylist('OFFLINE')}
          className={`cursor-pointer rounded-2xl p-3 sm:p-4 border transition-all active:scale-98 flex flex-col justify-between h-28 sm:h-32 relative overflow-hidden shadow-lg ${
            activePlaylist === 'OFFLINE' && !selectedArtist
              ? 'bg-gradient-to-br from-emerald-950/80 to-teal-950 border-emerald-400/80 ring-2 ring-emerald-500/40'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <HardDrive className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded-full">
              {offlineCount}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white">Offline</h3>
            <p className="text-[10px] sm:text-xs text-emerald-400/80 truncate">Sin internet</p>
          </div>
        </div>
      </div>

      {/* Custom & Default Playlists List */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
          Tus Listas ({otherPlaylists.length})
        </h3>
        <div className="flex flex-col gap-2">
          {otherPlaylists.map((pl) => {
            const isSelected = activePlaylist.toLowerCase() === pl.name.toLowerCase() && !selectedArtist;
            return (
              <div
                key={pl.name}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500/60 shadow-md'
                    : 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => handlePickPlaylist(pl.name)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:opacity-80"
                >
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-slate-300">
                    <ListMusic className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{pl.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {pl.count} {pl.count === 1 ? 'canción' : 'canciones'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Batch Download Block Button */}
                  {onBatchDownloadZip && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const plTracks = tracks.filter((t) => t.playlist === pl.name);
                        onBatchDownloadZip(plTracks.length > 0 ? plTracks : tracks);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-slate-800 active:scale-95 transition-all"
                      title="Descargar bloque de canciones en ZIP"
                    >
                      <FileArchive className="w-4 h-4" />
                    </button>
                  )}

                  {/* Offline Download Switch */}
                  {onToggleFolderOffline && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(offlinePlaylists[pl.name])}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFolderOffline(pl.name);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                        offlinePlaylists[pl.name] ? 'bg-emerald-600' : 'bg-slate-700'
                      }`}
                      title={
                        offlinePlaylists[pl.name]
                          ? 'Descargado offline (Haz clic para desactivar)'
                          : 'Descargar toda la playlist para escuchar sin conexión'
                      }
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          offlinePlaylists[pl.name] ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}

                  {pl.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar la playlist "${pl.name}"?`)) {
                          onDeleteCustomPlaylist(pl.name);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 active:scale-90 transition-colors"
                      title="Eliminar playlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePickPlaylist(pl.name)}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top Artists Section */}
      {topArtists && topArtists.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Artistas Más Escuchados
            </h3>
            {selectedArtist && (
              <button
                type="button"
                onClick={() => {
                  onSelectArtist(null);
                  onNavigateToTracks();
                }}
                className="text-xs text-purple-400 font-semibold"
              >
                Limpiar filtro
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {topArtists.slice(0, 10).map((item) => {
              const isSelected = selectedArtist?.toLowerCase() === item.name.toLowerCase();
              return (
                <div
                  key={item.name}
                  onClick={() => handlePickArtist(item.name)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer active:scale-95 transition-all ${
                    isSelected
                      ? 'bg-purple-900/40 border-purple-500 shadow-md ring-1 ring-purple-500'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-white truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {item.count} canciones
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
