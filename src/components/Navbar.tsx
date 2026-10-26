import React, { useRef, useState } from 'react';
import {
  Music,
  Search,
  X,
  Download,
  BarChart2,
  Copy,
  Upload,
  FileSpreadsheet,
  ListMusic,
  FileJson,
  Sparkles,
  Globe,
  Command,
  Sliders,
  Mic2,
  Moon,
  Menu,
  ChevronRight,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  totalTracks: number;
  filteredCount: number;
  uniqueArtistsCount: number;
  onOpenAddModal: () => void;
  onOpenStatsModal: () => void;
  onOpenDuplicatesModal: () => void;
  duplicateCount: number;
  onExportCSV: () => void;
  onExportM3U: () => void;
  onExportJSON: () => void;
  onImportCSVFile: (file: File) => void;
  activePlaylist: string;
  onOpenBulkDownloadModal: () => void;
  onOpenVercelGuide?: () => void;
  onOpenKeyboardShortcuts?: () => void;
  onOpenEqualizer?: () => void;
  onOpenSleepTimer?: () => void;
  onOpenLyrics?: () => void;
  hasActiveTrack?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  totalTracks,
  filteredCount,
  uniqueArtistsCount,
  onOpenAddModal,
  onOpenStatsModal,
  onOpenDuplicatesModal,
  duplicateCount,
  onExportCSV,
  onExportM3U,
  onExportJSON,
  onImportCSVFile,
  activePlaylist,
  onOpenBulkDownloadModal,
  onOpenVercelGuide,
  onOpenKeyboardShortcuts,
  onOpenEqualizer,
  onOpenSleepTimer,
  onOpenLyrics,
  hasActiveTrack,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSVFile(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white w-full max-w-full">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-sm sm:text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                  DeezerHub
                </span>
                <span className="hidden sm:inline-block text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  BD Musical
                </span>
              </div>
              <p className="hidden md:block text-xs text-slate-400">
                {totalTracks.toLocaleString()} canciones • {uniqueArtistsCount} artistas
              </p>
            </div>
          </div>

          {/* Search Bar - Responsive */}
          <div className="flex-1 min-w-0 max-w-lg mx-1 sm:mx-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar canción o artista..."
                className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-xs sm:text-sm rounded-xl pl-8 sm:pl-10 pr-8 sm:pr-10 py-1.5 sm:py-2 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 transition-all shadow-inner truncate"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              ) : (
                <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-700/60 rounded border border-slate-600">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Mobile Right Controls (< sm) */}
          <div className="flex items-center gap-1.5 sm:hidden shrink-0">
            {onOpenEqualizer && (
              <button
                type="button"
                onClick={onOpenEqualizer}
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-purple-400 flex items-center justify-center active:bg-slate-700 transition-colors"
                aria-label="Abrir Ecualizador"
                title="Ecualizador"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Mobile Menu Drawer Button */}
            <button
              type="button"
              onClick={() => setShowMobileMenu(true)}
              className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center active:bg-slate-700 transition-colors"
              aria-label="Menú de opciones"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Desktop Action Buttons (sm and up) */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {/* Bulk Download Full Songs Button */}
            <button
              type="button"
              onClick={onOpenBulkDownloadModal}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30 transition-all shadow-sm"
              title="Descargar canciones completas de toda la biblioteca en MP3"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar Canciones Completas</span>
            </button>

            {/* Duplicates Alert Button */}
            {duplicateCount > 0 && (
              <button
                type="button"
                onClick={onOpenDuplicatesModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                title={`${duplicateCount} canciones duplicadas detectadas`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{duplicateCount} Duplicadas</span>
              </button>
            )}

            {/* Stats Button */}
            <button
              type="button"
              onClick={onOpenStatsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-colors shadow-sm"
              title="Estadísticas de la biblioteca"
            >
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <span>Estadísticas</span>
            </button>

            {/* Import CSV input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-colors shadow-sm"
              title="Importar archivo CSV"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Importar</span>
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-colors shadow-sm"
                title="Exportar canciones"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Exportar</span>
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-700/60">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Descargas & Exportación
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenBulkDownloadModal();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-emerald-300 hover:bg-emerald-950/40 flex items-center gap-2.5 transition-colors border-b border-slate-700/60"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="font-bold text-white">Descargar Canciones Completas</p>
                        <p className="text-[10px] text-emerald-400/90">Descarga toda la BD (320kbps)</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onExportCSV();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/70 flex items-center gap-2.5 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-medium">Excel / CSV (.csv)</p>
                        <p className="text-[10px] text-slate-400">Compatible con Excel y acentos</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportM3U();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/70 flex items-center gap-2.5 transition-colors"
                    >
                      <ListMusic className="w-4 h-4 text-purple-400" />
                      <div>
                        <p className="font-medium">Lista M3U (.m3u)</p>
                        <p className="text-[10px] text-slate-400">Para VLC, Winamp y reproductores</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onExportJSON();
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3.5 py-2 text-xs text-slate-200 hover:bg-slate-700/70 flex items-center gap-2.5 transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-medium">Respaldo JSON (.json)</p>
                        <p className="text-[10px] text-slate-400">Estructura completa de datos</p>
                      </div>
                    </button>

                    {onOpenVercelGuide && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenVercelGuide();
                          setShowExportMenu(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-xs text-blue-300 hover:bg-blue-950/40 flex items-center gap-2.5 transition-colors border-t border-slate-700/60"
                      >
                        <Globe className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <p className="font-semibold text-white">Desplegar en Vercel & GitHub</p>
                          <p className="text-[10px] text-blue-300/80">Guía paso a paso y comandos</p>
                        </div>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Vercel Guide Quick Header Button */}
            {onOpenVercelGuide && (
              <button
                type="button"
                onClick={onOpenVercelGuide}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors shadow-sm"
                title="Cómo desplegar esta aplicación en Vercel y GitHub"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Desplegar en Vercel</span>
              </button>
            )}

            {/* PWA Native App Install Button */}
            <PWAInstallButton variant="navbar" />

            {/* Keyboard Shortcuts Button */}
            {onOpenKeyboardShortcuts && (
              <button
                type="button"
                onClick={onOpenKeyboardShortcuts}
                className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700/60"
                title="Atajos de teclado y ayuda"
              >
                <Command className="w-4 h-4" />
              </button>
            )}

            {/* Search & Download More Songs Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all active:scale-95 whitespace-nowrap"
              title="Buscar nuevas canciones en la web para escuchar, descargar y agregar a tus listas"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar / Descargar Más</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu Sheet */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-sm sm:hidden">
          <div
            className="flex-1"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-4 space-y-3 pb-safe shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-2" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Deezer Library Hub</h3>
                <p className="text-xs text-slate-400">
                  {totalTracks.toLocaleString()} canciones guardadas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Action: Explorar Música Web */}
            <button
              type="button"
              onClick={() => {
                setShowMobileMenu(false);
                onOpenAddModal();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-purple-600/30"
            >
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5" />
                <span>Explorar / Descargar Música Web</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>

            {/* Quick Tools Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Estadísticas */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenStatsModal();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                <BarChart2 className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Estadísticas</span>
              </button>

              {/* Importar CSV */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                <Upload className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Importar CSV</span>
              </button>

              {/* Ecualizador */}
              {onOpenEqualizer && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenEqualizer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Sliders className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Ecualizador</span>
                </button>
              )}

              {/* Letras / Karaoke */}
              {onOpenLyrics && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenLyrics();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Mic2 className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Letras en Vivo</span>
                </button>
              )}

              {/* Temporizador */}
              {onOpenSleepTimer && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenSleepTimer();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-left text-xs font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Moon className="w-4 h-4 text-indigo-300 shrink-0" />
                  <span>Apagado Automático</span>
                </button>
              )}

              {/* Duplicadas */}
              {duplicateCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenDuplicatesModal();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-left text-xs font-medium text-amber-300"
                >
                  <Copy className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{duplicateCount} Duplicadas</span>
                </button>
              )}
            </div>

            {/* Bulk Download Entire DB */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenBulkDownloadModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-left text-xs font-semibold text-emerald-300 hover:bg-emerald-900/40"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-white font-bold">Descargar Toda la Biblioteca</p>
                    <p className="text-[10px] text-emerald-400">Canciones completas MP3 320kbps</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>
            </div>

            {/* Export formats */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Exportar / Respaldar
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onExportCSV();
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-center text-xs font-medium text-slate-200"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <span>Excel CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onExportM3U();
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-center text-xs font-medium text-slate-200"
                >
                  <ListMusic className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                  <span>Lista M3U</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onExportJSON();
                  }}
                  className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/80 text-center text-xs font-medium text-slate-200"
                >
                  <FileJson className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <span>JSON</span>
                </button>
              </div>
            </div>

            {/* Footer Utilities */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              {onOpenVercelGuide && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileMenu(false);
                    onOpenVercelGuide();
                  }}
                  className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 py-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Desplegar en Vercel</span>
                </button>
              )}
              <PWAInstallButton variant="sidebar" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
