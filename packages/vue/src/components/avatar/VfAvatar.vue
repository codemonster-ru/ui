<script setup lang="ts">
import { computed } from 'vue';

import { omitCmOwnedAttrs } from '../../internal/root-attributes';
import VueIconify from '../icon/VueIconify.vue';
import CmAvatar from './CmAvatar.vue';
import type { VfAvatarProps } from './avatar.types';

defineOptions({ inheritAttrs: false });

const props = defineProps<VfAvatarProps>();
const avatarProps = computed(() => omitCmOwnedAttrs(props, ['icon']));
</script>

<template>
  <CmAvatar v-bind="{ ...$attrs, ...avatarProps }">
    <VueIconify v-if="props.icon" class="cm-avatar__icon" :icon="props.icon" size="1em" />
    <slot v-else />
  </CmAvatar>
</template>
