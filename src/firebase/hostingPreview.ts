/**
 * Firebase Hosting preview channel stubs — client-side constants only.
 * Local Vite (`npm run dev`) stays the primary SP path.
 */
import { flags } from '../config/flags';

/** Matches `hosting/preview-channel.stub.json` + `.firebaserc` target. */
export const HOSTING_PREVIEW = {
  siteTarget: 'kane-web',
  channelId: 'kane-preview',
  expires: '7d',
  /** CLI shape — run via npm script, not from the game loop. */
  deployCommand:
    'firebase hosting:channel:deploy kane-preview --expires 7d --only kane-web',
} as const;

export function hostingPreviewLabel(): string {
  if (!flags.hostingPreviewConfig) {
    return 'hosting-preview=off (local Vite primary)';
  }
  return `hosting-preview stub · channel=${HOSTING_PREVIEW.channelId} · target=${HOSTING_PREVIEW.siteTarget}`;
}
