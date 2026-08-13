import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
import '@codemonster-ru/vueforge-core/styles.css';
import './demo-showcase.css';

import App from './App.vue';

createApp(App)
  .use(VueForgeLayouts, {
    defaultTheme: 'system',
    themeStorageKey: 'codemonster-showcase-theme'
  })
  .mount('#app');
