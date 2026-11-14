import { defaultPreview, previews } from './showcase-layout-data.mts';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';

const surface = (content: string) => `<section class="cm-section cm-section--surface">${content}</section>`;
const pair = (first: string, second: string) => `<div class="layout-sample-pair">${first}${second}</div>`;
const stack = (items: string[]) => `<div class="cm-stack">${items.map(surface).join('')}</div>`;
const grid = (items: string[]) =>
  `<div class="cm-grid">${items.map((item) => `<article class="cm-card"><div class="cm-card__body">${item}</div></article>`).join('')}</div>`;
const inline = (items: string[], nowrap = false) =>
  `<div class="cm-inline${nowrap ? ' cm-inline--nowrap' : ''}">${items.map((item) => `<span class="cm-badge">${item}</span>`).join('')}</div>`;

export const layoutSamples: Record<string, string> = {
  container: surface(
    '<div class="cm-container">Use container as the default content boundary inside a full-width section.</div>',
  ),
  stack: pair(
    surface(stack(['Vertical composition', 'Item', 'Item'])),
    surface(stack(['Article block', 'Body section', 'Related notes'])),
  ),
  inline: pair(
    surface(inline(['Default', 'Wrapped', 'Inline', 'Row'])),
    surface(inline(['No wrap', 'Actions', 'Actions'], true)),
  ),
  section: pair(
    '<section class="cm-section"><strong>surface: false</strong></section>',
    surface('<strong>surface: true</strong>'),
  ),
  grid: `<div class="cm-stack">${surface(grid(['Responsive card grid', 'Item', 'Item', 'Item']))}${surface(grid(['Use grid for summaries', 'Examples', 'Listings']))}</div>`,
};

function recipeSizes(name: string) {
  return `<fieldset class="layout-preview__sizes"><legend>Preview width</legend>${previews
    .map(
      ({ value, width }) =>
        `<label><input type="radio" name="${name}-preview" data-recipe-width value="${width}"${value === defaultPreview ? ' checked' : ''}><span>${value}</span></label>`,
    )
    .join('')}</fieldset>`;
}

export function renderLayoutRecipes() {
  const breakpoints = Object.entries(cmBreakpoints);
  return `<section id="responsive-foundation" class="showcase-panel showcase-panel--wide">
    <h3>Responsive foundation</h3>
    ${pair(
      surface(
        `<strong>Breakpoint values</strong><dl>${breakpoints.map(([name, width]) => `<div class="layout-breakpoint-entry"><dt>${name}</dt><dd>${width} px</dd></div>`).join('')}</dl>`,
      ),
      surface(
        '<strong>Runtime state</strong><p>Current breakpoint <output data-layout-breakpoint>Below xs</output></p><p>Viewport width <output data-layout-width></output></p>',
      ),
    )}
  </section>
  <section id="error-layout-recipe" class="showcase-panel showcase-panel--wide"><h3>Error page</h3>${recipeSizes('error')}
    <div class="layout-recipe-frame"><div class="layout-recipe"><strong>404</strong><h4>Page not found</h4><p>The page you requested does not exist or has been moved.</p><a class="cm-link" href="/core/">Go to home page</a></div></div>
  </section>
  <section id="auth-layout-recipe" class="showcase-panel showcase-panel--wide"><h3>Sign in</h3>${recipeSizes('auth')}
    <div class="layout-recipe-frame"><form class="layout-recipe cm-stack" data-layout-auth>
      <span class="layout-brand"><img src="/vueforge-logo-icon.svg" alt=""><strong>VueForge</strong></span><label>Email <input class="cm-input cm-input--md" type="email" autocomplete="email" required></label>
      <label>Password <input class="cm-input cm-input--md" type="password" autocomplete="current-password" required></label>
      <label><input type="checkbox" data-layout-reveal> Show password</label><label><input type="checkbox"> Remember me</label>
      <button class="cm-button cm-button--primary cm-button--md" type="submit"><span class="cm-button__label">Sign in</span></button>
      <output aria-live="polite"></output>
    </form></div>
  </section>`;
}
