# IconButton contract

Status: Active

Component: `IconButton`

Razor tag: `cm-icon-button`

## Purpose

IconButton represents one compact action whose visible content is a single trusted icon. It is a
standalone square control because ordinary Button composition does not own icon-only geometry or
enforce an accessible name.

## Semantic root and accessibility

- The root is always a native `<button>`.
- `label` is required, must be non-empty after trimming, and becomes the component-owned
  `aria-label`.
- The required default content is wrapped by `cm-icon-button__icon` with `aria-hidden="true"`.
  Consumers provide trusted icon markup through the adapter composition boundary; the icon is never
  used as the accessible name.
- The component owns `type`, `disabled`, and `aria-label`. Consumer values for those root attributes
  cannot override the corresponding props.
- Unknown safe attributes and native event listeners are forwarded to the root. Consumer `class`
  values merge with contract classes.
- Native button keyboard, focus, form, and disabled behavior is preserved. There is no custom
  activation event.

## Visual configuration

The root always owns `cm-icon-button`, one variant modifier, and one size modifier:

```text
cm-icon-button
cm-icon-button--primary | cm-icon-button--secondary | cm-icon-button--danger | cm-icon-button--ghost
cm-icon-button--sm | cm-icon-button--md | cm-icon-button--lg
```

`variant` defaults to `ghost`, `size` to `md`, and `type` to `button`. Adapters accept only the
finite values listed in the manifest. Vue diagnoses invalid values and normalizes them to defaults;
Razor rejects invalid values before rendering.

## Security and ownership boundary

Ordinary props and root attributes are escaped for their HTML context. The default content is
trusted component-composition output and is not accepted as an ordinary icon-name or HTML-string
prop. Icon lookup, links, loading indicators, tooltips, and application runtime state are outside
this contract.

## Platform mapping

- Vue maps the props and required default slot idiomatically and forwards native root attributes and
  listeners.
- Annabel Razor maps kebab-case attributes and the default slot, rendering the same significant DOM.
- Both adapters own the decorative wrapper and accessible label; neither adds a runtime dependency.
