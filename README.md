# karaoke-store

Saved karaoke-mode overlay bundles for YouTube videos. Each bundle is a self-contained set of files under `<videoId>/` that can be fetched from raw.githubusercontent.com and injected into a YouTube tab to restore the exact karaoke overlay built in-session.

## Bundle layout

```
<videoId>/
  manifest.json       - video metadata (title, artist, duration, lrcId, skeletonVersion)
  setlist.json        - window.__setlist (song entries, one per track)
  parsed_lyrics.json  - window.__parsedLyrics (LRC lines keyed by lrcId, with .en baked in)
  translations.json   - {lrcId: {timestamp: {en, align: {jp, gloss, en}}}}
  overlay.js          - the themed overlay (per-stream custom CSS/HTML/animations)
```

`index.json` at the repo root lists all saved videoIds for O(1) lookup.

## Reload flow (used by the companion Chrome extension)

1. Parse `videoId` from the YouTube URL
2. Fetch `index.json` — if `videoId` not listed, do nothing
3. Fetch the 5 files under `<videoId>/`
4. Set `window.__setlist`, merge into `window.__parsedLyrics`
5. Inject `overlay.js` via Trusted Types (YouTube CSP requires `trustedTypes.createPolicy`)
6. Call `window.__mergeTranslations({<lrcId>: translations.json})` to attach color-alignment + gloss
