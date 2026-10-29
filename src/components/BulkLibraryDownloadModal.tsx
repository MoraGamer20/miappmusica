import React, { useState } from 'react';
import {
  X,
  FolderDown,
  Download,
  ListMusic,
  FileSpreadsheet,
  FileJson,
  FolderArchive,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksAsM3U,
  downloadTracksAsCSV,
  downloadTracksAsJSON,
  downloadTracksByFolderZip,
} from '../utils/downloadHelper';

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
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [zipFinished, setZipFinished] = useState(false);

  if (!isOpen) return null;

  const isFavorites =
    selectedPlaylist.toLowerCase() === 'favorite tracks' ||
    selectedPlaylist.toLowerCase() === 'favoritas';

  const targetTracks =
    selectedPlaylist === 'ALL'
      ? tracks
      : isFavorites
      ? tracks.filter((t) => Boolean(t.isFavorite || t.playlist?.toLowerCase().includes('favorit')))
      : tracks.filter((t) => t.playlist?.toLowerCase() === selectedPlaylist.toLowerCase());

  const safeName =
    selectedPlaylist === 'ALL'
      ? 'Biblioteca_Completa'
      : isFavorites
      ? 'Favoritas'
      : selectedPlaylist.replace(/[/\\?%*:|"<>]/g, '_');

  const handleDownloadM3U = () => {
    downloadTracksAsM3U(targetTracks, safeName);
  };

  const handleDownloadCSV = () => {
    downloadTracksAsCSV(targetTracks, `${safeName}.csv`);
  };

  const handleDownloadJSON = () => {
    downloadTracksAsJSON(targetTracks, `${safeName}.json`);
  };

  const handleDownloadZip = async () => {
    setIsPackagingZip(true);
    setZipFinished(false);
    await downloadTracksByFolderZip(targetTracks, `Deezer_${safeName}_Movil.zip`);
    setIsPackagingZip(false);
    setZipFinished(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportador para Celular y Listas</h3>
              <p className="text-xs text-purple-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Compatible con reproductores móviles
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

        {/* Mobile notice */}
        <div className="my-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-300 leading-relaxed">
            Descarga listas de reproducción para abrir en tu celular con <strong>VLC, Poweramp, Musicolet o Samsung Music</strong>, sin necesidad de programas de computadora ni scripts.
          </p>
        </div>

        {/* Playlist selector */}
        <div className="mb-4 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
          <div>
            <span className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-0.5">
              Colección a Exportar:
            </span>
            <p className="text-xs text-slate-300">
              Seleccionadas: <strong className="text-white">{targetTracks.length} canciones</strong>
            </p>
          </div>

          <select
            value={selectedPlaylist}
            onChange={(e) => setSelectedPlaylist(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer max-w-full"
          >
            <option value="ALL">Toda la biblioteca ({tracks.length})</option>
            {availablePlaylists.map((pl) => (
              <option key={pl} value={pl}>
                {pl} ({tracks.filter((t) => t.playlist === pl).length})
              </option>
            ))}
          </select>
        </div>

        {/* Export buttons */}
        <div className="space-y-2.5 mb-4">
          <button
            type="button"
            onClick={handleDownloadM3U}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-left active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-300 flex items-center justify-center shrink-0">
                <ListMusic className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-purple-300">
                  Descargar Playlist para Celular (.m3u)
                </p>
                <p className="text-[10px] text-slate-400">Abre tu música ordenada en cualquier reproductor móvil</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-purple-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isPackagingZip}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-left active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-indigo-300">
                  {isPackagingZip ? 'Empaquetando...' : 'Descargar Paquete Móvil (.zip)'}
                </p>
                <p className="text-[10px] text-slate-400">Playlists organizadas por carpetas + metadatos</p>
              </div>
            </div>
            <Download className="w-4 h-4 text-indigo-400 shrink-0" />
          </button>

          <button
            type="button"
            onClick={async () => {
              const { copyTracksForMusicGrabber } = await import('../utils/musicGrabberBridge');
              const ok = await copyTracksForMusicGrabber(targetTracks);
              if (ok) {
                setZipFinished(true);
              }
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-left active:scale-98 transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white group-hover:text-emerald-300">
                  Copiar lista para MusicGrabber PC (320 kbps)
                </p>
                <p className="text-[10px] text-emerald-300/80">
                  Pégala en tu app de PC para descargar las {targetTracks.length} canciones completas
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
              320 kbps
            </span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 hover:bg-slate-750 border border-slate-700 text-left active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">Respaldo CSV</span>
              </div>
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </button>

            <button
              type="button"
              onClick={handleDownloadJSON}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/70 hover:bg-slate-750 border border-slate-700 text-left active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs font-bold text-white">Respaldo JSON</span>
              </div>
              <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            </button>
          </div>
        </div>

        {zipFinished && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-xs text-emerald-200">¡Archivo descargado a tu celular con éxito!</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
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
