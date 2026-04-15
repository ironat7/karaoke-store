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
  // VAMPIRE-PRINCESS ROYAL DECREE — Malice Evermore covering AiNA THE END's
  // "革命道中 (On the Way)" / Dandadan S2 OP. Rococo palace throne-room,
  // crystal chandelier, vintage clock (1000-year-sealed lore), gothic elf
  // princess with fangs + heart pupils. Song: 唸る (roar), 血泥 (bloody sludge),
  // 革命 (revolution), 呪い (curse), 病 (illness), 恋の爪 (claws of love).
  // Overlay reads as a royal edict inked onto aged parchment in blood.
  const THEME = {
    fontsHref:   'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=IM+Fell+English:ital@0;1&family=Shippori+Mincho+B1:wght@400;500;700;800&display=swap',
    fontDisplay: '"Cinzel Decorative", serif',
    fontBody:    '"Cormorant Garamond", serif',
    fontSerif:   '"IM Fell English", serif',
    fontJP:      '"Shippori Mincho B1", serif',

    parchment:    '#F5DDD8',
    parchmentDim: '#E8C4BF',
    wineDeep:     '#380817',
    wine:         '#6B0F2A',
    blood:        '#A11832',
    bloodBright:  '#E42B5C',
    goldRoyal:    '#C99441',
    goldHi:       '#F0CE6A',
    goldPale:     '#FAE4A3',
    rosePetal:    '#E08AAC',
    rosePink:     '#F2A9C7',
    lilac:        '#B890C8',
    inkShadow:    '#1E0310',
    moonlit:      '#0F0518',

    lyricColorJP:  '#FAECD8',
    lyricColorEN:  '#FAECD8',
    lyricStrokeJP: '5px #380817',
    lyricStrokeEN: '4.5px #380817',
    lyricShadowJP: '0 0 16px rgba(161, 24, 50, 0.55), 0 0 28px rgba(14, 2, 8, 0.85), 0 2px 0 rgba(56, 8, 23, 0.75)',
    lyricShadowEN: '0 0 14px rgba(224, 138, 172, 0.45), 0 0 26px rgba(14, 2, 8, 0.85), 0 2px 0 rgba(56, 8, 23, 0.75)',
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
  window.__wordAlign = window.__wordAlign || {
    colors: ['#FF4B8C','#3EC7F0','#FFB830','#7BE08F','#C58BFF','#FF8E5E'],
    data: {}
  };
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

    #karaoke-root, #ko-lyrics {
      --ko-parchment:     ${THEME.parchment};
      --ko-parchment-dim: ${THEME.parchmentDim};
      --ko-wine-deep:     ${THEME.wineDeep};
      --ko-wine:          ${THEME.wine};
      --ko-blood:         ${THEME.blood};
      --ko-blood-bright:  ${THEME.bloodBright};
      --ko-gold-royal:    ${THEME.goldRoyal};
      --ko-gold-hi:       ${THEME.goldHi};
      --ko-gold-pale:     ${THEME.goldPale};
      --ko-rose-petal:    ${THEME.rosePetal};
      --ko-rose-pink:     ${THEME.rosePink};
      --ko-lilac:         ${THEME.lilac};
      --ko-ink-shadow:    ${THEME.inkShadow};
      --ko-moonlit:       ${THEME.moonlit};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-serif:   ${THEME.fontSerif};
      --ko-font-jp:      ${THEME.fontJP};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    /* ============================================================
       TITLE HEADER — top of video, a royal decree banner
       ============================================================ */
    #ko-header {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2147483050;
      pointer-events: none;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 18px 46px 16px;
      min-width: 480px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(241, 169, 199, 0.22), transparent 60%),
        linear-gradient(180deg, rgba(56, 8, 23, 0.88) 0%, rgba(27, 3, 14, 0.92) 100%);
      border: 1px solid rgba(201, 148, 65, 0.55);
      border-top: none;
      box-shadow:
        0 8px 30px rgba(14, 2, 8, 0.55),
        inset 0 -1px 0 rgba(240, 206, 106, 0.25),
        inset 0 0 38px rgba(161, 24, 50, 0.18);
      clip-path: polygon(
        0 0, 100% 0,
        100% calc(100% - 18px),
        calc(100% - 28px) 100%,
        50% calc(100% - 12px),
        28px 100%,
        0 calc(100% - 18px)
      );
    }
    /* gold filigree edge ornaments */
    #ko-header::before, #ko-header::after {
      content: "✦";
      position: absolute;
      top: 20px;
      color: var(--ko-gold-hi);
      font-size: 14px;
      text-shadow: 0 0 10px rgba(240, 206, 106, 0.7);
      opacity: 0.85;
    }
    #ko-header::before { left: 22px; }
    #ko-header::after  { right: 22px; }

    .ko-crest {
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 11px;
      letter-spacing: 0.42em;
      color: var(--ko-gold-hi);
      text-transform: uppercase;
      padding: 0 10px;
      position: relative;
      text-shadow: 0 0 14px rgba(240, 206, 106, 0.5);
    }
    .ko-crest::before, .ko-crest::after {
      content: "";
      display: inline-block;
      width: 40px;
      height: 1px;
      vertical-align: middle;
      margin: 0 14px;
      background: linear-gradient(90deg, transparent, var(--ko-gold-royal), transparent);
    }
    .ko-title-jp {
      font-family: var(--ko-font-jp);
      font-weight: 800;
      font-size: 32px;
      letter-spacing: 0.16em;
      color: var(--ko-parchment);
      text-shadow:
        0 0 22px rgba(228, 43, 92, 0.45),
        0 0 8px rgba(14, 2, 8, 0.85),
        0 2px 0 rgba(14, 2, 8, 0.9);
      display: flex;
      align-items: center;
      gap: 0.16em;
    }
    .ko-title-jp .t-roman {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-size: 17px;
      letter-spacing: 0.12em;
      color: var(--ko-rose-pink);
      opacity: 0.78;
      margin-left: 14px;
      text-shadow: 0 2px 0 rgba(14, 2, 8, 0.9);
    }
    .ko-sub {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-size: 14px;
      letter-spacing: 0.08em;
      color: var(--ko-rose-pink);
      opacity: 0.88;
    }
    .ko-sub b {
      font-style: normal;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: var(--ko-gold-hi);
      text-transform: uppercase;
      font-size: 12px;
      padding: 0 8px;
    }
    .ko-chain {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-size: 11px;
      letter-spacing: 0.22em;
      color: rgba(250, 228, 163, 0.58);
      text-transform: uppercase;
      margin-top: 2px;
    }
    .ko-chain::before, .ko-chain::after {
      content: "";
      width: 36px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(240, 206, 106, 0.55), transparent);
    }

    /* ============================================================
       HOURGLASS — bottom-right, nods to her 1000-year-seal lore.
       Doubles as progress indicator (sand level = song %).
       ============================================================ */
    #ko-hourglass {
      position: fixed;
      z-index: 2147483050;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
    .ko-hg-shell {
      position: relative;
      width: 78px;
      height: 112px;
    }
    .ko-hg-shell svg {
      width: 100%; height: 100%;
      filter: drop-shadow(0 0 12px rgba(240, 206, 106, 0.35)) drop-shadow(0 2px 6px rgba(14, 2, 8, 0.8));
    }
    .ko-hg-label {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 0.4em;
      color: var(--ko-gold-hi);
      opacity: 0.85;
      text-transform: uppercase;
      text-shadow: 0 2px 0 rgba(14, 2, 8, 0.9);
    }
    .ko-hg-time {
      font-family: var(--ko-font-body);
      font-style: italic;
      font-size: 13px;
      color: var(--ko-rose-pink);
      letter-spacing: 0.08em;
      text-shadow: 0 2px 0 rgba(14, 2, 8, 0.9);
    }

    /* ============================================================
       LYRIC DISPLAY — the royal decree parchment
       ============================================================ */
    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 34px 54px 28px;
      background:
        radial-gradient(ellipse at 50% 0%, rgba(228, 43, 92, 0.10) 0%, transparent 65%),
        radial-gradient(ellipse at 50% 100%, rgba(107, 15, 42, 0.28) 0%, transparent 75%),
        linear-gradient(180deg, rgba(56, 8, 23, 0.72) 0%, rgba(27, 3, 14, 0.88) 100%);
      border: 1px solid rgba(201, 148, 65, 0.48);
      box-shadow:
        0 10px 36px rgba(14, 2, 8, 0.75),
        inset 0 0 46px rgba(107, 15, 42, 0.35),
        inset 0 1px 0 rgba(240, 206, 106, 0.35),
        inset 0 -1px 0 rgba(240, 206, 106, 0.22);
      min-height: 128px;
    }
    /* rococo corner filigrees — gold ornamental brackets */
    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      content: "";
      position: absolute;
      width: 58px;
      height: 58px;
      pointer-events: none;
      background:
        linear-gradient(var(--ko-gold-hi), var(--ko-gold-hi)) 0 0 / 100% 2px no-repeat,
        linear-gradient(var(--ko-gold-hi), var(--ko-gold-hi)) 0 0 / 2px 100% no-repeat,
        radial-gradient(circle at 10px 10px, var(--ko-gold-hi) 0 2px, transparent 3px),
        radial-gradient(circle at 22px 10px, rgba(240, 206, 106, 0.7) 0 1.5px, transparent 2.5px),
        radial-gradient(circle at 10px 22px, rgba(240, 206, 106, 0.7) 0 1.5px, transparent 2.5px);
      filter: drop-shadow(0 0 6px rgba(240, 206, 106, 0.55));
      opacity: 0.92;
    }
    #ko-lyrics .ko-slot::before { top: -1px; left: -1px; }
    #ko-lyrics .ko-slot::after  { top: -1px; right: -1px; transform: scaleX(-1); }

    /* Seal: fang-cross emblem that sits at top-center of the decree. Fires on
       each new line — see @keyframes ko-sealFire below. */
    .ko-seal {
      position: absolute;
      top: -26px;
      left: 50%;
      transform: translateX(-50%);
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background:
        radial-gradient(circle at 30% 28%, rgba(240, 206, 106, 0.8) 0%, var(--ko-blood) 45%, var(--ko-wine-deep) 100%);
      box-shadow:
        0 0 0 2px rgba(240, 206, 106, 0.85),
        0 0 0 4px rgba(56, 8, 23, 0.8),
        0 0 22px rgba(228, 43, 92, 0.55),
        0 6px 14px rgba(14, 2, 8, 0.7);
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 22px;
      color: var(--ko-gold-pale);
      text-shadow: 0 0 6px rgba(14, 2, 8, 0.9), 0 0 14px rgba(228, 43, 92, 0.6);
      z-index: 2;
    }
    .ko-seal::before, .ko-seal::after {
      content: "";
      position: absolute;
      bottom: -7px;
      width: 4px;
      height: 9px;
      background: var(--ko-parchment);
      clip-path: polygon(50% 100%, 0 0, 100% 0);
      filter: drop-shadow(0 0 3px rgba(228, 43, 92, 0.7));
    }
    .ko-seal::before { left: 12px; }
    .ko-seal::after  { right: 12px; }

    /* Base-wax drip under the seal (fixed decorative element) */
    .ko-drip {
      position: absolute;
      top: 18px;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 0;
      background: linear-gradient(180deg, rgba(228, 43, 92, 0.9), transparent);
      pointer-events: none;
      z-index: 1;
    }

    /* ============================================================
       SANGUINE BLOOM — the signature per-line animation.
       On JP line change, .ko-slot gets .kfire, which triggers:
         • A crimson radial bloom that sweeps from the seal outward
           across the parchment
         • The seal pulses (scales + glows)
         • A fresh drop of ink trickles down from the seal
         • JP text bleeds in: starts saturated crimson → settles to
           cream with crimson stroke over ~0.8s
       ============================================================ */
    #ko-lyrics .ko-slot.kfire .ko-line-jp {
      animation: ko-jpBleed 0.9s ease-out both;
    }
    #ko-lyrics .ko-slot.kfire .ko-line-en {
      animation: ko-enFade 1.0s ease-out 0.18s both;
    }
    #ko-lyrics .ko-slot.kfire::after {
      /* override ::after for the sweeping bloom effect during fire */
    }
    #ko-lyrics .ko-slot .ko-bloom {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
      border-radius: inherit;
    }
    #ko-lyrics .ko-slot .ko-bloom::before {
      content: "";
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%) scale(0);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(228, 43, 92, 0.85) 0%, rgba(161, 24, 50, 0.55) 30%, transparent 70%);
      opacity: 0;
      mix-blend-mode: screen;
    }
    #ko-lyrics .ko-slot.kfire .ko-bloom::before {
      animation: ko-bloomRadial 0.95s cubic-bezier(0.16, 0.84, 0.44, 1) both;
    }
    #ko-lyrics .ko-slot.kfire .ko-seal {
      animation: ko-sealFire 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    #ko-lyrics .ko-slot.kfire .ko-drip {
      animation: ko-drip 0.85s ease-in both;
    }

    @keyframes ko-bloomRadial {
      0%   { transform: translateX(-50%) scale(0); opacity: 0; }
      20%  { opacity: 0.95; }
      100% { transform: translateX(-50%) scale(14); opacity: 0; }
    }
    @keyframes ko-sealFire {
      0%   { transform: translateX(-50%) scale(1); box-shadow: 0 0 0 2px rgba(240,206,106,0.85), 0 0 0 4px rgba(56,8,23,0.8), 0 0 22px rgba(228,43,92,0.55), 0 6px 14px rgba(14,2,8,0.7); }
      25%  { transform: translateX(-50%) scale(1.28); box-shadow: 0 0 0 2px rgba(240,206,106,1), 0 0 0 4px rgba(56,8,23,0.8), 0 0 36px rgba(228,43,92,0.95), 0 0 60px rgba(228,43,92,0.55); }
      100% { transform: translateX(-50%) scale(1); }
    }
    @keyframes ko-drip {
      0%   { height: 0; opacity: 0; top: 18px; }
      30%  { opacity: 1; }
      80%  { height: 24px; top: 18px; opacity: 0.9; }
      100% { height: 24px; top: 52px; opacity: 0; }
    }
    @keyframes ko-jpBleed {
      0%   { filter: sepia(1) hue-rotate(-30deg) saturate(3.5) brightness(0.75); opacity: 0; transform: translateY(-4px); }
      18%  { opacity: 1; }
      60%  { filter: sepia(0.35) hue-rotate(-12deg) saturate(1.8) brightness(0.9); transform: translateY(0); }
      100% { filter: none; opacity: 1; }
    }
    @keyframes ko-enFade {
      0%   { opacity: 0; transform: translateY(4px); letter-spacing: 0.06em; }
      100% { opacity: 1; transform: translateY(0); letter-spacing: 0.01em; }
    }

    /* Lyric text styles */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 700;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
      font-size: 44px;
      line-height: 2.4;
      padding-top: 0.3em;
      letter-spacing: 0.04em;
      text-shadow: ${THEME.lyricShadowJP};
      min-height: 1em;
      order: 1;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-jp span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeJP};
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-serif);
      font-style: italic;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.03em;
      line-height: 1.1;
      padding-bottom: 6px;
      color: ${THEME.lyricColorJP};
      paint-order: stroke fill;
      -webkit-text-stroke: 3px ${THEME.inkShadow};
      text-shadow: 0 0 8px rgba(228, 43, 92, 0.55), 0 0 16px rgba(14, 2, 8, 0.85), 0 2px 0 rgba(14, 2, 8, 0.9);
      user-select: none;
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 700;
      color: ${THEME.lyricColorEN};
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
      font-size: 40px;
      line-height: 1.22;
      letter-spacing: 0.02em;
      text-shadow: ${THEME.lyricShadowEN};
      max-width: 100%;
      min-height: 1em;
      order: 2;
      font-style: italic;
      position: relative;
      z-index: 2;
    }
    #ko-lyrics .ko-line-en span {
      paint-order: stroke fill;
      -webkit-text-stroke: ${THEME.lyricStrokeEN};
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 500; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* Index tag — roman-numeralled verse counter at bottom-right of the decree */
    .ko-verse-tag {
      position: absolute;
      bottom: -14px;
      right: 24px;
      font-family: var(--ko-font-display);
      font-weight: 900;
      font-size: 10px;
      letter-spacing: 0.38em;
      color: var(--ko-gold-hi);
      text-transform: uppercase;
      background: linear-gradient(180deg, var(--ko-wine-deep), var(--ko-ink-shadow));
      padding: 4px 10px;
      border: 1px solid rgba(201, 148, 65, 0.6);
      text-shadow: 0 0 6px rgba(240, 206, 106, 0.5);
      z-index: 3;
    }
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
  document.body.appendChild(root);

  // Title header: royal-decree banner at top of video
  const header = document.createElement('div');
  header.id = 'ko-header';
  setHTML(header, `
    <div class="ko-crest">Crown Princess Malice · Verelisse</div>
    <div class="ko-title-jp">革命道中<span class="t-roman">Kakumei Dōchū</span></div>
    <div class="ko-sub"><b>On the Way</b> · original by AiNA THE END</div>
    <div class="ko-chain">Dandadan Season 2 Opening · Decreed in Blood</div>
  `);
  root.appendChild(header);

  // Hourglass: lore nod (sealed 1000 years) + doubles as song-progress indicator.
  // SVG sand is masked by the #ko-hg-sand clip rect, whose height is updated by
  // the tick. Numeric "MM:SS / MM:SS" label sits underneath.
  const hourglass = document.createElement('div');
  hourglass.id = 'ko-hourglass';
  setHTML(hourglass, `
    <div class="ko-hg-shell">
      <svg viewBox="0 0 80 112" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hg-glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FAE4A3" stop-opacity="0.18"/>
            <stop offset="1" stop-color="#FAE4A3" stop-opacity="0.05"/>
          </linearGradient>
          <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#F2A9C7"/>
            <stop offset="0.55" stop-color="#E08AAC"/>
            <stop offset="1" stop-color="#A11832"/>
          </linearGradient>
          <clipPath id="hg-top-bowl">
            <path d="M 14 10 L 66 10 L 44 52 Q 40 56 36 52 Z"/>
          </clipPath>
          <clipPath id="hg-bot-bowl">
            <path d="M 40 60 Q 36 60 36 64 L 14 100 L 66 100 L 44 64 Q 44 60 40 60 Z"/>
          </clipPath>
        </defs>
        <!-- top/bottom plates -->
        <rect x="6" y="6" width="68" height="6" fill="#C99441" rx="1"/>
        <rect x="6" y="100" width="68" height="6" fill="#C99441" rx="1"/>
        <!-- glass bulbs -->
        <path d="M 14 10 L 66 10 L 44 52 Q 40 56 36 52 Z" fill="url(#hg-glass)" stroke="#F0CE6A" stroke-width="1.2"/>
        <path d="M 40 60 Q 36 60 36 64 L 14 100 L 66 100 L 44 64 Q 44 60 40 60 Z" fill="url(#hg-glass)" stroke="#F0CE6A" stroke-width="1.2"/>
        <!-- side posts -->
        <rect x="5" y="4" width="3" height="104" fill="#C99441"/>
        <rect x="72" y="4" width="3" height="104" fill="#C99441"/>
        <!-- TOP SAND: shrinks with time. rect is clipped to top bowl shape. -->
        <rect id="ko-hg-sand-top" x="14" y="10" width="52" height="42" fill="url(#hg-sand)" clip-path="url(#hg-top-bowl)"/>
        <!-- BOTTOM SAND: grows with time -->
        <rect id="ko-hg-sand-bot" x="14" y="100" width="52" height="0" fill="url(#hg-sand)" clip-path="url(#hg-bot-bowl)"/>
        <!-- falling sand stream (static decoration) -->
        <rect x="39.5" y="52" width="1" height="12" fill="#E08AAC" opacity="0.8"/>
        <!-- center sparkle -->
        <circle cx="40" cy="56" r="1.2" fill="#F0CE6A">
          <animate attributeName="opacity" values="0.4;1;0.4" dur="1.4s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
    <div class="ko-hg-label">The Seal Breaks</div>
    <div class="ko-hg-time" id="ko-hg-time">0:00 / 3:15</div>
  `);
  root.appendChild(hourglass);

  // Lyric card: royal decree parchment with fang-cross wax seal
  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-bloom"></div>
      <div class="ko-seal" aria-hidden="true">✟</div>
      <div class="ko-drip"></div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
      <div class="ko-verse-tag" id="ko-verse-tag">VERSE · I</div>
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

  // --- Position tick: re-anchor the lyric card to the video rect ---
  // posKey cache is LOAD-BEARING — without it every 250ms writes to style.left/top
  // unconditionally, cascading through YouTube's MutationObservers.
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
      // Title header: top-center of video rect, anchored down from its top edge
      header.style.left = (r.left + r.width / 2) + 'px';
      header.style.top  = (r.top + 0) + 'px';
      // Hourglass: bottom-right corner of video rect (not the viewport)
      hourglass.style.left = (r.left + r.width - 104) + 'px';
      hourglass.style.top  = (r.top + r.height - 190) + 'px';
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
  // SIGNATURE: sanguine-bloom trigger + verse counter.
  // Watches #ko-line-jp textContent. Each non-empty change re-fires the .kfire
  // animation (class remove → forced reflow → class add) and bumps the verse
  // index. Roman numerals because this is a royal decree, not a PR.
  // ==========================================================================
  const ROMAN = (n) => {
    const map = [['X',10],['IX',9],['V',5],['IV',4],['I',1]];
    let s = '', v = n;
    for (const [sym, val] of map) {
      while (v >= val) { s += sym; v -= val; }
    }
    return s;
  };
  let _fireLastJp = null;
  let _fireLineCount = 0;
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const slot = document.getElementById('ko-slot');
    const jpEl = document.getElementById('ko-line-jp');
    const tag  = document.getElementById('ko-verse-tag');
    if (!slot || !jpEl) return;
    const jp = jpEl.textContent;
    if (jp === _fireLastJp) return;
    _fireLastJp = jp;
    if (jp.trim()) {
      _fireLineCount++;
      if (tag) tag.textContent = 'VERSE · ' + ROMAN(_fireLineCount);
      slot.classList.remove('kfire');
      void slot.offsetWidth;
      slot.classList.add('kfire');
    }
  }, 60);

  // ==========================================================================
  // HOURGLASS sand + time. The top bowl drains from full (42 height) to 0;
  // the bottom bowl fills from 0 to 38. Uses clip-paths defined in the SVG
  // so the sand only shows inside the bulb silhouettes. Updated off the
  // video's currentTime against song.dur.
  // ==========================================================================
  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };
  let _lastSandKey = '';
  const HG_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(HG_POLL); return; }
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    if (!isFinite(t)) return;
    const sl = window.__setlist || [];
    const song = sl[0];
    if (!song) return;
    const dur = song.dur || (song.end - song.s) || 240;
    const inSong = Math.max(0, Math.min(t - song.s, dur));
    const pct = dur > 0 ? inSong / dur : 0;
    const topH = Math.max(0, 42 * (1 - pct));
    const topY = 10 + (42 - topH);
    const botH = Math.min(38, 38 * pct);
    const botY = 100 - botH;
    const timeStr = fmt(inSong) + ' / ' + fmt(dur);
    const key = topH.toFixed(1) + '|' + botH.toFixed(1) + '|' + timeStr;
    if (key === _lastSandKey) return;
    _lastSandKey = key;
    const topRect = document.getElementById('ko-hg-sand-top');
    const botRect = document.getElementById('ko-hg-sand-bot');
    const timeEl  = document.getElementById('ko-hg-time');
    if (topRect) {
      topRect.setAttribute('y', topY.toFixed(2));
      topRect.setAttribute('height', topH.toFixed(2));
    }
    if (botRect) {
      botRect.setAttribute('y', botY.toFixed(2));
      botRect.setAttribute('height', botH.toFixed(2));
    }
    if (timeEl && timeEl.textContent !== timeStr) timeEl.textContent = timeStr;
  }, 250);

})();
