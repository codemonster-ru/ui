# VueForge 2 — final UI consistency audit

Audit date: 2026-07-24.

## Scope and constraints

The public interactive VueForge Core components were reviewed before the 2.0 release: their states,
geometry, semantic state tokens, transitions, focus treatment, and behavior in light and dark themes.
Changes were limited to confirmed visual inconsistencies. The architecture, public API, props,
exports, accessibility contracts, SSR, package structure, build pipeline, OKLCH palette, and set of
design tokens were unchanged.

The actual public boundaries differ from some wording in the original task:

- `VfTooltipPlacement` supports only `top | bottom`; `left` and `right` were not added because that
  would change the public API;
- `VfNavMenu` supports `default | pills | sidebar`; there are no `filled` or `soft` variants;
- there is no separate public `VfToggle` or `VfMenu`; `VfSwitch`, `VfThemeSwitch`, and `VfMenuBar`
  were reviewed;
- `VfBadge` renders as a non-interactive `span` and has no interactive props.

## Issues found and fixes

### Button and IconButton

The `secondary` hover was imperceptible because the base `surface-subtle` and semantic hover surface
resolved to the same color in both themes. The base background now uses the existing
`--vf-color-background-surface`. Hover and active continue to use the existing `surface-hover` and
`surface-active` through component aliases. Primary remains visually stronger.

The same fix was applied to `VfButton` and `VfIconButton` because the variants share one interaction
contract. Focus-visible, disabled, and loading were unchanged: loading on `VfButton` still puts the
control into the native disabled state and retains the spinner.

### Tooltip

The `top` arrow used a separated offset, while `bottom` used an overlap offset. With the same 10 px
square rotated by 45 degrees, the outward projection was approximately 8.29 px at the top versus
6.56 px at the bottom, making the top arrow look like a diamond. Both public sides now use the
existing overlap offset of `-1px`.

After the fix, the measured projection is approximately 6.30 px for `top` and 6.57 px for `bottom`;
the remaining 0.27 px difference is caused by subpixel rasterization. The transformed bounds are
identical (approximately 14.14 px), and rotation and border geometry are symmetrical in light/dark.

Leave-transition clipping was also eliminated: Vue removed the Tooltip after the fast duration,
although the floating-surface CSS animation used the normal duration. The lifecycle now matches the
existing CSS motion token. The overall Tooltip design was unchanged.

### Tabs

The tab button had zero radius at rest but received `control-tight` only when focus-visible.
Consequently, hover, active, and focus had different geometry. The existing
`--vf-radius-control-tight` was moved to the base tab button for the top corners only; the bottom
corners remain zero in all states so the tab item geometry terminates at the underline without a
pill silhouette. The tab list and scroll controls remain square.

The outer focus shadow was clipped by the scroller's overflow container. Tab buttons and scroll
controls now use an inset focus ring of the same width and semantic color.

The semantic migration also turned underline Tabs into a partially filled control: hover, pressed,
selected, selected-hover/active, and disabled received neutral/selected surface backgrounds. This
contradicted the original text-first contract and made Tabs visually resemble pills. Built-in
background aliases were restored to `transparent`; all states retain their background through
component aliases, while feedback is provided by the semantic foreground, focus ring, and bottom
indicator. Custom background overrides remain supported.

In multi-file `VfPlayground`, the inner `VfTabs` height incorrectly equaled the full tab-bar height,
after which base Tabs added bottom padding for the baseline. As a result, the list was 3 px taller
than the toolbar, and the outer row's indicator overlapped the file row by 1 CSS px (2 device pixels
on Retina). The control/scroller height is now calculated as the existing `playground-bar-height`
minus the existing `tabs-list-padding-bottom`; both rows fit within their boundaries without
clipping or arbitrary spacing. The Playground active-tab override was also restored to a
transparent background so the embedded rows retain the Core Tabs underline contract.

### NavMenu and TableOfContents

