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

Both showcases use the same navigation:

- **Overview** (`/` or `/core/`): browse the visual matrices by category. Open **Contract examples** to see
  additional cases and supported variants.
- **Components** (`/components/`): filter the catalog by purpose or category, or open a detail page directly, such as
  `/components/button/`. Preview the component, copy usage examples, and follow its developer guide.
- **Guides** (`/docs/`): read the [developer documentation](../../docs/index.md) in the same site
  as the examples. Start with [installation and quick starts](../../docs/getting-started.md).
- **Examples** (`/examples/`): try a release workspace with a dashboard, filtered deployment table,
  release form, settings, and a sample sign-in. The demo uses local state and sends no requests.
- **Resources** groups Layouts (`/layouts/`), Colors (`/colors/`), and Icons (`/icons/`).
  Vue also includes CodeBlock and Playground.

Open **Search** from any page to find a component, guide, or heading within a guide. The header also
switches between light and dark. Use **Theme** on Overview to return to the system preference.

Both production builds emit directory indexes for known routes. Serve `examples/ui-showcase/dist`
at the origin root or `examples/vanilla/dist` at the origin root or a subdirectory. Enable directory
indexes on the static server. No catch-all rewrite is required for known URLs.

Edit the canonical guides under `docs/`. The build compiles Markdown with raw HTML disabled and
rewrites links between included guides. Vanilla serves the rendered guides as HTML. Vue loads the
selected guide on demand. Both builds use a static search index that loads only when Search opens.

The Vue showcase also serves `/codeblock/` and `/playground/`. CodeBlock shows syntax highlighting,
line numbers, copying, long files, and skeleton replay. Playground shows single-file HTML,
multi-file JavaScript and CSS, a trusted Vue component, and two Vite virtual module previews.
The published VueForge packages power these two examples and are dependencies of the private
showcase workspace only.
