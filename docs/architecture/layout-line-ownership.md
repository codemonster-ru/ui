# Layout line ownership

Status: Accepted  
Date: 2026-08-31  
Supersedes: [application shell ownership](./application-shell-ownership.md)

## Decision

Page layouts become a published line of their own, `@codemonster-ru/ui-layouts`, with the Annabel
Razor side living inside the existing `Codemonster\Ui` package under a `Layouts` namespace. A layout
is not a component and does not belong in `ui-vue`; giving it a separate package is what makes the
two nameable apart.

Three layouts are carried forward: `AdminLayout`, `AdminShell`, and `SetupLayout`. Five shell-area
wrappers are dropped. Two shells stay deferred pending a separate decision about measurement.

## What changed since the previous decision

The earlier decision rested on there being no consumer that needed the same shell twice. That is no
longer true — the shells are wanted across projects, which satisfies the first reconsideration
criterion it set out.

Re-reading the code also found part of its reasoning to be wrong. It excluded every shell partly on
measured sticky offsets and routing coupling. Those exist, but only in two of them:

| Shell | `ResizeObserver` / `getBoundingClientRect` / routing references |
| --- | --- |
| `VfAppShell` | 15 |
| `VfDocumentLayout` | 15 |
| `VfAdminLayout` | 0 |
| `VfAdminShell` | 0 |
| `VfSetupLayout` | 0 |

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

## The two deferred

`VfAppShell` and `VfDocumentLayout` measure geometry with `ResizeObserver` and
`getBoundingClientRect` to compute sticky offsets. That cannot be expressed in server-rendered markup
and has no PHP equivalent without JavaScript, so porting them as-is would produce a layout whose
behavior only half exists on one adapter.

They are deferred rather than dropped. The likely shape is a split: portable structure as a layout,
and measurement as an optional controller that enhances it where JavaScript runs. That is a separate
decision with its own contract review.

## Consequences

- `ui-layouts` joins the package catalog with its own release order, budgets, and publication cycle.
- Razor gains a `Codemonster\Ui\Layouts` namespace rather than a second Composer package, since the
  split target `codemonster-ru/ui-razor` already exists and a second one would buy nothing.
- The VueForge line is untouched. `vueforge-layouts` keeps its APIs under the existing maintenance
  policy; dropping a wrapper here does not deprecate it there.
- Layout state joins the behavior core on the same terms as component state: rules in
  `runtime/src/core/`, adapters translating rather than deciding.
