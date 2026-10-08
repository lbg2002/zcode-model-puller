/**
 * ZCode Theme Manager - opt-in, renderer-only theme overlays.
 * Preserves the official theme preference and does not access provider data.
 * MIT. Part of lbg2002/zcode-model-puller Linux extension.
 */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const VERSION = '1.0.0';
  const STORAGE_KEY = 'zcode-puller-theme-v1';
  const COLOR_KEYS = ['background', 'sidebar', 'panel', 'card', 'foreground', 'accent', 'border'];
  const LABELS = { background: '主背景', sidebar: '侧边栏', panel: '面板 / 顶栏', card: '卡片', foreground: '正文文字', accent: '强调颜色', border: '边框' };
  const PRESETS = Object.freeze({
    'tokyo-night': { name: 'Tokyo Night', desc: '深蓝沉静，适合长时间编程', mode: 'dark', colors: { background: '#1A1B26', sidebar: '#16161E', panel: '#24283B', card: '#292E42', foreground: '#C0CAF5', accent: '#7AA2F7', border: '#414868' } },
    'catppuccin-mocha': { name: 'Catppuccin Mocha', desc: '柔和紫灰，层次轻盈', mode: 'dark', colors: { background: '#1E1E2E', sidebar: '#181825', panel: '#313244', card: '#313244', foreground: '#CDD6F4', accent: '#CBA6F7', border: '#45475A' } },
    'github-dimmed': { name: 'GitHub Dimmed', desc: '柔和石板灰，阅读舒适', mode: 'dark', colors: { background: '#22272E', sidebar: '#1C2128', panel: '#2D333B', card: '#2D333B', foreground: '#ADBAC7', accent: '#539BF5', border: '#444C56' } },
    'nord': { name: 'Nord', desc: '北欧冷色，清晰克制', mode: 'dark', colors: { background: '#2E3440', sidebar: '#242933', panel: '#3B4252', card: '#434C5E', foreground: '#ECEFF4', accent: '#88C0D0', border: '#4C566A' } },
    'solarized-light': { name: 'Solarized Light', desc: '温润米白，适合日间使用', mode: 'light', colors: { background: '#FDF6E3', sidebar: '#EEE8D5', panel: '#F5EFD9', card: '#FFFBED', foreground: '#586E75', accent: '#268BD2', border: '#D8CFB9' } },
    'paper': { name: 'Paper', desc: '中性纸白，排版干净', mode: 'light', colors: { background: '#F7F8FA', sidebar: '#EBEEF3', panel: '#FFFFFF', card: '#FFFFFF', foreground: '#273244', accent: '#4361EE', border: '#D8DEE9' } },
  });
  const DEFAULT_PRESET = 'tokyo-night';
  const HEX = /^#[0-9a-f]{6}$/i;
  const root = document.documentElement;
  const isHex = (s) => typeof s === 'string' && HEX.test(s);
  const clone = (p) => ({ ...p, colors: { ...p.colors } });
  const valid = (obj) => {
    if (!obj || typeof obj !== 'object' || !(obj.preset in PRESETS)) return null;
    if (obj.custom !== true) return { preset: obj.preset, custom: false, colors: { ...PRESETS[obj.preset].colors } };
    if (!obj.colors || COLOR_KEYS.some((key) => !isHex(obj.colors[key]))) return null;
    return { preset: obj.preset, custom: true, colors: Object.fromEntries(COLOR_KEYS.map((key) => [key, obj.colors[key].toUpperCase()])) };
  };
  const readStored = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? valid(JSON.parse(raw)) : null;
    } catch (_error) { return null; }
  };
  const persist = (p) => {
    try { if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); else localStorage.removeItem(STORAGE_KEY); return true; }
    catch (_error) { return false; }
  };
  const makePreset = (id) => ({ preset: id, custom: false, colors: { ...PRESETS[id].colors } });
  let committed = readStored();
  let draft = null;
  let modal = null;
  let launcher = null;
  let lastFocus = null;

  const tokens = `
    html[data-zpt-theme-active="true"] {
      --color-background: var(--zpt-background) !important;
      --color-background-alt: var(--zpt-sidebar) !important;
      --color-sidebar: var(--zpt-sidebar) !important;
      --color-panel: var(--zpt-panel) !important;
      --color-header: var(--zpt-panel) !important;
      --color-surface: var(--zpt-card) !important;
      --color-card: var(--zpt-card) !important;
      --color-card-selected: var(--zpt-panel) !important;
      --color-foreground: var(--zpt-foreground) !important;
      --color-brand: var(--zpt-accent) !important;
      --color-icon-blue: var(--zpt-accent) !important;
      --color-ring: var(--zpt-accent) !important;
      --color-border: var(--zpt-border) !important;
      --color-input: var(--zpt-border) !important;
      --color-muted-foreground: var(--zpt-foreground-muted) !important;
      --color-accent: var(--zpt-highlight) !important;
      --color-surface-hover: var(--zpt-highlight) !important;
      --color-sidebar-border: var(--zpt-border) !important;
    }
    #zpt-launcher { position: fixed; bottom: 20px; right: 20px; z-index: 90000; min-width: 44px; height: 44px; padding: 0 12px; display: flex; align-items: center; gap: 8px; justify-content: center; border-radius: 14px; color: #e9efff; background: #252a38; border: 1px solid #626b81; box-shadow: 0 8px 25px #0004; font: 600 12px/1.2 system-ui,sans-serif; cursor: pointer; transition: transform .15s, background .15s; }
    #zpt-launcher:hover { transform: translateY(-2px); background: #343c50; }
    #zpt-launcher:focus-visible, .zpt-overlay button:focus-visible, .zpt-overlay input:focus-visible { outline: 2px solid #80bfff; outline-offset: 3px; }
    #zpt-launcher svg { width: 19px; height: 19px; flex-shrink: 0; }
    .zpt-overlay, .zpt-overlay * { box-sizing: border-box; }
    .zpt-overlay { position: fixed; inset: 0; z-index: 950000; display: flex; align-items: center; justify-content: center; background: #0009; backdrop-filter: blur(7px); padding: 20px; font-family: system-ui,-apple-system,"Noto Sans CJK SC",sans-serif; color: #e6eaf4; }
    .zpt-dialog { width: min(840px,100%); max-height: min(90vh,820px); overflow: auto; background: #191d29; border: 1px solid #465067; border-radius: 20px; box-shadow: 0 30px 90px #0009; }
    .zpt-header { display: flex; align-items: start; justify-content: space-between; gap: 16px; padding: 25px 27px 18px; border-bottom: 1px solid #333b4e; }
    .zpt-eyebrow { color: #8fa8d6; font-size: 11px; font-weight: 700; letter-spacing: .1em; }
    .zpt-header h2 { color: #f4f6fc; font-size: 20px; margin: 5px 0 6px; font-weight: 700; }
    .zpt-note { color: #a3b0c7; font-size: 12px; line-height: 1.7; margin: 0; }
    .zpt-close { background: transparent; color: #bfc9db; border: 1px solid #454d60; border-radius: 9px; width: 32px; height: 32px; cursor: pointer; font-size: 21px; }
    .zpt-content { display: grid; grid-template-columns: minmax(0,1.3fr) minmax(245px,1fr); gap: 22px; padding: 22px 27px 26px; }
    .zpt-heading { display: flex; justify-content: space-between; color: #e8ecf6; font-weight: 650; font-size: 13px; margin: 0 0 12px; }
    .zpt-presets { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 11px; }
    .zpt-preset { position: relative; text-align: left; padding: 12px; color: #e7edf7; background: #242b3a; border: 1px solid #465068; border-radius: 12px; cursor: pointer; }
    .zpt-preset:hover { border-color: #8a9bbb; }
    .zpt-preset[aria-pressed="true"] { border-color: #9ac6ff; box-shadow: 0 0 0 1px #9ac6ff inset; }
    .zpt-swatch { display: flex; overflow: hidden; border-radius: 6px; height: 35px; margin-bottom: 10px; border: 1px solid #ffffff21; }
    .zpt-swatch span { flex: 1; }
    .zpt-preset strong { display: block; font-size: 12px; }
    .zpt-preset small { display: block; color: #acbbd0; font-size: 11px; margin-top: 4px; line-height: 1.45; }
    .zpt-editor { border-radius: 14px; background: #222939; border: 1px solid #414b61; padding: 15px; }
    .zpt-colors { display: grid; gap: 8px; }
    .zpt-color-row { display: flex; align-items: center; gap: 10px; justify-content: space-between; color: #d4ddec; font-size: 12px; }
    .zpt-color-row input { width: 39px; height: 29px; padding: 2px; background: #303a4c; border: 1px solid #64718b; border-radius: 7px; cursor: pointer; }
    .zpt-color-value { min-width: 74px; text-align: right; font-size: 11px; color: #a8b5ca; font-family: ui-monospace,monospace; }
    .zpt-preview { border-radius: 10px; margin-top: 15px; border: 1px solid var(--preview-border); padding: 13px; color: var(--preview-foreground); background: var(--preview-background); }
    .zpt-preview-top { display: flex; align-items: center; gap: 6px; font-size: 11px; }
    .zpt-preview-dot { width: 8px; height: 8px; background: var(--preview-accent); border-radius: 50%; }
    .zpt-preview-pane { display: flex; gap: 7px; margin-top: 12px; }
    .zpt-preview-sidebar { flex: 0 0 28%; min-height: 43px; background: var(--preview-sidebar); border-radius: 5px; }
    .zpt-preview-card { flex: 1; padding: 9px; background: var(--preview-card); border: 1px solid var(--preview-border); border-radius: 5px; font-size: 10px; }
    .zpt-preview-btn { display: inline-block; background: var(--preview-accent); color: var(--preview-background); border-radius: 3px; margin-top: 5px; padding: 3px 6px; }
    .zpt-footer { padding: 17px 27px; border-top: 1px solid #343d52; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .zpt-actions { display: flex; gap: 9px; }
    .zpt-btn { padding: 10px 14px; border-radius: 10px; border: 1px solid #59647d; background: #293144; color: #eaf0ff; cursor: pointer; font-weight: 650; font-size: 12px; }
    .zpt-btn:hover { filter: brightness(1.15); }
    .zpt-primary { background: #82aaff; color: #101727; border-color: #82aaff; }
    .zpt-reset { color: #cad5e9; }
    .zpt-status { min-height: 15px; color: #a8b9d6; font-size: 11px; }
    @media(max-width: 650px) { .zpt-dialog { max-height: 92vh; }.zpt-content { grid-template-columns: 1fr; padding: 16px; } .zpt-header { padding: 19px 16px 13px; }.zpt-footer { padding: 14px 16px; } #zpt-launcher { right: 12px; bottom: 12px; }.zpt-presets { grid-template-columns: repeat(2,minmax(0,1fr)); } }
    @media(prefers-reduced-motion: reduce) { #zpt-launcher { transition: none; } }
  `;
  function setupCss() {
    if (document.getElementById('zpt-theme-styles')) return;
    const sheet = document.createElement('style'); sheet.id = 'zpt-theme-styles'; sheet.textContent = tokens;
    (document.head || document.documentElement).appendChild(sheet);
  }
  function applyTheme(p) {
    if (!p) {
      root.removeAttribute('data-zpt-theme-active');
      root.removeAttribute('data-zpt-theme-preset');
      for (const key of COLOR_KEYS) root.style.removeProperty('--zpt-' + key);
      root.style.removeProperty('--zpt-foreground-muted');
      root.style.removeProperty('--zpt-highlight');
    } else {
      for (const key of COLOR_KEYS) root.style.setProperty('--zpt-' + key, p.colors[key]);
      root.style.setProperty('--zpt-foreground-muted', p.colors.foreground + 'B8');
      root.style.setProperty('--zpt-highlight', p.colors.accent + '22');
      root.setAttribute('data-zpt-theme-active', 'true');
      root.setAttribute('data-zpt-theme-preset', p.preset);
    }
    if (launcher) launcher.title = p ? `主题管理 · ${PRESETS[p.preset].name}` : '主题管理 · 官方默认';
  }
  const palette = (theme) => theme ? theme.colors : PRESETS[DEFAULT_PRESET].colors;
  function presetMarkup(id, p) {
    const swatches = [p.colors.background,p.colors.sidebar,p.colors.panel,p.colors.accent];
    return `<button class="zpt-preset" type="button" data-preset="${id}" aria-pressed="false"><span class="zpt-swatch" aria-hidden="true">${swatches.map((c) => `<span style="background:${c}"></span>`).join('')}</span><strong>${p.name}</strong><small>${p.desc}</small></button>`;
  }
  function previewAndControls() {
    if (!modal || !draft) return;
    for (const node of modal.querySelectorAll('[data-preset]')) {
      node.setAttribute('aria-pressed', String(node.dataset.preset === draft.preset));
    }
    for (const key of COLOR_KEYS) {
      const input = modal.querySelector(`[data-color="${key}"]`);
      if (input) input.value = draft.colors[key];
      const output = modal.querySelector(`[data-value="${key}"]`);
      if (output) output.textContent = draft.colors[key];
    }
    const preview = modal.querySelector('.zpt-preview');
    if (preview) for (const key of COLOR_KEYS) preview.style.setProperty('--preview-' + key, draft.colors[key]);
    const status = modal.querySelector('.zpt-status');
    if (status) status.textContent = draft.custom ? '自定义配色 · 修改立即预览，点击应用后保存' : PRESETS[draft.preset].desc + ' · 修改立即预览';
  }
  function closeModal(commit = false) {
    if (!modal) return;
    if (commit) {
      const clean = draft ? valid(draft) : null;
      if (clean && persist(clean)) committed = clone(clean);
      else if (clean) console.warn('[ZCode Theme Manager] Theme settings could not be saved');
    }
    modal.remove(); modal = null; draft = null;
    applyTheme(committed);
    if (lastFocus?.isConnected) lastFocus.focus(); else launcher?.focus();
  }
  function resetToOfficial() {
    persist(null);
    committed = null;
    draft = null;
    closeModal();
    applyTheme(null);
  }
  function openModal() {
    if (modal) return;
    lastFocus = document.activeElement;
    draft = committed ? clone(committed) : makePreset(DEFAULT_PRESET);
    modal = document.createElement('div');
    modal.className = 'zpt-overlay';
    modal.innerHTML = `
      <section class="zpt-dialog" role="dialog" aria-modal="true" aria-labelledby="zpt-title">
        <header class="zpt-header"><div><div class="zpt-eyebrow">ZCODE · APPEARANCE</div><h2 id="zpt-title">主题管理器</h2><p class="zpt-note">6 套预设 · 自定义颜色 · 即时预览 · 恢复官方主题</p></div><button class="zpt-close" aria-label="关闭并取消预览" type="button">×</button></header>
        <div class="zpt-content"><section aria-label="主题预设"><div class="zpt-heading">配色预设</div><div class="zpt-presets">${Object.entries(PRESETS).map(([id, p]) => presetMarkup(id, p)).join('')}</div><p class="zpt-note" style="margin-top:13px">部分明暗模式专用的组件仍由 ZCode 本身控制；浅色主题建议搭配 ZCode 官方浅色模式。</p></section>
        <section aria-label="自定义颜色"><div class="zpt-heading">精细调色 <span style="color:#9daec7;font-weight:400">支持实时预览</span></div><div class="zpt-editor"><div class="zpt-colors">${COLOR_KEYS.map((k) => `<label class="zpt-color-row" for="zpt-color-${k}"><span>${LABELS[k]}</span><span style="display:flex;align-items:center;gap:7px"><span class="zpt-color-value" data-value="${k}"></span><input type="color" id="zpt-color-${k}" data-color="${k}" aria-label="${LABELS[k]}"></span></label>`).join('')}</div><div class="zpt-preview" aria-label="模拟界面预览"><div class="zpt-preview-top"><i class="zpt-preview-dot"></i> ZCode · Preview</div><div class="zpt-preview-pane"><div class="zpt-preview-sidebar"></div><div class="zpt-preview-card">AI Workspace<br><span class="zpt-preview-btn">Continue →</span></div></div></div></div></section></div>
        <footer class="zpt-footer"><button type="button" class="zpt-btn zpt-reset">恢复官方默认</button><div class="zpt-actions"><button type="button" class="zpt-btn zpt-cancel">取消</button><button type="button" class="zpt-btn zpt-primary">应用主题</button></div><div class="zpt-status" aria-live="polite" style="flex-basis:100%"></div></footer>
      </section>`;
    document.body.appendChild(modal);
    const setPreset = (id) => { draft = makePreset(id); applyTheme(draft); previewAndControls(); };
    modal.querySelectorAll('[data-preset]').forEach((node) => node.addEventListener('click', () => setPreset(node.dataset.preset)));
    modal.querySelectorAll('[data-color]').forEach((node) => node.addEventListener('input', () => {
      const { color } = node.dataset;
      if (COLOR_KEYS.includes(color) && isHex(node.value)) {
        draft.colors[color] = node.value.toUpperCase(); draft.custom = true;
        applyTheme(draft); previewAndControls();
      }
    }));
    modal.querySelector('.zpt-close').addEventListener('click', () => closeModal());
    modal.querySelector('.zpt-cancel').addEventListener('click', () => closeModal());
    modal.querySelector('.zpt-primary').addEventListener('click', () => closeModal(true));
    modal.querySelector('.zpt-reset').addEventListener('click', resetToOfficial);
    modal.addEventListener('mousedown', (event) => { if (event.target === modal) closeModal(); });
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closeModal(); return; }
      if (event.key !== 'Tab') return;
      const focusables = [...modal.querySelectorAll('button:not(:disabled),input:not(:disabled)')];
      if (!focusables.length) return;
      if (event.shiftKey && document.activeElement === focusables[0]) { focusables.at(-1).focus(); event.preventDefault(); }
      else if (!event.shiftKey && document.activeElement === focusables.at(-1)) { focusables[0].focus(); event.preventDefault(); }
    });
    applyTheme(draft);
    previewAndControls();
    modal.querySelector('.zpt-close').focus();
  }
  function start() {
    if (window.__ZCODE_THEME_MANAGER_LOADED__) return;
    window.__ZCODE_THEME_MANAGER_LOADED__ = VERSION;
    setupCss();
    launcher = document.createElement('button');
    launcher.id = 'zpt-launcher'; launcher.type = 'button';
    launcher.setAttribute('aria-label', '打开 ZCode 主题管理器');
    launcher.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 8h.01M15 7h.01M17 13h.01M9 16h.01"/><path d="M13 17c0 2 4 3 4 0"/></svg><span>主题</span>`;
    launcher.addEventListener('click', openModal);
    document.body.appendChild(launcher);
    applyTheme(committed);
  }
  // Lightweight test hook; tests set this before importing to avoid mounting any UI.
  if (window.__ZPT_TEST_MODE__) {
    window.__ZPT_TEST_API__ = { PRESETS, COLOR_KEYS, valid, makePreset, readStored, persist, applyTheme, isHex, getCommitted: () => committed };
    return;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
