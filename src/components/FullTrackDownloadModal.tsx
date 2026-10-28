import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  Music,
  Terminal,
  Globe,
  FileArchive,
  Disc,
  Clock,
  Sparkles,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { Track } from '../types/music';
import { getFullTrackVideoId, getFullDownloadLinks } from '../utils/fullAudioService';
import { saveOfflineAudio, isTrackOffline } from '../utils/offlineAudioStorage';

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
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideoId, setIsLoadingVideoId] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [isSavingOffline, setIsSavingOffline] = useState(false);
  const [isAlreadyOffline, setIsAlreadyOffline] = useState(false);

  useEffect(() => {
    if (track && isOpen) {
      setIsLoadingVideoId(true);
      getFullTrackVideoId(track).then((id) => {
        setVideoId(id);
        setIsLoadingVideoId(false);
      });
      isTrackOffline(track.id).then((saved) => {
        setIsAlreadyOffline(saved);
      });
    }
  }, [track, isOpen]);

  if (!isOpen || !track) return null;

  const links = getFullDownloadLinks(track, videoId);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(links.ytDlpCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleSaveToOffline = async () => {
    if (!track.previewUrl && !track.deezerId) return;
    setIsSavingOffline(true);
    try {
      let audioBlob: Blob | null = null;
      if (track.previewUrl) {
        const res = await fetch(track.previewUrl);
        if (res.ok) {
          audioBlob = await res.blob();
        }
      }
      if (audioBlob) {
        await saveOfflineAudio(track, audioBlob);
        setIsAlreadyOffline(true);
        if (onTrackSavedOffline) {
          onTrackSavedOffline(track.id);
        }
      }
    } catch (err) {
      console.warn('Error saving offline audio', err);
    } finally {
      setIsSavingOffline(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargar Canción Completa</h3>
              <p className="text-xs text-emerald-400 font-medium">MP3 a 320kbps • Cero fragmentos de 30s</p>
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
        <div className="my-4 p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800">
            {track.coverUrl ? (
              <img src={track.coverUrl} alt={track.album} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-purple-400 bg-purple-950/40">
                <Disc className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{track.title}</h4>
            <p className="text-xs text-slate-400 truncate">{track.artist}</p>
            <p className="text-[10px] text-slate-500 truncate">{track.album}</p>
          </div>
        </div>

        {/* In-App Offline Playback Storage Button */}
        <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Memoria Offline del Reproductor</p>
              <p className="text-[10px] text-slate-400">Guarda en caché local para reproducir sin conexión</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSaveToOffline}
            disabled={isSavingOffline || isAlreadyOffline}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isAlreadyOffline
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
            }`}
          >
            {isAlreadyOffline ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Guardado</span>
              </>
            ) : isSavingOffline ? (
              <span>Guardando...</span>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Guardar Offline</span>
              </>
            )}
          </button>
        </div>

        {/* Full Song Download Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Descargar Canción Completa (MP3 320kbps)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              ✓ Cero fragmentos de 30s
            </span>
          </div>

          {/* 1-Click Fast Downloader buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={links.youtUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-emerald-300">Descargador Yout (1-Clic)</p>
                  <p className="text-[10px] text-slate-400">Canción completa en MP3 320kbps</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>

            <a
              href={links.cobaltUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-purple-300">Cobalt.tools (Sin anuncios)</p>
                  <p className="text-[10px] text-slate-400">Audio directo en máxima calidad</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href={links.dirpyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Music className="w-4 h-4 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-indigo-300">Dirpy Studio MP3</p>
                  <p className="text-[10px] text-slate-400">Pista completa con etiquetas ID3</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <a
              href={links.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-red-300">Audio Oficial Completo</p>
                  <p className="text-[10px] text-slate-400">Enlace directo a pista completa</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>

          {/* Terminal Command yt-dlp */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-purple-400" />
                Comando Terminal (yt-dlp):
              </span>
              <button
                type="button"
                onClick={handleCopyCommand}
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCommand ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <code className="block text-[11px] font-mono text-slate-300 break-all bg-slate-900 p-2 rounded border border-slate-800 select-all">
              {links.ytDlpCommand}
            </code>
          </div>
        </div>

        {/* SECTION 3: Bulk Library Downloader */}
        {onOpenBulkDownloadModal && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 bg-purple-950/20 -mx-6 -mb-6 p-6 rounded-b-3xl border-t-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-300">¿Quieres descargar toda tu biblioteca en canciones completas?</p>
                <p className="text-[11px] text-slate-400">Descarga los scripts automáticos para Windows, Mac y Linux.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBulkDownloadModal();
                }}
                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl shrink-0 transition-colors shadow-md"
              >
                Ver Descargador Masivo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
