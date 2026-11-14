<script setup lang="ts">
import { showcaseCaseVariants } from '../../shared/showcase-matrices.mts';

defineProps<{ slug: string }>();

interface Example {
  id: string;
  description?: string;
}

const cases = Object.entries(
  import.meta.glob<Example>('../../../contracts/*/cases/*.case.json', { eager: true, import: 'default' }),
).flatMap(([path, example]) => {
  const slug = path.split('/').at(-3) ?? '';
  const basename = example.id.slice(slug.length + 1);
  return [
    { ...example, slug, basename, query: `case=${example.id}` },
    ...showcaseCaseVariants(slug, basename).map(({ label, prop, value }) => ({
      ...example,
      slug,
      id: example.id + '--' + label.replaceAll(' ', '-'),
      basename: basename + ' · ' + label,
      query: new URLSearchParams({ case: example.id, [prop]: value }).toString(),
    })),
  ];
});
</script>

<template>
  <details class="showcase-contracts">
    <summary>Contract examples</summary>
    <article v-for="example in cases.filter((example) => example.slug === slug)" :key="example.id">
      <h4>{{ example.basename.replaceAll('-', ' ') }}</h4>
      <p v-if="example.description">{{ example.description }}</p>
      <iframe :title="example.id" loading="lazy" :src="`/case.html?${example.query}`" />
    </article>
  </details>
</template>
