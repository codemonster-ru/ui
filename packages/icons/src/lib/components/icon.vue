<template>
  <span :class="wrapperClasses" :style="wrapperStyles">
    <component :is="iconComponent" v-bind="iconBindings" :class="classes" />
  </span>
</template>

<script setup lang="ts">
import { computed, useAttrs, type Component } from 'vue';
import iconOpticalOffsetsJson from '@/lib/iconOpticalOffsets.json';
import { iconNames, type IconName } from '@/lib/iconMeta';

defineOptions({
  inheritAttrs: false,
});

const FALLBACK_ICON = 'moon' as const;
type IconStyle = 'solid';

const iconModules = import.meta.glob('./*.vue', {
  eager: true,
  import: 'default',
}) as Record<string, Component>;

const iconOpticalOffsets = iconOpticalOffsetsJson as Partial<Record<IconName, { x: number; y: number }>>;

const props = withDefaults(
  defineProps<{
    icon?: IconName | string;
    spin?: boolean;
    size?: number | string;
    style?: IconStyle;
    inset?: number;
  }>(),
  {
    icon: FALLBACK_ICON,
    spin: false,
    size: 'var(--vf-icon-size-md)',
    style: 'solid',
    inset: 0,
  },
);
const attrs = useAttrs();

const toComponentIconName = (iconName: string) => {
  if (!iconName.includes('-')) {
    return iconName;
  }

  return iconName.toLowerCase().replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase());
};

const getIconComponent = (iconName: string) => {
  const componentIconName = toComponentIconName(iconName);
  const normalizedIconName = iconNames.includes(componentIconName as IconName) ? componentIconName : FALLBACK_ICON;
  const componentPath = `./${normalizedIconName}.vue`;

  return iconModules[componentPath] ?? iconModules[`./${FALLBACK_ICON}.vue`];
};

const normalizedIconName = computed<IconName>(() => {
  const componentIconName = toComponentIconName(props.icon);
  return iconNames.includes(componentIconName as IconName) ? (componentIconName as IconName) : FALLBACK_ICON;
});

const iconComponent = computed(() => {
  return getIconComponent(normalizedIconName.value);
});

const iconBindings = computed(() => {
  return {
    ...attrs,
    size: props.size,
  };
});

const classes = computed(() => {
  return {
    'vf-icon': true,
  };
});

const wrapperClasses = computed(() => {
  return {
    'vf-icon-wrapper': true,
    'vf-icon-wrapper--spin': props.spin,
  };
});

const wrapperStyles = computed(() => {
  const safeInset = Math.min(Math.max(props.inset, -0.25), 0.49);
  const scale = 1 - safeInset * 2;
  const offset = iconOpticalOffsets[normalizedIconName.value] ?? { x: 0, y: 0 };

  return {
    '--vf-icon-scale': String(scale),
    '--vf-icon-offset-x': String(offset.x),
    '--vf-icon-offset-y': String(offset.y),
  };
});
</script>
<style lang="scss" scoped>
.vf-icon-wrapper {
  --vf-icon-offset-x: 0;
  --vf-icon-offset-y: 0;
  --vf-icon-scale: 1;

  display: inline-grid;
  place-items: center;
  line-height: 0;
}

.vf-icon {
  transform: translate(calc(var(--vf-icon-offset-x) * 100%), calc(var(--vf-icon-offset-y) * 100%))
    scale(var(--vf-icon-scale));
  transform-origin: center;
}

.vf-icon-wrapper--spin {
  animation-name: vf-icon-spin;
  animation-delay: 0s;
  animation-duration: 2s;
  animation-direction: normal;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
}

@keyframes vf-icon-spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}
</style>
