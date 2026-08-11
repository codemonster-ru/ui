# CodeMonster UI accessibility requirements

Status: Accepted  
Date: 2026-08-11  
Roadmap item: `CMUI-009`

## Decision

CodeMonster UI targets WCAG 2.2 Level AA for its components, examples, shared styles, and documented
interaction patterns. Conformance of a complete application still depends on application content,
composition, routing, and business behavior.

The normative references are:

- [Web Content Accessibility Guidelines 2.2](https://www.w3.org/TR/WCAG22/);
- [WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/);
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/);
- the [HTML Living Standard](https://html.spec.whatwg.org/multipage/).

Native HTML semantics and behavior take precedence over recreating a native control with ARIA.

## Contract requirements

Every component contract documents:

- semantic root and owned child roles;
- accessible-name and description sources;
- required labels and consumer responsibilities;
- keyboard interactions;
- focus entry, movement, restoration, and dismissal behavior;
- disabled, invalid, busy, expanded, selected, checked, and current states where applicable;
- relationships expressed through IDs and ARIA references;
- dynamic announcements, if any;
- reduced-motion, forced-colors, zoom, reflow, and text-spacing expectations;
- applicable automated and manual verification.

A component with no special accessibility behavior states that explicitly rather than omitting the
section.

## Semantic HTML and ARIA

- Use native buttons, links, inputs, selects, headings, lists, tables, and landmarks where their
  semantics match the contract.
- Do not add a redundant role to a native element without a documented interoperability need.
- Do not use ARIA to make a non-interactive element behave like a native control when a native
  control can satisfy the design.
- Every interactive control has an accessible name.
- Descriptions and errors are referenced programmatically when they are not part of the name.
- ARIA states reflect observable state synchronously.
- Generated relationship IDs are unique, deterministic for SSR, and stable through hydration.
- Decorative icons are hidden from the accessibility tree; meaningful standalone icons require a
  documented name.
- Placeholder text is not the only label for a form control.

## Keyboard interaction

- Native controls keep their browser keyboard behavior.
- Custom composite widgets follow the applicable Authoring Practices pattern unless the component
  contract documents a more suitable native model.
- All functionality available to a pointer is available from a keyboard, except where the content
  itself requires a path-based input.
- Do not use positive `tabindex` values.
- Tab order follows the meaningful DOM order.
- Arrow-key, Home, End, Enter, Space, and Escape behavior is specified per widget rather than added
  globally.
- Disabled items follow the selected widget pattern consistently, including whether they remain
  discoverable by arrow navigation.
- Keyboard handling does not block browser or assistive-technology shortcuts unnecessarily.

## Focus management

- Components do not move focus merely because they render or update.
- Opening a modal surface moves focus according to its contract and traps focus only while modal.
- Closing a transient surface restores focus to a meaningful surviving control when appropriate.
- Removing the focused element moves focus deliberately instead of leaving it on the document body.
- Focus indicators are visible in default, themed, forced-colors, and high-contrast environments.
- Sticky surfaces and overlays do not fully obscure the focused control.
- Roving focus and `aria-activedescendant` implementations have shared behavior scenarios.

## Forms and validation

- Labels remain programmatically associated with controls in every adapter.
- Required and invalid states use native semantics and ARIA consistently.
- Validation messages identify the affected field and are not communicated by color alone.
- Server-rendered Razor validation produces the same meaningful relationships as client-rendered
  validation.
- Components preserve native form name, value, submission, reset, and autofill behavior unless the
  contract explicitly defines a composite alternative.
- Error announcements are deliberate and do not create repeated or excessively verbose live-region
  output.

## Visual and motion requirements

- Default themes meet applicable WCAG 2.2 AA text and non-text contrast requirements.
- Information and state are not conveyed by color alone.
- Components support 200% text zoom and applicable 400% reflow without loss of functionality.
- Consumer text-spacing overrides do not clip or hide essential content.
- Pointer targets meet the applicable WCAG 2.2 target-size requirement or a documented exception.
- Motion respects `prefers-reduced-motion` and is not required to understand state changes.
- Forced-colors styles preserve control boundaries, state, and focus visibility.

Custom themes can invalidate contrast. Token tooling and documentation must identify which semantic
token pairs carry contrast responsibilities.

## Testing requirements

Accessibility verification uses complementary layers:

1. contract checks for required roles, names, states, and relationships;
2. automated accessibility scans on canonical cases and adapter examples;
3. shared keyboard, focus, and state behavior scenarios;
4. SSR and hydration checks for stable IDs and initial state;
5. visual checks for focus, contrast, forced colors, zoom, and reduced motion;
6. manual browser and assistive-technology review for stable interactive components.

Automated scans are a gate, not proof of conformance. A component cannot waive a known issue merely
because an automated tool does not report it.

## Platform parity

Adapters may use different framework mechanisms, but they must preserve:

- the same accessible name and description result;
- equivalent roles and state exposure;
- equivalent keyboard and focus outcomes;
- equivalent form participation;
- equivalent live-region intent;
- the same consumer responsibilities documented by the component contract.

Platform-specific accessibility deviations require the narrow exception process defined by the
canonical HTML decision.

## Review policy

Review the normative standards before the first prerelease and before 1.0. A newer stable standard
does not silently change component behavior; adopting it requires a documented contract review and
test updates.

## Consequences

- Accessibility is part of each component's public behavior, not a final audit phase.
- Canonical fixtures and behavior scenarios include accessibility state from the beginning.
- CSS-only and Razor consumers receive a usable semantic baseline without framework JavaScript.
- Adapter parity includes user outcomes, not only matching visual output.
