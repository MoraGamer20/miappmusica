import React, { useState } from 'react';
import {
  X,
  FolderDown,
  FolderArchive,
  HardDrive,
  Download,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  ListMusic,
  Folder,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksByFolderZip,
  downloadToLocalDirectoryPicker,
  downloadTracksAsM3U,
  downloadTracksAsCSV,
} from '../utils/downloadHelper';

interface FolderDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
}

export const FolderDownloadModal: React.FC<FolderDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: '',
  });
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const targetTracks =
    selectedFolder === 'ALL'
      ? tracks
      : tracks.filter((t) => (t.playlist || 'General').toLowerCase() === selectedFolder.toLowerCase());

  // Method 1: Download structured ZIP with subfolders per playlist
  const handleDownloadZipByFolder = async () => {
    setIsProcessing(true);
    setIsFinished(false);

    const safeName =
      selectedFolder === 'ALL'
        ? 'Biblioteca_Deezer_Por_Carpetas.zip'
        : `Carpeta_${selectedFolder.replace(/[/\\?%*:|"<>]/g, '_')}.zip`;

    await downloadTracksByFolderZip(targetTracks, safeName, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    setIsFinished(true);
  };

  // Method 2: Save directly into a chosen folder on PC (Chrome, Edge, Opera)
  const handleSaveToDirectory = async () => {
    setIsProcessing(true);
    setIsFinished(false);

    const result = await downloadToLocalDirectoryPicker(targetTracks, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    if (result) {
      setIsFinished(true);
    }
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const hasFileSystemAccess = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargar Canciones por Carpeta</h3>
              <p className="text-xs text-slate-400">
                Organiza y descarga tus canciones automáticamente en subcarpetas por playlist
              </p>
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

        {/* Folder / Playlist Selector */}
        <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
              Carpeta o Playlist a Descargar:
            </label>
            <p className="text-xs text-slate-400">
              Canciones a procesar: <strong className="text-white">{targetTracks.length} canciones</strong>
            </p>
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              setIsFinished(false);
            }}
            disabled={isProcessing}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer"
          >
            <option value="ALL">📁 Todas las carpetas ({tracks.length} canciones)</option>
            {availablePlaylists.map((pl) => (
              <option key={pl} value={pl}>
                📂 {pl} ({tracks.filter((t) => t.playlist === pl).length} canciones)
              </option>
            ))}
          </select>
        </div>

        {/* Progress Display */}
        {isProcessing && (
          <div className="mb-5 p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 text-center animate-pulse">
            <p className="text-xs font-semibold text-purple-200 mb-2 truncate">
              {progress.statusText || 'Procesando canciones...'}
            </p>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-200"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {progress.current} / {progress.total} canciones ({percent}%)
            </p>
          </div>
        )}

        {/* Finished Success Notice */}
        {isFinished && (
          <div className="mb-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-200">¡Descarga por carpetas completada!</p>
              <p className="text-[11px] text-slate-300">
                Las canciones se han guardado con sus subcarpetas y además ya están disponibles en el almacenamiento
                offline de la aplicación para reproducirlas sin internet.
              </p>
            </div>
          </div>
        )}

        {/* Options Cards */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Elige el formato de descarga
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Option A: ZIP by Folder */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between hover:border-purple-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <FolderArchive className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-bold text-white">Archivo ZIP con Subcarpetas</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Crea un archivo ZIP estructurado con carpetas por cada playlist, archivos MP3 enumerados y su lista
                  .M3U correspondiente.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadZipByFolder}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar ZIP por Carpetas</span>
              </button>
            </div>

            {/* Option B: Direct PC Directory Picker */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between hover:border-emerald-500/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-white">Guardar en Carpeta Local (PC)</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {hasFileSystemAccess
                    ? 'Selecciona una carpeta en tu disco duro (ej. "Mi Música") y el navegador guardará las canciones directamente ahí.'
                    : 'Esta función requiere Google Chrome, Edge u Opera en PC. Puedes usar el botón ZIP de la izquierda.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveToDirectory}
                disabled={isProcessing || !hasFileSystemAccess}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Elegir Carpeta en PC</span>
              </button>
            </div>
          </div>
        </div>

        {/* Explanatory Banner: In-App Playback & Offline */}
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-3 text-xs text-slate-300">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Reproducción dentro de la app:</strong> Al descargar canciones, la
            aplicación también almacena una copia en el almacenamiento interno offline (IndexedDB). Podrás
            reproducirlas en cualquier momento desde la sección <em>"Descargadas / Offline"</em> sin consumir datos ni
            internet.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
