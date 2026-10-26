import React, { useState } from 'react';
import { Moon, X, Clock, Play, Check, AlertCircle } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  timerMinutesRemaining: number | null; // null if not active
  onSetTimer: (minutes: number) => void;
  onCancelTimer: () => void;
}

export const SleepTimerModal: React.FC<SleepTimerModalProps> = ({
  isOpen,
  onClose,
  timerMinutesRemaining,
  onSetTimer,
  onCancelTimer,
}) => {
  const [customMinutes, setCustomMinutes] = useState('20');

  if (!isOpen) return null;

  const quickOptions = [
    { label: '5 minutos', value: 5 },
    { label: '10 minutos', value: 10 },
    { label: '15 minutos', value: 15 },
    { label: '30 minutos', value: 30 },
    { label: '45 minutos', value: 45 },
    { label: '60 minutos (1 hora)', value: 60 },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0 && val <= 360) {
      onSetTimer(val);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-neutral-900 to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Temporizador de Apagado</h3>
              <p className="text-xs text-neutral-400">Detén la música suavemente al dormirte</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {timerMinutesRemaining !== null ? (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-indigo-400 animate-pulse" />
                <div>
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Temporizador Activo</p>
                  <p className="text-lg font-bold text-white">
                    {Math.floor(timerMinutesRemaining / 60)}m {timerMinutesRemaining % 60}s restantes
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  onCancelTimer();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <p className="text-xs text-neutral-400">
              Selecciona en cuánto tiempo deseas que la música disminuya su volumen y se pause automáticamente:
            </p>
          )}

          {/* Quick presets */}
          <div className="grid grid-cols-2 gap-2">
            {quickOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  onSetTimer(opt.value);
                  onClose();
                }}
                className="p-3 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 border border-neutral-750 hover:border-indigo-500/50 text-neutral-200 text-left text-xs font-semibold flex items-center justify-between transition-all group"
              >
                <span>{opt.label}</span>
                <Moon className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400 transition-colors" />
              </button>
            ))}
          </div>

          {/* Custom time form */}
          <form onSubmit={handleCustomSubmit} className="pt-2 border-t border-neutral-800 flex gap-2">
            <input
              type="number"
              min="1"
              max="360"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              placeholder="Minutos..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Definir Minutos
            </button>
          </form>

          <div className="text-[11px] text-neutral-500 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
            <span>Durante los últimos 15 segundos, el volumen se desvanecerá suavemente (fade-out) para que no haya cortes abruptos.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
