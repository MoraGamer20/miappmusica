import React, { useState } from 'react';
import { Smartphone, Download, Share, PlusSquare, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'sidebar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showGenericGuide, setShowGenericGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  // Click handler
  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      setShowGenericGuide(true);
    }
  };

  const buttonContent = (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          (variant === 'sidebar'
            ? 'w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-800 border border-purple-500/30 text-purple-200 hover:text-white hover:border-purple-500/60 transition-colors shadow-sm'
            : 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/20 transition-all active:scale-95')
        }
        title="Instalar Deezer Library Hub como App nativa en tu dispositivo"
      >
        <div className="flex items-center gap-2">
          <Smartphone className="w-3.5 h-3.5 text-blue-300" />
          <span>{variant === 'sidebar' ? 'Instalar App Nativa' : 'Instalar App'}</span>
        </div>
        <Download className="w-3.5 h-3.5 text-blue-300 shrink-0" />
      </button>

      {/* iOS Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Instalar en iPhone o iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <Share className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  1. En Safari, toca el botón de <strong>Compartir</strong> (icono de cuadrado con flecha hacia arriba).
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <PlusSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <p>
                  2. Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  3. Pulsa <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="mt-5 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Desktop / Android generic install instructions */}
      {showGenericGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Instalar en PC o Celular</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGenericGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs text-slate-300">
              <p>
                Puedes instalar Deezer Library Hub directamente desde la barra de tu navegador:
              </p>
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <p>
                  • <strong>En Chrome / Edge (PC):</strong> Haz clic en el icono de instalación (🖥️ o ⬇️) en el extremo derecho de la barra de direcciones URL.
                </p>
                <p>
                  • <strong>En Android:</strong> Toca el menú de tres puntos (⋮) en la esquina superior y pulsa <strong>"Instalar aplicación"</strong> o "Agregar a pantalla principal".
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGenericGuide(false)}
              className="mt-5 w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );

  return buttonContent;
};
