import { computed, nextTick, onMounted, shallowRef, useTemplateRef, watch } from 'vue';
import type { CmModalBinding } from './use-modal';

export interface VfModalPortalProps {
  teleportTo?: string | HTMLElement | null | false;
  disableTeleport?: boolean;
}

export function useVfModalPortal(destination: () => VfModalPortalProps['teleportTo'], disabled: () => boolean) {
  const modal = useTemplateRef<Pick<CmModalBinding, 'restoreAfterMove'> & { $el: HTMLDialogElement }>('modal');
  const owner = shallowRef<Document | null>(null);
  let restore: (() => void) | undefined;

  onMounted(async () => {
    await nextTick();
    owner.value = modal.value?.$el.ownerDocument ?? null;
  });

  const target = computed(() => {
    const document = owner.value;
    const element = modal.value?.$el;
    const requested = destination();
    if (!document || !element || disabled() || !requested) return null;
    let resolved: Element | null;
    try {
      resolved = typeof requested === 'string' ? document.querySelector(requested) : requested;
    } catch {
      return null;
    }
    const HTMLElementConstructor = document.defaultView?.HTMLElement;
    return HTMLElementConstructor &&
      resolved instanceof HTMLElementConstructor &&
      resolved.ownerDocument === document &&
      resolved.isConnected &&
      !element.contains(resolved)
      ? resolved
      : null;
  });

  watch(target, () => {
    // Moving a dialog can remove it from the browser's top layer, even though `open` stays true.
    restore = modal.value?.restoreAfterMove();
  });
  watch(
    target,
    () => {
      restore?.();
      restore = undefined;
    },
    { flush: 'post' },
  );

  return { target };
}
