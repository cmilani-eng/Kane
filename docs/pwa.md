# PWA stubs (Add to Home Screen)

Soft-launch posture: **manifest + icons only**. No offline service worker yet.

## Shipped

| Piece | Path |
|-------|------|
| Web app manifest | `public/manifest.webmanifest` |
| PNG icons (192 / 512 / apple-touch) | `public/icons/` |
| SVG mark | `public/icons/icon.svg` |
| HTML link tags | `index.html` |

Vite copies `public/` to `dist/` as-is. `base: './'` keeps relative icon URLs working on Hosting preview channels.

## Not yet

- Service worker / offline cache
- Install prompt UX
- Maskable art pass (512 stub is a stand-in)

Flip these later without changing gameplay.
