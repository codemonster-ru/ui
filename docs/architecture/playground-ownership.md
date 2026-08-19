# Playground ownership

Status: Accepted  
Date: 2026-08-13  
Roadmap item: `CMUI-148`

## Decision

The VueForge Playground packages remain a separately versioned product family outside CodeMonster
UI. CodeMonster UI owns the components used around documentation and examples, but it does not own
source compilation, executable previews, sandbox policy, virtual source modules, or an IDE-like
editor surface.

No `ui-playground` package, `CmPlayground` component, Annabel Razor adapter, or Playground controller
is added to the CodeMonster UI 1.0 topology. The existing packages remain supported under the
VueForge migration and maintenance policy and may run alongside CodeMonster UI.

## Reviewed package boundaries

| Package | Responsibility | Ownership outcome |
| --- | --- | --- |
| `@codemonster-ru/vueforge-playground-core` | Framework-independent session state, TypeScript worker, module compilation, iframe document generation, and preview messaging | Retained Playground runtime product |
| `@codemonster-ru/vueforge-playground` | Vue editor/preview UI, component-preview mode, theme bridging, console/files/actions regions, and Playground session orchestration | Retained Vue Playground adapter |
| `@codemonster-ru/vueforge-playground-vite-plugin` | Build-time virtual modules backed by explicitly configured local source files | Retained Playground build integration |
| `examples/vue` | Repository showcase and manual integration consumer | Application; migrated separately by `CMUI-153` |

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
