# Vue breakpoint composables

Import `useBreakpoint`, `useBreakpoints`, and `useBreakpointValue` from
`@codemonster-ru/ui-vue/historical`. For viewport-driven behavior, pass a breakpoint name or a
pixel number to `useBreakpoint`. The default query is inclusive at the minimum width. Pass
`{ direction: 'max' }` for the range below that breakpoint. It ends 0.02 px short of the named
value to preserve the historical fractional boundary.

```vue
<script setup lang="ts">
import { useBreakpoint, useBreakpointValue } from '@codemonster-ru/ui-vue/historical';

const wide = useBreakpoint('lg');
const columns = useBreakpointValue({ base: 1, sm: 2, xl: 4 });
</script>

<template>
  <p>{{ columns }} columns{{ wide ? ' with more room for labels' : '' }}</p>
</template>
```

`useBreakpoints()` returns the min-width matches for `xs`, `sm`, `md`, `lg`, `xl`, and `2xl`.
The values come from the shared token registry. `useBreakpointValue` selects the largest matching
override that's present, or the required `base`. A ref or getter can supply a changing name or
pixel number to `useBreakpoint`, or changing values to `useBreakpointValue`.

Server rendering starts with all matches false, so the responsive value starts at `base`.
The browser reads the mounted component's viewport and releases its listeners on unmount.
These helpers use viewport media queries and the registry's numeric thresholds. Use CSS media
queries for layout styling. To read CSS custom property overrides from Vue, use
`useCssVarBreakpoints()` from `@codemonster-ru/ui-layouts`.
