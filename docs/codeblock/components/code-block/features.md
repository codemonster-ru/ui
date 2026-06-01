# Features

Standalone code block component with optional header, line numbers, copy action, and theme-aware rendering.

## Import

Import statement for this component.

```ts
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';
```

## Basic

Basic usage example.

````playground-src
mode: component
framework: vue
height: 320
entry: /App.vue

```vue file=/App.vue
<template>
  <VfCodeBlock
    language="ts"
    filename="math.ts"
    :code="code"
    :theme="theme"
    show-line-numbers
    copyable
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { VfCodeBlock } from '@codemonster-ru/vueforge-codeblock/view';

const theme = ref('light');
let observer = null;

const syncTheme = () => {
  const htmlTheme = document.documentElement.getAttribute('data-theme');
  const vfTheme = document.documentElement.getAttribute('data-vf-theme');
  theme.value = htmlTheme === 'dark' || vfTheme === 'dark' ? 'dark' : 'light';
};

onMounted(() => {
  syncTheme();

  if (typeof MutationObserver === 'undefined') {
    return;
  }

  observer = new MutationObserver(syncTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme', 'data-vf-theme']
  });
});

onBeforeUnmount(() => {
  observer?.disconnect();
  observer = null;
});

const code = `type User = {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
};

const hasAccess = (user: User, requiredRole: User['role']) => {
  const order = ['viewer', 'editor', 'admin'] as const;
  return order.indexOf(user.role) >= order.indexOf(requiredRole);
};

export const formatGreeting = (user: User) => {
  const prefix = hasAccess(user, 'editor') ? 'Welcome back' : 'Hello';
  return prefix + ', ' + user.name;
};`;
</script>
```
````

## Notes

Additional implementation notes and caveats:

- When `theme="inherit"`, component tracks nearest `data-theme` / `data-vf-theme`.
- Highlighting is async; plain-code fallback is rendered first for responsiveness.
- `ready` is emitted once after the first finalized render attempt (highlight or fallback), so loading gates can always unlock.
- Effective language allowlist is resolved as `props.allowedLanguages ?? plugin.allowedLanguages ?? SUPPORTED_CODE_BLOCK_LANGUAGES`.
- If language is outside allowlist, component uses `languageFallback` (`plaintext` by default) and stays runtime-safe.

## Controlled Languages

Limit supported grammars to reduce consumer bundle impact.

```ts
import VueForgeCodeBlock from '@codemonster-ru/vueforge-codeblock/view';

app.use(VueForgeCodeBlock, {
  allowedLanguages: ['ts', 'vue', 'json'],
  preloadLanguages: ['ts'],
});
```

## Accessibility

Accessibility behavior and keyboard interactions.

### Screen Reader

The following items are listed in this section:

- Code block should expose readable code text and language/context metadata when available.
- Copy and action controls must have explicit accessible names (for example, “Copy code”).
- Keep decorative visuals (line highlights, icons) hidden from assistive tech unless they convey unique meaning.

### Keyboard Support

Keyboard interaction follows native semantics of the rendered element or composite widget.

| Key | Function |
| --- | --- |
| `Tab` | Moves focus to interactive controls (copy button, toggles) when present. |
| `Shift + Tab` | Moves focus backward through interactive controls. |
| `Enter` | Activates focused action control. |
| `Space` | Activates focused action control. |
