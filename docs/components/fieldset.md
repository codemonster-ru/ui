# Fieldset

`Fieldset` groups related controls under one required visible legend. Use `CmField` for one control;
use `CmFieldset` when a group of checkboxes, radios, or related inputs shares one name, description,
or validation message.

Load the same token and complete component stylesheets described in the [Button guide](./button.md).
Fieldset has no client runtime or keyboard behavior.

## Props and regions

| Prop          | Type             | Default  | Behavior                                                    |
| ------------- | ---------------- | -------- | ----------------------------------------------------------- |
| `id`          | non-empty string | required | Stable native id and prefix for supporting-region ids.      |
| `label`       | non-empty string | required | Escaped fallback legend when the `legend` slot is absent.   |
| `description` | string or `null` | `null`   | Fallback help text.                                         |
| `error`       | string or `null` | `null`   | Fallback validation text and implicit invalid state.        |
| `invalid`     | boolean          | `false`  | Marks the group invalid without requiring an error message. |

Trusted `legend`, default, `description`, and `error` slots replace their matching fallback content.
Description and error ids are `{id}-description` and `{id}-error`; the root owns their ordered
`aria-describedby` value and `aria-invalid`. Unknown safe attributes reach the root, while owned id
and ARIA relationships cannot be overridden.

## Vue

The default slot exposes `{ describedBy, invalid }` when individual controls need the same metadata:

```vue
<CmFieldset
  id="contact-method"
  label="Contact method"
  description="Choose every acceptable method."
  :error="contactError"
>
  <template #default="{ describedBy, invalid }">
    <CmCheckbox
      v-model="emailEnabled"
      name="contact_method"
      :aria-describedby="describedBy"
      :aria-invalid="invalid || undefined"
    >
      Email
    </CmCheckbox>
  </template>
</CmFieldset>
```

## Annabel Razor

Razor callers use the same deterministic supporting ids when a descendant control needs them:

```razor
<cm-fieldset
    id="contact-method"
    label="Contact method"
    description="Choose every acceptable method."
    :error="$errors['contact_method'] ?? null"
>
    <cm-checkbox
        name="contact_method"
        aria-describedby="contact-method-description contact-method-error"
        :aria-invalid="isset($errors['contact_method'])"
    >Email</cm-checkbox>
</cm-fieldset>
```

Do not turn untrusted strings into `RenderedHtml`. Fallback props remain escaped, while slot markup
is trusted application composition.
