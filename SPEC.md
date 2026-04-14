# karaoke-store bundle spec

Contract between the **karaoke-mode skill** (which writes bundles) and the
**karaoke-enabler extension** (which restores them). Do not drift — the
extension only restores what this spec says.

## Repo layout

```
karaoke-store/
├── index.json                  # registry of saved videos
├── SPEC.md                     # this file
├── README.md
└── <videoId>/                  # one directory per saved video
    ├── manifest.json           # REQUIRED
    ├── setlist.json            # REQUIRED (even single-song = 1-element array)
    ├── overlay.js              # REQUIRED
    ├── parsed_lyrics.json      # optional — omit if no synced-LRC songs
    ├── translations.json       # optional — omit if no JP lyrics to translate
    └── plain_lyrics.json       # optional — omit if every song has an lrcId
```

Single-song streams are multi-song streams with `setlist.length === 1`. There is
no separate "single-song" schema.

**Optional files are treated as `{}` / no-op when absent.** An English-only
stream might ship no `translations.json`. A pure utawaku with every song in
LRCLib might ship no `plain_lyrics.json`. A purely-sung-but-unindexed stream
might ship no `parsed_lyrics.json`. The bootstrap must 404-tolerate all three.
Always write every optional file you have data for — don't leave partial data
on disk.

## index.json

```json
{
  "version": 1,
  "videos": {
    "<videoId>": { "title": "...", "artist": "...", "savedAt": "YYYY-MM-DD" }
  }
}
```

## manifest.json (v2)

```json
{
  "bundleVersion": 2,
  "videoId": "VPYShqU_zWo",
  "title": "<YouTube title>",
  "channel": "<channel name>",
  "duration": 13935,
  "savedAt": "YYYY-MM-DD",
  "skeletonVersion": 1
}
```

- `bundleVersion` — **always 2** for new bundles. Absent or 1 = legacy layout.
- `skeletonVersion` — bumped when `skeleton.js` breaks compat (renamed state
  fields, renamed DOM IDs the tick writes to, etc.). Extension does not need
  to interpret this today — just carries it forward.
- Top-level per-song fields (`songName`, `originalTitle`, `nameEn`, `artist`,
  `lrcId`, `lang`) are NOT part of v2 — those live in `setlist.json`.

## setlist.json

JSON array of song objects. Each song shape is defined in the karaoke-mode
skill's "Setlist data shape" section. All fields there are bundle-stable.

```json
[
  { "idx": 1, "t": "8:28", "s": 508, "end": 892, "name": "...",
    "originalTitle": "...", "nameEn": "...", "artist": "...",
    "lang": "ja", "dur": 243, "lrcId": 11712559, "year": 1986 }
]
```

- `year` is optional (used by stream-specific overlays for decade ribbons, etc.)
- `lrcId: null` signals a song whose lyrics live in `plain_lyrics.json`
  (keyed by the song's `idx`).

## parsed_lyrics.json

```json
{
  "<lrcId>": [
    { "t": 14.26, "text": "<lyric line as UTF-8>" },
    ...
  ]
}
```

Keyed by LRCLib numeric id (string). Loaded straight into `window.__parsedLyrics`.

## translations.json (v2)

**Always nested by lrcId**, even for single-song bundles:

```json
{
  "<lrcId>": {
    "<timestamp>": {
      "en": "natural English line",
      "align": {
        "jp":    [["chunk", 0], ...],
        "gloss": [["morpheme", 0, "gloss"], ...],
        "en":    [["segment", 0], ...]
      }
    }
  }
}
```

- `<timestamp>` matches the line's `t` formatted as `t.toFixed(2)` (`"14.26"`).
- Values may be strings (`"en line"`) OR objects with `{en, align}`.
- Passed directly to `window.__mergeTranslations(trans)` — no wrapping.

For single-song bundles, the top level has one key = the song's lrcId.

## plain_lyrics.json (optional)

```json
{
  "<song.idx>": {
    "jp": ["line 1", "line 2", "", "line 3", ...],
    "en": ["line 1 en", "line 2 en", "", "line 3 en", ...]
  }
}
```

- Keys are the setlist entry's 1-based `idx` (as string).
- `jp` and `en` arrays MUST be parallel and blank-line-aligned. Empty string
  `""` at matching indices signals verse breaks.
- Merged into `window.__plainLyrics` by number-casting the key.
- If the file doesn't exist, extension treats it as `{}` — not an error.

## overlay.js

Self-contained IIFE. When injected it reads `window.__setlist`,
`window.__parsedLyrics`, `window.__plainLyrics`, `window.__wordAlign`,
`window.__transCache`, and defines:

- `window.__mergeTranslations(obj)` — takes a v2-shape translations object
- `window.__karaokeRebuild()` — forces the tick to re-evaluate

Generated from `C:\Users\Jerry\Desktop\tools\karaoke-assets\skeleton.js` plus
stream-specific customization. Each bundle ships its own overlay.js.

## Bootstrap order (extension)

1. Fetch `manifest.json`, `setlist.json`, `parsed_lyrics.json`,
   `translations.json`, `overlay.js` in parallel. Fetch `plain_lyrics.json`
   tolerantly (404 ⇒ `{}`).
2. Set `window.__setlist = setlist`, `Object.assign(window.__parsedLyrics, parsed)`.
3. Inject `overlay.js` via Trusted Types.
4. Wait a tick for the IIFE to register `__mergeTranslations`.
5. Call `window.__mergeTranslations(trans)` (v2 shape is passed through as-is).
   Legacy v1 bundles (no bundleVersion, or bundleVersion=1): wrap trans under
   `manifest.lrcId` before calling.
6. For each key in plain_lyrics.json, set `window.__plainLyrics[Number(k)] = v`.
7. Call `window.__karaokeRebuild()`.

## Version history

- **v2** (2026-04-14) — Unified single/multi-song. `translations.json` always
  lrcId-nested. `plain_lyrics.json` added as optional file. Per-song fields
  removed from manifest. Extension bootstrap updated.
- **v1** (legacy) — Single-song only. `translations.json` was timestamp-keyed.
  `manifest.json` carried per-song fields. No `plain_lyrics.json`. Extension
  wrapped trans under `manifest.lrcId` at bootstrap.
