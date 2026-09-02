# Layout line ownership

Status: Accepted  
Date: 2026-08-31  
Supersedes: [application shell ownership](./application-shell-ownership.md)

## Decision

Page layouts become a published line of their own, `@codemonster-ru/ui-layouts`, with the Annabel
Razor side living inside the existing `Codemonster\Ui` package under a `Layouts` namespace. A layout
is not a component and does not belong in `ui-vue`; giving it a separate package is what makes the
two nameable apart.

Five layouts are carried forward: `AdminLayout`, `AdminShell`, `SetupLayout`, `AppShell`, and
`DocumentLayout`. Five shell-area wrappers are dropped.

## What changed since the previous decision

The earlier decision rested on there being no consumer that needed the same shell twice. That is no
longer true — the shells are wanted across projects, which satisfies the first reconsideration
criterion it set out.

Re-reading the code also found part of its reasoning to be wrong. It excluded every shell partly on
measured sticky offsets and routing coupling. Those exist, but only in two of them:

| Shell              | `ResizeObserver` / `getBoundingClientRect` / routing references |
| ------------------ | --------------------------------------------------------------- |
| `VfAppShell`       | 15                                                              |
| `VfDocumentLayout` | 15                                                              |
| `VfAdminLayout`    | 0                                                               |
| `VfAdminShell`     | 0                                                               |
| `VfSetupLayout`    | 0                                                               |

`VfAdminLayout` is a controlled component: `sidebarCollapsed` and `mobileSidebarOpen` as props with
matching `update:` events, and the application supplies routing and authorization through slots. The
layout itself renders regions and owns a boolean. A statement that grouped it with `VfAppShell`
described the category rather than the code.

## The three carried forward

Their one real portability obstacle is scoped slots. `VfAdminLayout` hands slots a scope object of
`{ isSidebarCollapsed, isMobileSidebarOpen, mobileToggleAttrs }`, and Razor has no equivalent.

The replacement is the pattern the components already use: state is expressed as `data-cm-*`
attributes in the canonical DOM, and a controller in `ui-runtime` reads and writes it. Vue binds the
same state declaratively. This is how Tabs and Accordion already work across both adapters, so
layouts do not need a mechanism of their own.

## The five dropped

`VfHeaderArea`, `VfSidebarArea`, `VfContentArea`, `VfAsideArea`, and `VfFooterArea` are not carried
forward. Each is between 19 and 30 lines of `<component :is="as" :class="…"><slot /></component>`;
three have no structure beyond that. Publishing five components that each render one element would
add public surface without adding capability.

They remain named, as regions of the layouts that contain them: their classes are part of each
layout's canonical DOM and its contract. What disappears is the standalone component, not the name.

The migration map calls this `drop`. It previously called it `manual`, which was misleading —
`manual` means the application takes the responsibility over, and there is no successor here to take
over. The capability entries already said `superseded` with "No standalone replacement", so the
category name had been the only thing out of step.

## The two formerly deferred, now carried across

`VfAppShell` and `VfDocumentLayout` were deferred because they measure geometry with
`ResizeObserver` and `getBoundingClientRect`, which no server can do. Reading the code more closely
showed the deferral rested on an incomplete picture: both already fall back to a CSS variable when
the measured height is zero, so the half that works without JavaScript was written by their original
author and had simply not been noticed.

`CmAppShell` and `CmDocumentLayout` keep exactly that shape. The layout publishes its sticky offsets
as custom properties resolved by `shellStickyOffsets`, which emits `var(--cm-layout-header-height)`
when nothing has been measured — the form the server always renders. `CmShellMetricsController`
then narrows those to the observed heights where a browser is involved. The page sticks correctly
before any script runs, and more precisely afterwards, which is progressive enhancement in its
literal sense rather than a graceful failure.

This is the split the deferral predicted, and it turned out to need no new mechanism.

`CmAppShell` also carries the sidebar state VueForge passed through scoped slots. It becomes an
attribute on the root, and the collapse control is marked rather than wired: an application tags its
own button with `data-cm-sidebar-toggle`, and both adapters update that button's `aria-expanded`, so
the marked-control pattern means the same thing on each.

`data-cm-controller` names both controllers on the shell, which the runtime has always accepted as a
space-separated list. The coverage check read only the first name, so the second could have gone
unimplemented without complaint; it reads the whole list now.

## Consequences

- `ui-layouts` joins the package catalog with its own release order, budgets, and publication cycle.
- Razor gains a `Codemonster\Ui\Layouts` namespace rather than a second Composer package, since the
  split target `codemonster-ru/ui-razor` already exists and a second one would buy nothing.
- The VueForge line is untouched. `vueforge-layouts` keeps its APIs under the existing maintenance
  policy; dropping a wrapper here does not deprecate it there.
- Layout state joins the behavior core on the same terms as component state: rules in
  `runtime/src/core/`, adapters translating rather than deciding.
