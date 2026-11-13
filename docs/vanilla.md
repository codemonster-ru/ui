---
title: 'Vanilla HTML and JavaScript'
description: 'Serve CodeMonster UI assets directly from server templates'
---

# Vanilla HTML and JavaScript

Run `npm run build:vanilla` in the library checkout. Serve the contents of
`examples/vanilla/dist` over HTTP. Keep the `tokens` and `css` directories intact so
their relative imports resolve. The included `index.html` demonstrates an interactive accordion.

Render the [canonical component HTML](../contracts/README.md) in your templates with unique IDs
and the initial state. Load the CSS entries and your own module:

```html
<link rel="stylesheet" href="/ui/tokens/tokens.css" />
<link rel="stylesheet" href="/ui/css/styles.css" />
<script type="module" src="/js/ui.js"></script>
```

```js
import { createRuntime } from '/ui/runtime.js';

const runtime = createRuntime();
runtime.start(document);
```

For dynamic fragments, call `runtime.start(fragment)` after insertion and
`runtime.stop(fragment)` before removal. The browser bundle includes Floater and has
no bare imports. Build the assets once in this repository and serve them as static files in
your application.

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
