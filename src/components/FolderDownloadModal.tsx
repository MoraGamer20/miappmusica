import React, { useState, useEffect } from 'react';
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
  FileCode,
  Terminal,
  Copy,
  Check,
  Upload,
  Heart,
  Music,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksByFolderZip,
  downloadToLocalDirectoryPicker,
  downloadTracksAsM3U,
  downloadTracksAsCSV,
  downloadTextFile,
} from '../utils/downloadHelper';
import { generateBulkDownloadScripts } from '../utils/fullAudioService';

interface FolderDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
  initialFolder?: string;
  onTriggerImportLocal?: () => void;
}

export const FolderDownloadModal: React.FC<FolderDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
  initialFolder = 'ALL',
  onTriggerImportLocal,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'scripts' | 'zip' | 'directory'>('scripts');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedScript, setCopiedScript] = useState<'bat' | 'sh' | 'jdownloader' | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: '',
  });
  const [isFinished, setIsFinished] = useState(false);

  // Sync initial folder when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialFolder) {
        setSelectedFolder(initialFolder);
      }
      setIsFinished(false);
    }
  }, [isOpen, initialFolder]);

  if (!isOpen) return null;

  // Filter target tracks for the chosen folder
  const isFavorites =
    selectedFolder.toLowerCase() === 'favorite tracks' ||
    selectedFolder.toLowerCase() === 'favoritas' ||
    selectedFolder.toLowerCase() === 'favoritos' ||
    selectedFolder.toLowerCase() === 'canciones favoritas';

  const targetTracks =
    selectedFolder === 'ALL'
      ? tracks
      : isFavorites
      ? tracks.filter((t) => Boolean(t.isFavorite || t.playlist?.toLowerCase().includes('favorit')))
      : tracks.filter((t) => (t.playlist || 'General').toLowerCase() === selectedFolder.toLowerCase());

  const safeFolderName =
    selectedFolder === 'ALL'
      ? 'Biblioteca_Completa'
      : isFavorites
      ? 'Favoritas'
      : selectedFolder.replace(/[/\\?%*:|"<>]/g, '_');

  const scripts = generateBulkDownloadScripts(targetTracks, safeFolderName);

  // Download Windows Batch Script
  const handleDownloadBat = () => {
    downloadTextFile(
      scripts.batScript,
      `Descargar_${safeFolderName}_Canciones_Completas.bat`,
      'application/x-bat;charset=utf-8'
    );
  };

  // Download macOS/Linux Shell Script
  const handleDownloadSh = () => {
    downloadTextFile(
      scripts.shScript,
      `Descargar_${safeFolderName}_Canciones_Completas.sh`,
      'application/x-sh;charset=utf-8'
    );
  };

  // Download JDownloader text list
  const handleDownloadJDownloader = () => {
    downloadTextFile(
      scripts.jdownloaderList,
      `Lista_Descarga_${safeFolderName}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  // Download M3U Playlist
  const handleDownloadM3U = () => {
    downloadTracksAsM3U(targetTracks, safeFolderName);
  };

  // Download structured ZIP
  const handleDownloadZipByFolder = async () => {
    setIsProcessing(true);
    setIsFinished(false);

    const zipName =
      selectedFolder === 'ALL'
        ? 'Biblioteca_Deezer_Por_Carpetas.zip'
        : `Carpeta_${safeFolderName}.zip`;

    await downloadTracksByFolderZip(targetTracks, zipName, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    setIsFinished(true);
  };

  // Direct PC Directory Picker
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

  const copyToClipboard = (text: string, type: 'bat' | 'sh' | 'jdownloader') => {
    navigator.clipboard.writeText(text);
    setCopiedScript(type);
    setTimeout(() => setCopiedScript(null), 2000);
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const hasFileSystemAccess = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-2 truncate">
                Descargar Carpeta Completa
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Audio Completo
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Descarga y guarda todas las canciones de tus listas para escucharlas completas offline
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Folder Selector Banner */}
        <div className="my-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-1">
              Carpeta o Lista Seleccionada:
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">
                Total a procesar:{' '}
                <strong className="text-white font-bold">{targetTracks.length} canciones completas</strong>
              </span>
              {isFavorites && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-400" /> Todas las canciones con corazón
                </span>
              )}
            </div>
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              setIsFinished(false);
            }}
            disabled={isProcessing}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer max-w-full"
          >
            <option value="ALL">📁 Todas las carpetas ({tracks.length} canciones)</option>
            <option value="Favorite Tracks">
              ❤️ Favoritas ({tracks.filter((t) => t.isFavorite).length} canciones con corazón)
            </option>
            {availablePlaylists
              .filter(
                (pl) =>
                  pl.toLowerCase() !== 'favorite tracks' &&
                  pl.toLowerCase() !== 'favoritas'
              )
              .map((pl) => (
                <option key={pl} value={pl}>
                  📂 {pl} ({tracks.filter((t) => t.playlist === pl).length} canciones)
                </option>
              ))}
          </select>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scripts'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="truncate">Descargar MP3 Completos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('zip')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'zip'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderArchive className="w-3.5 h-3.5" />
            <span className="truncate">Paquete ZIP</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span className="truncate">Disco / Carpeta PC</span>
          </button>
        </div>

        {/* TAB 1: FULL MP3 DOWNLOAD SCRIPTS (yt-dlp 320kbps + JDownloader) */}
        {activeTab === 'scripts' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-800/60 border border-purple-500/30">
              <div className="flex items-start gap-2.5 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Descargador de Canciones Completas (320kbps MP3)
                  </h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                    Este script descarga automáticamente todas las canciones de <strong>"{safeFolderName}"</strong> en
                    duración completa (3 a 5+ minutos), con carátula en alta definición y metadatos ID3 dentro de una
                    carpeta local llamada <code>./{safeFolderName}</code> en tu equipo.
                  </p>
                </div>
              </div>

              {/* Action buttons grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-purple-500/20">
                {/* Windows Bat */}
                <button
                  type="button"
                  onClick={handleDownloadBat}
                  className="flex items-center justify-between p-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-md transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4" />
                    <div className="text-left">
                      <p className="font-bold">Script Windows (.bat)</p>
                      <p className="text-[10px] text-purple-200">1 clic para descargar carpeta en PC</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                {/* Mac / Linux Sh */}
                <button
                  type="button"
                  onClick={handleDownloadSh}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all active:scale-98"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <p className="font-bold text-white">Script Mac / Linux (.sh)</p>
                      <p className="text-[10px] text-slate-400">Terminal bash para macOS/Linux</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4" />
                </button>

                {/* JDownloader List */}
                <button
                  type="button"
                  onClick={handleDownloadJDownloader}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ListMusic className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">Lista para JDownloader / IDM (.txt)</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* M3U Playlist */}
                <button
                  type="button"
                  onClick={handleDownloadM3U}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <ListMusic className="w-3.5 h-3.5 text-purple-400" />
                    <span className="truncate">Lista de Reproducción (.m3u)</span>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Quick import local MP3s into this folder */}
            {onTriggerImportLocal && (
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">
                      ¿Ya tienes los archivos MP3 descargados en tu equipo?
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Importa tus canciones completas a esta carpeta para escucharlas offline dentro de la app sin internet.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerImportLocal();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shrink-0 shadow"
                >
                  Importar MP3
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: STRUCTURED ZIP */}
        {activeTab === 'zip' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderArchive className="w-4 h-4 text-purple-400" />
                  <h4 className="text-xs font-bold text-white">Paquete ZIP de Canciones Completas</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  ✓ Cero fragmentos de 30s
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Empaqueta esta carpeta en un archivo <code>.zip</code> con los scripts automáticos listos para ejecutar (<code>.bat</code> para Windows y <code>.sh</code> para Mac/Linux), la lista para JDownloader / IDM, la lista de reproducción <code>.m3u</code> y la base de datos <code>.csv</code>. Al descomprimirlo y hacer doble clic en el script <code>.bat</code>, se descargarán automáticamente todas las canciones en su duración 100% completa (320kbps MP3) con carátula incrustada.
              </p>

              {isProcessing && (
                <div className="mb-4 p-3 rounded-xl bg-purple-950/40 border border-purple-500/40 text-center animate-pulse">
                  <p className="text-xs font-semibold text-purple-200 mb-1 truncate">{progress.statusText}</p>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-purple-500 transition-all duration-200"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {progress.current} / {progress.total} canciones ({percent}%)
                  </p>
                </div>
              )}

              {isFinished && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-200">
                    ¡Paquete ZIP de canciones completas generado y descargado con éxito!
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadZipByFolder}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/25"
              >
                <Download className="w-4 h-4" />
                <span>{isProcessing ? 'Empaquetando...' : 'Descargar ZIP de esta Carpeta (Completas)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: DIRECT PC DIRECTORY (File System API) */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white">Guardar Directamente en Carpeta de tu PC</h4>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  ✓ MP3 320kbps
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {hasFileSystemAccess
                  ? 'Guarda directamente en una carpeta de tu disco duro (ej. "Música/Favoritas") los scripts automatizados (.bat y .sh), la lista .m3u y la lista para JDownloader. Al terminar, solo abres esa carpeta y ejecutas el script para descargar todas las canciones completas en MP3 a 320kbps.'
                  : 'Esta función requiere un navegador compatible con File System Access (Google Chrome, Edge u Opera en PC).'}
              </p>

              {isProcessing && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center animate-pulse">
                  <p className="text-xs font-semibold text-emerald-200 mb-1 truncate">{progress.statusText}</p>
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {progress.current} / {progress.total} canciones ({percent}%)
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveToDirectory}
                disabled={isProcessing || !hasFileSystemAccess}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/25"
              >
                <Folder className="w-4 h-4" />
                <span>Elegir Carpeta en PC y Descargar</span>
              </button>
            </div>
          </div>
        )}

        {/* Informative Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
            <HelpCircle className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            Todas las canciones con corazón quedan unidas en Favoritas.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
