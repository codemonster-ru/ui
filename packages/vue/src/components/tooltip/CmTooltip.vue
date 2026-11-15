<script setup lang="ts">
import { resolveCmAnchoredTarget } from '@codemonster-ru/ui-runtime/anchored-position';
import { autoUpdate, computePosition, flip, offset, shift } from '@codemonster-ru/floater.js';
import {
  Comment,
  Fragment,
  Text,
  cloneVNode,
  computed,
  h,
  isVNode,
  onBeforeUnmount,
  ref,
  useAttrs,
  useId,
  useSlots,
  watch,
  type FunctionalComponent,
  type PropType,
  type VNode,
} from 'vue';
import { resolveTooltipDelay } from '@codemonster-ru/ui-runtime/core';

import { mergeCmClasses, omitCmOwnedAttrs } from '../../internal/root-attributes';
import { useCmHydrated } from '../../internal/hydration';
import type { CmTooltipDelay, CmTooltipPlacement, CmTooltipProps } from './tooltip.types';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  id: { type: String, default: undefined },
  label: { type: String, default: undefined },
  content: { type: String, default: undefined },
  text: { type: String, default: undefined },
  defaultVisible: Boolean,
  placement: {
    type: String as PropType<CmTooltipPlacement>,
    default: 'top',
    validator: (value: string) => ['top', 'bottom', 'start', 'end'].includes(value),
  },
  delay: {
    type: String as PropType<CmTooltipDelay>,
    default: 'short',
    validator: (value: string) => ['none', 'short', 'long'].includes(value),
  },
  openDelay: { type: Number, default: undefined },
  teleportTo: { type: [String, Object, Boolean] as PropType<CmTooltipProps['teleportTo']>, default: null },
  disableTeleport: Boolean,
});
const attrs = useAttrs();
const slots = useSlots();
const generatedId = useId();
const root = ref<HTMLElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const visible = ref(props.defaultVisible);
const position = ref<{ side: string; style: { left: string; top: string } }>();
let timer: ReturnType<typeof setTimeout> | undefined;
let hovered = false;
let focused = false;

const tooltipId = computed(() => `${props.id || generatedId}-tooltip`);
const placement = computed(() =>
  ['top', 'bottom', 'start', 'end'].includes(props.placement) ? props.placement : 'top',
);
const delay = computed(() => (['none', 'short', 'long'].includes(props.delay) ? props.delay : 'short'));
const openingDelay = computed(() => resolveTooltipDelay(delay.value, props.openDelay));
const classes = () =>
  mergeCmClasses(
    'cm-tooltip',
    `cm-tooltip--${placement.value}`,
    `cm-tooltip--delay-${delay.value}`,
    visible.value && hasTooltip() ? 'cm-tooltip--visible' : undefined,
    attrs.class,
  );
const rootAttrs = computed(() =>
  omitCmOwnedAttrs(attrs, ['data-cm-controller', 'data-cm-tooltip-open-delay', 'data-cm-tooltip-teleport-to']),
);
const portal = computed(() => (!props.disableTeleport ? props.teleportTo || null : null));
const teleportTarget = computed(() => (visible.value ? resolveCmAnchoredTarget(root.value, portal.value) : null));

function triggerChildren(children: VNode[]): VNode[] {
  return children.flatMap((child) => {
    if (child.type === Fragment && Array.isArray(child.children)) {
      return triggerChildren(child.children.filter(isVNode));
    }
    if (child.type === Comment) return [];
    if (child.type === Text && typeof child.children === 'string' && !child.children.trim()) return [];
    return [child];
  });
}

const CustomTrigger: FunctionalComponent<{ descriptionId?: string }> = ({ descriptionId }, { slots }) => {
  const children = triggerChildren(slots.default?.() ?? []);
  const child = children[0];
  const customAttrs = {
    class: 'cm-tooltip__trigger',
    'data-cm-tooltip-custom-trigger': '',
  };

  if (
    children.length === 1 &&
    child &&
    (typeof child.type === 'string' || typeof child.type === 'object' || typeof child.type === 'function')
  ) {
    const describedBy: unknown = child.props?.['aria-describedby'];
    const descriptions = typeof describedBy === 'string' ? describedBy.split(/\s+/u).filter(Boolean) : [];
    if (descriptionId) descriptions.push(descriptionId);
    return cloneVNode(child, {
      ...customAttrs,
      'aria-describedby': [...new Set(descriptions)].join(' ') || undefined,
    });
  }

  return h('span', { ...customAttrs, 'aria-describedby': descriptionId, tabindex: 0 }, children);
};
CustomTrigger.props = ['descriptionId'];

