import React, { useState, useMemo } from 'react';
import { Users, Search, Play, Music2, ArrowUpDown, ChevronRight, X } from 'lucide-react';
import { Track } from '../types/music';

interface MobileArtistsViewProps {
  topArtists: { name: string; count: number }[];
  selectedArtist: string | null;
  onSelectArtist: (artist: string | null) => void;
  onNavigateToTracks: () => void;
  onPlayArtistSongs?: (artist: string) => void;
  tracks: Track[];
}

export const MobileArtistsView: React.FC<MobileArtistsViewProps> = ({
  topArtists,
  selectedArtist,
  onSelectArtist,
  onNavigateToTracks,
  onPlayArtistSongs,
  tracks,
}) => {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'count' | 'name'>('count');

  // Compute all unique artists with counts
  const allArtists = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tracks) {
      if (t.artist) {
        map.set(t.artist, (map.get(t.artist) || 0) + 1);
      }
    }
    const list = Array.from(map.entries()).map(([name, count]) => ({ name, count }));
    if (sortBy === 'count') {
      return list.sort((a, b) => b.count - a.count);
    } else {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [tracks, sortBy]);

  const filteredArtists = useMemo(() => {
    if (!search.trim()) return allArtists;
    const q = search.toLowerCase().trim();
    return allArtists.filter((a) => a.name.toLowerCase().includes(q));
  }, [allArtists, search]);

  const getGradientForArtist = (name: string) => {
    const gradients = [
      'from-purple-600 to-indigo-600',
      'from-rose-600 to-orange-600',
      'from-emerald-600 to-teal-600',
      'from-blue-600 to-cyan-600',
      'from-fuchsia-600 to-pink-600',
      'from-violet-600 to-purple-700',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  const handlePickArtist = (name: string) => {
    onSelectArtist(name);
    onNavigateToTracks();
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] px-4 py-4 pb-36 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Artistas en tu Música
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {allArtists.length} artistas en tu biblioteca de Deezer
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSortBy(sortBy === 'count' ? 'name' : 'count')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors active:scale-95"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
          <span>{sortBy === 'count' ? 'Más canciones' : 'A - Z'}</span>
        </button>
      </div>

      {/* Search Bar for Artists */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar un artista en tus canciones..."
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Selected Artist Reset Pill */}
      {selectedArtist && (
        <div className="flex items-center justify-between px-3 py-2 bg-purple-900/30 border border-purple-500/40 rounded-xl text-xs">
          <span className="text-purple-300">
            Filtro actual: <strong className="text-white">{selectedArtist}</strong>
          </span>
          <button
            type="button"
            onClick={() => {
              onSelectArtist(null);
              onNavigateToTracks();
            }}
            className="text-purple-400 hover:text-purple-200 font-semibold underline"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* Artists List */}
      <div className="divide-y divide-slate-800/80 bg-slate-900/40 rounded-2xl border border-slate-800/80 overflow-hidden">
        {filteredArtists.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No se encontró ningún artista con "{search}"
          </div>
        ) : (
          filteredArtists.map((artist) => {
            const isSelected = selectedArtist?.toLowerCase() === artist.name.toLowerCase();
            const initials = artist.name.substring(0, 2).toUpperCase();

            return (
              <div
                key={artist.name}
                onClick={() => handlePickArtist(artist.name)}
                className={`flex items-center justify-between px-3.5 py-3 transition-colors cursor-pointer active:bg-slate-800 ${
                  isSelected ? 'bg-purple-950/40 border-l-4 border-purple-500' : 'hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Artist Avatar Circle */}
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-tr ${getGradientForArtist(
                      artist.name
                    )} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}
                  >
                    {initials}
                  </div>

                  {/* Name and Count */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                      {artist.name}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Music2 className="w-3 h-3 text-slate-500" />
                      <span>{artist.count} {artist.count === 1 ? 'canción' : 'canciones'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onPlayArtistSongs && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlayArtistSongs(artist.name);
                      }}
                      title={`Reproducir canciones de ${artist.name}`}
                      className="p-2 rounded-xl bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
