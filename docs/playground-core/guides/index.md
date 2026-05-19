---
title: "Guides"
description: "Limitations and related packages for the playground-core package"
slug: "/vueforge/playground-core/guides"
order: 5
---

# Guides

## Overview

Practical integration notes, limitations, and related packages for this package.


## Common Integration Patterns

### Re-run on File Changes with Debounce

When wiring to an editor, debounce `run()` calls after `updateFiles` to avoid excessive iframe reloads.

```ts
session.updateFiles(nextFiles, nextEntry);
window.clearTimeout(timer);
timer = window.setTimeout(() => {
  void session.run();
}, 120);
```

### Always Dispose Session on Unmount

`dispose()` is required to remove internal listeners and prevent leaks in long-lived docs pages.

```ts
onBeforeUnmount(() => {
  session?.dispose();
});
```

### Browser vs Remote Runtime Split

Use browser runtime for local docs demos; use remote runtime when isolation, sandboxing, or server-side execution is required.

```ts
const session = createPlaygroundSession({
  runtime: 'remote',
  files,
  entry,
  remoteExecutor
});
```

## Limitations

- Browser runtime requires an iframe.
- Remote runtime requires `remoteExecutor`.

## Related Packages

- `@codemonster-ru/vueforge-playground`
- `@codemonster-ru/vueforge-playground-vite-plugin`
