import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  FolderDown,
  Download,
  CheckCircle2,
  ListMusic,
  FileSpreadsheet,
  FileJson,
  Upload,
  Heart,
  Music,
  Sparkles,
  Smartphone,
  Search,
  ExternalLink,
  Disc,
  FolderArchive,
  HardDrive,
  FileArchive,
} from 'lucide-react';
import { Track } from '../types/music';
import {
  downloadTracksByFolderZip,
  downloadBatchZip,
  downloadTrackAudio,
  downloadTracksAsM3U,
  downloadTracksAsCSV,
  downloadTracksAsJSON,
} from '../utils/downloadHelper';

interface FolderDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  availablePlaylists: string[];
  initialFolder?: string;
  onTriggerImportLocal?: () => void;
  offlinePlaylists?: Record<string, boolean>;
  onToggleFolderOffline?: (folderName: string) => void;
}

export const FolderDownloadModal: React.FC<FolderDownloadModalProps> = ({
  isOpen,
  onClose,
  tracks,
  availablePlaylists,
  initialFolder = 'ALL',
  onTriggerImportLocal,
  offlinePlaylists = {},
  onToggleFolderOffline,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'songs' | 'export' | 'offline'>('songs');
  const [filterSearch, setFilterSearch] = useState('');
  const [isPackagingZip, setIsPackagingZip] = useState(false);
  const [zipFinished, setZipFinished] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; statusText: string }>({
    current: 0,
    total: 0,
    statusText: '',
  });
  const [downloadingSongId, setDownloadingSongId] = useState<string | null>(null);

  // Sync initial folder when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialFolder) {
        setSelectedFolder(initialFolder);
      }
      setFilterSearch('');
      setZipFinished(false);
    }
  }, [isOpen, initialFolder]);

  // Filter target tracks for the chosen folder
  const isFavorites =
    selectedFolder.toLowerCase() === 'favorite tracks' ||
    selectedFolder.toLowerCase() === 'favoritas' ||
    selectedFolder.toLowerCase() === 'favoritos' ||
    selectedFolder.toLowerCase() === 'canciones favoritas';

  const targetTracks = useMemo(() => {
    if (!isOpen) return [];
    if (selectedFolder === 'ALL') return tracks;
    if (isFavorites) {
      return tracks.filter((t) => Boolean(t.isFavorite || t.playlist?.toLowerCase().includes('favorit')));
    }
    return tracks.filter((t) => (t.playlist || 'General').toLowerCase() === selectedFolder.toLowerCase());
  }, [isOpen, selectedFolder, isFavorites, tracks]);

  const safeFolderName =
    selectedFolder === 'ALL'
      ? 'Biblioteca_Completa'
      : isFavorites
      ? 'Favoritas'
      : selectedFolder.replace(/[/\\?%*:|"<>]/g, '_');

  // Filter songs by search term
  const filteredTracks = useMemo(() => {
    if (!isOpen || !filterSearch.trim()) return targetTracks;
    const q = filterSearch.toLowerCase().trim();
    return targetTracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        (t.album && t.album.toLowerCase().includes(q))
    );
  }, [isOpen, targetTracks, filterSearch]);

  if (!isOpen) return null;

  const handleDownloadSongMP3 = async (track: Track) => {
    setDownloadingSongId(track.id);
    try {
      await downloadTrackAudio(track);
    } finally {
      setDownloadingSongId(null);
    }
  };

  const handleDownloadM3U = () => {
    downloadTracksAsM3U(targetTracks, safeFolderName);
  };

  const handleDownloadCSV = () => {
    downloadTracksAsCSV(targetTracks, `${safeFolderName}.csv`);
  };

  const handleDownloadJSON = () => {
    downloadTracksAsJSON(targetTracks, `${safeFolderName}.json`);
  };

  const handleDownloadZip = async () => {
    setIsPackagingZip(true);
    setZipFinished(false);

    const zipName =
      selectedFolder === 'ALL'
        ? 'Biblioteca_Deezer_Movil.zip'
        : `Carpeta_${safeFolderName}_Movil.zip`;

    await downloadTracksByFolderZip(targetTracks, zipName, (current, total, statusText) => {
      setZipProgress({ current, total, statusText });
    });

    setIsPackagingZip(false);
    setZipFinished(true);
  };

  const zipPercent = zipProgress.total > 0 ? Math.round((zipProgress.current / zipProgress.total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 shrink-0">
              <FolderDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 truncate">
                Descargador Móvil por Carpeta
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  Audio Completo
                </span>
              </h3>
              <p className="text-xs text-slate-400 truncate">
                Descarga canciones completas en MP3 directo a tu celular
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Device Notice */}
        <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex items-center gap-2.5">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-xs text-emerald-200/90 leading-relaxed">
            <strong className="text-white">100% Optimizado para Celular:</strong> Cero fragmentos de 30s. Descarga canciones completas directamente a la carpeta de descargas de tu teléfono.
          </p>
        </div>

        {/* Folder Selector Banner */}
        <div className="mb-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-0.5">
              Carpeta / Playlist:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300">
                <strong className="text-white font-bold">{targetTracks.length} canciones</strong> disponibles
              </span>
              {isFavorites && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-400" /> Favoritas
                </span>
              )}
            </div>
          </div>

          <select
            value={selectedFolder}
            onChange={(e) => {
              setSelectedFolder(e.target.value);
              setZipFinished(false);
            }}
            className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-semibold cursor-pointer max-w-full"
          >
            <option value="ALL">📁 Toda la biblioteca ({tracks.length})</option>
            <option value="Favorite Tracks">
              ❤️ Favoritas ({tracks.filter((t) => t.isFavorite).length})
            </option>
            {availablePlaylists
              .filter(
                (pl) =>
                  pl.toLowerCase() !== 'favorite tracks' &&
                  pl.toLowerCase() !== 'favoritas'
              )
              .map((pl) => (
                <option key={pl} value={pl}>
                  📂 {pl} ({tracks.filter((t) => t.playlist === pl).length})
                </option>
              ))}
          </select>
        </div>

        {/* Offline Switch & Batch Download Bar */}
        <div className="mb-3 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                offlinePlaylists[selectedFolder]
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <HardDrive className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                Descargar para escuchar sin conexión
                {offlinePlaylists[selectedFolder] && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    ✓ Activado
                  </span>
                )}
              </span>
              <p className="text-[10px] text-slate-400 truncate">
                {offlinePlaylists[selectedFolder]
                  ? 'Canciones guardadas en este celular • Reproduce sin internet'
                  : 'Guarda todas las canciones de esta carpeta para escuchar sin conexión'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Batch Download Block Button */}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={isPackagingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md active:scale-95 transition-all disabled:opacity-50"
              title="Descargar este bloque de canciones completo en archivo ZIP"
            >
              <FileArchive className="w-3.5 h-3.5" />
              <span>{isPackagingZip ? 'Empaquetando...' : 'Descargar Bloque ZIP'}</span>
            </button>

            {/* Toggle Switch */}
            {onToggleFolderOffline && (
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(offlinePlaylists[selectedFolder])}
                onClick={() => onToggleFolderOffline(selectedFolder)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  offlinePlaylists[selectedFolder] ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
                title={
                  offlinePlaylists[selectedFolder]
                    ? 'Desactivar descarga sin conexión'
                    : 'Descargar toda la carpeta para escuchar sin conexión'
                }
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    offlinePlaylists[selectedFolder] ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 mb-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('songs')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'songs'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="truncate">Canciones MP3</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span className="truncate">Exportar a Celular</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('offline')}
            className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'offline'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="truncate">Música Offline</span>
          </button>
        </div>

        {/* TAB 1: SONG LIST WITH DIRECT 1-TAP MP3 DOWNLOAD */}
        {activeTab === 'songs' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Search filter input */}
            <div className="relative mb-2 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                placeholder="Buscar canción en esta carpeta..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Scrollable song cards */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
              {filteredTracks.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  No se encontraron canciones en esta carpeta.
                </div>
              ) : (
                filteredTracks.slice(0, 150).map((t) => (
                  <div
                    key={t.id}
                    className="pt-1.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                        {t.coverUrl ? (
                          <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-400 bg-purple-950/40">
                            <Disc className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{t.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{t.artist}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadSongMP3(t)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs flex items-center gap-1.5 shrink-0 shadow transition-all"
                      title="Descargar MP3 Completo"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar MP3</span>
                    </button>
                  </div>
                ))
              )}
              {filteredTracks.length > 150 && (
                <p className="text-center text-[11px] text-slate-500 py-2">
                  Mostrando primeras 150 de {filteredTracks.length} canciones. Usa el buscador para encontrar cualquier otra.
                </p>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: EXPORT TO MOBILE PLAYERS (M3U, CSV, JSON, ZIP) */}
        {activeTab === 'export' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* M3U Playlist */}
              <button
                type="button"
                onClick={handleDownloadM3U}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left active:scale-98 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <ListMusic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300">
                      Playlist Celular (.m3u)
                    </h4>
                    <p className="text-[10px] text-slate-400">Para VLC, Poweramp y Reproductores</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-purple-400 shrink-0" />
              </button>

              {/* CSV Database */}
              <button
                type="button"
                onClick={handleDownloadCSV}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left active:scale-98 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-emerald-300">
                      Respaldo CSV (.csv)
                    </h4>
                    <p className="text-[10px] text-slate-400">Excel / Deezer catálogo</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              </button>

              {/* JSON Database */}
              <button
                type="button"
                onClick={handleDownloadJSON}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left active:scale-98 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-blue-300">
                      Respaldo JSON (.json)
                    </h4>
                    <p className="text-[10px] text-slate-400">Copia digital completa</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-blue-400 shrink-0" />
              </button>

              {/* Mobile ZIP Package */}
              <button
                type="button"
                onClick={handleDownloadZip}
                disabled={isPackagingZip}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-950/40 hover:bg-indigo-950/60 border border-indigo-500/40 text-left active:scale-98 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <FolderArchive className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300">
                      Paquete Móvil (.zip)
                    </h4>
                    <p className="text-[10px] text-indigo-300">Listas M3U + base de datos</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-indigo-400 shrink-0" />
              </button>
            </div>

            {isPackagingZip && (
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 text-center animate-pulse">
                <p className="text-xs font-semibold text-indigo-200 mb-1 truncate">{zipProgress.statusText}</p>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${zipPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {zipProgress.current} / {zipProgress.total} canciones ({zipPercent}%)
                </p>
              </div>
            )}

            {zipFinished && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-emerald-200">
                  ¡Paquete para celular descargado con éxito a tu dispositivo!
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OFFLINE IN-APP MUSIC */}
        {activeTab === 'offline' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
              <h4 className="text-xs font-bold text-white mb-1.5 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                Importar Canciones MP3 de tu Teléfono
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Si ya tienes archivos de audio completos (.mp3, .m4a, .wav) en tu celular o memoria microSD, puedes importarlos a la app para escucharlos sin internet y sin gastar tus datos móviles.
              </p>

              {onTriggerImportLocal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onTriggerImportLocal();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-lg shadow-emerald-600/25 active:scale-98"
                >
                  <Upload className="w-4 h-4" />
                  <span>Seleccionar Archivos MP3 en tu Celular</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="text-[11px] text-slate-400 truncate">
            ✓ Audio completo verificado • Cero clips de 30s
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
