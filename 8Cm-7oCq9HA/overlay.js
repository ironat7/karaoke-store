// ============================================================================
// KARAOKE OVERLAY — TAK 「PPPP」 feat. 初音ミク・重音テト
// ----------------------------------------------------------------------------
// The MV plays out as a rhythm-game / vocaloid idol-battle: chunky pixel-art
// UI ("PPPP" pixel logo, "WARM-UP" loading screens, SCORE 1225000, dual HP
// bars, dotted-circle timeline) layered over kawaii Miku/Teto chibi art with
// 3D extruded burned-in subtitles. The song's lyric conceit IS the duel:
// Miku sings ボクノオーラビーム ("MY aura beam!"), Teto answers with ウチノオーラビーム
// then アタシアタシ — they're competing for the spotlight in real time.
//
// AESTHETIC: a rhythm-game HUD lyric panel. Pixel-art bordered card, dueling
// aura HP bars at the top, dotted-pixel progress timeline at the bottom.
// Mint (Miku) on the left, coral (Teto) on the right, all the way down.
//
// SIGNATURE: the dueling aura HP bars at the top of the card. They start
// balanced 50/50; when the current JP line contains ボク, Miku's mint bar
// surges; when it contains ウチ or アタシ, Teto's coral bar surges; on 大好き
// (the love-pivot line) both peak; on 最低 (the defeat line) both dip. The
// bars literally visualize the song's central dueling-aura-beams metaphor.
// Functional (encodes who's singing) AND thematic (the song IS that battle).
//
// SECONDARY: dotted-pixel circle progress timeline along the bottom edge,
// transcribed from frame-130's actual in-MV game UI. 24 circles, the
// played ones tinted half-mint half-coral, the current one glowing.
//
// Line changes are motionless. The card lives through the auras shifting,
// the timeline ticking, and the score counter incrementing.
// ============================================================================

