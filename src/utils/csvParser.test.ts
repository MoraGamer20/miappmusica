import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCSV, exportToCSV, generateM3U, findDuplicateTracks } from './csvParser';
import { Track } from '../types/music';

test('parseCSV handles basic CSV with standard headers', () => {
  const sample = `Track name,Artist name,Album,Playlist name,Type,ISRC,Deezer - id
"death bed","Powfu","death bed","Favorite Tracks","Favorite","871124582","871124582"
"Bajo La Mesa","Morat","Bajo La Mesa","Favorite Tracks","Favorite","963601152","963601152"`;

  const result = parseCSV(sample);
  assert.equal(result.length, 2);
  assert.equal(result[0].title, 'death bed');
  assert.equal(result[0].artist, 'Powfu');
  assert.equal(result[0].deezerId, '871124582');
  assert.equal(result[0].isFavorite, true);
  assert.equal(result[1].title, 'Bajo La Mesa');
  assert.equal(result[1].artist, 'Morat');
});

test('parseCSV handles escaped quotes and internal commas', () => {
  const sample = `Track name,Artist name,Album,Playlist name,Type,ISRC,Deezer - id
"Yo Contigo, Tú Conmigo (The Gong Gong Song / El Tema De La Película ""Gru 3 Mi Villano Favorito"")","Morat","Bailar Y Gozar","Favorite Tracks","Favorite","389879041","389879041"`;

  const result = parseCSV(sample);
  assert.equal(result.length, 1);
  assert.equal(
    result[0].title,
    'Yo Contigo, Tú Conmigo (The Gong Gong Song / El Tema De La Película "Gru 3 Mi Villano Favorito")'
  );
  assert.equal(result[0].artist, 'Morat');
});

test('exportToCSV includes UTF-8 BOM and escapes commas', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Acuérdate De Mí',
      artist: 'Morat',
      album: 'Balas Perdidas',
      playlist: 'Favorite Tracks',
      type: 'Favorite',
      isrc: '571841692',
      deezerId: '571841692',
      isFavorite: true,
    },
  ];

  const csv = exportToCSV(tracks);
  assert.ok(csv.startsWith('\uFEFF'), 'Must contain UTF-8 BOM for Excel');
  assert.ok(csv.includes('Acuérdate De Mí'));
  assert.ok(csv.includes('Morat'));
});

test('generateM3U produces valid extended M3U format', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'death bed',
      artist: 'Powfu',
      album: 'Album',
      playlist: 'Favorites',
      type: 'Favorite',
      isrc: '123',
      deezerId: '871124582',
      duration: 173,
    },
  ];

  const m3u = generateM3U(tracks, 'My Test Playlist');
  assert.ok(m3u.includes('#EXTM3U'));
  assert.ok(m3u.includes('#PLAYLIST:My Test Playlist'));
  assert.ok(m3u.includes('#EXTINF:173,Powfu - death bed'));
  assert.ok(m3u.includes('https://www.deezer.com/track/871124582'));
});

test('findDuplicateTracks correctly segregates duplicates', () => {
  const tracks: Track[] = [
    {
      id: '1',
      title: 'Song A',
      artist: 'Artist 1',
      album: 'Album 1',
      playlist: 'List 1',
      type: 'Track',
      isrc: '',
      deezerId: '1001',
    },
    {
      id: '2',
      title: 'Song B',
      artist: 'Artist 2',
      album: 'Album 2',
      playlist: 'List 1',
      type: 'Track',
      isrc: '',
      deezerId: '1002',
    },
    {
      id: '3',
      title: 'Song A',
      artist: 'Artist 1',
      album: 'Album 1',
      playlist: 'List 2',
      type: 'Track',
      isrc: '',
      deezerId: '1001',
    },
  ];

  const { duplicates, uniqueTracks } = findDuplicateTracks(tracks);
  assert.equal(duplicates.length, 1);
  assert.equal(uniqueTracks.length, 2);
  assert.equal(duplicates[0].id, '3');
});
