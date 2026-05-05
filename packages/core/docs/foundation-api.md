# VueForge Foundation API

This document describes the foundation layer exposed by `@codemonster-ru/vueforge-core`.

## Purpose

The foundation layer exists so packages such as `vueforge-layouts` can depend on stable platform helpers without importing the entire UI surface area.

Use foundation when you need:

- breakpoint constants
- media-query helpers
- responsive composables
- generic scroll-lock behavior
- token-only or foundation-only CSS entry points

## Entry Points

- `@codemonster-ru/vueforge-core/foundation`
- `@codemonster-ru/vueforge-core/tokens.css`
- `@codemonster-ru/vueforge-core/foundation.css`

## JavaScript API

```ts
import {
  vfBreakpoints,
  toMinWidthQuery,
  toMaxWidthQuery,
  useBreakpoint,
  useBreakpoints,
  useBreakpointValue,
  useScrollLock,
} from '@codemonster-ru/vueforge-core/foundation';
```

### `vfBreakpoints`

Canonical breakpoint map:

- `xs`: `480`
- `sm`: `640`
- `md`: `768`
- `lg`: `1024`
- `xl`: `1280`
- `2xl`: `1536`

### `toMinWidthQuery`

```ts
toMinWidthQuery(vfBreakpoints.md);
// -> "(min-width: 768px)"
```

### `toMaxWidthQuery`

```ts
toMaxWidthQuery(vfBreakpoints.md);
// -> "(max-width: 767.98px)"
```

### `useBreakpoint`

```ts
const isLgUp = useBreakpoint('lg');
const isMdDown = useBreakpoint('md', { direction: 'max' });
```

### `useBreakpoints`

```ts
const breakpoints = useBreakpoints();

breakpoints.value.md;
breakpoints.value.xl;
```

### `useBreakpointValue`

```ts
const columns = useBreakpointValue({
  base: 1,
  md: 2,
  lg: 3,
});
```

### `useScrollLock`

```ts
const open = ref(false);

useScrollLock(open);
```

This is generic and can be reused by overlays or layout-level primitives.

## CSS API

### `tokens.css`

Contains canonical design tokens only:

- colors
- semantic colors
- spacing
- radius
- typography tokens
- breakpoint tokens
- sizing tokens

No component class rules live there.

### `foundation.css`

Currently includes:

- `tokens.css`
- `theme.css`

This is the narrow CSS entry point for packages that need token and theme baseline without full component styles.

## Stability

Stable foundation API for `1.0.0`:

- `vfBreakpoints`
- `toMinWidthQuery`
- `toMaxWidthQuery`
- `useBreakpoint`
- `useBreakpoints`
- `useBreakpointValue`
- `useScrollLock`
- `tokens.css`
- `foundation.css`

Layout primitives such as grids, stacks, shells, containers, or sidebar state are intentionally out of scope for this layer.
