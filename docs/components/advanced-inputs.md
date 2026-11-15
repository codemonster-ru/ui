# Advanced input components

`DatePicker` and `Select` use component-owned triggers and panels with a hidden input for named
form values. `CommandPalette` is a modal searchable command list with shared Vue and
progressive-enhancement behavior.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are available from the `select.css`, `date-picker.css`, and
`command-palette.css` npm subpath exports.

## Select

Select is component-owned: both adapters render the same trigger, listbox, and hidden input rather
than a browser-drawn control. It requires `id` and `options` with unique string `value`, non-empty
`label`, and optional `disabled`. It accepts `value`, `placeholder`, `clearable`, localized
`clearLabel`, `size` (`sm`, `md`, or `lg`), `invalid`, `disabled`, and `required`. Safe attributes
such as `autocomplete` and `aria-describedby` reach the trigger, while `name` reaches the hidden
input.

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
    id="frequency"
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

Vanilla markup: [select HTML](../../contracts/select/cases/default.html).

Vue emits `update:modelValue` and `valueChange` when a choice is committed. Vanilla HTML expects the
current submitted or application value. The clear action stays in the markup, is hidden while the
value is empty, emits the same bubbling `change`, and restores focus to the trigger.

Register `createCmSelectController` in Vanilla HTML: it owns opening, keyboard movement, selection,
clearing, and listbox placement. Without it the control renders its current value and a form still
submits that value through the hidden input, but the value cannot be changed.

`required` is announced through `aria-required` and is not enforced by the browser, because a
component-owned control sits outside constraint validation. Refusing an empty submission is the
application's responsibility.

Disabled Select values are omitted from form submissions. In server-rendered HTML, put
`disabled` on both the trigger and the named hidden input.
An uncanceled native form reset restores the submitted value and visible selection that were
authored in the original server markup. Reset does not dispatch a selection change event.

## DatePicker

DatePicker opens a calendar from a labelled trigger. The model, `min`, and `max` use
`YYYY-MM-DD` syntax. It accepts the same sizes and state props as Input, including `readonly`,
plus `clearable` and localized `clearLabel`.

```vue
<CmDatePicker
  id="launch-date"
  v-model="launchDate"
  name="launch_date"
  aria-label="Launch date"
  min="2026-01-01"
  clearable
  clear-label="Clear launch date"
  required
/>
```

Vanilla markup: [date-picker HTML](../../contracts/date-picker/cases/default.html).

Register `createCmDatePickerController` in Vanilla HTML to open the calendar, choose a date, or
clear the value. The named hidden input submits the selected ISO date. A readonly value still
submits. Put `disabled` on the trigger and the hidden input to omit disabled values from
submission even before enhancement.

The calendar limits selectable days according to `min` and `max`. The trigger announces
`required` through `aria-required`. Validate the range and required state in the application
because the hidden input does not participate in native constraint validation.

Use `locale` to choose a locale for the date and calendar labels, `displayFormat` to format
the trigger value with `yyyy`, `yy`, `MM`, `M`, `dd`, or `d`, and `firstDayOfWeek` to
set the first column (0 for Sunday through 6 for Saturday). Current defaults are
`en-US` and Sunday so server and browser output agree. Set the application locale and
`firstDayOfWeek` to 1 for the historical Monday-start behavior. The optional `labels`
object sets `calendar`, `clear`, `previousMonth`, and `nextMonth` names.

The Vanilla trigger accepts `data-cm-locale`, `data-cm-display-format`, and
`data-cm-first-day-of-week`. Render the initial text and accessible names with the
desired labels in HTML. Without a form input, use `data-cm-value` to supply an initial
ISO date. Configuration does not change the submitted format.

The keyboard opens the calendar with Arrow Down, Enter, or Space. The grid has one
day tab stop. Use arrows, Home/End, and Page Up/Down to navigate, and Enter or Space
to select. Escape returns focus to the trigger. Clicking outside or tabbing to another
control dismisses the calendar.

Set `multiple` to toggle several dates or `range` to choose two endpoints. Bind
`v-model` to a string array in either mode. Range selection takes precedence when both
flags are set. The first range click reports one date. The second reports the two dates in
chronological order and closes the calendar. Multiple selection stays open while toggling
dates. Both modes submit one ISO field per selected date under the same `name`. Read the
fields with `FormData.getAll(name)`.

In Vanilla put `data-cm-date-picker-mode="multiple"` or `"range"` on the trigger.
For form submission use `data-cm-date-picker-name` as the field name and include an
initial hidden input for each selected date. Use the `cm:date-picker-selection-change`
event, whose detail contains `mode` and `values`. Single mode retains its scalar
`cm:date-picker-value-change` event.

An uncanceled reset of the associated form restores the initial selection. Vue requests
the initial selection through its model event when the caller supplies another value.
Vanilla restores the authored fields and updates the trigger text. Set `form` to associate
a picker outside the form.

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

For Vanilla HTML, render initial state and register only the CommandPalette controller:

Vanilla markup: [command-palette HTML](../../contracts/command-palette/cases/default.html).

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
`{ command, active }` in Vue. Vanilla templates fill the corresponding regions with escaped text and authored markup.
Applications own command execution, authorization, global shortcuts, persistence, arbitrary result
renderers, fuzzy highlighting, unmatched-query submission, and dialog sizing or close policy.

## Accessibility and security

- Give Select and DatePicker an accessible label directly or compose them with Field.
- Provide accessible required and range validation for component-owned hidden fields.
- Treat submitted Select and DatePicker values as untrusted even when options and constraints were
  rendered by the server.
- Command labels, keywords, and queries are escaped strings. Pass only trusted authored markup to
  the explicit content regions; never turn remote command strings into raw HTML.
- Do not initialize shared runtime over Vue-owned CommandPalette markup.
