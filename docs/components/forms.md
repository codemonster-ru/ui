# Form components

`Field` associates a control with its label and messages. `Input`, `Textarea`, `Checkbox`, `Radio`,
and `Switch` preserve native browser editing, focus, validation, events, and form submission. Vue
uses idiomatic model binding; Annabel Razor renders values from application state or the submitted
request.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Each component style is also available from the `field.css`, `input.css`, `textarea.css`,
`checkbox.css`, `radio.css`, and `switch.css` npm subpath exports.

## Field API

| Prop          | Values           | Default | Behavior                                                    |
| ------------- | ---------------- | ------- | ----------------------------------------------------------- |
| `controlId`   | non-empty string | —       | Id of the single control associated with the visible label. |
| `label`       | string or `null` | `null`  | Fallback visible label.                                     |
| `description` | string or `null` | `null`  | Fallback help text.                                         |
| `error`       | string or `null` | `null`  | Fallback validation message; also implies invalid state.    |
| `invalid`     | boolean          | `false` | Forces invalid presentation without requiring a message.    |
| `required`    | boolean          | `false` | Shows a visual marker; the control still owns `required`.   |

Named `label`, `description`, and `error` slots take precedence over matching fallback props. The
default slot contains one control. Field derives `{controlId}-description` and `{controlId}-error`
in that order; the control references only the regions that are actually rendered.

## Input API

| Prop       | Values                                              | Default | Behavior                               |
| ---------- | --------------------------------------------------- | ------- | -------------------------------------- |
| `value`    | string                                              | `''`    | Current value; Vue maps to `v-model`.  |
| `type`     | `text`, `email`, `password`, `search`, `tel`, `url` | `text`  | Approved native single-line type.      |
| `size`     | `sm`, `md`, `lg`                                    | `md`    | Shared control size.                   |
| `invalid`  | boolean                                             | `false` | Adds `aria-invalid` and invalid style. |
| `disabled` | boolean                                             | `false` | Native disabled state.                 |
| `readonly` | boolean                                             | `false` | Native readonly state.                 |
| `required` | boolean                                             | `false` | Native required constraint.            |

Safe native attributes such as `id`, `name`, `autocomplete`, `placeholder`, `pattern`, and
`inputmode` reach the input. Component-owned value, type, boolean state, and `aria-invalid` cannot
be overridden through forwarded attributes.

## Textarea and choice APIs

`Textarea` accepts the Input state and size props except `type`; its string `value` maps to Vue
`modelValue` and renders as escaped textarea content in Razor. Native attributes such as `name`,
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
`required`. Vue compares `modelValue` with each option value. Razor receives `checked` for the
current option. Give related radios the same non-empty native `name`.

Switch represents an immediate setting and renders a native checkbox with `role="switch"`. Use
Checkbox for acceptance or multi-selection. Neither component emits a hidden fallback input, so an
unchecked value is absent from submitted form data.

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
  </form>
</template>
```

`CmInput` emits `update:modelValue` with the current DOM string and preserves the native `input`
event. It does not keep a second uncontrolled value. Native form serialization reads the DOM value
and native constraints still govern browser submission.

Textarea follows the same string binding. Checkbox and Switch emit booleans; Radio emits its string
option value. Keep the model as the single Vue source of truth.

## Annabel Razor submission

Read scalar request input, validate it in application code, and pass both collections back to the
view. Ordinary strings remain untrusted:

```php
$submitted = ['email' => (string) ($request->input('email') ?? '')];
$errors = $validator->errors();

echo $razor->render('account.form', compact('submitted', 'errors'));
```

Render the current value and relationships explicitly in the Razor template:

```razor
<form method="post">
    <cm-field control-id="email" label="Email" :error="$errors['email'] ?? null" required>
        <cm-input
            id="email"
            name="email"
            type="email"
            autocomplete="email"
            :value="$submitted['email'] ?? ''"
            :invalid="isset($errors['email'])"
            :required="true"
            :aria-describedby="isset($errors['email']) ? 'email-error' : null"
        />
    </cm-field>
    <cm-textarea name="notes" :value="$submitted['notes'] ?? ''" aria-label="Notes" />
    <cm-checkbox name="topics" value="updates" :checked="in_array('updates', $submitted['topics'] ?? [], true)">
        Product updates
    </cm-checkbox>
    <cm-radio name="frequency" value="daily" :checked="($submitted['frequency'] ?? 'daily') === 'daily'">Daily</cm-radio>
    <cm-radio name="frequency" value="weekly" :checked="($submitted['frequency'] ?? '') === 'weekly'">Weekly</cm-radio>
    <cm-switch name="theme" value="dark" :checked="($submitted['theme'] ?? null) === 'dark'">Dark mode</cm-switch>
    <cm-button type="submit">Save</cm-button>
</form>
```

The server-rendered `value` is HTML-escaped. Error text is escaped unless authored as trusted slot
markup. Never convert request values or validation messages to `RenderedHtml`.

## Indeterminate Checkbox in Razor

HTML cannot serialize the native `indeterminate` DOM property. When Razor renders
`<cm-checkbox :indeterminate="true">`, register the framework-independent Checkbox controller in
the frontend bundle:

```ts
import { CmRuntime, createCmCheckboxController } from '@codemonster-ru/ui-runtime';

new CmRuntime().register('checkbox', createCmCheckboxController).start(document);
```

Without enhancement the control safely degrades to an ordinary unchecked checkbox. Vue sets the
property directly and does not need the runtime. Do not initialize the runtime over Vue-owned form
components.

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
