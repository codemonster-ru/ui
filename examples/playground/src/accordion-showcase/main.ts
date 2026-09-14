// Entry of the VfAccordion showcase route.
//
// A later entry of the historical showcase application rather than a new
// application, for the same reason the earlier component routes were: the
// same real package imports, the same styles and the same runtime a consumer
// gets. The six
// historical routes are untouched, so the frozen showcase baseline still
// describes them exactly.
import { createApp } from 'vue';
import VueForgeLayouts from '@codemonster-ru/vueforge-layouts';

import '@codemonster-ru/vueforge-core/styles.css';
import '../input-showcase/input-showcase.css';

import AccordionShowcase from './AccordionShowcase.vue';

// The theme query parameter is the address of a themed case, so it has to win
// over whatever this browser last stored. Writing it through the same storage
// key the provider reads keeps the theme switch working normally afterwards.
const requestedTheme = new URLSearchParams(window.location.search).get('theme');
if (requestedTheme === 'light' || requestedTheme === 'dark') {
  try {
    window.localStorage.setItem('codemonster-showcase-theme', requestedTheme);
  } catch {
    // A browser that refuses storage still renders; defaultTheme covers it.
  }
}

createApp(AccordionShowcase)
  .use(VueForgeLayouts, {
    defaultTheme: 'system',
    themeStorageKey: 'codemonster-showcase-theme',
  })
  .mount('#app');
