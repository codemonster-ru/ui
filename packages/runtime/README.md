# CodeMonster UI runtime

Framework-independent progressive enhancement for canonical CodeMonster UI markup.

Current release: `@codemonster-ru/ui-runtime@1.0.0`.

The package provides controller registration, scoped discovery, idempotent lifecycle management,
optional mutation observation, typed `cm:*` custom-event helpers, Accordion interaction, and native
indeterminate Checkbox restoration, Tabs, Menu, and Dropdown interaction for server-rendered markup.

The runtime does not render application content, import a component framework, or replace native
HTML behavior.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling.
- A browser DOM for controller activation; server imports remain side-effect free.

## Installation

```bash
npm install @codemonster-ru/ui-runtime@^1.0.0 @codemonster-ru/ui-css@^1.0.0
```

## Quick start

```ts
import '@codemonster-ru/ui-css/styles.css';
import { CmRuntime, createCmAccordionController, createCmCheckboxController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime()
  .register('accordion', createCmAccordionController)
  .register('checkbox', createCmCheckboxController);
runtime.start(document);
```

Repeated `start()` calls are safe. Call `runtime.stop(container)` before permanently removing an
enhanced subtree, or use `const dispose = runtime.observe(container)` for automatic discovery and
disposal. Scope runtime initialization away from Vue-owned component trees.

## Documentation

See the cross-platform [Accordion guide](../../docs/components/accordion.md) for Razor rendering,
events, keyboard behavior, and state ownership.
See the [form components guide](../../docs/components/forms.md) for the narrow Checkbox runtime
requirement and native submission rules.
See the [navigation components guide](../../docs/components/navigation.md) for controller
registration, keyboard behavior, and state ownership.
See the [overlay components guide](../../docs/components/overlays.md) for modal focus management,
open-request events, and non-modal dismissal.
See the [advanced input guide](../../docs/components/advanced-inputs.md) for CommandPalette
registration, filtering, and selection events.
See the [Table and DataTable guide](../../docs/components/data-tables.md) for DataTable sorting,
selection, and server-owned pagination requests.

## Development

```bash
npm run check
```

## License

MIT
