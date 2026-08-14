# Form layout recipe

Use this maintained recipe when migrating `VfFormLayout`. Form arrangement is application layout
policy rather than a cross-platform component contract: `CmStack` supplies vertical rhythm,
`CmField` owns each field relationship, and a small application class adds aligned labels when the
form needs them.

The old `mode` values map as follows:

| VueForge mode | Recipe |
| ------------- | ------ |
| `stacked` | Use `CmStack` without the alignment class. |
| `horizontal` | Add the alignment class without a media query. |
| `responsive` | Add the alignment class inside the application's content breakpoint. |

Keep the breakpoint and label track in application CSS. They depend on the form's language, copy,
and containing surface, so they are deliberately not new `CmStack` or `CmField` props.

## Vue recipe

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmButton, CmField, CmInput, CmStack } from '@codemonster-ru/ui-vue';

const displayName = ref('Ada Lovelace');
const email = ref('ada@example.com');
</script>

<template>
  <form method="post" @submit.prevent>
    <CmStack class="profile-form">
      <CmField class="profile-form__field" control-id="display-name" label="Display name" required>
        <template #default="{ controlId, describedBy, invalid, required }">
          <CmInput
            :id="controlId"
            v-model="displayName"
            name="display_name"
            autocomplete="name"
            :aria-describedby="describedBy"
            :invalid="invalid"
            :required="required"
          />
        </template>
      </CmField>

      <CmField
        class="profile-form__field"
        control-id="email"
        label="Email"
        description="Used for account notifications."
      >
        <template #default="{ controlId, describedBy, invalid }">
          <CmInput
            :id="controlId"
            v-model="email"
            name="email"
            type="email"
            autocomplete="email"
            :aria-describedby="describedBy"
            :invalid="invalid"
          />
        </template>
      </CmField>

      <div class="profile-form__actions">
        <CmButton type="submit">Save profile</CmButton>
      </div>
    </CmStack>
  </form>
</template>

<style scoped>
.profile-form {
  --app-form-label-width: minmax(10rem, 25%);
}

@media (width >= 48rem) {
  .profile-form :deep(.profile-form__field) {
    grid-template-columns: var(--app-form-label-width) minmax(0, 1fr);
    grid-template-areas:
      'label control'
      '. description'
      '. error';
    align-items: start;
  }

  .profile-form :deep(.profile-form__field > .cm-field__label) {
    grid-area: label;
    padding-block-start: var(--cm-space-2);
  }

  .profile-form :deep(.profile-form__field > .cm-field__control) {
    grid-area: control;
  }

  .profile-form :deep(.profile-form__field > .cm-field__description) {
    grid-area: description;
  }

  .profile-form :deep(.profile-form__field > .cm-field__error) {
    grid-area: error;
  }

}
</style>
```

Remove the media query for a permanently horizontal form. Remove all alignment rules for a stacked
form. Align form-level actions separately when the product requires it; they are not field rows.

## Annabel Razor recipe

Use the same classes and CSS without Vue's `:deep()` selector:

```razor
<form method="post" action="/profile">
    <cm-stack class="profile-form">
        <cm-field class="profile-form__field" control-id="display-name" label="Display name" required>
            <cm-input
                id="display-name"
                name="display_name"
                autocomplete="name"
                :value="$submitted['display_name'] ?? ''"
                :required="true"
            />
        </cm-field>

        <cm-field
            class="profile-form__field"
            control-id="email"
            label="Email"
            description="Used for account notifications."
            :error="$errors['email'] ?? null"
        >
            <cm-input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                :value="$submitted['email'] ?? ''"
                :invalid="isset($errors['email'])"
                :aria-describedby="isset($errors['email']) ? 'email-error' : 'email-description'"
            />
        </cm-field>

        <div class="profile-form__actions">
            <cm-button type="submit">Save profile</cm-button>
        </div>
    </cm-stack>
</form>
```

Razor renders request values and errors from server-owned state; it does not need a layout runtime.
Keep request strings in escaped props. The component's named/default slots are trusted application
markup and must not be built from untrusted HTML.

## Migration boundary

- Do not recreate `VfFormLayout` as a local wrapper unless several real forms share the exact same
  layout policy. A documented class is usually easier to adapt and remove.
- Keep each `control-id` stable and forward the `CmField` relationships to its control.
- Use `CmGrid` for groups of independent fields only when an auto-fitting card-like grid is the
  desired layout. Aligned label/control rows need the explicit two-column recipe above.
- Content order remains label, control, description, error in the DOM even when CSS aligns it.
