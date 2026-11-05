# Firebase Hosting prep (stub)

Local-first Phaser build deploys as a static Vite `dist/` site.

## One-time

1. `npm i -g firebase-tools` (or `npx firebase-tools`)
2. `firebase login`
3. Create a Firebase project and set `.firebaserc` `projects.default`
4. Do **not** enable Auth/Firestore/Functions yet unless product asks — this stub is Hosting only

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` serves `dist/` with SPA rewrite to `index.html` and long-cache hashed assets.
