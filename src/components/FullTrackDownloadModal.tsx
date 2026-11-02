import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Disc,
  Clock,
  Sparkles,
  Smartphone,
  CheckCircle2,
  HardDrive,
  Loader2,
  FolderDown,
  ExternalLink,
  Upload,
  Music,
  Server,
  RefreshCw,
  Share2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Track } from '../types/music';
import { saveOfflineAudio, isTrackOffline, getOfflineAudioBlob } from '../utils/offlineAudioStorage';
import { triggerFileDownload, downloadTrackAudio } from '../utils/downloadHelper';
import {
  getFullTrackDetails,
  getFullDownloadLinks,
  FullTrackDetails,
} from '../utils/fullAudioService';
import {
  checkMusicGrabberConnection,
  getMusicGrabberHost,
  setMusicGrabberHost,
  triggerMusicGrabberDirectDownload,
  LAN_MUSICGRABBER_HOST,
  LOCALHOST_MUSICGRABBER_HOST,
} from '../utils/musicGrabberBridge';

interface FullTrackDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onOpenBulkDownloadModal?: () => void;
  onTrackSavedOffline?: (trackId: string) => void;
}

export const FullTrackDownloadModal: React.FC<FullTrackDownloadModalProps> = ({
  isOpen,
  onClose,
  track,
  onOpenBulkDownloadModal,
  onTrackSavedOffline,
}) => {
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [trackDetails, setTrackDetails] = useState<FullTrackDetails | null>(null);
  const [showAdvancedPC, setShowAdvancedPC] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Optional PC server connection state (for desktop power users only)
  const [serverStatus, setServerStatus] = useState<{
    checking: boolean;
    isOnline: boolean;
    host: string;
    message: string;
    ffmpegInstalled?: boolean;
  }>({
    checking: false,
    isOnline: false,
    host: getMusicGrabberHost(),
    message: '',
  });
  const [customHostInput, setCustomHostInput] = useState(getMusicGrabberHost());

  // Check connection to user's local server quietly
  const verifyServer = async (targetHost?: string) => {
    setServerStatus((prev) => ({ ...prev, checking: true }));
    try {
      const result = await checkMusicGrabberConnection(targetHost);
      setServerStatus({
        checking: false,
        isOnline: result.isOnline,
        host: result.host,
        message: result.message,
        ffmpegInstalled: result.ffmpegInstalled,
      });
      setCustomHostInput(result.host);
    } catch {
      setServerStatus((prev) => ({ ...prev, checking: false, isOnline: false }));
    }
  };

  useEffect(() => {
    if (track && isOpen) {
      setStatusMessage('');
      setIsDownloading(false);
      setIsLoadingDetails(true);
      isTrackOffline(track.id).then((saved) => setIsSavedOffline(saved));

      // Resolve full song metadata (official YouTube audio ID and real duration)
      getFullTrackDetails(track)
        .then((details) => {
          setTrackDetails(details);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });

      // Background check for PC bridge without blocking mobile UI
      verifyServer();
    }
  }, [track, isOpen]);

  if (!isOpen || !track) return null;

  const displayDuration = trackDetails?.duration || (track.duration && track.duration > 30 ? `${Math.floor(track.duration / 60)}:${(track.duration % 60).toString().padStart(2, '0')}` : 'Completa (3-5 min)');

  // 1-Touch Mobile Download Handler
  const handleMobileDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setStatusMessage('Preparando enlace de descarga para tu celular...');

    try {
      // 1. If running on PC with active MusicGrabber backend
      if (serverStatus.isOnline) {
        const res = await triggerMusicGrabberDirectDownload(track);
        if (res.success && res.song) {
          setIsSavedOffline(true);
          onTrackSavedOffline?.(track.id);
          setStatusMessage(`¡Descargando "${res.song.title}" a 320 kbps! 🎧`);
          setIsDownloading(false);
          return;
        }
      }

      // 2. Mobile PWA User: Use the resolved full-track video ID to open the mobile MP3 downloader
      const currentDetails = trackDetails || (await getFullTrackDetails(track));
      if (currentDetails.directDownloadUrl) {
        setStatusMessage('¡Abriendo descargador móvil de MP3! Guarda el archivo en tu celular 📱');
        // Open the mobile download tab directly
        window.open(currentDetails.directDownloadUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Fallback to youtube search
        const query = encodeURIComponent(`${track.artist} ${track.title}`);
        window.open(`https://yout.com/`, '_blank', 'noopener,noreferrer');
      }
    } catch (e: any) {
      setStatusMessage(e?.message || 'Error al procesar la descarga');
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle local MP3 file attach for full offline playback in the app
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage('Guardando canción en la memoria del celular...');
      await saveOfflineAudio(track, file);
      setIsSavedOffline(true);
      onTrackSavedOffline?.(track.id);
      setStatusMessage('¡Canción guardada para escuchar sin internet en tu celular! 🎧');
    } catch {
      setStatusMessage('Error al guardar archivo en memoria local');
    }
  };

  // If already in offline storage, download saved blob directly
  const handleDownloadSavedBlob = async () => {
    const blob = await getOfflineAudioBlob(track.id);
    if (blob) {
      const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
      const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
      triggerFileDownload(blob, `${safeArtist} - ${safeTitle}.mp3`);
      setStatusMessage('¡Archivo descargado a tu almacenamiento! 📱');
    }
  };

  const handleSaveHostConfig = () => {
    setMusicGrabberHost(customHostInput);
    verifyServer(customHostInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-none">
        
        {/* Mobile Swipe / Sheet Indicator */}
        <div className="w-12 h-1.5 bg-slate-700/80 rounded-full mx-auto mb-3 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargar Canción</h3>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Audio Completo Oficial • Sin límite de 30s
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Song Preview Banner */}
        <div className="my-3.5 p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70 flex items-center gap-3.5 shadow-sm">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-900 shadow-md">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.album} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400 bg-purple-950/40">
                <Disc className="w-7 h-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-slate-300 truncate mt-0.5">{track.artist}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-300 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {isLoadingDetails ? (
                  <span className="text-slate-400 flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" /> Verificando duración...
                  </span>
                ) : (
                  displayDuration
                )}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ALTA CALIDAD
              </span>
            </div>
          </div>
        </div>

        {/* Mobile PWA Badge */}
        <div className="mb-3 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-purple-200">
            <Smartphone className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-[11px] font-medium">
              Descarga directa en tu celular (Chrome / PWA)
            </span>
          </div>
          {isSavedOffline && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              Guardada Offline
            </span>
          )}
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-emerald-300 text-center flex items-center justify-center gap-2 animate-in fade-in">
            {isDownloading ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="leading-snug">{statusMessage}</span>
          </div>
        )}

        {/* Main Actions */}
        <div className="space-y-2.5">
          {/* PRIMARY: 1-Touch Mobile MP3 Download */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleMobileDownload}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-white font-bold text-sm shadow-xl transition-all ${
              isDownloading
                ? 'bg-slate-700 opacity-80 cursor-wait'
                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:brightness-110 shadow-purple-600/30 active:scale-98'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {isDownloading
                    ? 'Preparando descarga...'
                    : '⚡ Descargar MP3 a mi Celular'}
                </p>
                <p className="text-[10px] text-purple-100 font-normal">
                  Canción completa oficial ({displayDuration}) sin cortes
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-black/40 border border-white/20 px-2 py-1 rounded-lg shrink-0">
              MP3
            </span>
          </button>

          {/* Option: Download saved blob if available in IndexedDB */}
          {isSavedOffline && (
            <button
              type="button"
              onClick={handleDownloadSavedBlob}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-bold text-xs active:scale-98 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Descargar archivo guardado en la App</p>
                  <p className="text-[10px] text-emerald-400 font-normal">
                    Exportar el archivo .mp3 completo a tus Descargas
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>
          )}

          {/* Alternative Mobile Download Portals */}
          {trackDetails?.videoId && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={trackDetails.directDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Descargador Yout</span>
              </a>
              <a
                href={trackDetails.backupDownloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 transition-all text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Descargador Dirpy</span>
              </a>
            </div>
          )}

          {/* Option: Link / Attach local full MP3 to this track */}
          <input
            type="file"
            ref={fileInputRef}
            accept="audio/*,.mp3,.m4a,.wav,.flac"
            onChange={handleFileAttach}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200">Vincular MP3 de mi teléfono</p>
                <p className="text-[10px] text-slate-400">
                  Guárdalo en la app para escuchar completo sin conexión
                </p>
              </div>
            </div>
          </button>

          {/* Collapsible Advanced PC Section (Never confuses mobile users) */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowAdvancedPC(!showAdvancedPC)}
              className="w-full p-2.5 px-3 flex items-center justify-between text-left text-[11px] text-slate-400 hover:text-slate-200"
            >
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Opciones avanzadas para PC (MusicGrabber)</span>
                {serverStatus.isOnline && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                )}
              </span>
              {showAdvancedPC ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showAdvancedPC && (
              <div className="p-3 pt-1 border-t border-slate-800/70 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Estado del servidor en PC:</span>
                  <span
                    className={
                      serverStatus.isOnline ? 'text-emerald-400 font-bold' : 'text-slate-400'
                    }
                  >
                    {serverStatus.isOnline ? 'En línea (320 kbps)' : 'No conectado'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customHostInput}
                    onChange={(e) => setCustomHostInput(e.target.value)}
                    placeholder="http://localhost:5000"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveHostConfig}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Info Note */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Las canciones se descargan como <strong>archivos completos (3-5 min)</strong> directamente en tu carpeta de descargas de Chrome. Los cortes de 30s quedan totalmente descartados.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2">
          {onOpenBulkDownloadModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBulkDownloadModal();
              }}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors font-medium truncate"
            >
              <FolderDown className="w-4 h-4 shrink-0" />
              <span className="truncate">Descargar en bloque</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0 ml-auto active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
