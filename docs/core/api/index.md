---
title: "API"
description: "Package-level API reference for the core package"
order: 3
---

# Package API

Package-level exports and integration surface of `@codemonster-ru/vueforge-core`.


## Overview

This page covers package integration APIs and shared utilities. Component-specific contracts live in each component API tab.

## Plugin

The following items are listed in this section:

- `default` / `VueForgeCore` / `createVueForgeCore`: install VueForge Core components.
- `VfThemeProvider`: provider component for theme context.

```ts
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/base.css';
import '@codemonster-ru/vueforge-core/tokens.css';
import '@codemonster-ru/vueforge-core/theme.css';

app.use(VueForgeCore);
```

## Components

VueForge Core exports a full component set (inputs, navigation, overlays, feedback, layout primitives). Use per-component docs for exact props/events/slots.

Feedback indicators include:

- `VfAlert`
- `VfAvatar`
- `VfBadge`
- `VfProgressBar`
- `VfProgressSpinner`
- `VfSkeleton`
- `VfSkeletonGate`
- `VfTag`

## Composables

The following items are listed in this section:

- `useClickOutside`
- `useDisclosure`
- `useEscapeKey`
- `useFloating`
- `useFocusTrap`
- `useId`
- `useTableOfContents`
- `useTheme`

## Foundation Helpers

The following items are listed in this section:

- `vfBreakpoints`
- `toMaxWidthQuery`
- `toMinWidthQuery`
- `useBreakpoint`
- `useBreakpoints`
- `useBreakpointValue`
- `useScrollLock`

## Theme Helpers

The following items are listed in this section:

- `createThemePreset`
- `defaultThemePreset`

## Usage Example

The code snippet below illustrates this section.

```ts
import { useBreakpointValue } from '@codemonster-ru/vueforge-core';

const size = useBreakpointValue({
  base: 'sm',
  md: 'md',
  lg: 'lg'
});
```

## Types

The following items are listed in this section:

- Component types: component contracts and option unions used by UI primitives.
- Theme type: `VfResolvedTheme`.
- Theme type: `VfThemeConfig`.
- Theme type: `VfThemeContext`.
- Theme type: `VfThemeMode`.
- Theme type: `VfThemePreset`.
- Theme type: `VfThemePresetOptions`.
- Theme type: `VfThemeProviderProps`.
- Theme type: `VfThemeTokens`.
- Theme type: `VfVueForgeOptions`.
- Foundation type: `UseBreakpointOptions`.
- Foundation type: `UseScrollLockOptions`.
- Foundation type: `VfBreakpointName`.
- Foundation type: `VfBreakpointValue`.
- Foundation type: `VfBreakpointValues`.

## CSS Exports

The following items are listed in this section:

- `@codemonster-ru/vueforge-core/base.css`
- `@codemonster-ru/vueforge-core/tokens.css`
- `@codemonster-ru/vueforge-core/theme.css`
- `@codemonster-ru/vueforge-core/foundation.css`
- Per-component CSS entries (for example `@codemonster-ru/vueforge-core/button.css`, `@codemonster-ru/vueforge-core/dialog.css`).
- Progress CSS entries: `@codemonster-ru/vueforge-core/progress-bar.css`, `@codemonster-ru/vueforge-core/progress-spinner.css`.
