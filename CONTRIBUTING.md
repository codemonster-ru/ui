# Contributing to CodeMonster UI

Open a [GitHub issue](https://github.com/codemonster-ru/ui/issues) for a reproducible problem or
a new component use case. Include the package versions and integration you use. For a
vulnerability, follow the [security policy](./SECURITY.md).

## Set up the workspace

Use Node.js 24.15 or newer and the npm version in the root [package manifest](./package.json).
From the repository root, run `npm ci`. Run `npm run build` before focused package checks
that need compiled workspace imports. The [showcase guide](./examples/ui-showcase/README.md)
explains how to run both integrations locally.

## Make and verify a change

- Start with the [architecture](./ARCHITECTURE.md). For shared components, read the
  [canonical markup and state contracts](./contracts/README.md) and
  [accessibility requirements](./docs/architecture/accessibility-requirements.md).
- Update the component contract, related rendering and behavior, and usage examples together
  when changing a public contract. Describe any consumer migration in the pull request.
- For a focused package change, run the package's checks and check the affected published
  dependants. For example, after the workspace build, run `npm run check -w @codemonster-ru/ui-vue`.
- For documentation changes, run `npm run check:docs` and `npm run lint:md`. If runnable examples
  changed, build the packages and run `npm run check:docs:examples`.
- For changes to shared contracts, configuration, or the lockfile, run `npm run verify`.
- For visual or interaction changes, try the affected states in the Vue and Vanilla showcases
  where applicable. Include the browser, theme, and viewport in your evidence. For intentional
  visual changes, capture before and after. The
  [visual CI job](./.github/workflows/ci.yml) compares Vue and Vanilla rendering and behavior.

Describe the problem, the change, and the checks you ran when opening a pull request. Release
verification follows the [release checklist](./docs/release-checklist.md).

Use a concise English commit subject in the imperative mood and sentence case.
Follow the [CodeMonster commit style](https://github.com/codemonster-ru/.github/blob/main/COMMIT_STYLE.md).
