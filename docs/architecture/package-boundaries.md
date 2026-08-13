# CodeMonster UI package boundaries

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-004`

## Decision

CodeMonster UI separates a framework-independent shared kernel from thin platform adapters. The
component contract and canonical HTML are the sources of truth; no platform implementation owns
the public semantics of a component.

There is no generic `ui-core` package. A broad core would hide unrelated responsibilities and tend
to accumulate platform abstractions. Shared code is published only when it has one clear runtime or
distribution responsibility.

## Shared kernel ownership

| Package or repository area | Owns | Must not own |
| --- | --- | --- |
| Component contracts | Props, slots, states, canonical HTML, accessibility, behavior fixtures | Framework source code or package wiring |
| `ui-tokens` | Token schemas, theme data, CSS-variable generation, breakpoint definitions | Component markup, DOM access, or framework APIs |
| `ui-css` | Foundation CSS, semantic component CSS, selectors, visual states | Component state management or framework imports |
| `ui-utilities` | Generated token-backed utility classes | Semantic component behavior or framework integrations |
| `ui-icons` | Canonical icon data, metadata, raw SVG rendering primitives | Vue, React, Angular, or Razor component lifecycles |
| `ui-runtime` | Optional DOM controllers, lifecycle, events, focus, keyboard behavior | Server rendering, virtual DOM adapters, or component styling |

Component contracts are repository-owned test and documentation inputs initially. They do not
become a public runtime package until at least two concrete consumers need the same executable API.

## Adapter ownership

| Adapter | Owns | Must not own |
| --- | --- | --- |
| `ui-vue` | Vue props, emits, slots, reactivity, SSR-safe Vue rendering | Canonical styling or React/Angular dependencies |
| `ui-react` | React props, callbacks, children, refs, SSR-safe React rendering | Canonical styling or Vue/Angular dependencies |
| `ui-angular` | Angular inputs, outputs, templates, forms, and lifecycle | Canonical styling or Vue/React dependencies |
| `codemonster-ru/ui` | PHP component classes, Razor templates, Annabel registration, asset publication | A separate CSS implementation or generic Razor compiler features |

Every adapter translates its native API into the same significant DOM, shared classes, native
attributes, ARIA state, and behavior contract. Platform syntax may differ where the platform model
requires it.

## Annabel ownership boundary

Annabel Razor owns only the generic component mechanism:

- component parsing and compilation;
- component registry and resolution;
- props and attribute transport;
- default and named slots;
- nested component evaluation;
- trusted rendered markup and escaping boundaries;
- generic compiler diagnostics.

CodeMonster UI owns every `cm-*` component, its props, templates, accessibility semantics, CSS, and
optional runtime integration. Annabel must not contain special cases for CodeMonster UI component
names.

## Dependency direction

```text
component contracts
        |
        +--> ui-tokens --> ui-css
        |       |
        |       +-------> ui-utilities
        |
        +--> ui-icons
        +--> ui-runtime
        |
        +--> ui-vue ---------+
        +--> ui-react -------+--> consumer applications
        +--> ui-angular -----+
        +--> Composer UI ----+
```

The arrows express design and package dependencies from source to consumer. Adapters may consume
shared packages but shared packages must never import adapters.

Additional rules:

- adapters do not depend on one another;
- `ui-css` may consume generated token artifacts but does not require a JavaScript runtime in the
  browser;
- `ui-runtime` operates on the canonical HTML contract and does not render application content;
- the Composer adapter packages verified shared CSS and runtime artifacts instead of rebuilding
  their source in PHP;
- framework packages remain peer dependencies of their matching adapter;
- internal pure helpers stay local until repeated ownership provides evidence for extraction.

## Rendering and behavior ownership

Static and server-rendered components need no shared JavaScript. Interactive components define a
behavior contract independently from any adapter:

- Annabel Razor renders canonical HTML and opts into `ui-runtime` controllers;
- Vue, React, and Angular normally implement state with their native primitives;
- native adapters may reuse framework-independent algorithms, but not DOM controllers that compete
  with the framework lifecycle;
- all implementations run the same meaningful state, keyboard, focus, and ARIA scenarios.

This design shares behavior semantics without forcing one framework's lifecycle onto another.

## Prohibited shortcuts

- Do not treat the existing Vue component as the canonical component specification.
- Do not generate React, Angular, or Razor source directly from Vue files.
- Do not implement the design twice in npm and Composer packages.
- Do not require Vue for CSS-only or Annabel consumers.
- Do not add fallback aliases for new `cm` APIs solely to preserve `vf` names.
- Do not extract a shared abstraction before its responsibility and consumers are demonstrated.

## Current VueForge relationship

Existing VueForge packages remain unchanged until their migration work is explicitly scheduled.
They are source material, not the target dependency graph:

- the existing theme package informs `ui-tokens`;
- Core component CSS informs `ui-css`;
- Core Vue components inform `ui-vue` without defining the cross-platform contract;
- the icon catalog informs the framework-independent `ui-icons` representation;
- existing layouts, CodeBlock, and Playground are reviewed only in their roadmap phases.

## Consequences

- Cross-platform work begins by defining contracts and shared artifacts, then adds adapters.
- A platform-specific need remains in its adapter unless it changes the approved shared contract.
- CSS-only HTML and Annabel remain first-class consumers without frontend framework dependencies.
- Package dependency checks can enforce a small, acyclic public architecture.
