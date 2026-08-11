# CodeMonster UI canonical HTML

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-006`

## Decision

Every component contract defines canonical semantic HTML. Platform adapters must render the same
significant DOM, but their serialized HTML does not need to be byte-identical.

Canonical HTML is authored deliberately from component semantics and accessibility requirements.
It is never captured from a framework implementation and promoted automatically to the contract.

## Canonical markup rules

- Prefer the native element that matches the component action or content.
- Keep the public structure as small as styling, content placement, and accessibility permit.
- Add wrapper elements only when they have a documented semantic, layout, or behavior purpose.
- Use shared `cm` classes on every contract-owned element that needs stable styling.
- Represent accessibility with native semantics first and ARIA only where necessary.
- Keep authored content in the same significant position and order on every platform.
- Avoid inline styles when a token, class, custom property, or documented consumer style hook works.
- Do not expose framework-generated elements as part of the canonical contract.

## Significant DOM

Parity comparison includes:

- element names, semantic roots, hierarchy, and sibling order;
- contract-owned text and slot placement;
- the set of shared CSS classes, independent of class ordering;
- native state and form attributes such as `disabled`, `checked`, `required`, `name`, and `value`;
- roles, accessible-name attributes, ARIA states, and ARIA relationships;
- CodeMonster UI `data-cm-*` state and runtime hooks;
- presence and relationships of labels, descriptions, errors, controls, and panels;
- `hidden`, `tabindex`, `type`, `href`, and other behaviorally meaningful attributes;
- documented icon and progress-indicator placement.

Unexpected platform-only elements, shared classes, ARIA attributes, or state attributes fail parity
unless the component contract explicitly allows them.

## Normalized differences

Parity tooling normalizes differences that do not change component semantics:

- attribute ordering;
- CSS class ordering;
- equivalent HTML boolean-attribute serialization;
- HTML parser normalization of void elements;
- comments and framework hydration markers;
- framework style-scoping attributes such as Vue and Angular compiler attributes;
- insignificant whitespace between elements;
- generated identifier values when their uniqueness and reference relationships remain equivalent.

Meaningful text whitespace is not normalized. Inline style declarations are compared by parsed
property and value rather than serialization order when a contract explicitly requires them.

## Generated identifiers

Canonical fixtures use descriptive placeholder identifiers such as `button-trigger-id`. Adapter
output may use a different deterministic value. Comparison assigns generated identifiers stable
aliases and then verifies:

- uniqueness within the rendered component boundary;
- equivalent `for`, `aria-controls`, `aria-describedby`, and `aria-labelledby` relationships;
- stable server and hydrated client relationships;
- no collision between repeated component instances.

Consumer-provided identifiers remain significant and must be preserved exactly.

## Root attributes

Consumer attributes are forwarded to the semantic root unless a component contract designates a
different target. Contract-owned classes merge with consumer classes. Contract-owned behavior and
accessibility attributes cannot be removed accidentally through forwarding.

Rules for collisions, event listeners, and platform mappings are defined by `CMUI-007`.

## Allowed deviations

A platform deviation is allowed only when its native rendering model requires it and all of these
conditions hold:

1. the deviation is described in `contract.md`;
2. it preserves semantics, accessibility, styling hooks, and observable behavior;
3. parity tooling has a narrow rule for that component and platform;
4. the deviation does not become a second canonical structure.

Convenience, an existing adapter implementation, or a difficult test is not sufficient reason for
a deviation.

## Comparison output

Parity failures report structural paths and semantic differences rather than raw serialized HTML
only. A useful failure identifies the component case, platform, DOM path, expected value, and actual
value.

Canonical fixture updates require a contract change. Snapshot update commands must not overwrite
canonical HTML without an explicit reviewed diff.

## Consequences

- CSS and runtime behavior can rely on one stable semantic structure.
- Razor server output is evaluated by the same meaningful rules as framework SSR output.
- Framework implementation details do not create false parity failures.
- DOM changes become explicit contract changes instead of incidental adapter refactors.
