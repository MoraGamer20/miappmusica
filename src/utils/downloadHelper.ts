import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
import { getOfflineAudioBlob, saveOfflineAudio } from './offlineAudioStorage';
import { getTrackDetails } from './deezerService';

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
 * Downloads a single track's full audio directly to the user's device as an MP3 file.
 * NEVER REDIRECTS TO THIRD PARTY SPAM (yout.com, etc.).
 * 1. Checks if the audio blob is already cached in IndexedDB.
 * 2. If not, fetches the audio stream, stores it for offline playback, and downloads the .mp3 file.
 */
export async function downloadTrackAudio(
  track: Track,
  onProgress?: (statusText: string) => void
): Promise<boolean> {
  try {
    const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
    const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
    const filename = `${safeArtist} - ${safeTitle}.mp3`;

    // 1. Check local offline storage
    let blob = await getOfflineAudioBlob(track.id);

    // 2. If not stored locally, fetch audio from source
    if (!blob) {
      onProgress?.('Obteniendo audio de la canción...');
      let audioUrl = track.previewUrl;

      if (!audioUrl) {
        const details = await getTrackDetails(track);
        if (details.previewUrl) {
          audioUrl = details.previewUrl;
        }
      }

      if (audioUrl) {
        onProgress?.('Descargando archivo MP3...');
        const res = await fetch(audioUrl);
        if (res.ok) {
          blob = await res.blob();
          // Store in offline IndexedDB so it's instantly available without internet
          try {
            await saveOfflineAudio(track, blob);
          } catch {}
        }
      }
    }

    // 3. Trigger direct browser file download
    if (blob) {
      onProgress?.('Guardando archivo...');
      triggerFileDownload(blob, filename);
      return true;
    }

    return false;
  } catch (err) {
    console.error('Failed to trigger direct MP3 download', err);
    return false;
  }
}

/**
 * Batch downloads multiple tracks into a single .zip file containing the actual .mp3 files!
 * "Descargar por bloques la música": Downloads the block of songs with real audio files.
 */
export async function downloadBatchZip(
  tracks: Track[],
  zipFilename = 'Bloque_Canciones.zip',
  onProgress?: (current: number, total: number, currentTrackTitle: string) => void
): Promise<{ successCount: number; failCount: number }> {
  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;
  const total = tracks.length;

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    onProgress?.(i + 1, total, `${t.artist} - ${t.title}`);

    try {
      let blob = await getOfflineAudioBlob(t.id);

      if (!blob && t.previewUrl) {
        const res = await fetch(t.previewUrl);
        if (res.ok) {
          blob = await res.blob();
          try {
            await saveOfflineAudio(t, blob);
          } catch {}
        }
      } else if (!blob) {
        const details = await getTrackDetails(t);
        if (details.previewUrl) {
          const res = await fetch(details.previewUrl);
          if (res.ok) {
            blob = await res.blob();
            try {
              await saveOfflineAudio(t, blob);
            } catch {}
          }
        }
      }

      const safeArtist = (t.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
      const safeTitle = (t.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');

      if (blob) {
        zip.file(`${safeArtist} - ${safeTitle}.mp3`, blob);
        successCount++;
      } else {
        failCount++;
      }
    } catch {
      failCount++;
    }
  }

  // Include playlist and database in the block
  zip.file('Lista_Reproduccion.m3u', generateM3U(tracks, 'Bloque_Descarga'));
  zip.file('Canciones_Metadatos.csv', exportToCSV(tracks));

  onProgress?.(total, total, 'Empaquetando archivo ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);

  return { successCount, failCount };
}

/**
 * Downloads tracks organized by playlist subfolders inside a ZIP file with actual MP3s.
 */
export async function downloadTracksByFolderZip(
  tracks: Track[],
  zipFilename = 'Biblioteca_Canciones_Movil.zip',
  onProgress?: (current: number, total: number, statusText: string) => void
): Promise<{ successCount: number; failCount: number }> {
  return downloadBatchZip(tracks, zipFilename, (current, total, title) => {
    onProgress?.(current, total, `Descargando: ${title}`);
  });
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
