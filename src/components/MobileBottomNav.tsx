import React from 'react';
import { Music2, ListMusic, Users, Heart, Sliders } from 'lucide-react';

export type MobileTabType = 'tracks' | 'playlists' | 'artists' | 'favorites' | 'tools';

interface MobileBottomNavProps {
  activeTab: MobileTabType;
  onChangeTab: (tab: MobileTabType) => void;
  tracksCount: number;
  playlistsCount: number;
  favoritesCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  tracksCount,
  playlistsCount,
  favoritesCount,
}) => {
  const tabs: {
    id: MobileTabType;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
  }[] = [
    {
      id: 'tracks',
      label: 'Canciones',
      icon: Music2,
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: ListMusic,
      badge: playlistsCount > 0 ? playlistsCount : undefined,
    },
    {
      id: 'artists',
      label: 'Artistas',
      icon: Users,
    },
    {
      id: 'favorites',
      label: 'Favoritas',
      icon: Heart,
      badge: favoritesCount && favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'tools',
      label: 'Ajustes',
      icon: Sliders,
    },
  ];

  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/98 border-t border-slate-800/90 backdrop-blur-2xl shadow-2xl select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-purple-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 active:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <div
                  className={`p-1 rounded-xl transition-all ${
                    isActive ? 'bg-purple-500/20 text-purple-400 scale-105' : 'text-slate-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-600 text-white min-w-[16px] text-center border border-slate-900 shadow">
                    {typeof tab.badge === 'number' && tab.badge > 999 ? '999+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] leading-tight mt-0.5 tracking-tight truncate max-w-[64px] ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-5 h-0.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
