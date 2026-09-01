import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';

export function useObservedElementHeight(target: Ref<HTMLElement | null>) {
  const height = ref(0);
  let resizeObserver: ResizeObserver | null = null;
  let stopWatch: (() => void) | null = null;

  const updateHeight = () => {
    height.value = target.value ? Math.round(target.value.getBoundingClientRect().height) : 0;
  };

  const reconnect = () => {
    resizeObserver?.disconnect();

    if (!target.value) {
      updateHeight();
      return;
    }

    if (typeof ResizeObserver === 'undefined') {
      updateHeight();
      return;
    }

    resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(target.value);
    updateHeight();
  };

  onMounted(() => {
    stopWatch = watch(target, reconnect, {
      immediate: true,
      flush: 'post',
    });
  });

  onBeforeUnmount(() => {
    stopWatch?.();
    resizeObserver?.disconnect();
  });

  return height;
}
