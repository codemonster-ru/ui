import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';

const require = createRequire(import.meta.url);

globalThis.document = {
  createElement() {
    return {
      textContent: '',
    };
  },
  head: {
    appendChild() {},
  },
};

const { VueIconify, icons } = require('../dist/index.ts.umd.js');

const renderIcon = async (component, props = {}) => {
  const app = createSSRApp({
    render() {
      return h(component, props);
    },
  });

  return renderToString(app);
};

const genericMarkup = await renderIcon(VueIconify, {
  icon: icons.warning,
  size: 24,
  'aria-label': 'Warning',
  role: 'img',
});

assert.match(genericMarkup, /<svg/);
assert.match(genericMarkup, /aria-label="Warning"/);
assert.match(genericMarkup, /role="img"/);
assert.match(genericMarkup, /width="24"/);
assert.match(genericMarkup, /height="24"/);

const fallbackMarkup = await renderIcon(VueIconify, {
  icon: 'unknown-icon-name',
  size: '2rem',
});

assert.match(fallbackMarkup, /<svg/);
assert.match(fallbackMarkup, /width="2rem"/);
assert.match(fallbackMarkup, /height="2rem"/);
assert.match(fallbackMarkup, /mask="url\(#/);

const calendarGenericMarkup = await renderIcon(VueIconify, {
  icon: icons.calendar,
  size: 22,
});

assert.match(calendarGenericMarkup, /<svg/);
assert.match(calendarGenericMarkup, /fill="currentColor"/);
assert.match(calendarGenericMarkup, /width="22"/);
assert.match(calendarGenericMarkup, /height="22"/);

const warningMarkup = await renderIcon(VueIconify, {
  icon: icons.warning,
  size: 18,
});

assert.match(warningMarkup, /<path/);
assert.match(warningMarkup, /width="18"/);
assert.match(warningMarkup, /height="18"/);
