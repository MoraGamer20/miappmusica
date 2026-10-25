import React, { useState } from 'react';
import {
  X,
  FileArchive,
  Download,
  Terminal,
  Layers,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  FolderDown,
} from 'lucide-react';
import { Track } from '../types/music';
import { generateBulkDownloadScripts } from '../utils/fullAudioService';
import { downloadTextFile } from '../utils/downloadHelper';

interface BulkLibraryDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
}

export const BulkLibraryDownloadModal: React.FC<BulkLibraryDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('ALL');
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const targetTracks =
    selectedPlaylist === 'ALL'
      ? tracks
      : tracks.filter((t) => t.playlist.toLowerCase() === selectedPlaylist.toLowerCase());

  const { batScript, shScript, jdownloaderList } = generateBulkDownloadScripts(
    targetTracks,
    `Deezer_${selectedPlaylist}`
  );

  const handleDownloadBat = () => {
    downloadTextFile(
      batScript,
      `descargar_canciones_completas_${selectedPlaylist.replace(/\s+/g, '_')}_windows.bat`,
      'application/x-bat;charset=utf-8'
    );
  };

  const handleDownloadSh = () => {
    downloadTextFile(
      shScript,
      `descargar_canciones_completas_${selectedPlaylist.replace(/\s+/g, '_')}_mac_linux.sh`,
      'application/x-sh;charset=utf-8'
    );
  };

  const handleDownloadJDownloaderList = () => {
    downloadTextFile(
      jdownloaderList,
      `lista_canciones_jdownloader_${selectedPlaylist.replace(/\s+/g, '_')}.txt`,
      'text/plain;charset=utf-8'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Descargador Masivo de Canciones Completas</h3>
              <p className="text-xs text-slate-400">
                Descarga las canciones en su duración 100% completa (MP3 320kbps)
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

        {/* Playlist selector */}
        <div className="my-5 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider mb-1">
              Seleccionar Colección a Descargar:
            </label>
            <p className="text-xs text-slate-400">
              Actualmente seleccionadas: <strong className="text-white">{targetTracks.length} canciones</strong>
            </p>
          </div>

          <select
            value={selectedPlaylist}
            onChange={(e) => setSelectedPlaylist(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
          >
            <option value="ALL">Toda la biblioteca ({tracks.length} canciones)</option>
            {availablePlaylists.map((pl) => (
              <option key={pl} value={pl}>
                Playlist: {pl} ({tracks.filter((t) => t.playlist === pl).length})
              </option>
            ))}
          </select>
        </div>

        {/* Explanatory note */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 mb-5 flex items-start gap-3">
          <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-white mb-0.5">¿Por qué Deezer solo da 30 segundos?</p>
            <p className="text-indigo-200/90 text-[11px] leading-relaxed">
              La API pública de Deezer solo entrega vistas previas promocionales de 30s. Para obtener las canciones
              completas de 3 a 5 minutos en alta calidad (320kbps), estos scripts automáticos buscan cada canción en
              audio oficial, le incrustan la carátula y el nombre del artista, y la guardan en tu computadora.
            </p>
          </div>
        </div>

        {/* Method 1: Windows 1-Click .BAT */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Métodos de Descarga Automática
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Windows .bat */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Windows
                  </span>
                  <p className="text-xs font-bold text-white">Script Automático (.bat)</p>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Haz doble clic en el archivo descargado para iniciar la descarga en segundo plano con yt-dlp.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadBat}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors shadow-md"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Script Windows (.bat)</span>
              </button>
            </div>

            {/* Mac / Linux .sh */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    macOS / Linux
                  </span>
                  <p className="text-xs font-bold text-white">Script Terminal (.sh)</p>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">
                  Ejecuta <code className="bg-slate-900 px-1 rounded text-purple-300">bash descargar.sh</code> en tu terminal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSh}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Script Mac/Linux (.sh)</span>
              </button>
            </div>
          </div>

          {/* JDownloader / IDM */}
          <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/80 flex items-center justify-between gap-3 mt-3">
            <div>
              <p className="text-xs font-bold text-white">Lista de Enlaces para Gestores de Descarga</p>
              <p className="text-[11px] text-slate-400">
                Pega este archivo de texto en JDownloader 2 o Internet Download Manager para descargar en paralelo a máxima velocidad.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadJDownloaderList}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl shrink-0 transition-colors"
            >
              Descargar Lista (.txt)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
