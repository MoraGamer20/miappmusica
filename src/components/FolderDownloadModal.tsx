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
  Heart,
  Upload,
  Sparkles,
  Music,
  Trash2,
  Smartphone,
  ListMusic,
  Headphones,
  Server,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksByFolderZip,
  downloadTracksAsM3U,
  downloadTracksAsCSV,
  downloadTracksAsJSON,
  cacheTracksForOffline,
} from '../utils/downloadHelper';
import { downloadAndSavePlaylistOffline } from '../utils/offlineAudioStorage';
import { isFavoritesPlaylist } from '../App';

interface FolderDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
  initialFolder?: string;
  offlineTrackIds?: Set<string>;
  onImportLocalAudio?: () => void;
  onRefreshOffline?: () => void;
  onClearOfflineCache?: () => void;
  onOpenMusicGrabber?: (tracks: Track[], folderName: string) => void;
}

export const FolderDownloadModal: React.FC<FolderDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
  initialFolder = 'ALL',
  offlineTrackIds,
  onImportLocalAudio,
  onRefreshOffline,
  onClearOfflineCache,
  onOpenMusicGrabber,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>(initialFolder);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: '',
  });
  const [finishedMessage, setFinishedMessage] = useState<string | null>(null);

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

  const localTracksCount = targetTracks.filter(
    (t) => offlineTrackIds?.has(t.id) || t.isOfflineAvailable || t.type === 'Local'
  ).length;

  // Option 1: Save folder directly to phone in-app offline storage (Deezer Mobile Offline Mode)
  const handleSaveToAppOffline = async () => {
    setIsProcessing(true);
    setFinishedMessage(null);

    const savedIds = await downloadAndSavePlaylistOffline(targetTracks, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    onRefreshOffline?.();
    setFinishedMessage(
      `¡Modo Offline activado para "${cleanFolderName}" (${savedIds.length} canciones descargadas)! Ya puedes escucharlas en tu celular sin internet.`
    );
  };

  // Option 2: Download Mobile M3U Playlist file
  const handleDownloadM3U = () => {
    downloadTracksAsM3U(targetTracks, cleanFolderName);
    setFinishedMessage(
      `¡Lista de reproducción .M3U descargada! Ábrela en tu reproductor móvil (VLC para Android/iOS, Poweramp o Musicolet).`
    );
  };

  // Option 3: Download Mobile ZIP package with organized subfolder
  const handleDownloadZipByFolder = async () => {
    setIsProcessing(true);
    setFinishedMessage(null);

    const safeName =
      selectedFolder === 'ALL'
        ? 'Biblioteca_Deezer_Movil.zip'
        : `Carpeta_${cleanFolderName}_Movil.zip`;

    const result = await downloadTracksByFolderZip(targetTracks, safeName, (current, total, statusText) => {
      setProgress({ current, total, statusText });
    });

    setIsProcessing(false);
    if (result.successCount > 0) {
      setFinishedMessage(
        `¡Archivo ZIP descargado con ${result.successCount} canciones completas .MP3 y lista de reproducción .M3U!`
      );
    } else {
      setFinishedMessage(
        `¡Archivo ZIP descargado con la lista de reproducción móvil .M3U y metadatos! Para incluir los archivos de audio .MP3 dentro del ZIP, usa "Cargar Audios" o guárdalas en la memoria local.`
      );
    }
  };

  // Option 4: Download CSV spreadsheet
  const handleDownloadCSV = () => {
    downloadTracksAsCSV(targetTracks, `${cleanFolderName}.csv`);
    setFinishedMessage(`Archivo CSV de respaldo exportado con éxito.`);
  };

  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Descargar Carpeta para Celular</span>
                {isFav && (
                  <span className="text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Favoritas ❤️
                  </span>
                )}
              </h3>
              <p className="text-xs text-purple-300 font-medium flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5" /> Modo Offline Deezer • Canciones Completas
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
        <div className="my-3.5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/70 flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-0.5">
              Carpeta a Procesar:
            </label>
            <p className="text-xs text-slate-300">
              Seleccionadas: <strong className="text-white font-bold">{targetTracks.length} canciones</strong>
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
            <option value="Favoritas ❤️">
              ❤️ Favoritas (Canciones con Corazón: {tracks.filter((t) => t.isFavorite).length})
            </option>
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
          <div className="mb-3.5 p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-center animate-pulse">
            <p className="text-xs font-semibold text-purple-200 mb-2 truncate">
              {progress.statusText || 'Procesando canciones completas...'}
            </p>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-2">
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
          <div className="mb-3.5 p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-200">¡Completado con éxito!</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {finishedMessage}
              </p>
            </div>
          </div>
        )}

        {/* Mobile Download & Offline Options */}
        <div className="space-y-3 mb-3">
          {/* OPTION 1: DEEZER IN-APP OFFLINE MODE (HERO OPTION) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-800/90 to-slate-900 border border-emerald-500/50 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-600 text-[10px] font-bold text-white rounded-bl-xl uppercase tracking-wider">
              Offline Deezer
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <p className="text-xs font-bold text-white">
                  Guardar en Memoria del Celular para Escuchar Sin Internet
                </p>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                Emula el <strong>Modo Offline de Deezer</strong>. Almacena las canciones completas en la memoria local de la app en tu teléfono para reproducirlas sin gastar datos ni wifi, con pantalla bloqueada o en segundo plano.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveToAppOffline}
              disabled={isProcessing || targetTracks.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/30"
            >
              <Headphones className="w-4 h-4" />
              <span>Activar Modo Offline para "{cleanFolderName}" ({targetTracks.length})</span>
            </button>
          </div>

          {/* OPTION: MUSICGRABBER LOCAL (320 KBPS FULL) */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-800/90 to-slate-900 border border-emerald-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Server className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs font-bold text-white truncate">
                  Descargar por Bloques con MusicGrabber Local
                </p>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  320 kbps FULL
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Descarga canciones completas sin límites ni bloqueos mediante tu servidor Python en PC (192.168.1.45:5000).
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMusicGrabber?.(targetTracks, cleanFolderName);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/25 shrink-0 flex items-center justify-center gap-1.5"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Abrir MusicGrabber ({targetTracks.length})</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* OPTION 2: DOWNLOAD MOBILE M3U PLAYLIST */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between hover:border-purple-500/40 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ListMusic className="w-4 h-4 text-purple-400" />
                  <p className="text-xs font-bold text-white">Lista de Reproducción Móvil (.M3U)</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
                  Compatible directamente con <strong>VLC para Android/iPhone</strong>, Poweramp, Musicolet o cualquier reproductor de tu teléfono.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadM3U}
                disabled={isProcessing || targetTracks.length === 0}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-98 text-white font-semibold text-xs transition-colors shadow-md shadow-purple-600/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Playlist .M3U</span>
              </button>
            </div>

            {/* OPTION 3: DOWNLOAD MOBILE ZIP */}
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col justify-between hover:border-indigo-500/40 transition-colors">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FolderArchive className="w-4 h-4 text-indigo-400" />
                  <p className="text-xs font-bold text-white">Paquete ZIP para Celular</p>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                  Empaqueta la lista M3U y las canciones completas MP3 en carpetas organizadas para tu móvil.
                </p>
                <div className="mb-2.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[10px]">
                  {localTracksCount > 0 ? (
                    <span className="text-emerald-400 font-semibold">
                      ✓ {localTracksCount} audios MP3 en memoria listos para empaquetar
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Incluye lista .M3U (o carga archivos MP3 para empaquetar los audios)
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadZipByFolder}
                disabled={isProcessing || targetTracks.length === 0}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Descargar ZIP ({targetTracks.length})</span>
              </button>
            </div>
          </div>

          {/* OPTION 4: IMPORT LOCAL AUDIO FROM PHONE */}
          {onImportLocalAudio && (
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">¿Tienes archivos MP3 en tu celular?</p>
                  <p className="text-[10px] text-slate-400 truncate">Importa audios de tus descargas para reproducirlos sin conexión</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onImportLocalAudio();
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-semibold text-xs rounded-xl transition-all shadow-md shrink-0"
              >
                Cargar Audios
              </button>
            </div>
          )}
        </div>

        {/* Clear 30s Audio Cache Option */}
        {onClearOfflineCache && (
          <div className="mt-1 p-3 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-rose-300">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Limpiar todo el caché de audios y resetear almacenamiento</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onClearOfflineCache();
                setFinishedMessage('Todo el caché y almacenamiento temporal ha sido eliminado con éxito.');
              }}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold text-[11px] rounded-lg transition-colors shrink-0 ml-2"
            >
              Borrar Caché
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3.5 mt-2 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            Deezer Library Hub • Móvil 100%
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
