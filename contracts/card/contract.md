# Card contract

Status: Active

Component: `Card`

Razor tag: `cm-card`

## Purpose

Card groups related presentation content on one visual surface. It does not become an interactive
control, load application data, or make the complete surface clickable.

## Semantic root

`element` selects one of `section`, `article`, or `div` and defaults to `section`. Adapters reject
invalid values rather than accepting an arbitrary tag or component. Root selection is deterministic
during server rendering. Unknown safe attributes reach the root and consumer classes merge after
the stable contract classes.

The root owns `cm-card` and adds `cm-card--compact` only when compact spacing is requested.

## Regions

Content order is header, body, footer:

1. A non-empty `header` slot renders inside `cm-card__header`.
2. Otherwise a non-empty `title` renders an `h3.cm-card__title` inside the header.
3. A non-empty default slot renders inside `cm-card__body`.
4. A non-empty `footer` slot renders inside `cm-card__footer`.

Absent regions and their wrappers are omitted. Adapters preserve authored slot markup and escape
ordinary title text. Consumers own heading hierarchy when supplying a custom header.

## Composition and accessibility

Card adds no keyboard behavior, ARIA role, or click event. Interactive descendants remain native
buttons and links. A `section` or `article` that needs an accessible name must contain an appropriate
heading or receive a consumer-provided native naming attribute. Nested components render through
their normal adapter boundary without Card interpreting their content.

## Security

`title` and ordinary attributes are contextually escaped. Slots use the adapter's trusted
composition boundary. A slot cannot select a template, component class, or raw HTML from ordinary
untrusted data.
