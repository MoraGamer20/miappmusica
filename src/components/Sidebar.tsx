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
  Mic2,
  Sliders,
  Moon,
  HardDrive,
  FolderDown,
  Upload,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

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
  offlineCount?: number;
  onOpenAddModal?: () => void;
  onOpenFolderDownloadModal?: (folderName?: string) => void;
  onImportLocalAudio?: () => void;
  onOpenVercelGuide?: () => void;
  onOpenEqualizer?: () => void;
  onOpenSleepTimer?: () => void;
  onOpenLyrics?: () => void;
  hasCurrentTrack?: boolean;
  offlinePlaylists?: Record<string, boolean>;
  onToggleFolderOffline?: (folderName: string) => void;
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
  offlineCount = 0,
  onOpenAddModal,
  onOpenFolderDownloadModal,
  onImportLocalAudio,
  onOpenVercelGuide,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenLyrics,
  hasCurrentTrack,
  offlinePlaylists,
  onToggleFolderOffline,
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
                <p className="text-xs font-bold text-white">Buscar & Agregar Canciones</p>
                <p className="text-[10px] text-purple-300/80">Deezer / Web / Descarga</p>
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

          {/* Offline / Downloaded Tracks Button */}
          <button
            type="button"
            onClick={() => {
              onSelectPlaylist('OFFLINE');
              onSelectArtist(null);
            }}
            className={`w-full mt-1 flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activePlaylist === 'OFFLINE' && selectedArtist === null
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'hover:bg-slate-800/80 text-emerald-300 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Descargadas / Offline</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                activePlaylist === 'OFFLINE' && selectedArtist === null
                  ? 'bg-emerald-700/60 text-emerald-100'
                  : 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {offlineCount}
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

                  {/* Quick download folder button */}
                  {onOpenFolderDownloadModal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenFolderDownloadModal(pl.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all ml-0.5"
                      title={`Descargar carpeta "${pl.name}"`}
                      aria-label={`Descargar carpeta ${pl.name}`}
                    >
                      <FolderDown className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {pl.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomPlaylist(pl.name)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity ml-0.5"
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

        {/* Folder Download & Local Import Shortcuts */}
        <div className="pt-3 border-t border-slate-800 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Gestión de Archivos
          </span>

          {onOpenFolderDownloadModal && (
            <button
              type="button"
              onClick={() => onOpenFolderDownloadModal()}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs bg-slate-800/60 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-500/20 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FolderDown className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Descargar por Carpetas</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}

          {onImportLocalAudio && (
            <button
              type="button"
              onClick={onImportLocalAudio}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Importar Audio Local (.mp3)</span>
              </div>
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </button>
          )}
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

        {/* Audio Tools & Utilities Section */}
        <div className="pt-3 border-t border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-1">
            Herramientas de Audio
          </span>

          {onOpenLyrics && hasCurrentTrack && (
            <button
              type="button"
              onClick={onOpenLyrics}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-pink-300 hover:text-pink-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mic2 className="w-3.5 h-3.5 text-pink-400" />
                <span>Letras / Karaoke</span>
              </div>
              <span className="text-[10px] text-pink-400/80 bg-pink-500/10 px-1.5 py-0.5 rounded font-mono">L</span>
            </button>
          )}

          {onOpenEqualizer && (
            <button
              type="button"
              onClick={onOpenEqualizer}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ecualizador 5 Bandas</span>
              </div>
              <span className="text-[10px] text-indigo-400/80 bg-indigo-500/10 px-1.5 py-0.5 rounded font-mono">E</span>
            </button>
          )}

          {onOpenSleepTimer && (
            <button
              type="button"
              onClick={onOpenSleepTimer}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Temporizador de Apagado</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">T</span>
            </button>
          )}
        </div>

        {/* PWA App Install Banner in Sidebar */}
        <div className="pt-2">
          <PWAInstallButton variant="sidebar" />
        </div>

        {/* Deploy on Vercel Guide */}
        {onOpenVercelGuide && (
          <div className="pt-2 border-t border-slate-800">
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
