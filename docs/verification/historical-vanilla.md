# Vanilla contract trace

The historical baseline is `d9879116`. The VueForge core and layouts inventories come from
`packages/core/src/index.ts` and `packages/layouts/src/index.ts` at that revision. The Vanilla
inventory starts at `49574d25` and traces the actual HTML in [contracts](../../contracts/README.md),
CSS in `packages/css/src/components`, and controller exports in `packages/runtime/src/index.ts`.
The starting tree has 50 canonical component contracts and 23 controller factories.

Vanilla consumes `@codemonster-ru/ui-tokens`, `@codemonster-ru/ui-css`, and, for interactive
components, `@codemonster-ru/ui-runtime`. It can also consume standalone SVG geometry from
`@codemonster-ru/ui-icons`. No installed rendering framework is needed. The browser bundle
is built from `examples/vanilla/runtime.mjs` with the controllers already registered. npm
consumers can register only the controllers they need. The Vue adapter imports framework-free
rules from `ui-runtime/core`; CSS and icon geometry are shared.

| Historical source                                                                    | Vanilla contract and classification                                                                                                                                         | Acceptance coverage or remaining work                                                                                                                                                                  |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alert, Avatar, Badge, Breadcrumbs, Button, Card, Divider, IconButton, Link, Tag      | A. Matching canonical markup and component CSS. Native navigation or button activation where applicable.                                                                    | Preserve native tags, disabled controls, accessible names, state styles and component geometry against the historical showcase.                                                                        |
| Field, Fieldset, Radio, Textarea                                                     | A. Semantic label, help and constraint markup with native editing/selection.                                                                                                | Run canonical and behavior tests. Confirm forwarding of names, associations, disabling and validation in an HTML form.                                                                                 |
| ProgressBar, ProgressSpinner, Skeleton                                               | A. Markup and CSS for determinate and indeterminate feedback and loading placeholders.                                                                                      | Check a named progress bar, decorative spinner markup, loading status and reduced motion.                                                                                                              |
| Table                                                                                | A. Native table structure, presentation styles and scroll container.                                                                                                        | Check captions, header associations, fixed header/striping and horizontal overflow.                                                                                                                    |
| Container, Grid, Inline, Section, Stack; AdminShell                                  | A. Canonical CSS layout and native regions.                                                                                                                                 | Compare historical layouts at narrow and wide widths, with mobile overflow and landmarks.                                                                                                              |
| Input, Checkbox, Switch                                                              | B. Native input submission and validation. Input runtime adds clear/reveal; Checkbox sets the native indeterminate property; Switch mirrors native state.                   | Run form-data, reset, disabled/readonly, indeterminate and cleanup checks. Reconcile the historical checked-state, icon and clear behavior where shared styles or native HTML differ.                  |
| TableOfContents                                                                      | B. Canonical nav and anchors work natively. The optional controller and Vue share the scroll arithmetic for smooth scrolling and sticky offsets.                            | Direct controller tests cover offsets, fragments, modified clicks, focus, reduced motion and disposal. An enhanced canonical case exercises keyboard navigation.                                       |
| AppShell, AdminLayout, DocumentLayout, SetupLayout                                   | B/C. Canonical regions and app/admin sidebar, sticky metric and setup keyboard controllers.                                                                                 | Run matching scenarios and verify expanded state, Escape, responsive/RTL geometry, sticky offsets and listener disposal across updates.                                                                |
| Accordion, Tabs, Stepper                                                             | C. Canonical HTML with existing state, roving focus and model-event controllers.                                                                                            | Run pointer and keyboard navigation, disabled items and focus tests, then compare historical variants and responsive styles.                                                                           |
| Dialog, Drawer, Dropdown, Menu and MenuItem, Popover, Tooltip                        | C. Existing overlay and menu controllers. MenuItem is an item in the Menu contract.                                                                                         | Run focus movement/restoration, Escape, outside click and overlay cases. Check nested overlays and position-resource cleanup in a browser.                                                             |
| MenuBar, NavMenu, ThemeSwitch                                                        | C. Existing menu-tree and theme-mode controllers.                                                                                                                           | Check nested menus, branches and keyboard navigation. Check switching system/light/dark and listener teardown.                                                                                         |
| ThemeProvider and theme package                                                      | B. Vanilla can set `data-cm-theme` in the initial HTML and enhance mode selection with the theme controller. Vue injection is platform-specific.                            | Verify loading tokens and early theme resolution, persistence, preference changes and no initial visual flash. Compare historical custom theme tokens.                                                 |
| DataTable                                                                            | D. Existing sort, row selection and pagination-request controller. The server owns rendering rows and applying queries.                                                     | Historical multi-sort, row expansion, width, pinning, column reorder and richer loading states are unverified or absent in Vanilla. Test each applicable interaction before claiming parity.           |
| DataTableColumnChooser                                                               | C. Popover controls disclosure. The new ColumnChooser controller enhances native checkboxes using the shared visibility rules.                                              | Direct tests cover all, none and mixed states, required keys, event order and reinitialization. The shared behavior scenario covers event counts after checkbox actions.                               |
| Select                                                                               | D. Single selection, clear, keyboard navigation and hidden-field submission are implemented.                                                                                | Historical labels, option selection semantics and disabled/readonly behavior need reconciliation. Test browser focus and reset. The existing hidden value cannot receive native `required` validation. |
| DatePicker                                                                           | D. One ISO calendar date, range exclusion, clear and hidden-field submission exist.                                                                                         | Historical month/year/time, multiple selection, formatting and roving calendar keyboard behavior are missing. Verify form policy, locale, range navigation, focus and reset before parity.             |
| CommandPalette                                                                       | D. Existing state controller for filtering, focus movement, Escape and selection.                                                                                           | Exercise historic search/render states, disabled and loading options, option focus and lifecycle.                                                                                                      |
| ConfirmDialog                                                                        | C. The runnable Vanilla example composes the native Dialog controller and application confirmation logic.                                                                   | Direct tests verify cancel, duplicate request prevention, loading dismissal, failure retry, and focus restoration. The built example also passed the Chrome success flow.                              |
| FormLayout, PageHeader, Panel, SkeletonGate                                          | A. Canonical HTML and shared CSS cover layout, page actions, surfaces and loading presentation.                                                                             | SSR comparisons cover all six cases. SkeletonGate uses application-owned loading state; measured last-height reservation remains Vue-specific.                                                         |
| GroupBox                                                                             | A/C. Native fieldset markup shares styles. The Vanilla disclosure controller toggles validation and submission along with visibility, while retaining authored controls.    | Tests cover collapse, keyboard reopening, field exclusion, retained values and cleanup.                                                                                                                |
| AuthLayout, ErrorLayout, HeaderArea, SidebarArea, ContentArea, AsideArea, FooterArea | A. Auth/error samples and semantic shell regions exist in recipes. The historical geometry/options and responsive rules need a portable reference.                          | Test affected layout classes and landmark structure across viewport sizes.                                                                                                                             |
| SVG icons and Icon wrapper                                                           | A. Canonical Icon case plus shared SVG catalog.                                                                                                                             | Verify filled/line geometry, labels, decorative use, assets and CSS sizing without Vue.                                                                                                                |
| CodeBlock                                                                            | A/C. Static `pre` and `code` can display server-highlighted output. No canonical code presentation and copy enhancement at the starting revision.                           | Verify semantic code, wrapping, long lines, contrast, responsive menus and copy. Keep browser language parsing optional.                                                                               |
| Playground, playground-core, playground-vite-plugin                                  | D or integration-specific. Historical component preview compiles and displays Vue examples. Vue-specific preview source and its Vite plugin have no direct HTML equivalent. | A standalone editable Vanilla example can provide equivalent authoring ergonomics for markup, styles and scripts. Exercise pane controls and sandbox boundaries before shipping it.                    |

