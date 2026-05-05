<script setup lang="ts">
import { computed, ref } from "vue";
import {
  VueIconify,
  iconCatalog,
  icons,
  showcaseIconEntries,
  type IconName,
} from "@codemonster-ru/vueforge-icons";

const copiedKey = ref<string | null>(null);
const demoIconInset = 0.08;

const withInset = (iconNames: IconName[], inset: number) =>
  Object.fromEntries(iconNames.map((iconName) => [iconName, inset])) as Partial<
    Record<IconName, number>
  >;

const demoIconInsetOverrides: Partial<Record<IconName, number>> = {
  ...withInset(
    [
      "arrowLeft",
      "arrowLeftLong",
      "arrowRight",
      "arrowRightLong",
      "arrowUp",
      "arrowUpLong",
      "arrowDown",
      "arrowDownLong",
      "arrowTurnUpLeft",
      "arrowTurnUpRight",
      "arrowTurnRightUp",
      "arrowTurnLeftDown",
      "globe",
    ],
    0.01,
  ),
  ...withInset(["ban"], 0.01),
  ...withInset(["activity"], -0.02),
  ...withInset(["check", "plus", "sparkles", "xmark"], 0.02),
  ...withInset(
    [
      "bars",
      "caretDown",
      "caretLeft",
      "caretRight",
      "caretUp",
      "chevronDown",
      "chevronLeft",
      "chevronRight",
      "chevronUp",
      "minus",
      "sort",
    ],
    0.03,
  ),
  ...withInset(
    ["clock", "externalLink", "history", "link", "share", "sliders", "terminal"],
    0.04,
  ),
  ...withInset(["cloud", "key", "layers"], 0.05),
  ...withInset(["hardDrive", "star"], 0.06),
  ...withInset(["bell", "building", "chartBar", "cpu", "database", "wallet"], 0.07),
  ...withInset(["bookmark", "house"], 0.08),
  ...withInset(["file", "fileText", "folder", "inbox", "warning"], 0.09),
  ...withInset(
    [
      "calendar",
      "creditCard",
      "folderOpen",
      "user",
      "userCheck",
      "userMinus",
      "userPlus",
      "users",
    ],
    0.1,
  ),
  ...withInset(["archive", "briefcase", "mail", "message"], 0.11),
  ...withInset(["checkCircle", "infoCircle", "questionCircle", "xCircle"], 0.13),
  ...withInset(["moon", "sun"], 0.07),
};

const sortedShowcaseIconEntries = computed(() =>
  [...showcaseIconEntries].sort((left, right) => left.icon.localeCompare(right.icon)),
);

const nonBrandShowcaseIconEntries = computed(() =>
  sortedShowcaseIconEntries.value.filter((entry) => !iconCatalog[entry.icon]?.brand),
);

const brandShowcaseIconEntries = computed(() =>
  sortedShowcaseIconEntries.value.filter((entry) => Boolean(iconCatalog[entry.icon]?.brand)),
);

const toKebabCase = (iconName: string) =>
  iconName.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

const getIconToken = (iconName: IconName) => icons[iconName] ?? toKebabCase(iconName);

const getDemoIconInset = (iconName: IconName) =>
  demoIconInsetOverrides[iconName] ?? demoIconInset;

const getIconSnippet = (iconName: string) =>
  `<VueIconify :icon="icons.${iconName}" :size="24" />`;

const getDisplayIconName = (iconName: IconName) => toKebabCase(iconName);

const copyLabel = (key: string) => (copiedKey.value === key ? "Copied" : "Copy");

const copySnippet = async (snippet: string, key: string) => {
  await navigator.clipboard.writeText(snippet);
  copiedKey.value = key;

  window.setTimeout(() => {
    if (copiedKey.value === key) {
      copiedKey.value = null;
    }
  }, 1200);
};
</script>

<template>
  <main class="demo-page">
    <div class="demo-container">
      <section class="demo-block">
        <div class="demo-block__header">
          <h2>Core Icons</h2>
        </div>

        <div class="icons-grid">
          <article
            v-for="entry in nonBrandShowcaseIconEntries"
            :key="entry.icon"
            class="icon-tile"
          >
            <div class="icon-tile__header">
              <h3>{{ getDisplayIconName(entry.icon) }}</h3>
            </div>

            <button
              class="icon-tile__button"
              type="button"
              @click="copySnippet(getIconSnippet(entry.icon), entry.icon)"
            >
              <span class="icon-tile__preview">
                <VueIconify
                  :icon="getIconToken(entry.icon)"
                  :size="44"
                  :inset="getDemoIconInset(entry.icon)"
                />
              </span>
              <span class="icon-tile__meta">{{ copyLabel(entry.icon) }}</span>
            </button>
          </article>
        </div>
      </section>

      <section v-if="brandShowcaseIconEntries.length > 0" class="demo-block">
        <div class="demo-block__header">
          <h2>Brand Icons</h2>
        </div>

        <div class="icons-grid">
          <article
            v-for="entry in brandShowcaseIconEntries"
            :key="entry.icon"
            class="icon-tile"
          >
            <div class="icon-tile__header">
              <h3>{{ getDisplayIconName(entry.icon) }}</h3>
            </div>

            <button
              class="icon-tile__button"
              type="button"
              @click="copySnippet(getIconSnippet(entry.icon), entry.icon)"
            >
              <span class="icon-tile__preview">
                <VueIconify
                  :icon="getIconToken(entry.icon)"
                  :size="44"
                  :inset="getDemoIconInset(entry.icon)"
                />
              </span>
              <span class="icon-tile__meta">{{ copyLabel(entry.icon) }}</span>
            </button>
          </article>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.icons-grid {
  display: grid;
  gap: var(--vf-layout-space-layout-base);
  grid-template-columns: repeat(6, minmax(0, 1fr));
}

.icon-tile {
  display: grid;
  gap: var(--vf-layout-space-layout-base);
  padding: var(--vf-layout-section-inset-default);
  border: var(--vf-layout-border-base);
  border-radius: var(--vf-layout-section-radius);
  background: var(--vf-layout-surface-base);
}

.icon-tile__header h3 {
  margin: 0;
  color: var(--vf-color-muted);
  font-size: var(--vf-text-label-font-size);
  font-weight: var(--vf-text-label-font-weight);
  line-height: var(--vf-text-label-line-height);
}

.icon-tile__button {
  display: grid;
  gap: var(--vf-layout-space-layout-base);
  justify-items: center;
  width: 100%;
  min-height: 8rem;
  padding: var(--vf-surface-padding-compact);
  border: 1px solid var(--vf-color-border);
  border-radius: var(--vf-radius-surface);
  background: var(--vf-color-surface);
  color: var(--vf-color-text);
  cursor: pointer;
  transition:
    background-color var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),
    border-color var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),
    color var(--vf-motion-duration-normal) var(--vf-motion-ease-standard),
    box-shadow var(--vf-motion-duration-normal) var(--vf-motion-ease-standard);
}

.icon-tile__button:hover {
  border-color: var(--vf-color-primary);
  color: var(--vf-color-primary);
}

.icon-tile__button:focus-visible {
  outline: none;
  border-color: var(--vf-color-primary);
  box-shadow: 0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring);
}

.icon-tile__preview {
  display: grid;
  place-items: center;
  width: 4.5rem;
  height: 4.5rem;
  color: inherit;
}

.icon-tile__meta {
  color: var(--vf-color-muted);
  font-size: var(--vf-text-label-font-size);
  line-height: var(--vf-text-label-line-height);
}

@media (width < 72rem) {
  .icons-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (width < 48rem) {
  .icons-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
