# CodeMonster UI component model

Status: Accepted  
Date: 2026-08-30

## Decision

Components are canonical HTML plus a framework-independent behavior core, rendered by thin platform
adapters. They are not custom elements, and they do not use Shadow DOM.

`packages/runtime/src/core/` holds the rules — which item is active, where a key moves focus, what a
set of props reduces to — as pure functions over plain data. Adapters translate: the Vue components
bind those results declaratively, the DOM controllers in `ui-runtime` write them onto
Vanilla markup, including server-rendered pages.

## Context

Canonical fixtures and Vanilla templates use native HTML elements with shared classes such as
`cm-select` and `cm-tabs`.

## Why not Web Components

**Server rendering is the priority, and custom elements are weakest there.** The server emits markup
that already works: a select submits through its hidden input, links navigate, a table reads. The
runtime only adds interaction to markup that is already correct. A custom element does nothing until
`customElements.define` runs. Declarative Shadow DOM addresses the visual half of that gap, not the
behavioral half, and would require additional server markup. See [rendering strategy](./rendering-strategy.md) for the modes this would weaken.

**It would add a layer rather than remove one.** Framework adapters would still be needed: React's
interop with custom elements remains awkward around props and events. The result is
`core → custom element → framework wrapper` where there is now `core → adapter`.

**Shadow DOM conflicts with the contract.** CSS class names are public API here: the canonical DOM
comparison compares them and `check:ui-component-selectors` guards them. Under Shadow DOM they
become internal and consumers lose the ability to target `.cm-select__option`, leaving `::part()` —
a poorer interface for a design system meant to be themed. The 234 custom properties would survive,
since those pierce shadow boundaries; the class API would not. Custom elements without Shadow DOM
keep the styling model but give up the encapsulation that was the reason to adopt them, and still
carry the upgrade gap.

## What the current model costs

Vue SSR is compared with the canonical HTML fixture. Browser tests render that HTML with the
Vanilla runtime and compare appearance and behavior with the mounted Vue component.

Both adapters render `data-cm-controller` to match the canonical DOM, so a page running `CmRuntime`
alongside framework components has two candidate owners for the same element. Components claim their
root with `data-cm-hydrated` on mount and the runtime skips claimed elements.

## What would change this decision

- Server rendering stops being a priority, removing the upgrade-gap objection.
- A requirement appears to embed into host applications whose frameworks or styles cannot be
  reconciled, where Shadow DOM's isolation is not replaceable by convention.

Neither holds today. If either does, the behavior core survives the change: it is framework-free
TypeScript with no DOM access, and a custom-element adapter would consume it exactly as the existing
adapters do. The core is the durable asset, and it makes such a move cheaper later rather than
harder.

## Consequences

- A Web Components adapter remains possible as a future integration. It is not the component model itself.
- Adapters stay thin enough that a framework major version is an adapter-sized change, not a
  system-sized one.
- New behavioral components follow the split described in `ARCHITECTURE.md`; the rules go in the
  core, and neither adapter re-implements them.
