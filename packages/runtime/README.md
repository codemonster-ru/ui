# CodeMonster UI runtime

Framework-independent progressive enhancement for canonical CodeMonster UI markup.

This guide covers version `2.0.0`. See the [2.0 release notes](../../docs/codemonster-ui-2.0-release-notes.md)
for release status and matching package versions.

The package provides controller registration, scoped discovery, lifecycle management,
optional mutation observation, and typed `cm:*` custom events for server-rendered markup.
Component guides identify which controllers are required and the events they dispatch.

The runtime does not render application content, import a component framework, or replace native
HTML behavior.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0` for package tooling.
- A browser DOM for controller activation; server imports remain side-effect free.

## Installation

Install from npm.

```bash
npm install @codemonster-ru/ui-tokens@2.0.0 @codemonster-ru/ui-css@2.0.0 @codemonster-ru/ui-runtime@2.0.0
```

## Quick start

```ts
import '@codemonster-ru/ui-tokens/tokens.css';
import '@codemonster-ru/ui-css/styles.css';
import { CmRuntime, createCmAccordionController, createCmCheckboxController } from '@codemonster-ru/ui-runtime';

const runtime = new CmRuntime()
  .register('accordion', createCmAccordionController)
  .register('checkbox', createCmCheckboxController);
runtime.start(document);
```

Repeated `start()` calls are safe. Call `runtime.stop(container)` before permanently removing an
enhanced subtree, or use `const dispose = runtime.observe(container)` for automatic discovery and
disposal. A DOM move between roots observed by the same runtime retains the existing controllers.
The disposer releases controllers that leave the runtime's observed roots. Scope runtime
initialization away from Vue-owned component trees.

## Documentation

Follow the [Vanilla quick start](../../docs/vanilla.md#quick-start) for complete markup,
or the [dynamic HTML guide](../../docs/vanilla.md#dynamic-html) for runtime lifecycle.

See the cross-platform [Accordion guide](../../docs/components/accordion.md) for Vanilla rendering,
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
