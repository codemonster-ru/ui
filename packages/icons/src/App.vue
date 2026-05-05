<template>
  <main class="showcase" :class="`showcase--${theme}`">
    <header class="showcase__topbar">
      <div class="showcase__brand">
        <p class="eyebrow">Local preview</p>
        <h1>VueIconify icons</h1>
        <p class="showcase__hint">Быстрый просмотр набора. Клик по карточке копирует сниппет.</p>
      </div>

      <button class="theme-toggle" type="button" @click="toggleTheme">
        <span class="theme-toggle__icon">
          <VueIconify :icon="theme === 'dark' ? icons.sun : icons.moon" :size="18" :inset="demoIconInset" />
        </span>
        <span>{{ theme === 'dark' ? 'Light theme' : 'Dark theme' }}</span>
      </button>
    </header>

    <section class="toolbar">
      <article class="panel panel--compact">
        <div class="panel__header">
          <div>
            <p class="eyebrow">Usage</p>
            <h2>{{ sortedShowcaseIconEntries.length }} icons</h2>
          </div>
          <button class="copy-button" type="button" @click="copySnippet(genericSnippet, 'generic')">
            {{ copyLabel('generic') }}
          </button>
        </div>
        <pre><code>{{ genericSnippet }}</code></pre>
      </article>
    </section>

    <section class="catalog">
      <article class="catalog-section">
        <header class="catalog-section__header">
          <p class="eyebrow">Core Icons</p>
          <h2>{{ nonBrandShowcaseIconEntries.length }} icons</h2>
        </header>
        <div class="catalog-groups">
          <article
            v-for="entry in nonBrandShowcaseIconEntries"
            :key="entry.icon"
            class="catalog-group catalog-group--tile"
          >
            <div class="catalog-group__header">
              <h3>{{ getDisplayIconName(entry.icon) }}</h3>
            </div>

            <button class="icon-card" type="button" @click="copySnippet(getIconSnippet(entry.icon), entry.icon)">
              <span class="icon-card__preview">
                <VueIconify :icon="getIconToken(entry.icon)" :size="44" :inset="getDemoIconInset(entry.icon)" />
              </span>
              <span class="icon-card__meta">{{ copyLabel(entry.icon) }}</span>
            </button>
          </article>
        </div>
      </article>

      <article v-if="brandShowcaseIconEntries.length > 0" class="catalog-section">
        <header class="catalog-section__header">
          <p class="eyebrow">Brand Icons</p>
          <h2>{{ brandShowcaseIconEntries.length }} icons</h2>
        </header>
        <div class="catalog-groups">
          <article
            v-for="entry in brandShowcaseIconEntries"
            :key="entry.icon"
            class="catalog-group catalog-group--tile"
          >
            <div class="catalog-group__header">
              <h3>{{ getDisplayIconName(entry.icon) }}</h3>
            </div>

            <button class="icon-card" type="button" @click="copySnippet(getIconSnippet(entry.icon), entry.icon)">
              <span class="icon-card__preview">
                <VueIconify :icon="getIconToken(entry.icon)" :size="44" :inset="getDemoIconInset(entry.icon)" />
              </span>
              <span class="icon-card__meta">{{ copyLabel(entry.icon) }}</span>
            </button>
          </article>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { VueIconify, icons } from '@/lib';
import { iconCatalog, showcaseIconEntries, type IconName } from '@/lib/iconMeta';

type CopyKey = 'generic' | string;
type Theme = 'light' | 'dark';

const copiedKey = ref<CopyKey | null>(null);
const theme = ref<Theme>('light');

const genericSnippet = `<VueIconify :icon="icons.arrowLeft" :size="24" />`;
const demoIconInset = 0.08;
const themeStorageKey = 'vueiconify-showcase-theme';
const withInset = (iconNames: IconName[], inset: number) => {
  return Object.fromEntries(iconNames.map((iconName) => [iconName, inset])) as Partial<Record<IconName, number>>;
};

