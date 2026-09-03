# CodeMonster UI 2.0 release notes

Status: Draft — not published. The version and channel are still open; see
[the release checklist](./release-checklist.md) for what publishing requires.

2.0 is where the VueForge migration finishes. Every component in the frozen VueForge baseline now
has a recorded outcome, and the migration map has no `manual` entries left: 49 replaced, 9 composed,
5 dropped.

## Release cohort

| Package                        |       Version | Compatibility                                  |
| ------------------------------ | ------------: | ---------------------------------------------- |
| `@codemonster-ru/ui-tokens`    | `2.0.0-dev.0` | Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`  |
| `@codemonster-ru/ui-runtime`   | `2.0.0-dev.0` | Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`  |
| `@codemonster-ru/ui-css`       | `2.0.0-dev.0` | Framework-independent CSS; tokens `^2.0.0`     |
| `@codemonster-ru/ui-utilities` | `2.0.0-dev.0` | Framework-independent CSS; tokens `^2.0.0`     |
| `@codemonster-ru/ui-vue`       | `2.0.0-dev.0` | Vue `^3.5.0`; supported Node.js line for SSR   |
| `@codemonster-ru/ui-layouts`   | `2.0.0-dev.0` | New package. Vue `^3.5.0`; runtime `^2.0.0`    |
| `codemonster-ru/ui-razor`      |    _untagged_ | PHP `>=8.2`, Annabel Razor `^2.1`, View `^2.0` |

## What is new

**Sixteen components and layouts** joined the canonical contract since 1.1: `Tag`,
`TableOfContents`, `ColumnChooser`, `Stepper`, `NavMenu`, `MenuBar`, `ThemeSwitch`, `Fieldset`,
`IconButton`, `ProgressBar`, `ProgressSpinner`, and the five layouts below.

**Layouts became a line of their own.** `@codemonster-ru/ui-layouts` holds `CmAdminLayout`,
`CmAdminShell`, `CmSetupLayout`, `CmAppShell`, and `CmDocumentLayout`. A layout is not a component,
and a separate package is what makes the two nameable apart. On the Razor side they live in
`Codemonster\Ui\Layouts` inside the existing package. See
[the decision](./architecture/layout-line-ownership.md).

**The theme became a subsystem.** `system` now resolves in CSS through a `prefers-color-scheme`
query, so it works with scripting disabled — previously it resolved only when JavaScript ran. The
explicit choice lives in a cookie the server can read, so the first paint is already correct. See
[the decision](./architecture/theme-subsystem.md).

**The behavior core grew to eighteen modules.** `packages/runtime/src/core/` holds the rules as pure
functions over plain data, published as `@codemonster-ru/ui-runtime/core`. Adapters translate rather
than decide, which is what keeps two platforms honest.

## Breaking changes

Read [the migration guide](./vueforge-to-codemonster-ui.md) before treating a successful rename as
API compatibility. The changes that cannot be inferred from a type error:

**Select and DatePicker require an `id`.** DatePicker is no longer a native `input[type=date]`, and
both hand required-field validation to the application: a component-owned control cannot reach the
browser's constraint validation, because a hidden input is excluded from it and the trigger is a
button. Submission still works through the hidden input; only the refusal to submit an empty
required field is lost, and `aria-required` leaves the state announced.

**`CmThemeSwitch` shares almost nothing with `VfThemeSwitch`.** The old control was a two-position
toggle driven by a `VfThemeProvider` the application mounted. The new one is three-state — `light`,
`dark`, `system` — and the subsystem behind it belongs to the kit. Nothing about `size`, `variant`,
`buttonVariant`, or `thumbContrast` survives. Because Vue passes unknown attributes through to the
root element, a bare rename leaves them rendered as DOM attributes rather than reported as errors,
so migrate the props deliberately and drop `VfThemeProvider`.

**`CmAppShell` replaced scoped slots with attributes.** `VfAppShell` handed slots a scope object of
`{ isSidebarCollapsed, collapseSidebar, expandSidebar, toggleSidebarCollapsed }`, and PHP has no
scoped slots. The state is an attribute on the root now, and the collapse control is marked rather
than supplied: tag your own button with `data-cm-sidebar-toggle` and both adapters keep its
`aria-expanded` in step. Sticky offsets moved from `--vf-sticky-*` to `--cm-sticky-*`, and the layout
publishes them rather than measuring them, so declare `--cm-layout-header-height` for the case where
no script has run.

**Five shell-area wrappers are gone.** `VfHeaderArea`, `VfSidebarArea`, `VfContentArea`,
`VfAsideArea`, and `VfFooterArea` are not carried forward; each rendered one element. Their names
survive as regions inside the layouts that contain them.

**The theme attribute changed.** `data-vf-theme` becomes `data-cm-theme`, and it is three-state: a
root stamped `system` is resolved by the stylesheet rather than by script.

## Migration

The read-only checker and the deterministic codemod report and perform the renames:

```bash
npm run migrate:codemonster-ui -- --check
npm run migrate:codemonster-ui
```

The codemod renames and rewrites imports. It does not transform props, slots, events, state
ownership, or progressive-enhancement setup, and the two renames above are the ones where that
distinction matters most.

## What this release does not change

The VueForge line is untouched and its releases remain available. `vueforge-layouts` keeps its APIs
under the existing maintenance policy; dropping a wrapper here does not deprecate it there.

The showcase in `examples/vue` is still compared pixel for pixel against commit `fd793696`, which is
what proves the migration did not change how anything looks. Components with no VueForge ancestor
are demonstrated in `examples/ui-showcase` instead.
