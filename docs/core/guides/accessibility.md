---
title: 'Accessibility'
description: 'Keyboard, focus, ARIA, motion, forced-colors, RTL, screen-reader, and WCAG integration guidance'
order: 4
---

# Accessibility

VueForge provides accessible component mechanics, but installing a component library cannot make an
application conform to WCAG by itself. Product content, labels, validation, page structure, routing,
custom slots, and application-specific color overrides remain the consumer's responsibility.

Use the component `Features` and `API` pages for exact keyboard and ARIA behavior. This guide defines
the application-level contract around those components.

## Keyboard Navigation

Native controls keep their native keyboard behavior. Composite widgets implement their documented
patterns:

- Tabs use arrow keys, Home, and End within the tab list.
- Menu Bar and nested menus use directional arrows; horizontal directions mirror in RTL.
- Select and Command Palette move through enabled options with arrow keys and select with Enter.
- Dialog, Drawer, and Command Palette close with Escape when enabled.
- Popover and Dropdown return focus to their trigger when closed through their component behavior.

Application checks are still required:

1. Reach every interactive element with the keyboard alone.
2. Confirm focus order follows reading order.
3. Confirm disabled items are skipped and cannot be activated.
4. Open nested overlays and verify Escape affects only the topmost active layer.
5. Test at 200% and 400% zoom without page-level horizontal scrolling.

Do not add positive `tabindex` values to rearrange focus. Reorder the DOM instead.

The W3C [keyboard interface guidance](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)
and [ARIA patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) are the normative references for custom
application widgets.

## Focus Management

Modal VueForge overlays trap focus while open and restore the previously focused element when they
close. They focus an element marked with `autofocus` or `data-autofocus` first; otherwise the overlay
surface receives focus.

Give every modal an accessible name:

```vue
<VfDialog v-model:open="open" title="Delete project?" description="This action cannot be undone.">
  <VfButton variant="danger">Delete project</VfButton>
</VfDialog>
```

Use `aria-label`/`ariaLabel`, `aria-labelledby`/`ariaLabelledby`, and
`aria-describedby`/`ariaDescribedby` only where the component API documents them. Prefer visible
titles and labels. When supplying a custom header slot, keep the generated relationship described in
that component's API.

Do not remove `:focus-visible` outlines or replace them with color alone. If application CSS changes
focus styles, verify a visible indicator on every supported surface in both modes and in forced
colors.

## ARIA and Accessible Names

VueForge supplies roles and relationships for its own widget structure. Custom slot content must
preserve the meaning:

- icon-only actions need an explicit accessible name;
- form controls need a visible label or an equivalent programmatic label;
- errors need both visible text and the relationship documented by the field component;
- decorative icons should remain hidden from assistive technology;
- custom Tabs panels must use the public `tabId`/`panelId` relationship;
- custom Command Palette result rendering must preserve the documented option behavior.

Do not add a second, conflicting widget role to a VueForge root. Test the final rendered page rather
than the isolated component because duplicate IDs, hidden ancestors, and application slots can break
otherwise valid relationships.

## Reduced Motion

Core full CSS and every Core component CSS artifact include a
`prefers-reduced-motion: reduce` fallback. It reduces VueForge transition and animation durations,
disables repeated animation, and changes the horizontal scroller to immediate movement. CodeBlock
removes its copy transition, and animated VueForge icons stop spinning.

Keep the accessibility preference CSS when assembling granular styles. Avoid adding application
animations that override the query with longer durations:

```css
@media (prefers-reduced-motion: reduce) {
  .product-animation {
    animation: none;
    scroll-behavior: auto;
  }
}
```

Reduced motion is not the same as no feedback. Preserve visible state changes without relying on
movement.

## Forced Colors

Core CSS includes targeted `forced-colors: active` rules for focus indicators, checked
checkbox/radio controls, and disabled cues. These rules use system colors and remove a conflicting
focus shadow where necessary.

Consumer CSS should:

- avoid `forced-color-adjust: none` unless a control remains understandable with system colors;
- not encode state through a background image alone;
- keep borders and focus indicators available to the system palette;
- test custom icons, charts, and application-specific controls separately.

Chromium forced-colors emulation is useful for regressions, but it is not a substitute for native
Windows High Contrast testing.

## RTL

Set document direction with semantic HTML:

```html
<html lang="ar" dir="rtl"></html>
```

VueForge uses logical geometry in the affected navigation, field, overlay, and layout components.
Menu Bar keyboard direction, Switch movement, Skeleton shimmer, and horizontal scrolling account for
RTL.

Application content must still be tested for:

- mixed-direction text and numbers;
- start/end icon meaning;
- custom slot layout;
- tables and code samples that intentionally remain left-to-right;
- runtime changes to the nearest `dir` boundary.

Use `dir="ltr"` on code or data regions only when their content direction requires it; do not reset
the whole page to work around one component.

## Screen Readers

Run manual checks with at least one desktop screen reader before release. Recommended scenarios:

1. Navigate headings, landmarks, forms, and tables without a pointer.
2. Open Dialog, Drawer, Select, Dropdown, and Command Palette and listen for name, role, state, and
   position.
3. Trigger validation and asynchronous status changes.
4. Confirm focus returns to the expected trigger.
5. Confirm hidden SkeletonGate content is not announced while loading.

Automated DOM and ARIA assertions catch regressions, but they do not prove speech output or browse
mode behavior. VoiceOver, NVDA, and JAWS results can differ by browser and operating system.

## WCAG and Color

The built-in palette has regression-tested text, control-boundary, focus, status, and selected-state
pairings. See [Color Tokens](/core/guides/color-tokens#supported-contrast-pairings) for the supported
matrix and measured ratios.

That matrix is not a blanket WCAG conformance claim. Re-test both modes when you:

- override a primitive or semantic color;
- place text on a new surface;
- add opacity, filters, or blending;
- render custom content through a slot;
- use color as a status or selection signal.

Use the W3C [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) for application-level
acceptance criteria, including keyboard access, focus visibility, reflow, target size, labels,
status messages, and name/role/value.

## Release Checklist

Before shipping an application:

- run automated component tests and an accessibility scanner;
- complete keyboard-only light/dark and RTL passes;
- test reduced motion and forced colors;
- test 200% and 400% zoom/reflow;
- test at least one real screen reader/browser pair;
- repeat contrast checks for every customized color pairing;
- verify loading, error, empty, disabled, read-only, and invalid states.
