<script setup lang="ts">
import { computed, ref } from 'vue';
import { CmButton, CmCheckbox, CmInput, CmLink, CmStack, CmTabs } from '@codemonster-ru/ui-vue';
import { defaultPreview, previews } from '../../shared/showcase-layout-data.mts';
import logo from '../../shared/vueforge-logo-icon.svg';

const props = defineProps<{ viewport: number }>();
const selected = ref<Record<string, string>>({});
const submitted = ref(false);
const recipes = [
  {
    id: 'error',
    title: 'Error layout',
    description: 'Centers an error status, explanation, and recovery actions on a focused page.',
  },
  { id: 'auth', title: 'Auth layout', description: 'Frames sign-in and account forms in a responsive branded panel.' },
];
const options = computed(() => previews.filter(({ width }) => width <= props.viewport));
function active(id: string) {
  const sizes = options.value;
  return sizes.find(({ value }) => value === (selected.value[id] ?? defaultPreview)) ?? sizes.at(-1);
}
</script>

<template>
  <section
    v-for="{ id, title, description } in recipes"
    :key="id"
    class="showcase-group"
    :aria-labelledby="'demo-' + id + '-layout'"
  >
    <header>
      <h2 :id="'demo-' + id + '-layout'">{{ title }}</h2>
      <p>{{ description }}</p>
    </header>
    <template v-if="active(id)">
      <CmTabs
        :id="'layout-recipe-' + id"
        :model-value="'width-' + active(id)?.value"
        :items="options.map(({ value }) => ({ value: 'width-' + value, label: value, content: '' }))"
        @update:model-value="selected[id] = $event.slice(6)"
      >
        <template
          v-for="{ value } in options"
          :key="value"
          #[`panelWidth${value.charAt(0).toUpperCase()+value.slice(1)}`]="{ active: shown }"
        >
          <div v-if="shown" class="layout-demo-preview">
            <p class="layout-preview__caption">{{ value }} · {{ active(id)?.width }}px</p>
            <div class="layout-preview__frame" :style="{ maxInlineSize: active(id)?.width + 'px' }">
              <div v-if="id === 'error'" class="layout-demo-error">
                <strong>404</strong>
                <h3>Page not found</h3>
                <p>The page you requested does not exist or has been moved.</p>
                <CmButton href="/core/">Go to home page</CmButton>
              </div>
              <div v-else class="layout-auth-frame" :class="{ 'layout-auth-frame--compact': value === 'min' }">
                <CmStack class="layout-demo-auth">
                  <img :src="logo" alt="VueForge" />
                  <h3>Sign in</h3>
                  <p>Don't have an account? <CmLink href="/core/" underline="none">Click here to sign up</CmLink></p>
                  <form class="cm-stack" @submit.prevent="submitted = true">
                    <CmInput type="email" placeholder="Email" aria-label="Email" autocomplete="email" required />
                    <CmInput
                      type="password"
                      placeholder="Password"
                      aria-label="Password"
                      autocomplete="current-password"
                      password-reveal
                      required
                    />
                    <div class="layout-auth-options">
                      <CmCheckbox label="Remember me" /><CmLink href="/core/" underline="none">Forgot password?</CmLink>
                    </div>
                    <CmButton type="submit">Sign in</CmButton>
                    <small>© 2026 VueForge. All rights reserved.</small>
                    <output v-if="submitted" aria-live="polite">Sign-in preview submitted.</output>
                  </form>
                </CmStack>
              </div>
            </div>
          </div>
        </template>
      </CmTabs>
    </template>
  </section>
</template>
