'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'zcode-theme-manager.js'), 'utf8');
function fixture(store = {}, documentOverrides = {}) {
  const props = new Map();
  const attrs = new Map();
  const classes = new Set(['dark', 'theme-zai-dark']);
  const root = {
    style: { setProperty: (k, v) => props.set(k, v), removeProperty: (k) => props.delete(k) },
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: (k) => attrs.delete(k),
    classList: {
      add: (...tokens) => tokens.forEach((t) => classes.add(t)),
      remove: (...tokens) => tokens.forEach((t) => classes.delete(t)),
      toggle: (token, force) => {
        const shouldAdd = force === undefined ? !classes.has(token) : Boolean(force);
        if (shouldAdd) classes.add(token);
        else classes.delete(token);
        return shouldAdd;
      },
      contains: (token) => classes.has(token),
    },
  };
  const storage = new Map(Object.entries(store));
  const ctx = {
    window: { __ZPT_TEST_MODE__: true },
    document: { documentElement: root, getElementById: () => null, ...documentOverrides },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.delete(k),
    },
    console,
  };
  vm.runInNewContext(SOURCE, ctx, { filename: 'zcode-theme-manager.js' });
  assert.ok(ctx.window.__ZPT_TEST_API__);
  return { ...ctx.window.__ZPT_TEST_API__, props, attrs, classes, storage };
}

