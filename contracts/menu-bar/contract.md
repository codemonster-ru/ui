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
