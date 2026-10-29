import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
import { getTrackDetails } from './deezerService';
import { saveOfflineAudio } from './offlineAudioStorage';

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
 * Downloads the MP3 audio for a track and caches it in IndexedDB for offline app playback.
 */
export async function downloadTrackAudio(track: Track): Promise<boolean> {
  try {
    let previewUrl = track.previewUrl;
    if (!previewUrl) {
      const details = await getTrackDetails(track);
      previewUrl = details.previewUrl;
    }

    if (!previewUrl) {
      throw new Error('No se encontró archivo de audio para esta pista.');
    }

    const response = await fetch(previewUrl);
    if (!response.ok) throw new Error('Error al descargar el audio desde la red.');
    const blob = await response.blob();

    // Cache in IndexedDB for in-app offline playback
    try {
      await saveOfflineAudio(track, blob);
    } catch {}

    const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
    const safeTitle = (track.title || 'Canción').replace(/[/\\?%*:|"<>]/g, '_');
    triggerFileDownload(blob, `${safeArtist} - ${safeTitle}.mp3`);
    return true;
  } catch (err) {
    console.error('Failed to download single track audio', err);
    return false;
  }
}

/**
 * Caches an entire list/folder of tracks into IndexedDB for offline app playback
 */
export async function cacheTracksForOffline(
  tracks: Track[],
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;
  const total = tracks.length;

  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    onProgress?.(i + 1, total, `${track.artist} - ${track.title}`);

    try {
      let previewUrl = track.previewUrl;
      if (!previewUrl) {
        const details = await getTrackDetails(track);
        previewUrl = details.previewUrl;
      }

      if (previewUrl) {
        const res = await fetch(previewUrl);
        if (res.ok) {
          const blob = await res.blob();
          await saveOfflineAudio(track, blob);
          successCount++;
          continue;
        }
      }
      failCount++;
    } catch {
      failCount++;
    }
  }

  return { successCount, failCount };
}

/**
 * Downloads tracks organized by playlist subfolders inside a ZIP file.
 * Folder structure:
 * - Canciones_Por_Carpeta.zip
 *   ├── Favorite Tracks/
 *   │   ├── 01. Morat - Besos En Guerra.mp3
 *   │   └── playlist.m3u
 *   ├── Tarea/
 *   │   ├── 01. Ed Maverick - Fuentes de Ortiz.mp3
 *   │   └── playlist.m3u
 *   └── Biblioteca_Completa.csv
 */
export async function downloadTracksByFolderZip(
  tracks: Track[],
  zipFilename = 'Biblioteca_Deezer_Por_Carpetas.zip',
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number }> {
  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;
  const total = tracks.length;

  // Group tracks by playlist
  const grouped: Record<string, Track[]> = {};
  for (const t of tracks) {
    let plName = (t.playlist || 'General').trim();
    if (t.isFavorite && (!plName || plName.toLowerCase().includes('favorit'))) {
      plName = 'Favoritas';
    }
    const safeFolderName = plName.replace(/[/\\?%*:|"<>]/g, '_');
    if (!grouped[safeFolderName]) grouped[safeFolderName] = [];
    grouped[safeFolderName].push(t);
  }

  // Add overall CSV
  zip.file('Biblioteca_Completa.csv', exportToCSV(tracks));

  let processed = 0;

  for (const [folderName, folderTracks] of Object.entries(grouped)) {
    const folder = zip.folder(folderName);
    // Add folder-specific M3U playlist
    folder?.file(`${folderName}.m3u`, generateM3U(folderTracks, folderName));

    for (let i = 0; i < folderTracks.length; i++) {
      const track = folderTracks[i];
      processed++;
      onProgress?.(processed, total, `[${folderName}] ${track.artist} - ${track.title}`);

      try {
        let previewUrl = track.previewUrl;
        if (!previewUrl) {
          const details = await getTrackDetails(track);
          previewUrl = details.previewUrl;
        }

        if (previewUrl) {
          const res = await fetch(previewUrl);
          if (res.ok) {
            const blob = await res.blob();
            // Cache in IndexedDB for offline app playback
            try {
              await saveOfflineAudio(track, blob);
            } catch {}

            const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
            const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
            const trackNum = String(i + 1).padStart(2, '0');
            folder?.file(`${trackNum}. ${safeArtist} - ${safeTitle}.mp3`, blob);
            successCount++;
            continue;
          }
        }
        failCount++;
      } catch {
        failCount++;
      }
    }
  }

  onProgress?.(total, total, 'Empaquetando archivo ZIP por carpetas...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);

  return { successCount, failCount };
}

/**
 * Batch downloads multiple tracks into a single .zip file.
 */
export async function downloadBatchZip(
  tracks: Track[],
  zipFilename = 'Canciones_Deezer.zip',
  onProgress?: (current: number, total: number, currentTrackTitle: string) => void
): Promise<{ successCount: number; failCount: number }> {
  return downloadTracksByFolderZip(tracks, zipFilename, onProgress);
}

/**
 * Downloads files directly to a folder on the user's computer via File System Access API
 */
export async function downloadToLocalDirectoryPicker(
  tracks: Track[],
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number } | null> {
  if (typeof window === 'undefined' || !(window as any).showDirectoryPicker) {
    return null; // Not supported in Firefox / Safari, falls back to ZIP
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker();
    let successCount = 0;
    let failCount = 0;
    const total = tracks.length;

    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i];
      onProgress?.(i + 1, total, `${track.artist} - ${track.title}`);

      try {
        let previewUrl = track.previewUrl;
        if (!previewUrl) {
          const details = await getTrackDetails(track);
          previewUrl = details.previewUrl;
        }

        if (previewUrl) {
          const res = await fetch(previewUrl);
          if (res.ok) {
            const blob = await res.blob();
            // Cache in IndexedDB
            try {
              await saveOfflineAudio(track, blob);
            } catch {}

            // Playlist subfolder
            const plName = (track.playlist || 'General').replace(/[/\\?%*:|"<>]/g, '_');
            const subDirHandle = await dirHandle.getDirectoryHandle(plName, { create: true });

            const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
            const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
            const fileHandle = await subDirHandle.getFileHandle(`${safeArtist} - ${safeTitle}.mp3`, {
              create: true,
            });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            successCount++;
            continue;
          }
        }
        failCount++;
      } catch {
        failCount++;
      }
    }

    return { successCount, failCount };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return null;
    }
    console.error('Error saving directly to directory', err);
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
