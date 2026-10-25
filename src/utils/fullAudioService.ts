import { Track } from '../types/music';

// Cache for resolved YouTube video IDs
const videoIdCache = new Map<string, string>();

/**
 * Initializes video cache from localStorage
 */
export function initVideoIdCache() {
  try {
    const saved = localStorage.getItem('deezer_yt_videoid_cache_v1');
    if (saved) {
      const parsed = JSON.parse(saved);
      for (const [k, v] of Object.entries(parsed)) {
        videoIdCache.set(k, v as string);
      }
    }
  } catch {}
}

function persistVideoIdCache() {
  try {
    const obj: Record<string, string> = {};
    let count = 0;
    for (const [k, v] of videoIdCache.entries()) {
      if (count++ > 600) break;
      obj[k] = v;
    }
    localStorage.setItem('deezer_yt_videoid_cache_v1', JSON.stringify(obj));
  } catch {}
}

/**
 * Finds the official YouTube full-length audio/video ID for a track.
 */
export async function getFullTrackVideoId(track: Track): Promise<string | null> {
  const cacheKey = `${track.title.toLowerCase().trim()}::${track.artist.toLowerCase().trim()}`;

  if (videoIdCache.has(cacheKey)) {
    return videoIdCache.get(cacheKey)!;
  }

  try {
    const query = encodeURIComponent(`${track.artist} ${track.title} audio official`);
    const res = await fetch(`/api/full-audio/search?q=${query}`);
    if (res.ok) {
      const data = await res.json();
      if (data.videoId) {
        videoIdCache.set(cacheKey, data.videoId);
        persistVideoIdCache();
        return data.videoId;
      }
    }
  } catch (err) {
    console.error('Error fetching full track videoId', err);
  }

  return null;
}

/**
 * Generates direct full-song download portals and 1-click links for a track.
 */
export function getFullDownloadLinks(track: Track, videoId: string | null) {
  const query = encodeURIComponent(`${track.artist} ${track.title}`);
  const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/results?search_query=${query}`;

  return {
    youtubeUrl: ytUrl,
    cobaltUrl: `https://cobalt.tools/`,
    youtUrl: videoId ? `https://yout.com/video/${videoId}` : `https://yout.com/`,
    y2mateUrl: videoId ? `https://www.y2mate.com/youtube/${videoId}` : `https://www.y2mate.com/`,
    ytdownloaderUrl: videoId ? `https://loader.to/?link=${encodeURIComponent(ytUrl)}&f=mp3` : `https://loader.to/`,
    ytDlpCommand: `yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata "${ytUrl}"`,
  };
}

/**
 * Generates Windows (.bat) and Mac/Linux (.sh) automated batch download scripts
 * for downloading the user's complete library of full-length 320kbps MP3s.
 */
export function generateBulkDownloadScripts(tracks: Track[], libraryName = 'Biblioteca_Deezer_Completa') {
  // Windows Batch script
  const batLines = [
    '@echo off',
    'chcp 65001 >nul',
    'title Descargador Masivo de Musica Completa Deezer',
    'echo ========================================================',
    'echo    DESCARGADOR DE CANCIONES COMPLETAS (320kbps MP3)',
    `echo    Biblioteca: ${tracks.length} canciones`,
    'echo ========================================================',
    'echo.',
    'where yt-dlp >nul 2>nul',
    'if %errorlevel% neq 0 (',
    '    echo [!] yt-dlp no esta instalado en este sistema.',
    '    echo Para instalarlo en Windows abre PowerShell y ejecuta:',
    '    echo     winget install yt-dlp',
    '    echo O descargalo gratis desde: https://github.com/yt-dlp/yt-dlp/releases',
    '    echo.',
    '    pause',
    '    exit /b',
    ')',
    'echo [OK] yt-dlp detectado. Iniciando descargas completas en carpeta ./Musica_Completa...',
    'echo.',
    'if not exist "Musica_Completa" mkdir "Musica_Completa"',
    'cd "Musica_Completa"',
    'echo.',
  ];

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const safeQuery = `${t.artist} - ${t.title}`.replace(/["%]/g, '');
    batLines.push(`echo [${i + 1}/${tracks.length}] Descargando cancion completa: ${safeQuery}...`);
    batLines.push(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata --default-search "ytsearch1:" -o "%(artist)s - %(title)s.%(ext)s" "${safeQuery}"`
    );
  }

  batLines.push('echo.');
  batLines.push('echo ========================================================');
  batLines.push('echo [EXITO] Todas las canciones completas se han descargado.');
  batLines.push('echo ========================================================');
  batLines.push('pause');

  // macOS / Linux Shell script
  const shLines = [
    '#!/usr/bin/env bash',
    'echo "========================================================"',
    'echo "   DESCARGADOR DE CANCIONES COMPLETAS (320kbps MP3)"',
    `echo "   Biblioteca: ${tracks.length} canciones"`,
    'echo "========================================================"',
    'echo ""',
    'if ! command -v yt-dlp &> /dev/null; then',
    '    echo "[!] yt-dlp no está instalado."',
    '    echo "Instálalo en macOS con: brew install yt-dlp"',
    '    echo "O en Linux con: sudo apt install yt-dlp / pip install yt-dlp"',
    '    exit 1',
    'fi',
    'mkdir -p "Musica_Completa"',
    'cd "Musica_Completa"',
  ];

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const safeQuery = `${t.artist} - ${t.title}`.replace(/["$]/g, '');
    shLines.push(`echo "[${i + 1}/${tracks.length}] Descargando completa: ${safeQuery}..."`);
    shLines.push(
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --embed-thumbnail --add-metadata --default-search "ytsearch1:" -o "%(artist)s - %(title)s.%(ext)s" "${safeQuery}"`
    );
  }

  shLines.push('echo "¡Descarga completada!"');

  // Plain text search list for JDownloader 2 / IDM
  const searchQueries = tracks.map((t) => `ytsearch1:${t.artist} - ${t.title}`).join('\n');

  return {
    batScript: batLines.join('\r\n'),
    shScript: shLines.join('\n'),
    jdownloaderList: searchQueries,
  };
}
