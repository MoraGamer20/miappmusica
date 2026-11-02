import { Ytdl } from '@distube/ytdl-core';

// Vercel Serverless Function to stream complete song audio directly without any external sites
export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { videoId, title, artist } = req.query;

  if (!videoId || videoId.length < 5) {
    return res.status(400).json({ error: 'Falta o es inválido el parámetro videoId' });
  }

  const cleanArtist = (artist || 'Artista').replace(/[/\\?%*:|"<>]/g, '_');
  const cleanTitle = (title || 'Cancion').replace(/[/\\?%*:|"<>]/g, '_');
  const filename = `${cleanArtist} - ${cleanTitle}.mp3`;

  try {
    const client = new Ytdl();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const audioStream = client.download(videoUrl, {
      filter: (f) => f.container === 'mp4' && f.hasAudio && !f.hasVideo,
      quality: 'highestaudio',
      highWaterMark: 1 << 25,
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    audioStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error al transmitir el audio completo' });
      }
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error('Download handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: String(error?.message || error) });
    }
  }
}