(() => {

  // ==========================================================================
  // THEME — PPPP rhythm-game palette
  // ==========================================================================
  const THEME = {
    trackTag:   'PPPP',
    artistTag:  'TAK · MIKU × TETO',

    fontsHref:
      'https://fonts.googleapis.com/css2?' +
      'family=DotGothic16&' +
      'family=Mochiy+Pop+One&' +
      'family=Reggae+One&' +
      'family=Fredoka:wght@500;600;700&' +
      'family=Zen+Maru+Gothic:wght@500;700&' +
      'display=swap',
    fontPixel:    '"DotGothic16", "Press Start 2P", monospace',
    fontJP:       '"Mochiy Pop One", "Reggae One", sans-serif',
    fontJPHeavy:  '"Reggae One", "Mochiy Pop One", sans-serif',
    fontEN:       '"Fredoka", system-ui, sans-serif',
    fontGloss:    '"Zen Maru Gothic", "Noto Sans JP", system-ui, sans-serif',

    // Palette — every hex pulled directly from MV frames.
    // Miku side: mint/teal (her hair, the bunny chef hat, frame-25 "Hey" badge)
    // Teto side: coral (her hair, frame-130 "エグ いよ", frame-25 "뭐해뭐해" red ticket)
    // Neutral: cream (the bento-box thumbnail backdrop, frame-25 backdrop)
    mint:         '#7FCEC0',  // Miku primary — frame-25 "Hey" sticker
    mintDeep:     '#3F7E76',  // Mint shadow / outline
    mintInk:      '#1F5C56',  // Deepest mint, used for text-on-cream legibility
    mintPale:     '#D6EFEA',  // Mint highlight / aura bar bg trail

    coral:        '#F18B6F',  // Teto primary — frame-130 "エグ いよ"
    coralDeep:    '#B8493A',  // Coral shadow / outline
    coralInk:     '#8E2A1F',  // Deepest coral, text-on-cream legibility
    coralPale:    '#FBD3C2',  // Coral highlight / aura bar bg trail

    cream:        '#FFF6E0',  // Card background — bento-box thumbnail backdrop
    creamDeep:    '#F2E2BD',  // Card inner shadow / panel divider
    ink:          '#221512',  // Charcoal text (frame headers, MIKU TAK TETO row)

    pixelGold:    '#E5A93C',  // SCORE counter, "WARM-UP" pixel text in MV
    pixelGoldDeep:'#9D6816',  // Gold shadow

    // chunkColors: 6 slots. All saturated enough to sit legibly on cream.
    // Drawn from the MV's actual sticker palette + character colors.
    chunkColors: [
      '#1F5C56',  // 0 — deep mint (Miku narrator: ボク lines)
      '#B8493A',  // 1 — coral (Teto narrator: ウチ/アタシ lines + Korean fan red)
      '#7E3A8E',  // 2 — plum (love/feels: 大好き / アイシテ / 溶けた)
      '#2A6BA0',  // 3 — deep blue (the cool blue tones in thumbnail border)
      '#A06016',  // 4 — amber (motion verbs / time / SCORE accent)
      '#5A8A2F',  // 5 — leaf (rare accent for naturalist or the green stem)
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

  // Position — sit low (the MV's main action is centered/upper in most frames,
  // and the burned-in subs are usually placed in the middle/lower band).
  // 0.83 anchorY pins us in the lower fifth without crowding the bottom.
  window.__koPosition = Object.assign(
    { anchorX: 0.5, anchorY: 0.83, widthFrac: 0.66 },
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
    #claude-agent-glow-border { display: none !important; }

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
    /* CSS vars on BOTH selectors — #ko-lyrics is a body sibling of
       #karaoke-root, not a descendant. */
    #karaoke-root, #ko-lyrics {
      --ko-mint:        ${THEME.mint};
      --ko-mint-deep:   ${THEME.mintDeep};
      --ko-mint-ink:    ${THEME.mintInk};
      --ko-mint-pale:   ${THEME.mintPale};
      --ko-coral:       ${THEME.coral};
      --ko-coral-deep:  ${THEME.coralDeep};
      --ko-coral-ink:   ${THEME.coralInk};
      --ko-coral-pale:  ${THEME.coralPale};
      --ko-cream:       ${THEME.cream};
      --ko-cream-deep:  ${THEME.creamDeep};
      --ko-ink:         ${THEME.ink};
      --ko-gold:        ${THEME.pixelGold};
      --ko-gold-deep:   ${THEME.pixelGoldDeep};

      --ko-font-pixel:  ${THEME.fontPixel};
      --ko-font-jp:     ${THEME.fontJP};
      --ko-font-jp-hv:  ${THEME.fontJPHeavy};
      --ko-font-en:     ${THEME.fontEN};
      --ko-font-gloss:  ${THEME.fontGloss};

      /* Runtime vars — written by the main tick.
         --ko-miku-power, --ko-coral-power: 0..1 aura bar fill fractions.
         Default 0.5/0.5 (balanced). Surges on character-attributed lines.
         --ko-progress-frac: 0..1 song progress (drives dotted timeline).
         --ko-line-pulse: 0..1 momentary brightness on new line. */
      --ko-miku-power:  0.5;
      --ko-coral-power: 0.5;
      --ko-progress-frac: 0;
      --ko-line-pulse:  0;
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    /* ==== CARD — RHYTHM-GAME HUD PANEL ====================================
       Cream surface with a sandwich of pixel-art borders: outer mint+coral
       checker frame (via repeating-linear-gradient on the ::before), inner
       cream-deep panel, then the content. The double border is a 16-bit
       game UI staple — Castlevania, R-Type, vocaloid rhythm games. */
    #ko-lyrics .ko-slot {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 10px;
      padding: 14px 22px 18px;
      background: var(--ko-cream);
      /* Subtle pixel-grid texture overlay — 4×4 dot pattern on cream-deep at
         very low opacity. Gives the card a "sprite sheet" cell feel without
         fighting the lyric text. */
      background-image:
        radial-gradient(circle at 1px 1px,
          rgba(220, 178, 110, 0.18) 0.8px, transparent 1.2px),
        linear-gradient(180deg,
          color-mix(in srgb, var(--ko-mint-pale) 30%, transparent) 0%,
          transparent 18%,
          transparent 82%,
          color-mix(in srgb, var(--ko-coral-pale) 30%, transparent) 100%),
        linear-gradient(180deg, var(--ko-cream), var(--ko-cream));
      background-size: 4px 4px, auto, auto;
      /* Outer pixel-checker mint+coral border. The 8-color repeating-linear
         strip alternates mint/coral squares, giving a Castlevania-style
         "checkerboard energy" frame. Outer dark outline grounds the card
         on busy MV backdrops. Layered: base shadow, dark outline, pixel
         checker, inner cream-deep separator. */
      box-shadow:
        0 0 0 2px var(--ko-cream-deep),
        0 0 0 4px var(--ko-ink),
        0 0 0 6px var(--ko-cream),
        0 0 0 8px var(--ko-mint-deep),
        0 22px 44px -14px rgba(40, 18, 10, 0.55),
        0 6px 0 0 var(--ko-coral-deep),
        inset 0 0 0 2px var(--ko-cream-deep),
        inset 0 0 24px rgba(255, 246, 224, 0.55);
      border-radius: 4px;  /* Sharp pixel-art corners, just barely softened. */
      isolation: isolate;
      overflow: visible;
      /* Subtle pulse on new line — driven by --ko-line-pulse */
      filter: brightness(calc(1 + var(--ko-line-pulse) * 0.06));
      transition: filter 280ms ease-out, opacity 380ms;
    }

    /* Outer pixel-checker frame, drawn as a rotated dashed border using
       a tiled image. Kept separate from box-shadow so it can have its
       own pattern. */
    #ko-lyrics .ko-slot::before {
      content: '';
      position: absolute;
      inset: -16px;
      pointer-events: none;
      z-index: -1;
      background:
        /* Top edge: alternating mint/coral 8x4 pixels */
        linear-gradient(90deg,
          var(--ko-mint) 0 8px, var(--ko-coral) 8px 16px) top / 16px 4px repeat-x,
        linear-gradient(90deg,
          var(--ko-mint) 0 8px, var(--ko-coral) 8px 16px) bottom / 16px 4px repeat-x,
        linear-gradient(180deg,
          var(--ko-mint) 0 8px, var(--ko-coral) 8px 16px) left / 4px 16px repeat-y,
        linear-gradient(180deg,
          var(--ko-mint) 0 8px, var(--ko-coral) 8px 16px) right / 4px 16px repeat-y;
      opacity: 0;  /* Disabled by default — the box-shadow stack already gives
                     a strong pixel-art frame. Keep this hook in case we want
                     a chunkier pattern later. */
    }

    /* Empty-state collapse during instrumental gaps */
    #ko-lyrics .ko-slot:has(.ko-line-jp:empty):has(.ko-line-en:empty) {
      opacity: 0.0;
      transform: scale(0.96);
      transition: opacity 320ms, transform 320ms;
    }

    /* ==== HEADER STRIP — pixel logo + credit row =========================
       Layout matches the MV's "MIKU ✱ ✱ TAK ✱ ✱ TETO" credit row:
       chunky pixel font, dark ink, with star/flower icons separating
       the names. Sits at the very top of the card. */
    #ko-lyrics .ko-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 4px 6px;
      border-bottom: 2px dashed color-mix(in srgb, var(--ko-ink) 25%, transparent);
      font-family: var(--ko-font-pixel);
      font-size: 13px;
      letter-spacing: 0.06em;
      color: var(--ko-ink);
      text-transform: uppercase;
      order: 0;
    }
    #ko-lyrics .ko-pppp {
      color: var(--ko-mint-deep);
      font-weight: 400;
      letter-spacing: 0.18em;
      font-size: 16px;
      /* Pixel-stack 3D extrusion: 1px stacked shadow in coral gives the
         logo a sprite-sheet "double letter" feel. Matches frame-60's PPPP
         wordmark which is also 2-tone overlap. */
      text-shadow:
        1px 0 0 var(--ko-coral),
        2px 0 0 var(--ko-coral),
        2px 1px 0 var(--ko-coral-deep);
    }
    #ko-lyrics .ko-credits .ko-cred-name { color: var(--ko-ink); }
    #ko-lyrics .ko-credits .ko-cred-mark.miku  { color: var(--ko-mint-deep); }
    #ko-lyrics .ko-credits .ko-cred-mark.teto  { color: var(--ko-coral-deep); }
    #ko-lyrics .ko-credits .ko-cred-mark.tak   { color: var(--ko-gold); }

    /* ==== AURA BARS — the signature dueling HP bars =======================
       Two bars meeting in the middle. Mint Miku on the left fills L→R;
       coral Teto on the right fills R→L. The center divider is a tiny
       pixel "vs" plate.

       --ko-miku-power and --ko-coral-power (0..1) are written by tick
       based on which character's pronoun appears in the current JP line:
         ボク → miku surges (0.78)
         ウチ / アタシ → teto surges (0.78)
         大好き → both peak (0.95)
         最低 → both dip (0.32)
         default → both balanced (0.55)
       Bars transition over 600ms ease — they BREATHE during the duet.

       Visual treatment: pixel-segmented like a 16-bit health bar. The fill
       is a layered linear-gradient producing 4-step segmented pixels. The
       trail behind shows max capacity. */
    #ko-lyrics .ko-aura-row {
      position: relative;
      display: grid;
      grid-template-columns: 1fr 28px 1fr;
      align-items: center;
      gap: 4px;
      padding: 2px 0 2px;
      order: 1;
    }
    #ko-lyrics .ko-aura-bar {
      position: relative;
      height: 14px;
      border: 1.5px solid var(--ko-ink);
      background:
        repeating-linear-gradient(90deg,
          color-mix(in srgb, var(--ko-cream-deep) 60%, transparent) 0 7px,
          transparent 7px 8px),
        var(--ko-cream);
      border-radius: 2px;
      box-shadow:
        inset 0 1px 0 rgba(0, 0, 0, 0.18),
        inset 0 -1px 0 rgba(255, 255, 255, 0.45);
      overflow: hidden;
    }
    #ko-lyrics .ko-aura-bar .ko-aura-fill {
      position: absolute;
      top: 0; bottom: 0;
      transition: width 600ms cubic-bezier(.3,.7,.3,1),
                  background 600ms ease;
    }
    #ko-lyrics .ko-aura-bar.miku .ko-aura-fill {
      left: 0;
      width: calc(var(--ko-miku-power) * 100%);
      background:
        /* Pixel scanlines for retro-bar feel */
        repeating-linear-gradient(90deg,
          transparent 0 7px,
          rgba(0, 0, 0, 0.10) 7px 8px),
        /* Glossy fill: top highlight → main → bottom shadow */
        linear-gradient(180deg,
          color-mix(in srgb, var(--ko-mint) 80%, white 20%) 0%,
          var(--ko-mint) 50%,
          var(--ko-mint-deep) 100%);
    }
    /* Teto's bar is right-anchored: it grows from the right edge inward. */
    #ko-lyrics .ko-aura-bar.teto .ko-aura-fill {
      right: 0;
      width: calc(var(--ko-coral-power) * 100%);
      background:
        repeating-linear-gradient(90deg,
          transparent 0 7px,
          rgba(0, 0, 0, 0.10) 7px 8px),
        linear-gradient(180deg,
          color-mix(in srgb, var(--ko-coral) 80%, white 20%) 0%,
          var(--ko-coral) 50%,
          var(--ko-coral-deep) 100%);
    }
    /* Endcap notch on each bar (the rounded "tip" of an HP gauge) */
    #ko-lyrics .ko-aura-bar.miku .ko-aura-fill::after {
      content: '';
      position: absolute;
      right: -1px; top: 0; bottom: 0;
      width: 2px;
      background: rgba(255, 255, 255, 0.65);
    }
    #ko-lyrics .ko-aura-bar.teto .ko-aura-fill::after {
      content: '';
      position: absolute;
      left: -1px; top: 0; bottom: 0;
      width: 2px;
      background: rgba(255, 255, 255, 0.65);
    }
    /* Character label on each bar's outer end */
    #ko-lyrics .ko-aura-bar .ko-aura-label {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      font-family: var(--ko-font-pixel);
      font-size: 10px;
      letter-spacing: 0.12em;
      color: var(--ko-cream);
      text-shadow: 0 1px 0 rgba(0, 0, 0, 0.55);
      pointer-events: none;
      z-index: 2;
    }
    #ko-lyrics .ko-aura-bar.miku .ko-aura-label { left: 6px; }
    #ko-lyrics .ko-aura-bar.teto .ko-aura-label { right: 6px; }

    /* The "VS" plate in the center of the aura row */
    #ko-lyrics .ko-aura-vs {
      width: 28px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-pixel);
      font-size: 11px;
      color: var(--ko-cream);
      background: var(--ko-ink);
      border: 1.5px solid var(--ko-cream);
      border-radius: 2px;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 0 var(--ko-coral-deep), -2px 0 0 var(--ko-mint-deep);
      transform: rotate(-4deg);
    }

    /* ==== SCORE BADGE — top-right corner pixel display ====================
       Floats above the card. Pixel font on a dark plate with mint border.
       Increments per line via JS-written textContent. Matches the in-MV
       "SCORE 1225000" pixel display. */
    #ko-lyrics .ko-score {
      position: absolute;
      top: -22px;
      right: 12px;
      padding: 4px 10px 5px;
      background: var(--ko-ink);
      color: var(--ko-gold);
      font-family: var(--ko-font-pixel);
      font-size: 13px;
      letter-spacing: 0.10em;
      border: 2px solid var(--ko-cream);
      border-radius: 3px;
      box-shadow:
        0 0 0 2px var(--ko-ink),
        0 4px 0 0 var(--ko-gold-deep),
        0 6px 10px -2px rgba(0, 0, 0, 0.45);
      transform: rotate(2deg);
      z-index: 5;
      white-space: nowrap;
      text-shadow: 0 0 6px rgba(229, 169, 60, 0.5);
    }
    #ko-lyrics .ko-score .ko-score-label {
      color: var(--ko-mint);
      margin-right: 6px;
      letter-spacing: 0.18em;
    }

    /* ==== CHARACTER CHIP — top-left corner ================================
       Tiny pixel-sticker showing whose line is currently active. Shifts
       between MIKU / TETO / DUO based on the same pronoun detection that
       drives the aura bars. Floats above the card like the SCORE badge. */
    #ko-lyrics .ko-chip {
      position: absolute;
      top: -22px;
      left: 14px;
      padding: 4px 10px 5px;
      font-family: var(--ko-font-pixel);
      font-size: 12px;
      letter-spacing: 0.14em;
      background: var(--ko-cream);
      color: var(--ko-ink);
      border: 2px solid var(--ko-ink);
      border-radius: 3px;
      box-shadow:
        0 4px 0 0 var(--ko-mint-deep),
        0 6px 10px -2px rgba(0, 0, 0, 0.35);
      transform: rotate(-2deg);
      z-index: 5;
      white-space: nowrap;
      transition: background 380ms ease, color 380ms ease,
                  box-shadow 380ms ease, transform 380ms ease;
    }
    #ko-lyrics .ko-chip.miku {
      background: var(--ko-mint);
      color: var(--ko-cream);
      box-shadow:
        0 4px 0 0 var(--ko-mint-deep),
        0 6px 12px -2px rgba(0, 80, 60, 0.55);
      transform: rotate(-2deg) translateY(-1px);
    }
    #ko-lyrics .ko-chip.teto {
      background: var(--ko-coral);
      color: var(--ko-cream);
      box-shadow:
        0 4px 0 0 var(--ko-coral-deep),
        0 6px 12px -2px rgba(140, 40, 30, 0.55);
      transform: rotate(-2deg) translateY(-1px);
    }
    #ko-lyrics .ko-chip.both {
      background: linear-gradient(135deg,
        var(--ko-mint) 0% 50%,
        var(--ko-coral) 50% 100%);
      color: var(--ko-cream);
      transform: rotate(-2deg) translateY(-1px);
    }
    #ko-lyrics .ko-chip.kor {
      background: var(--ko-pixelGold, var(--ko-gold));
      color: var(--ko-ink);
      box-shadow:
        0 4px 0 0 var(--ko-gold-deep),
        0 6px 12px -2px rgba(120, 80, 0, 0.45);
    }

    /* ==== LYRIC ZONE — chunky 3D-extruded JP, rounded EN ==================
       Chunky JP matches the burned-in subs in frame-8 ("ほら見て見て見て") and
       frame-130 ("エグ いよ"): heavy rounded display sans, thick cream
       outline, dark drop-shadow extrusion. */
    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 400;
      color: var(--ko-ink);
      font-size: 44px;
      line-height: 1.95;
      letter-spacing: 0.03em;
      padding-top: 0.5em;
      padding-bottom: 4px;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 2;
      /* Heavy 3D extrusion stacked text-shadow:
           - layer 1-2: cream halo (legibility on busy MV backdrops)
           - layer 3-5: stepped coral shadow extrusion (the "punch")
         Matches the burned-in subs' style — chunky rounded sans with a
         thick cream outline and a dark/coral drop. */
      text-shadow:
        -1px -1px 0 var(--ko-cream),
         1px -1px 0 var(--ko-cream),
        -1px  1px 0 var(--ko-cream),
         1px  1px 0 var(--ko-cream),
        -2px -2px 0 var(--ko-cream),
         2px -2px 0 var(--ko-cream),
        -2px  2px 0 var(--ko-cream),
         2px  2px 0 var(--ko-cream),
         3px  3px 0 var(--ko-coral-deep),
         4px  4px 0 var(--ko-coral-deep),
         5px  5px 8px rgba(40, 18, 10, 0.45);
    }
    #ko-lyrics .ko-line-jp span { color: inherit; }

    /* Gloss rt — tiny pixel-mono labels above each morpheme.
       Painted in a soft cream-with-mint-tint background pill so the label
       reads cleanly on any MV backdrop. */
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-gloss);
      font-size: 17px;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding: 2px 5px 2px;
      margin-bottom: 4px;
      color: var(--ko-mint-ink);
      background: rgba(255, 246, 224, 0.92);
      border-radius: 3px;
      border: 1px solid color-mix(in srgb, var(--ko-mint-deep) 35%, transparent);
      text-transform: lowercase;
      user-select: none;
      text-shadow: none;
      box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    /* EN line — Fredoka rounded, chunky enough to balance the JP weight. */
    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-en);
      font-weight: 600;
      color: var(--ko-coral-ink);
      font-size: 26px;
      line-height: 1.25;
      letter-spacing: 0.005em;
      max-width: 100%;
      min-height: 1em;
      position: relative;
      z-index: 2;
      order: 3;
      padding-bottom: 4px;
      text-shadow:
        -1px -1px 0 var(--ko-cream),
         1px -1px 0 var(--ko-cream),
        -1px  1px 0 var(--ko-cream),
         1px  1px 0 var(--ko-cream),
         2px  2px 0 rgba(184, 73, 58, 0.18),
         0 2px 6px rgba(255, 246, 224, 0.6);
    }
    #ko-lyrics .ko-line-en span { color: inherit; }
    #ko-lyrics .ko-line-en.en-song {
      font-size: 23px;
      font-weight: 500;
    }

    /* ==== DOTTED PIXEL TIMELINE — secondary signature ====================
       24 pixel dots connected by a thin line, transcribed from frame-130's
       in-MV game UI dotted timeline. The played-portion dots are tinted
       half mint half coral (alternating), the upcoming dots are hollow,
       and the active dot glows with a mint+coral halo.

       The active-dot index is derived from --ko-progress-frac via calc():
       a single linear-gradient mask shows N filled circles. */
    #ko-lyrics .ko-timeline {
      position: relative;
      height: 14px;
      margin-top: 2px;
      padding: 0 6px;
      display: flex;
      align-items: center;
      gap: 2px;
      order: 4;
    }
    /* The connecting line behind the dots */
    #ko-lyrics .ko-timeline::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 12px; right: 12px;
      height: 2px;
      transform: translateY(-50%);
      background: linear-gradient(90deg,
        var(--ko-mint) 0%,
        var(--ko-mint) calc(var(--ko-progress-frac) * 100%),
        color-mix(in srgb, var(--ko-ink) 25%, transparent)
          calc(var(--ko-progress-frac) * 100%),
        color-mix(in srgb, var(--ko-ink) 25%, transparent) 100%);
      transition: background 360ms linear;
      z-index: 0;
    }
    #ko-lyrics .ko-tl-dot {
      position: relative;
      flex: 1;
      height: 8px;
      max-width: 9px;
      border-radius: 50%;
      background: var(--ko-cream);
      border: 1.5px solid color-mix(in srgb, var(--ko-ink) 50%, transparent);
      z-index: 1;
      transition: background 240ms ease, transform 240ms ease,
                  box-shadow 240ms ease;
    }
    /* Played dots: tinted mint or coral on alternating odd/even */
    #ko-lyrics .ko-tl-dot.played:nth-child(odd) {
      background: var(--ko-mint);
      border-color: var(--ko-mint-deep);
    }
    #ko-lyrics .ko-tl-dot.played:nth-child(even) {
      background: var(--ko-coral);
      border-color: var(--ko-coral-deep);
    }
    /* Active dot: glow halo */
    #ko-lyrics .ko-tl-dot.active {
      background: var(--ko-gold);
      border-color: var(--ko-gold-deep);
      transform: scale(1.45);
      box-shadow:
        0 0 0 2px rgba(229, 169, 60, 0.35),
        0 0 8px 2px rgba(229, 169, 60, 0.65);
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

  // 24 pixel dots for the timeline.
  const TL_DOT_COUNT = 24;
  const tlDots = Array.from({ length: TL_DOT_COUNT },
    (_, i) => `<div class="ko-tl-dot" data-i="${i}"></div>`).join('');

  // Header credit row — match the MV's "MIKU ✱ ✱ TAK ✱ ✱ TETO" layout.
  const creditRow = `
    <span class="ko-cred-name">MIKU</span>
    <span class="ko-cred-mark miku">♪</span>
    <span class="ko-cred-mark tak">✦</span>
    <span class="ko-cred-name">TAK</span>
    <span class="ko-cred-mark tak">✦</span>
    <span class="ko-cred-mark teto">♪</span>
    <span class="ko-cred-name">TETO</span>`;

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot" id="ko-slot">
      <div class="ko-chip" id="ko-chip">DUO</div>
      <div class="ko-score" id="ko-score">
        <span class="ko-score-label">SCORE</span><span id="ko-score-val">0000000</span>
      </div>

      <div class="ko-header">
        <span class="ko-pppp">${escHTML(THEME.trackTag)}</span>
        <span class="ko-credits">${creditRow}</span>
      </div>

      <div class="ko-aura-row">
        <div class="ko-aura-bar miku">
          <span class="ko-aura-label">MIKU</span>
          <div class="ko-aura-fill"></div>
        </div>
        <div class="ko-aura-vs">VS</div>
        <div class="ko-aura-bar teto">
          <div class="ko-aura-fill"></div>
          <span class="ko-aura-label">TETO</span>
        </div>
      </div>

      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>

      <div class="ko-timeline" id="ko-timeline">${tlDots}</div>
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
  let lastChipMode = '';
  let lastScoreShown = -1;
  let lastActiveDotIdx = -1;
  let lastPlayedDotIdx = -1;  // tracks which dots have already been .played
  let lastProgWriteAt = 0;

  // --- Score animation: targets ramp on line change, displayed value
  // chases the target via requestAnimationFrame easing. Starts at a base
  // so the very first line lands in the millions like the in-MV "1225000". ---
  let scoreTarget = 1000000;       // base value — always shown after first line
  let scoreDisplayed = 1000000;    // smoothly chases scoreTarget
  const SCORE_PER_LINE = 27500;    // ~47 lines * 27500 = ~1.29M peak

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

  // ============================================================================
  // CHARACTER DETECTION — read JP line text, decide who's singing.
  //
  // Rules (in priority order):
  //   1. 大好き / アイシテ → "love peak" — both bars surge to 0.95
  //   2. 最低 → "defeat dip" — both bars sag to 0.32
  //   3. ボク → Miku speaking — mint 0.78, coral 0.32
  //   4. ウチ or アタシ → Teto speaking — mint 0.32, coral 0.78
  //   5. Korean lines (한글 detected) → "fan cheer" — both 0.62 (gold chip)
  //   6. otherwise → balanced 0.55 / 0.55 (both whispering / unison)
  //
  // Returns { miku, coral, chipMode } where chipMode ∈ {'miku','teto','both','kor','duo'}.
  // ============================================================================
  const HANGUL_RE = /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/;
  const detectCharacter = (jpText) => {
    if (!jpText) return { miku: 0.5, coral: 0.5, chipMode: 'duo' };
    if (jpText.includes('大好き') || jpText.includes('アイシテ')) {
      return { miku: 0.95, coral: 0.95, chipMode: 'both' };
    }
    if (jpText.includes('最低')) {
      return { miku: 0.32, coral: 0.32, chipMode: 'both' };
    }
    if (jpText.includes('ボク')) {
      return { miku: 0.82, coral: 0.30, chipMode: 'miku' };
    }
    if (jpText.includes('ウチ') || jpText.includes('アタシ')) {
      return { miku: 0.30, coral: 0.82, chipMode: 'teto' };
    }
    if (HANGUL_RE.test(jpText)) {
      return { miku: 0.62, coral: 0.62, chipMode: 'kor' };
    }
    return { miku: 0.55, coral: 0.55, chipMode: 'duo' };
  };

  // --- Main tick: update lyric text + aura + score + timeline ---
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
      scoreTarget = 1000000;
      scoreDisplayed = 1000000;
      lastScoreShown = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');

      // Reset all timeline dots
      const dots = document.querySelectorAll('#ko-timeline .ko-tl-dot');
      dots.forEach(d => { d.classList.remove('played'); d.classList.remove('active'); });
      lastPlayedDotIdx = -1;
      lastActiveDotIdx = -1;

      // Paint the initial score display so it doesn't sit at "0000000"
      // until the first line lands.
      const sv0 = document.getElementById('ko-score-val');
      if (sv0) sv0.textContent = String(scoreDisplayed).padStart(7, '0');
      lastScoreShown = scoreDisplayed;
    }

    // ---- Progress + timeline update (rate-limited) ----
    if (song && songDur > 0) {
      const now = performance.now();
      if (now - lastProgWriteAt >= 140) {
        lastProgWriteAt = now;
        const progFrac = Math.max(0, Math.min(1, inSong / songDur));
        lyrics.style.setProperty('--ko-progress-frac', progFrac.toFixed(4));

        // Active dot index
        const activeIdx = Math.min(TL_DOT_COUNT - 1,
          Math.floor(progFrac * TL_DOT_COUNT));
        if (activeIdx !== lastActiveDotIdx) {
          const dots = document.querySelectorAll('#ko-timeline .ko-tl-dot');
          if (lastActiveDotIdx >= 0 && dots[lastActiveDotIdx]) {
            dots[lastActiveDotIdx].classList.remove('active');
          }
          if (dots[activeIdx]) dots[activeIdx].classList.add('active');
          lastActiveDotIdx = activeIdx;
        }
        // Mark all dots up to activeIdx-1 as played (one-time write per dot)
        if (activeIdx - 1 > lastPlayedDotIdx) {
          const dots = document.querySelectorAll('#ko-timeline .ko-tl-dot');
          for (let i = Math.max(0, lastPlayedDotIdx + 1); i < activeIdx; i++) {
            if (dots[i]) dots[i].classList.add('played');
          }
          lastPlayedDotIdx = activeIdx - 1;
        }

        // Smooth score chase (~5% per tick toward target)
        if (scoreDisplayed !== scoreTarget) {
          const diff = scoreTarget - scoreDisplayed;
          const step = Math.sign(diff) * Math.max(1, Math.abs(diff) * 0.18);
          scoreDisplayed = Math.abs(diff) < 1
            ? scoreTarget
            : Math.round(scoreDisplayed + step);
          if (scoreDisplayed !== lastScoreShown) {
            const sv = document.getElementById('ko-score-val');
            if (sv) sv.textContent = String(scoreDisplayed).padStart(7, '0');
            lastScoreShown = scoreDisplayed;
          }
        }

        // Decay the line-pulse var (set to 1 on new line, drop back to 0)
        const curPulse = parseFloat(
          lyrics.style.getPropertyValue('--ko-line-pulse') || '0');
        if (curPulse > 0.01) {
          lyrics.style.setProperty('--ko-line-pulse',
            Math.max(0, curPulse - 0.18).toFixed(3));
        }
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
        const lineChanged = (lineIdx !== curLineIdx);
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

        // ---- Character detection + aura update + chip + pulse ----
        // (only when a NEW line lands AND we have non-empty text — empty
        // showText means we're between lines, so leave the aura at last state
        // rather than collapsing to balanced mid-bar)
        if (lineChanged && showText) {
          const det = detectCharacter(showText);
          lyrics.style.setProperty('--ko-miku-power', det.miku.toFixed(3));
          lyrics.style.setProperty('--ko-coral-power', det.coral.toFixed(3));

          if (det.chipMode !== lastChipMode) {
            const chip = document.getElementById('ko-chip');
            if (chip) {
              chip.classList.remove('miku', 'teto', 'both', 'kor');
              if (det.chipMode === 'miku') {
                chip.classList.add('miku');
                chip.textContent = '♪ MIKU';
              } else if (det.chipMode === 'teto') {
                chip.classList.add('teto');
                chip.textContent = 'TETO ♪';
              } else if (det.chipMode === 'both') {
                chip.classList.add('both');
                chip.textContent = '♪ DUET ♪';
              } else if (det.chipMode === 'kor') {
                chip.classList.add('kor');
                chip.textContent = '★ FAN ★';
              } else {
                chip.textContent = 'DUO';
              }
            }
            lastChipMode = det.chipMode;
          }

          // Score: bump target by per-line amount
          scoreTarget += SCORE_PER_LINE;
          // Trigger line pulse
          lyrics.style.setProperty('--ko-line-pulse', '1');
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

})();
