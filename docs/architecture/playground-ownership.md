# Playground ownership

Status: Accepted  
Date: 2026-08-13  
Revisited: 2026-09-03  
Roadmap item: `CMUI-148`

## Decision

The VueForge Playground packages remain a separately versioned product family outside CodeMonster
UI. CodeMonster UI owns the components used around documentation and examples, but it does not own
source compilation, executable previews, sandbox policy, virtual source modules, or an IDE-like
editor surface.

No `ui-playground` package, `CmPlayground` component, Annabel Razor adapter, or Playground controller
is added to the CodeMonster UI 1.0 topology. The existing packages remain supported under the
VueForge migration and maintenance policy and may run alongside CodeMonster UI.

## Why this held up under the same test that moved icons and layouts

By 2026-09-03 the icon and layout lines had each looked hard to port and turned out portable once
read closely enough — icons looked like a 2,135-line rendering engine that would have to be
duplicated in PHP and turned out to be static data once precomputed. That made "retained" worth
re-checking rather than trusting as a standing label: was Playground actually the same kind of
question, just not yet worked through?

It is not, and the code says why rather than a category label asserting it.
`packages/playground-core/src/typescriptWorker.js` transpiles with a real `Worker`:

```js
self.addEventListener('message', (event) => {
  const request = event.data;
  // ... transpiles request.sources with the TypeScript compiler ...
  self.postMessage({ type: 'result', id: request.id, outputs: [] });
});
```

`packages/playground-core/src/runtimes/browserRuntime.ts` runs the result in a sandboxed frame:

```ts
export function runInIframe(iframe: HTMLIFrameElement, html: string): void {
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.srcdoc = html;
}
```

`Worker` and `HTMLIFrameElement` are not a framework choice Vue happened to make; they are what a
live, reactive, sandboxed preview of arbitrary just-typed code requires, and nothing server-rendered
can supply either. A PHP request answers one request with one response; it cannot host a running
session watching for the next keystroke. An icon's output is a pure function of three known values,
computable once and shipped as data. Playground's output is a pure function of whatever a person is
typing at this instant — not a harder version of the same precomputation problem, a different one.

Confirmed rather than assumed: nothing in `ui-vue`, `ui-layouts`, `ui-runtime`, or `ui-icons`
depends on any of the three Playground packages.

## Reviewed package boundaries

| Package                                           | Responsibility                                                                                                                     | Ownership outcome                              |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `@codemonster-ru/vueforge-playground-core`        | Framework-independent session state, TypeScript worker, module compilation, iframe document generation, and preview messaging      | Retained Playground runtime product            |
| `@codemonster-ru/vueforge-playground`             | Vue editor/preview UI, component-preview mode, theme bridging, console/files/actions regions, and Playground session orchestration | Retained Vue Playground adapter                |
| `@codemonster-ru/vueforge-playground-vite-plugin` | Build-time virtual modules backed by explicitly configured local source files                                                      | Retained Playground build integration          |
| `examples/vue`                                    | Repository showcase and manual integration consumer                                                                                | Application; migrated separately by `CMUI-153` |

The framework-independent core remains outside `ui-runtime`. The latter enhances canonical
CodeMonster UI DOM with small controllers; it must not become a compiler, worker host, module
resolver, or general executable-code sandbox.

## Security and lifecycle boundary

Playground executes authored code inside an iframe with a package-defined sandbox policy, compiles
TypeScript in a worker, resolves module imports, and exchanges structured messages with the preview.
Those responsibilities need a dedicated threat model, browser lifecycle, dependency policy, and
release cadence. They are materially different from rendering or progressively enhancing a design
system component.

The Vite plugin reads only configured development sources and exposes them through virtual modules.
It is build tooling, not a browser or component adapter. Moving it into a UI package would couple
the stable component release graph to a specific bundler.

Annabel Razor can host a Playground application as an independently built frontend asset, but the
Composer UI package does not compile or execute source code and does not publish the Playground
artifacts. PHP templates must not turn arbitrary source, bootstrap scripts, or generated preview
HTML into trusted component slots.

## Consumer guidance

- Vue documentation and application consumers may keep the three VueForge packages while migrating
  surrounding controls and layouts to CodeMonster UI.
- Import the Playground UI and runtime through their documented explicit subpaths. Do not initialize
  CodeMonster UI runtime controllers over the Vue-owned Playground root.
- Treat executable Playground sources and import resolvers as application configuration, not as
  ordinary display content.
- A Razor site that needs Playground should serve a separately built client application and define
  its own content-security, origin, and authorization policy.

## Reconsideration criteria

The product family may be renamed or moved only through a dedicated product roadmap that defines:

1. supported source languages, compilers, frameworks, bundlers, and browsers;
2. iframe sandbox, CSP, origin, messaging, import resolution, and resource-limit contracts;
3. framework adapters and server embedding requirements backed by real consumers;
4. bundle budgets, worker delivery, offline behavior, and version compatibility;
5. a migration and release plan independent from CodeMonster UI component SemVer.

That roadmap may reuse CodeMonster UI as a dependency, but it must not make Playground part of the
design-system adapter surface.

## Consequences

- CodeMonster UI packages remain small and do not acquire TypeScript, worker, iframe, or Vite
  responsibilities.
- Playground keeps its existing tested runtime and Vue integration during repository migration.
- The example and documentation migrations can replace VueForge UI dependencies incrementally
  without rewriting executable preview infrastructure.
- Migration tooling reports Playground packages as retained product dependencies and performs no
  automatic package or component rename.
