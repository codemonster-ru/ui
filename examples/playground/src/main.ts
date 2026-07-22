import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';

import '@codemonster-ru/vueforge-core/styles.css';
import './sections/core/core-showcase.css';
import './sections/layouts/layouts-showcase.css';
import './demo-showcase.css';

import App from './App.vue';

createApp(App)
  .use(VueForgeLayouts, {
    defaultTheme: 'system',
    themeStorageKey: 'codemonster-showcase-theme'
  })
  .mount('#app');
