# Path contract

`games/games.json` lists the games. This file is the rule for where each URL and folder lives. The registry test fails if Kane's page, the old-link forward, or the installed-app manifest drifts from it.

Kane's match code stays in `src/`. A move under `games/kane/` waits until a second TypeScript game needs its own client. Gameplay still does not import presentation.

## URLs

| URL | What it serves |
|-----|----------------|
| `/` | The picker, `games/index.html`. A hash here is forwarded to `/kane/` with the same search and hash, so an old link such as `/#admin` still opens Kane. |
| `/kane/` | Kane. `games/kane/index.html` loads `games/kane/main.ts`, and that entry imports the client in `src/`. The page must not point the browser at `/src/main.ts`. This is the canonical play URL, including for the soft-launch checklist. |
| `/blob-evolution/` | Blob Evolution 3D, copied as-is. Experimental. |
| Installed app | `public/manifest.webmanifest` keeps `id` `/` and `scope` `./`, and starts at `./kane/`. An existing install stays the same app and opens Kane. |

`/kane` without a slash redirects to `/kane/`. Hosting rewrites for each game sit above the `**` catch-all, which serves the picker.

## Folders

| Folder | Owns |
|--------|------|
| `src/` | The Kane client: gameplay, presentation, and data. |
| `games/kane/main.ts` | Kane's Vite entry, inside the Vite root. |
| `games/<id>/` | The page served at `/<id>/`. |
| `games/games.json` | The list. Hub cards, Vite inputs for `build: "vite"` games, and the registry test read it. |
| `public/` | Shared icons, the manifest, Privacy, and Terms. |
| Repo-root env files | Vite `envDir`. Do not put env files inside a game folder. |
| `dist/` | Build output, at the repo root. |

Vite's project root is `games/`. `publicDir` is `public/`, and `outDir` is `dist/`.

## Adding a game

1. Create `games/<id>/index.html`.
2. Add a row to `games/games.json` (`id`, `title`, `tagline`, `description`, `build`, `status`).
3. Add a `/<id>/**` rewrite in `firebase.json` above the `**` catch-all.

`vite` games are bundled. `static` games are copied to `dist/<id>/` untouched.
