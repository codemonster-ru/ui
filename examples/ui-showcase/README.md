# CodeMonster UI showcase

A live demonstration of every component in `@codemonster-ru/ui-vue` and every layout in
`@codemonster-ru/ui-layouts`, rendered by the Vue adapter.

From the repository root, run `npm ci` once, then use one of these commands:

- `npm run preview` builds the packages and Vue showcase, then opens it at
  [127.0.0.1:4173](http://127.0.0.1:4173).
- `npm run dev` starts the Vue showcase with hot reload at
  [127.0.0.1:5177](http://127.0.0.1:5177).
- `npm run preview:vanilla` opens the full Vanilla HTML showcase at
  [127.0.0.1:4174](http://127.0.0.1:4174).

In VS Code, the `preview` entry under `examples/ui-showcase/package.json` also builds and opens
the full Vue showcase. From that directory, run `npm run preview` to do the same in a terminal.

Both showcases have separate Core, Colors, Layouts, and Icons pages. The Core page includes
the same Button, IconButton, and Link variant matrices in both integrations. Open **Contract
examples** on a component card to compare the same cases and supported size, tone, and shape
variants in Vue and Vanilla.
