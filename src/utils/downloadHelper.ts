import JSZip from 'jszip';
import { Track } from '../types/music';
import { exportToCSV, generateM3U } from './csvParser';
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
 * Downloads the MP3 audio for a track.
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
 * Batch downloads multiple tracks into a single .zip file.
 * Reports progress via callback: (current: number, total: number, currentTrackTitle: string) => void
 */
export async function downloadBatchZip(
  tracks: Track[],
  zipFilename = 'Canciones_Deezer.zip',
  onProgress?: (current: number, total: number, currentTrackTitle: string) => void
): Promise<{ successCount: number; failCount: number }> {
  const zip = new JSZip();
  let successCount = 0;
  let failCount = 0;
  const total = tracks.length;

  // Add M3U playlist file into the ZIP archive
  const m3uContent = generateM3U(tracks, zipFilename.replace('.zip', ''));
  zip.file('playlist.m3u', m3uContent);

  // Add CSV metadata table into the ZIP archive
  const csvContent = exportToCSV(tracks);
  zip.file('metadatos_canciones.csv', csvContent);

  const folder = zip.folder('canciones_mp3');

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
          const safeArtist = (track.artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
          const safeTitle = (track.title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
          folder?.file(`${i + 1}. ${safeArtist} - ${safeTitle}.mp3`, blob);
          successCount++;
          continue;
        }
      }
      failCount++;
    } catch {
      failCount++;
    }
  }

  onProgress?.(total, total, 'Comprimiendo archivo ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  triggerFileDownload(zipBlob, zipFilename);

  return { successCount, failCount };
}

/**
 * Streaming service links generator
 */
export function getStreamingLinks(track: Track) {
  const query = encodeURIComponent(`${track.title} ${track.artist}`);
  return {
    deezer: track.deezerId ? `https://www.deezer.com/track/${track.deezerId}` : `https://www.deezer.com/search/${query}`,
    spotify: `https://open.spotify.com/search/${query}`,
    youtubeMusic: `https://music.youtube.com/search?q=${query}`,
    appleMusic: `https://music.apple.com/search?term=${query}`,
  };
}
