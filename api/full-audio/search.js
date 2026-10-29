// Vercel Serverless Function for resolving full audio YouTube links
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        },
      }
    );
    const text = await response.text();
    let videoId = null;
    let videoTitle = null;
    let durationText = null;
    let channelName = null;

    const jsonMatch = text.match(/var ytInitialData = ({.*?});<\/script>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
            ?.contents?.[0]?.itemSectionRenderer?.contents;
        const firstVideo = contents?.find((c) => c.videoRenderer)?.videoRenderer;
        if (firstVideo) {
          videoId = firstVideo.videoId || null;
          videoTitle = firstVideo.title?.runs?.[0]?.text || null;
          durationText = firstVideo.lengthText?.simpleText || null;
          channelName = firstVideo.ownerText?.runs?.[0]?.text || null;
        }
      } catch {}
    }

    if (!videoId) {
      const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      videoId = match ? match[1] : null;
    }

    return res.status(200).json({
      videoId,
      query,
      title: videoTitle,
      duration: durationText,
      channel: channelName,
      youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
    });
  } catch (err) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
