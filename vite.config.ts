import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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

          let videoId: string | null = null;
          let videoTitle: string | null = null;
          let durationText: string | null = null;
          let channelName: string | null = null;

          const jsonMatch = text.match(/var ytInitialData = ({.*?});<\/script>/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[1]);
              const contents =
                data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
                  ?.contents?.[0]?.itemSectionRenderer?.contents;
              const firstVideo = contents?.find((c: any) => c.videoRenderer)?.videoRenderer;
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

          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              videoId,
              query,
              title: videoTitle,
              duration: durationText,
              channel: channelName,
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
    plugins: [
      react(),
      tailwindcss(),
      fullAudioSearchPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          id: '/',
          name: 'Deezer Library Hub - Gestor y Reproductor',
          short_name: 'DeezerHub',
          description:
            'Gestiona, busca, reproduce y descarga tu catálogo de canciones con letras en vivo y ecualizador.',
          theme_color: '#0f172a',
          background_color: '#020617',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || '.', '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
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
