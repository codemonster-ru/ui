# Accordion contract

Status: Active

Component: `Accordion`

Razor tag: `cm-accordion`

## Purpose

Accordion presents an ordered list of disclosure triggers and associated content panels. The
server-rendered markup is complete and readable without JavaScript; the optional shared runtime
adds state changes and keyboard focus management. Vue owns the same behavior inside its component
tree and must not attach the DOM runtime to a hydrated Accordion root.

## Data contract

`id` is a non-empty stable DOM id prefix. Every item contains a unique non-empty kebab-case `id`, a
non-empty plain-text `title`, plain-text `content`, and optional boolean `disabled`. Adapters reject
duplicate ids and invalid item shapes. Ordinary item strings are escaped and never become trusted
markup.

`openItems`, when present, is the controlled ordered list of open ids. Otherwise
`defaultOpenItems` supplies initial state. Unknown and disabled ids are ignored. Single mode keeps
at most the first valid id; multiple mode preserves valid ids in item order.

Each item has optional `trigger{ItemId}` and `panel{ItemId}` trusted composition slots. The
kebab-case item id becomes UpperCamelCase, so `account-details` maps to `triggerAccountDetails` and
`panelAccountDetails`. A trigger slot replaces the escaped title; a panel slot replaces the escaped
content. Trigger slots must contain phrasing content without nested interactive controls because the
component owns the surrounding button. Ordinary item strings remain escaped fallbacks.

## Canonical markup

The root owns `cm-accordion`, `data-cm-controller="accordion"`, and
`data-cm-accordion-multiple="true"` only in multiple mode. Each item is a
`section.cm-accordion__item` with its semantic id in `data-cm-accordion-item`.

Each title is an `h3.cm-accordion__heading` containing one native
`button.cm-accordion__trigger`. Trigger ids use `{id}-{itemId}-trigger`; panel ids use
`{id}-{itemId}-panel`. `aria-controls`, `aria-expanded`, and `aria-labelledby` form reciprocal
relationships. Disabled items use native `disabled`. A panel is
`div.cm-accordion__panel[role=region]` and uses native `hidden` while closed.

The fixed `h3` is the pilot contract. Consumers place Accordion under a suitable preceding heading;
a future heading-level option requires an explicit contract change.

## Interaction

- Click, Enter, or Space toggles an enabled trigger.
- Single mode closes an open peer before opening the activated item.
- Multiple mode toggles only the activated item.
- ArrowDown and ArrowUp move focus cyclically among enabled triggers.
- Home and End move focus to the first and last enabled trigger.
- Disabled triggers do not toggle and are skipped by managed focus navigation.
- Every user state change emits one `openChange` semantic event with open ids in item order. The DOM
  runtime dispatches `cm:open-change`; Vue emits `update:openItems` and `openChange`.

Native Tab order, focus activation, and button semantics remain authoritative. Panels are not
focusable by default. The runtime does not move focus when expansion changes.

## Controlled state and enhancement

In controlled mode, an adapter reports the requested next state but renders the state supplied by
the owner. In uncontrolled mode, it updates local state. Razor output uses the current server state;
the DOM runtime owns client state after progressive enhancement and emits changes for application
integration.

The runtime synchronizes `aria-expanded` and `hidden` before dispatching its event. Repeated runtime
initialization must not duplicate listeners. Disconnecting a controller removes its listeners but
does not rewrite the last visible state.
