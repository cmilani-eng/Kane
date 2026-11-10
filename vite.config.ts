/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: repoRoot,
  envDir: repoRoot,
  publicDir: resolve(repoRoot, 'public'),
  plugins: [tailwindcss()],
  base: './',
  resolve: {
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
        main: resolve(repoRoot, 'index.html'),
        privacy: resolve(repoRoot, 'games/privacy.html'),
        terms: resolve(repoRoot, 'games/terms.html'),
      },
      output: {
        manualChunks: {
          'vendor-phaser': ['phaser'],
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/database',
            'firebase/functions',
          ],
        },
      },
    },
  },
  test: {
    root: repoRoot,
    include: ['src/**/*.test.ts', 'games/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
