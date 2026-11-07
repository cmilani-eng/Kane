/// <reference types="vitest/config" />
import { cpSync, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import { GAMES } from './games/registry';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const gamesDir = resolve(repoRoot, 'games');
const staticGames = GAMES.filter((game) => game.build === 'static');

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary',
};

/**
 * Static games skip Vite entirely: their HTML may import from CDNs or import maps
 * that Vite cannot resolve, so dev serves the files raw and build copies them.
 */
function staticGamesPlugin(): Plugin {
  let outDir = '';
  return {
    name: 'kane-static-games',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [rawPath, query] = (req.url ?? '/').split('?');
        const pathname = decodeURIComponent(rawPath);
        if (GAMES.some(({ id }) => pathname === `/${id}`)) {
          res.statusCode = 301;
          res.setHeader('Location', `${pathname}/${query ? `?${query}` : ''}`);
          return res.end();
        }
        const game = staticGames.find(({ id }) => pathname.startsWith(`/${id}/`));
        if (!game) return next();
        const gameDir = resolve(gamesDir, game.id);
        let file = resolve(gamesDir, `.${pathname}`);
        if (file !== gameDir && !file.startsWith(gameDir + sep)) return next();
        if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, 'index.html');
        if (!existsSync(file)) return next();
        res.setHeader('Content-Type', CONTENT_TYPES[extname(file)] ?? 'application/octet-stream');
        res.end(readFileSync(file));
      });
    },
    writeBundle() {
      for (const { id } of staticGames) {
        cpSync(resolve(gamesDir, id), resolve(outDir, id), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  root: gamesDir,
  envDir: repoRoot,
  publicDir: resolve(repoRoot, 'public'),
  plugins: [tailwindcss(), staticGamesPlugin()],
  base: './',
  resolve: {
    // Kane's sources live outside the Vite root and are served via /@fs.
    // Pin Firebase to one copy so Auth registers on the same app instance.
    dedupe: [
      'firebase',
      '@firebase/app',
      '@firebase/auth',
      '@firebase/firestore',
      '@firebase/component',
      '@firebase/util',
    ],
  },
  server: {
    host: true,
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: resolve(repoRoot, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        hub: resolve(gamesDir, 'index.html'),
        privacy: resolve(gamesDir, 'privacy.html'),
        terms: resolve(gamesDir, 'terms.html'),
        ...Object.fromEntries(
          GAMES.filter((game) => game.build === 'vite').map(({ id }) => [
            id,
            resolve(gamesDir, id, 'index.html'),
          ]),
        ),
      },
    },
  },
  test: {
    root: repoRoot,
    include: ['src/**/*.test.ts', 'games/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
