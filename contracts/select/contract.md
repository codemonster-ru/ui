# Select contract

Status: Active

Component: `Select`

Razor tag: `cm-select`

## Purpose

Select presents one value chosen from a fixed ordered collection. The control is component-owned:
both adapters render the same authored markup and neither delegates presentation to the browser's
built-in control.

## Semantic root

The root is always `cm-select-wrap` and carries `data-cm-controller="select"`. It contains, in
order:

1. a hidden input when `name` is present, so a form submits the current value;
2. the trigger button `cm-select`;
3. the clear action when `clearable` is set and a value is present;
4. the listbox.

The trigger owns `type="button"`, `aria-haspopup="listbox"`, `aria-expanded`, and `aria-controls`
pointing at the listbox. `invalid` maps to `aria-invalid`, `disabled` to the native `disabled`
attribute. Consumer `id` names the trigger; a generated identifier is used otherwise. Safe
attributes such as `name`, `autocomplete`, and `aria-describedby` reach the trigger, except `name`,
which reaches the hidden input.

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
optional `trailing` region, and a chevron in `cm-select__icon--chevron`. The chevron is omitted when
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

The listbox stays in the document next to its trigger and is positioned by the shared runtime, which
both adapters use, so placement does not depend on framework features. It opens below the trigger
with a two pixel offset, spans at least the trigger's inline size, and scrolls within a bounded
block size once its options exceed it. When the space below runs out it flips above the trigger, and
it shifts along the trigger to stay inside the viewport.

The listbox is not raised into a top layer, so an ancestor that clips overflow still clips it. That
limitation is shared with Dropdown, Popover, and Menu; lifting it belongs to all four at once rather
than to this contract alone.

## Behavior

Activating the trigger toggles the listbox. `Enter`, `Space`, `ArrowDown`, and `ArrowUp` open it
from the trigger. While open, `ArrowDown` and `ArrowUp` move the active option, `Home` and `End`
jump to the first and last selectable option, `Enter` selects the active option, and `Escape`
closes without changing the value and restores focus to the trigger. Selecting an option updates
the value, closes the listbox, restores focus, and dispatches a bubbling `change` event. Pointer
activity outside the root closes the listbox.

`clearable` adds a localized clear action while the control is enabled and a value is present.
Activating it clears the value, dispatches the same `change` event, and restores focus to the
trigger.

## Scripting

Both adapters render identical markup and share the `select` controller, which owns listbox
placement as well as pointer and keyboard interaction. Without scripting the control renders its current value
and a form still submits that value through the hidden input, but the value cannot be changed.
