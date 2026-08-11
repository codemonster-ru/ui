# CodeMonster UI component states

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-008`

## Decision

Component state uses the most semantic browser representation available. Visual configuration,
native state, accessibility state, runtime identity, and transient interaction state have distinct
representations and must not be duplicated without a documented need.

## Representation order

Choose state representation in this order:

1. native HTML attributes and element properties;
2. native CSS pseudo-classes;
3. required ARIA states and properties;
4. `data-cm-state` for observable component states with no sufficient native representation;
5. a narrowly named `data-cm-*` attribute for an orthogonal state that cannot use the options above;
6. CSS modifier classes for stable visual configuration, not transient behavior.

The contract records one authoritative representation for every state.

## Visual configuration

Stable presentation props use BEM modifier classes:

```html
<button class="cm-button cm-button--primary cm-button--lg">
  Save
</button>
```

Typical modifiers include:

- variant;
- size;
- orientation;
- density;
- layout mode.

Do not use modifier classes such as `.cm-accordion--open`, `.cm-button--focused`, or generic classes
such as `.is-active` for mutable interaction state.

## Native and ARIA state

Use native state whenever canonical HTML supports it:

```html
<button disabled>Save</button>
<input type="checkbox" checked>
<details open>...</details>
```

Use native pseudo-classes for browser interaction state:

```css
.cm-button:hover {}
.cm-button:active {}
.cm-button:focus-visible {}
.cm-input:disabled {}
```

ARIA represents accessibility state when native semantics are unavailable or insufficient:

```html
<button aria-expanded="false" aria-controls="account-panel">Account</button>
<div role="status" aria-busy="true">Saving</div>
```

ARIA must reflect actual component behavior. It is not added solely as a CSS hook.

## Shared component state

`data-cm-state` represents the primary externally observable state of a component when no native
attribute expresses it on the relevant contract element:

```html
<div class="cm-accordion" data-cm-accordion data-cm-state="closed">
  ...
</div>
```

State values are lowercase kebab-case enums declared in the component manifest, for example:

```text
closed
opening
open
closing
```

Interactive components render a deterministic initial `data-cm-state` value during SSR. Adapters
and the DOM runtime apply the same transition vocabulary.

An additional `data-cm-*` state attribute is allowed only for an independent state that cannot be
represented by native HTML, ARIA, or the primary state enum. Its name and allowed values belong in
the component contract.

## Runtime hooks

Runtime identity attributes such as `data-cm-accordion` and `data-cm-accordion-trigger` identify
controllers and targets. They are stable hooks, not state values.

```html
<div data-cm-accordion data-cm-state="closed">
  <button data-cm-accordion-trigger aria-expanded="false">...</button>
  <div data-cm-accordion-panel hidden>...</div>
</div>
```

Runtime hooks may be selected by behavior code. Component CSS should prefer semantic classes,
native state, ARIA, and `data-cm-state`; it must not depend on JavaScript initialization markers.

## State ownership and precedence

Every state is controlled by exactly one of these sources:

- a consumer-controlled prop;
- component-internal state initialized by a default prop;
- native browser state;
- server-rendered Razor data followed by DOM runtime state.

The contract defines controlled and uncontrolled behavior, allowed transitions, and change events.
Consumer attribute forwarding cannot override component-owned ARIA or `data-cm-state` values into an
inconsistent combination.

When a component is disabled:

- activation transitions do not run;
- change events caused by user activation do not fire;
- focus behavior follows the component's native or documented composite-widget semantics;
- disabled styling derives from the authoritative native or ARIA state.

## Styling rules

- Prefer `:disabled`, `:checked`, `:focus-visible`, and other native selectors.
- Select ARIA only when ARIA is already the authoritative state.
- Use `[data-cm-state='open']` for shared non-native state.
- Do not add a class that repeats the same state solely for styling convenience.
- Do not expose internal implementation flags as public selectors.
- Animation-only states must be documented if CSS or runtime consumers can observe them.

## Parity requirements

Parity cases verify:

- the same authoritative state representation on every platform;
- consistent initial SSR state;
- synchronized native, ARIA, hidden, and `data-cm-state` values;
- equivalent allowed and rejected transitions;
- no stale state attributes after a transition or disposal;
- styling selectors consume only approved public state hooks.

## Consequences

- CSS, framework adapters, and the DOM runtime observe one state vocabulary.
- Native browser behavior remains the default instead of being recreated with classes.
- State mismatches become contract failures rather than platform-specific visual bugs.
- Public styling hooks stay small and intentional.
