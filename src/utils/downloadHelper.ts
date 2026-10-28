import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
import { generateBulkDownloadScripts, getFullDownloadLinks } from './fullAudioService';
import { saveOfflineAudio, getOfflineAudioBlob } from './offlineAudioStorage';

/**
 * Downloads a single file in the browser using an anchor tag and Blob / ObjectURL.
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Downloads a text file (M3U, CSV, JSON).
 */
export function downloadTextFile(content: string, filename: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  triggerFileDownload(blob, filename);
}

/**
 * Exports current tracks as CSV.
 */
export function downloadTracksAsCSV(tracks: Track[], filename = 'Biblioteca_Canciones.csv') {
  const csv = exportToCSV(tracks);
  downloadTextFile(csv, filename, 'text/csv;charset=utf-8');
}

/**
 * Exports current tracks as M3U Playlist.
 */
export function downloadTracksAsM3U(tracks: Track[], playlistName = 'Mi Playlist') {
  const m3u = generateM3U(tracks, playlistName);
  const safeName = playlistName.replace(/[/\\?%*:|"<>]/g, '_');
  downloadTextFile(m3u, `${safeName}.m3u`, 'audio/x-mpegurl;charset=utf-8');
}

/**
 * Exports current tracks as JSON.
 */
export function downloadTracksAsJSON(tracks: Track[], filename = 'Biblioteca_Canciones.json') {
  const json = JSON.stringify(tracks, null, 2);
  downloadTextFile(json, filename, 'application/json;charset=utf-8');
}

/**
 * Downloads a single track's full audio.
 * NEVER downloads 30-second promotional clips to disk.
 * If local full audio exists, downloads it directly.
 * Otherwise, opens the direct 1-click full-song MP3 downloader in a new window.
 */
export async function downloadTrackAudio(track: Track): Promise<boolean> {
  try {
    // 1. If user imported a genuine full audio file or stored it offline, download that full file
    const storedBlob = await getOfflineAudioBlob(track.id);
    if (storedBlob && storedBlob.size > 200000) {
      const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
      const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
      triggerFileDownload(storedBlob, `${safeArtist} - ${safeTitle}.mp3`);
      return true;
    }

    // 2. Open 1-click full-song MP3 downloader portal (Yout / YouTube audio)
    const links = getFullDownloadLinks(track, null);
    const targetUrl = links.youtUrl || links.youtubeUrl;
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
    return true;
  } catch (err) {
    console.error('Failed to trigger full track download', err);
    return false;
  }
}

/**
 * Downloads tracks organized by playlist subfolders inside a ZIP file.
 * NOTE: Completely purges 30-second promotional clips!
 * Delivers full-song automated batch download scripts (.bat for Windows, .sh for Mac/Linux),
 * JDownloader 2 queue list, M3U playlists, and CSV databases for 1-click complete 320kbps MP3 retrieval.
 */
export async function downloadTracksByFolderZip(
  tracks: Track[],
  zipFilename = 'Biblioteca_Canciones_Completas.zip',
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number }> {
  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;
  const total = tracks.length;

  // Group tracks by playlist/folder
  const grouped: Record<string, Track[]> = {};
  for (const t of tracks) {
    const rawName = t.playlist?.trim() || 'General';
    const isFav = Boolean(
      t.isFavorite ||
      rawName.toLowerCase() === 'favorite tracks' ||
      rawName.toLowerCase() === 'favoritas' ||
      rawName.toLowerCase() === 'favoritos'
    );
    const plName = isFav ? 'Favorite Tracks' : rawName.replace(/[/\\?%*:|"<>]/g, '_');

    if (!grouped[plName]) grouped[plName] = [];
    grouped[plName].push(t);

    // If marked as favorite and belongs to another playlist, ensure it's also in "Favorite Tracks"
    if (t.isFavorite && plName !== 'Favorite Tracks') {
      if (!grouped['Favorite Tracks']) grouped['Favorite Tracks'] = [];
      if (!grouped['Favorite Tracks'].some((x) => x.id === t.id)) {
        grouped['Favorite Tracks'].push(t);
      }
    }
  }

  // 1. Root Readme instructions
  const readmeText = `======================================================================
DEEZER LIBRARY HUB - PAQUETE DE DESCARGA DE CANCIONES COMPLETAS
======================================================================
¡IMPORTANTE!
Se ha ELIMINADO por completo la descarga de fragmentos promocionales de 30 segundos.
Este paquete contiene los scripts y listas automatizadas para descargar
todas tus canciones en su duración 100% COMPLETA (3 a 5+ minutos en MP3 320kbps),
organizadas por sus carpetas y con carátula en alta definición.

¿CÓMO DESCARGAR LAS CANCIONES COMPLETAS?

OPCIÓN 1: AUTOMÁTICO EN WINDOWS (1 Clic - Recomendado)
1. Extrae este archivo ZIP en cualquier carpeta de tu computadora.
2. Abre la carpeta que desees (ej. "Favorite Tracks", "Tarea", etc.).
3. Haz doble clic en el archivo ".bat" (ej. "Descargar_Canciones_Completas_Favorite_Tracks.bat").
4. El script descargará automáticamente cada canción completa en MP3 a 320kbps
   con su carátula y metadatos dentro de esa misma carpeta.
   * Si no tienes yt-dlp instalado, en Windows se instala en segundos abriendo
     PowerShell y ejecutando: winget install yt-dlp

OPCIÓN 2: AUTOMÁTICO EN MACOS O LINUX
1. Extrae este archivo ZIP.
2. Abre la Terminal en la carpeta de la lista.
3. Ejecuta: bash Descargar_Canciones_Completas_[Nombre].sh

OPCIÓN 3: CON JDOWNLOADER 2 O INTERNET DOWNLOAD MANAGER (IDM)
1. Abre JDownloader 2 o IDM.
2. Abre el archivo "Lista_JDownloader_[Nombre].txt" que está dentro de la carpeta.
3. Copia todo su contenido y pégalo en JDownloader para descargar todas las canciones
   en paralelo a máxima velocidad.

OPCIÓN 4: REPRODUCTORES DE AUDIO (VLC, WINAMP, FOOBAR2000, CELULAR)
- Cada carpeta incluye su archivo ".m3u" para reproducir tu selección en orden.
======================================================================`;

  zip.file('LEEME_INSTRUCCIONES_DESCARGA.txt', readmeText);

  // 2. Add overall CSV
  zip.file('Biblioteca_Completa.csv', exportToCSV(tracks));

  // 3. Add root global batch download scripts for the whole library
  const globalScripts = generateBulkDownloadScripts(tracks, 'Biblioteca_Completa');
  zip.file('Descargar_Toda_La_Biblioteca_Windows.bat', globalScripts.batScript);
  zip.file('Descargar_Toda_La_Biblioteca_Mac_Linux.sh', globalScripts.shScript);
  zip.file('Lista_JDownloader_Toda_La_Biblioteca.txt', globalScripts.jdownloaderList);

  let processed = 0;
  const folderEntries = Object.entries(grouped);

  for (const [folderName, folderTracks] of folderEntries) {
    const safeFolderName = folderName.replace(/[/\\?%*:|"<>]/g, '_');
    const folder = zip.folder(safeFolderName);

    // Folder-specific M3U and CSV
    folder?.file(`${safeFolderName}.m3u`, generateM3U(folderTracks, safeFolderName));
    folder?.file(`${safeFolderName}.csv`, exportToCSV(folderTracks));

    // Folder-specific automated full-song download scripts
    const folderScripts = generateBulkDownloadScripts(folderTracks, safeFolderName);
    folder?.file(`Descargar_Canciones_Completas_${safeFolderName}.bat`, folderScripts.batScript);
    folder?.file(`Descargar_Canciones_Completas_${safeFolderName}.sh`, folderScripts.shScript);
    folder?.file(`Lista_JDownloader_${safeFolderName}.txt`, folderScripts.jdownloaderList);

    // If any track has genuine full offline audio imported (from local files), include that real full MP3
    for (const track of folderTracks) {
      processed++;
      onProgress?.(
        processed,
        total,
        `[${safeFolderName}] Preparando ${track.artist} - ${track.title}`
      );

      try {
        const storedBlob = await getOfflineAudioBlob(track.id);
        if (storedBlob && storedBlob.size > 200000) {
          const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
          const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
          folder?.file(`${safeArtist} - ${safeTitle}.mp3`, storedBlob);
        }
        successCount++;
      } catch {
        failCount++;
      }
    }
  }

  onProgress?.(total, total, 'Empaquetando paquete ZIP de canciones completas...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);

  return { successCount, failCount };
}

/**
 * Batch downloads multiple tracks into a single .zip file.
 */
export async function downloadBatchZip(
  tracks: Track[],
  zipFilename = 'Canciones_Completas_Deezer.zip',
  onProgress?: (current: number, total: number, currentTrackTitle: string) => void
): Promise<{ successCount: number; failCount: number }> {
  return downloadTracksByFolderZip(tracks, zipFilename, onProgress);
}

/**
 * Downloads full-song download package directly to a folder on user's computer via File System Access API.
 * Never writes 30s clips to user's disk!
 */
export async function downloadToLocalDirectoryPicker(
  tracks: Track[],
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number } | null> {
  if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
    return null; // Not supported, falls back to ZIP
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    let successCount = 0;
    let failCount = 0;
    const total = tracks.length;

    // Group tracks
    const grouped: Record<string, Track[]> = {};
    for (const t of tracks) {
      const plName = (t.playlist || 'General').replace(/[/\\?%*:|"<>]/g, '_');
      if (!grouped[plName]) grouped[plName] = [];
      grouped[plName].push(t);
    }

    // Write global README
    const readmeHandle = await dirHandle.getFileHandle('LEEME_INSTRUCCIONES_DESCARGA.txt', { create: true });
    const readmeWritable = await readmeHandle.createWritable();
    await readmeWritable.write(
      'Haz doble clic en el archivo .bat dentro de cada carpeta para descargar todas las canciones completas en 320kbps MP3.'
    );
    await readmeWritable.close();

    let processed = 0;

    for (const [folderName, folderTracks] of Object.entries(grouped)) {
      const subDirHandle = await dirHandle.getDirectoryHandle(folderName, { create: true });
      const scripts = generateBulkDownloadScripts(folderTracks, folderName);

      // Write Windows Bat
      const batHandle = await subDirHandle.getFileHandle(`Descargar_Canciones_Completas_${folderName}.bat`, { create: true });
      const batWritable = await batHandle.createWritable();
      await batWritable.write(scripts.batScript);
      await batWritable.close();

      // Write Mac/Linux Sh
      const shHandle = await subDirHandle.getFileHandle(`Descargar_Canciones_Completas_${folderName}.sh`, { create: true });
      const shWritable = await shHandle.createWritable();
      await shWritable.write(scripts.shScript);
      await shWritable.close();

      // Write JDownloader list
      const jdHandle = await subDirHandle.getFileHandle(`Lista_JDownloader_${folderName}.txt`, { create: true });
      const jdWritable = await jdHandle.createWritable();
      await jdWritable.write(scripts.jdownloaderList);
      await jdWritable.close();

      // Write M3U
      const m3uHandle = await subDirHandle.getFileHandle(`${folderName}.m3u`, { create: true });
      const m3uWritable = await m3uHandle.createWritable();
      await m3uWritable.write(generateM3U(folderTracks, folderName));
      await m3uWritable.close();

      for (const track of folderTracks) {
        processed++;
        onProgress?.(processed, total, `[${folderName}] ${track.artist} - ${track.title}`);

        try {
          const storedBlob = await getOfflineAudioBlob(track.id);
          if (storedBlob && storedBlob.size > 200000) {
            const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
            const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
            const fileHandle = await subDirHandle.getFileHandle(`${safeArtist} - ${safeTitle}.mp3`, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(storedBlob);
            await writable.close();
          }
          successCount++;
        } catch {
          failCount++;
        }
      }
    }

    return { successCount, failCount };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null;
    }
    console.error('Error saving download scripts to directory', err);
    return null;
  }
}

/**
 * Streaming service links generator
 */
export function getStreamingLinks(track: Track) {
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  return {
    deezer: track.deezerId
      ? `https://www.deezer.com/track/${track.deezerId}`
      : `https://www.deezer.com/search/${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    youtubeMusic: `https://music.youtube.com/search?q=${query}`,
    appleMusic: `https://music.apple.com/search?term=${query}`,
  };
}
