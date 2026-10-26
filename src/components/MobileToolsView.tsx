import React, { useRef } from 'react';
import {
  Sliders,
  Mic2,
  Moon,
  Upload,
  FileSpreadsheet,
  ListMusic,
  FileJson,
  BarChart2,
  RefreshCw,
  ChevronRight,
  Music2,
  Heart,
  CheckCircle2,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface MobileToolsViewProps {
  totalTracks: number;
  uniqueArtists: number;
  duplicateCount: number;
  activePlaylist: string;
  onOpenStats: () => void;
  onOpenDuplicates: () => void;
  onOpenBulkDownload: () => void;
  onOpenEqualizer: () => void;
  onOpenLyrics: () => void;
  onOpenSleepTimer: () => void;
  onExportCSV: () => void;
  onExportM3U: () => void;
  onExportJSON: () => void;
  onImportCSVFile: (file: File) => void;
  onRestoreOriginalLibrary: () => void;
  hasActiveTrack: boolean;
  sleepTimerRemaining: number | null;
}

export const MobileToolsView: React.FC<MobileToolsViewProps> = ({
  totalTracks,
  uniqueArtists,
  duplicateCount,
  activePlaylist,
  onOpenStats,
  onOpenDuplicates,
  onOpenBulkDownload,
  onOpenEqualizer,
  onOpenLyrics,
  onOpenSleepTimer,
  onExportCSV,
  onExportM3U,
  onExportJSON,
  onImportCSVFile,
  onRestoreOriginalLibrary,
  hasActiveTrack,
  sleepTimerRemaining,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCSVFile(file);
      e.target.value = '';
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] px-4 py-4 pb-36 text-slate-100 flex flex-col gap-5">
      {/* Hidden file input for CSV import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <Sliders className="w-6 h-6 text-purple-400" />
          Ajustes y Utilidades
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Herramientas de audio, exportación y control de tu biblioteca
        </p>
      </div>

      {/* Restore Original Deezer Library Card */}
      <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950 border border-purple-500/40 rounded-2xl p-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/40 shrink-0">
              <RefreshCw className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Biblioteca Original Deezer
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                {totalTracks.toLocaleString()} canciones cargadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRestoreOriginalLibrary}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs active:scale-95 transition-all shadow-md shadow-purple-600/30 shrink-0"
          >
            Recargar
          </button>
        </div>
        <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
          Restaura las 2,117 canciones auténticas de tu exportación original de Deezer y descarta cualquier cambio temporal.
        </p>
      </div>

      {/* Audio Playback Tools */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
          Sonido y Reproducción
        </h3>
        <div className="flex flex-col gap-2">
          {/* Equalizer */}
          <button
            type="button"
            onClick={onOpenEqualizer}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Ecualizador de Audio</p>
                <p className="text-xs text-slate-400">10 bandas de frecuencia y presets (Rock, Pop, Bass...)</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </button>

          {/* Lyrics */}
          <button
            type="button"
            onClick={onOpenLyrics}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Mic2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Letras de Canciones</p>
                <p className="text-xs text-slate-400">
                  {hasActiveTrack ? 'Ver letra de la canción sonando' : 'Reproduce una canción para ver su letra'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </button>

          {/* Sleep Timer */}
          <button
            type="button"
            onClick={onOpenSleepTimer}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Temporizador de Apagado</p>
                <p className="text-xs text-slate-400">
                  {sleepTimerRemaining !== null
                    ? `Activo: se apaga en ${formatTimer(sleepTimerRemaining)}`
                    : 'Pausa la música automáticamente al dormirte'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
          </button>
        </div>
      </div>

      {/* Library Management & Exports */}
      <div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-0.5">
          Exportar y Respaldar
        </h3>
        <div className="grid grid-cols-2 gap-2.5">
          {/* Export CSV */}
          <button
            type="button"
            onClick={onExportCSV}
            className="flex flex-col p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-white">Exportar CSV</span>
            <span className="text-[11px] text-slate-400">Excel / Deezer</span>
          </button>

          {/* Export M3U */}
          <button
            type="button"
            onClick={onExportM3U}
            className="flex flex-col p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <ListMusic className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-xs font-bold text-white">Exportar M3U</span>
            <span className="text-[11px] text-slate-400">Para VLC / Reproductores</span>
          </button>

          {/* Export JSON */}
          <button
            type="button"
            onClick={onExportJSON}
            className="flex flex-col p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <FileJson className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-xs font-bold text-white">Exportar JSON</span>
            <span className="text-[11px] text-slate-400">Copia digital completa</span>
          </button>

          {/* Import CSV */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 active:scale-98 transition-all text-left"
          >
            <Upload className="w-5 h-5 text-amber-400 mb-2" />
            <span className="text-xs font-bold text-white">Importar CSV</span>
            <span className="text-[11px] text-slate-400">Cargar otra lista</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Card */}
      <div
        onClick={onOpenStats}
        className="cursor-pointer bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between active:scale-98 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Estadísticas de tu Música</h4>
            <p className="text-xs text-slate-400">
              {totalTracks.toLocaleString()} canciones • {uniqueArtists} artistas
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
      </div>

      {/* PWA Install */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-white">Instalar en la Pantalla de Inicio</p>
          <p className="text-[11px] text-slate-400">Úsala como app nativa sin barras de navegador</p>
        </div>
        <PWAInstallButton />
      </div>
    </div>
  );
};
