# CodeMonster UI for Annabel Razor

Composer adapter providing CodeMonster UI components and packaged frontend assets for Annabel
Razor.

Current release: `codemonster-ru/ui@0.1.0`.

## Requirements

- PHP 8.2 or newer.
- `codemonster-ru/razor` 2.1 or newer within the 2.x line.

## Installation

```bash
composer require codemonster-ru/ui
```

Component registration and rendering are added by their dedicated roadmap items. The package does
not require Node.js in production.

Register the CodeMonster UI provider during application bootstrap:

```php
use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Ui\UiComponentProvider;

$components = new ComponentRegistry();
$components->register(new UiComponentProvider());
```

The provider owns the `cm` prefix. Components are then available through tags such as
`<cm-button>` as their implementations are added.

Packaged frontend artifacts can be copied to an application public directory without Node.js:

```php
use Codemonster\Ui\Assets\AssetManifest;
use Codemonster\Ui\Assets\AssetPublisher;

$publisher = new AssetPublisher(AssetManifest::packaged());
$publishedPaths = $publisher->publish(__DIR__ . '/public/vendor/codemonster-ui');
```

Every file is declared by the package manifest and verified by SHA-256 before publication.
The packaged `css/tokens/tokens.css` and `css/css/styles.css` entries are the complete stylesheet
pair; keep their relative imported files together when serving them directly.

See the cross-platform [Button guide](../../docs/components/button.md) for complete Vue and Annabel
Razor usage.
See the [Card guide](../../docs/components/card.md) for nested default and named-slot composition.
See the [form components guide](../../docs/components/forms.md) for native submission, choice controls, and server rerender.
See the [Accordion guide](../../docs/components/accordion.md) for runtime installation and progressive enhancement.
See the [display components guide](../../docs/components/display.md) for the non-interactive display cohort.
See the [navigation components guide](../../docs/components/navigation.md) for Link, Breadcrumbs, and progressive enhancement.
See the [overlay components guide](../../docs/components/overlays.md) for server-rendered Dialog, Drawer, Popover, and Tooltip usage.

## Development

```bash
composer install
composer check
```

`composer check` runs PHPStan at maximum level followed by PHPUnit.

## License

[MIT](./LICENSE)
