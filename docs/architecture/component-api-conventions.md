# CodeMonster UI component API conventions

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-007`

## Decision

Component contracts define one semantic API and map it to idiomatic platform APIs. Names and
behavior stay equivalent across platforms, but framework-specific binding and event syntax are not
artificially made identical.

## Props

Canonical prop names use lower camel case in manifests and prose:

```text
defaultOpen
ariaLabel
validationMessage
```

Template syntaxes use their native casing rules:

| Contract | Vue template | React | Angular template | Annabel Razor |
| --- | --- | --- | --- | --- |
| `defaultOpen` | `default-open` | `defaultOpen` | `[defaultOpen]` | `default-open` |
| `ariaLabel` | `aria-label` when native | `aria-label` when native | `attr.aria-label` when native | `aria-label` when native |

Additional rules:

- use native HTML attribute names when the prop directly represents a native attribute;
- use positive boolean names and default them explicitly;
- distinguish omitted, `null`, empty, and false values only when the contract documents a semantic
  difference;
- use enums for finite visual or behavior variants;
- keep structured values serializable unless a platform extension is explicitly local;
- do not expose framework instances, virtual nodes, refs, or dependency-injection values in the
  shared manifest;
- reject invalid finite values in development and define deterministic production behavior.

## Controlled values and binding

The contract describes the value, default value, and change semantics. Adapters expose idiomatic
binding surfaces:

| Concern | Vue | React | Angular | Annabel Razor |
| --- | --- | --- | --- | --- |
| Current value | `modelValue` | `value` | `value` / forms API | native `value` attribute |
| Initial value | component-specific default prop | `defaultValue` | forms initialization | server-rendered value |
| Value update | `update:modelValue` | `onValueChange` | `valueChange` / forms API | native submission or runtime event |

This mapping is adapter-level syntax, not a semantic difference. Controlled and uncontrolled modes
must not be mixed unless the component contract defines the precedence.

## Native attributes

Components forward unknown safe attributes to their documented semantic root. Each contract names
that root when it is not obvious.

- `class` merges with contract classes without removing them.
- `style` uses the platform's native merging behavior; tokens and custom properties remain the
  preferred customization surface.
- consumer `id`, `name`, `value`, `title`, `lang`, `dir`, `data-*`, and accessibility naming
  attributes are preserved when valid for the root.
- component-owned state attributes and ARIA relationships are computed by the component and cannot
  be made inconsistent through an attribute spread.
- invalid attributes are not moved silently to an arbitrary wrapper.
- event listeners follow the platform's normal listener composition rules.

Attribute ownership and merge order must be tested for every component that computes native or ARIA
state.

## Events

Use native events when canonical HTML already provides the required semantics. Button activation,
input, change, focus, blur, and form submission should remain native unless a component transforms
their meaning.

Custom semantic event identifiers use lower camel case, for example `openChange`, `valueChange`,
and `dismiss`. Adapters map them idiomatically:

| Contract event | Vue | React | Angular | DOM runtime |
| --- | --- | --- | --- | --- |
| `openChange` | `update:open` or documented `open-change` | `onOpenChange` | `openChange` | `cm:open-change` |
| `dismiss` | `dismiss` | `onDismiss` | `dismiss` | `cm:dismiss` |

A controllable prop uses the platform's established two-way binding convention. The component
contract records the exact mapping so an adapter does not expose two redundant custom events.

Semantic event payloads contain component values and documented reasons, not framework event
objects. Native event handlers may still receive their native platform event.

Annabel Razor components do not accept server-side PHP callbacks for browser interactions. They
render native form or link behavior and, where needed, expose documented DOM runtime events.

## Slots and content regions

The contract calls composable content regions slots, regardless of platform terminology.

- every composable component may define one `default` slot;
- named slots use lower camel case identifiers such as `header`, `footer`, `leading`, and `trailing`;
- slot names describe semantic content roles, not visual coordinates;
- slot order and fallback content are part of canonical HTML;
- required slots and allowed empty content are explicit;
- scoped slot values must be serializable contract data where cross-platform parity requires them;
- platform-only render callbacks remain adapter extensions and cannot replace a required shared
  content region.

Adapters use native composition mechanisms: Vue slots, React children or named content props,
Angular content projection, and Annabel Razor default or named slots.

## Public platform extensions

An adapter may expose an additional API only when the platform requires it, such as React refs,
Angular forms integration, or Vue model modifiers. Extensions must:

1. preserve the shared contract by default;
2. stay documented in the adapter rather than the shared manifest;
3. avoid changing canonical HTML for ordinary cases;
4. have adapter-specific tests;
5. not become an undocumented requirement for another adapter.

## Consequences

- Equivalent component usage remains recognizable without fighting framework conventions.
- Native browser behavior stays available to CSS-only and Razor consumers.
- Shared manifests remain portable because they contain semantic values rather than framework APIs.
- Adapter extensions have an explicit boundary and cannot redefine the common component contract.
