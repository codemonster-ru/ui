# Select contract

Status: Active

Component: `Select`

## Purpose

Select presents one value chosen from a fixed ordered collection. The control is component-owned:
both adapters render the same authored markup and neither delegates presentation to the browser's
built-in control.

## Semantic root

The root is always `cm-select-wrap` and carries `data-cm-controller="select"`. It contains, in
order:

1. a hidden input when `name` is present, so a form submits the current value;
2. the trigger button `cm-select`;
3. the clear action when `clearable` is set and the control is enabled;
4. the listbox.

The trigger is a button carrying `role="combobox"` with `aria-haspopup="listbox"`,
`aria-expanded`, and `aria-controls` pointing at the listbox. The reference used a plain button, but
that role refuses `aria-required`, and a combobox is the role this widget actually presents. `invalid` maps to `aria-invalid` and `required` to `aria-required`, since
neither native attribute applies to a button; `disabled` maps to the native `disabled` attribute.
`id` is required, as it is for the other components that own related identifiers; it names the
trigger and the listbox derives its own as `{id}-listbox`. Safe attributes such as `autocomplete` and
`aria-describedby` reach the trigger, while `name` reaches the hidden input. Use `form` to
associate both the trigger and the named input with a form outside the component's subtree.

## Visual configuration

The trigger always owns `cm-select` and one size modifier:

```text
cm-select
cm-select--sm | cm-select--md | cm-select--lg
```

`cm-select--invalid` is added for the invalid state. The trigger carries `data-cm-filled` while a
value is selected.

## Content

The trigger renders an optional `leading` region, the current label in `cm-select__value`, an
optional `trailing` region, and a chevron in `cm-select__icon--chevron`. It carries the placeholder
in `data-cm-placeholder` when one is set, so the label can be restored after the value is cleared
without consulting the adapter. The chevron is omitted when
the clear action is present. Empty named regions are omitted. When no value is selected the value
region renders the `placeholder`, or an empty string when none is given.

## Listbox

The listbox is `cm-select__listbox` with `role="listbox"`, labelled by the trigger. It is rendered
in the document at all times and hidden while closed, so server-rendered markup matches the
rendering after hydration.

Each option is a `button` with `role="option"`, `type="button"`, `tabindex="-1"`, and
`aria-selected`. The selected option adds `cm-select__option--selected`. A disabled option carries
`aria-disabled` rather than the native `disabled` attribute, so assistive technology still announces
it while activation is refused.

## Placement

Both adapters default to keeping the listbox next to the trigger. It opens below the trigger with a
two pixel offset, is at least as wide as the trigger, and scrolls when the options exceed its
maximum height. It can flip above the trigger or shift sideways to fit. Set Vue's
`placement="bottom-end"` or set `data-cm-placement="bottom-end"` on the Vanilla listbox to align
to the end of the trigger instead of the start.

An ancestor that clips overflow can still clip an inline listbox. Vue accepts a selector or element
through `teleportTo` when a portal is needed. It renders inline for SSR and moves after hydration;
`disableTeleport`, `false`, and `null` keep it inline. Vue targets the containing dialog instead of
`body` when the trigger is inside a native modal so that the options remain interactive.

For historical Vue templates, `VfSelect` from `@codemonster-ru/ui-vue/historical` generates the ID
when omitted, accepts `leadingIcon` and `trailingIcon`, and defaults to a body portal. Explicit
adornment slots override the corresponding named icons.

## Behavior

Activating the trigger toggles the listbox. `Enter`, `Space`, `ArrowDown`, and `ArrowUp` open it
from the trigger. While open, `ArrowDown` and `ArrowUp` move the active option, `Home` and `End`
jump to the first and last selectable option, `Enter` selects the active option, and `Escape`
closes without changing the value and restores focus to the trigger. Selecting an option updates
the value, closes the listbox, restores focus, and dispatches a bubbling `change` event. Pointer
activity outside the root closes the listbox.

`clearable` adds a localized clear action while the control is enabled. The action stays in the
markup and is hidden while the value is empty, so both adapters and the runtime agree on one shape.
Activating it clears the value, dispatches the same `change` event, and restores focus to the
trigger.

## Scripting

Vue owns its state, event handling and rendering, and emits `update:modelValue` and `valueChange`.
Vanilla enhances the authored HTML through `createCmSelectController`; it dispatches
`cm:select-value-change` from the root and a bubbling native `change` from the trigger. Both
adapters use the same keyboard rules and positioning dependency.

An uncanceled form reset restores the initial value. When Vue changes its model on reset, it
emits `update:modelValue`; neither adapter reports the reset as a committed selection.

`required` is announced through `aria-required` but is not enforced by the browser, because a
component-owned control sits outside constraint validation. Refusing an empty submission is the
application's responsibility. Without scripting the control renders its current value
and a form still submits that value through the hidden input, but the value cannot be changed.
