# SkeletonGate

During loading, put `aria-busy="true"` on the gate and mark its content `inert` and
`aria-hidden="true"`. Keep the decorative skeleton overlay visible and hidden from assistive
technology. When ready, remove the busy and inert state, add
`cm-skeleton-gate__content--ready` to the content, and hide the overlay with `hidden`.
The host application supplies the state in Vue or HTML. Use a minimum height on the gate
to reserve its space while loading.

[Loading HTML](./cases/default.html) · [Ready HTML](./cases/ready.html) · [Vue and Vanilla usage](../../docs/components/compositions.md#skeleton-gate)
