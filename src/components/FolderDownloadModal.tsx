import React, { useState, useEffect } from 'react';
import {
  X,
  FolderDown,
  FolderArchive,
  HardDrive,
  Download,
  CheckCircle2,
  HelpCircle,
  Folder,
  Terminal,
  Heart,
  Upload,
  Sparkles,
  Music,
  Check,
  Copy,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksByFolderZip,
  downloadToLocalDirectoryPicker,
  downloadTracksAsM3U,
  downloadTextFile,
  cacheTracksForOffline,
} from '../utils/downloadHelper';
import { generateBulkDownloadScripts } from '../utils/fullAudioService';
import { isFavoritesPlaylist } from '../App';

interface FolderDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
  initialFolder?: string;
  onImportLocalAudio?: () => void;
  onRefreshOffline?: () => void;
}

export const FolderDownloadModal: React.FC<FolderDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
  initialFolder = 'ALL',
  onImportLocalAudio,
  onRefreshOffline,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: '',
  });
  const [finishedMessage, setFinishedMessage] = useState<string | null>(null);
  const [hasCopiedScript, setHasCopiedScript] = useState(false);

  // Sync with initialFolder when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedFolder(initialFolder || 'ALL');
      setFinishedMessage(null);
      setProgress({ current: 0, total: 0, statusText: '' });
    }
  }, [isOpen, initialFolder]);

  if (!isOpen) return null;

  // Filter target tracks for the chosen folder
  // If Favoritas / Corazón is selected, capture ALL songs where isFavorite is true
  const isFav = isFavoritesPlaylist(selectedFolder);
  const targetTracks: Track[] =
    selectedFolder === 'ALL'
      ? tracks
      : isFav
      ? tracks.filter((t) => Boolean(t.isFavorite))
      : tracks.filter(
          (t) => (t.playlist || 'General').toLowerCase() === selectedFolder.toLowerCase()
        );

  const cleanFolderName = isFav
    ? 'Favoritas'
    : selectedFolder === 'ALL'
    ? 'Biblioteca_Completa'
    : selectedFolder.replace(/[/\\?%*:|"<>]/g, '_');

  // Method 1: Generate Full-Length Audio Batch Downloader Scripts (320kbps MP3s without 30s cut)
  const handleDownloadFullLengthScripts = () => {
    const scripts = generateBulkDownloadScripts(targetTracks, `Carpeta_${cleanFolderName}`);
    
    // Download Windows .bat
    downloadTextFile(
      scripts.batScript,
      `Descargar_${cleanFolderName}_Completas.bat`,
      'application/x-bat;charset=utf-8'
    );

    // Also download M3U playlist file for convenient playback
    downloadTracksAsM3U(targetTracks, cleanFolderName);

    setFinishedMessage(
      `¡Script de descarga completa generado para "${cleanFolderName}" (${targetTracks.length} canciones)! Ejecútalo en tu PC para descargar todas las canciones completas a 320kbps sin recorte de 30 segundos.`
    );
  };

  // Method 1b: Mac/Linux Shell Script
  const handleDownloadShScript = () => {
    const scripts = generateBulkDownloadScripts(targetTracks, `Carpeta_${cleanFolderName}`);
    downloadTextFile(
      scripts.shScript,
      `Descargar_${cleanFolderName}_Completas.sh`,
      'application/x-sh;charset=utf-8'
    );
    setFinishedMessage(
      `¡Script bash para macOS/Linux generado! Dale permisos con 'chmod +x' y ejecútalo para descargar todas las canciones completas.`
    );
  };

  // Method 2: Cache entire folder into browser IndexedDB for offline in-app playback
  const handleSaveToAppOffline = async () => {
    setIsProcessing(true);
    setFinishedMessage(null);

    const result = await cacheTracksForOffline(targetTracks, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    onRefreshOffline?.();
    setFinishedMessage(
      `¡Se guardaron ${result.successCount} canciones de "${cleanFolderName}" en la memoria offline de la app! Ya puedes escucharlas sin internet en la sección "Descargadas / Offline".`
    );
  };

  // Method 3: Download structured ZIP with subfolders per playlist
  const handleDownloadZipByFolder = async () => {
    setIsProcessing(true);
    setFinishedMessage(null);

    const safeName =
      selectedFolder === 'ALL'
        ? 'Biblioteca_Deezer_Por_Carpetas.zip'
        : `Carpeta_${cleanFolderName}.zip`;

    await downloadTracksByFolderZip(targetTracks, safeName, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    setFinishedMessage(
      `¡Archivo ZIP descargado con éxito con la estructura de subcarpetas y lista .M3U!`
    );
  };

  // Method 4: Save directly into a chosen folder on PC (Chrome, Edge, Opera)
  const handleSaveToDirectory = async () => {
    setIsProcessing(true);
    setFinishedMessage(null);

    const result = await downloadToLocalDirectoryPicker(targetTracks, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    if (result) {
      setFinishedMessage(
        `¡Se guardaron ${result.successCount} canciones directamente en la carpeta elegida de tu disco duro!`
      );
    }
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const hasFileSystemAccess = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Descargar Carpeta de Canciones</span>
                {isFav && <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">Favoritas ❤️</span>}
              </h3>
              <p className="text-xs text-slate-400">
                Descarga canciones completas (320kbps) y guárdalas para escuchar offline sin internet
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
        <div className="my-4 p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
              Carpeta a Procesar:
            </label>
            <p className="text-xs text-slate-300">
              Canciones seleccionadas: <strong className="text-white font-bold">{targetTracks.length} canciones</strong>
              {isFav && <span className="text-rose-400 font-semibold ml-1">(Todas con corazón)</span>}
            </p>
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              setFinishedMessage(null);
            }}
            disabled={isProcessing}
            className="bg-slate-900 border border-purple-500/40 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 font-semibold cursor-pointer max-w-xs"
          >
            <option value="Favoritas ❤️">❤️ Favoritas (Canciones con Corazón: {tracks.filter((t) => t.isFavorite).length})</option>
            <option value="ALL">📁 Todas las canciones ({tracks.length})</option>
            {availablePlaylists
              .filter((pl) => !isFavoritesPlaylist(pl))
              .map((pl) => (
                <option key={pl} value={pl}>
                  📂 {pl} ({tracks.filter((t) => t.playlist === pl).length})
                </option>
              ))}
          </select>
        </div>

        {/* Progress Display */}
        {isProcessing && (
          <div className="mb-4 p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center animate-pulse">
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
        {finishedMessage && (
          <div className="mb-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-200">¡Operación completada con éxito!</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {finishedMessage}
              </p>
            </div>
          </div>
        )}

        {/* Download Options */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Opciones de Descarga y Offline
            </h4>
            <span className="text-[11px] text-purple-400 font-medium">
              Canciones completas sin límites
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* OPTION 1: FULL SONGS BATCH DOWNLOADER (Windows & Mac/Linux) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/50 via-slate-800/80 to-slate-900 border border-purple-500/50 flex flex-col justify-between shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-purple-600 text-[10px] font-bold text-white rounded-bl-xl uppercase tracking-wider">
                Completa 320k
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Terminal className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-bold text-white">Descargador Completo 1-Click</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  Descarga <strong>todas las canciones completas (3-5 min)</strong> en alta calidad MP3 (320kbps) con carátula y etiquetas dentro de una carpeta llamada <em>"{cleanFolderName}"</em>.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadFullLengthScripts}
                  disabled={isProcessing || targetTracks.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-purple-600/30"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Script Windows (.bat) + M3U</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadShScript}
                  disabled={isProcessing || targetTracks.length === 0}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] transition-colors"
                >
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Script macOS / Linux (.sh)</span>
                </button>
              </div>
            </div>

            {/* OPTION 2: SAVE TO IN-APP OFFLINE STORAGE (IndexedDB) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-800/80 to-slate-900 border border-emerald-500/40 flex flex-col justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-bold text-white">Guardar en la App para Offline</p>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                  Almacena las canciones directamente en la memoria interna de la aplicación (IndexedDB). Podrás escucharlas en el reproductor <strong>sin consumir datos ni wifi</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveToAppOffline}
                disabled={isProcessing || targetTracks.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md shadow-emerald-600/30"
              >
                <HardDrive className="w-3.5 h-3.5" />
                <span>Guardar Carpeta Offline ({targetTracks.length})</span>
              </button>
            </div>

            {/* OPTION 3: STRUCTURED ZIP ARCHIVE */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <FolderArchive className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs font-bold text-white">Archivo ZIP con Subcarpeta</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Genera un archivo ZIP estructurado con las pistas de esta carpeta numeradas y su lista de reproducción .M3U lista para abrir en cualquier reproductor.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadZipByFolder}
                disabled={isProcessing || targetTracks.length === 0}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Descargar ZIP ({targetTracks.length})</span>
              </button>
            </div>

            {/* OPTION 4: DIRECT DIRECTORY ON PC OR IMPORT LOCAL AUDIO */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between hover:border-slate-600 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Folder className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-bold text-white">Importar o Guardar en Disco</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  {onImportLocalAudio
                    ? '¿Tienes ya archivos MP3 completos en tu computadora o teléfono? Puedes agregarlos directamente a esta carpeta para escucharlos offline.'
                    : 'Guarda las canciones directamente en una carpeta de tu disco duro con Chrome o Edge.'}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                {onImportLocalAudio && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onImportLocalAudio();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors shadow-md"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Cargar Archivos MP3 a esta Carpeta</span>
                  </button>
                )}

                {hasFileSystemAccess && (
                  <button
                    type="button"
                    onClick={handleSaveToDirectory}
                    disabled={isProcessing || targetTracks.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Elegir Carpeta en PC</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note on Background Playback and Offline */}
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5 text-xs text-slate-300">
          <HelpCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-200">Reproducción en segundo plano:</strong> Las canciones guardadas offline utilizan la API nativa de reproducción con soporte de pantalla bloqueada (MediaSession API). Podrás salir de la app, bloquear tu celular o cambiar de pestaña y la música continuará reproduciéndose ininterrumpidamente.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex justify-end">
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
