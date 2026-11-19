<script setup lang="ts">
import { CmRuntime, createCmTabsController } from '@codemonster-ru/ui-runtime';
import { onMounted, onUnmounted, ref } from 'vue';

import groups from '../../shared/showcase-groups.json';
import { showcaseCaseVariants } from '../../shared/showcase-matrices.mts';
import { mountComponentReference } from '../../shared/showcase-component-reference.js';
import {
  escapeReference,
  primaryReferenceCase,
  referenceCaseDescription,
  referenceCatalog,
  referenceFrameClass,
  referenceSupplements,
  renderReferenceDetail,
  renderReferenceMissing,
  renderReferenceSupplement,
  type ReferenceCase,
  type ReferenceComponent,
} from '../../shared/showcase-component-reference.mts';
import '../../shared/showcase-component-reference.css';

const root = ref<HTMLElement>();
const manifests = import.meta.glob<ReferenceComponent>('../../../contracts/*/manifest.json', {
  eager: true,
  import: 'default',
});
const caseModules = import.meta.glob<ReferenceCase>('../../../contracts/*/cases/*.case.json', {
  eager: true,
  import: 'default',
});
const canonical = import.meta.glob<string>('../../../contracts/*/cases/*.html', {
  eager: true,
  import: 'default',
  query: '?raw',
});
const components = new Map(Object.values(manifests).map((manifest) => [manifest.slug, manifest]));
const catalog = referenceCatalog(groups, components);
const slug = location.pathname.split('/')[2];
const component = components.get(slug);
const supplement = referenceSupplements.find((entry) => entry.slug === slug);

function preview(example: ReferenceCase, primary: boolean, option?: { label: string; prop: string; value: string }) {
  const basename = example.id.slice(slug.length + 1).replaceAll('-', ' ');
  const title = option ? `${basename} · ${option.label}` : basename;
  const description = !option && referenceCaseDescription(example);
  const query = new URLSearchParams({
    case: example.id,
    ...(option ? { [option.prop]: option.value } : {}),
  });
  return `<article class="reference-example">
    ${primary ? '' : `<h3>${escapeReference(title)}</h3>`}
    ${description ? `<p>${escapeReference(description)}</p>` : ''}
    <iframe class="reference-frame${referenceFrameClass(slug)}" src="/case.html?${escapeReference(query.toString())}" title="${escapeReference(`Vue ${component?.name} · ${title} preview`)}"${primary ? '' : ' loading="lazy"'}></iframe>
  </article>`;
}

function markup() {
  if (supplement) return renderReferenceSupplement(supplement, catalog, '');
  if (!component) return renderReferenceMissing('');
  const cases = Object.entries(caseModules)
    .filter(([path]) => path.includes(`/contracts/${slug}/cases/`))
    .map(([path, example]) => ({ ...example, canonicalHtml: canonical[path.replace('.case.json', '.html')] }));
  const example = primaryReferenceCase(slug, cases);
  if (!example) return renderReferenceMissing('');
  const variants = cases.flatMap((entry) => [
    ...(entry.id !== example.id ? [preview(entry, false)] : []),
    ...showcaseCaseVariants(slug, entry.id.slice(slug.length + 1)).map((option) => preview(entry, false, option)),
  ]);
  return renderReferenceDetail({
    component,
    example,
    preview: preview(example, true),
    variants: variants.join(''),
    catalog,
    base: '',
  });
}

const content = markup();
const runtime = new CmRuntime().register('tabs', createCmTabsController);
if (component || supplement) document.title = `${component?.name ?? supplement?.name} · CodeMonster UI Vue`;
onMounted(() => {
  if (root.value) mountComponentReference(root.value, runtime);
});
onUnmounted(() => runtime.stop());
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- The renderer escapes repository-owned example strings and source code. -->
  <div ref="root" v-html="content" />
</template>
