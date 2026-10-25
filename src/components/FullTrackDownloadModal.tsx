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
} from 'lucide-react';
import { Track } from '../types/music';
import { getFullTrackVideoId, getFullDownloadLinks } from '../utils/fullAudioService';
import { downloadTrackAudio } from '../utils/downloadHelper';

interface FullTrackDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  onOpenBulkDownloadModal?: () => void;
}

export const FullTrackDownloadModal: React.FC<FullTrackDownloadModalProps> = ({
  isOpen,
  onClose,
  track,
  onOpenBulkDownloadModal,
}) => {
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isLoadingVideoId, setIsLoadingVideoId] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [isDownloadingPreview, setIsDownloadingPreview] = useState(false);

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

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(links.ytDlpCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const handleDownloadPreview = async () => {
    setIsDownloadingPreview(true);
    await downloadTrackAudio(track);
    setIsDownloadingPreview(false);
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
              <h3 className="text-base font-bold text-white">Descargar Canción</h3>
              <p className="text-xs text-slate-400">Canción Completa o Vista Previa MP3</p>
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

        {/* SECTION 1: Full Song Download Options */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Opción 1: Descargar Canción Completa (MP3 Alta Calidad)
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
                  <p className="text-[10px] text-slate-400">Canción completa en MP3</p>
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>

            <a
              href={links.y2mateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Download className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-blue-300">Descargador Y2Mate</p>
                  <p className="text-[10px] text-slate-400">MP3 320kbps / 192kbps</p>
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

        {/* SECTION 2: 30s Deezer Preview */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
              Opción 2: Descargar Vista Previa Rápida (30 segundos)
            </span>
          </div>

          <button
            type="button"
            onClick={handleDownloadPreview}
            disabled={isDownloadingPreview}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-purple-400 ${isDownloadingPreview ? 'animate-bounce' : ''}`} />
            <span>
              {isDownloadingPreview ? 'Descargando audio...' : 'Descargar Preview MP3 Oficial de Deezer'}
            </span>
          </button>
        </div>

        {/* SECTION 3: Bulk Library Downloader */}
        {onOpenBulkDownloadModal && (
          <div className="mt-5 pt-4 border-t border-slate-800 bg-purple-950/20 -mx-6 -mb-6 p-6 rounded-b-3xl border-t-purple-500/20">
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