Types, Vue slots and composables, injection, and the async Vue component wrapper are Vue
integration surfaces. A Vanilla equivalent is semantic consumer-authored markup and explicit
DOM state. The historical HorizontalScroller, NavMenuItemNode and MenuBarItemNode are internal
components, so their scroll, branch and focus behavior belongs in the owning portable component's
acceptance rather than separate public JavaScript APIs.

## Verified lifecycle correction

New tests in `packages/runtime/__tests__/runtime.test.mjs` exercise a transient insertion,
detached descendants, moving an active component between observed roots, in-place changes to its
controller names, and disposal before pending mutation delivery. Before the fix, a transient
node connected after removal and survived scoped disposal. The runtime now checks current DOM
membership and disconnects lost observations while preserving controllers that remain observed.
The runtime workspace passed lint, type checking, build, and all 206 tests under Node 24.

## Packed consumer evidence

On Node 24.19.0, `npm_config_offline=true node scripts/ci/check-code-monster-ui-css-packed-consumer.mjs --manager=npm`
installed three CSS packages and verified 62 direct CSS exports with no framework installed. This
used locally built workspace artifacts at the ColumnChooser milestone (`5f0f79e1`) while additional
composition and layout work was in the shared tree.

A separate fresh npm consumer used built tokens, CSS, and runtime workspace tarballs from the
TableOfContents change set (`7f5c3bbe`), with the same shared CSS workspace. The build and install
commands were:

```bash
npm --cache "$repo/.npm-cache" --offline pack --ignore-scripts --silent \
  --workspace @codemonster-ru/ui-tokens --workspace @codemonster-ru/ui-css \
  --workspace @codemonster-ru/ui-runtime --pack-destination "$fixture/tarballs"
npm --cache "$repo/.npm-cache" --offline pack --ignore-scripts --silent \
  @codemonster-ru/floater.js@1.0.11 --pack-destination "$fixture/tarballs"
cd "$fixture/consumer"
npm --cache "$repo/.npm-cache" --offline install --ignore-scripts --no-audit --no-fund ../tarballs/*.tgz
"$repo/node_modules/.bin/tsc" --noEmit --strict --target es2022 --module nodenext app.ts
"$repo/node_modules/.bin/esbuild" app.ts --bundle --format=esm --outdir=public --loader:.woff2=file
```

Four packages installed offline. The Node ESM import registered ColumnChooser and TableOfContents
without browser globals and could not resolve Vue, React, or Angular. Node also resolved the
tokens, bundle and Button CSS exports. The consumer entry imported the tokens, fonts and styles
and registered the TableOfContents factory. Type checking passed with the packaged
`ColumnChooserVisibleColumnsChangeDetail` declaration. The browser bundle contained CSS, ESM
JavaScript, and all four bundled Inter font assets.

The final catalog still needs comprehensive browser and accessibility acceptance. The exact
historical showcase needs a direct comparison, especially for contracts outside the canonical
case cohort.
