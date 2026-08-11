# CodeMonster UI rendering strategy

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-010`

## Decision

CodeMonster UI supports static HTML, server rendering, progressive enhancement, and native framework
hydration as distinct rendering modes. Canonical HTML and native browser behavior provide the
baseline; JavaScript adds only the interaction that the selected component requires.

Annabel Razor output is progressively enhanced by the framework-independent DOM runtime. It is not
implicitly hydrated by Vue, React, or Angular.

## Rendering modes

| Mode | Renderer | Client behavior |
| --- | --- | --- |
| CSS-only | Authored or generated HTML | Native browser behavior only |
| Server-rendered | Annabel Razor or framework SSR | Complete initial content and semantic state |
| Progressively enhanced | Server HTML plus `ui-runtime` | Scoped DOM controllers add interaction |
| Framework hydrated | Matching framework server and client adapters | Framework resumes component ownership |

A component contract identifies the minimum supported mode. Static components must not require
JavaScript. Interactive components document their native fallback and enhancement behavior.

## Server-rendering requirements

- Package modules used by SSR do not access `window`, `document`, storage, media queries, or layout
  APIs during module evaluation or render.
- Server output contains meaningful content, semantic structure, initial state, and accessibility
  relationships.
- Initial props produce deterministic significant DOM.
- Generated IDs remain stable between a framework's server render and hydration.
- Time, randomness, locale, and environment values are injected or resolved before rendering when
  they affect canonical output.
- Browser-only measurement and observers start after client initialization.
- Browser event listeners are not represented as required server markup.
- Multiple component instances do not share mutable request state.

Node ESM, CommonJS where supported, and Composer consumers receive explicit server-safe entry points
when a default browser entry has side effects.

## Native baseline

Without JavaScript:

- links navigate through `href`;
- buttons and native form controls retain their standard behavior;
- forms submit their names and values;
- labels, descriptions, errors, and content remain available;
- server-selected open, selected, checked, busy, and invalid states remain understandable;
- essential content is not hidden solely in anticipation of client initialization.

A custom widget that has no complete native equivalent may expose reduced functionality without
JavaScript, but its contract must describe that boundary and provide access to the underlying
content or server action.

## Progressive enhancement

The DOM runtime discovers explicit `data-cm-*` roots and attaches narrowly scoped controllers.

- Initialization is idempotent.
- Controllers adopt the state already rendered by the server.
- Initialization does not replace contract-owned markup wholesale.
- Runtime changes keep native, ARIA, hidden, and `data-cm-state` values synchronized.
- Disposal removes listeners, observers, timers, and runtime-owned references.
- Reinserted or dynamically rendered content can initialize without reinitializing existing roots.
- A controller failure is isolated to its component root where practical.
- Runtime initialization markers are not required CSS selectors.

The runtime may emit documented DOM events. It does not recreate application routing, server data
loading, or a general component framework.

## Framework hydration

Each framework hydrates only markup rendered by its matching adapter:

- Vue server output is hydrated by `ui-vue`;
- React server output is hydrated by `ui-react`;
- Angular server output is hydrated by `ui-angular`;
- Annabel Razor output is enhanced by `ui-runtime` unless an application explicitly mounts an
  independently designed framework island.

Cross-framework hydration is unsupported. Matching canonical HTML does not make framework-internal
hydration metadata interchangeable.

Framework adapters must:

- produce matching significant server and first-client DOM;
- avoid hydration warnings for supported cases;
- delay layout-dependent behavior until the platform's client lifecycle;
- preserve user-entered form state when hydration occurs;
- avoid running the DOM runtime on roots owned by the framework.

## Ownership markers

Runtime roots may carry an internal ownership marker after initialization. Framework adapters may
mark roots as framework-owned when a page can load the generic runtime globally. Ownership markers
are implementation details unless a contract explicitly exposes them for integration.

The initializer must not attach a DOM controller to a framework-owned root. Applications must not
initialize two frameworks or a framework and DOM controller over the same component boundary.

## Themes and initial rendering

Theme selection must be available before or during initial rendering when it affects the initial
visual result. Theme initialization should avoid a visible incorrect-theme flash, but theme storage
access remains client-only. Nested server-rendered theme scopes preserve their explicit attributes
without waiting for framework hydration.

Detailed theme boot behavior belongs to the tokens and theme runtime design rather than individual
component adapters.

## Testing requirements

Applicable components and packages verify:

1. server-safe module import without DOM shims;
2. deterministic server output for canonical cases;
3. valid repeated-instance ID relationships;
4. no-JavaScript content and native behavior;
5. progressive initialization, repeated initialization, and disposal;
6. matching framework hydration without warnings;
7. preservation of initial state and user-modified form values;
8. separation between DOM-runtime and framework-owned roots.

Packed-consumer tests use built package artifacts so workspace aliases cannot hide browser-only
imports in server entry points.

## Consequences

- Public Razor templates remain useful without adopting a frontend framework.
- Framework applications keep native lifecycle and hydration behavior.
- Shared HTML enables visual and semantic parity without claiming cross-framework hydration.
- Browser-only code has explicit initialization boundaries and can be tested independently.