Visual review revealed variant leakage after the semantic token migration. The `default` base item
was transparent, but hover/current aliases resolved to `surface-hover` and `surface-selected`, so
the variant looked like `pills`. This contradicted the existing theming docs and changelog, where
`default` is defined as text-first and filled states belong to `pills`.

Built-in hover/current background tokens for `default` were restored to `transparent`; the
foreground, focus ring, and OKLCH palette were unchanged. Compound selected-hover/active surfaces
are now limited to `pills`. In `sidebar`, the intended top-level branch pills remain, while nested
current items remain transparent and are indicated by text and an active rail.

The unconditional `surface-active` added to unselected NavMenu items during the first audit pass
caused a brief flash in an ordinary nested tree. The rule was removed: text-first items retain their
hover treatment while pressed, and filled/current states remain variant-specific.

The same correction was applied to `VfTableOfContents`: the default variant no longer duplicates
`pills`, either at rest or on hover/active for the current link.

### Checkbox, Radio, and Switch

Checked Checkbox and Radio controls lacked hover feedback, all three binary controls lacked a
distinct pressed state, and Switch active matched hover. Existing semantic roles were added:

- unchecked active — `surface-active`;
- checked hover — `primary-hover`;
- checked active — `primary-active`;
- static Switch retains its static background and changes only the intended border cue.

Compound-state cascading was fixed at the same time. The invalid border now remains a danger
boundary for checked/unchecked hover and active, while disabled suppresses invalid and interaction
states. In particular, a `static + invalid + disabled` Switch no longer retains a danger border
instead of a disabled border.

### Dropdown, MenuBar, and Select

`MenuBar` had the same filled-state leakage in `default`: top-level and submenu hover/current/open
used the `pills` background. Default aliases were restored to a transparent background, and selected
compound surfaces were limited to `pills`.

The unconditional pressed backgrounds added to MenuBar and Dropdown during the first pass were
removed. In the dark theme, `surface-active` and the elevated-menu background resolve to the same
neutral material, so pointer-down removed the visible hover and appeared as flicker. After the fix,
hover remains stable while pressed; `pills` selected/current continues to use `selected`,
`selected-hover`, and
`selected-active`.

`Dropdown default` uses the same text-first NavMenu aliases, so its default hover/current also
remain transparent; `Dropdown pills` retains filled states. The distinct Select pressed state
remains: the option list is a surface-backed selection control and has no text-first variant.
Focus-visible, disabled, the Select trigger, padding, radius, and overlay shadows were reviewed and
unchanged.

### Popover and floating overlays

Popover programmatically focuses the content surface but received the native browser outline
instead of semantic focus treatment. A focus-visible ring was added while preserving the existing
float shadow. For Windows forced-colors, a separate system two-pixel `Highlight` outline is
provided because box-shadow is suppressed in this mode.

Dropdown, Popover, Select, and Tooltip used the normal CSS transition, but the Vue lifecycle ended
them after the fast duration. All four lifecycle durations were synchronized with the existing
normal motion token; token values and the animation itself were unchanged.

## Reviewed components and states

