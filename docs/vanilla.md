---
title: 'Vanilla HTML and JavaScript'
description: 'Serve CodeMonster UI assets directly from server templates'
---

# Vanilla HTML and JavaScript

## npm packages

Use `@codemonster-ru/ui-tokens` and `@codemonster-ru/ui-css` for server-authored HTML. Install
`@codemonster-ru/ui-runtime` as well if your markup uses interactive controllers. These
examples use the v2 package exports. Until v2 is published, install the built workspace
tarballs in your consumer application. Follow the [local build instructions](./getting-started.md#install-a-local-20-build)
and pack only tokens, CSS, and runtime for a Vanilla integration. You can also
[serve the standalone build](#browser-assets) and skip package installation in the consumer.

## Quick start

In a bundler-based app, create `src/ui.js` to load the shared styles and connect the Accordion
controller. The optional fonts entry supplies Inter.

```js file=/src/ui.js
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/fonts.css';
import '@codemonster-ru/ui-css/styles.css';
import { CmRuntime, createCmAccordionController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('accordion', createCmAccordionController);
const faq = document.getElementById('faq');
if (faq) runtime.start(faq);
```

Render this markup in your HTML document or server template. Point the script at your bundler's
entry or its production output. The first answer starts open so its content is visible before
enhancement.

```html
<section id="faq" aria-labelledby="faq-title">
  <h2 id="faq-title">Billing FAQ</h2>
  <div class="cm-accordion" data-cm-controller="accordion">
    <section class="cm-accordion__item" data-cm-accordion-item="renewal">
      <h3 class="cm-accordion__heading">
        <button
          class="cm-accordion__trigger"
          id="faq-renewal-trigger"
          type="button"
          aria-expanded="true"
          aria-controls="faq-renewal-panel"
        >
          When does my subscription renew?
        </button>
      </h3>
      <div
        class="cm-accordion__panel"
        id="faq-renewal-panel"
        role="region"
        aria-labelledby="faq-renewal-trigger"
      >
        Your subscription renews on the first day of each month.
      </div>
    </section>
  </div>
</section>
<script type="module" src="/src/ui.js"></script>
```

Use unique IDs for repeated instances. Look up other variants and components in the
[component reference](./components/index.md) and register the controllers their markup needs.
Static pages can use the stylesheet imports alone.

Use native events for native controls. For controller events, listen at the component or its
container. For example, an Accordion dispatches the bubbling `cm:open-change` event with
`detail.openItems` on its root. See each component contract for supported updates: a modal takes
an [open or close request](./components/overlays.md), while form controls retain their documented
native submission or application validation behavior.

## Browser assets

Run `npm run dev:vanilla` from the repository root to edit the showcase with browser reloads.
To inspect production output, run `npm run build:vanilla` followed by `npm run preview:vanilla`.
Browse component variants directly in Core, Layouts, Colors, and Icons. All pages share the theme selector.

For assets to deploy, run `npm run build:vanilla` and serve the contents of
`examples/vanilla/dist` over HTTP. Keep the `tokens` and `css` directories intact so
their relative imports resolve. Open `index.html` for Core, `accordion-example.html`
for minimal integration, `confirm-dialog-example.html` for a confirmation flow,
`code-block-example.html` for the [code block recipe](recipes/code-block.md), or
`playground-example.html` for the [Vanilla playground recipe](recipes/playground.md).

Render the [canonical component HTML](../contracts/README.md) in your templates with unique IDs
and the initial state. Load the CSS entries and your own module:

```html
<link rel="stylesheet" href="/ui/tokens/tokens.css" />
<link rel="stylesheet" href="/ui/css/fonts.css" />
<link rel="stylesheet" href="/ui/css/styles.css" />
<script type="module" src="/js/ui.js"></script>
```

```js
import { createRuntime } from '/ui/runtime.js';

const runtime = createRuntime();
runtime.start(document);
```

The browser bundle includes Floater. Build the assets once in this repository and serve them
as static files in your application.

## Dynamic HTML

For explicit lifecycle management, call `runtime.start(element)` after insertion and
`runtime.stop(element)` before removal. Pass a node that stays in the document. A
`DocumentFragment` is emptied when inserted.

If your framework or template library replaces parts of the page, scope an observer to the
container that survives those replacements. It starts existing controllers, discovers new
roots, and cleans up removed ones. Return the disposer to the code that owns the container.

```ts file=/observe-faq.ts
import { CmRuntime, createCmAccordionController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('accordion', createCmAccordionController);

export function observeFaq(container: HTMLElement): () => void {
  return runtime.observe(container);
}
```

Call the returned function when the container is retired. Keep Vue-owned subtrees outside
the observed container. See [server rendering and hydration](./integration.md#server-rendering-and-hydration)
for ownership boundaries on a mixed page.

## Browser comparison

After `npm run build`, start the fixture server:

```bash
node scripts/visual/serve-cross-platform-cases.mjs
```

In another shell, run the comparison with an installed Chrome:

```bash
CHROME_PATH=/path/to/chrome node scripts/visual/check-vanilla-parity.mjs
```

The script compares the initial Vue and Vanilla render of every canonical case in both
themes at a 360 × 660 viewport with reduced motion. It also checks opening and keyboard
focus for the default accordion on both platforms. Pass case IDs to rerun a subset.
Set `CM_PARITY_REPORT` to change the JSON report path.

To exercise the browser behavior contracts with normal motion enabled, run:

```bash
CM_PARITY_BEHAVIOR=1 CHROME_PATH=/path/to/chrome node scripts/visual/check-vanilla-parity.mjs
```

This compares each adapter with the same action and assertion sequence, and compares the distinct
transition and animation signatures recorded during those actions. The visual mode also compares
initial CSS animation signatures with normal motion enabled.
