# Field and Input

`Field` associates one native form control with its visible label, help text, and validation error.
`Input` is a thin single-line native input adapter. Together they preserve browser forms while Vue
uses idiomatic model binding and Annabel Razor uses submitted request values during server rerender.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Field and Input are also available from the `field.css` and `input.css` npm subpath exports.

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

## Vue binding

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmField, CmInput } from '@codemonster-ru/ui-vue';

const email = ref('');
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
  </form>
</template>
```

`CmInput` emits `update:modelValue` with the current DOM string and preserves the native `input`
event. It does not keep a second uncontrolled value. Native form serialization reads the DOM value
and native constraints still govern browser submission.

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
    <cm-button type="submit">Save</cm-button>
</form>
```

The server-rendered `value` is HTML-escaped. Error text is escaped unless authored as trusted slot
markup. Never convert request values or validation messages to `RenderedHtml`.

## Native form and accessibility rules

- A named enabled input contributes its current value to form submission.
- A readonly input remains successful form data; a disabled input does not submit.
- Field's required marker is visual-only, so set native `required` on Input as shown.
- An error implies Field invalid presentation. Input receives `invalid` separately because Field
  does not inspect or mutate trusted slot markup.
- Connect help and error ids through `aria-describedby` in description-then-error order.
- Input does not generate an accessible name; compose it with Field or provide a native ARIA name.
- Keep native browser validation unless the application deliberately implements and tests an
  equivalent accessible validation flow.
