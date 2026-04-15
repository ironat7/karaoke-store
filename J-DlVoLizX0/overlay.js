// ============================================================================
// KARAOKE OVERLAY — ZAKO (FUWAMOCO cover) · "The Text Thread"
// ----------------------------------------------------------------------------
// The MV is a flat pastel-pink chibi animation of FUWAMOCO (Hololive-EN Advent
// twins) taunting the viewer — MOCOCO in pink, FUWAWA in blue, phones as a
// recurring prop, mesugaki/bratty-girl energy throughout.
//
// Signature feature: the overlay is a phone-chat UI. The header panel is a
// chat thread with the twin avatars; lyrics slam in at center as alternating
// pink/blue chat bubbles with a speech-tail that flips sides per line. Each
// new line fires a wobble-overshoot keyframe so the bubble lands like someone
// angrily tapping send, with scattered stickers pulsing around it.
// ============================================================================

(() => {

  const THEME = {
    headerTag: 'FUWAMOCO',

    fontsHref: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=M+PLUS+Rounded+1c:wght@500;700;800;900&family=Zen+Maru+Gothic:wght@500;700;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
    fontDisplay: '"Fredoka", sans-serif',
    fontBody:    '"Plus Jakarta Sans", sans-serif',
    fontJP:      '"Zen Maru Gothic", "M PLUS Rounded 1c", sans-serif',
    fontJPChat:  '"M PLUS Rounded 1c", "Zen Maru Gothic", sans-serif',

    bgCream:   '#FEF3E8',
    bgBlush:   '#FBDDE7',
    pink:      '#FF8AB2',
    pinkSoft:  '#FFD4E2',
    pinkDeep:  '#D45182',
    pinkInk:   '#461628',
    blue:      '#8FB9ED',
    blueSoft:  '#D4E3F7',
    blueDeep:  '#416FA8',
    blueInk:   '#16234D',
    plum:      '#4C2935',
    plumSoft:  '#7B4A5F',
    creamInk:  '#5A3A2F',

    wcColors: ['#E3316D', '#1F6AB3', '#C87717', '#2E8E52', '#8A2FB8', '#BC4828'],
  };

  const policy = window.__karaokePolicy || (window.__karaokePolicy =
    window.trustedTypes.createPolicy('karaoke-policy', {
      createHTML: s => s,
      createScript: s => s,
    }));

  window.__setlist         = window.__setlist         || [];
  window.__parsedLyrics    = window.__parsedLyrics    || {};
  window.__transCache      = window.__transCache      || {};
  window.__plainLyrics     = window.__plainLyrics     || {};
  window.__lyricOffsets    = window.__lyricOffsets    || {};
  window.__wordAlign = window.__wordAlign || { colors: THEME.wcColors, data: {} };
  window.__wordAlign.colors = THEME.wcColors;
  if (typeof window.__karaokeLyricsHidden !== 'boolean') window.__karaokeLyricsHidden = false;

  window.__koGen = (window.__koGen || 0) + 1;
  const MY_GEN = window.__koGen;

  window.__koMaxHold    = window.__koMaxHold    || 10;
  window.__koPanelWidth = window.__koPanelWidth || 340;
  window.__koPanelPad   = window.__koPanelPad   || 20;

  document.querySelectorAll('#ko-style').forEach(e => e.remove());
  document.querySelectorAll('#karaoke-root').forEach(e => e.remove());
  document.querySelectorAll('#ko-lyrics').forEach(e => e.remove());

  if (!document.querySelector('link[data-karaoke-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = THEME.fontsHref;
    l.setAttribute('data-karaoke-font', '1');
    document.head.appendChild(l);
  }

  const style = document.createElement('style');
  style.id = 'ko-style';
  style.textContent = `
    #claude-agent-glow-border { display: none !important; }

    #karaoke-root {
      position: fixed; inset: 0;
      pointer-events: none;
      z-index: 2147483000;
    }

    #karaoke-root, #ko-lyrics {
      --ko-cream:     ${THEME.bgCream};
      --ko-blush:     ${THEME.bgBlush};
      --ko-pink:      ${THEME.pink};
      --ko-pink-soft: ${THEME.pinkSoft};
      --ko-pink-deep: ${THEME.pinkDeep};
      --ko-pink-ink:  ${THEME.pinkInk};
      --ko-blue:      ${THEME.blue};
      --ko-blue-soft: ${THEME.blueSoft};
      --ko-blue-deep: ${THEME.blueDeep};
      --ko-blue-ink:  ${THEME.blueInk};
      --ko-plum:      ${THEME.plum};
      --ko-plum-soft: ${THEME.plumSoft};

      --ko-font-display: ${THEME.fontDisplay};
      --ko-font-body:    ${THEME.fontBody};
      --ko-font-jp:      ${THEME.fontJP};
      --ko-font-jp-chat: ${THEME.fontJPChat};
    }
    #karaoke-root *, #ko-lyrics * { box-sizing: border-box; }

    .ko-header {
      position: absolute;
      width: 340px;
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      background:
        radial-gradient(circle at 10% 0%, rgba(255,180,210,0.22), transparent 40%),
        radial-gradient(circle at 90% 100%, rgba(170,200,245,0.18), transparent 45%),
        linear-gradient(180deg, #FFFBF4 0%, ${THEME.bgCream} 55%, #FBE7EE 100%);
      border: 3.5px solid ${THEME.plum};
      border-radius: 38px;
      box-shadow:
        0 28px 52px -22px rgba(76, 41, 53, 0.45),
        inset 0 0 0 5px #FFFFFF;
      color: ${THEME.plum};
      overflow: hidden;
      will-change: transform;
      transform: translateY(-50%);
      font-family: var(--ko-font-body);
    }

    .ko-phone-statusbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 28px 6px;
      font-family: var(--ko-font-display);
      font-weight: 600;
      font-size: 11px;
      color: ${THEME.plum};
      letter-spacing: 0.03em;
    }
    .ko-sb-time {
      font-variant-numeric: tabular-nums;
      font-size: 13px;
      font-weight: 700;
    }
    .ko-sb-name {
      font-size: 9px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      opacity: 0.55;
    }
    .ko-sb-icons {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }
    .ko-sb-signal { display: inline-flex; align-items: flex-end; gap: 2px; }
    .ko-sb-signal i {
      width: 3px; background: ${THEME.plum}; border-radius: 1px; display: inline-block;
    }
    .ko-sb-signal i:nth-child(1){height:4px}
    .ko-sb-signal i:nth-child(2){height:6px}
    .ko-sb-signal i:nth-child(3){height:8px}
    .ko-sb-signal i:nth-child(4){height:10px}
    .ko-sb-battery {
      position: relative;
      width: 22px; height: 10px;
      border: 1.5px solid ${THEME.plum};
      border-radius: 3px;
      display: inline-block;
    }
    .ko-sb-battery::after {
      content: '';
      position: absolute;
      right: -3px; top: 2.5px;
      width: 2px; height: 3px;
      background: ${THEME.plum};
      border-radius: 0 2px 2px 0;
    }
    .ko-sb-battery::before {
      content: '';
      position: absolute;
      left: 1.5px; top: 1.5px; bottom: 1.5px;
      width: 80%;
      background: ${THEME.pink};
      border-radius: 1.5px;
    }

    .ko-chat-header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 12px 22px 14px;
      border-bottom: 2px dashed rgba(76, 41, 53, 0.18);
      position: relative;
    }
    .ko-avatar-stack {
      position: relative;
      width: 64px;
      height: 46px;
      flex-shrink: 0;
    }
    .ko-avatar {
      position: absolute;
      width: 42px; height: 42px;
      border-radius: 50%;
      border: 3px solid ${THEME.plum};
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 16px;
      color: ${THEME.plum};
      box-shadow: 0 3px 0 rgba(76,41,53,0.2);
    }
    .ko-avatar.pink {
      background: linear-gradient(155deg, #FFE8EF 0%, ${THEME.pinkSoft} 50%, #FFB9CE 100%);
      right: 0; top: 0;
      z-index: 2;
      transform: rotate(6deg);
    }
    .ko-avatar.blue {
      background: linear-gradient(155deg, #E8F0FB 0%, ${THEME.blueSoft} 50%, #A8C8F5 100%);
      left: 0; top: 2px;
      z-index: 1;
      transform: rotate(-8deg);
    }
    .ko-avatar-ear {
      position: absolute;
      top: -6px;
      width: 10px;
      height: 10px;
      background: inherit;
      border: 3px solid ${THEME.plum};
      border-bottom: 0; border-right: 0;
      border-radius: 2px 8px 0 0;
    }
    .ko-avatar-ear.l { left: 6px; transform: rotate(-18deg); }
    .ko-avatar-ear.r { right: 6px; transform: rotate(18deg); }

    .ko-chat-identity { min-width: 0; }
    .ko-now-title {
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 24px;
      line-height: 1.0;
      color: ${THEME.plum};
      letter-spacing: -0.01em;
      margin: 0 0 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ko-now-title::after {
      content: '♡';
      font-size: 16px;
      color: ${THEME.pink};
      animation: zako-heartpulse 1.4s ease-in-out infinite;
    }
    @keyframes zako-heartpulse {
      0%, 100% { transform: scale(1); }
      50%      { transform: scale(1.22); }
    }
    .ko-now-meaning {
      font-family: var(--ko-font-jp-chat);
      font-weight: 700;
      font-size: 13px;
      line-height: 1.25;
      color: ${THEME.plumSoft};
      margin: 0 0 2px;
      letter-spacing: 0.02em;
    }
    .ko-now-meaning.empty { display: none; }
    .ko-now-artist {
      font-family: var(--ko-font-body);
      font-weight: 600;
      font-size: 9.5px;
      color: ${THEME.plumSoft};
      letter-spacing: 0.04em;
      line-height: 1.3;
    }
    .ko-online-dot {
      width: 12px; height: 12px;
      border-radius: 50%;
      background: #66D07C;
      border: 2.5px solid ${THEME.plum};
      align-self: start;
      margin-top: 4px;
      box-shadow: 0 0 0 3px rgba(102,208,124,0.25);
      animation: zako-onlinepulse 2s ease-in-out infinite;
    }
    @keyframes zako-onlinepulse {
      0%,100% { box-shadow: 0 0 0 3px rgba(102,208,124,0.25); }
      50%     { box-shadow: 0 0 0 6px rgba(102,208,124,0.1); }
    }

    .ko-chat-body {
      padding: 16px 22px 10px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .ko-typing-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .ko-typing-bubble {
      padding: 10px 14px;
      background: ${THEME.pinkSoft};
      border: 2.5px solid ${THEME.pinkDeep};
      border-radius: 20px 20px 20px 6px;
      display: inline-flex;
      gap: 5px;
      box-shadow: 0 3px 0 rgba(212, 81, 130, 0.22);
    }
    .ko-typing-bubble i {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: ${THEME.pinkDeep};
      display: inline-block;
      animation: zako-typing 1.2s ease-in-out infinite;
    }
    .ko-typing-bubble i:nth-child(2) { animation-delay: 0.15s; }
    .ko-typing-bubble i:nth-child(3) { animation-delay: 0.3s; }
    @keyframes zako-typing {
      0%, 100% { transform: translateY(0); opacity: 0.5; }
      50%      { transform: translateY(-4px); opacity: 1; }
    }
    .ko-typing-label {
      font-family: var(--ko-font-body);
      font-size: 10px;
      font-weight: 600;
      color: ${THEME.plumSoft};
      letter-spacing: 0.06em;
    }

    .ko-now-progress {
      position: relative;
      height: 8px;
      background: rgba(76, 41, 53, 0.1);
      border: 2px solid ${THEME.plum};
      border-radius: 999px;
      overflow: hidden;
    }
    .ko-now-fill {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: 0%;
      background: linear-gradient(90deg, ${THEME.blue} 0%, ${THEME.pink} 100%);
      border-radius: 999px;
      transition: width 0.3s linear;
    }
    .ko-now-times {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      font-family: var(--ko-font-display);
      font-size: 10px;
      font-weight: 700;
      color: ${THEME.plumSoft};
      letter-spacing: 0.06em;
      font-variant-numeric: tabular-nums;
    }

    .ko-keyboard {
      display: flex;
      gap: 7px;
      padding: 6px 14px 16px;
    }
    .ko-ctrl {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 10px;
      background: #FFFFFF;
      border: 2.5px solid ${THEME.plum};
      border-radius: 14px;
      min-width: 0;
      cursor: pointer;
      user-select: none;
      box-shadow: 0 3px 0 ${THEME.plum};
      transition: transform 80ms, box-shadow 80ms;
    }
    .ko-ctrl:active {
      transform: translateY(2px);
      box-shadow: 0 1px 0 ${THEME.plum};
    }
    .ko-ctrl.is-on {
      background: ${THEME.pinkSoft};
      border-color: ${THEME.pinkDeep};
      box-shadow: 0 3px 0 ${THEME.pinkDeep};
    }
    .ko-ctrl-label {
      font-family: var(--ko-font-display);
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: ${THEME.plum};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ko-offset {
      font-family: var(--ko-font-display);
      font-size: 11px;
      font-weight: 700;
      color: ${THEME.pinkDeep};
      letter-spacing: 0.02em;
      font-variant-numeric: tabular-nums;
      flex-shrink: 0;
    }

    .ko-sticker {
      position: absolute;
      pointer-events: none;
    }
    .ko-sticker-bandaid {
      top: 12px;
      right: -12px;
      width: 48px; height: 16px;
      background: linear-gradient(90deg, #FFD4E0 0%, #FFD4E0 28%, #FFB9CE 28%, #FFB9CE 72%, #FFD4E0 72%);
      border: 2px solid ${THEME.plum};
      border-radius: 8px;
      transform: rotate(-14deg);
      box-shadow: 2px 3px 0 rgba(76,41,53,0.22);
    }
    .ko-sticker-bandaid::before {
      content: '';
      position: absolute;
      left: 5px; right: 5px;
      top: 50%;
      height: 2px;
      margin-top: -1px;
      background: repeating-linear-gradient(90deg, ${THEME.pinkDeep} 0 2px, transparent 2px 5px);
      opacity: 0.45;
    }
    .ko-sticker-cross {
      bottom: 68px;
      left: -14px;
      font-family: var(--ko-font-display);
      font-weight: 700;
      font-size: 28px;
      color: ${THEME.pink};
      text-shadow: 2px 2px 0 ${THEME.plum};
      transform: rotate(-18deg);
      line-height: 1;
    }

    #ko-lyrics {
      position: fixed;
      pointer-events: none;
      text-align: center;
      z-index: 2147483100;
      transform: translate(-50%, -50%);
    }
    #ko-lyrics .ko-slot {
      position: relative;
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 30px 56px 32px;
      border: 5px solid var(--ko-bubble-ink, ${THEME.pinkDeep});
      border-radius: 44px;
      background: var(--ko-bubble-fill, ${THEME.pinkSoft});
      box-shadow:
        0 14px 0 0 rgba(76, 41, 53, 0.18),
        0 22px 48px -16px rgba(76, 41, 53, 0.55),
        inset 0 3px 0 rgba(255, 255, 255, 0.75);
      max-width: 100%;
      transform-origin: center bottom;
    }
    #ko-lyrics .ko-slot::before,
    #ko-lyrics .ko-slot::after {
      content: '';
      position: absolute;
      bottom: -22px;
      width: 28px; height: 28px;
      background: var(--ko-bubble-fill, ${THEME.pinkSoft});
      border: 5px solid var(--ko-bubble-ink, ${THEME.pinkDeep});
      border-top: none; border-left: none;
      transform: rotate(45deg);
      display: none;
    }
    #ko-lyrics .ko-slot.bubble-pink::after {
      display: block;
      right: 18%;
      border-radius: 0 0 8px 0;
    }
    #ko-lyrics .ko-slot.bubble-blue::before {
      display: block;
      left: 18%;
      border-radius: 0 0 0 8px;
    }
    #ko-lyrics .ko-slot.bubble-pink {
      --ko-bubble-fill: ${THEME.pinkSoft};
      --ko-bubble-ink:  ${THEME.pinkDeep};
      --ko-bubble-text: ${THEME.pinkInk};
    }
    #ko-lyrics .ko-slot.bubble-blue {
      --ko-bubble-fill: ${THEME.blueSoft};
      --ko-bubble-ink:  ${THEME.blueDeep};
      --ko-bubble-text: ${THEME.blueInk};
    }

    @keyframes zako-slam {
      0%   { transform: scale(0.55) rotate(-8deg); opacity: 0; }
      45%  { transform: scale(1.12) rotate(4deg);  opacity: 1; }
      65%  { transform: scale(0.94) rotate(-2deg); }
      85%  { transform: scale(1.02) rotate(1deg); }
      100% { transform: scale(1.00) rotate(0deg); }
    }
    #ko-lyrics .ko-slot.fire {
      animation: zako-slam 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes zako-bob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-3px); }
    }
    #ko-lyrics .ko-slot:not(.fire):not(.empty) {
      animation: zako-bob 2.6s ease-in-out infinite;
    }

    .ko-bubble-stickers {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .ko-bsticker {
      position: absolute;
      font-family: var(--ko-font-display);
      font-weight: 700;
    }
    .ko-bsticker.heart-tr {
      top: -26px; right: -12px;
      font-size: 36px; color: ${THEME.pink};
      text-shadow: 3px 3px 0 ${THEME.plum};
      transform: rotate(18deg);
      animation: zako-sticker-a 2.8s ease-in-out infinite;
    }
    .ko-bsticker.heart-bl {
      bottom: -16px; left: -22px;
      font-size: 30px; color: ${THEME.blue};
      text-shadow: 3px 3px 0 ${THEME.plum};
      transform: rotate(-14deg);
      animation: zako-sticker-b 3.2s ease-in-out infinite;
    }
    .ko-bsticker.cross-tl {
      top: -22px; left: -18px;
      font-size: 32px;
      color: ${THEME.pinkDeep};
      text-shadow: 3px 3px 0 ${THEME.plum};
      transform: rotate(-20deg);
      animation: zako-sticker-b 2.4s ease-in-out infinite;
    }
    .ko-bsticker.star-br {
      bottom: -4px; right: -28px;
      font-size: 28px;
      color: ${THEME.blueDeep};
      text-shadow: 3px 3px 0 ${THEME.plum};
      transform: rotate(16deg);
      animation: zako-sticker-a 3.6s ease-in-out infinite;
    }
    .ko-bsticker.zako-stamp {
      top: -40px;
      left: 50%;
      transform: translateX(-50%) rotate(-6deg);
      padding: 5px 16px;
      font-family: var(--ko-font-jp-chat);
      font-weight: 900;
      font-size: 16px;
      background: ${THEME.plum};
      color: #FFEEF5;
      border-radius: 4px;
      letter-spacing: 0.14em;
      opacity: 0.92;
      box-shadow: 2px 3px 0 rgba(0,0,0,0.22);
      white-space: nowrap;
    }
    @keyframes zako-sticker-a {
      0%,100% { transform: rotate(18deg)  translateY(0)   scale(1); }
      50%     { transform: rotate(24deg)  translateY(-4px) scale(1.08); }
    }
    @keyframes zako-sticker-b {
      0%,100% { transform: rotate(-14deg) translateY(0)   scale(1); }
      50%     { transform: rotate(-20deg) translateY(-3px) scale(1.1); }
    }

    #ko-lyrics .ko-line-jp {
      font-family: var(--ko-font-jp);
      font-weight: 900;
      color: var(--ko-bubble-text, ${THEME.pinkInk});
      font-size: 46px;
      line-height: 2.1;
      padding-top: 0.4em;
      letter-spacing: 0.02em;
      min-height: 1em;
      order: 1;
      text-shadow: 0 2px 0 rgba(255,255,255,0.45);
    }
    #ko-lyrics .ko-line-jp span {
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.55));
    }
    #ko-lyrics .ko-line-jp rt {
      font-family: var(--ko-font-display);
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.01em;
      line-height: 1.1;
      padding-bottom: 6px;
      user-select: none;
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.45));
    }
    #ko-lyrics .ko-line-jp ruby { ruby-align: center; }

    #ko-lyrics .ko-line-en {
      font-family: var(--ko-font-display);
      font-weight: 600;
      color: var(--ko-bubble-text, ${THEME.pinkInk});
      font-size: 38px;
      line-height: 1.2;
      letter-spacing: 0.005em;
      max-width: 100%;
      min-height: 1em;
      order: 2;
      font-style: italic;
      text-shadow: 0 2px 0 rgba(255,255,255,0.4);
    }
    #ko-lyrics .ko-line-en span {
      filter: drop-shadow(0 1px 0 rgba(255,255,255,0.55));
    }
    #ko-lyrics .ko-line-en.en-song { font-size: 30px; font-weight: 500; font-style: normal; }
    #ko-lyrics .ko-line-jp.hidden { display: none; }

    #ko-lyrics .ko-slot.empty {
      visibility: hidden;
    }
  `;
  document.head.appendChild(style);

  const setHTML = (el, str) => { el.innerHTML = policy.createHTML(str); };
  const escHTML = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const root = document.createElement('div');
  root.id = 'karaoke-root';
  document.body.appendChild(root);

  const headerPanel = document.createElement('div');
  headerPanel.className = 'ko-header';
  setHTML(headerPanel, `
    <div class="ko-sticker ko-sticker-bandaid"></div>
    <div class="ko-sticker ko-sticker-cross">✚</div>

    <div class="ko-phone-statusbar">
      <span class="ko-sb-time">9:41</span>
      <span class="ko-sb-name">MesugakiOS 4.1</span>
      <span class="ko-sb-icons">
        <span class="ko-sb-signal"><i></i><i></i><i></i><i></i></span>
        <span class="ko-sb-battery"></span>
      </span>
    </div>

    <div class="ko-chat-header">
      <div class="ko-avatar-stack">
        <span class="ko-avatar blue">F</span>
        <span class="ko-avatar pink">M</span>
      </div>
      <div class="ko-chat-identity">
        <div class="ko-now-title" id="ko-now-title">—</div>
        <div class="ko-now-meaning empty" id="ko-now-meaning"></div>
        <div class="ko-now-artist" id="ko-now-artist">—</div>
      </div>
      <div class="ko-online-dot" title="online · taunting"></div>
    </div>

    <div class="ko-chat-body">
      <div class="ko-typing-row">
        <div class="ko-typing-bubble"><i></i><i></i><i></i></div>
        <span class="ko-typing-label">FuwaMoco is typing…</span>
      </div>
      <div>
        <div class="ko-now-progress"><div class="ko-now-fill" id="ko-now-fill"></div></div>
        <div class="ko-now-times"><span id="ko-now-cur">0:00</span><span id="ko-now-dur">0:00</span></div>
      </div>
    </div>

    <div class="ko-keyboard">
      <div class="ko-ctrl" id="ko-offset-btn">
        <div class="ko-ctrl-label">Offset</div>
        <div class="ko-offset" id="ko-offset-display">+0.0s</div>
      </div>
      <div class="ko-ctrl" id="ko-lyrics-btn">
        <div class="ko-ctrl-label">Hide</div>
      </div>
    </div>
  `);
  root.appendChild(headerPanel);

  const lyrics = document.createElement('div');
  lyrics.id = 'ko-lyrics';
  setHTML(lyrics, `
    <div class="ko-slot bubble-pink empty">
      <div class="ko-bubble-stickers">
        <span class="ko-bsticker zako-stamp">ざぁこ ♡ ZAKO</span>
        <span class="ko-bsticker heart-tr">♡</span>
        <span class="ko-bsticker heart-bl">♡</span>
        <span class="ko-bsticker cross-tl">✚</span>
        <span class="ko-bsticker star-br">✦</span>
      </div>
      <div class="ko-line-jp" id="ko-line-jp"></div>
      <div class="ko-line-en" id="ko-line-en"></div>
    </div>
  `);
  document.body.appendChild(lyrics);

  const lyricsBtn    = document.getElementById('ko-lyrics-btn');
  const lyricsBtnLbl = lyricsBtn.querySelector('.ko-ctrl-label');
  const applyLyricsState = () => {
    lyricsBtnLbl.textContent = window.__karaokeLyricsHidden ? 'Show' : 'Hide';
    lyrics.style.display     = window.__karaokeLyricsHidden ? 'none' : '';
  };
  applyLyricsState();
  lyricsBtn.addEventListener('click', () => {
    window.__karaokeLyricsHidden = !window.__karaokeLyricsHidden;
    applyLyricsState();
  });

  const offsetBtn = document.getElementById('ko-offset-btn');
  offsetBtn.addEventListener('click', () => {
    const v = document.querySelector('video');
    if (!v) return;
    const t = v.currentTime;
    const sl = window.__setlist || [];
    for (const s of sl) {
      if (t >= s.s && t < s.end) {
        if (s.lrcId) delete window.__lyricOffsets[s.lrcId];
        break;
      }
    }
  });

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
      .then(d => { if (d && d.syncedLyrics) window.__parsedLyrics[id] = parseLRC(d.syncedLyrics); })
      .catch(() => {});
  });

  let curSongIdx = -1;
  let curLineIdx = -1;
  let lastPanelPos = '';
  let lastNowTitle = '', lastNowMeaning = '', lastNowArtist = '', lastNowCur = '', lastNowDur = '', lastFill = '';
  let lastEnText = '', lastJpText = '';
  let lastOffsetStr = '';

  const fmt = (s) => {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };

  const positionTick = () => {
    if (window.__koGen !== MY_GEN) return;
    const v = document.querySelector('video');
    if (!v) { setTimeout(positionTick, 250); return; }
    const r = v.getBoundingClientRect();
    if (r.width < 100) { setTimeout(positionTick, 250); return; }
    const PW = window.__koPanelWidth;
    const PAD = window.__koPanelPad;
    const posKey = `${r.left}|${r.top}|${r.width}|${r.height}|${PW}|${PAD}`;
    if (posKey !== lastPanelPos) {
      lastPanelPos = posKey;
      let hLeft = r.right + PAD;
      if (hLeft + PW > window.innerWidth - 8) hLeft = window.innerWidth - PW - 8;
      headerPanel.style.left = hLeft + 'px';
      headerPanel.style.top = (r.top + r.height / 2) + 'px';
      headerPanel.style.width = PW + 'px';

      lyrics.style.left     = (r.left + r.width / 2) + 'px';
      lyrics.style.top      = (r.top + r.height * 0.66) + 'px';
      lyrics.style.width    = (r.width * 0.62) + 'px';
      lyrics.style.maxWidth = (r.width * 0.62) + 'px';
    }
    setTimeout(positionTick, 250);
  };
  positionTick();

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

    if (idx !== curSongIdx) {
      curSongIdx = idx;
      curLineIdx = -1;

      const enEl = document.getElementById('ko-line-en');
      const jpEl = document.getElementById('ko-line-jp');
      if (enEl) enEl.textContent = '';
      if (jpEl) jpEl.textContent = '';
      lastEnText = ''; lastJpText = '';

      const title = song ? song.name : '—';
      let meaning = '';
      if (song) {
        const jpPart = (song.originalTitle && song.originalTitle !== song.name) ? song.originalTitle : '';
        const enPart = (song.nameEn && song.nameEn !== song.name) ? song.nameEn : '';
        meaning = jpPart && enPart ? `${jpPart} · ${enPart}` : (jpPart || enPart || '');
      }
      const artist = song ? song.artist : '—';
      const durS   = fmt(songDur);
      if (title !== lastNowTitle) {
        document.getElementById('ko-now-title').textContent = title;
        lastNowTitle = title;
      }
      if (meaning !== lastNowMeaning) {
        const mEl = document.getElementById('ko-now-meaning');
        if (mEl) {
          mEl.textContent = meaning;
          mEl.classList.toggle('empty', meaning === '');
        }
        lastNowMeaning = meaning;
      }
      if (artist !== lastNowArtist) {
        document.getElementById('ko-now-artist').textContent = artist;
        lastNowArtist = artist;
      }
      if (durS !== lastNowDur) {
        document.getElementById('ko-now-dur').textContent = durS;
        lastNowDur = durS;
      }

      if (enEl) enEl.classList.toggle('en-song', !!(song && song.lang === 'en'));
      if (jpEl) jpEl.classList.toggle('hidden',  !song || song.lang === 'en');
    }

    if (song && songDur > 0) {
      const pct = Math.max(0, Math.min(100, inSong / songDur * 100));
      const fillStr = pct.toFixed(1) + '%';
      const curS = fmt(Math.min(inSong, songDur));
      if (fillStr !== lastFill) {
        document.getElementById('ko-now-fill').style.width = fillStr;
        lastFill = fillStr;
      }
      if (curS !== lastNowCur) {
        document.getElementById('ko-now-cur').textContent = curS;
        lastNowCur = curS;
      }
    } else {
      if (lastFill !== '0.0%') {
        document.getElementById('ko-now-fill').style.width = '0%';
        lastFill = '0.0%';
      }
      if (lastNowCur !== '0:00') {
        document.getElementById('ko-now-cur').textContent = '0:00';
        lastNowCur = '0:00';
      }
    }

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

    const curOffset = song && song.lrcId ? (window.__lyricOffsets[song.lrcId] || 0) : 0;
    const sign = curOffset >= 0 ? '+' : '';
    const offsetStr = sign + curOffset.toFixed(1) + 's';
    if (offsetStr !== lastOffsetStr) {
      const el = document.getElementById('ko-offset-display');
      if (el) el.textContent = offsetStr;
      lastOffsetStr = offsetStr;
    }
  };

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

  window.__karaokeRebuild = () => {
    curLineIdx = -2;
    lastEnText = '';
    lastJpText = '';
    curSongIdx = -2;
  };

  window.__mergeTranslations = (data) => {
    const parsed = window.__parsedLyrics;
    for (const id in data) {
      if (!data.hasOwnProperty(id)) continue;
      const lines = parsed[id];
      if (!lines) continue;
      const map = data[id];
      for (const line of lines) {
        const val = map[line.t.toFixed(2)];
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

  // --- BUBBLE FIRE POLL (signature feature) ---
  // Watches JP line content. Each change flips the bubble parity (pink/blue),
  // re-triggers the slam-in keyframe via class re-add + forced reflow, and
  // toggles .empty so the bubble only shows while a lyric is active.
  let _lastSlotKey = '';
  let _bubbleParity = 0;
  const FIRE_POLL = setInterval(() => {
    if (window.__koGen !== MY_GEN) { clearInterval(FIRE_POLL); return; }
    const jpEl = document.getElementById('ko-line-jp');
    const enEl = document.getElementById('ko-line-en');
    if (!jpEl) return;
    const slot = lyrics.querySelector('.ko-slot');
    if (!slot) return;
    const jp  = jpEl.textContent;
    const en  = enEl ? enEl.textContent : '';
    const key = jp + '|' + en;
    if (key === _lastSlotKey) return;
    _lastSlotKey = key;
    const hasContent = !!(jp.trim() || en.trim());
    slot.classList.toggle('empty', !hasContent);
    if (!hasContent) {
      slot.classList.remove('fire');
      return;
    }
    _bubbleParity ^= 1;
    slot.classList.remove('bubble-pink', 'bubble-blue', 'fire');
    void slot.offsetWidth;
    slot.classList.add(_bubbleParity ? 'bubble-pink' : 'bubble-blue', 'fire');
  }, 60);

})();
