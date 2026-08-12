# Menu contract

Status: Active

Component: `Menu`

Razor tag: `cm-menu`

## Purpose and item model

Menu presents application actions using the ARIA menu pattern. It is not site navigation. `items`
is a non-empty ordered collection with unique kebab-case `id`, non-empty escaped `label`, optional
`href`, `disabled`, `active`, and `tone` (`default` or `danger`). Items with href render anchors;
other items render native buttons. Disabled anchors omit href and use `aria-disabled="true"`.

The root owns `cm-menu`, `role="menu"`, an accessible label, and `data-cm-controller="menu"`.
Items own `role="menuitem"` and `data-cm-menu-item`. The first enabled item starts in the tab order;
other items use `tabindex="-1"`. Active is presentation plus `aria-current="true"`; selection state
requiring menuitemcheckbox or menuitemradio is outside this contract.

## Interaction

Up/Down arrows wrap among enabled items; Home and End move to the first and last enabled item.
Enter and Space retain native button/anchor activation. Activation reports the item id. Disabled
items cannot activate. Escape dispatches a bubbling close request so an owning Dropdown can close.
