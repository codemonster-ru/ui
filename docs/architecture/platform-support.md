# CodeMonster UI platform support

| Integration | Requirements |
| --- | --- |
| Vue | Vue 3.5 and the shared tokens and CSS packages |
| Vanilla HTML + CSS + JavaScript | A browser that supports the shared CSS and ES modules for interactive components |
| Repository development | Node.js as pinned in [`.nvmrc`](../../.nvmrc) |

Vue components and Vanilla markup share the [canonical HTML contracts](../../contracts/README.md),
tokens, styles, and behavior core. Vanilla consumers serve static assets and can generate the
markup with any template engine. Static components work with HTML and CSS alone. Interactive
components use the browser runtime.

See the [getting started guide](../getting-started.md), [Vanilla setup](../vanilla.md), and
[browser support](./browser-and-css-support.md).
