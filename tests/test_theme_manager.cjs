'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'zcode-theme-manager.js'), 'utf8');
function fixture(store = {}) {
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
    document: { documentElement: root },
    localStorage: { getItem: (k) => storage.has(k) ? storage.get(k) : null,
      setItem: (k,v) => storage.set(k,v), removeItem: (k) => storage.delete(k) },
    console,
  };
  vm.runInNewContext(SOURCE, ctx, { filename: 'zcode-theme-manager.js' });
  assert.ok(ctx.window.__ZPT_TEST_API__);
  return { ...ctx.window.__ZPT_TEST_API__, props, attrs, storage };
}

test('ships six full palette presets', () => {
  const api = fixture();
  assert.equal(Object.keys(api.PRESETS).length, 6);
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
