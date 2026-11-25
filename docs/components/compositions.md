# Historical compositions

Import the shared stylesheet or the matching component entry from `@codemonster-ru/ui-css`.
The components below are available from `@codemonster-ru/ui-vue`.

## Form layout

`CmFormLayout` (also `VfFormLayout`) wraps direct `CmField` children in its default slot. The `mode` prop defaults
to `stacked`. Set it to `horizontal` to put labels beside their controls or `responsive`
to apply that arrangement when the form container is at least 768px wide. The `labelWidth`
prop sets the label track in the two-column layout and defaults to `minmax(10rem, 25%)`.
Labels, controls, descriptions, and errors keep their original document order.

In HTML use `cm-form-layout` and one of `cm-form-layout--stacked`,
`cm-form-layout--horizontal`, or `cm-form-layout--responsive` on the wrapper. Put
[field markup](./forms.md) directly inside it. Set the `--cm-form-layout-label-width`
custom property to change the horizontal label track. No JavaScript is required.
[Responsive HTML](../../contracts/form-layout/cases/default.html)

## Page header

`CmPageHeader` (also `VfPageHeader`) renders optional `title`, `description`, and `breadcrumbs` props above the
page content. `headingLevel` defaults to `1` and accepts levels 1 through 6. Slots named
`title`, `description`, and `breadcrumbs` replace their matching content. Put page commands
in the `actions` slot. Actions wrap below the title and align to the start on narrow containers.

In HTML use a `header.cm-page-header`. If needed, put breadcrumb navigation in
`.cm-page-header__breadcrumbs`. Inside `.cm-page-header__row`, put a heading with
`.cm-page-header__title` and optional `.cm-page-header__description` inside
`.cm-page-header__content`, followed by an optional `.cm-page-header__actions` wrapper.
Select the heading level according to the document outline.
[Header with a page action](../../contracts/page-header/cases/default.html)

## Group box

`CmGroupBox` (also `VfGroupBox`) groups content in a native fieldset with an optional
`title` or `title` slot in the legend. Set `collapsible` to use the title as a disclosure
button. The component manages collapse state unless supplied `collapsed` or
`v-model:collapsed`. Set `defaultCollapsed` for an initially collapsed uncontrolled
group. The button emits `update:collapsed` and `collapsedChange` on activation and can be
disabled through `disabled`. The `title` and `toggle-icon` slots receive `collapsed`.
Collapsing removes the slot content, so its form controls are excluded from submission.

For a static HTML group use `fieldset.cm-group-box` with
`legend.cm-group-box__legend`, `.cm-group-box__title`, and `.cm-group-box__content`.
Add `cm-group-box--titled` when supplying the legend. The [GroupBox recipe](../recipes/group-box.md)
shows how to add disclosure behavior.

## Skeleton gate

`CmSkeletonGate` (also `VfSkeletonGate`) shows a `CmSkeleton` or the `skeleton` slot
while `ready` is false. The default content remains mounted with `inert` and
`aria-hidden` during the loading state. Use `minHeight` or `reserveHeight` to reserve
space, `preserveLastHeight` to retain the measured height while loading again, and
`normalizeContentSpacing` to remove the outer margins of the first and last content children.
`radius` accepts a CSS length or expression. `fadeDuration` defaults to 220 milliseconds.

For Vanilla HTML, render the [loading state](../../contracts/skeleton-gate/cases/default.html)
or the [ready state](../../contracts/skeleton-gate/cases/ready.html). Your application owns when
the state changes. Set `min-height` on the gate to reserve layout space and update
`aria-busy`, `inert`, `aria-hidden`, the ready class, and the overlay's `hidden` attribute together.
The shared CSS supplies the fade and respects reduced motion.

`createAsyncWithSkeleton` wraps a Vue async component loader. A loading placeholder uses
the component's `height`, `minHeight`, or `min-height` in that order. Supply
`defaultMinHeight` to replace the 120px fallback, or `minHeightPropKeys` to set a different
attribute order. `delay` and `radius` control the placeholder presentation.

## Confirmation dialog

`CmConfirmDialog` (also `VfConfirmDialog`) composes a native dialog and two actions. Bind `v-model:open` and
listen for `confirm` and `cancel`. Confirm closes by default. With `closeOnConfirm`
set to false, the caller closes the modal after its work completes. Setting `loading` blocks
cancel and confirmation until the operation finishes. Setting `disabled` blocks only
confirmation. Provide optional `title`, `description`, `confirmLabel`, `cancelLabel`, `size`,
`dividers`, or `confirmVariant` to change the presentation.

Focus defaults to Cancel. Set `initialFocus` to `confirm` or `dialog` as appropriate.
The default slot provides additional body content. A custom `footer` slot receives
`confirm`, `cancel`, and `loading`. Supply `teleportTo` to choose a dedicated portal target
or set `disableTeleport` for inline rendering. For server rendering, disable teleport or render
the Vue server renderer's teleport output into a dedicated target.

## Composed menu

`VfMenu` and `VfMenuItem` from `@codemonster-ru/ui-vue/historical` preserve the slot-based Vue menu. Put menu items in the default
slot. Each item takes a required `label` and optional `icon`, `active`, `disabled`, or
`tone` (`default` or `danger`). A non-empty `href` selects anchor mode, which accepts
`target` and `rel`. An enabled item emits `select`. Disabled links omit the destination and
leave the tab order.

Use `CmMenu` for the item-list API, which handles arrow-key navigation and has a corresponding
[Vanilla contract](../../contracts/menu/contract.md).
