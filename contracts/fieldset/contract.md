# Fieldset contract

Status: Active

Component: `Fieldset`

Razor tag: `cm-fieldset`

## Purpose and identity

Fieldset groups related controls under one visible legend. `id` and `label` are required, non-empty,
and stable across server and client rendering. The component renders one native
`fieldset.cm-fieldset` root with its stable id and forwards safe attributes to that root.

The root's first child is `legend.cm-fieldset__legend`. A non-empty trusted `legend` slot takes
precedence over the escaped `label` prop. The required fallback label keeps every group named even
when the slot is absent. Default content renders inside `div.cm-fieldset__content`; Fieldset does
not inspect, clone, or mutate its controls.

## Description, error, and invalid state

Non-empty description content renders after the grouped controls in
`p.cm-fieldset__description` with id `{id}-description`. Non-empty error content renders last in
`p.cm-fieldset__error` with id `{id}-error`. Named slots take precedence over their matching
escaped text props.

The root references every rendered supporting region through `aria-describedby` in
description-then-error order. An error implies invalid state. Explicit `invalid=true` also adds
`cm-fieldset--invalid` and `aria-invalid="true"` when no error is rendered. Vue exposes the same
derived `describedBy` and `invalid` values to the default scoped slot so consumers can associate
individual controls when required; Razor callers can use the deterministic ids directly.

Fieldset does not infer native `required`, `disabled`, or per-control validity. Applications retain
those control states and validation policy.

## Composition, security, and enhancement

Ordinary ids, labels, description and error strings, and root attributes are contextually escaped.
Slots use the adapter's trusted component-composition boundary. Fieldset adds no keyboard behavior,
client runtime, live region, or form submission policy.
