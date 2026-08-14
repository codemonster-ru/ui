# Advanced input components

`Select` and `DatePicker` deliberately preserve native browser controls, form submission, keyboard
editing, and constraint validation. `CommandPalette` is a modal searchable command list with shared
Vue and progressive-enhancement behavior.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are available from the `select.css`, `date-picker.css`, and
`command-palette.css` npm subpath exports.

## Select

Select requires `options` with unique string `value`, non-empty `label`, and optional `disabled`.
It accepts `value`, `placeholder`, `clearable`, localized `clearLabel`, `size` (`sm`, `md`, or
`lg`), `invalid`, `disabled`, and `required`. Safe native attributes such as `id`, `name`, `autocomplete`, and
`aria-describedby` reach the `<select>`.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmSelect } from '@codemonster-ru/ui-vue';

const frequency = ref('');
const options = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];
</script>

<template>
  <CmSelect
    v-model="frequency"
    name="frequency"
    aria-label="Frequency"
    :options="options"
    placeholder="Choose"
    clearable
    clear-label="Clear frequency"
    required
  />
</template>
```

```razor
<cm-select name="frequency" aria-label="Frequency" :options="$options" :value="$submitted['frequency'] ?? ''" placeholder="Choose" :clearable="true" clear-label="Clear frequency" :required="true" />
```

Vue emits `update:modelValue` and `valueChange` from the native `change` event. Razor expects the
current submitted or application value. The clear action selects the empty native value, emits the
same bubbling `change`, and restores focus. Register `createCmSelectController` for this progressive
enhancement in Razor; without runtime the select and form submission remain native and the clear
button is inert.

## DatePicker

DatePicker renders `<input type="date">`. `value`, `min`, and `max` are empty or real calendar dates
in `YYYY-MM-DD` syntax. It accepts the same sizes and state props as Input, including `readonly`,
plus `clearable` and localized `clearLabel`.

```vue
<CmDatePicker
  v-model="launchDate"
  name="launch_date"
  aria-label="Launch date"
  min="2026-01-01"
  clearable
  clear-label="Clear launch date"
  required
/>
```

```razor
<cm-date-picker name="launch_date" aria-label="Launch date" :value="$submitted['launch_date'] ?? ''" min="2026-01-01" :clearable="true" clear-label="Clear launch date" :required="true" />
```

The browser owns calendar UI and localized presentation, so its popup appearance can differ by
platform. The successful form value remains ISO `YYYY-MM-DD`. The portable contract does not add a
custom calendar, multiple/range or month/year/time modes, display formatting, first-day policy, or
calendar labels. Register the existing `createCmInputController` in Razor to enhance the clear
action; the date input and submission remain native without it. Validate submitted dates again on
the server.

## CommandPalette

CommandPalette requires `id`, `title`, and ordered `commands` with unique kebab-case `id`, `label`,
optional plain-text `keywords`, and optional `disabled`. The collection may be empty while commands
load. It accepts `open`, `query`, `loading`, `placeholder`, `emptyText`, `idleText`, `loadingText`,
and `closeLabel`.

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { CmCommandPalette } from '@codemonster-ru/ui-vue';

const open = ref(false);
const query = ref('');
const commands = [
  { id: 'new-project', label: 'New project', keywords: 'create repository' },
  { id: 'archive-project', label: 'Archive project' },
];

function runCommand(command: string): void {
  console.log(command);
}
</script>

<template>
  <button type="button" @click="open = true">Commands</button>
  <CmCommandPalette
    id="workspace"
    v-model:open="open"
    v-model:query="query"
    title="Commands"
    :commands="commands"
    loading-text="Loading commands"
    idle-text="Start typing"
    @select="runCommand"
  >
    <template #commandNewProject="{ active }"><strong>New project</strong>{{ active ? ' — selected' : '' }}</template>
    <template #footer>Results are filtered locally.</template>
  </CmCommandPalette>
</template>
```

For Razor, render initial state and register only the CommandPalette controller:

```razor
<button id="open-commands" type="button">Commands</button>
<cm-command-palette id="workspace" title="Commands" :commands="$commands" />
```

```ts
import { CmRuntime, createCmCommandPaletteController } from '@codemonster-ru/ui-runtime';

new CmRuntime().register('command-palette', createCmCommandPaletteController).start(document);

const palette = document.querySelector('#workspace-command-palette');
document.querySelector('#open-commands')?.addEventListener('click', () => {
  palette?.dispatchEvent(new CustomEvent('cm:command-palette-open-request'));
});
palette?.addEventListener('cm:command-palette-select', (event) => {
  const command = (event as CustomEvent<{ value: string }>).detail.value;
  runCommand(command);
});
```

The search keeps focus in the combobox. Arrow keys, Home, and End update its active descendant;
Enter reports the enabled command id and closes. Escape and the close button dismiss and restore
focus. Filtering is case-insensitive substring matching over labels and keywords, in original
order. `actions`, `loading`, `idle`, `empty`, and `footer` accept trusted authored content;
`command{UpperCamelId}` replaces one label inside its component-owned option and receives
`{ command, active }` in Vue. Razor accepts the same named regions as trusted `RenderedHtml`.
Applications own command execution, authorization, global shortcuts, persistence, arbitrary result
renderers, fuzzy highlighting, unmatched-query submission, and dialog sizing or close policy.

## Accessibility and security

- Give Select and DatePicker an accessible label directly or compose them with Field.
- Keep native required and range validation unless an equivalent accessible flow is tested.
- Treat submitted Select and DatePicker values as untrusted even when options and constraints were
  rendered by the server.
- Command labels, keywords, and queries are escaped strings. Pass only trusted authored markup to
  the explicit content regions; never turn remote command strings into raw HTML.
- Do not initialize shared runtime over Vue-owned CommandPalette markup.
