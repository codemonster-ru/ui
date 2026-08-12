# Field contract

Status: Active

Component: `Field`

Razor tag: `cm-field`

## Purpose

Field groups one form control with its visible label, optional help text, and optional validation
message. It owns presentation and accessible relationships, but it does not own the control value,
name, native constraint attributes, or submission behavior.

## Identity and semantic structure

`controlId` is required, non-empty, and stable across server and client rendering. The default slot
contains exactly one primary form control whose native `id` equals `controlId`. Field renders a
`div.cm-field` root and forwards safe attributes to that root.

When label content exists, Field renders `label.cm-field__label` with `for=controlId`. A non-empty
`label` slot takes precedence over the escaped `label` prop. Required fields append
`span.cm-field__required` containing `*` and `aria-hidden="true"`; consumers must still set native
`required` on the control.

The default slot is wrapped in `div.cm-field__control`. Field does not inspect, clone, or mutate the
rendered control.

## Help and validation content

Non-empty description content renders after the control in `p.cm-field__description` with id
`{controlId}-description`. Non-empty error content renders last in `p.cm-field__error` with id
`{controlId}-error`. Named slots take precedence over their matching text props.

The control must reference every rendered supporting region through a space-separated
`aria-describedby` value in description-then-error order. An invalid control must expose
`aria-invalid="true"`. Vue may provide these derived values through scoped-slot data; Razor callers
pass the same deterministic values explicitly. This platform mapping may differ, but significant
DOM may not.

An error implies invalid presentation. Explicit `invalid=true` also adds `cm-field--invalid` when
no message is available. Native validity remains authoritative; Field does not invent an ARIA live
region or intercept validation events.

## Composition and security

Ordinary label, description, error, ids, and root attributes are contextually escaped. Slots use
the adapter's trusted component-composition boundary. Field adds no keyboard behavior and never
renders a nested `<form>`.
