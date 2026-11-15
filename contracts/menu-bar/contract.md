# Menu bar

Use one navigation landmark with a list whose role is `menubar`. Each enabled branch provides a
`menuitem` control and a named submenu with role `menu`. The first enabled top-level item is the
initial tab stop. Other items become the tab stop as focus moves. Disabled items remain visible
and are skipped by keyboard navigation.

The same keyboard rules apply to the [default](./cases/default.html) and [pills](./cases/pills.html)
variants. Open a branch with Down, Up, Enter, or Space. Arrow keys move within the current level or
open and close nested branches as appropriate. Horizontal arrows follow the reading direction.
Escape closes the open path and returns focus to the top-level trigger.

Pills use selected and open surfaces. Mark an initially selected leaf with `aria-current="page"`
and `cm-menu-bar__item--active`. Selection and keyboard state remain independent.

Use `kind="group"` in the Vue item data to label related items at the same keyboard level. In
authored HTML, put the visible `cm-menu-bar__group-label` and a named `ul[role="group"]` with
`cm-menu-bar__group-list` inside one presentation list item. The group itself does not receive
focus or appear in the open path, and arrows cross group boundaries at the same level.

In Vue, `to` uses the provided `linkComponent` or the registered `RouterLink`. An `href` remains a
native anchor. The opt-in historical `VfMenuBar` restores the `Menu bar` name, named leading
icons, and `select` with the original item object after the model/change events. The current
`CmMenuBar` and Vanilla event continue to report the selected value. Menus use inline CSS
positioning; the historical hover-close timer, floating submenu portal and horizontal scroll
controls are separate from this entry.
