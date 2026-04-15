// ============================================================================
// KARAOKE OVERLAY — SKELETON (SINGLE-SONG FLAVOR)
// ----------------------------------------------------------------------------
// Dedicated skeleton for single-song MV overlays. The sibling `skeleton.js`
// handles multi-song karaoke streams. Both share identical locked plumbing
// (Trusted Types, __koGen closure bail, tick+RAF, COLOR_POLL, translation
// merge); this one ships ZERO chrome by default — just the lyric card floating
// at 66% down the video. Everything else is the builder's canvas.
//
//   DROPPED vs skeleton.js:
//     • Setlist panel + collapse tab + row renderer + row click seek
//     • Plain-lyrics side panel + collapse tab + auto-show/hide logic
//     • Now-playing card (song title / artist / progress bar / times)
//     • Ctrl buttons (Offset reset, Hide lyrics, Skip talking)
//     • All collapse-tab state (__karaokeCollapsed, __karaokePlainCollapsed,
//       __karaokeSkipEnabled)
//
//   KEPT (same as stream skeleton, same names, same semantics):
//     • Trusted Types policy, __koGen + MY_GEN generation bail
//     • __setlist, __parsedLyrics, __transCache, __plainLyrics, __lyricOffsets,
//       __wordAlign, __karaokeLyricsHidden, __karaokeRebuild, __mergeTranslations
//     • Dual RAF + setInterval(tick, 30) loop
//     • positionTick posKey cache (anti-jank)
//     • curLineIdx = -1 reset on song-change (harmless for single-song but kept
//       so the skeleton stays parallel)
//     • Per-write cache guards before every DOM write
//     • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//     • #ko-lyrics sibling-of-root selector dual-define
//     • Offset hotkeys `[` `]` `\` + postMessage broadcast for extension persistence
//     • COLOR_POLL 150ms colorizer (NOT MutationObserver — feedback loop)
//     • Element IDs the tick writes to — #ko-line-jp, #ko-line-en ONLY.
//       No #ko-now-* IDs exist in this skeleton.
//     • Three lyric data layers: jp coarse chunks, gloss morphemes, en natural
//
// LOCKED — do not rename, remove, or mutate:
//
//   • window.__karaokePolicy (Trusted Types; CSP requires it)
//   • window.__koGen + MY_GEN closure capture
//   • window.__setlist, __parsedLyrics, __transCache, __plainLyrics,
//     __lyricOffsets, __wordAlign, __karaokeLyricsHidden, __karaokeRebuild
//   • RAF + setInterval(tick, 30) dual loop with MY_GEN bail
//   • COLOR_POLL setInterval at ~150ms (JP textContent → colored spans + ruby gloss)
//   • positionTick posKey cache
//   • curLineIdx = -1 reset on song transition
//   • Per-write cache guards before every DOM write
//   • Cleanup of #ko-style / #karaoke-root / #ko-lyrics before re-adding
//   • JP line above EN line in DOM (learner reads JP first)
//   • __mergeTranslations expects `{en, align: {jp, gloss, en}}`
//
// FREE — heavily modify per-song:
//
//   THEME, CSS rules, @keyframes, pseudo-elements, HTML structure added to
//   #karaoke-root, decorative wrappers around .ko-slot, animations, composition,
//   layout. The only hard DOM contract: `#ko-line-jp` and `#ko-line-en` must
//   exist inside `#ko-lyrics > .ko-slot`. Everything else is your canvas.
//
//   SINGLE-SONG DESIGN PRESSURE: this skeleton ships NO panel, NO now-playing
//   card, NO ctrl buttons. The whole stream-identity surface is yours to design
//   from scratch — a poster header, a corner stamp, a full-bleed title card,
//   nothing at all, whatever the MV calls for. The lyric card itself must carry
//   a bespoke per-line animation or transformation. A single-song overlay
//   without a signature visual feature is a failure. See SKILL.md "Signature-
//   feature gallery" for proven patterns as jumping-off points — they're not
//   templates. Invent one.
//
//   Offset hotkeys `[` `]` `\` still work via the document-level listener.
//   `window.__karaokeLyricsHidden = true` still hides lyrics. You don't need
//   buttons for these — but if your design warrants them, build them yourself.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — lyric rendering only. No panel, no now-card, no ctrls exist by
  // default in this skeleton; the overlay builder adds whatever chrome the MV
  // calls for (poster header, corner stamp, full-bleed title, nothing at all).
  //
  // Fonts + palette are available as CSS custom properties on #karaoke-root +
  // #ko-lyrics so any HTML the builder inserts can consume them consistently
  // with the lyric card.
  // ==========================================================================
  const THEME = {
    // Oswald = condensed display caps (MV's "DAYBREAK FRONTLINE" title style).
    // Manrope = clean geo sans for rail text. Fraunces = warm serif for EN.
    // Shippori Mincho = brush-edged JP serif that pairs with the illustration.
    fontsHref: 'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Manrope:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500;1,9..144,700&family=Shippori+Mincho:wght@500;700;800&display=swap',
    fontDisplay: '"Oswald", sans-serif',
    fontBody:    '"Manrope", sans-serif',
    fontSerif:   '"Fraunces", serif',
    fontJP:      '"Shippori Mincho", serif',

    // Sunset palette pulled from MV frames.
    cream:      '#FCE8D4',
    accent:     '#F4A946',
    accentDeep: '#E8839D',
    accentInk:  '#8A3B5C',
    ink:        '#1A0E2E',
    inkSoft:    '#2D1F4A',
    gold:       '#E6BB5E',
    rail:       '#F2BFD2',
    railSoft:   '#DDC7EE',

    lyricColorEN:  '#FCE8D4',
    lyricColorJP:  '#FCE8D4',
    lyricStrokeEN: '5px #1A0E2E',
    lyricStrokeJP: '5px #1A0E2E',
    lyricShadowEN: '0 0 14px rgba(244, 169, 70, 0.45), 0 0 36px rgba(26, 14, 46, 0.85)',
    lyricShadowJP: '0 0 16px rgba(244, 169, 70, 0.50), 0 0 32px rgba(26, 14, 46, 0.90)',
  };

  // --- Trusted Types policy (YouTube CSP requires this for innerHTML) ---
  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  // --- State preservation (survives re-injection) ---
  // __plainLyrics retained for schema parity with stream flavor even though
  // this skeleton doesn't render a plain panel. If a single-song build ships
  // plain_lyrics.json, the extension will populate the object; future
  // overlay.js edits can opt to render it inline.
  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  // Sunset palette — amber sun, dusty rose, dawn blue, cream highlight,
  // lavender twilight, coral-red sunset. Pulled from MV frames.
  window.__wordAlign = window.__wordAlign || { data: {} };
  window.__wordAlign.colors = ['#F4A946','#E8839D','#7DB9E8','#F3D89C','#B89ECE','#F07B5E'];
  if (!window.__wordAlign.data) window.__wordAlign.data = {};
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  // --- Generation counter: bumps so prior tick closures self-terminate ---
  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  // --- Runtime knobs ---
  window.__koMaxHold    = window.__koMaxHold    || 10;

  // --- Clean up any prior injection's leftover DOM ---
  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  // --- Load Google Fonts via <link> (CSP blocks @import inside <style>) ---
  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  // --- CSS injection ---
  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    /* Theme vars shared between #karaoke-root and #ko-lyrics — #ko-lyrics is a
       body sibling (not descendant), so vars defined only on #karaoke-root
       wouldn't cascade to .ko-line-*. Past bug: lyric fonts silently fell back
       to YouTube's Roboto while color-literal interpolations still worked. */
    #karaoke-root, #ko-lyrics {
      --ko-cream:       ${THEME.cream};
      --ko-accent:      ${THEME.accent};
      --ko-accent-deep: ${THEME.accentDeep};
      --ko-accent-ink:  ${THEME.accentInk};
      --ko-ink:         ${THEME.ink};
      --ko-ink-soft:    ${THEME.inkSoft};
      --ko-gold:        ${THEME.gold};
      --ko-rail:        ${THEME.rail};
      --ko-rail-soft:   ${THEME.railSoft};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ==== CHROME ====
       Everything inside #karaoke-root anchors to the video rect via JS position
       ticks further down. Keep it sparse — the MV does its own heavy lifting. */

    /* Pastel polaroid rails that trace the MV's actual pink/lavender borders.
       Intentionally thin — they frame the lyric zone without invading video. */
    #karaoke-root .ko-rail-top,
    #karaoke-root .ko-rail-bot {
      position: fixed;
      pointer-events: none;
      height: 3px;
      opacity: 0.62;
      background: linear-gradient(90deg,
        transparent 0%,
        var(--ko-rail-soft) 12%,
        var(--ko-rail) 50%,
        var(--ko-rail-soft) 88%,
        transparent 100%);
      box-shadow: 0 0 18px rgba(242, 191, 210, 0.35);
    }

    /* Top title rail: condensed caps of "DAYBREAK FRONTLINE" with era marker —
       mirrors the MV's own arched titling. The "01 / DAYBREAK" chapter stamp
       echoes the "PHASE CONNECT SAGA" framing without copying it. */
    #karaoke-root .ko-titlerail {
      position: fixed;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 14px;
      font-family: var(--ko-font-display);
      color: var(--ko-cream);
      text-shadow: 0 0 14px rgba(26, 14, 46, 0.9), 0 1px 2px rgba(26, 14, 46, 0.8);
      letter-spacing: 0.32em;
      font-weight: 400;
      opacity: 0.82;
    }
    #karaoke-root .ko-titlerail .tr-num {
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 11px;
      color: var(--ko-accent);
      letter-spacing: 0.18em;
      text-shadow: 0 0 10px rgba(244, 169, 70, 0.55);
      padding: 3px 8px;
      border: 1px solid rgba(244, 169, 70, 0.55);
      border-radius: 1px;
    }
    #karaoke-root .ko-titlerail .tr-title {
      font-size: 13px;
      letter-spacing: 0.42em;
      font-weight: 500;
    }
    #karaoke-root .ko-titlerail .tr-dot {
      width: 4px; height: 4px;
      background: var(--ko-accent);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--ko-accent);
    }
    #karaoke-root .ko-titlerail .tr-sub {
      font-family: var(--ko-font-body);
      font-size: 10px;
      letter-spacing: 0.28em;
      font-weight: 400;
      color: var(--ko-rail);
      text-transform: uppercase;
      opacity: 0.85;
    }

    /* Bottom-left stamp: "PHASE CONNECT SAGA" credit block, mirroring the MV. */
    #karaoke-root .ko-stamp {
      position: fixed;
      pointer-events: none;
      font-family: var(--ko-font-display);
      color: var(--ko-cream);
      text-shadow: 0 0 12px rgba(26, 14, 46, 0.95), 0 1px 2px rgba(26, 14, 46, 0.8);
      font-size: 10px;
      letter-spacing: 0.42em;
      font-weight: 400;
      line-height: 1.65;
      opacity: 0.75;
    }
    #karaoke-root .ko-stamp .st-bar {
      display: inline-block;
      width: 18px;
      height: 1px;
      background: var(--ko-accent);
      vertical-align: middle;
      margin-right: 8px;
      box-shadow: 0 0 6px var(--ko-accent);
    }
    #karaoke-root .ko-stamp .st-accent { color: var(--ko-accent); }

    /* Bottom-right credit: ORANGESTAR · MALICE EVERMORE */
    #karaoke-root .ko-credit {
      position: fixed;
      pointer-events: none;
      text-align: right;
      font-family: var(--ko-font-display);
      color: var(--ko-cream);
      text-shadow: 0 0 12px rgba(26, 14, 46, 0.95), 0 1px 2px rgba(26, 14, 46, 0.8);
      font-size: 10px;
      letter-spacing: 0.38em;
      line-height: 1.7;
      font-weight: 400;
      opacity: 0.72;
    }
    #karaoke-root .ko-credit .cr-role {
      font-family: var(--ko-font-body);
      color: var(--ko-rail);
      font-size: 8px;
      letter-spacing: 0.34em;
      font-weight: 400;
      text-transform: uppercase;
    }
    #karaoke-root .ko-credit .cr-name { font-weight: 500; }

    /* Offset readout — tiny, tucks below the credit stack */
    #karaoke-root .ko-offset {
      position: fixed;
      pointer-events: none;
      font-family: var(--ko-font-body);
      color: var(--ko-accent);
      text-shadow: 0 0 10px rgba(244, 169, 70, 0.55), 0 1px 2px rgba(26, 14, 46, 0.8);
      font-size: 10px;
      letter-spacing: 0.22em;
      font-weight: 500;
      opacity: 0;
      transition: opacity 0.35s ease;
    }
    #karaoke-root .ko-offset.show { opacity: 0.85; }

    /* ==== LYRIC DISPLAY ====
       #ko-lyrics is positioned via the position tick (see positionTick below).
       Position is structural — do not change. Typography and color are theme.
       Single-song overlays put their creative weight here — animate the slot
       on line change, add signature visual effects, build character. */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      position: relative;
    }

    /* ==== SIGNATURE: SUNRISE HORIZON SWEEP ====
       On every new JP line, a horizon line draws left-to-right underneath the
       lyrics and a small sun glyph travels along it, resolving into a settled
       horizon. Literal "daybreak" animation — ties to both the song title and
       the horizon/sun emblem that recurs in the MV. Idle state: settled
       horizon with faint amber glow. On .ko-sunrise-fire class: re-animates.

       Plumbing: a setInterval polls #ko-line-jp textContent; on change, we
       toggle the class with forced reflow to retrigger keyframes. */
    #ko-lyrics .ko-horizon {
      order: 3;                       /* sits below the EN line (order 2) */
      position: relative;
      width: 68%;
      height: 26px;
      margin-top: 8px;
      pointer-events: none;
      opacity: 1;
    }
    /* The horizon line itself: thin amber stroke with gradient fade at ends */
    #ko-lyrics .ko-horizon::before {
      content: "";
      position: absolute;
      left: 0; right: 0;
      top: 50%;
      height: 1.5px;
      transform: scaleX(0.12);
      transform-origin: center;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(244, 169, 70, 0.3) 10%,
        var(--ko-accent) 50%,
        rgba(244, 169, 70, 0.3) 90%,
        transparent 100%);
      box-shadow: 0 0 10px rgba(244, 169, 70, 0.7), 0 0 22px rgba(244, 169, 70, 0.35);
      transition: transform 0.5s cubic-bezier(.2,.9,.3,1);
    }
    /* Sun glyph: a small disc that travels along the horizon */
    #ko-lyrics .ko-horizon::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 10px; height: 10px;
      margin-left: -5px;
      margin-top: -5px;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 50%,
        #FFE8B8 0%,
        var(--ko-accent) 45%,
        rgba(244, 169, 70, 0.2) 80%,
        transparent 100%);
      box-shadow:
        0 0 10px rgba(244, 169, 70, 0.85),
        0 0 22px rgba(244, 169, 70, 0.55),
        0 0 40px rgba(232, 131, 157, 0.3);
      opacity: 0.9;
      transform: translateX(0);
    }
    /* FIRE class: re-draw the horizon + travel the sun */
    #ko-lyrics .ko-slot.ko-sunrise-fire .ko-horizon::before {
      animation: ko-horizon-draw 900ms cubic-bezier(.2,.9,.3,1) both;
    }
    #ko-lyrics .ko-slot.ko-sunrise-fire .ko-horizon::after {
      animation: ko-sun-travel 900ms cubic-bezier(.25,.7,.35,1) both;
    }
    @keyframes ko-horizon-draw {
      0%   { transform: scaleX(0);    opacity: 0.2; }
      35%  { transform: scaleX(0.45); opacity: 1;   }
      100% { transform: scaleX(1);    opacity: 1;   }
    }
    @keyframes ko-sun-travel {
      0%   { transform: translateX(-34%) scale(0.6); opacity: 0; filter: blur(1px); }
      18%  { transform: translateX(-32%) scale(1);   opacity: 1; filter: blur(0);   }
      72%  { transform: translateX(32%)  scale(1.15); opacity: 1; filter: blur(0);  }
      100% { transform: translateX(0)    scale(1);   opacity: 0.9; filter: blur(0); }
    }
    /* Idle hum — subtle breathing on the sun between lines */
    @keyframes ko-sun-hum {
      0%, 100% { box-shadow:
                   0 0 10px rgba(244, 169, 70, 0.75),
                   0 0 22px rgba(244, 169, 70, 0.45),
                   0 0 40px rgba(232, 131, 157, 0.25); }
      50%      { box-shadow:
                   0 0 14px rgba(244, 169, 70, 0.95),
                   0 0 30px rgba(244, 169, 70, 0.6),
                   0 0 54px rgba(232, 131, 157, 0.4); }
    }
    #ko-lyrics .ko-horizon::after {
      animation: ko-sun-hum 3.2s ease-in-out infinite;
    }

    /* Hide the whole horizon when lyrics are empty (between lines in break) */
    #ko-lyrics .ko-slot.ko-empty .ko-horizon { opacity: 0; }
    #ko-lyrics .ko-slot .ko-horizon { transition: opacity 0.5s ease; }

    /* En-song mode: smaller horizon, looks less grand for non-JP lines */
    #ko-lyrics .ko-slot.ko-en-song .ko-horizon { width: 44%; height: 20px; margin-top: 4px; }
    /* Stroke drawn BEHIND fill via paint-order so letter shape stays crisp at
       5px thickness. text-shadow is reserved for glow. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 42px;
      line-height: 2.4;
      padding-top: 0.4em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    /* Gloss ruby: tighter, slightly smaller, uppercase for dictionary-entry
       feel — reads like the tiny romaji the MV itself places under its own
       lyric drops. Lighter stroke so it doesn't compete with the JP body. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-body);
      font-size: 17px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      line-height: 1.1;
      padding-bottom: 7px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 2.5px ${THEME.lyricStrokeJP.split(' ').slice(1).join(' ')};
      text-shadow: 0 0 6px rgba(244, 169, 70, 0.45), 0 0 14px rgba(26, 14, 46, 0.85);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    /* EN line: italic serif (Fraunces) — softer, more lyrical counterweight
       to the hard-edged JP display type. Reads as song-booklet voice. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-serif);
      font-weight: 500;
      font-style: italic;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 32px;
      line-height: 1.3;
      letter-spacing: 0.005em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 400; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }
  `;
  document.head.appendChild(style);

  // --- Tiny helpers ---
  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // --- DOM construction ---
  // Attach to <body>, NOT #movie_player — YouTube detaches #movie_player from
  // the tree on scroll/resize events and the overlay would vanish.
  const root = document.createElement('div');
  root.id = 'karaoke-root';
  setHTML(root, `
    <div class="ko-rail-top"></div>
    <div class="ko-rail-bot"></div>
    <div class="ko-titlerail">
      <span class="tr-num">01</span>
      <span class="tr-title">DAYBREAK&nbsp;FRONTLINE</span>
      <span class="tr-dot"></span>
      <span class="tr-sub">Rock&nbsp;Version</span>
    </div>
    <div class="ko-stamp">
      <div><span class="st-bar"></span><span class="st-accent">PHASE</span></div>
      <div><span class="st-bar"></span>CONNECT</div>
      <div><span class="st-bar"></span>SAGA</div>
    </div>
    <div class="ko-credit">
      <div class="cr-role">Original</div>
      <div class="cr-name">ORANGESTAR&nbsp;feat.&nbsp;IA</div>
      <div class="cr-role" style="margin-top:6px;">Cover</div>
      <div class="cr-name">MALICE&nbsp;EVERMORE</div>
    </div>
    <div class="ko-offset" id="ko-offset-readout">OFFSET&nbsp;+0.00s</div>
  `);
  document.body.appendChild(root);

  // Lyric card: JP + EN + horizon scanline underneath.
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-horizon" id="ko-horizon"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  // Apply persisted hide-lyrics state. No button exists — toggle via console
  // (`window.__karaokeLyricsHidden = true; ...`) or wire your own UI. The
  // state survives re-injection via the preserved window flag.
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

  // --- Position tick: re-anchor the lyric card AND the chrome to the video ---
  // posKey cache is LOAD-BEARING — without it every 250ms writes to style.left/top
  // unconditionally, cascading through YouTube's MutationObservers.
  const railTop    = root.querySelector('.ko-rail-top');
  const railBot    = root.querySelector('.ko-rail-bot');
  const titleRail  = root.querySelector('.ko-titlerail');
  const stamp      = root.querySelector('.ko-stamp');
  const credit     = root.querySelector('.ko-credit');
  const offsetRead = root.querySelector('#ko-offset-readout');
  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}`;
    if (posKey !== lastLyricsPos) {
      lastLyricsPos = posKey;
      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';

      // Chrome: thin pastel polaroid rails on top/bottom of the video rect
      if (railTop) {
        railTop.style.left  = r.left + 'px';
        railTop.style.top   = (r.top + 10) + 'px';
        railTop.style.width = r.width + 'px';
      }
      if (railBot) {
        railBot.style.left  = r.left + 'px';
        railBot.style.top   = (r.top + r.height - 14) + 'px';
        railBot.style.width = r.width + 'px';
      }
      // Title rail: top-left, 30px inside the rails
      if (titleRail) {
        titleRail.style.left = (r.left + 26) + 'px';
        titleRail.style.top  = (r.top + 24) + 'px';
      }
      // Stamp: bottom-left, tucked above the bottom rail
      if (stamp) {
        stamp.style.left   = (r.left + 26) + 'px';
        stamp.style.bottom = 'auto';
        stamp.style.top    = (r.top + r.height - 82) + 'px';
      }
      // Credit: bottom-right
      if (credit) {
        credit.style.right = (window.innerWidth - r.right + 26) + 'px';
        credit.style.top   = (r.top + r.height - 76) + 'px';
      }
      // Offset readout: below the credit stack
      if (offsetRead) {
        offsetRead.style.right = (window.innerWidth - r.right + 26) + 'px';
        offsetRead.style.top   = (r.top + 24) + 'px';
      }
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

  // --- Main tick: update lyric text only ---
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
      // CRITICAL: reset curLineIdx so the new song's line 0 can fire.
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
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
  // Positive offset = lyrics LAG (appear later than audio); negative = LEAD.
  // `[` subtracts (pulls lyrics earlier on screen), `]` adds (pushes later).
  // Tick uses `elapsed = inSong - offset`, so subtracting from offset makes
  // the current line advance sooner.
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
    // Flash offset readout
    if (offsetRead) {
      const newOff = window.__lyricOffsets[id] || 0;
      offsetRead.textContent = `OFFSET ${newOff >= 0 ? '+' : ''}${newOff.toFixed(2)}s`;
      offsetRead.classList.add('show');
      clearTimeout(window.__koOffsetHide);
      window.__koOffsetHide = setTimeout(() => offsetRead.classList.remove('show'), 1600);
    }
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

  // --- Rebuild hook: call after merging new translation data ---
  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  // --- Timestamp-keyed translation merge ---
  // Accepts two per-line shapes:
  //   1. String: "<en line>" — plain translation, no color alignment
  //   2. Object: {en, align: {jp, gloss, en}} — translation + alignment + gloss
  // Keys are LRC timestamps as (m*60+s).toFixed(2).
  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        // Tolerate both "44.2" and "44.20" — Python's default str() drops trailing zeros.
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
            // Field-level merge — a follow-up batch carrying only `gloss` must
            // not wipe existing `jp`/`en`. Replacing the whole align object is
            // a silent-data-loss footgun.
            const existing = window.__wordAlign.data[line.text] || {};
            window.__wordAlign.data[line.text] = Object.assign(existing, val.align);
          }
        }
      }
    }
    window.__karaokeRebuild();
  };

  // --- Color + gloss colorizer (polling, NOT MutationObserver — observer
  //     creates a feedback loop with the tick's textContent writes). ---
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
      return `<span data-wc="${ci}" style="color:${col}"><ruby>${escHTML(text)}<rt style="color:${col}">${escHTML(g || '')}</rt></ruby></span>`;
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

  // ==========================================================================
  // SIGNATURE: SUNRISE HORIZON SWEEP
  // --------------------------------------------------------------------------
  // On every new JP lyric line, trigger the horizon-draw + sun-travel animation
  // by toggling .ko-sunrise-fire on the slot. Uses a forced reflow between
  // class removal and re-add so keyframes re-run on identical-class re-add.
  // ==========================================================================
  // Poll the raw JP line via `lastJpText` (what the tick last wrote). We can't
  // use jpEl.textContent because COLOR_POLL rewrites with <ruby><rt>...</rt>,
  // and textContent then includes the gloss strings — that would re-fire every
  // time a line colorizes, not just on line change.
  const slotEl = document.getElementById('ko-slot');
  let _lastFireJp = null; // sentinel — undefined-vs-empty matters for first empty
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    if (!slotEl) return;
    const jp = lastJpText; // closure var set by tick
    if (jp === _lastFireJp) return;
    _lastFireJp = jp;
    if (!jp || !jp.trim()) {
      slotEl.classList.add('ko-empty');
      slotEl.classList.remove('ko-sunrise-fire');
      return;
    }
    slotEl.classList.remove('ko-empty');
    // Retrigger animation: remove class, force reflow, re-add
    slotEl.classList.remove('ko-sunrise-fire');
    void slotEl.offsetWidth;
    slotEl.classList.add('ko-sunrise-fire');
    const song = curSongIdx >= 0 ? (window.__setlist[curSongIdx] || null) : null;
    slotEl.classList.toggle('ko-en-song', !!(song && song.lang === 'en'));
  }, 90);

})();
