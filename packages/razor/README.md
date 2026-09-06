# codemonster-ru/vueforge-razor

VueForge components for the [Annabel Razor](https://github.com/codemonster-ru/razor)
template engine.

**Status: unreleased.** The adapter currently ships one component, `vf-input`,
as the first vertical slice of the multiplatform migration.

## Registering

```php
use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());
```

Templates then use the `vf-` prefix:

```razor
<vf-input name="workspace" value="Acme" placeholder="Acme Inc" clearable />

<vf-input name="password" type="password" password-reveal>
    <razor-slot name="leading"><span class="lock">🔒</span></razor-slot>
</vf-input>
```

## `vf-input`

| Prop | Meaning |
| --- | --- |
| `value` | The control value. This is the Razor spelling of the Vue adapter's `modelValue`. |
| `size` | `sm`, `md` (default) or `lg`. |
| `invalid` | Adds the invalid modifier and `aria-invalid`. |
| `leading-icon` / `trailing-icon` | A glyph from the extracted icon data. |
| `clearable` | Offers the clear action once the controller boots. |
| `password-reveal` | Offers the reveal action for `type="password"` once the controller boots. |
| `clear-label`, `show-password-label`, `hide-password-label` | Accessible names for the actions. |
| `class`, `style` | Placed on the wrapper when the control is adorned, on the input when it is bare. |

Named slots `leading` and `trailing` replace the corresponding icon prop.

Every other attribute falls through to the `input` element, which is how `type`,
`name`, `id`, `required`, `placeholder`, `autocomplete`, `min`, `max`, `step`,
`disabled`, `readonly` and any `aria-*` / `data-*` reach the control. Native
types are never normalised: `number`, `date` and the rest pass through.

Only the glyphs the Input closure needs are extracted so far (`xmark`, `eye`,
`eye-slash`). An unknown `leading-icon` / `trailing-icon` throws rather than
rendering nothing; use the slots for other content until more glyphs are
extracted.

## Assets

A host application must serve two things from `VueForgeRazorProvider::assetPath()`:

- `vueforge-razor.css` — the canonical VueForge stylesheet. It is built from
  `packages/styles`, which owns the rules; this package never edits its own copy.
- `vueforge-razor.js` — the browser enhancement, an ES module.

```php
$assets = VueForgeRazorProvider::assetPath();
```

```html
<link rel="stylesheet" href="/vendor/vueforge/vueforge-razor.css">
<script type="module" src="/vendor/vueforge/vueforge-razor.js"></script>
```

## Without JavaScript

The server output is a real native input: it accepts typing, submits its value,
keeps `disabled` / `readonly` / `required` and its label relationships, and a
password stays a password.

The clear and reveal actions cannot work without the controller, so they are
rendered `hidden` and `disabled` and the class modifiers that reserve space for
them are withheld. A static page therefore shows no control that does nothing.
Floating labels degrade to the ordinary labelled composition until the
controller boots.

## Public surface

`VueForgeRazorProvider`, the `vf-input` tag and its props, and `assetPath()`.
Everything under `Support/` is internal and may change while the package is
unreleased.
