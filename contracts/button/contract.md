# Button contract

Status: Active

Component: `Button`

Razor tag: `cm-button`

## Purpose

Button represents one immediate action or one explicit navigation action. It uses native HTML for
activation and does not expose a general polymorphic `as` API.

## Semantic root

- Omitted, `null`, or empty `href` renders a native `<button>`.
- A non-empty `href` renders a native `<a>`.
- Button mode owns the native `type` attribute and defaults it to `button` so the component does not
  submit a form accidentally.
- Link mode ignores `type`. The `href` value is contextually escaped and forwarded to the anchor.
- Unknown safe attributes and native event listeners are forwarded to the semantic root. Consumer
  `class` values merge with contract classes.
- Root selection is deterministic during SSR and must not change during hydration for the same
  props.

## Visual configuration

The root always owns `cm-button`, one variant modifier, and one size modifier:

```text
cm-button
cm-button--primary | cm-button--secondary | cm-button--danger | cm-button--ghost
cm-button--sm | cm-button--md | cm-button--lg
```

Invalid finite values produce a development diagnostic. Production adapters fall back to
`primary` and `md` rather than rendering unapproved classes.

## Content

Contract-owned content order is:

1. optional `leading` region;
2. required `default` label region;
3. optional `trailing` region.

The default content is wrapped by `cm-button__label`. Non-empty named regions are wrapped by
`cm-button__leading` and `cm-button__trailing`. Empty named regions are omitted. Consumers are
responsible for hiding decorative icon content from assistive technology and naming meaningful
standalone icon content.

Loading suppresses the authored leading region and renders `cm-button__spinner` in its position.
The spinner is `aria-hidden="true"`; the visible default label remains the accessible name and does
not change automatically.

## Disabled and loading states

Button mode uses the native `disabled` attribute when `disabled` or `loading` is true. Loading also
sets `aria-busy="true"`.

Link mode cannot use a native disabled attribute. When `disabled` or `loading` is true, the anchor:

- omits `href` so no static or server-rendered navigation remains;
- sets `aria-disabled="true"`;
- does not emit or forward an activation caused by the component adapter;
- sets `aria-busy="true"` only while loading.

Loading takes visual precedence when both boolean props are true. Native attributes and ARIA are
the authoritative state; no duplicate disabled/loading modifier class or `data-cm-state` is added.

## Events and forms

Enabled roots retain their native `click` event. Button mode preserves native submit/reset behavior
from `type`, `name`, `value`, `form`, and other valid forwarded attributes. Disabled and loading
states do not activate or submit. Adapters do not emit a redundant custom activation event.

## Accessibility

- The default slot must provide a non-empty accessible name, either through meaningful content or a
  valid native naming attribute forwarded by the consumer.
- Native button and link keyboard behavior is preserved.
- Focus indication comes from the shared focus-visible foundation and Button component styles.
- Loading uses `aria-busy` and keeps the action label present; it does not create an unsolicited live
  region.
- Color is not the only distinction for disabled or loading state.

## Security

Ordinary props and attributes are escaped for their HTML context. Slots use each adapter's trusted
component-composition boundary. Annabel Razor does not treat ordinary strings as trusted markup.

## Platform mapping

- Vue maps props and named slots idiomatically and forwards native root attributes and listeners.
- Annabel Razor maps kebab-case attributes and named slots, rendering the same significant DOM.
- No platform-specific element or wrapper is allowed for ordinary cases.

## Behavior scenarios

Button adds no shared custom behavior scenario. Native button and anchor activation remains the
browser contract; adapter tests cover listener forwarding, form behavior, and prevention while
disabled or loading.
