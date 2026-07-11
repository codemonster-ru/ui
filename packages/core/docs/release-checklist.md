# VueForge Core Release Checklist

## Package

- `npm run lint`
- `npm run test`
- `npm run build`
- Verify exported API from [src/index.ts](../src/index.ts)
- Verify `package.json` `exports`, `types`, and `sideEffects`

## Visual

- Review the demo page with `npm run dev`
- Check both `light` and `dark`
- Check component states:
  - default
  - hover
  - focus
  - disabled
  - invalid
  - open
  - selected

## Accessibility

- Keyboard pass for:
  - `VfDialog`
  - `VfDropdown`
  - `VfPopover`
  - `VfTooltip`
  - `VfTabs`
  - `VfAccordion`
- Verify focus order and visible focus state
- Verify base ARIA attributes are present

## Theme

- Verify `app.use(VueForgeCore)` works with the built-in default preset
- Verify `app.use(VueForgeCore, { theme: { extend: ... } })` overrides tokens correctly
- Verify `VfThemeProvider` works with `light`, `dark`, and `system`
- Verify `storageKey` and `attribute` overrides still work

## Foundation

- Verify `@codemonster-ru/vueforge-core/foundation` exports are stable
- Verify `@codemonster-ru/vueforge-core/tokens.css` can be imported on its own
- Verify `@codemonster-ru/vueforge-core/foundation.css` resolves correctly
- Verify breakpoint helpers and `useScrollLock` tests are green

## Docs

- Review [README.md](../README.md)
- Review [foundation-api.md](./foundation-api.md)
- Review [theme-api.md](./theme-api.md)
- Review [visual-baseline.md](./visual-baseline.md)
- Update [CHANGELOG.md](../CHANGELOG.md)

## Release Decision

- Use a minor release for a new public component or theme-token surface.
- Use a patch release for fixes that do not add public API.
- Use a prerelease only when the API or visual baseline is intentionally unstable.

## Publish Flow

- First release note:
  - publish `1.0.0` manually from your machine
  - create and configure the npm Trusted Publisher for this repository
  - after that, tag-based releases can publish automatically from GitHub Actions
- Update `package.json` version
- Add matching section to [CHANGELOG.md](../CHANGELOG.md)
- Create and push the scoped package tag, for example `@codemonster-ru/vueforge-core@1.31.0`.
- GitHub Actions will:
  - validate that the tag version matches `package.json`
  - run `lint`, `test`, and `build`
  - publish the package to npm through Trusted Publisher
  - create a GitHub Release from the matching changelog section