test('ships ten full Chinese palette presets with line-art defaults', () => {
  const api = fixture();
  const keys = Object.keys(api.PRESETS);
  assert.equal(keys.length, 10);
  const expectedIds = [
    'mo-yun-han-xiang',
    'qian-li-jiang-shan',
    'zi-jin-zhu-qiang',
    'dun-huang-fei-tian',
    'jiang-nan-yan-yu',
    'song-yan-chen-xiang',
    'qing-hua-ci-ying',
    'xuan-zhi-shu-juan',
    'ru-yao-tian-qing',
    'yu-lu-ming-cha',
  ];
  assert.deepEqual(keys, expectedIds);
  for (const p of Object.values(api.PRESETS)) {
    assert.match(p.name, /[\u4e00-\u9fa5]{4}/, 'every preset name is a 4-character Chinese aesthetic name');
    assert.ok(p.poem && p.poem.length > 4, 'every preset has a classical Chinese poem');
    assert.ok(api.PATTERNS[p.pattern], 'every preset has a default Chinese line-art pattern');
    for (const k of api.COLOR_KEYS) assert.match(p.colors[k], /^#[0-9a-f]{6}$/i);
  }
});

test('rejects malformed and CSS-injection values across colors, patterns, and ornaments', () => {
  const api = fixture();
  const p = api.makePreset('mo-yun-han-xiang');
  assert.ok(api.valid(p));
  p.custom = true;
  p.colors.accent = 'red; background:url(https://example.com)';
  assert.equal(api.valid(p), null);
  const p2 = api.makePreset('qian-li-jiang-shan');
  p2.pattern = '<script>alert(1)</script>';
  assert.equal(api.valid(p2), null);
  const p3 = api.makePreset('qing-hua-ci-ying');
  p3.ornament = 'evil-ornament';
  assert.equal(api.valid(p3), null);
  assert.equal(api.valid({ preset: 'evil' }), null);
  assert.equal(api.valid({ preset: '__proto__' }), null);
});

test('stored custom theme survives reload and normalizes colors and line-art metadata', () => {
  const api = fixture();
  const p = api.makePreset('dun-huang-fei-tian');
  p.custom = true;
  p.pattern = 'xiang-yun';
  p.ink = 'strong';
  p.ornament = 'shuang-xian';
  p.font = 'serif';
  p.colors.accent = '#aabbcc';
  assert.equal(api.persist(p), true);
  const loaded = fixture({ 'zcode-puller-theme-v1': api.storage.get('zcode-puller-theme-v1') }).readStored();
  assert.equal(loaded.colors.accent, '#AABBCC');
  assert.equal(loaded.pattern, 'xiang-yun');
  assert.equal(loaded.ink, 'strong');
  assert.equal(loaded.ornament, 'shuang-xian');
  assert.equal(loaded.font, 'serif');
  assert.equal(loaded.custom, true);
});

test('theme overrides use scoped variables, sync document dark/light classes, and can be fully removed', () => {
  const api = fixture({ 'zcode-theme': 'zai-dark' });
  const lightTheme = api.makePreset('xuan-zhi-shu-juan');
  api.applyTheme(lightTheme);
  assert.equal(api.attrs.get('data-zpt-theme-active'), 'true');
  assert.equal(api.attrs.get('data-zpt-theme-mode'), 'light');
  assert.equal(api.attrs.get('data-zpt-theme-pattern'), 'song-feng');
  assert.equal(api.props.get('--zpt-background'), '#FAF6EE');
  assert.equal(api.props.get('--zpt-foreground-muted'), '#26221EB8');
  assert.match(api.props.get('--zpt-main-art-image'), /^url\("data:image\/svg\+xml;utf8,/);
  assert.match(api.props.get('--zpt-sidebar-art-image'), /^url\("data:image\/svg\+xml;utf8,/);
  // Even when ZCode official mode was dark, applying a light Chinese theme switches root classes to light
  assert.equal(api.classes.has('dark'), false);
  assert.equal(api.classes.has('theme-zai-light'), true);

  api.applyTheme(null);
  assert.equal(api.attrs.has('data-zpt-theme-active'), false);
  assert.equal(api.props.size, 0);
  // Restores official zcode-theme class state without mutating zcode-theme storage
  assert.equal(api.classes.has('dark'), true);
  assert.equal(api.classes.has('theme-zai-dark'), true);
});

test('bad localStorage data is ignored without errors', () => {
  const api = fixture({ 'zcode-puller-theme-v1': '{broken' });
  assert.equal(api.readStored(), null);
});

test('restoring default clears only plugin storage key', () => {
  const api = fixture({ 'zcode-theme': 'zai-dark' });
  api.persist(api.makePreset('xuan-zhi-shu-juan'));
  assert.equal(api.persist(null), true);
  assert.equal(api.storage.get('zcode-theme'), 'zai-dark');
  assert.equal(api.storage.has('zcode-puller-theme-v1'), false);
});

test('preset colors are copied, not mutated globally', () => {
  const api = fixture();
  const p = api.makePreset('mo-yun-han-xiang');
  p.colors.accent = '#010203';
  assert.equal(api.PRESETS['mo-yun-han-xiang'].colors.accent, '#E35C58');
});

test('settings entry is shown only inside ZCode Appearance settings', () => {
  assert.doesNotMatch(SOURCE, /#zpt-launcher|id=['"]zpt-launcher/);
  const card = {
    rows: [],
    querySelector(selector) {
      return selector === '#zpt-settings-row'
        ? this.rows.find((row) => row.id === 'zpt-settings-row') || null
        : null;
    },
    appendChild(row) {
      this.rows.push(row);
    },
  };
  let appearanceVisible = false;
  let buttonClick;
  let created = 0;
  const summary = { textContent: '' };
  const fakeButton = {
    addEventListener(name, handler) {
      if (name === 'click') buttonClick = handler;
    },
  };
  const doc = {
    querySelector(selector) {
      assert.equal(selector, '[data-active-section="appearance"] .space-y-0.px-0');
      return appearanceVisible ? card : null;
    },
    getElementById(id) {
      return id === 'zpt-settings-current' && card.rows.length ? summary : null;
    },
    createElement(name) {
      assert.equal(name, 'div');
      created++;
      return {
        id: '',
        innerHTML: '',
        querySelector(selector) {
          return selector === '#zpt-settings-open' ? fakeButton : null;
        },
      };
    },
  };
  const api = fixture({}, doc);
  api.mountSettingsEntry();
  assert.equal(created, 0, 'never add a floating control on ordinary pages');
  appearanceVisible = true;
  api.mountSettingsEntry();
  assert.equal(created, 1);
  assert.equal(card.rows[0].id, 'zpt-settings-row');
  assert.match(card.rows[0].innerHTML, /自定义中式主题/);
  assert.match(card.rows[0].innerHTML, /管理主题/);
  assert.equal(typeof buttonClick, 'function');
  assert.equal(summary.textContent, '当前：跟随 ZCode 官方主题');
  api.mountSettingsEntry();
  assert.equal(created, 1, 'do not duplicate the row on React updates');
  card.rows = [];
  api.mountSettingsEntry();
  assert.equal(created, 2, 'reattach after a React remount');
  assert.equal(api.persist(api.makePreset('song-yan-chen-xiang')), true);
});

test('migrates legacy Western preset IDs and seven-color custom themes to Chinese themes without losing edits', () => {
  const original = {
    preset: 'paper',
    custom: true,
    colors: {
      background: '#F7F8FA',
      sidebar: '#EBEEF3',
      panel: '#FFFFFF',
      card: '#FFFFFF',
      foreground: '#273244',
      accent: '#123456',
      border: '#D8DEE9',
    },
  };
  const api = fixture({ 'zcode-puller-theme-v1': JSON.stringify(original) });
  const restored = api.readStored();
  assert.equal(restored.preset, 'xuan-zhi-shu-juan');
  assert.equal(restored.colors.accent, '#123456');
  assert.equal(restored.colors.keyword, api.PRESETS['xuan-zhi-shu-juan'].colors.keyword);
  assert.equal(restored.colors.cursor, api.PRESETS['xuan-zhi-shu-juan'].colors.cursor);
  assert.equal(Object.keys(restored.colors).length, 13);
  assert.equal(restored.custom, true);
  assert.match(api.themeSummary(), /当前：宣纸书卷（自定义） · 线条画：松风琴韵/);
});

test('preserves exact signature Chinese syntax palettes', () => {
  const api = fixture();
  const expectations = {
    'mo-yun-han-xiang': ['#181C1D', '#222627', '#E6E6E6', '#E35C58', '#5C92B5', '#C4A671', '#747B81', '#3A4750', '#FFFFFF'],
    'qing-hua-ci-ying': ['#FAFAFA', '#F2F4F5', '#1C2A39', '#295C9D', '#1F83A3', '#C25E73', '#889AA8', '#D4E4F0', '#1C2A39'],
    'qian-li-jiang-shan': ['#252321', '#1E1C1B', '#F0E9D1', '#5CB390', '#4A859E', '#DDAA55', '#7C8770', '#4D3E29', '#E58A3B'],
  };
  for (const [id, values] of Object.entries(expectations)) {
    const colors = api.PRESETS[id].colors;
    assert.deepEqual(
      ['background', 'sidebar', 'foreground', 'keyword', 'function', 'string', 'comment', 'selection', 'cursor'].map((k) => colors[k]),
      values
    );
  }
});

test('all six Chinese line-art patterns render valid SVG artwork and none disables artwork', () => {
  const api = fixture();
  for (const [id, pat] of Object.entries(api.PATTERNS)) {
    if (id === 'none') {
      assert.equal(pat.renderMain('#E35C58', '#E6E6E6'), '');
      assert.equal(pat.renderSidebar('#E35C58', '#E6E6E6'), '');
    } else {
      assert.match(pat.renderMain('#E35C58', '#E6E6E6'), /^<svg[^>]*viewBox="0 0 640 300"/);
      assert.match(pat.renderSidebar('#E35C58', '#E6E6E6'), /^<svg[^>]*viewBox="0 0 280 420"/);
    }
  }
  const plain = api.makePreset('qing-hua-ci-ying');
  plain.pattern = 'none';
  plain.ornament = 'none';
  api.applyTheme(plain);
  assert.equal(api.props.get('--zpt-main-art-image'), 'none');
  assert.equal(api.props.get('--zpt-sidebar-art-image'), 'none');
  assert.equal(api.props.get('--zpt-corner-ornament'), 'none');
});

test('scoped sidebar matching supports compact/scaled 170px settings sidebar without matching main content', () => {
  const makeNode = (left, width, height) => ({
    attributes: {},
    getBoundingClientRect: () => ({ left, top: 0, width, height }),
    setAttribute(k, v) {
      this.attributes[k] = v;
    },
    removeAttribute(k) {
      delete this.attributes[k];
    },
    closest: () => null,
  });
  const compactSettingsSidebar = makeNode(0, 170, 576);
  const main = makeNode(170, 854, 576);
  let candidates = [main, compactSettingsSidebar];
  const doc = {
    querySelectorAll: () => candidates,
    getElementById: () => null,
  };
  const api = fixture({}, doc);
  api.mountShellTheme();
  assert.equal(compactSettingsSidebar.attributes['data-zpt-shell-sidebar'], 'true');
  assert.equal(main.attributes['data-zpt-shell-sidebar'], undefined);
  const next = makeNode(0, 268, 900);
  candidates = [next];
  api.mountShellTheme();
  assert.equal(compactSettingsSidebar.attributes['data-zpt-shell-sidebar'], undefined);
  assert.equal(next.attributes['data-zpt-shell-sidebar'], 'true');
});

test('supports saving and loading custom theme slots', () => {
  const api = fixture();
  const custom = api.makePreset('zi-jin-zhu-qiang');
  custom.custom = true;
  custom.pattern = 'xiang-yun';
  assert.equal(api.saveSlots([{ title: '我的故宫红', theme: custom }]), true);
  const slots = api.readSlots();
  assert.equal(slots.length, 1);
  assert.equal(slots[0].title, '我的故宫红');
  assert.equal(slots[0].theme.preset, 'zi-jin-zhu-qiang');
  assert.equal(slots[0].theme.pattern, 'xiang-yun');
});

test('CSS covers Linux window frame (--color-background-win-alt), sidebar muted text, switches, and line-art', () => {
  assert.match(SOURCE, /--color-background-win-alt:\s*var\(--zpt-sidebar\)\s*!important/);
  assert.match(SOURCE, /--color-remote-foreground-muted:\s*var\(--zpt-foreground-muted\)\s*!important/);
  assert.match(SOURCE, /--color-primary:\s*var\(--zpt-accent\)\s*!important/);
  assert.match(SOURCE, /data-desktop-window-frame="true"/);
  assert.match(SOURCE, /data-zpt-shell-sidebar/);
  assert.match(SOURCE, /class\*="bg-"/);
  assert.match(SOURCE, /hljs-keyword/);
  assert.match(SOURCE, /zpt-primary/);
  assert.match(SOURCE, /zpt-preview-code/);
});
