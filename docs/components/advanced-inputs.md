# Advanced input components

`DatePicker` and `Select` use component-owned triggers and panels with a hidden input for named
form values. `CommandPalette` is a modal searchable command list with shared Vue and
progressive-enhancement behavior.

In Vue, pass names and descriptions with `aria-label`, `aria-labelledby`, and `aria-describedby`.
The component sets the trigger's button type, combobox role, popup relationship, and ARIA state
from its props and current interaction.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are available from the `select.css`, `date-picker.css`, and
`command-palette.css` npm subpath exports.

## Select

Select is component-owned: both adapters render the same trigger, listbox, and hidden input rather
than a browser-drawn control. It requires `id` and `options` with unique string `value`, non-empty
`label`, and optional `disabled`. It accepts `modelValue` in Vue, `placeholder`, `clearable`, localized
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
`disabled` on both the trigger and the named hidden input. To associate the control with a
separate form, pass `form` in Vue or set that attribute on the trigger and hidden input in
Vanilla. An uncanceled reset restores the initial submitted value and visible label. Vue
emits `update:modelValue` if the value changes. Reset does not emit a selection event. If you
call `form.reset()` programmatically, read the new Select value after reset handling has run;
the component updates its hidden input on the next task.

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

Choose `placement="bottom-end"` to align the calendar with the end of the trigger. Use
`teleport-to="body"` to move the calendar outside a clipped container. Only the calendar
moves, and the named value remains in the original form. In a native dialog, a body target places
the calendar in that dialog. Vanilla uses `data-cm-date-picker-placement` and
`data-cm-date-picker-teleport-to` on the combobox.

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

Use `monthPicker` with `YYYY-MM` values and bounds, or `yearPicker` with `YYYY` values
and bounds. Year mode takes precedence when both flags are set. These modes support
the same scalar, multiple, and range models as ordinary dates. The default display is
localized. Month mode moves from year to year. The year grid initially starts at the
selected decade and shows 12 years per page. Supply `previousYear` and `nextYear`, or
`previousDecade` and `nextDecade`, in `labels` to customize the navigation names.

Vanilla uses `data-cm-date-picker-precision="month"` or `"year"`. Match the
[month markup](../../contracts/date-picker/cases/month.html) or
[year markup](../../contracts/date-picker/cases/year.html) for the accessible grid labels
and form fields. The serialized value contains only the selected month or year.

Set `showTime` to include hour and minute selectors with the ordinary date grid.
Values and form fields use `YYYY-MM-DDTHH:mm` with no timezone conversion. A date-only
bound includes the whole day, while a bound with time restricts that day's available
options. `minuteStep` controls the available minutes in each hour and defaults to 1.
The picker stays open while the user chooses a day or adjusts the time. Use `HH`,
`H`, `mm`, and `m` with the date format tokens to customize the display.

For Vanilla use `data-cm-date-picker-show-time="true"` and
`data-cm-date-picker-minute-step` on the trigger. Reuse the labelled native selects
in the [time example](../../contracts/date-picker/cases/time.html). Month and year modes
take precedence over time. The native hour and minute controls use the shared CSS
and keep the browser's keyboard and assistive technology behavior.

An uncanceled reset of the associated form restores the initial selection. Vue requests
the initial selection through its model event when the caller supplies another value.

### Historical DatePicker

Import `VfDatePicker` from `@codemonster-ru/ui-vue/historical`. It keeps the historical runtime
Intl locale, Monday week start, and body portal defaults. It can generate the trigger ID.
`v-model` reports an ISO scalar, or an array in multiple or range mode. `locale`,
`displayFormat`, `firstDayOfWeek`, and `teleportTo` override the defaults. For matching server
and browser output across different runtime locales, pass the same `locale` explicitly.

The selected value and submitted form fields follow the supplied `modelValue`. Handle
`update:modelValue` or bind `v-model` to apply a selection. The clock uses native hour and minute
selects. To connect it to Field, pass the scoped `controlId` as the trigger `id`.
When Field uses `label-placement="floating"`, its label raises while focused, open, or filled.
This includes calendars portaled outside the Field.
Vanilla restores the authored fields and updates the trigger text. Set `form` to associate
a picker outside the form.

## CommandPalette

CommandPalette requires `id`, `title`, and ordered `commands` with unique kebab-case `id`, `label`,
optional plain-text `keywords`, and optional `disabled`. The collection may be empty while commands
load. It accepts `open`, `query`, `loading`, `placeholder`, `emptyText`, `idleText`, `loadingText`,
and `closeLabel`.

The historical `VfCommandPalette` moves to `body` after mount. Pass `teleportTo` to use a selector
or element in the same document. Use `disableTeleport`, `false`, or `null` to keep it inline.
Server markup stays inline for hydration, and the open palette uses the native modal top layer.
The palette fades and shifts upward when it closes on browsers that support native modal exit
motion. Closing returns focus immediately. [Modal motion and reduced motion](./overlays.md#apis)

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
