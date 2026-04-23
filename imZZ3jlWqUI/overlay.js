// ============================================================================
// KARAOKE OVERLAY — 東京真中「ドゥーマー」feat. 重音テト / KAF cover
// ----------------------------------------------------------------------------
// Aesthetic: the MV is a single static illustration of KAF's character lying
// supine on a heap of dead consumer electronics — CRT monitors, camcorders,
// trash bags, debris — near-grayscale save for her muted rose hoodie, a
// sharp pink lollipop, and the MV's one burned-in graphic: a bright-pink
// 8-bit pixel-block vertical "ドゥーマー" title crashing down the right
// edge. The overlay IS one of the dead CRTs from that pile, flickered back
// to life to broadcast the lyrics. Bezel is matte charcoal plastic; screen
// is phosphor-green-black with scanlines; title tag echoes the MV's pink
// pixel title; HUD chrome reads as a dying security-cam overlay.
//
// Signature — "Signal Loss". Every decay effect rides --ko-ripe (0→1 across
// the song): scanline opacity (0.30 → 0.60 + 0.18 → 0.36 sub-scan), chromatic
// aberration on JP/EN text (0 → 2px pink/cyan RGB split), static noise layer
// opacity (0.06 → 0.20), GG-heart fill (hot pink → dark maroon via color-mix
// with glow decay 6px → 0px), phosphor glow dim. GG bar drains right-to-left
// via (1 - --ko-progress) — literalizing the song's "イージーゲーム GGです"
// lyric. By the final chorus, the CRT is visibly dying: the doomer is
// slowly giving up, the screen is losing signal, they're the same thing.
//
// Line changes are deliberately motionless. The CRT is continuously alive
// via the rolling scan band (CSS animation, no JS) and the --ko-ripe decay;
// nothing teleports when a new lyric arrives.
//
// ----------------------------------------------------------------------------
// LOCKED — correctness-load-bearing. Don't rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; YouTube CSP requires it)
//   • window.__koGen + MY_GEN closure capture for loop termination
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild,
//     __mergeTranslations (extension contract — bootstrap calls them by name)
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby)
//   • positionTick posKey cache (without it: style.left/top writes cascade
//     through YouTube's 50K-node DOM every 250ms, tab gets hot)
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • DOM order: JP line BEFORE EN line (a11y reading order). Flip VISUAL
//     order with flex order / grid — don't touch the DOM.
//   • Hard DOM contract: #ko-line-jp and #ko-line-en must exist inside
//     #ko-lyrics > .ko-slot. (They live in .ko-slot > .ko-screen here —
//     still descendants of .ko-slot, which is what the contract requires.)
//   • Offset hotkeys [ ] \ + window.postMessage broadcast (extension persists
//     tuned offsets via this channel)
//
// ----------------------------------------------------------------------------
// GOTCHAS (see SKILL.md "Technical gotchas" for the full set):
//
//   • Use __karaokePolicy.createHTML() for all innerHTML writes (CSP)
//   • Use <link rel="stylesheet"> for fonts, NOT @import (CSP)
//   • CSS vars declared only on #karaoke-root don't cascade to #ko-lyrics
//     (it's a body sibling, not a descendant) — declare on BOTH selectors
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — Doomer CRT palette
  // ==========================================================================
  // The MV is a single static illustration of KAF's character lying supine on
  // a heap of dead consumer electronics — CRTs, camcorders, trash bags, debris
  // — near-grayscale save for her muted rose hoodie, a sharp pink lollipop,
  // and the MV's one burned-in graphic: a bright-pink 8-bit pixel-block
  // vertical "ドゥーマー" title crashing down the right edge. The overlay IS
  // one of the dead CRTs from that pile, flickered back to life to broadcast
  // the lyrics. Bezel is charcoal plastic; screen is phosphor-green-black
  // with scanlines; title tag is the same pink pixel treatment as the MV's
  // burned-in title; HUD accents are "REC ●" / "CH.404" in Press Start 2P
  // to read as a dying security-cam overlay.
  const THEME = {
    trackTag:   'ドゥーマー',
    artistTag:  'TOKYO MANAKA × KAF',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=DotGothic16&' +
      'family=VT323&' +
      'family=Press+Start+2P&' +
      'display=swap',
    fontJP:       '"DotGothic16", "Noto Sans JP", sans-serif',
    fontJPHeavy:  '"Press Start 2P", "DotGothic16", sans-serif',
    fontEN:       '"VT323", ui-monospace, monospace',
    fontGloss:    '"VT323", ui-monospace, monospace',

    // CRT chassis: matte charcoal with a tiny green tint — old-plastic feel.
    // Screen: deep bottle-green black — P1-phosphor-at-rest. When the tube
    // actually lights, phosphor glow is #7BFFB0 (canonical green CRT).
    bezel:        '#161617',  // matte CRT chassis — near-black charcoal
    bezelHi:      '#2A2A2C',  // bezel highlight edge (simulated top-lit)
    bezelLo:      '#0A0A0B',  // bezel deep shadow (bottom edge)
    screenDeep:   '#060E0A',  // off-screen black (deepest)
    screenGlow:   '#0C1C14',  // lit screen body (phosphor idle)
    phosphor:     '#7BFFB0',  // CRT P1-phosphor lit green — main EN glow
    phosphorDim:  '#3F7F58',  // dimmed phosphor — gloss label tint

    // MV-sourced pinks — load-bearing accent, pulled from the ドゥーマー
    // burned-in title's exact pink saturation.
    pinkHot:      '#FF3DA1',
    pinkDeep:     '#C7085F',
    pinkPale:     '#FFA8D2',
    pinkBleed:    '#FF69B4',  // chromatic-aberration left split

    // Cyan/amber accents (minor)
    cyanBleed:    '#4BE0E6',  // chromatic-aberration right split
    amber:        '#FFB340',  // REC dot, warning text, tiny graffiti bleeds
    amberDim:     '#6E4610',  // REC dot dimmed

    cream:        '#F1ECDE',  // rare — natural-EN subtitle halo / sparkles

    // Typography
    lyricFontSizeJP:      '52px',
    lyricLineHeightJP:    '2.0',
    lyricLetterSpacingJP: '0.06em',
    lyricFontSizeEN:      '32px',
    lyricLineHeightEN:    '1.2',
    lyricLetterSpacingEN: '0.03em',
    glossFontSize:        '22px',
    glossFontWeight:      '400',

    // Card shape — CRT bezel, no tilt (monitor sits flat on its junk pile).
    cardRadius:  '18px',
    cardPadding: '0',  // padding handled by bezel layout zones

    // chunkColors: 6 slots. All light-on-dark legible on the phosphor-black
    // screen. Drawn from the MV: hot pink (title), phosphor green (CRT),
    // amber (graffiti bleed), cyan (color fringe), pale orchid (muted purple
    // splashes on the trash), cream-white (star sparkles / floating triangles).
    chunkColors: [
      '#FF3DA1',  // 0 — hot pink (primary / doomer voice / title-colored verbs)
      '#7BFFB0',  // 1 — phosphor green (CRT-native / refrain hooks)
      '#FFB340',  // 2 — amber (warning / the "normie"/"loser" callouts)
      '#8DD9FF',  // 3 — cyan (dream / drift imagery — 夢 / ぷかぷか)
      '#E48FD9',  // 4 — pale orchid (muted-purple MV bleeds / nuance)
      '#F1ECDE',  // 5 — cream-white (emphasis / sparkles / hard stops)
    ],
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation (survives re-injection) ---
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  window.__wordAlign = window.__wordAlign || {
    colors: THEME.chunkColors.slice(),
    data: {}
  };
  window.__wordAlign.colors = THEME.chunkColors.slice();
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // Position — CRT sits low on the video, where the MV's trash/e-waste pile
  // fills the bottom band. Drops it right into the junk pile visually.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.80, widthFrac: 0.64 },
    window.__koPosition || {}
  );

  // --- Generation counter + runtime knobs ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;
  window.__koMaxHold = window.__koMaxHold || 10;

  // --- Clean up any prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> (CSP blocks @import inside <style>) ---
  if (THEME.fontsHref && !document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // ==========================================================================
  // CSS
  // ==========================================================================
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    /* ==== LOCKED PLUMBING ===================================================*/
    #karaoke-root {
      position: fixed; inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      z-index: 2147483100;
      text-align: center;
      transform: translate(-50%, -50%);
    }
    /* CSS vars declared on BOTH #karaoke-root AND #ko-lyrics — #ko-lyrics
       is a body sibling of #karaoke-root, not a descendant, so vars on
       #karaoke-root alone wouldn't cascade to it. */
    #karaoke-root, #ko-lyrics {
      --ko-bezel:       ${THEME.bezel};
      --ko-bezel-hi:    ${THEME.bezelHi};
      --ko-bezel-lo:    ${THEME.bezelLo};
      --ko-screen-deep: ${THEME.screenDeep};
      --ko-screen-glow: ${THEME.screenGlow};
      --ko-phosphor:    ${THEME.phosphor};
      --ko-phosphor-dm: ${THEME.phosphorDim};
      --ko-pink:        ${THEME.pinkHot};
      --ko-pink-deep:   ${THEME.pinkDeep};
      --ko-pink-pale:   ${THEME.pinkPale};
      --ko-pink-bleed:  ${THEME.pinkBleed};
      --ko-cyan-bleed:  ${THEME.cyanBleed};
      --ko-amber:       ${THEME.amber};
      --ko-amber-dim:   ${THEME.amberDim};
      --ko-cream:       ${THEME.cream};

      --ko-font-jp:    ${THEME.fontJP};
      --ko-font-jp-hv: ${THEME.fontJPHeavy};
      --ko-font-en:    ${THEME.fontEN};
      --ko-font-gloss: ${THEME.fontGloss};

      /* Runtime vars written by the main tick ~7×/sec. CSS uses them
         inside calc() and color-mix() to drive the "signal loss" decay
         and GG-bar drain without per-frame JS DOM writes. */
      --ko-ripe:     0;  /* 0→1 ripening proxy: drives scanline intensity,
                            chromatic aberration, noise opacity, heart decay */
      --ko-progress: 0;  /* 0→1 song elapsed fraction — drives GG bar drain */
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== DOOMER CRT — everything below ==================================

       The card is a broken CRT monitor rescued from the MV's e-waste pile.
       .ko-slot is the chassis bezel (charcoal plastic, chunky top/bottom
       bezel, raised-plastic highlights). Inside, .ko-screen is the phosphor
       tube with scanlines, a rolling sync band, and the lyrics. HUD chrome
       sits in the top/bottom bezel zones (CH.404 + REC indicator, GG bar +
       pink heart). All decay effects ride --ko-ripe (0→1 across the song):
       scanline opacity, chromatic aberration on text, noise opacity, heart
       fade. GG bar drains via --ko-progress.

       No line-change motion. The CRT is continuously alive via the rolling
       scan band and slowly dying via --ko-ripe; nothing teleports when a
       new lyric arrives. */

    /* ==== CHASSIS — matte plastic bezel =================================== */
    #ko-lyrics .ko-slot {
      position: relative;
      display: block;
      padding: 0;
      /* Two-layer chassis: subtle top-to-bottom gradient (cool lighting from
         above, typical of CRT photos) over the base bezel color. A fine
         grain noise sits on top at low alpha so the plastic has texture
         but nothing in the lyric zone shivers. */
      background:
        linear-gradient(
          180deg,
          var(--ko-bezel-hi) 0%,
          var(--ko-bezel) 22%,
          var(--ko-bezel) 78%,
          var(--ko-bezel-lo) 100%
        );
      border-radius: ${THEME.cardRadius};
      /* Bezel outer shadow — sits in the trash pile, so a soft dark drop
         reads "this has weight". Inner highlights suggest raised plastic
         edges that catch the phosphor glow from the screen inside. */
      box-shadow:
        0 2px 0 rgba(255, 255, 255, 0.06) inset,
        0 -2px 0 rgba(0, 0, 0, 0.45) inset,
        0 0 0 1px rgba(0, 0, 0, 0.6),
        0 22px 44px -14px rgba(0, 0, 0, 0.75),
        0 6px 14px -4px rgba(0, 0, 0, 0.45);
      isolation: isolate;
      overflow: visible;
    }
    /* Empty-state: CRT "dims" during instrumental gaps (not collapse —
       a dying set stays on, it just idles). Phosphor glow retreats. */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) .ko-screen {
      filter: brightness(0.55);
    }

    /* ==== CRT SCREEN — inner phosphor tube ================================
       The tube. Radial gradient gives a faint center-brightest / edge-dim
       curve (the phosphor's vignette). inset box-shadow on the screen
       edges simulates the tube's inward curvature (dark corner meniscus).
       The scanline overlay is ::before; the rolling-sync band is ::after.
       overflow: hidden on screen clips both effects to the tube. */
    #ko-lyrics .ko-screen {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      margin: 46px 22px 58px;
      padding: 26px 40px 32px;
      min-height: 150px;
      border-radius: 10px;
      background:
        radial-gradient(
          ellipse at 50% 45%,
          var(--ko-screen-glow) 0%,
          var(--ko-screen-deep) 82%
        );
      box-shadow:
        inset 0 0 0 1px rgba(0, 0, 0, 0.85),
        inset 0 0 22px 4px rgba(0, 0, 0, 0.75),
        inset 0 2px 1px rgba(0, 0, 0, 0.9),
        inset 0 0 90px 10px color-mix(in oklab, var(--ko-screen-deep), var(--ko-phosphor) 8%);
      overflow: hidden;
    }
    /* Scanlines — horizontal rhythm at 3px, intensity rises with --ko-ripe.
       A second sparser layer (every 9px, stronger) gives the characteristic
       CRT "big scan" + "sub-scan" double rhythm. */
    #ko-lyrics .ko-screen::before {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        repeating-linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0px,
          rgba(0, 0, 0, 0) 2px,
          rgba(0, 0, 0, calc(0.30 + var(--ko-ripe) * 0.30)) 2px,
          rgba(0, 0, 0, calc(0.30 + var(--ko-ripe) * 0.30)) 3px
        ),
        repeating-linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0px,
          rgba(0, 0, 0, 0) 8px,
          rgba(0, 0, 0, calc(0.10 + var(--ko-ripe) * 0.18)) 8px,
          rgba(0, 0, 0, calc(0.10 + var(--ko-ripe) * 0.18)) 9px
        );
      mix-blend-mode: multiply;
      z-index: 3;
    }
    /* Rolling sync band — a brighter scanline that slowly translates
       top→bottom, giving the CRT continuous "alive" motion independent
       of lyric changes. CSS-only, no JS tick needed. Thin (10px) and
       low-alpha (green-tint) so it reads as a horizontal brightening
       sweep rather than a bar. */
    #ko-lyrics .ko-screen::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      height: 10px;
      pointer-events: none;
      background: linear-gradient(
        to bottom,
        rgba(123, 255, 176, 0) 0%,
        rgba(123, 255, 176, 0.16) 50%,
        rgba(123, 255, 176, 0) 100%
      );
      animation: ko-scan-roll 7.5s linear infinite;
      z-index: 4;
    }
    /* translateY is relative to the band's own height (10px), so use a
       pixel value large enough to cross the screen at any reasonable
       lyric-zone size. Screen ~150-220px tall at common video widths;
       300px ensures the band fully exits before the animation restarts. */
    @keyframes ko-scan-roll {
      0%   { transform: translateY(-18px); }
      100% { transform: translateY(300px); }
    }

    /* Phosphor glow layer under the text — the screen's "lit" halo. This
       is on the screen, not the lyrics themselves; gives the whole text
       zone a subtle green cast that intensifies at the center. */
    #ko-lyrics .ko-screen-glow {
      position: absolute;
      inset: 10%;
      pointer-events: none;
      background: radial-gradient(
        ellipse at 50% 50%,
        rgba(123, 255, 176, 0.09) 0%,
        rgba(123, 255, 176, 0) 70%
      );
      z-index: 1;
    }

    /* Static noise — a tiny CSS-only grain that builds with --ko-ripe.
       Uses radial-gradient stamps at offset positions (cheap, no SVG
       filter needed). Barely visible early; a faint hiss by the end. */
    #ko-lyrics .ko-screen-noise {
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: calc(0.06 + var(--ko-ripe) * 0.14);
      background:
        radial-gradient(ellipse 1px 1px at 13% 22%, rgba(123,255,176,0.6), transparent 60%),
        radial-gradient(ellipse 1px 1px at 78% 9%, rgba(255,255,255,0.45), transparent 60%),
        radial-gradient(ellipse 1px 1px at 31% 68%, rgba(123,255,176,0.55), transparent 60%),
        radial-gradient(ellipse 1px 1px at 62% 81%, rgba(255,255,255,0.35), transparent 60%),
        radial-gradient(ellipse 1px 1px at 47% 48%, rgba(123,255,176,0.5), transparent 60%),
        radial-gradient(ellipse 1px 1px at 90% 55%, rgba(255,255,255,0.4), transparent 60%),
        radial-gradient(ellipse 1px 1px at 8%  77%, rgba(123,255,176,0.5), transparent 60%),
        radial-gradient(ellipse 1px 1px at 24% 34%, rgba(255,255,255,0.35), transparent 60%),
        radial-gradient(ellipse 1px 1px at 69% 40%, rgba(123,255,176,0.55), transparent 60%),
        radial-gradient(ellipse 1px 1px at 55% 18%, rgba(255,255,255,0.35), transparent 60%);
      z-index: 2;
    }

    /* ==== TOP HUD — security-cam chrome (right side) ======================
       Title tag sits top-LEFT of the bezel (sticker-label placement); HUD
       chrome lives only on the right to avoid collision. Reads as a
       dying-camera overlay: channel ID + timecode + amber REC dot. */
    #ko-lyrics .ko-hud-top {
      position: absolute;
      top: 14px;
      right: 30px;
      height: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
      pointer-events: none;
      z-index: 6;
      font-family: ${THEME.fontJPHeavy};
      font-size: 8px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    #ko-lyrics .ko-hud-channel {
      color: var(--ko-pink);
      text-shadow:
        0 0 6px color-mix(in oklab, var(--ko-pink), transparent 55%),
        0 0 1px var(--ko-pink-deep);
    }
    #ko-lyrics .ko-hud-channel .sep {
      color: var(--ko-pink-deep);
      margin: 0 5px;
    }
    #ko-lyrics .ko-hud-rec {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ko-amber);
      text-shadow: 0 0 4px color-mix(in oklab, var(--ko-amber), transparent 60%);
    }
    #ko-lyrics .ko-hud-rec-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--ko-amber);
      box-shadow: 0 0 6px var(--ko-amber), 0 0 12px color-mix(in oklab, var(--ko-amber), transparent 60%);
      animation: ko-rec-blink 1.6s ease-in-out infinite;
    }
    @keyframes ko-rec-blink {
      0%, 55% { opacity: 1; }
      60%, 100% { opacity: 0.25; }
    }

    /* ==== BOTTOM HUD — GG drain bar + decay heart =========================
       The song's "イージーゲーム　GGです" (Easy game, GG) literalized as a
       draining pixel bar. Starts 100%, ends 0%. Pink fill with a vertical
       stripe pattern so it reads as chunky cells, not a smooth gradient.
       On the right, a pink heart-glyph that loses its glow + color-mixes
       toward deep maroon as --ko-ripe climbs. */
    #ko-lyrics .ko-hud-bottom {
      position: absolute;
      bottom: 16px; left: 30px; right: 30px;
      height: 28px;
      display: flex;
      align-items: center;
      gap: 12px;
      pointer-events: none;
      z-index: 6;
    }
    #ko-lyrics .ko-gg-label {
      font-family: ${THEME.fontJPHeavy};
      font-size: 11px;
      letter-spacing: 0.20em;
      color: var(--ko-pink);
      text-shadow:
        0 0 5px color-mix(in oklab, var(--ko-pink), transparent 55%);
      min-width: 26px;
    }
    #ko-lyrics .ko-gg-track {
      flex: 1;
      height: 14px;
      position: relative;
      background: rgba(0, 0, 0, 0.65);
      border: 1px solid rgba(255, 61, 161, 0.35);
      box-shadow:
        inset 0 0 6px rgba(0, 0, 0, 0.8),
        inset 0 0 0 1px rgba(255, 255, 255, 0.04);
    }
    #ko-lyrics .ko-gg-fill {
      position: absolute;
      top: 0; bottom: 0; left: 0;
      /* Drain: starts 100%, ends 0% */
      width: calc((1 - var(--ko-progress)) * 100%);
      /* Pixel cells: pink base with vertical dark stripes every 7px -> stripey
         chunk look even though the width transitions smoothly. */
      background:
        repeating-linear-gradient(
          90deg,
          rgba(0,0,0,0) 0, rgba(0,0,0,0) 6px,
          rgba(0,0,0,0.35) 6px, rgba(0,0,0,0.35) 7px
        ),
        linear-gradient(
          180deg,
          var(--ko-pink-pale) 0%,
          var(--ko-pink) 35%,
          var(--ko-pink-deep) 100%
        );
      box-shadow:
        0 0 10px color-mix(in oklab, var(--ko-pink), transparent 50%),
        inset 0 1px 0 rgba(255, 255, 255, 0.35);
      transition: width 160ms linear;
    }
    /* A bright leading edge on the drain — pink spark at the right end
       of the fill, reads like the bar is being actively eaten. */
    #ko-lyrics .ko-gg-fill::after {
      content: '';
      position: absolute;
      right: -1px; top: -2px; bottom: -2px;
      width: 3px;
      background: var(--ko-pink-pale);
      box-shadow:
        0 0 6px var(--ko-pink),
        0 0 12px color-mix(in oklab, var(--ko-pink), transparent 40%);
    }
    /* Heart glyph — SVG pixel shape in .ko-gg-heart. Fill decays via
       color-mix driven by --ko-ripe. Glow drops to zero by song end. */
    #ko-lyrics .ko-gg-heart {
      width: 22px; height: 20px;
      display: block;
      pointer-events: none;
    }
    #ko-lyrics .ko-gg-heart-fill {
      fill: color-mix(in oklab, var(--ko-pink), #2A0814 calc(var(--ko-ripe) * 100%));
      filter: drop-shadow(
        0 0 calc((1 - var(--ko-ripe)) * 6px)
        color-mix(in oklab, var(--ko-pink), transparent calc(40% + var(--ko-ripe) * 55%))
      );
      transition: fill 2s linear, filter 2s linear;
    }
    /* A second heart underlay that shows the "empty pixel" state — used
       when the first heart fades fully out. The underlay pink shows only
       the heart outline at low alpha. */
    #ko-lyrics .ko-gg-heart-outline {
      fill: none;
      stroke: color-mix(in oklab, var(--ko-pink-deep), transparent 40%);
      stroke-width: 1;
    }

    /* ==== CORNER GLYPHS — pink pixel brackets INSIDE the screen ===========
       Pink pixel L-brackets at the four corners of the phosphor area,
       framing the lyric zone like a camera viewfinder's focus reticle.
       Reads as a sibling of the REC/CH.404 security-cam chrome, and
       echoes the MV's burned-in pink pixel title's same-language angles. */
    #ko-lyrics .ko-corner {
      position: absolute;
      width: 14px; height: 14px;
      pointer-events: none;
      z-index: 7;
    }
    #ko-lyrics .ko-corner svg { width: 100%; height: 100%; display: block; }
    #ko-lyrics .ko-corner .ko-corner-fill {
      fill: var(--ko-pink);
      filter: drop-shadow(0 0 3px color-mix(in oklab, var(--ko-pink), transparent 55%));
    }
    /* Screen spans: margin 46px top / 58px bottom / 22px sides. Bracket
       corners sit 8px inside the phosphor so they read as framing the
       lyrics, not pressing against the tube edge. */
    #ko-lyrics .ko-corner.tl { top: 54px;    left:  30px; }
    #ko-lyrics .ko-corner.tr { top: 54px;    right: 30px; transform: scaleX(-1); }
    #ko-lyrics .ko-corner.bl { bottom: 66px; left:  30px; transform: scaleY(-1); }
    #ko-lyrics .ko-corner.br { bottom: 66px; right: 30px; transform: scale(-1, -1); }

    /* ==== TITLE TAG — pink 8-bit pixel ドゥーマー =========================
       Placed on the top-left edge of the bezel. Reads as the CRT's
       station ID, but intentionally echoes the MV's own burned-in
       pink-pixel vertical title on the right edge of every frame. */
    #ko-lyrics .ko-tag {
      position: absolute;
      top: -14px;
      left: 30px;
      padding: 6px 12px 7px;
      background: var(--ko-bezel);
      color: var(--ko-pink);
      font-family: ${THEME.fontJPHeavy}, var(--ko-font-jp);
      font-size: 16px;
      letter-spacing: 0.18em;
      line-height: 1;
      border: 2px solid var(--ko-pink);
      border-radius: 0;  /* pixel aesthetic = crisp corners */
      box-shadow:
        0 0 0 2px var(--ko-bezel),
        0 0 12px color-mix(in oklab, var(--ko-pink), transparent 50%),
        0 3px 0 0 var(--ko-pink-deep);
      text-shadow:
        0 0 6px color-mix(in oklab, var(--ko-pink), transparent 45%),
        1px 0 0 var(--ko-pink-bleed),
        -1px 0 0 var(--ko-cyan-bleed);
      z-index: 8;
      white-space: nowrap;
    }
    /* ==== ARTIST CREDIT — bottom-right pixel plaque ======================= */
    #ko-lyrics .ko-credit {
      position: absolute;
      bottom: -13px;
      right: 28px;
      padding: 5px 10px 5px;
      background: var(--ko-bezel);
      color: var(--ko-phosphor);
      font-family: ${THEME.fontJPHeavy};
      font-size: 7px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      border: 1.5px solid var(--ko-phosphor-dm);
      box-shadow: 0 0 0 2px var(--ko-bezel);
      text-shadow: 0 0 4px color-mix(in oklab, var(--ko-phosphor), transparent 60%);
      z-index: 8;
    }

    /* ==== LYRICS — DotGothic16 JP, VT323 EN, both on phosphor ============= */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-phosphor);
      font-size: ${THEME.lyricFontSizeJP};
      line-height: ${THEME.lyricLineHeightJP};
      letter-spacing: ${THEME.lyricLetterSpacingJP};
      padding-top: 0.5em;
      min-height: 1em;
      position: relative;
      z-index: 5;
      order: 1;
      /* Chromatic aberration — RGB split that GROWS with --ko-ripe.
         Clean at song start; glitchy NTSC color fringe by the end.
         Text itself doesn't move; only the shadow layers separate. */
      text-shadow:
        calc(var(--ko-ripe) * 2px)  0 0 var(--ko-pink-bleed),
        calc(var(--ko-ripe) * -2px) 0 0 var(--ko-cyan-bleed),
        0 0 10px color-mix(in oklab, var(--ko-phosphor), transparent 40%),
        0 0 22px color-mix(in oklab, var(--ko-phosphor), transparent 70%);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — dimmed phosphor above each morpheme. VT323 keeps the
       CRT-terminal register consistent with the EN line below. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: ${THEME.glossFontSize};
      font-weight: ${THEME.glossFontWeight};
      letter-spacing: 0.04em;
      line-height: 1.0;
      padding-bottom: 4px;
      color: var(--ko-phosphor-dm);
      text-transform: lowercase;
      user-select: none;
      opacity: 0.95;
      text-shadow: 0 0 4px color-mix(in oklab, var(--ko-phosphor), transparent 75%);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — VT323 terminal font, cream-phosphor color. Smaller + less
       saturated than JP so the learner reads JP first, confirms with EN. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 400;
      color: color-mix(in oklab, var(--ko-cream), var(--ko-phosphor) 18%);
      font-size: ${THEME.lyricFontSizeEN};
      line-height: ${THEME.lyricLineHeightEN};
      letter-spacing: ${THEME.lyricLetterSpacingEN};
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 5;
      order: 2;
      padding-top: 2px;
      text-shadow:
        calc(var(--ko-ripe) * 1.5px)  0 0 color-mix(in oklab, var(--ko-pink-bleed), transparent 55%),
        calc(var(--ko-ripe) * -1.5px) 0 0 color-mix(in oklab, var(--ko-cyan-bleed), transparent 55%),
        0 0 8px color-mix(in oklab, var(--ko-phosphor), transparent 55%);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: calc(${THEME.lyricFontSizeEN} * 0.92);
      color: var(--ko-phosphor);
    }

  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  // Pink pixel corner glyph — an irregular 8-bit arrow/bracket that points
  // inward. Same geometry mirrored for the 4 corners via CSS transforms.
  // Chunky pixel shape (five rectangles forming a two-step L-bracket); echoes
  // the pixelated angles in the MV's burned-in ドゥーマー title.
  const cornerGlyph = `
    <svg viewBox="0 0 14 14">
      <g class="ko-corner-fill">
        <rect x="0" y="0" width="2" height="2"/>
        <rect x="2" y="0" width="2" height="2"/>
        <rect x="4" y="0" width="2" height="2"/>
        <rect x="0" y="2" width="2" height="2"/>
        <rect x="0" y="4" width="2" height="2"/>
        <rect x="2" y="2" width="2" height="2"/>
        <rect x="3" y="3" width="1" height="1"/>
      </g>
    </svg>`;

  // Pink heart pixel-glyph — fades via --ko-ripe color-mix (see CSS).
  // Two paths: an outline that's always visible at low alpha, and a
  // fill that decays. The outline preserves the silhouette even when
  // the fill has color-mixed to dark maroon.
  const heartSvg = `
    <svg viewBox="0 0 22 20" class="ko-gg-heart-svg">
      <path class="ko-gg-heart-fill"
        d="M11 18 L3 10 A4 4 0 0 1 11 6 A4 4 0 0 1 19 10 Z"/>
      <path class="ko-gg-heart-outline"
        d="M11 18 L3 10 A4 4 0 0 1 11 6 A4 4 0 0 1 19 10 Z"/>
    </svg>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-hud-top">
        <div class="ko-hud-channel">CH.404<span class="sep">//</span>DOOMER<span class="sep">//</span>19:84</div>
        <div class="ko-hud-rec"><span class="ko-hud-rec-dot"></span>REC</div>
      </div>
      <div class="ko-corner tl">${cornerGlyph}</div>
      <div class="ko-corner tr">${cornerGlyph}</div>
      <div class="ko-corner bl">${cornerGlyph}</div>
      <div class="ko-corner br">${cornerGlyph}</div>
      <div class="ko-tag">${escHTML(THEME.trackTag)}</div>
      <div class="ko-credit">${escHTML(THEME.artistTag)}</div>
      <div class="ko-screen">
        <div class="ko-screen-noise"></div>
        <div class="ko-screen-glow"></div>
        <div class="ko-line-jp" id="ko-line-jp"></div>
        <div class="ko-line-en" id="ko-line-en"></div>
      </div>
      <div class="ko-hud-bottom">
        <div class="ko-gg-label">GG</div>
        <div class="ko-gg-track"><div class="ko-gg-fill"></div></div>
        <div class="ko-gg-heart">${heartSvg}</div>
      </div>
    </div>
  `);
  document.body.appendChild(lyrics);

  if (window.__karaokeLyricsHidden) lyrics.style.display = 'none';

  // --- LRC parsing + LRCLib fetching (in-browser fallback) ---
  const parseLRC = (txt) => {
    const lines = [];
    for (const line of txt.split('\n')) {
      const m = line.match(/\[(\d+):(\d+(?:\.\d+)?)\](.*)/);
      if (!m) continue;
      const sec = Number(m[1]) * 60 + Number(m[2]);
      let text = m[3].trim();
      if (text.includes('^')) {
        const parts = text.split('^');
        const jp = parts[0].trim();
        const en = parts[1].trim();
        text = jp;
        if (jp && en) window.__transCache[jp] = window.__transCache[jp] || en;
      }
      lines.push({ t: sec, text });
    }
    return lines;
  };

  const lrcIds = [...new Set(window.__setlist.filter(s => s.lrcId).map(s => s.lrcId))];
  lrcIds.forEach(id => {
    if (window.__parsedLyrics[id]) return;
    fetch(`https://lrclib.net/api/get/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d && d.syncedLyrics) {
          window.__parsedLyrics[id] = parseLRC(d.syncedLyrics);
        }
      })
      .catch(() => {});
  });

  // --- Cached state for DOM-write guards ---
  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastLyricsPos = '';
  let lastEnText = '', lastJpText = '';
  let lastProgWriteAt = 0;  // ms timestamp of last --ko-progress/--ko-ripe write

  // --- Position tick: re-anchor the lyric zone to the video rect ---
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const p = window.__koPosition;
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}|${p.anchorX}|${p.anchorY}|${p.widthFrac}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      const cardW = r.width * p.widthFrac;
      lyrics.style.left     = (r.left + r.width * p.anchorX) + 'px';
      lyrics.style.top      = (r.top  + r.height * p.anchorY) + 'px';
      lyrics.style.width    = cardW + 'px';
      lyrics.style.maxWidth = cardW + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text + signal-loss decay ---
  const tick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    if (!isFinite(t)) return;

    const sl = window.__setlist;
    let idx = -1;
    for (let i = 0; i < sl.length; i++) {
      if (t >= sl[i].s && t < sl[i].end) { idx = i; break; }
    }

    const song    = idx >= 0 ? sl[idx] : null;
    const inSong  = song ? (t - song.s) : 0;
    const songDur = song ? (song.dur || 240) : 0;

    // ---- Song change block ----
    if (idx !== curSongIdx) {
      curSongIdx = idx;
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    // ---- Signal-loss + GG-bar update (rate-limited) ----
    // --ko-progress (0→1) drives the GG bar drain via CSS width calc; CSS
    // has `transition: width 160ms linear` on .ko-gg-fill so each 140ms
    // write chains seamlessly. --ko-ripe drives the decay effects (scanline
    // intensity, chromatic aberration, noise, heart fade). Ripe ramp:
    // clean for the first ~8% (intro hook "Hey Normie"), fully decayed by
    // ~94% so the final "Lay Back and Dive" plays on a fully-dying CRT.
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        const ripe = Math.max(0, Math.min(1, (progFrac - 0.08) / 0.86));
        lyrics.style.setProperty('--ko-progress', progFrac.toFixed(4));
        lyrics.style.setProperty('--ko-ripe',     ripe.toFixed(4));
      }
    }

    // ---- LRC line lookup + display ----
    if (song && song.lrcId && window.__parsedLyrics[song.lrcId]) {
      const lrc = window.__parsedLyrics[song.lrcId];
      const offset = window.__lyricOffsets[song.lrcId] || 0;
      const elapsed = inSong - offset;

      let lineIdx = -1;
      for (let i = 0; i < lrc.length; i++) {
        if (lrc[i].t <= elapsed) lineIdx = i;
        else break;
      }

      let showText = '';
      if (lineIdx >= 0) {
        const line = lrc[lineIdx];
        const nextT = (lrc[lineIdx + 1] && lrc[lineIdx + 1].t) || (songDur + 10);
        const endAt = Math.min(nextT, line.t + window.__koMaxHold);
        if (elapsed < endAt) {
          showText = line.text;
        }
      }

      if (lineIdx !== curLineIdx || showText !== lastJpText) {
        curLineIdx = lineIdx;
        const enEl = document.getElementById('ko-line-en');
        const jpEl = document.getElementById('ko-line-jp');
        if (song.lang === 'en') {
          if (enEl && showText !== lastEnText) {
            enEl.textContent = showText;
            lastEnText = showText;
          }
          if (jpEl && lastJpText !== '') {
            jpEl.textContent = '';
            lastJpText = '';
          }
        } else {
          const posEn = (lineIdx >= 0 && showText && lrc[lineIdx].en) || '';
          const en = posEn || (showText && window.__transCache[showText]) || '';
          if (enEl && en !== lastEnText) {
            enEl.textContent = en;
            lastEnText = en;
          }
          if (jpEl && showText !== lastJpText) {
            jpEl.textContent = showText;
            lastJpText = showText;
          }
        }
      }
    } else if (!song || !song.lrcId) {
      if (lastEnText !== '') {
        document.getElementById('ko-line-en').textContent = '';
        lastEnText = '';
      }
      if (lastJpText !== '') {
        document.getElementById('ko-line-jp').textContent = '';
        lastJpText = '';
      }
    }
  };

  // --- Dual loop: RAF for smoothness, setInterval for background-tab coverage ---
  const raf = () => {
    if (window.__koGen !== MY_GEN) return;
    tick();
    requestAnimationFrame(raf);
  };
  raf();
  const intervalId = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(intervalId); return; }
    tick();
  }, 30);

  // --- Offset hotkeys: [ ] \ ---
  const keyHandler = (e) => {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
    if (e.key !== '[' && e.key !== ']' && e.key !== '\\') return;
    const sl = window.__setlist;
    const song = curSongIdx >= 0 ? sl[curSongIdx] : null;
    if (!song || !song.lrcId) return;
    const id = song.lrcId;
    const cur = window.__lyricOffsets[id] || 0;
    if      (e.key === '[')  window.__lyricOffsets[id] = cur - 0.5;
    else if (e.key === ']')  window.__lyricOffsets[id] = cur + 0.5;
    else if (e.key === '\\') delete window.__lyricOffsets[id];
    curLineIdx = -2;
    try {
      const vid = new URL(location.href).searchParams.get('v');
      window.postMessage({
        __ko: true, type: 'offset',
        videoId: vid, lrcId: id,
        offset: window.__lyricOffsets[id] ?? null
      }, location.origin);
    } catch {}
    e.preventDefault();
    e.stopPropagation();
  };
  if (window.__karaokeKeyHandler) {
    document.removeEventListener('keydown', window.__karaokeKeyHandler, true);
  }
  window.__karaokeKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler, true);

  // --- Rebuild hook ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Timestamp-keyed translation merge ---
  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        const k2 = line.t.toFixed(2);
        const val = map[k2] || map[String(line.t)] || map[parseFloat(k2).toString()];
        if (!val) continue;
        if (typeof val === 'string') {
          line.en = val;
          if (line.text) window.__transCache[line.text] = val;
        } else {
          if (val.en) {
            line.en = val.en;
            if (line.text) window.__transCache[line.text] = val.en;
          }
          if (val.align && line.text) {
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Color + gloss colorizer (polling) ---
  let _lastWCJp = '';
  const COLOR_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(COLOR_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    if (!jpEl || !enEl) return;
    const jp = jpEl.textContent;
    if (jp === _lastWCJp) return;
    _lastWCJp = jp;
    if (!jp.trim()) return;
    const alignment = window.__wordAlign.data && window.__wordAlign.data[jp];
    if (!alignment) return;
    const colors = window.__wordAlign.colors;
    const buildJpPlain = segs => segs.map(([text, ci]) =>
      `<span data-wc="${ci}" style="color:${colors[ci]}">${escHTML(text)}</span>`
    ).join('');
    const buildJpGloss = segs => segs.map(([text, ci, g]) => {
      const col = colors[ci];
      // Empty/missing gloss renders a non-breaking space so the rt row
      // keeps its line height — an empty <rt> can collapse to zero on
      // some browsers and make the JP baseline jump between rubied and
      // un-rubied chunks on the same line. The agent emits "" as the
      // sentinel for "no label needed" (English-in-JP tokens, pure
      // punctuation, parenthetical refrain tags).
      const glossHTML = g ? escHTML(g) : '\u00a0';
      return `<span data-wc="${ci}" style="color:${col}"><ruby>${escHTML(text)}<rt style="color:${col}">${glossHTML}</rt></ruby></span>`;
    }).join('');
    const buildEn = segs => segs.map(([text, ci]) =>
      `<span data-wc="${ci}" style="color:${colors[ci]}">${escHTML(text)}</span>`
    ).join('');
    if (alignment.gloss && alignment.gloss.length) {
      setHTML(jpEl, buildJpGloss(alignment.gloss));
    } else if (alignment.jp) {
      setHTML(jpEl, buildJpPlain(alignment.jp));
    }
    if (alignment.en) setHTML(enEl, buildEn(alignment.en));
  }, 150);

})();
