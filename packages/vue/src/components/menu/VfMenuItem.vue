<script setup lang="ts">
import { computed, useAttrs } from 'vue';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import VueIconify from '../icon/VueIconify.vue';
import type { CmMenuItemTone } from './menu.types';

defineOptions({ inheritAttrs: false });
const props = withDefaults(
  defineProps<{
    label: string;
    icon?: string;
    disabled?: boolean;
    active?: boolean;
    tone?: CmMenuItemTone;
    href?: string;
    target?: string;
    rel?: string;
  }>(),
  { tone: 'default', icon: undefined, href: undefined, target: undefined, rel: undefined },
);
const emit = defineEmits<{ select: [] }>();
const attrs = useAttrs();
const classes = computed(() =>
  mergeCmClasses(
    'cm-menu__item',
    props.active ? 'cm-menu__item--active' : undefined,
    props.tone === 'danger' ? 'cm-menu__item--danger' : undefined,
    attrs.class,
  ),
);
const rootAttrs = computed(() => omitCmOwnedAttrs(attrs, props.disabled ? ['onClick'] : []));

function activate(event: MouseEvent): void {
  if (props.disabled) {
    event.preventDefault();
    return;
  }
  emit('select');
}
</script>

<template>
  <component
    :is="props.href ? 'a' : 'button'"
    v-bind="rootAttrs"
    :class="classes"
    :href="props.disabled ? undefined : props.href"
    :target="props.href ? props.target : undefined"
    :rel="props.href ? (props.rel ?? (props.target === '_blank' ? 'noopener noreferrer' : undefined)) : undefined"
    :type="props.href ? undefined : 'button'"
    :disabled="!props.href && props.disabled ? true : undefined"
    :tabindex="props.href && props.disabled ? -1 : undefined"
    :aria-disabled="props.disabled || undefined"
    role="menuitem"
    @click="activate"
  >
    <VueIconify v-if="props.icon" :icon="props.icon" class="cm-menu__item-icon" aria-hidden="true" />
    <span class="cm-menu__item-label">{{ props.label }}</span>
  </component>
</template>