| Component       | Reviewed states                                                                       | Result                                              |
| --------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Button          | hover, active, focus-visible, disabled, loading, variants                             | Fixed secondary base/hover contrast                 |
| IconButton      | hover, active, focus-visible, disabled, variants                                      | Synchronized secondary with Button                  |
| Tabs            | hover, active, selected, selected-hover, selected-active, focus-visible, disabled     | Fixed text-first states, radius, and clipped focus  |
| NavMenu         | default, pills, sidebar, hover, pressed, current, ancestor, focus-visible, disabled   | Removed default fills and tree press flash          |
| Tooltip         | top, bottom, open/close motion, light/dark                                            | Fixed arrow offset and lifecycle                    |
| Dropdown        | default, pills, hover, pressed, selected, focus-visible, disabled, open/close         | Separated text-first/pills states; fixed lifecycle  |
| MenuBar         | default, pills, hover, pressed, current, ancestor, open, focus-visible, disabled      | Removed default fills and press flash               |
| TableOfContents | default, pills, hover, pressed, current, focus-visible                                | Removed default filled states                       |
| Popover         | trigger/content focus, open/close, arrow/surface, forced-colors                       | Fixed focus treatment and lifecycle                 |
| Select          | trigger, option hover/pressed/selected/disabled, invalid/open/focus, clear, lifecycle | Fixed option pressed state and lifecycle            |
| Checkbox        | checked/unchecked, hover, active, focus-visible, invalid, disabled                    | Fixed hover/press and precedence                    |
| Radio           | checked/unchecked, hover, active, focus-visible, invalid, disabled                    | Fixed hover/press and precedence                    |
| Switch          | checked/unchecked, hover, active, static, focus-visible, invalid, disabled            | Fixed pressed state and precedence                  |
| Badge           | tones and markup                                                                      | No changes needed: the component is non-interactive |
| ThemeSwitch     | switch and button representations                                                     | Uses the reviewed Switch/Button/IconButton          |
| Playground      | main/file tabs, selected indicator, light/dark, Retina geometry                       | Removed overlap between nested tab rows             |

## Why other areas were unchanged

- Primary, status, contrast, and ghost Button/IconButton already had distinguishable hover/active
  roles and correct disabled precedence.
- Filled selected/current compound roles remain on `pills` and Select; the text-first Tabs, NavMenu,
  TableOfContents, MenuBar, and Dropdown variants no longer receive them from the shared cascade.
- Focus-ring width, transitions, shadows, padding, and control geometry in the other reviewed
  components matched the existing tokens.
- Light/dark differences come only from theme-scoped semantic values; no accidental hardcoded theme
  overrides were added to the affected styles.
- Badge has no interactive contract. Loading exists only on Button among the listed components and
  correctly inherits disabled treatment.
- Documentation showcase examples match the actual public variants and successfully pass the
  production build and automated documentation example checks.

## Visual verification

Production Chromium was tested with a clean profile:

- light and dark;
- desktop 1440 × 1100 and mobile 390 × 844;
- 16 route snapshots and 8 CVD snapshots from the existing `visual:phase2`;
- Core, Colors, CodeBlock, and Playground routes;
- browser console/network errors and horizontal overflow;
- a separate CDP computed-state matrix for hover, active, focus-visible, selected, invalid, disabled,
  and forced-colors;
- DOM measurements of the outer and file Tabs rows in multi-file Playground;
- separate screenshots and DOM measurements for Tooltip `top`/`bottom`.

The existing visual smoke test passed completely. A baseline directory for byte-for-byte image
comparison was not configured, so the result was evaluated with the standard DOM/computed-state
assertions and visual review of new production screenshots. The new source contract suite locks
down semantic mappings, exact selectors, state precedence, radius/focus geometry, arrow offset, and
overlay timing to prevent future drift.

## Verification matrix

| Command                  | Result                                                           |
| ------------------------ | ---------------------------------------------------------------- |
| `npm test`               | **PASS** — all workspace suites and migration tests              |
| `npm run verify`         | **PASS** — full clean-install/release gate                       |
| `npm run typecheck`      | **PASS** — all workspaces                                        |
| `npm run lint:all`       | **PASS** — source, styles, HTML, Markdown, and data              |
| `npm run build`          | **PASS** — all eight published packages                          |
| `npm run build:demo`     | **PASS** — production showcase, 385 modules                      |
| `npm run prepublish:all` | **PASS** — build and dry-run pack for eight packages             |
| `npm run visual:phase2`  | **PASS** — 16 route snapshots, 8 CVD snapshots, state assertions |
| `git diff --check`       | **PASS**                                                         |

## Risks and migration notes

No migration is required: the public API and token surface were unchanged. Consumers will see only
corrected visual states and complete floating transitions. Pixel-level screenshot baselines are not
configured in the repository; the current visual gate combines production screenshots,
computed-style assertions, and browser/runtime validation.
