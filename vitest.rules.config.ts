import { defineConfig } from 'vitest/config';

// Emulator-backed rules tests. Kept out of `npm test` (vite.config.ts) because they
// need the Firestore and Database emulators; `npm run test:rules` starts those first.
export default defineConfig({
  test: {
    include: ['rules-tests/**/*.rules.test.ts'],
    fileParallelism: false,
    testTimeout: 20_000,
  },
});
