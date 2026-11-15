import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue';

export interface UseDisclosureOptions {
  defaultOpen?: boolean;
  open?: MaybeRefOrGetter<boolean | undefined>;
  onOpenChange?: (open: boolean) => void;
}

export function useDisclosure(options: UseDisclosureOptions = {}) {
  const controlled = computed(() => toValue(options.open));
  const local = ref(options.defaultOpen ?? false);
  const isOpen = computed(() => controlled.value ?? local.value);

  watch(controlled, (value) => {
    if (value !== undefined) local.value = value;
  });

  function setOpen(open: boolean): void {
    if (controlled.value === undefined) local.value = open;
    options.onOpenChange?.(open);
  }

  return {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen.value),
    setOpen,
  };
}
