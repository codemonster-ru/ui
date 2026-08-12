# CodeMonster UI Vue

Vue 3 adapter for CodeMonster UI components.

Current release: `@codemonster-ru/ui-vue@0.1.0`.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling and SSR.
- Vue `^3.5.0`.

## Installation

```bash
npm install vue@^3.5.0 @codemonster-ru/ui-vue @codemonster-ru/ui-css
```

## Quick start

```ts
import '@codemonster-ru/ui-css/styles.css';
import { CmButton } from '@codemonster-ru/ui-vue';
```

```vue
<CmButton variant="secondary" size="lg" type="submit">Save</CmButton>
```

`CmButton` renders a native button, forwards consumer attributes and listeners to it, and merges
consumer classes after the stable `cm-button` contract classes. Its default native `type` is
`button`; set `type="submit"` explicitly for form submission. The optional `leading` and `trailing`
slots render icon regions. `loading` replaces the leading region with a hidden spinner, disables the
button, and exposes `aria-busy="true"` while preserving its label. A non-empty `href` renders an
anchor. Disabled links omit `href`, expose `aria-disabled="true"`, and suppress consumer click
handlers.

## Documentation

See the cross-platform [Button guide](../../docs/components/button.md) for props, slots, forms,
links, accessibility, and matching Annabel Razor usage.
See the [Card guide](../../docs/components/card.md) for semantic roots and region composition.
See the [Field and Input guide](../../docs/components/forms.md) for Vue binding and accessible forms.
See the [Accordion guide](../../docs/components/accordion.md) for controlled state and keyboard behavior.

## License

[MIT](./LICENSE)
