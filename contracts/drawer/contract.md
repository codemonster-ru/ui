# Drawer contract

Status: Active

Component: `Drawer`

Razor tag: `cm-drawer`

Drawer is a modal side sheet built on the Dialog contract. It renders a native `<dialog>` with
`cm-drawer`, a stable `id`, escaped `title`, optional `description`, default body, optional `footer`,
and an accessible close button. Trusted `header`, `description`, and `actions` slots share Dialog's
deterministic accessible structure, including the component-owned `h2` title boundary. `side` is
`start` or `end`; `size` is `sm`, `md`, `lg`, or
`full`. `dividers` and `rounded` are finite presentation variants. These values are expressed
through CSS modifiers and are logical-direction aware; applications do not choose physical left or
right props. Shell-specific offsets and padding remain consumer CSS concerns rather than accepting
arbitrary style strings as component props.

`open` is controlled in Vue through `v-model:open` and is the initial server state in Razor. The
shared Drawer controller provides the same initial focus, Tab containment, Escape dismissal, close
request, and focus restoration rules as Dialog. `dismissible=false` locks user-initiated Escape and
close-button dismissal. Backdrop activation does not close it. Drawer owns
no trigger and does not preserve state across navigation.
