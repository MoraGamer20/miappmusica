import React from 'react';
import { X, FileArchive, CheckCircle2, Loader2, Music } from 'lucide-react';

interface BatchDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  current: number;
  total: number;
  currentTrackTitle: string;
  isComplete: boolean;
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  isOpen,
  onClose,
  current,
  total,
  currentTrackTitle,
  isComplete,
}) => {
  if (!isOpen) return null;

  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 text-center">
        {/* Icon */}
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-600/30">
          {isComplete ? (
            <CheckCircle2 className="w-8 h-8 animate-in zoom-in-75 duration-200" />
          ) : (
            <FileArchive className="w-8 h-8 animate-pulse" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-white mb-1">
          {isComplete ? '¡Descarga ZIP Completada!' : 'Descargando Canciones...'}
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          {isComplete
            ? 'Tu paquete ZIP con archivos MP3 y listas M3U ya se ha guardado en tu dispositivo.'
            : `Procesando ${current} de ${total} canciones seleccionadas`}
        </p>

        {/* Current song notice */}
        {!isComplete && (
          <div className="flex items-center justify-center gap-2 mb-4 px-3 py-2 rounded-xl bg-slate-800/80 text-xs text-slate-300 truncate">
            <Music className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{currentTrackTitle || 'Preparando archivos...'}</span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-400 font-mono mb-6">
          <span>{current} / {total} pistas</span>
          <span>{percent}%</span>
        </div>

        {/* Close / Action button */}
        <button
          type="button"
          onClick={onClose}
          className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors ${
            isComplete
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          {isComplete ? 'Cerrar' : 'Cancelar / Minimizar'}
        </button>
      </div>
    </div>
  );
};
