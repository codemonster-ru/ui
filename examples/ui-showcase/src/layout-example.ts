import { createApp, nextTick, type Component } from 'vue';
import { layoutExamples } from '../../shared/showcase-layout-data.mts';
import { enableAuthPreview, revealLayoutPreview } from '../../shared/showcase-layout-recipes.js';
import { followShowcaseFrameTheme } from '../../shared/showcase-theme.js';
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
import '../../shared/showcase-layout-example.css';
import LayoutExample from './LayoutExample.vue';

const requested = new URLSearchParams(location.search).get('layout');
const example = layoutExamples.find(({ slug }) => slug === requested);
if (!example) throw new Error('Unknown showcase layout.');

document.title = example.title;
followShowcaseFrameTheme(() => {});
createApp(LayoutExample as Component, { slug: example.slug }).mount('#app');
enableAuthPreview(document.querySelector<HTMLFormElement>('[data-layout-auth]'));
void nextTick(() =>
  revealLayoutPreview(
    document.querySelector('.layout-example__warehouse, .layout-example__setup, .cm-auth-layout, .cm-error-layout'),
  ),
);
