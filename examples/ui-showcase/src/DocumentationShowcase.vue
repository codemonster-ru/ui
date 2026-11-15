<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { mountGuideCopy } from '../../shared/showcase-guide-copy.js';
import '../../shared/showcase-guides.css';

const guide = ref<{ title: string; html: string }>();
const content = ref<HTMLElement | null>(null);
const error = ref<'missing' | 'unavailable'>();

onMounted(async () => {
  const path = `${location.pathname.replace(/\/$/u, '')}/`;
  try {
    const response = await fetch(`/docs-content${path}index.json`, { headers: { Accept: 'application/json' } });
    if (response.status === 404) {
      error.value = 'missing';
      document.title = 'Guide not found · CodeMonster UI Vue';
      return;
    }
    if (!response.ok) throw new Error(`Guide request failed with HTTP ${response.status}.`);
    guide.value = (await response.json()) as { title: string; html: string };
  } catch {
    error.value = 'unavailable';
    return;
  }

  document.title = `${guide.value.title} · CodeMonster UI Vue`;
  await nextTick();
  if (!content.value) return;
  mountGuideCopy(content.value);
  if (location.hash.length > 1) {
    const target = [...content.value.querySelectorAll<HTMLElement>('[id]')].find(
      (element) => `#${encodeURIComponent(element.id)}` === location.hash,
    );
    target?.scrollIntoView();
    target?.focus({ preventScroll: true });
  }
});
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- Compiled from checked-in Markdown with raw HTML disabled. -->
  <div v-if="guide" ref="content" v-html="guide.html" />
  <section v-else-if="error" class="showcase-intro">
    <h1>{{ error === 'missing' ? 'Guide not found' : 'Could not load the guide' }}</h1>
    <p><a href="/docs/">Browse documentation</a></p>
  </section>
  <p v-else role="status">Loading guide…</p>
</template>
