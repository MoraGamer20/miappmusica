import React, { useRef } from 'react';
import {
  Music,
  Search,
  X,
  Plus,
  Download,
  BarChart2,
  Copy,
  Upload,
  FileSpreadsheet,
  ListMusic,
  FileJson,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/music';

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
}) => {
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSVFile(file);
      e.target.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Deezer Library Hub
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                  BD Musical
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {totalTracks.toLocaleString()} canciones • {uniqueArtistsCount} artistas
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por canción, artista, álbum o ID..."
                className="w-full bg-slate-800/90 text-slate-100 placeholder-slate-400 text-sm rounded-xl pl-10 pr-10 py-2 border border-slate-700/80 focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:border-purple-500 transition-all shadow-inner"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <kbd className="hidden md:inline-block absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] text-slate-400 bg-slate-700/60 rounded border border-slate-600">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
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
              <span className="hidden sm:inline">Estadísticas</span>
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700/80 transition-colors shadow-sm"
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
                <span className="hidden sm:inline">Exportar / Descargar</span>
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
                        <p className="text-[10px] text-emerald-400/90">Scripts para descargar toda la BD (320kbps)</p>
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
                        <p className="font-medium">Lista de Reproducción (.m3u)</p>
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
                  </div>
                </>
              )}
            </div>

            {/* Add Track Button */}
            <button
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Añadir</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
