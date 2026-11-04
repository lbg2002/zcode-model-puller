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
  const root = {
    style: { setProperty: (k,v) => props.set(k,v), removeProperty: (k) => props.delete(k) },
    setAttribute: (k,v) => attrs.set(k,v),
    removeAttribute: (k) => attrs.delete(k),
  };
  const storage = new Map(Object.entries(store));
  const ctx = {
    window: { __ZPT_TEST_MODE__: true },
    document: { documentElement: root, getElementById: () => null, ...documentOverrides },
    localStorage: { getItem: (k) => storage.has(k) ? storage.get(k) : null,
      setItem: (k,v) => storage.set(k,v), removeItem: (k) => storage.delete(k) },
    console,
  };
  vm.runInNewContext(SOURCE, ctx, { filename: 'zcode-theme-manager.js' });
  assert.ok(ctx.window.__ZPT_TEST_API__);
  return { ...ctx.window.__ZPT_TEST_API__, props, attrs, storage };
}

test('ships nine full palette presets', () => {
  const api = fixture();
  assert.equal(Object.keys(api.PRESETS).length, 9);
  for (const p of Object.values(api.PRESETS)) for (const k of api.COLOR_KEYS) assert.match(p.colors[k], /^#[0-9a-f]{6}$/i);
});

test('rejects malformed and CSS-injection values', () => {
  const api = fixture();
  const p = api.makePreset('tokyo-night');
  assert.ok(api.valid(p));
  p.custom = true;
  p.colors.accent = 'red; background:url(https://example.com)';
  assert.equal(api.valid(p), null);
  assert.equal(api.valid({ preset: 'evil' }), null);
  assert.equal(api.valid({ preset: '__proto__' }), null);
});

test('stored custom theme survives reload and normalizes colors', () => {
  const api = fixture();
  const p = api.makePreset('catppuccin-mocha');
  p.custom = true;
  p.colors.accent = '#aabbcc';
  assert.equal(api.persist(p), true);
  const loaded = fixture({ 'zcode-puller-theme-v1': api.storage.get('zcode-puller-theme-v1') }).readStored();
  assert.equal(loaded.colors.accent, '#AABBCC');
  assert.equal(loaded.custom, true);
});

test('theme overrides use only scoped variables and can be fully removed', () => {
  const api = fixture();
  const p = api.makePreset('nord');
  api.applyTheme(p);
  assert.equal(api.attrs.get('data-zpt-theme-active'), 'true');
  assert.equal(api.props.get('--zpt-background'), '#2E3440');
  assert.equal(api.props.get('--zpt-foreground-muted'), '#ECEFF4B8');
  api.applyTheme(null);
  assert.equal(api.attrs.has('data-zpt-theme-active'), false);
  assert.equal(api.props.size, 0);
});

test('bad localStorage data is ignored without errors', () => {
  const api = fixture({ 'zcode-puller-theme-v1': '{broken' });
  assert.equal(api.readStored(), null);
});

test('restoring default clears only plugin storage key', () => {
  const api = fixture({ 'zcode-theme': 'zai-dark' });
  api.persist(api.makePreset('paper'));
  assert.equal(api.persist(null), true);
  assert.equal(api.storage.get('zcode-theme'), 'zai-dark');
  assert.equal(api.storage.has('zcode-puller-theme-v1'), false);
});

test('preset colors are copied, not mutated globally', () => {
  const api = fixture();
  const p = api.makePreset('tokyo-night');
  p.colors.accent = '#010203';
  assert.equal(api.PRESETS['tokyo-night'].colors.accent, '#7AA2F7');
});

test('settings entry is shown only inside ZCode Appearance settings', () => {
  assert.doesNotMatch(SOURCE, /#zpt-launcher|id=['\"]zpt-launcher/);
  const card = {
    rows: [],
    querySelector(selector) {
      return selector === '#zpt-settings-row'
        ? this.rows.find((row) => row.id === 'zpt-settings-row') || null
        : null;
    },
    appendChild(row) { this.rows.push(row); },
  };
  let appearanceVisible = false;
  let buttonClick;
  let created = 0;
  const summary = { textContent: '' };
  const fakeButton = { addEventListener(name, handler) { if (name === 'click') buttonClick = handler; } };
  const doc = {
    querySelector(selector) {
      assert.equal(selector, '[data-active-section="appearance"] .space-y-0.px-0');
      return appearanceVisible ? card : null;
    },
    getElementById(id) { return id === 'zpt-settings-current' && card.rows.length ? summary : null; },
    createElement(name) {
      assert.equal(name, 'div');
      created++;
      return { id: '', innerHTML: '',
        querySelector(selector) { return selector === '#zpt-settings-open' ? fakeButton : null; } };
    },
  };
  const api = fixture({}, doc);
  api.mountSettingsEntry();
  assert.equal(created, 0, 'never add a floating control on ordinary pages');
  appearanceVisible = true;
  api.mountSettingsEntry();
  assert.equal(created, 1);
  assert.equal(card.rows[0].id, 'zpt-settings-row');
  assert.match(card.rows[0].innerHTML, /自定义主题/);
  assert.match(card.rows[0].innerHTML, /管理主题/);
  assert.equal(typeof buttonClick, 'function');
  assert.equal(summary.textContent, '当前：跟随 ZCode 官方主题');
  api.mountSettingsEntry();
  assert.equal(created, 1, 'do not duplicate the row on React updates');
  card.rows = []; // Simulate React replacing the Appearance card content.
  api.mountSettingsEntry();
  assert.equal(created, 2, 'reattach after a React remount');
  assert.equal(api.persist(api.makePreset('nord')), true);
});

test('saved theme summary is shown on the settings row', () => {
  const preset = { preset: 'paper', custom: true, colors: {
    background: '#F7F8FA', sidebar: '#EBEEF3', panel: '#FFFFFF', card: '#FFFFFF',
    foreground: '#273244', accent: '#4361EE', border: '#D8DEE9'
  }};
  const api = fixture({ 'zcode-puller-theme-v1': JSON.stringify(preset) });
  assert.equal(api.themeSummary(), '当前：Paper（自定义）');
});


test('adds three Chinese-inspired themes with exact syntax palettes', () => {
  const api = fixture();
  assert.equal(Object.keys(api.PRESETS).length, 9);
  const expectations = {
    'mo-yun-han-xiang': ['#181C1D','#222627','#E6E6E6','#E35C58','#5C92B5','#C4A671','#747B81','#3A4750','#FFFFFF'],
    'qing-hua-ci-ying': ['#FAFAFA','#F2F4F5','#1C2A39','#295C9D','#1F83A3','#C25E73','#889AA8','#D4E4F0','#1C2A39'],
    'qian-li-jiang-shan': ['#252321','#1E1C1B','#F0E9D1','#5CB390','#4A859E','#DDAA55','#7C8770','#4D3E29','#E58A3B'],
  };
  for (const [id, values] of Object.entries(expectations)) {
    const colors = api.PRESETS[id].colors;
    assert.deepEqual(['background','sidebar','foreground','keyword','function','string','comment','selection','cursor'].map(k => colors[k]), values);
  }
  for (const p of Object.values(api.PRESETS)) for (const k of api.COLOR_KEYS) assert.match(p.colors[k], /^#[0-9a-f]{6}$/i);
});

test('migrates legacy seven-color custom themes without losing edits', () => {
  const original = { preset: 'paper', custom: true, colors: {
    background: '#F7F8FA', sidebar: '#EBEEF3', panel: '#FFFFFF', card: '#FFFFFF',
    foreground: '#273244', accent: '#123456', border: '#D8DEE9'
  }};
  const api = fixture({ 'zcode-puller-theme-v1': JSON.stringify(original) });
  const restored = api.readStored();
  assert.equal(restored.colors.accent, '#123456');
  assert.equal(restored.colors.keyword, api.PRESETS.paper.colors.keyword);
  assert.equal(restored.colors.cursor, api.PRESETS.paper.colors.cursor);
  assert.equal(Object.keys(restored.colors).length, 13);
  assert.equal(restored.custom, true);
});

test('rejects malicious new syntax colors as well as legacy colors', () => {
  const api = fixture();
  const p = api.makePreset('mo-yun-han-xiang');
  p.custom = true;
  p.colors.keyword = '#123456;url(https://example.com)';
  assert.equal(api.valid(p), null);
});

test('extra color variables are applied and completely removed', () => {
  const api = fixture();
  api.applyTheme(api.makePreset('qing-hua-ci-ying'));
  assert.equal(api.props.get('--zpt-selection'), '#D4E4F0');
  assert.equal(api.props.get('--zpt-function'), '#1F83A3');
  assert.equal(api.props.get('--zpt-cursor'), '#1C2A39');
  assert.equal(api.props.get('--zpt-scheme'), 'light');
  api.applyTheme(null);
  assert.equal(api.props.size, 0);
  assert.equal(api.attrs.has('data-zpt-theme-mode'), false);
});

test('scoped sidebar matching follows a full-height left column without matching main content', () => {
  const makeNode = (left, width, height) => ({
    attributes: {},
    getBoundingClientRect: () => ({ left, top: 0, width, height }),
    setAttribute(k,v) { this.attributes[k] = v; },
    removeAttribute(k) { delete this.attributes[k]; },
    closest: () => null,
  });
  const left = makeNode(0, 286, 900);
  const main = makeNode(286, 1100, 900);
  let candidates = [main, left];
  const doc = {
    querySelectorAll: () => candidates,
    getElementById: () => null,
  };
  const api = fixture({}, doc);
  api.mountShellTheme();
  assert.equal(left.attributes['data-zpt-shell-sidebar'], 'true');
  assert.equal(main.attributes['data-zpt-shell-sidebar'], undefined);
  const next = makeNode(0, 310, 900);
  candidates = [next];
  api.mountShellTheme();
  assert.equal(left.attributes['data-zpt-shell-sidebar'], undefined);
  assert.equal(next.attributes['data-zpt-shell-sidebar'], 'true');
});

test('new theme CSS scopes layout overrides and covers both highlight and dialog', () => {
  assert.match(SOURCE, /data-zpt-shell-sidebar/);
  assert.match(SOURCE, /class\*="bg-"/);
  assert.match(SOURCE, /hljs-keyword/);
  assert.match(SOURCE, /zpt-primary/);
  assert.match(SOURCE, /zpt-preview-code/);
});
