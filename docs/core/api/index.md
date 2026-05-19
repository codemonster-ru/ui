---
title: "API"
description: "Public API reference for the core package"
slug: "/vueforge/core/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-core`.

## Plugin

- `default` / `VueForgeCore` / `createVueForgeCore`: install VueForge Core components.
- `VfThemeProvider`: provider component for theme context.

```ts
import VueForgeCore from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

app.use(VueForgeCore);
```

## Components

- `VfAccordion`, `VfAlert`, `VfBadge`, `VfBreadcrumbs`, `VfButton`, `VfCard`, `VfCheckbox`, `VfCommandPalette`, `VfDialog`, `VfDivider`, `VfDrawer`, `VfDropdown`, `VfIconButton`, `VfInput`, `VfLink`, `VfMenuBar`, `VfNavMenu`, `VfPanel`, `VfPopover`, `VfRadio`, `VfSelect`, `VfSwitch`, `VfTable`, `VfTableOfContents`, `VfTabs`, `VfTag`, `VfTextarea`, `VfThemeSwitch`, `VfTooltip`.

## Composables

- `useClickOutside`, `useDisclosure`, `useEscapeKey`, `useFloating`, `useFocusTrap`, `useId`, `useTableOfContents`, `useTheme`.

## Foundation Helpers

- `vfBreakpoints`, `toMaxWidthQuery`, `toMinWidthQuery`, `useBreakpoint`, `useBreakpoints`, `useBreakpointValue`, `useScrollLock`.

## Theme Helpers

- `createThemePreset`, `defaultThemePreset`.

## Usage Example

```ts
import { useBreakpointValue } from '@codemonster-ru/vueforge-core';

const size = useBreakpointValue({
  base: 'sm',
  md: 'md',
  lg: 'lg'
});
```

## Types

- Components: `VfBadgeTone`, `VfBreadcrumbItem`, `VfButtonVariant`, `VfControlSize`, `VfDialogSize`, `VfDrawerPlacement`, `VfDrawerSize`, `VfDividerOrientation`, `VfDropdownPlacement`, `VfFeedbackTone`, `VfLinkTone`, `VfNavMenuItem`, `VfSelectOption`, `VfTabItem`, `VfTableOfContentsItem`, `VfTooltipPlacement`.
- Theme: `VfResolvedTheme`, `VfThemeConfig`, `VfThemeContext`, `VfThemeMode`, `VfThemePreset`, `VfThemePresetOptions`, `VfThemeProviderProps`, `VfThemeTokens`, `VfVueForgeOptions`.
- Foundation: `UseBreakpointOptions`, `UseScrollLockOptions`, `VfBreakpointName`, `VfBreakpointValue`, `VfBreakpointValues`.

## CSS Exports

- `@codemonster-ru/vueforge-core/styles.css`
- `@codemonster-ru/vueforge-core/tokens.css`
- `@codemonster-ru/vueforge-core/theme.css`
- `@codemonster-ru/vueforge-core/foundation.css`
