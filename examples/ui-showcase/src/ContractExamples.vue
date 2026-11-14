<script setup lang="ts">
import { showcaseCaseVariants } from '../../shared/showcase-matrices.mts';

import { renderCoreMatrix } from '../../shared/showcase-core-matrix.mts';
const props = defineProps<{ slug: string }>();
const core = /^\/(?:core\/?|$)/u.test(location.pathname);
const sources = import.meta.glob<string>('../../../contracts/*/cases/*.html', {
  eager: true,
  query: '?raw',
  import: 'default',
});
const matrix = core
  ? renderCoreMatrix(
      props.slug,
      (id) => {
        const basename = id.slice(props.slug.length + 1);
        return sources[`../../../contracts/${props.slug}/cases/${basename}.html`];
      },
      new URL('../../vanilla/avatar.png', import.meta.url).href,
    )
  : '';

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
  <!-- eslint-disable-next-line vue/no-v-html -- Repository-owned component contracts. -->
  <div v-if="matrix" data-core-matrix v-html="matrix" />
  <details class="showcase-contracts">
    <summary>Contract examples</summary>
    <div class="showcase-variants">
      <article v-for="example in cases.filter((example) => example.slug === slug)" :key="example.id">
        <h4>{{ example.basename.replaceAll('-', ' ') }}</h4>
        <p v-if="example.description">{{ example.description }}</p>
        <iframe :title="example.id" loading="lazy" :src="`/case.html?${example.query}`" />
      </article>
    </div>
  </details>
</template>
