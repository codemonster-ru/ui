# Vue and Razor accessibility and visual verification

Verification date: 2026-08-13.

`CMUI-157` passed on the same repository state with Node.js 24.15.0 and the `annabel-php` image:

```bash
npm run test:ui
npm run check:ui-packages
npm run check:composer-packed-consumer
```

The shared contract gate validated 87 canonical component cases, 44 interaction scenarios, and 348
visual fixture documents across light/dark themes and mobile/desktop viewports. Axe reported no
violations in the canonical cases; repository checks also rejected duplicate IDs, unresolved ARIA
relationships, positive tab order, missing accessible names, selector drift, and missing reduced
motion or forced-colors hooks.

Vue passed 62 DOM interaction tests and 105 SSR/package tests, including significant-DOM comparison
with every applicable canonical case and shared behavior scenarios. The framework-independent
runtime passed 58 tests, including keyboard navigation, focus containment and restoration,
disclosure dismissal, controlled state events, and progressive-enhancement scenarios.

Annabel Razor passed PHPStan and 133 tests with 305 assertions. Its parity tests rendered the same
canonical cases through Razor, while the packed consumer verified the exact Composer archive,
provider registration, component rendering, and integrity-checked shared styles.

The visual gate validates deterministic fixture documents, selectors, theme/viewport coverage,
shared CSS, and adapter DOM parity. It is not a pixel-diff baseline and does not replace manual
browser, zoom/reflow, or assistive-technology review in a real application. Those application-level
checks remain part of prerelease consumer validation rather than being misrepresented as automated
coverage here.
