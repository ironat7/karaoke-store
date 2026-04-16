# karaoke-store bundle spec

Contract between the **karaoke-mode skill** (which writes bundles) and the
**karaoke-enabler extension** (which restores them). This file is authoritative:
if the extension does something that isn't documented here, fix the extension.

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
    ├── parsed_lyrics.json      # optional — omit if no song has an lrcId
    ├── translations.json       # optional — omit if no JP lyrics to translate
    └── plain_lyrics.json       # optional — omit if every song has an lrcId
```

Single-song bundles are structurally compatible: `setlist.length === 1`, same
file layout. The only bundle-level signal distinguishing them from streams is
the optional `flavor` field in `manifest.json` (see below), which is
informational only — the extension's bootstrap behaves identically for both.

**Optional files are treated as `{}` / no-op when absent.** An English-only
stream might ship no `translations.json`. A pure utawaku with every song in
LRCLib might ship no `plain_lyrics.json`. A purely-sung-but-unindexed stream
might ship no `parsed_lyrics.json`. The bootstrap 404-tolerates all three.

## index.json

```json
{
  "videos": {
    "<videoId>": { "title": "...", "artist": "...", "savedAt": "YYYY-MM-DD" }
  }
}
```

Used by the extension to badge the browser action when a saved video is open.
Nothing more.

## manifest.json

```json
{
  "videoId": "VPYShqU_zWo",
  "title": "<YouTube title>",
  "channel": "<channel name>",
  "duration": 13935,
  "savedAt": "YYYY-MM-DD",
  "flavor": "stream"
}
```

All per-song fields (`songName`, `originalTitle`, `nameEn`, `artist`, `lrcId`,
`lang`) live in `setlist.json` — never here, not even for single-song bundles.

`flavor` is **optional** and purely informational (default: `"stream"` if
absent). Valid values: `"stream"` or `"single"`. The extension ignores it —
both flavors use the same bootstrap path. Its purpose is to tell future
rebuilds which skeleton (`skeleton.js` vs `skeleton-single.js`) to regenerate
the bundle's `overlay.js` from. Single-song bundles SHOULD set it; omitting
it on a single-song bundle is a documentation gap, not a runtime bug.

**Deprecated fields.** Older bundles may carry a `skeletonVersion: 1` field;
nothing reads it (the extension never checked it, neither skeleton branches
on it). Leave existing ones alone or scrub them — either is fine. Do not
emit it in new manifests.

## setlist.json

JSON array of song objects. Shape defined in the karaoke-mode skill's
"Setlist data shape" section. All fields there are bundle-stable.

```json
[
  { "idx": 1, "t": "8:28", "s": 508, "end": 892, "name": "...",
    "originalTitle": "...", "nameEn": "...", "artist": "...",
    "lang": "ja", "dur": 243, "lrcId": 11712559, "year": 1986 }
]
```

- `year`, `nameEn` are optional (used by stream-specific overlays).
- `lrcId: null` signals a song whose lyrics live in `plain_lyrics.json`
  (keyed by the song's `idx`).

## parsed_lyrics.json

```json
{
  "<lrcId>": [
    { "t": 14.26, "text": "<lyric line>" },
    ...
  ]
}
```

Keyed by LRCLib numeric id (string). Loaded straight into `window.__parsedLyrics`.

## translations.json

**Always nested by lrcId** — even for single-song bundles:

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
- Values may be strings (`"en line"`) or objects with `{en, align}`.
- Passed directly to `window.__mergeTranslations(trans)` — no wrapping by the
  extension.

## plain_lyrics.json

```json
{
  "<song.idx>": {
    "jp": ["line 1", "line 2", "", "line 3", ...],
    "en": ["line 1 en", "line 2 en", "", "line 3 en", ...]
  }
}
```

- Keys are the setlist entry's 1-based `idx` (stringified).
- `jp` and `en` arrays MUST be parallel and blank-line-aligned. Empty string
  `""` at matching indices signals verse breaks.
- Merged into `window.__plainLyrics[Number(idx)]` by the extension.

## overlay.js

Self-contained IIFE. Generated from
`C:\Users\Jerry\Desktop\Tools\karaoke-assets\skeleton.js` plus stream-specific
customization. Each bundle ships its own copy — do not share.

When injected it reads `window.__setlist`, `window.__parsedLyrics`,
`window.__plainLyrics`, `window.__wordAlign`, `window.__transCache`, and
defines:

- `window.__mergeTranslations(obj)` — merges a translations.json shape
- `window.__karaokeRebuild()` — forces the tick to re-evaluate

## Bootstrap order (extension)

1. Fetch `manifest.json`, `setlist.json`, `overlay.js` (required). Fetch
   `parsed_lyrics.json`, `translations.json`, `plain_lyrics.json` tolerantly
   (404 ⇒ skip).
2. Read persisted offsets from `chrome.storage.sync` key `offsets_<videoId>`,
   seed `window.__lyricOffsets` BEFORE injecting overlay.
3. Set `window.__setlist = setlist` and `Object.assign(window.__parsedLyrics, parsed)`.
4. Inject `overlay.js` via Trusted Types.
5. Wait one tick for the IIFE to register `__mergeTranslations`.
6. If `translations.json` present: `window.__mergeTranslations(trans)`.
7. If `plain_lyrics.json` present: for each key, set
   `window.__plainLyrics[Number(k)] = v`.
8. Call `window.__karaokeRebuild()`.

## Offset persistence

The overlay's `[` / `]` / `\` key handler nudges `window.__lyricOffsets[lrcId]`
in-page, then broadcasts via `window.postMessage`:

```js
window.postMessage({
  __ko: true, type: 'offset',
  videoId: '<id>', lrcId: <num>, offset: <seconds | null>
}, location.origin);
```

The extension's content script (isolated world) listens for these and writes
to `chrome.storage.sync` under key `offsets_<videoId>` with shape
`{ [lrcId]: <seconds> }`. Offsets of `0` / `null` are deleted from storage.

On next bundle load, the bootstrap reads that key and seeds
`window.__lyricOffsets` before the overlay's IIFE runs. The IIFE preserves
existing values via `window.__lyricOffsets || {}`, so the seed survives.

`skeleton.js` emits the broadcast inside the key handler — every new bundle
generated from the current skeleton has it for free. Older bundles missing
the broadcast can be hot-patched in place (5-line addition after the
`__lyricOffsets` write).
