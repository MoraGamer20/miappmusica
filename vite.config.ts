import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

function fullAudioSearchPlugin() {
  return {
    name: 'full-audio-search-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/full-audio/search', async (req: any, res: any) => {
        try {
          const url = new URL(req.url, 'http://localhost:3000');
          const query = url.searchParams.get('q');
          if (!query) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing query parameter q' }));
            return;
          }

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
          const match = text.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
          const videoId = match ? match[1] : null;

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              videoId,
              query,
              youtubeUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : null,
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err?.message || err) }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), fullAudioSearchPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/api/deezer': {
          target: 'https://api.deezer.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/deezer/, ''),
        },
      },
    },
  };
});
