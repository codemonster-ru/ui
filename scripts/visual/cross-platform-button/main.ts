import { CmButton } from '@codemonster-ru/ui-vue';
import { createApp, h, nextTick } from 'vue';

import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/foundation.css';
import '@codemonster-ru/ui-css/button.css';
import './fixture.css';
import buttonDefaultCase from '../../../contracts/button/cases/default.case.json';

const parameters = new URLSearchParams(location.search);
const platform = parameters.get('platform');
const theme = parameters.get('theme');
const root = document.querySelector<HTMLElement>('#visual-root');

if (!root || !['vue', 'razor'].includes(platform ?? '') || !['light', 'dark'].includes(theme ?? '')) {
  throw new Error('Cross-platform Button fixture requires platform=vue|razor and theme=light|dark.');
}

document.documentElement.dataset.cmTheme = theme ?? 'light';

if (platform === 'vue') {
  createApp({
    render: () =>
      h(CmButton, buttonDefaultCase.props, {
        default: () => buttonDefaultCase.slots.default,
      }),
  }).mount(root);
  await nextTick();
  root.dataset.visualRenderer = 'vue-mounted';
} else {
  const response = await fetch('/__visual/razor/button-default');
  if (!response.ok) throw new Error(`Razor fixture endpoint returned ${response.status}.`);
  root.innerHTML = await response.text();
  root.dataset.visualRenderer = 'razor-rendered';
}

root.dataset.visualReady = 'true';
