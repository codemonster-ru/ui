import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue';

interface UseDisclosureOptions {
  defaultOpen?: boolean;
  open?: MaybeRefOrGetter<boolean | undefined>;
  onOpenChange?: (open: boolean) => void;
}

export function useDisclosure(options: UseDisclosureOptions = {}) {
  const isControlled = computed(() => toValue(options.open) !== undefined);
  const internalOpen = ref(options.defaultOpen ?? false);
  const isOpen = computed(() => (isControlled.value ? Boolean(toValue(options.open)) : internalOpen.value));

  watch(
    () => toValue(options.open),
    (value) => {
      if (value !== undefined) {
        internalOpen.value = value;
      }
    },
  );

  function setOpen(nextOpen: boolean) {
    if (!isControlled.value) {
      internalOpen.value = nextOpen;
    }

    options.onOpenChange?.(nextOpen);
  }

  return {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen.value),
    setOpen,
  };
}
