# CodeMonster UI runtime

Framework-independent progressive enhancement for canonical CodeMonster UI markup.

Current release: `@codemonster-ru/ui-runtime@0.1.0`.

The package provides controller registration, scoped discovery, idempotent lifecycle management,
optional mutation observation, typed `cm:*` custom-event helpers, and Accordion progressive
enhancement.

The runtime does not render application content, import a component framework, or replace native
HTML behavior.

## Installation

```bash
npm install @codemonster-ru/ui-runtime @codemonster-ru/ui-css
```

```ts
import '@codemonster-ru/ui-css/styles.css';
import { CmRuntime, createCmAccordionController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime().register('accordion', createCmAccordionController);
runtime.start(document);
```

Repeated `start()` calls are safe. Call `runtime.stop(container)` before permanently removing an
enhanced subtree, or use `const dispose = runtime.observe(container)` for automatic discovery and
disposal. Scope runtime initialization away from Vue-owned component trees.

See the cross-platform [Accordion guide](../../docs/components/accordion.md) for Razor rendering,
events, keyboard behavior, and state ownership.

## Development

```bash
npm run check
```

## License

MIT
