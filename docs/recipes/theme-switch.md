# Theme switch recipe

Use this maintained recipe when migrating `VfThemeSwitch` and `VfThemeProvider`. CodeMonster UI
provides the control presentation, tokens, and theme selectors; the application owns the preference
model, persistence, system-theme policy, initial SSR attribute, and every mutation of that state.

The example below intentionally chooses a two-state `light`/`dark` policy stored in local storage.
An application that supports `system` mode, accounts, cookies, or tenant defaults should change the
controller, not add those policies to `CmButton`.

## Vue recipe

The server renders the same neutral initial button content for hydration. A small bootstrap script
should set `data-cm-theme` before the stylesheets load; the component then reads the resolved attribute
after mount and owns subsequent changes.

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { CmButton } from '@codemonster-ru/ui-vue';

type Theme = 'light' | 'dark';

const storageKey = 'app-theme';
const theme = ref<Theme>('light');
const nextTheme = computed<Theme>(() => (theme.value === 'dark' ? 'light' : 'dark'));
const actionLabel = computed(() => `Switch to ${nextTheme.value} theme`);

onMounted(() => {
  theme.value = document.documentElement.getAttribute('data-cm-theme') === 'dark' ? 'dark' : 'light';
});

function setTheme(value: Theme): void {
  theme.value = value;
  document.documentElement.setAttribute('data-cm-theme', value);
  window.localStorage.setItem(storageKey, value);
}
</script>

<template>
  <CmButton type="button" variant="secondary" :aria-label="actionLabel" @click="setTheme(nextTheme)">
    <span aria-hidden="true">{{ theme === 'dark' ? '☾' : '☀' }}</span>
    Theme
  </CmButton>
</template>
```

Run an application-owned bootstrap before the CSS links and Vue entry. It resolves the initial
preference without waiting for hydration:

```ts file=/theme-bootstrap.ts
type Theme = 'light' | 'dark';

export {};

const storageKey = 'app-theme';
const stored = window.localStorage.getItem(storageKey);
const theme: Theme = stored === 'dark' ? 'dark' : 'light';

document.documentElement.setAttribute('data-cm-theme', theme);
```

If the product supports a `system` preference, store `system` as the preference but write the
resolved `light` or `dark` value to `data-cm-theme`. Listen to `matchMedia` only while that preference
is active. This distinction prevents a system change from overwriting an explicit user choice.

## Vanilla HTML

Compose the same layout using the canonical markup for [theme-switch](../../contracts/theme-switch/cases/default.html).
Load styles and initialize interactive components as described in the [Vanilla guide](../vanilla.md).

## Ownership and accessibility

- `CmButton` owns only native button semantics and visual states. It does not read storage, inspect
  `prefers-color-scheme`, mutate the document root, or synchronize tabs.
- The accessible name describes the next action, not merely the current icon. Decorative sun/moon
  glyphs remain hidden from assistive technology.
- Apply the initial theme before first paint where possible. For strict CSP, serve a nonce- or
  hash-approved bootstrap rather than enabling unrestricted inline scripts.
- Broadcast preference changes only if the product requires cross-tab synchronization, and detach
  any listeners with the owning application lifecycle.
- A theme preview that must not persist should use separate temporary state and restore the committed
  preference on cancel.
