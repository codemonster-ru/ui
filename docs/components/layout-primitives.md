# Layout primitives

Container, Stack, Inline, Section, and Grid provide a small responsive layout vocabulary with the
same significant DOM in Vue and Annabel Razor. They only own layout and surface styling: landmarks,
headings, lists, navigation, and application-shell behavior remain explicit application choices.

Load the token and complete component stylesheets described in the [Button guide](./button.md).
Individual styles are also available through the `container.css`, `stack.css`, `inline.css`,
`section.css`, and `grid.css` npm subpath exports. No JavaScript runtime is required.

## Vue

```vue
<script setup lang="ts">
import { CmContainer, CmGrid, CmInline, CmSection, CmStack } from '@codemonster-ru/ui-vue';
</script>

<template>
  <CmContainer element="main" size="xl">
    <CmStack>
      <CmInline element="nav" aria-label="Project actions">
        <a href="/projects">Projects</a>
        <button type="button">Create project</button>
      </CmInline>
      <CmSection surface>
        <h1>Projects</h1>
        <CmGrid element="ul">
          <li>Atlas</li>
          <li>Nova</li>
        </CmGrid>
      </CmSection>
    </CmStack>
  </CmContainer>
</template>
```

## Annabel Razor

```razor
<cm-container element="main" size="xl">
  <cm-stack>
    <cm-inline element="nav" aria-label="Project actions">
      <a href="/projects">Projects</a>
      <button type="button">Create project</button>
    </cm-inline>
    <cm-section :surface="true">
      <h1>Projects</h1>
      <cm-grid element="ul">
        <li>Atlas</li>
        <li>Nova</li>
      </cm-grid>
    </cm-section>
  </cm-stack>
</cm-container>
```

Default slots are required and compose through each adapter's trusted rendered-markup boundary.
Ordinary interpolated values inside those slots remain escaped by Vue or Razor.

## Contracts and semantics

- Container defaults to `div`; choose `main` or `section` only when that landmark is correct. Its
  optional `size` is `md`, `lg`, `xl`, or `2xl`. `fluid` removes the maximum inline-size and takes
  precedence over `size`.
- Stack creates vertical flow. It can render `div`, `section`, `ul`, or `ol`.
- Inline creates wrapping horizontal flow with centered cross-axis alignment. It can render `div`,
  `nav`, or `ul`; set `wrap` to false only when overflow is handled by the composed content.
- Section defaults to a native `section` and can render `div`, `article`, or `aside`. `surface` adds
  the shared border, background, radius, and shadow treatment.
- Grid creates an auto-fitting responsive grid. It can render `div`, `section`, `ul`, or `ol`.
- Consumer attributes and classes are forwarded to the root. Element choices are finite so neither
  adapter can interpolate an arbitrary tag name.

Layout primitives do not add accessible names or repair document hierarchy. Give `nav` landmarks
an accessible name when more than one is present, keep heading levels meaningful, and use list
elements only when their children are valid list items.
