# Vue floating position recipe

Import `useFloating` from `@codemonster-ru/ui-vue/historical` for a panel that your application
positions beside an anchor. Pass refs for both elements. The returned `styles` contains `left`
and `top`. Set the panel's CSS `position` to the same strategy you pass to the composable.

```vue
<script setup lang="ts">
import { offset } from '@codemonster-ru/floater.js';
import { shallowRef } from 'vue';
import { useFloating } from '@codemonster-ru/ui-vue/historical';

const anchor = shallowRef<HTMLElement | null>(null);
const panel = shallowRef<HTMLElement | null>(null);
const { styles } = useFloating(anchor, panel, {
  placement: 'bottom-start',
  strategy: 'fixed',
  middleware: [offset(8)],
});
</script>

<template>
  <span ref="anchor">Shipping estimate</span>
  <div ref="panel" :style="[{ position: 'fixed' }, styles]">Calculated at checkout</div>
</template>
```

`enabled`, `placement`, `middleware`, and `strategy` accept values, refs, or getters. The returned
`placement` reflects middleware decisions such as flipping, and `middlewareData` holds the data
returned by Floater. Server output starts at `0px` on each axis. Measurement and automatic updates
start after mount when both elements are present.

Call `update()` to measure after an application-driven layout change or while automatic updates
are disabled. `cleanup()` stops the current observation. Changing a target or option can start it
again. Unmounting releases the observation and discards pending measurements. The host owns the
panel's visibility, dismissal, and focus behavior.
