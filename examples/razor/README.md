# CodeMonster UI Razor example

Minimal Annabel Razor/PHP example for the CodeMonster UI components.

## Requirements

- Docker Desktop or another Docker Engine with Compose;
- the Annabel repository checked out next to this repository at
  `../../../../PHP/annabel` from this directory.

## Run

Install dependencies and start the PHP development server:

```bash
npm run dev:razor
```

Open <http://127.0.0.1:8081>.

`npm run dev:razor` builds the Annabel PHP image, runs Composer inside the container, and starts the
server. No global PHP or Composer installation is required.

If PHP and Composer are installed locally, the non-Docker variant is:

```bash
composer install --working-dir=examples/razor
npm run dev:razor:local
```

The example registers `UiComponentProvider`, renders Razor components on the server, and publishes
the packaged CodeMonster UI stylesheets to `public/vendor/codemonster-ui` on first request. Its
Button, Card, Field/Input, and Accordion examples use the same data as the Vue `/parity` showcase
from `examples/shared/parity-showcase.json`.