function hasTooltip(): boolean {
  return Boolean(slots.content || (props.content ?? props.text)?.trim());
}

function clearTimer(): void {
  if (timer !== undefined) clearTimeout(timer);
  timer = undefined;
}

function show(): void {
  if (visible.value || timer !== undefined || !hasTooltip()) return;
  if (openingDelay.value === 0) {
    visible.value = true;
    return;
  }
  timer = setTimeout(() => {
    timer = undefined;
    visible.value = true;
  }, openingDelay.value);
}

function hide(): void {
  clearTimer();
  visible.value = false;
}

function onPointerEnter(): void {
  hovered = true;
  show();
}

function onPointerLeave(): void {
  hovered = false;
  if (!focused) hide();
}

function onFocusIn(): void {
  focused = true;
  show();
}

function onFocusOut(event: FocusEvent): void {
  if (event.relatedTarget instanceof Node && root.value?.contains(event.relatedTarget)) return;
  focused = false;
  if (!hovered) hide();
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key !== 'Escape' || !hasTooltip() || (!visible.value && timer === undefined)) return;
  event.preventDefault();
  event.stopPropagation();
  hide();
}

watch(
  [teleportTarget, panelRef, placement],
  ([target, panel, side], _, onCleanup) => {
    const trigger = root.value?.querySelector<HTMLElement>('.cm-tooltip__trigger');
    if (!target || !panel || !trigger) return;

    const rtl = trigger.ownerDocument.defaultView?.getComputedStyle(trigger).direction === 'rtl';
    const direction = side === 'start' ? (rtl ? 'right' : 'left') : side === 'end' ? (rtl ? 'left' : 'right') : side;
    const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
    let active = true;
    const place = (): void => {
      void computePosition(trigger, panel, {
        placement: direction,
        strategy: 'fixed',
        middleware: [offset(10), flip({ placements: [direction, opposite[direction]] }), shift()],
      }).then(({ placement: resolvedSide, x, y }) => {
        if (active) {
          position.value = { side: resolvedSide, style: { left: `${x}px`, top: `${y}px` } };
        }
      });
    };
    const stop = autoUpdate(trigger, place, panel);
    place();
    onCleanup(() => {
      active = false;
      stop();
      position.value = undefined;
    });
  },
  { flush: 'post' },
);

onBeforeUnmount(clearTimer);

useCmHydrated();
</script>

<template>
  <span
    ref="root"
    v-bind="rootAttrs"
    :class="classes()"
    :data-cm-controller="hasTooltip() ? 'tooltip' : undefined"
    :data-cm-tooltip-open-delay="props.openDelay === undefined ? undefined : openingDelay"
    :data-cm-tooltip-teleport-to="typeof portal === 'string' ? portal : undefined"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
    @pointerenter="onPointerEnter"
    @pointerleave="onPointerLeave"
    @keydown="onKeydown"
  >
    <CustomTrigger v-if="$slots.default" :description-id="hasTooltip() ? tooltipId : undefined">
      <slot />
    </CustomTrigger>
    <button
      v-else
      class="cm-tooltip__trigger"
      type="button"
      :aria-label="props.label"
      :aria-describedby="hasTooltip() ? tooltipId : undefined"
    >
      <slot name="trigger">{{ props.label }}</slot>
    </button>
    <Teleport :to="teleportTarget ?? 'body'" :disabled="!teleportTarget">
      <span
        v-if="hasTooltip()"
        :id="tooltipId"
        ref="panelRef"
        class="cm-tooltip__content"
        role="tooltip"
        :hidden="!visible"
        :data-cm-tooltip-floating="teleportTarget ? (position?.side ?? '') : undefined"
        v-bind="position ? { style: position.style } : {}"
      >
        <slot name="content">{{ props.content ?? props.text }}</slot>
      </span>
    </Teleport>
  </span>
</template>
