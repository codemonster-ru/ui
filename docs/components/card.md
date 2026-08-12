# Card

`Card` groups related content on one shared surface. It is structural rather than interactive: put
buttons and links inside it instead of attaching click behavior to the complete card.

Load the same token and complete component stylesheets described in the [Button guide](./button.md).
Card styles are included in `styles.css` and available separately from the npm
`@codemonster-ru/ui-css/card.css` export.

## Props

| Prop      | Values                      | Default   | Behavior                                                |
| --------- | --------------------------- | --------- | ------------------------------------------------------- |
| `element` | `section`, `article`, `div` | `section` | Selects one approved semantic root.                     |
| `title`   | string or `null`            | `null`    | Fallback `h3` used only without a custom header slot.   |
| `compact` | boolean                     | `false`   | Uses compact shared surface padding and region spacing. |

Unknown safe attributes reach the root and consumer classes merge with `cm-card`. Invalid semantic
roots are diagnosed; adapters never render an arbitrary tag or component from template data.

## Regions

Card renders present regions in the stable order `header`, `default`, `footer`:

- `header` is wrapped by `.cm-card__header` and takes precedence over `title`;
- a fallback `title` renders as `h3.cm-card__title`;
- default content is wrapped by `.cm-card__body`;
- `footer` is wrapped by `.cm-card__footer`;
- absent regions and wrappers are omitted.

Choose custom heading levels based on the page hierarchy. Card adds no role, keyboard behavior, or
ARIA state; interactive descendants retain their native semantics.

## Vue

```vue
<script setup lang="ts">
import { CmButton, CmCard } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmCard element="article" compact data-testid="project-card">
    <template #header><h2>Project</h2></template>

    <p>Deployment is ready.</p>

    <template #footer>
      <CmButton>Deploy</CmButton>
    </template>
  </CmCard>
</template>
```

Use the `title` prop for a simple fallback heading:

```vue
<CmCard title="Project"><p>Deployment is ready.</p></CmCard>
```

## Annabel Razor

`UiComponentProvider` registers `<cm-card>` alongside `<cm-button>`. Named slots are direct
`<razor-slot>` children:

```razor
<cm-card element="article" compact data-testid="project-card">
    <razor-slot name="header"><h2>{{ $project->name }}</h2></razor-slot>

    <p>{{ $project->summary }}</p>

    <razor-slot name="footer">
        <cm-button :disabled="$project->locked">Deploy</cm-button>
    </razor-slot>
</cm-card>
```

Cards and other registered components may be nested in any slot. Ordinary expressions remain
escaped at their originating template boundary; nested component output composes through
`RenderedHtml` without double escaping. Do not turn untrusted strings into `RenderedHtml`.

For a simple fallback heading:

```razor
<cm-card :title="$project->name"><p>{{ $project->summary }}</p></cm-card>
```
