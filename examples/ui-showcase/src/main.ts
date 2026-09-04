import { createApp } from 'vue';
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-tokens/breakpoints.css';
import '@codemonster-ru/ui-css/fonts.css';
// The complete bundle, not a hand-picked subset: a per-component list here has twice missed a
// stylesheet a demoed component actually needs (icon.css, theme-switch.css) because nothing forces
// it to track what App.vue uses. It also carries `foundation.css`, which is what paints `:root`/
// `body` from the theme tokens and responds to `data-cm-theme` in the first place -- without it,
// CmThemeSwitch was flipping the attribute and the token values correctly, but nothing on the page
// was ever reading them. The Razor example already loads this same bundle wholesale.
import '@codemonster-ru/ui-css/styles.css';
import App from './App.vue';
import './showcase.css';

createApp(App).mount('#app');
