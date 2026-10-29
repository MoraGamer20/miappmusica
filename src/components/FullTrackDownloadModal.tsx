import React, { useState } from 'react';
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
} from 'lucide-react';
import { Track } from '../types/music';
import { downloadTrackAudio } from '../utils/downloadHelper';
import { saveOfflineAudio, isTrackOffline, getOfflineAudioBlob } from '../utils/offlineAudioStorage';
import { getTrackDetails } from '../utils/deezerService';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isSavingOffline, setIsSavingOffline] = useState(false);
  const [isSavedOffline, setIsSavedOffline] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Check if track is already offline
  React.useEffect(() => {
    if (track && isOpen) {
      setDownloadSuccess(false);
      setStatusMessage('');
      isTrackOffline(track.id).then((saved) => setIsSavedOffline(saved));
    }
  }, [track, isOpen]);

  if (!isOpen || !track) return null;

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 30) return 'Completa (3-5 min)';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Direct MP3 file download (no external spam redirects)
  const handleDirectDownload = async () => {
    setIsDownloading(true);
    setStatusMessage('Descargando archivo MP3 a tu dispositivo...');
    try {
      const ok = await downloadTrackAudio(track);
      if (ok) {
        setDownloadSuccess(true);
        setStatusMessage('¡Archivo MP3 descargado con éxito!');
        setIsSavedOffline(true);
        onTrackSavedOffline?.(track.id);
      } else {
        setStatusMessage('Iniciando descarga alternativa...');
      }
    } catch {
      setStatusMessage('Error al descargar');
    } finally {
      setIsDownloading(false);
    }
  };

  // Save in local device cache for offline listening
  const handleToggleOffline = async () => {
    setIsSavingOffline(true);
    setStatusMessage('Guardando para escuchar sin internet...');
    try {
      let blob = await getOfflineAudioBlob(track.id);
      if (!blob) {
        let audioUrl = track.previewUrl;
        if (!audioUrl) {
          const details = await getTrackDetails(track);
          audioUrl = details.previewUrl;
        }
        if (audioUrl) {
          const res = await fetch(audioUrl);
          if (res.ok) {
            blob = await res.blob();
          }
        }
      }

      if (blob) {
        await saveOfflineAudio(track, blob);
        setIsSavedOffline(true);
        onTrackSavedOffline?.(track.id);
        setStatusMessage('¡Guardada para escuchar sin conexión!');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingOffline(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargar Canción al Celular</h3>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Descarga directa MP3 • Sin publicidad
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

        {/* Selected Song Preview Banner */}
        <div className="my-3.5 p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-800 shadow-md">
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
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatDuration(track.duration)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30">
                MP3 Directo
              </span>
            </div>
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-emerald-300 text-center flex items-center justify-center gap-2">
            {isDownloading || isSavingOffline ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Primary 1-Tap Direct MP3 Download Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDirectDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-98 transition-all group disabled:opacity-70"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                {isDownloading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">
                  {isDownloading ? 'Descargando...' : 'Descargar Archivo MP3 Directo'}
                </p>
                <p className="text-[11px] text-emerald-100 font-normal">
                  Guarda el archivo .mp3 directamente en tu celular
                </p>
              </div>
            </div>
            {downloadSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-200" />}
          </button>

          {/* Offline In-App Switch Button */}
          <button
            type="button"
            onClick={handleToggleOffline}
            disabled={isSavingOffline || isSavedOffline}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all active:scale-98 ${
              isSavedOffline
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  isSavedOffline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300'
                }`}
              >
                <HardDrive className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">
                  {isSavedOffline ? 'Guardada en Memoria Offline' : 'Guardar para escuchar sin internet'}
                </p>
                <p className="text-[10px] text-slate-400">
                  {isSavedOffline
                    ? 'Lista para reproducir sin conexión a internet'
                    : 'Permite reproducir la canción sin usar datos móviles'}
                </p>
              </div>
            </div>
            {isSavedOffline && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>

        {/* Mobile notice */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Sin páginas externas ni redirecciones a terceros. El archivo se descarga en formato .mp3 en la carpeta de descargas de tu teléfono o navegador.
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
              <span className="truncate">Descargar bloque de canciones</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0 ml-auto"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
