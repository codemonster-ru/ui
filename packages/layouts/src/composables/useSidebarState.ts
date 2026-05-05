import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue';

export interface UseSidebarStateOptions {
  defaultOpen?: boolean;
  defaultCollapsed?: boolean;
  closeOnDesktop?: MaybeRefOrGetter<boolean>;
}

export function useSidebarState(options: UseSidebarStateOptions = {}) {
  const isOpen = ref(options.defaultOpen ?? false);
  const isCollapsed = ref(options.defaultCollapsed ?? false);

  if (options.closeOnDesktop !== undefined) {
    watch(
      () => toValue(options.closeOnDesktop),
      (shouldClose) => {
        if (shouldClose) {
          isOpen.value = false;
        }
      },
      { immediate: true },
    );
  }

  const isExpanded = computed(() => isOpen.value && !isCollapsed.value);

  const open = () => {
    isOpen.value = true;
  };

  const close = () => {
    isOpen.value = false;
  };

  const toggle = () => {
    isOpen.value = !isOpen.value;
  };

  const collapse = () => {
    isCollapsed.value = true;
  };

  const expand = () => {
    isCollapsed.value = false;
  };

  const toggleCollapsed = () => {
    isCollapsed.value = !isCollapsed.value;
  };

  return {
    isOpen,
    isCollapsed,
    isExpanded,
    open,
    close,
    toggle,
    collapse,
    expand,
    toggleCollapsed,
  };
}
