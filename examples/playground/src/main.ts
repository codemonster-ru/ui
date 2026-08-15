import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-tokens/breakpoints.css';
import '@codemonster-ru/ui-css/badge.css';
import '@codemonster-ru/ui-css/container.css';
import '@codemonster-ru/ui-css/divider.css';
import '@codemonster-ru/ui-css/grid.css';
import '@codemonster-ru/ui-css/inline.css';
import '@codemonster-ru/ui-css/section.css';
import '@codemonster-ru/ui-css/stack.css';
import '@codemonster-ru/vueforge-core/styles.css';
import './sections/core/core-showcase.css';
import './sections/layouts/layouts-showcase.css';
import './demo-showcase.css';
import './theme-bootstrap';

import App from './App.vue';

const themeRoot = document.documentElement;
new MutationObserver(() => {
  const theme = themeRoot.getAttribute('data-vf-theme');
  if (theme === 'light' || theme === 'dark') themeRoot.setAttribute('data-cm-theme', theme);
}).observe(themeRoot, { attributeFilter: ['data-vf-theme'] });

createApp(App)
  .use(VueForgeLayouts, {
    defaultTheme: 'system',
    themeStorageKey: 'codemonster-showcase-theme',
  })
  .mount('#app');
