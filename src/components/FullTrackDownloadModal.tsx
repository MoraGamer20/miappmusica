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
} from 'lucide-react';
import { Track } from '../types/music';
import { saveOfflineAudio, isTrackOffline, getOfflineAudioBlob } from '../utils/offlineAudioStorage';
import { getFullTrackVideoId, getFullDownloadLinks } from '../utils/fullAudioService';
import { triggerFileDownload, downloadTrackAudio } from '../utils/downloadHelper';
import { copyTracksForMusicGrabber } from '../utils/musicGrabberBridge';

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
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideoId, setIsLoadingVideoId] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if track is already offline and resolve full video ID
  useEffect(() => {
    if (track && isOpen) {
      setStatusMessage('');
      isTrackOffline(track.id).then((saved) => setIsSavedOffline(saved));
      setIsLoadingVideoId(true);
      getFullTrackVideoId(track).then((vid) => {
        setVideoId(vid);
        setIsLoadingVideoId(false);
      });
    }
  }, [track, isOpen]);

  if (!isOpen || !track) return null;

  const links = getFullDownloadLinks(track, videoId);

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 30) return 'Canción Completa (3-5 min)';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Handle local MP3 file attach for full offline playback in the app
  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatusMessage('Guardando canción completa en memoria...');
      await saveOfflineAudio(track, file);
      setIsSavedOffline(true);
      onTrackSavedOffline?.(track.id);
      setStatusMessage('¡Canción completa guardada para escuchar sin conexión!');
    } catch {
      setStatusMessage('Error al guardar archivo');
    }
  };

  // If already in offline storage, allow downloading local blob
  const handleDownloadSavedBlob = async () => {
    const blob = await getOfflineAudioBlob(track.id);
    if (blob) {
      const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
      const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
      triggerFileDownload(blob, `${safeArtist} - ${safeTitle}.mp3`);
      setStatusMessage('¡Archivo MP3 descargado!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargar Canción Completa</h3>
              <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Audio completo (3-5 min) • Sin corte de 30s
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
              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-500" />
                {formatDuration(track.duration)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                MP3 Completo
              </span>
            </div>
          </div>
        </div>

        {/* Status message */}
        {statusMessage && (
          <div className="mb-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-emerald-300 text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Full Song Download Actions */}
        <div className="space-y-2.5">
          {/* Option 1: Direct 1-Click MP3 Download to Device */}
          <button
            type="button"
            onClick={async () => {
              setStatusMessage('Descargando archivo MP3 a tu dispositivo...');
              const ok = await downloadTrackAudio(track);
              if (ok) {
                setIsSavedOffline(true);
                onTrackSavedOffline?.(track.id);
                setStatusMessage('¡Archivo MP3 descargado y guardado para offline! 🎧');
              } else {
                setStatusMessage('Error al generar la descarga');
              }
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-98 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Descargar Archivo MP3 Directo al Celular
                </p>
                <p className="text-[10px] text-emerald-100 font-normal">
                  Descarga el archivo a tu dispositivo y lo guarda para escuchar sin internet
                </p>
              </div>
            </div>
          </button>

          {/* Option 3: If already saved in IndexedDB, download local blob */}
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
                  <p className="text-xs font-bold text-white">Descargar audio guardado en la App</p>
                  <p className="text-[10px] text-emerald-400 font-normal">
                    Descargar el archivo .mp3 completo a tu dispositivo
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Option 4: Link / Attach local full MP3 to this track */}
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
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 text-slate-300 text-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                <Upload className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Vincular mi archivo MP3 completo</p>
                <p className="text-[10px] text-slate-400">
                  Guárdalo en la app para escuchar completo sin conexión
                </p>
              </div>
            </div>
          </button>

          {/* Option 5: Copy for MusicGrabber Local (320 kbps) */}
          <button
            type="button"
            onClick={async () => {
              const ok = await copyTracksForMusicGrabber([track]);
              if (ok) {
                setStatusMessage('¡Pista copiada para MusicGrabber! Pégala en tu app de PC (192.168.1.45:5000)');
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Server className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Copiar para MusicGrabber Local (320 kbps)</p>
                <p className="text-[10px] text-emerald-300">
                  Formato listo para pegar en tu servidor local
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Notice */}
        <div className="mt-3.5 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Todas las descargas son de <strong>canciones completas (3-5 min)</strong>. Nunca guardamos fragmentos de 30 segundos.
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
