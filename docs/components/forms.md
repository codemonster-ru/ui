# Form components

`Field` associates a control with its label and messages. `Input`, `Textarea`, `Checkbox`, `Radio`,
and `Switch` preserve native browser editing, focus, validation, events, and form submission. Vue
uses idiomatic model binding; Vanilla HTML renders values from application state or the submitted
request.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Each component style is also available from the `field.css`, `input.css`, `textarea.css`,
`checkbox.css`, `radio.css`, and `switch.css` npm subpath exports.

## Field API

| Prop              | Values             | Default          | Behavior                                                                         |
| ----------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------- |
| `controlId`       | non-empty string   | Generated in Vue | Id of the single control associated with the visible label.                      |
| `label`           | string or `null`   | `null`           | Fallback visible label.                                                          |
| `description`     | string or `null`   | `null`           | Fallback help text.                                                              |
| `error`           | string or `null`   | `null`           | Fallback validation message; also implies invalid state.                         |
| `invalid`         | boolean            | `false`          | Forces invalid presentation without requiring a message.                         |
| `required`        | boolean            | `false`          | Shows a visual marker; the control still owns `required`.                        |
| `labelPlacement`  | `top`, `floating`  | `top`            | Places the label above the control or inside it until focus or a value moves it. |
| `floatingVariant` | `in`, `on`, `over` | `in`             | Places the raised label inside, on the border, or above the control.             |

Named `label`, `description`, and `error` slots take precedence over matching fallback props. The
default slot contains one control. Field derives `{controlId}-description` and `{controlId}-error`
in that order; the control references only the regions that are actually rendered.

`CmField` (also exported as `VfField`) generates an SSR-safe id when no `controlId` is passed.
Bind the id provided by the default slot to the control. Floating labels support Input, Textarea,
and Select. Other controls keep an ordinary top label. Vanilla uses the same CSS; supply a
nonempty placeholder (a single space is sufficient) on native text inputs and textareas so CSS can
tell whether the control has a value. See the [in](../../contracts/field/cases/floating-in.html),
[on](../../contracts/field/cases/floating-on.html), and [over](../../contracts/field/cases/floating-over.html) examples.

## Input API

| Prop                | Values                                                        | Default         | Behavior                                     |
| ------------------- | ------------------------------------------------------------- | --------------- | -------------------------------------------- |
| `value`             | string                                                        | `''`            | Current value; Vue maps to `v-model`.        |
| `type`              | `text`, `email`, `number`, `password`, `search`, `tel`, `url` | `text`          | Native single-line type.                     |
| `size`              | `sm`, `md`, `lg`                                              | `md`            | Shared control size.                         |
| `invalid`           | boolean                                                       | `false`         | Adds `aria-invalid` and invalid style.       |
| `disabled`          | boolean                                                       | `false`         | Native disabled state.                       |
| `readonly`          | boolean                                                       | `false`         | Native readonly state.                       |
| `required`          | boolean                                                       | `false`         | Native required constraint.                  |
| `clearable`         | boolean                                                       | `false`         | Clears an editable value and restores focus. |
| `passwordReveal`    | boolean                                                       | `false`         | Toggles visibility for password inputs.      |
| `clearLabel`        | string                                                        | `Clear input`   | Accessible clear-action label.               |
| `showPasswordLabel` | string                                                        | `Show password` | Accessible reveal-action label.              |
| `hidePasswordLabel` | string                                                        | `Hide password` | Accessible conceal-action label.             |

Safe native attributes such as `id`, `name`, `autocomplete`, `placeholder`, `pattern`, and
`inputmode` reach the input. Number inputs submit and emit native string values and accept `min`,
`max`, and `step` for validation. Component-owned value, type, boolean state, and `aria-invalid`
cannot be overridden through forwarded attributes.

The `leading` and `trailing` slots accept framework-native trusted content, including icons. Hide
decorative content from assistive technology and provide a label for the input. `VfInput` from
`@codemonster-ru/ui-vue/historical` also accepts `leadingIcon` and `trailingIcon` as named icons.
An explicit slot takes precedence over the corresponding icon prop.

## Textarea and choice APIs

