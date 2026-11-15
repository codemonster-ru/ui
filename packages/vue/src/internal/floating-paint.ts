import { afterCmFloatingExit } from '@codemonster-ru/ui-runtime/anchored-position';
import { computed, ref, watch, type Ref } from 'vue';

export function useCmFloatingPaint(open: Ref<boolean>, panel: Readonly<Ref<HTMLElement | null | undefined>>) {
  const painted = ref(open.value);
  watch(
    open,
    (visible) => {
      if (visible) painted.value = true;
      else afterCmFloatingExit(panel.value, () => (painted.value = false));
    },
    { flush: 'post' },
  );
  return computed(() => open.value || painted.value);
}
