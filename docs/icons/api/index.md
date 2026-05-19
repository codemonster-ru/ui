---
title: "API"
description: "Public API reference for the icons package"
slug: "/vueforge/icons/api"
order: 3
---

# API

## Overview

Public API surface of `@codemonster-ru/vueforge-icons`.

## Component

- `VueIconify`: base icon component.

Key props:

- `icon?: IconName | string`
- `size?: number | string`
- `spin?: boolean`
- `inset?: number`
- `style?: 'solid'`

```ts
import { VueIconify } from '@codemonster-ru/vueforge-icons';
```

## Metadata Exports

- `iconGroups`
- `iconNames`
- `icons`
- `iconCatalog`
- `coreIconNames`
- `dualStyleCoreIconNames`
- `showcaseIconEntries`

## Usage Example

```ts
import { iconNames, iconCatalog } from '@codemonster-ru/vueforge-icons';

const available = iconNames;
const grouped = iconCatalog;
```

## Types

- `IconName`
- `IconCatalogEntry`
- `IconShowcaseEntry`