`Textarea` accepts the Input state and size props except `type`; its string `value` maps to Vue
`modelValue` and renders as escaped textarea content in Vanilla HTML. Native attributes such as `name`,
`rows`, `maxlength`, and `wrap` reach the `<textarea>`.

Checkbox and Switch share these props:

| Prop            | Values           | Default | Behavior                                                     |
| --------------- | ---------------- | ------- | ------------------------------------------------------------ |
| `checked`       | boolean          | `false` | Current state; Vue maps this to boolean `v-model`.           |
| `value`         | string           | `on`    | Native submitted value while checked.                        |
| `label`         | string           | `''`    | Escaped fallback when the default slot is empty.             |
| `size`          | `sm`, `md`, `lg` | `md`    | Shared label and control size.                               |
| `invalid`       | boolean          | `false` | Adds invalid presentation and `aria-invalid`.                |
| `disabled`      | boolean          | `false` | Native disabled state; the control is not submitted.         |
| `required`      | boolean          | `false` | Native required constraint.                                  |
| `indeterminate` | boolean          | `false` | Checkbox only: native mixed visual state, not a third value. |

Radio requires a string `value` and otherwise shares `label`, `size`, `invalid`, `disabled`, and
`required`. Vue compares `modelValue` with each option value. Vanilla HTML receives `checked` for the
current option. Give related radios the same non-empty native `name`.

Switch represents an immediate setting and renders a native checkbox with `role="switch"`. Use
Checkbox for acceptance or multi-selection. Neither component emits a hidden fallback input, so an
unchecked value is absent from submitted form data.

Switch accepts trusted decorative content through its `thumb` slot. The wrapper is hidden from
assistive technology, so keep the visible setting name in the default slot or `label` prop. Vue
provides the current `{ checked }` state to the thumb slot; Vanilla templates render thumb content for the
current server response.

## Vue binding

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmCheckbox, CmField, CmInput, CmRadio, CmSwitch, CmTextarea } from '@codemonster-ru/ui-vue';

const email = ref('');
const frequency = ref('daily');
const notes = ref('');
const updates = ref(false);
const darkMode = ref(false);
const error = ref<string>();
</script>

<template>
  <form method="post">
    <CmField control-id="email" label="Email" description="Used for notifications." :error="error" required>
      <template #default="{ controlId, describedBy, invalid, required }">
        <CmInput
          :id="controlId"
          v-model="email"
          name="email"
          type="email"
          autocomplete="email"
          :aria-describedby="describedBy"
          :invalid="invalid"
          :required="required"
        />
      </template>
    </CmField>
    <CmTextarea v-model="notes" name="notes" aria-label="Notes" />
    <CmCheckbox v-model="updates" name="topics" value="updates">Product updates</CmCheckbox>
    <CmRadio v-model="frequency" name="frequency" value="daily">Daily</CmRadio>
    <CmRadio v-model="frequency" name="frequency" value="weekly">Weekly</CmRadio>
    <CmSwitch v-model="darkMode" name="theme" value="dark">Dark mode</CmSwitch>
    <CmSwitch v-model="darkMode" name="theme-preview">
      <template #thumb="{ checked }">{{ checked ? '●' : '○' }}</template>
      Theme preview
    </CmSwitch>
  </form>
</template>
```

`CmInput` emits `update:modelValue` with the current DOM string and preserves the native `input`
event. It does not keep a second uncontrolled value. Native form serialization reads the DOM value
and native constraints still govern browser submission.

Textarea follows the same string binding. Checkbox and Switch emit booleans; Radio emits its string
option value. Keep the model as the single Vue source of truth.

## Vanilla form submission

Render initial values and validation state using the canonical HTML for [field](../../contracts/field/contract.md), [input](../../contracts/input/contract.md), [textarea](../../contracts/textarea/contract.md), [checkbox](../../contracts/checkbox/contract.md), [radio](../../contracts/radio/contract.md), [switch](../../contracts/switch/contract.md), [theme-switch](../../contracts/theme-switch/cases/default.html).

## Indeterminate Checkbox in Vanilla HTML

HTML cannot serialize the native `indeterminate` DOM property. When Vanilla HTML renders
`<cm-checkbox :indeterminate="true">`, register the framework-independent Checkbox controller in
the frontend bundle:

```ts
import { CmRuntime, createCmCheckboxController } from '@codemonster-ru/ui-runtime';

