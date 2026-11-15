# DatePicker contract

Status: Active

Component: `DatePicker`

DatePicker opens a calendar dialog from a labelled combobox button. Its `value`, `min`, and
`max` are empty or valid `YYYY-MM-DD` dates. Vue maps `value` to string `v-model`. Vanilla
HTML places the initial value in the hidden input alongside the trigger. A named hidden
input submits one ISO value. Disabled values are omitted. Readonly values still submit.
The application enforces required state and validates submitted values and range.

The calendar contains a month-labelled grid with one day in the tab order. Arrow keys
move by day or week, Home and End go to the edges of the configured week, and Page Up and
Page Down change month. Movement respects the date bounds. Escape closes the calendar and
returns focus to the trigger. An outside click or focus move closes the calendar without
moving focus back.

`clearable` adds an action named by `clearLabel`, which defaults to `Clear date`. It is hidden
while empty and omitted for disabled or readonly controls. Activating it commits the empty
value and returns focus to the trigger. Vue reports `update:modelValue` and `valueChange`.
The Vanilla `date-picker` controller dispatches `cm:date-picker-value-change` with the ISO
value or empty string and a bubbling `change` event from the trigger.

Locale and display formatting affect only presentation. Defaults are US English and a
week starting on Sunday. Vue accepts `locale`, `displayFormat`, `firstDayOfWeek`, and
`labels`. In Vanilla use the corresponding trigger `data-cm-*` attributes and author the
dialog and navigation accessible names in HTML. Historical multiple/range, month/year,
and time modes are outside this single-date contract.
