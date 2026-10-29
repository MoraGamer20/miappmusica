import React, { useState, useEffect } from 'react';
import {
  X,
  Server,
  Copy,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Wifi,
  Sparkles,
  Upload,
  Layers,
  Settings2,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  getMusicGrabberHost,
  setMusicGrabberHost,
  formatTracksForMusicGrabber,
  copyTracksForMusicGrabber,
  checkMusicGrabberConnection,
  DEFAULT_MUSICGRABBER_HOST,
  LOCALHOST_MUSICGRABBER_HOST,
} from '../utils/musicGrabberBridge';

interface MusicGrabberModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  folderName?: string;
  onImportLocalAudio?: () => void;
}

export const MusicGrabberModal: React.FC<MusicGrabberModalProps> = ({
  isOpen,
  onClose,
  tracks,
  folderName = 'Todas las Canciones',
  onImportLocalAudio,
}) => {
  const [host, setHost] = useState<string>(getMusicGrabberHost());
  const [isEditingHost, setIsEditingHost] = useState(false);
  const [tempHost, setTempHost] = useState(host);
  const [connectionStatus, setConnectionStatus] = useState<{
    isChecking: boolean;
    isOnline: boolean | null;
    message: string;
  }>({
    isChecking: false,
    isOnline: null,
    message: '',
  });
  const [copied, setCopied] = useState(false);

  // Sync and test connection on open
  useEffect(() => {
    if (isOpen) {
      const currentHost = getMusicGrabberHost();
      setHost(currentHost);
      setTempHost(currentHost);
      setCopied(false);
      testConnection(currentHost);
    }
  }, [isOpen]);

  const testConnection = async (targetHost: string) => {
    setConnectionStatus({ isChecking: true, isOnline: null, message: 'Comprobando conexión...' });
    const res = await checkMusicGrabberConnection(targetHost);
    setConnectionStatus({
      isChecking: false,
      isOnline: res.isOnline,
      message: res.message,
    });
  };

  const handleSaveHost = () => {
    setMusicGrabberHost(tempHost);
    setHost(tempHost);
    setIsEditingHost(false);
    testConnection(tempHost);
  };

  const handleCopy = async () => {
    const ok = await copyTracksForMusicGrabber(tracks);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  const formattedText = formatTracksForMusicGrabber(tracks);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto scrollbar-none">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 shrink-0">
              <Server className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">MusicGrabber Local</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  320 kbps FULL
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Descarga de canciones completas a bloques sin límites
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

        {/* Server Connection Status Banner */}
        <div className="my-3.5 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                connectionStatus.isChecking
                  ? 'bg-amber-400 animate-pulse'
                  : connectionStatus.isOnline
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : 'bg-amber-400'
              }`}
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                Servidor: <code className="text-emerald-300 font-mono text-[11px]">{host}</code>
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {connectionStatus.isChecking
                  ? 'Verificando...'
                  : connectionStatus.isOnline
                  ? 'En línea y listo para recibir descargas'
                  : 'Inicia run_windows.bat en tu PC para conectar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingHost(!isEditingHost)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors text-xs flex items-center gap-1"
              title="Cambiar IP del servidor"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Ajustar IP</span>
            </button>
            <button
              type="button"
              onClick={() => testConnection(host)}
              className="px-2.5 py-1 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Comprobar
            </button>
          </div>
        </div>

        {/* Edit Host Input Drawer */}
        {isEditingHost && (
          <div className="mb-3.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-700 text-xs space-y-2">
            <label className="block text-[11px] font-semibold text-slate-300">
              Dirección IP del servidor Flask en tu red Wi-Fi o PC:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tempHost}
                onChange={(e) => setTempHost(e.target.value)}
                placeholder="http://192.168.1.45:5000"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveHost}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                Guardar
              </button>
            </div>
            <div className="flex gap-2 text-[10px] text-slate-400">
              <span>Accesos directos:</span>
              <button
                type="button"
                onClick={() => setTempHost(DEFAULT_MUSICGRABBER_HOST)}
                className="text-emerald-400 hover:underline"
              >
                192.168.1.45:5000 (Wi-Fi Móvil)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => setTempHost(LOCALHOST_MUSICGRABBER_HOST)}
                className="text-emerald-400 hover:underline"
              >
                localhost:5000 (Misma PC)
              </button>
            </div>
          </div>
        )}

        {/* Explanation Card */}
        <div className="mb-3.5 p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Tu app en PC (con FFmpeg) descarga las <strong>canciones 100% completas en 320 kbps</strong> sin que YouTube bloquee la conexión. Copia el bloque de abajo, pégalo en tu servidor y carga los MP3s al celular.
          </p>
        </div>

        {/* Formatted Textarea for Copy */}
        <div className="mb-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Bloque de canciones listo ({tracks.length} pistas de &ldquo;{folderName}&rdquo;):
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Formato: Artista - Canción</span>
          </div>

          <div className="relative">
            <textarea
              readOnly
              value={formattedText}
              rows={6}
              className="w-full px-3 py-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-emerald-300 font-mono text-xs focus:outline-none resize-none scrollbar-thin"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all ${
                copied
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Bloque</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2.5">
          {/* Action 1: Open MusicGrabber web page */}
          <a
            href={host}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Abrir Servidor MusicGrabber</p>
                <p className="text-[10px] text-emerald-100 font-normal">
                  Abre {host} para pegar la lista y descargar a 320 kbps
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-200" />
          </a>

          {/* Action 2: Import downloaded MP3s back into Deezer Library Hub */}
          {onImportLocalAudio && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onImportLocalAudio();
              }}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold text-xs transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-white">Cargar MP3s Descargados a la App</p>
                  <p className="text-[10px] text-slate-400 font-normal">
                    Importa los archivos de tu PC/móvil para escucharlos 100% offline
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            MusicGrabber Bridge • Deezer Library Hub
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
