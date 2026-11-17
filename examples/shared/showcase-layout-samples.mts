import { cmBreakpoints } from '@codemonster-ru/ui-tokens';

const surface = (content: string) => `<section class="cm-section cm-section--surface">${content}</section>`;
const pair = (first: string, second: string) => `<div class="layout-sample-pair">${first}${second}</div>`;
const stack = (items: string[], element: 'div' | 'article' = 'div') =>
  `<${element} class="cm-stack">${items.map(surface).join('')}</${element}>`;
const grid = (items: string[]) =>
  `<div class="cm-grid">${items.map((item) => `<article class="cm-card"><div class="cm-card__body">${item}</div></article>`).join('')}</div>`;
const inline = (items: string[], nowrap = false) =>
  `<div class="cm-inline${nowrap ? ' cm-inline--nowrap' : ''}">${items.map((item) => `<span class="cm-badge">${item}</span>`).join('')}</div>`;

export function renderLayoutGuideEntry(slug: string, title: string, content: string, component?: string) {
  const heading = component ? 'h2' : 'h3';
  return `<section id="demo-${slug}" class="showcase-group layout-guide-entry" aria-labelledby="demo-${slug}-heading"${component ? ` data-layout-preview="${slug}" tabindex="-1"` : ''}>
    <header class="showcase-group-heading"><${heading} id="demo-${slug}-heading">${title}</${heading}>${component ? `<a class="cm-link cm-link--underline-hover" href="./components/${slug}/">${component}</a>` : ''}</header>
    ${content}
  </section>`;
}

export function renderLayoutPrimitives() {
  return [
    renderLayoutGuideEntry(
      'container',
      'CmContainer',
      surface(
        '<div class="cm-container">Use container as the default content boundary inside a full-width section.</div>',
      ),
    ),
    renderLayoutGuideEntry(
      'stack',
      'CmStack',
      pair(
        stack(['Vertical composition', 'Item', 'Item']),
        stack(['Article block', 'Body section', 'Related notes'], 'article'),
      ),
    ),
    renderLayoutGuideEntry(
      'inline',
      'CmInline',
      pair(
        surface(inline(['Default', 'Wrapped', 'Inline', 'Row'])),
        surface(inline(['No wrap', 'Actions', 'Actions'], true)),
      ),
    ),
    renderLayoutGuideEntry(
      'section',
      'CmSection',
      pair(
        '<section class="cm-section"><strong>surface: false</strong></section>',
        surface('<strong>surface: true</strong>'),
      ),
    ),
    renderLayoutGuideEntry(
      'grid',
      'CmGrid',
      `<div class="cm-stack">${grid(['Responsive card grid', 'Item', 'Item', 'Item'])}${grid(['Use grid for summaries', 'Examples', 'Listings'])}</div>`,
    ),
  ].join('\n');
}

export function renderLayoutRecipes() {
  const breakpoints = Object.entries(cmBreakpoints);
  return [
    renderLayoutGuideEntry(
      'foundation',
      'Responsive foundation',
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
  ].join('\n');
}

export function renderLayoutField(
  id: string,
  label: string,
  attributes: string,
  {
    description = '',
    revealButton = '',
    required = false,
  }: {
    description?: string;
    revealButton?: string;
    required?: boolean;
  } = {},
) {
  const input = `<input class="cm-input cm-input--md" id="${id}" ${attributes}${required ? ' required' : ''}${description ? ` aria-describedby="${id}-description"` : ''}${revealButton ? ' data-cm-input-control' : ''}>`;
  const control = revealButton
    ? `<div class="cm-input-wrap" data-cm-controller="input">${input}${revealButton}</div>`
    : input;
  return `<div class="cm-field"><label class="cm-field__label" for="${id}">${label}${required ? '<span class="cm-field__required" aria-hidden="true">*</span>' : ''}</label>
    <div class="cm-field__control">${control}</div>${description ? `<p class="cm-field__description" id="${id}-description">${description}</p>` : ''}</div>`;
}

export function renderPageLayout(slug: 'error-layout' | 'auth-layout', revealButton = '') {
  if (slug === 'error-layout')
    return `<section class="cm-error-layout cm-page-layout--fill-viewport cm-page-layout--centered"><div class="cm-page-layout__container">
    <div class="cm-error-layout__panel cm-page-layout__panel cm-page-layout__panel--surface">
      <p class="cm-error-layout__code">404</p><h1 class="cm-error-layout__title">Page not found</h1>
      <p class="cm-error-layout__description">The page you requested does not exist or has been moved.</p>
      <div class="cm-error-layout__actions"><a class="cm-button cm-button--primary cm-button--md" href="./core/" target="_parent">Go to home page</a></div>
    </div>
  </div></section>`;

  return `<main class="cm-auth-layout cm-page-layout--fill-viewport cm-page-layout--centered"><div class="cm-page-layout__container">
    <div class="cm-auth-layout__panel cm-page-layout__panel cm-page-layout__panel--surface">
      <header class="cm-auth-layout__header">
        <div class="cm-auth-layout__brand"><img src="./vueforge-logo-icon.svg" width="36" height="36" alt="VueForge"></div>
        <h1 class="cm-auth-layout__title">Sign in</h1>
        <p class="cm-auth-layout__description">Don't have an account? <a class="cm-link cm-link--underline-none" href="./core/" target="_parent">Click here to sign up</a></p>
      </header>
      <div class="cm-auth-layout__body">
        <form class="cm-stack" data-layout-auth>
          ${renderLayoutField('sign-in-email', 'Email', 'type="email" autocomplete="email"', { required: true })}
          ${renderLayoutField('sign-in-password', 'Password', 'type="password" autocomplete="current-password"', { required: true, revealButton })}
          <div class="cm-inline layout-example__sign-in-options"><label class="cm-checkbox cm-checkbox--md"><input class="cm-checkbox__input" type="checkbox"><span class="cm-checkbox__control" aria-hidden="true"><span class="cm-checkbox__mark"></span></span><span class="cm-checkbox__content">Remember me</span></label>
            <a class="cm-link cm-link--underline-none" href="./core/" target="_parent">Forgot password?</a></div>
          <button class="cm-button cm-button--primary cm-button--md" type="submit"><span class="cm-button__label">Sign in</span></button>
          <output aria-live="polite" hidden></output>
        </form>
      </div>
      <footer class="cm-auth-layout__footer"><small>© 2026 VueForge. All rights reserved.</small></footer>
    </div>
  </div></main>`;
}
