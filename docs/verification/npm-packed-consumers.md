# npm packed-consumer verification

Verification date: 2026-08-13.

`CMUI-155` was run with Node.js 24.15.0, npm 11.9.0, pnpm 10.34.5, and Yarn 1.22.22:

```bash
npm run build:ui
npm run check:packed-consumers
```

The gate passed for npm, pnpm, and Yarn. Each manager installed real tarballs in a fresh temporary
consumer without workspace links or lifecycle scripts.

The CodeMonster UI consumer covered the five packages in the active Vue release train:

- `@codemonster-ru/ui-tokens@0.1.0`
- `@codemonster-ru/ui-runtime@0.1.0`
- `@codemonster-ru/ui-css@0.1.0`
- `@codemonster-ru/ui-utilities@0.1.0`
- `@codemonster-ru/ui-vue@0.1.0`

It verified package metadata, absence of leaked `file:` runtime dependencies, TypeScript bundler
resolution, a production Vite build, Vue server rendering without a DOM, side-effect-free runtime
imports, token JavaScript exports, and the combined token/component/utility CSS graph. The existing
eight-package VueForge maintenance consumer and the three-package framework-independent CSS-only
consumer also passed on every manager.

React and Angular packages were not present and were not synthesized for this gate. Annabel Razor
is verified separately by the Composer packed-consumer gate.
