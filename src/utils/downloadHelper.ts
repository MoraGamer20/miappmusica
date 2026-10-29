import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
import { getOfflineAudioBlob, fetchOrGenerateTrackAudioBlob, saveOfflineAudio } from './offlineAudioStorage';

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
  setTimeout(() => URL.revokeObjectURL(url), 1500);
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
 * Downloads the MP3 audio for a track directly to the device and caches it offline.
 * Never redirects to external URLs or ad portals.
 */
export async function downloadTrackAudio(track: Track): Promise<boolean> {
  try {
    let blob = await getOfflineAudioBlob(track.id);
    if (!blob || blob.size < 600000) {
      blob = await fetchOrGenerateTrackAudioBlob(track);
      if (blob) {
        await saveOfflineAudio(track, blob);
      }
    }
    if (blob) {
      const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
      const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
      triggerFileDownload(blob, `${safeArtist} - ${safeTitle}.mp3`);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to download single track audio', err);
    return false;
  }
}

/**
 * Checks and confirms available offline tracks. 30s previews are never cached.
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
      const blob = await getOfflineAudioBlob(track.id);
      if (blob) {
        successCount++;
      } else {
        failCount++;
      }
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
        let blob = await getOfflineAudioBlob(track.id);
        if (!blob || blob.size < 600000) {
          blob = await fetchOrGenerateTrackAudioBlob(track);
          if (blob) {
            await saveOfflineAudio(track, blob);
          }
        }
        if (blob) {
          const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
          const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
          const trackNum = String(i + 1).padStart(2, '0');
          folder?.file(`${trackNum}. ${safeArtist} - ${safeTitle}.mp3`, blob);
          successCount++;
        } else {
          failCount++;
        }
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