new CmRuntime().register('checkbox', createCmCheckboxController).start(document);
```

Clear and password-reveal actions in Vanilla HTML use the same progressive enhancement pattern:

```ts
import { CmRuntime, createCmInputController } from '@codemonster-ru/ui-runtime';

new CmRuntime().register('input', createCmInputController).start(document);
```

Vue handles these actions in the adapter. Both platforms dispatch or preserve the ordinary input
event on clear, retain focus, and keep the current selection when password visibility changes.

Without enhancement the control safely degrades to an ordinary unchecked checkbox. Vue sets the
property directly and does not need the runtime. Do not initialize the runtime over Vue-owned form
components.

## ThemeSwitch API

`CmThemeSwitch` is a three-state preference — `light`, `dark`, and `system` — not a two-position
toggle. Native radios carry the semantics and the keyboard behaviour, so the control works inside a
form with no JavaScript at all.

Choosing a mode writes `data-cm-theme` on the document root and, by default, a `cm-theme` cookie. The attribute is
written verbatim, `system` included, because the stylesheet resolves that case through a
`prefers-color-scheme` query; the cookie is what lets the server render the right theme on the first
paint. See [the theme subsystem](../architecture/theme-subsystem.md) for why the preference lives in
a cookie rather than in `localStorage`.

```vue
<script setup lang="ts">
import { CmThemeSwitch } from '@codemonster-ru/ui-vue';
import type { CmThemeMode } from '@codemonster-ru/ui-runtime/core';
import { ref } from 'vue';

const mode = ref<CmThemeMode>('system');
</script>

<template>
  <CmThemeSwitch v-model="mode" />
</template>
```

On the server, read the cookie and stamp the root before anything renders:

Vanilla markup: [theme-switch HTML](../../contracts/theme-switch/cases/default.html).

`name` renames the radio group, `legend` labels it, and `cookieName` changes where the preference is
stored when there is no provider. `VfThemeSwitch` restores the two-position Vue control as a
separate export. Inside a provider, use `variant="button"` for an icon or labeled button, or
the default switch with optional `static` and `thumb-contrast="inverse"` styling. The static
style keeps the track neutral as the thumb moves; the switch remains operable.

Wrap an application in `CmThemeProvider` to share state across Vue components. `useCmTheme()`
returns the `theme` and `resolvedTheme` refs, `setTheme(mode)`, and `toggleTheme()`.
An uncontrolled `CmThemeSwitch` reads and updates that state. Use one provider for the document.
On the server, supply `defaultTheme` from the request and set the root `data-cm-theme` attribute
before render. The provider does not touch the browser during server rendering; once mounted it
keeps system mode in sync with the browser's media query.

`VfThemeProvider` and `useTheme()` are available from the Vue root. `VfThemeProvider` defaults to
the historical `vf-theme` key in `localStorage` and reflects the resolved light or dark theme on
`data-vf-theme`. An explicit `attribute` adds another resolved attribute. The shared
`data-cm-theme` attribute retains the selected mode, including `system`. Both composable names and
both switch components can use either provider. Use one provider to own the document theme.

`CmThemeProvider` uses the shared cookie by default. When migrating to it, pass
`storage-key="vf-theme"` to retain the historic storage key and `attribute="data-vf-theme"` if
your styles still use the historic selector. The cookie and local storage are independent. Server
rendering takes its initial mode from `defaultTheme`; browser preferences are read after hydration.

## Native form and accessibility rules

- A named enabled input contributes its current value to form submission.
- Checked named Checkbox, Radio, and Switch controls contribute their string value. Unchecked
  controls are absent; normalize missing values in application code.
- Related Radio controls use the same native `name`; browser exclusivity remains authoritative.
- Textarea submits its current DOM text and preserves native multiline constraints.
- A readonly input remains successful form data; a disabled input does not submit.
- Field's required marker is visual-only, so set native `required` on Input as shown.
- An error implies Field invalid presentation. Input receives `invalid` separately because Field
  does not inspect or mutate trusted slot markup.
- Connect help and error ids through `aria-describedby` in description-then-error order.
- Input does not generate an accessible name; compose it with Field or provide a native ARIA name.
- Keep native browser validation unless the application deliberately implements and tests an
  equivalent accessible validation flow.