const demoIconInsetOverrides: Partial<Record<IconName, number>> = {
  ...withInset(
    [
      'arrowLeft',
      'arrowLeftLong',
      'arrowRight',
      'arrowRightLong',
      'arrowUp',
      'arrowUpLong',
      'arrowDown',
      'arrowDownLong',
      'arrowTurnUpLeft',
      'arrowTurnUpRight',
      'arrowTurnRightUp',
      'arrowTurnLeftDown',
      'globe',
    ],
    0.01,
  ),
  ...withInset(['ban'], 0.01),
  ...withInset(['activity'], -0.02),

  ...withInset(['check', 'plus', 'sparkles', 'xmark'], 0.02),
  ...withInset(
    [
      'bars',
      'caretDown',
      'caretLeft',
      'caretRight',
      'caretUp',
      'chevronDown',
      'chevronLeft',
      'chevronRight',
      'chevronUp',
      'minus',
      'sort',
    ],
    0.03,
  ),
  ...withInset(['clock', 'externalLink', 'history', 'link', 'share', 'sliders', 'terminal'], 0.04),
  ...withInset(['cloud', 'key', 'layers'], 0.05),
  ...withInset(['hardDrive', 'star'], 0.06),
  ...withInset(['bell', 'building', 'chartBar', 'cpu', 'database', 'wallet'], 0.07),
  ...withInset(['bookmark', 'house'], 0.08),
  ...withInset(['file', 'fileText', 'folder', 'inbox', 'warning'], 0.09),
  ...withInset(['calendar', 'creditCard', 'folderOpen', 'user', 'userCheck', 'userMinus', 'userPlus', 'users'], 0.1),
  ...withInset(['archive', 'briefcase', 'mail', 'message'], 0.11),
  ...withInset(['checkCircle', 'infoCircle', 'questionCircle', 'xCircle'], 0.13),

  ...withInset(['moon', 'sun'], 0.07),
};
const sortedShowcaseIconEntries = computed(() => {
  return [...showcaseIconEntries].sort((left, right) => left.icon.localeCompare(right.icon));
});

const nonBrandShowcaseIconEntries = computed(() => {
  return sortedShowcaseIconEntries.value.filter((entry) => !iconCatalog[entry.icon]?.brand);
});

const brandShowcaseIconEntries = computed(() => {
  return sortedShowcaseIconEntries.value.filter((entry) => Boolean(iconCatalog[entry.icon]?.brand));
});

const toKebabCase = (iconName: string) => {
  return iconName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
};

const getIconToken = (iconName: IconName) => {
  return icons[iconName] ?? toKebabCase(iconName);
};

const getDemoIconInset = (iconName: IconName) => {
  return demoIconInsetOverrides[iconName] ?? demoIconInset;
};

const getIconSnippet = (iconName: string) => {
  return `<VueIconify :icon="icons.${iconName}" :size="24" />`;
};

const getDisplayIconName = (iconName: IconName) => {
  return toKebabCase(iconName);
};

const copyLabel = (key: CopyKey) => {
  return copiedKey.value === key ? 'Copied' : 'Copy';
};

const copySnippet = async (snippet: string, key: CopyKey) => {
  await navigator.clipboard.writeText(snippet);
  copiedKey.value = key;

  window.setTimeout(() => {
    if (copiedKey.value === key) {
      copiedKey.value = null;
    }
  }, 1200);
};

const applyTheme = (value: Theme) => {
  document.documentElement.dataset.vfTheme = value;
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

onMounted(() => {
  const storedTheme = window.localStorage.getItem(themeStorageKey);
  const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  theme.value = storedTheme === 'dark' || storedTheme === 'light' ? storedTheme : preferredTheme;
  applyTheme(theme.value);
});

watch(theme, (value) => {
  applyTheme(value);
  window.localStorage.setItem(themeStorageKey, value);
});
</script>

<style lang="scss" scoped>
:global(body) {
  margin: 0;
  background: var(--vf-color-bg);
  color: var(--vf-color-text);
  font-family: var(--vf-font-family-base);
}

:global(*) {
  box-sizing: border-box;
}

.showcase {
  width: min(var(--vf-breakpoint-2xl), calc(100% - (var(--vf-layout-container-padding) * 2)));
  margin: 0 auto;
  padding: var(--vf-layout-space-layout-base) 0 calc(var(--vf-layout-space-layout-base) * 2);
}

.showcase__topbar,
.panel__header,
.catalog-section__header,
.catalog-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--vf-surface-gap);
}

