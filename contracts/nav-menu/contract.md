# Navigation menu

Use a navigation landmark with a list. Branch controls are native buttons with `aria-expanded`.
Use links for destinations and mark the current page with `aria-current="page"`. A collapsed
branch's descendants stay in the document and are outside the keyboard tab order. Group children
remain available without a disclosure button.

The canonical [sidebar](./cases/default.html) and [pills](./cases/pills.html) are the same tree.
The root pills class changes appearance and keeps labels visible at narrow widths. It does not
change the disclosure controls or link semantics.
