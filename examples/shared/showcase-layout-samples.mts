import { defaultPreview, previews } from './showcase-layout-data.mts';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';

const surface = (content: string) => `<section class="cm-section cm-section--surface">${content}</section>`;
const pair = (first: string, second: string) => `<div class="layout-sample-pair">${first}${second}</div>`;
const stack = (items: string[], element: 'div' | 'article' = 'div') =>
  `<${element} class="cm-stack">${items.map(surface).join('')}</${element}>`;
const grid = (items: string[]) =>
  `<div class="cm-grid">${items.map((item) => `<article class="cm-card"><div class="cm-card__body">${item}</div></article>`).join('')}</div>`;
const inline = (items: string[], nowrap = false) =>
  `<div class="cm-inline${nowrap ? ' cm-inline--nowrap' : ''}">${items.map((item) => `<span class="cm-badge">${item}</span>`).join('')}</div>`;

export function renderLayoutGuideEntry(
  slug: string,
  title: string,
  description: string,
  content: string,
  preview = false,
) {
  return `<section id="demo-${slug}" class="showcase-group layout-guide-entry" aria-labelledby="demo-${slug}-heading"${preview ? ` data-layout-preview="${slug}"` : ''}>
    <header><h2 id="demo-${slug}-heading">${title}</h2><p>${description}</p></header>
    ${content}
  </section>`;
}

export function renderLayoutPrimitives() {
  return [
    renderLayoutGuideEntry(
      'container',
      'CmContainer',
      'Constrains content width and supplies the standard responsive page gutter.',
      surface(
        '<div class="cm-container">Use container as the default content boundary inside a full-width section.</div>',
      ),
    ),
    renderLayoutGuideEntry(
      'stack',
      'CmStack',
      'Arranges related items vertically with a consistent, configurable gap.',
      pair(
        surface(stack(['Vertical composition', 'Item', 'Item'])),
        surface(stack(['Article block', 'Body section', 'Related notes'], 'article')),
      ),
    ),
    renderLayoutGuideEntry(
      'inline',
      'CmInline',
      'Arranges compact items horizontally and optionally wraps them onto new rows.',
      pair(
        surface(inline(['Default', 'Wrapped', 'Inline', 'Row'])),
        surface(inline(['No wrap', 'Actions', 'Actions'], true)),
      ),
    ),
    renderLayoutGuideEntry(
      'section',
      'CmSection',
      'Creates a semantic content region with optional surface treatment and inset.',
      pair(
        '<section class="cm-section"><strong>surface: false</strong></section>',
        surface('<strong>surface: true</strong>'),
      ),
    ),
    renderLayoutGuideEntry(
      'grid',
      'CmGrid',
      'Builds a responsive auto-fitting grid for cards, summaries, and listings.',
      `<div class="cm-stack">${surface(grid(['Responsive card grid', 'Item', 'Item', 'Item']))}${surface(grid(['Use grid for summaries', 'Examples', 'Listings']))}</div>`,
    ),
  ].join('\n');
}

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
  return [
    renderLayoutGuideEntry(
      'foundation',
      'Responsive foundation',
      'Inspect shared breakpoints and values that react to the current viewport.',
      pair(
        surface(
          `<div class="cm-stack"><strong>Breakpoint values</strong><dl class="cm-stack layout-breakpoints">${breakpoints
            .map(([name, width]) => `<div class="layout-breakpoint-entry"><dt>${name}</dt><dd>${width}px</dd></div>`)
            .join('')}</dl></div>`,
        ),
        surface(
          `<div class="cm-stack"><strong>Runtime state</strong>
            <div class="layout-breakpoint-entry"><span>current</span><output data-layout-breakpoint>Below xs</output></div>
            <strong>Responsive value</strong>
            <div class="cm-card"><div class="cm-card__body"><output data-layout-value>base layout</output></div></div>
          </div>`,
        ),
      ),
    ),
    renderLayoutGuideEntry(
      'error-layout',
      'CmErrorLayout',
      'Centers an error status, explanation, and recovery actions on a focused page.',
      `${recipeSizes('error')}<div class="layout-recipe-frame">
        <div class="cm-error-layout cm-page-layout--centered"><div class="cm-page-layout__container">
          <div class="cm-error-layout__panel cm-page-layout__panel cm-page-layout__panel--surface">
            <p class="cm-error-layout__code">404</p><h3 class="cm-error-layout__title">Page not found</h3>
            <p class="cm-error-layout__description">The page you requested does not exist or has been moved.</p>
            <div class="cm-error-layout__actions"><a class="cm-button cm-button--primary cm-button--md" href="./core/">Go to home page</a></div>
          </div>
        </div></div>
      </div>`,
    ),
    renderLayoutGuideEntry(
      'auth-layout',
      'CmAuthLayout',
      'Frames sign-in and account forms in a responsive branded panel.',
      `${recipeSizes('auth')}<div class="layout-recipe-frame">
        <div class="cm-auth-layout cm-page-layout--centered"><div class="cm-page-layout__container">
          <div class="cm-auth-layout__panel cm-page-layout__panel cm-page-layout__panel--surface">
            <header class="cm-auth-layout__header">
              <div class="cm-auth-layout__brand"><img src="./vueforge-logo-icon.svg" width="36" height="36" alt="VueForge"></div>
              <h3 class="cm-auth-layout__title">Sign in</h3>
              <p class="cm-auth-layout__description">Use your account to continue.</p>
            </header>
            <div class="cm-auth-layout__body">
              <form class="layout-auth-form cm-stack" data-layout-auth>
                <label>Email <input class="cm-input cm-input--md" type="email" autocomplete="email" required></label>
                <label>Password <input class="cm-input cm-input--md" type="password" autocomplete="current-password" required></label>
                <label><input type="checkbox" data-layout-reveal> Show password</label><label><input type="checkbox"> Remember me</label>
                <button class="cm-button cm-button--primary cm-button--md" type="submit"><span class="cm-button__label">Sign in</span></button>
                <output aria-live="polite"></output>
              </form>
            </div>
          </div>
        </div></div>
      </div>`,
    ),
  ].join('\n');
}
