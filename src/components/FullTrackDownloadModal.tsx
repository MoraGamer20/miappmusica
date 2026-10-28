import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Music,
  Globe,
  Disc,
  Clock,
  Sparkles,
  Smartphone,
  CheckCircle2,
  FolderDown,
} from 'lucide-react';
import { Track } from '../types/music';
import { getFullTrackVideoId, getFullDownloadLinks } from '../utils/fullAudioService';

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
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideoId, setIsLoadingVideoId] = useState(false);

  useEffect(() => {
    if (track && isOpen) {
      setIsLoadingVideoId(true);
      getFullTrackVideoId(track).then((id) => {
        setVideoId(id);
        setIsLoadingVideoId(false);
      });
    }
  }, [track, isOpen]);

  if (!isOpen || !track) return null;

  const links = getFullDownloadLinks(track, videoId);

  const formatDuration = (secs?: number) => {
    if (!secs || secs <= 30) return 'Completa (3-5 min)';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
                <Sparkles className="w-3 h-3" /> Audio Completo • Cero recortes de 30s
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
                MP3 320kbps
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Device Notice */}
        <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 mb-4 flex items-start gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-emerald-200/90 leading-relaxed">
            Optimizado para teléfonos móviles (Android, iPhone) y navegadores web portátiles. El archivo MP3 completo se guardará directamente en la carpeta <strong>Descargas</strong> de tu celular.
          </p>
        </div>

        {/* Primary 1-Tap Mobile Download Button */}
        <div className="space-y-2.5">
          <a
            href={links.youtUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/30 active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <Download className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-white">Descargar MP3 Completo</p>
                <p className="text-[10px] text-emerald-100 font-normal">
                  Canción 100% completa en 1 clic • Sin fragmentos
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {/* Cobalt Option */}
            <a
              href={links.cobaltUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate group-hover:text-purple-300">
                    Cobalt Audio
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Sin publicidad</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* Dirpy Option */}
            <a
              href={links.dirpyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Music className="w-4 h-4 text-indigo-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                    Dirpy MP3
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Con carátula y tags</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* SaveFrom / SSYouTube Option */}
            <a
              href={links.ssyoutubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                    Descarga Rápida
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Audio directo</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>

            {/* YouTube Music Option */}
            <a
              href={links.youtubeMusicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 text-slate-200 transition-all active:scale-98 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Disc className="w-4 h-4 text-red-400 shrink-0" />
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-white truncate group-hover:text-red-300">
                    YouTube Music
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">Escuchar completa</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </a>
          </div>
        </div>

        {/* Footer / Bulk button */}
        {onOpenBulkDownloadModal && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBulkDownloadModal();
              }}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors font-medium truncate"
            >
              <FolderDown className="w-4 h-4 shrink-0" />
              <span className="truncate">Descargar más canciones de esta lista</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
