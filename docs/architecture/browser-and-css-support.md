# CodeMonster UI browser and CSS support

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-012`

## Decision

CodeMonster UI targets maintained evergreen browsers and ships standards-based CSS without a legacy
browser build. CSS-only and Annabel Razor consumers receive the same browser support as framework
adapters.

## Browser policy

The stable support matrix includes:

- the current and previous two stable Chrome releases;
- the current and previous two stable Edge releases;
- the current and previous two stable Firefox releases plus the current Firefox ESR;
- the current and previous two major Safari releases on macOS;
- the current and previous two major Safari releases on iOS and iPadOS;
- the current and previous two stable Chrome releases on Android.

The matrix advances with CodeMonster UI minor releases. Patch releases do not intentionally remove
support for a browser version that was included by their minor release.

Internet Explorer, legacy EdgeHTML, obsolete Android WebView versions, and browsers outside upstream
security support are not supported. Applications with longer browser-retention requirements may
pin a compatible CodeMonster UI release or own an application-level compatibility build.

## CSS feature policy

A CSS feature may be used in shared output when at least one condition is true:

1. it works across the supported browser matrix;
2. it is a progressive enhancement with a tested usable fallback;
3. a build-time transformation produces understandable standards-based CSS without changing the
   public contract.

New feature adoption requires a support review and representative browser tests. A convenient build
tool transform alone is not evidence that runtime behavior is equivalent.

## Required platform capabilities

CodeMonster UI requires these platform capabilities and does not provide legacy polyfills for them:

- CSS custom properties;
- modern flexbox and grid;
- logical properties and values;
- `:focus-visible`;
- modern media queries, including user preference queries;
- ES modules for optional browser runtime packages;
- standard DOM events, class lists, and element query APIs.

The approved matrix also permits modern color functions, `:has()`, container queries, and other
features already supported across the tested browsers. Their use must remain purposeful and covered
by the feature policy above.

## Source and distributed CSS

- Source CSS is plain CSS, not a required Sass or CSS-in-JS runtime.
- Custom media and container aliases may improve source maintainability but are expanded during the
  package build.
- Distributed CSS contains browser-readable queries and does not require consumer PostCSS plugins.
- Component styles consume `--cm-*` tokens and shared semantic classes.
- Logical properties are preferred for bidirectional layout.
- Vendor prefixes are generated only where the supported matrix requires them.
- Public CSS does not depend on framework style-scoping attributes.
- CSS entry points remain usable through a link element, direct import, or copied Composer asset.

Consumers may process distributed CSS further, but package correctness cannot depend on their build
pipeline.

## Color and theme policy

Default tokens may use OKLCH and `color-mix()` when the supported matrix passes visual verification.
Fallbacks are required when omission of a declaration would make essential content unreadable or a
control boundary invisible.

Theme contracts define semantic color responsibilities. A custom theme remains responsible for its
own accessible contrast while shared styles preserve forced-colors and preference behavior.

## JavaScript policy

The optional DOM runtime ships standards-based ESM. Framework adapters follow their framework's
supported build target and do not add a second legacy bundle to shared packages.

- No global polyfill package is installed by CodeMonster UI.
- No adapter mutates browser prototypes.
- Feature detection is preferred over user-agent detection.
- Missing progressive features degrade at the component boundary.
- Browser-only APIs stay behind the client initialization boundary.

## Verification

Continuous integration covers Chromium, Firefox, and WebKit engines for canonical rendering and
interaction cases. Release verification additionally checks representative real Safari and mobile
browser behavior where engine emulation is insufficient.

Tests include:

- canonical component rendering and interaction;
- keyboard and focus behavior;
- responsive and container-query layouts;
- light, dark, forced-colors, and reduced-motion modes;
- zoom, text spacing, and reflow;
- CSS-only linked stylesheets;
- Composer-published static assets;
- no-JavaScript and progressively enhanced Razor pages.

The exact automated browser versions are recorded in CI configuration when `CMUI-016` establishes
workspace conventions.

## Review policy

Review the matrix before each minor release, before adopting a new required CSS feature, and before
1.0. Emergency removal of an insecure or unsupported browser version requires release notes and an
appropriate semantic version decision.

## Consequences

- Shared CSS can use modern layout, selectors, and color without carrying an IE compatibility layer.
- Public Razor templates and SPA adapters receive the same visual capability and test matrix.
- Build-time CSS transformations are implementation details, not consumer prerequisites.
- Browser support remains explicit and reviewable as the web platform advances.
