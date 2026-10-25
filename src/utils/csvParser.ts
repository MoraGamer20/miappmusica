import { Track } from '../types/music';

/**
 * Parses a standard RFC-4180 CSV string handling escaped quotes, commas, and multiline cells.
 */
export function parseCSV(csvText: string): Track[] {
  if (!csvText || !csvText.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  // Normalize Windows line endings
  const cleanText = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote ("")
        currentCell += '"';
        i++; // skip next quote
      } else {
        // Toggle quote mode
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Final cell
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Header detection
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  const trackIndex = headers.findIndex((h) => h.includes('track') || h.includes('cancion') || h.includes('título') || h.includes('titulo') || h === 'title');
  const artistIndex = headers.findIndex((h) => h.includes('artist') || h.includes('artista'));
  const albumIndex = headers.findIndex((h) => h.includes('album'));
  const playlistIndex = headers.findIndex((h) => h.includes('playlist'));
  const typeIndex = headers.findIndex((h) => h.includes('type') || h.includes('tipo'));
  const isrcIndex = headers.findIndex((h) => h.includes('isrc'));
  const deezerIdIndex = headers.findIndex((h) => h.includes('deezer') || h.includes('id'));

  const tracks: Track[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const title = trackIndex >= 0 ? row[trackIndex] ?? '' : row[0] ?? '';
    const artist = artistIndex >= 0 ? row[artistIndex] ?? '' : row[1] ?? '';
    const album = albumIndex >= 0 ? row[albumIndex] ?? '' : row[2] ?? '';
    const playlist = playlistIndex >= 0 ? row[playlistIndex] ?? 'Biblioteca' : row[3] ?? 'Biblioteca';
    const type = typeIndex >= 0 ? row[typeIndex] ?? 'Track' : row[4] ?? 'Track';
    const isrc = isrcIndex >= 0 ? row[isrcIndex] ?? '' : row[5] ?? '';
    const deezerId = deezerIdIndex >= 0 ? row[deezerIdIndex] ?? '' : row[6] ?? '';

    if (!title && !artist) continue;

    tracks.push({
      id: `track-${r}-${deezerId || Math.random().toString(36).substring(2, 9)}`,
      title: title.replace(/^"|"$/g, ''),
      artist: artist.replace(/^"|"$/g, ''),
      album: album.replace(/^"|"$/g, ''),
      playlist: playlist.replace(/^"|"$/g, '') || 'Favoritas',
      type: type.replace(/^"|"$/g, '') || 'Track',
      isrc: isrc.replace(/^"|"$/g, ''),
      deezerId: deezerId.replace(/^"|"$/g, ''),
      isFavorite: type.toLowerCase().includes('fav') || playlist.toLowerCase().includes('fav'),
    });
  }

  return tracks;
}

/**
 * Serializes an array of tracks back into RFC-4180 CSV with UTF-8 BOM.
 */
export function exportToCSV(tracks: Track[]): string {
  const headers = ['Track name', 'Artist name', 'Album', 'Playlist name', 'Type', 'ISRC', 'Deezer - id'];

  function escapeCell(val: string | undefined): string {
    const str = val || '';
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  }

  const lines = [headers.join(',')];
  for (const t of tracks) {
    const row = [
      escapeCell(t.title),
      escapeCell(t.artist),
      escapeCell(t.album),
      escapeCell(t.playlist),
      escapeCell(t.isFavorite ? 'Favorite' : t.type || 'Track'),
      escapeCell(t.isrc),
      escapeCell(t.deezerId),
    ];
    lines.push(row.join(','));
  }

  // Prepend UTF-8 BOM so Microsoft Excel and other spreadsheet apps properly display Spanish accents
  return '\uFEFF' + lines.join('\n');
}

/**
 * Generates an extended M3U (.m3u8) playlist file for media players (VLC, Winamp, Apple Music, etc.).
 */
export function generateM3U(tracks: Track[], playlistName = 'Deezer Playlist'): string {
  const lines = ['#EXTM3U', `#PLAYLIST:${playlistName}`];

  for (const t of tracks) {
    const duration = t.duration || 180;
    lines.push(`#EXTINF:${Math.round(duration)},${t.artist} - ${t.title}`);
    if (t.deezerId) {
      lines.push(`https://www.deezer.com/track/${t.deezerId}`);
    } else {
      lines.push(`${t.artist} - ${t.title}.mp3`);
    }
  }

  return lines.join('\n');
}

/**
 * Identifies duplicate tracks based on normalized Title + Artist or Deezer ID.
 */
export function findDuplicateTracks(tracks: Track[]): {
  duplicates: Track[];
  uniqueTracks: Track[];
  groupedDuplicates: Record<string, Track[]>;
} {
  const seen = new Map<string, Track>();
  const duplicates: Track[] = [];
  const uniqueTracks: Track[] = [];
  const groupedDuplicates: Record<string, Track[]> = {};

  for (const t of tracks) {
    const key = t.deezerId
      ? `id:${t.deezerId}`
      : `title:${t.title.trim().toLowerCase()}::artist:${t.artist.trim().toLowerCase()}`;

    if (seen.has(key)) {
      duplicates.push(t);
      if (!groupedDuplicates[key]) {
        groupedDuplicates[key] = [seen.get(key)!, t];
      } else {
        groupedDuplicates[key].push(t);
      }
    } else {
      seen.set(key, t);
      uniqueTracks.push(t);
    }
  }

  return { duplicates, uniqueTracks, groupedDuplicates };
}
