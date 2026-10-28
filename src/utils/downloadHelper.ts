import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
import { getFullDownloadLinks } from './fullAudioService';
import { getOfflineAudioBlob } from './offlineAudioStorage';

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
 * Exports current tracks as M3U Playlist for mobile audio players (VLC, Poweramp, etc.).
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
 * Downloads a single track's full audio directly to user's device.
 * CRITICAL RULE: NEVER downloads 30-second promotional clips to disk!
 * - If user imported a genuine full audio file (local audio), downloads that real full file.
 * - Otherwise, opens the direct 1-click full-song MP3 mobile downloader.
 */
export async function downloadTrackAudio(track: Track): Promise<boolean> {
  try {
    // 1. If user imported a genuine local full audio file, download that full file
    if (track.type === 'Local') {
      const storedBlob = await getOfflineAudioBlob(track.id);
      if (storedBlob && storedBlob.size > 200000) {
        const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
        const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
        triggerFileDownload(storedBlob, `${safeArtist} - ${safeTitle}.mp3`);
        return true;
      }
    }

    // 2. Open direct 1-click full-song MP3 downloader portal (Yout / YouTube audio)
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
 * Downloads playlist packages organized by folder inside a ZIP file.
 * TAILORED FOR MOBILE WEB AND PORTABLE DEVICES:
 * - NO .bat scripts (Windows only, useless on mobile).
 * - NO .sh scripts (Terminal only, useless on mobile).
 * - NO 30-second preview clips!
 * - Includes .m3u playlists ready for mobile music players (VLC for Android/iOS, Poweramp, etc.).
 * - Includes complete CSV and JSON metadata databases.
 * - Includes clear mobile guide for downloading complete MP3s.
 */
export async function downloadTracksByFolderZip(
  tracks: Track[],
  zipFilename = 'Biblioteca_Canciones_Movil.zip',
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

    if (t.isFavorite && plName !== 'Favorite Tracks') {
      if (!grouped['Favorite Tracks']) grouped['Favorite Tracks'] = [];
      if (!grouped['Favorite Tracks'].some((x) => x.id === t.id)) {
        grouped['Favorite Tracks'].push(t);
      }
    }
  }

  // 1. Mobile guide
  const guideText = `======================================================================
DEEZER LIBRARY HUB - PAQUETE PARA DISPOSITIVOS MÓVILES Y CELULARES
======================================================================
¡CERO FRAGMENTOS DE 30 SEGUNDOS!
Se ha eliminado por completo la descarga de vistas previas de 30s.

¿CÓMO USAR ESTE PAQUETE EN TU CELULAR (ANDROID O IPHONE)?

1. REPRODUCTORES DE MÚSICA EN EL CELULAR:
- Cada carpeta contiene un archivo ".m3u" (ej. "Favorite Tracks.m3u").
- Puedes abrirlo con reproductores móviles como:
  * VLC for Android / VLC for iOS
  * Poweramp Music Player
  * Musicolet
  * Samsung Music
  * Reproductor de Música de tu celular

2. DESCARGAR CANCIONES COMPLETAS DIRECTAMENTE A TU CELULAR:
- Abre la app web en tu celular (o instálala como PWA desde el menú de Chrome o Safari).
- En la pestaña "Canciones" o "Favoritas", toca el botón de descarga en cualquier canción.
- Selecciona "Descargar MP3 Completo (1 Clic en Celular)" para guardar la canción completa
  de 3 a 5+ minutos directamente en la carpeta de Descargas de tu teléfono.

3. RESPALDO DIGITAL:
- Incluye Biblioteca_Completa.csv y Biblioteca_Completa.json con los nombres de todas
  tus canciones, artistas, álbumes y metadatos.
======================================================================`;

  zip.file('GUIA_USO_CELULAR.txt', guideText);

  // 2. Add overall CSV and JSON
  zip.file('Biblioteca_Completa.csv', exportToCSV(tracks));
  zip.file('Biblioteca_Completa.json', JSON.stringify(tracks, null, 2));

  let processed = 0;
  const folderEntries = Object.entries(grouped);

  for (const [folderName, folderTracks] of folderEntries) {
    const safeFolderName = folderName.replace(/[/\\?%*:|"<>]/g, '_');
    const folder = zip.folder(safeFolderName);

    // Folder-specific M3U and CSV
    folder?.file(`${safeFolderName}.m3u`, generateM3U(folderTracks, safeFolderName));
    folder?.file(`${safeFolderName}.csv`, exportToCSV(folderTracks));

    // If any track has genuine full offline audio imported (from local user MP3s), include that real full MP3
    for (const track of folderTracks) {
      processed++;
      onProgress?.(
        processed,
        total,
        `[${safeFolderName}] Preparando lista para ${track.artist} - ${track.title}`
      );

      try {
        if (track.type === 'Local') {
          const storedBlob = await getOfflineAudioBlob(track.id);
          if (storedBlob && storedBlob.size > 200000) {
            const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
            const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
            folder?.file(`${safeArtist} - ${safeTitle}.mp3`, storedBlob);
          }
        }
        successCount++;
      } catch {
        failCount++;
      }
    }
  }

  onProgress?.(total, total, 'Empaquetando listas para tu celular...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);

  return { successCount, failCount };
}

/**
 * Batch downloads multiple tracks into a mobile .zip file.
 */
export async function downloadBatchZip(
  tracks: Track[],
  zipFilename = 'Biblioteca_Movil_Deezer.zip',
  onProgress?: (current: number, total: number, currentTrackTitle: string) => void
): Promise<{ successCount: number; failCount: number }> {
  return downloadTracksByFolderZip(tracks, zipFilename, onProgress);
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
