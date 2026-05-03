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

                        <button
                            class="icon-card"
                            type="button"
                            @click="copySnippet(getIconSnippet(entry.icon), entry.icon)"
                        >
                            <span class="icon-card__preview">
                                <VueIconify
                                    :icon="getIconToken(entry.icon)"
                                    :size="44"
                                    :inset="getDemoIconInset(entry.icon)"
                                />
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

                        <button
                            class="icon-card"
                            type="button"
                            @click="copySnippet(getIconSnippet(entry.icon), entry.icon)"
                        >
                            <span class="icon-card__preview">
                                <VueIconify
                                    :icon="getIconToken(entry.icon)"
                                    :size="44"
                                    :inset="getDemoIconInset(entry.icon)"
                                />
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
    return Object.fromEntries(iconNames.map(iconName => [iconName, inset])) as Partial<Record<IconName, number>>;
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
    return sortedShowcaseIconEntries.value.filter(entry => !iconCatalog[entry.icon]?.brand);
});

const brandShowcaseIconEntries = computed(() => {
    return sortedShowcaseIconEntries.value.filter(entry => Boolean(iconCatalog[entry.icon]?.brand));
});

const toKebabCase = (iconName: string) => {
    return iconName.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`);
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
    document.documentElement.dataset.theme = value;
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

watch(theme, value => {
    applyTheme(value);
    window.localStorage.setItem(themeStorageKey, value);
});
</script>

<style lang="scss" scoped>
:global(body) {
    margin: 0;
    background: radial-gradient(circle at top, rgb(234 120 50 / 16%), transparent 28%),
        linear-gradient(180deg, #f7f1e7 0%, #f1ede3 100%);
    color: #1f2328;
    font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
    transition:
        background 220ms ease,
        color 220ms ease;
}

:global(:root[data-theme='dark'] body) {
    background: radial-gradient(circle at top, rgb(108 137 255 / 18%), transparent 28%),
        linear-gradient(180deg, #121726 0%, #0b101b 100%);
    color: #edf2ff;
}

:global(*) {
    box-sizing: border-box;
}

:global(button),
:global(code),
:global(pre) {
    font: inherit;
}

.showcase {
    --surface: rgb(255 250 243 / 88%);
    --surface-strong: rgb(255 248 238 / 96%);
    --border: rgb(50 42 30 / 12%);
    --accent: #cb5f2e;
    --accent-dark: #8b3b1c;
    --muted: #655b4f;
    --code-surface: #231b18;
    --code-text: #fdf6ee;
    --tile-surface: rgb(255 249 240 / 72%);
    --shadow: 0 12px 32px rgb(89 58 32 / 8%);
    --soft-shadow: 0 14px 30px rgb(89 58 32 / 7%);

    width: min(1280px, calc(100% - 32px));
    margin: 0 auto;
    padding: 24px 0 40px;
}

.showcase--dark {
    --surface: rgb(17 24 39 / 78%);
    --surface-strong: rgb(14 21 35 / 96%);
    --border: rgb(168 183 255 / 18%);
    --accent: #ff9b62;
    --accent-dark: #ffd2a4;
    --muted: #b9c1d9;
    --code-surface: #09101d;
    --code-text: #edf2ff;
    --tile-surface: rgb(17 24 39 / 68%);
    --shadow: 0 14px 34px rgb(0 0 0 / 24%);
    --soft-shadow: 0 16px 34px rgb(0 0 0 / 20%);
}

.showcase__topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
}

.showcase__brand {
    display: grid;
    gap: 8px;
}

.showcase__hint {
    margin: 0;
    color: var(--muted);
    line-height: 1.5;
}

.theme-toggle {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface);
    color: inherit;
    box-shadow: var(--shadow);
    cursor: pointer;
    transition:
        transform 180ms ease,
        border-color 180ms ease,
        background-color 180ms ease,
        box-shadow 180ms ease;
}

.theme-toggle:hover {
    transform: translateY(-1px);
    border-color: rgb(203 95 46 / 34%);
}

.theme-toggle__icon {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--surface-strong);
    color: var(--accent);
}

.toolbar,
.catalog {
    margin-bottom: 20px;
}

.catalog {
    display: grid;
    gap: 20px;
}

.catalog-section {
    display: grid;
    gap: 12px;
}

.catalog-section__header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
}

.panel,
.icon-card {
    border: 1px solid var(--border);
    border-radius: 24px;
    background: var(--surface);
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow);
}

.panel {
    padding: 18px 20px;
}

.panel--compact {
    max-width: 420px;
}

.eyebrow {
    margin: 0 0 10px;
    color: var(--accent-dark);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.catalog-section__header .eyebrow {
    margin-bottom: 0;
}

h1,
h2,
h3 {
    margin: 0;
    font-family: 'Avenir Next', Avenir, 'Segoe UI', sans-serif;
    line-height: 1.05;
}

h1 {
    font-size: clamp(1.8rem, 4vw, 2.8rem);
}

h2 {
    font-size: clamp(1.2rem, 2vw, 1.5rem);
}

h3 {
    font-size: 1rem;
}

.copy-button,
.icon-card {
    transition:
        transform 180ms ease,
        border-color 180ms ease,
        background-color 180ms ease,
        box-shadow 180ms ease;
}

code,
pre {
    font-family: SFMono-Regular, Consolas, 'Liberation Mono', monospace;
}

code {
    font-size: 0.92rem;
}

.panel__header,
.catalog-group__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.copy-button {
    padding: 9px 14px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: var(--surface-strong);
    color: var(--accent-dark);
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
}

.copy-button:hover {
    transform: translateY(-2px);
    border-color: rgb(203 95 46 / 34%);
    box-shadow: 0 12px 24px rgb(111 61 26 / 12%);
}

pre {
    overflow: auto;
    margin: 14px 0 0;
    padding: 14px 16px;
    border-radius: 16px;
    background: var(--code-surface);
    color: var(--code-text);
    line-height: 1.6;
}

.catalog-groups {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 14px;
}

.catalog-group {
    padding: 14px;
    border: 1px solid var(--border);
    border-radius: 22px;
    background: var(--tile-surface);
    box-shadow: var(--soft-shadow);
}

.catalog-group--tile {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: 12px;
}

.catalog-group__header {
    margin-bottom: 2px;
}

.icon-card {
    display: grid;
    gap: 10px;
    justify-items: center;
    padding: 16px 12px;
    color: inherit;
    cursor: pointer;
}

.icon-card:hover {
    transform: translateY(-2px);
    border-color: rgb(203 95 46 / 34%);
    box-shadow: 0 12px 24px rgb(111 61 26 / 12%);
}

.icon-card__preview {
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 18px;
    color: var(--accent-dark);
}

.icon-card__meta {
    color: var(--muted);
    font-size: 0.82rem;
}

@media (width <= 900px) {
    .showcase__topbar,
    .panel__header,
    .catalog-group__header {
        flex-direction: column;
        align-items: flex-start;
    }
}

@media (width <= 640px) {
    .showcase {
        width: min(100% - 20px, 1200px);
        padding-top: 18px;
    }

    .panel,
    .catalog-group {
        padding: 16px;
    }

    .theme-toggle {
        width: 100%;
        justify-content: center;
    }
}
</style>
