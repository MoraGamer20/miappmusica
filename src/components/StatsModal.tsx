import React from 'react';
import { X, BarChart2, Users, Disc, Layers, Music, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { LibraryStats, Track } from '../types/music';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: LibraryStats;
  onDeduplicate: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  onDeduplicate,
}) => {
  if (!isOpen) return null;

  const maxArtistCount = stats.topArtists.length > 0 ? stats.topArtists[0].count : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Estadísticas de la Biblioteca</h3>
              <p className="text-xs text-slate-400">Resumen analítico de tu colección de canciones</p>
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

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Music className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
            </div>
            <p className="text-xl font-extrabold text-white">{stats.totalTracks.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">canciones</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 text-indigo-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Artistas</span>
            </div>
            <p className="text-xl font-extrabold text-white">{stats.uniqueArtists.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">únicos</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Disc className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Álbumes</span>
            </div>
            <p className="text-xl font-extrabold text-white">{stats.uniqueAlbums.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400">diferentes</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <Layers className="w-4 h-4" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">Playlists</span>
            </div>
            <p className="text-xl font-extrabold text-white">
              {Object.keys(stats.playlistCounts).length}
            </p>
            <p className="text-[10px] text-slate-400">categorías</p>
          </div>
        </div>

        {/* Duplicates Alert Banner */}
        {stats.duplicateCount > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Copy className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-200">
                  {stats.duplicateCount} canciones duplicadas detectadas
                </p>
                <p className="text-[11px] text-amber-300/80">
                  Aparecen repetidas en diferentes playlists (como "Favorite Tracks" y "Tarea").
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onDeduplicate}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shrink-0 transition-colors shadow-sm"
            >
              Deduplicar
            </button>
          </div>
        )}

        {/* Top 10 Artists with Progress Bars */}
        <div className="mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Top 10 Artistas Más Escuchados
          </h4>

          <div className="space-y-2.5">
            {stats.topArtists.slice(0, 10).map((art, idx) => {
              const percent = Math.round((art.count / maxArtistCount) * 100);
              return (
                <div key={art.name} className="flex flex-col gap-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-200 truncate">
                      <span className="text-slate-500 font-mono mr-2">{idx + 1}.</span>
                      {art.name}
                    </span>
                    <span className="text-purple-400 font-semibold font-mono">{art.count} canciones</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playlist Distribution */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Distribución por Playlist
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(stats.playlistCounts).map(([name, count]) => {
              const pct = Math.round((count / stats.totalTracks) * 100);
              return (
                <div
                  key={name}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between"
                >
                  <span className="text-xs font-medium text-slate-200 truncate">{name}</span>
                  <div className="flex items-center gap-2 text-right">
                    <span className="text-xs font-mono font-semibold text-purple-400">{count}</span>
                    <span className="text-[10px] text-slate-500">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
