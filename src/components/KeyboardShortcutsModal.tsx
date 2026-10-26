import React from 'react';
import { Command, X } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Espacio', desc: 'Reproducir / Pausar' },
    { key: '→ / N', desc: 'Siguiente canción' },
    { key: '← / P', desc: 'Canción anterior' },
    { key: 'M', desc: 'Silenciar / Restaurar volumen' },
    { key: '/', desc: 'Enfocar barra de búsqueda' },
    { key: 'L', desc: 'Abrir / Cerrar Letras (Karaoke)' },
    { key: 'E', desc: 'Abrir Ecualizador de Sonido' },
    { key: 'T', desc: 'Abrir Temporizador de Apagado' },
    { key: 'Esc', desc: 'Cerrar cualquier ventana modal' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-300 flex items-center justify-center border border-neutral-700">
              <Command className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Atajos de Teclado</h3>
              <p className="text-xs text-neutral-400">Controla tu reproductor sin usar el ratón</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-2">
          {shortcuts.map((sc, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-800/60 last:border-0">
              <span className="text-xs text-neutral-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono font-bold rounded-lg shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
