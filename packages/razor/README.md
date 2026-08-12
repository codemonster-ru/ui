# CodeMonster UI for Annabel Razor

Composer adapter providing CodeMonster UI components and packaged frontend assets for Annabel
Razor.

Current release: `codemonster-ru/ui@0.1.0`.

## Requirements

- PHP 8.2 or newer.
- `codemonster-ru/razor` 2.x.

## Installation

```bash
composer require codemonster-ru/ui
```

Component registration and rendering are added by their dedicated roadmap items. The package does
not require Node.js in production.

## Development

```bash
composer install
composer check
```

`composer check` runs PHPStan at maximum level followed by PHPUnit.

## License

[MIT](./LICENSE)
