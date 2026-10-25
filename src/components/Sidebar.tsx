import React, { useState } from 'react';
import {
  ListMusic,
  Heart,
  Music2,
  FolderPlus,
  Trash2,
  Users,
  Filter,
  Sparkles,
  Layers,
  ChevronRight,
  Disc,
  Search,
  Globe,
  Plus,
} from 'lucide-react';

interface SidebarProps {
  playlists: { name: string; count: number; isCustom?: boolean }[];
  activePlaylist: string;
  onSelectPlaylist: (name: string) => void;
  onCreatePlaylist: (name: string) => void;
  onDeleteCustomPlaylist: (name: string) => void;
  topArtists: { name: string; count: number }[];
  selectedArtist: string | null;
  onSelectArtist: (artist: string | null) => void;
  totalTracks: number;
  onOpenAddModal?: () => void;
  onOpenVercelGuide?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  playlists,
  activePlaylist,
  onSelectPlaylist,
  onCreatePlaylist,
  onDeleteCustomPlaylist,
  topArtists,
  selectedArtist,
  onSelectArtist,
  totalTracks,
  onOpenAddModal,
  onOpenVercelGuide,
}) => {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex-col shrink-0 h-[calc(100vh-4rem-5.5rem)] sticky top-16 overflow-y-auto">
      {/* Playlists Section */}
      <div className="p-4 space-y-4">
        {/* Explore / Download Songs Online */}
        {onOpenAddModal && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-900/40 via-indigo-900/40 to-slate-800 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-500/60 transition-all shadow-sm group text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Search className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Explorar Música Web</p>
                <p className="text-[10px] text-purple-300/80">Buscar & Descargar</p>
              </div>
            </div>
            <Plus className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-90 transition-transform" />
          </button>
        )}

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Playlists & Colecciones
            </span>
            <button
              type="button"
              onClick={() => setIsCreating(!isCreating)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Crear nueva playlist"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New Playlist Form */}
          {isCreating && (
            <form onSubmit={handleCreateSubmit} className="mb-3 animate-in fade-in duration-150">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nombre de la playlist..."
                  className="w-full bg-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-purple-500/50 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
                >
                  Ok
                </button>
              </div>
            </form>
          )}

          {/* All Tracks Item */}
          <button
            type="button"
            onClick={() => {
              onSelectPlaylist('ALL');
              onSelectArtist(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activePlaylist === 'ALL' && selectedArtist === null
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ListMusic className="w-4 h-4 text-purple-300" />
              <span>Todas las canciones</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                activePlaylist === 'ALL' && selectedArtist === null
                  ? 'bg-purple-700/60 text-purple-100'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {totalTracks}
            </span>
          </button>

          {/* Dynamic Playlists */}
          <div className="mt-1 space-y-1">
            {playlists.map((pl) => {
              const isFav = pl.name.toLowerCase().includes('favorit');
              const isActive = activePlaylist === pl.name && selectedArtist === null;

              return (
                <div key={pl.name} className="group relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectPlaylist(pl.name);
                      onSelectArtist(null);
                    }}
                    className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all truncate text-left ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {isFav ? (
                        <Heart className="w-4 h-4 text-rose-400 shrink-0 fill-rose-400/20" />
                      ) : (
                        <Disc className="w-4 h-4 text-slate-400 group-hover:text-purple-400 shrink-0" />
                      )}
                      <span className="truncate">{pl.name}</span>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full ml-1 shrink-0 ${
                        isActive
                          ? 'bg-purple-700/60 text-purple-100'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {pl.count}
                    </span>
                  </button>

                  {pl.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomPlaylist(pl.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity ml-1"
                      title="Eliminar playlist personalizada"
                      aria-label={`Eliminar playlist ${pl.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Artists Filter */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Artistas Frecuentes
            </span>
            {selectedArtist && (
              <button
                type="button"
                onClick={() => onSelectArtist(null)}
                className="text-[11px] text-purple-400 hover:underline"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="space-y-1">
            {topArtists.slice(0, 10).map((art) => {
              const isSelected = selectedArtist === art.name;
              return (
                <button
                  key={art.name}
                  type="button"
                  onClick={() => onSelectArtist(isSelected ? null : art.name)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 font-semibold'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="truncate text-left">{art.name}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded ml-1">
                    {art.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Deploy on Vercel Guide */}
        {onOpenVercelGuide && (
          <div className="pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onOpenVercelGuide}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Desplegar en Vercel</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
