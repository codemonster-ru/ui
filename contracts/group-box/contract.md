# GroupBox

Use a native fieldset to give related controls a shared legend. A collapsible GroupBox places a
`type="button"` control in its first legend. Its accessible name matches the visible group title.
Give the trigger and content unique IDs and connect them with `aria-controls` and
`aria-labelledby`. The trigger's `aria-expanded` and the content's `hidden` state agree.

A collapsed GroupBox excludes its fields from validation and submission. Vue removes the
content slot. Vanilla retains the existing controls and marks the fieldset disabled, which leaves
the first legend's trigger available while excluding the other descendants. Reopening a Vanilla
GroupBox preserves edited form values.

For Vanilla disclosure, set `data-cm-controller="group-box"`. Set the root fieldset's `disabled`
attribute only when starting collapsed and disable the trigger separately to prevent toggling.
The controller updates the fieldset, trigger, content and collapse class before dispatching the
bubbling `cm:group-box-collapsed-change` event with `{ collapsed }`. Expanded content and static
fieldsets remain usable without JavaScript.

[Canonical disclosure markup](./cases/default.html) · [Vue and Vanilla usage](../../docs/recipes/group-box.md)
