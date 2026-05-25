---
title: "API"
description: "Public API reference for the icons package"
order: 3
---

# API

This section provides a quick overview before the detailed subsections below.


## Overview

Public API surface of `@codemonster-ru/vueforge-icons`.

## Component

The following items are listed in this section:

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

The following items are listed in this section:

- `iconGroups`
- `iconNames`
- `icons`
- `iconCatalog`
- `coreIconNames`
- `dualStyleCoreIconNames`
- `showcaseIconEntries`

## Usage Example

The code snippet below illustrates this section.

```ts
import { iconNames, iconCatalog } from '@codemonster-ru/vueforge-icons';

const available = iconNames;
const grouped = iconCatalog;
```

## Types

The following items are listed in this section:

- `IconName`
- `IconCatalogEntry`
- `IconShowcaseEntry`