.showcase__topbar,
.toolbar,
.catalog {
  margin-bottom: var(--vf-surface-padding);
}

.showcase__brand,
.catalog,
.catalog-section,
.catalog-group--tile,
.icon-card {
  display: grid;
  gap: var(--vf-surface-gap);
}

.showcase__hint {
  margin: 0;
  color: var(--vf-color-muted);
  line-height: var(--vf-text-body-line-height);
}

.theme-toggle,
.copy-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--vf-button-gap);
  min-height: var(--vf-control-height-md);
  padding: var(--vf-button-padding-md);
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-control);
  background: var(--vf-color-surface-muted);
  color: var(--vf-color-text);
  font-size: var(--vf-control-font-size-md);
  font-weight: var(--vf-text-body-font-weight);
  line-height: var(--vf-text-body-line-height);
  cursor: pointer;
}

.icon-card {
  justify-items: center;
  width: 100%;
  min-height: 8rem;
  padding: var(--vf-surface-padding-compact);
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-surface);
  background: var(--vf-color-surface);
  color: var(--vf-color-text);
  cursor: pointer;
}

.theme-toggle:hover,
.copy-button:hover,
.icon-card:hover {
  border-color: var(--vf-color-primary);
  color: var(--vf-color-primary);
}

.theme-toggle:focus-visible,
.copy-button:focus-visible,
.icon-card:focus-visible {
  outline: none;
  border-color: var(--vf-color-primary);
  box-shadow: 0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring);
}

.theme-toggle__icon,
.icon-card__preview {
  display: grid;
  place-items: center;
  color: inherit;
}

.theme-toggle__icon {
  width: var(--vf-control-height-sm);
  height: var(--vf-control-height-sm);
}

.panel,
.catalog-group {
  padding: var(--vf-surface-padding);
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-surface);
  background: var(--vf-color-surface);
  color: var(--vf-color-text);
}

.panel--compact {
  max-width: 26rem;
}

.eyebrow {
  margin: 0;
  color: var(--vf-color-muted);
  font-size: var(--vf-text-label-font-size);
  font-weight: var(--vf-text-label-font-weight);
  line-height: var(--vf-text-label-line-height);
}

h1,
h2,
h3 {
  margin: 0;
  font-family: var(--vf-font-family-heading);
  font-weight: var(--vf-heading-font-weight);
}

h1 {
  font-size: var(--vf-heading-h-1-font-size);
  line-height: var(--vf-heading-h-1-line-height);
}

h2 {
  font-size: var(--vf-heading-h-3-font-size);
  line-height: var(--vf-heading-h-3-line-height);
}

h3 {
  color: var(--vf-color-muted);
  font-size: var(--vf-text-label-font-size);
  line-height: var(--vf-text-label-line-height);
}

code,
pre {
  font-family: var(--vf-font-family-mono);
}

code {
  font-size: var(--vf-text-caption-font-size);
}

pre {
  overflow: auto;
  margin: var(--vf-surface-gap) 0 0;
  padding: var(--vf-surface-padding-compact);
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-surface);
  background: var(--vf-color-surface-muted);
  color: var(--vf-color-text);
  line-height: var(--vf-text-body-line-height);
}

.catalog-groups {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--vf-surface-gap);
}

.icon-card__preview {
  width: 4.5rem;
  height: 4.5rem;
}

.icon-card__meta {
  color: var(--vf-color-muted);
  font-size: var(--vf-text-label-font-size);
  line-height: var(--vf-text-label-line-height);
}

@media (width <= 900px) {
  .catalog-groups {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .showcase__topbar,
  .panel__header,
  .catalog-section__header,
  .catalog-group__header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (width <= 640px) {
  .catalog-groups {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .theme-toggle {
    width: 100%;
  }
}
</style>
