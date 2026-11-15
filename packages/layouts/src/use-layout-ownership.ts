import { cmFrameworkOwnership } from '@codemonster-ru/ui-runtime/core';
import { watchPostEffect, type Ref } from 'vue';

export function useLayoutOwnership(root: Ref<HTMLElement | null>): void {
  const { attribute, claimEvent } = cmFrameworkOwnership;

  watchPostEffect((onCleanup) => {
    const element = root.value;
    if (!element) return;
    element.setAttribute(attribute, '');
    const EventConstructor = element.ownerDocument.defaultView?.Event;
    if (EventConstructor) element.dispatchEvent(new EventConstructor(claimEvent));
    onCleanup(() => element.removeAttribute(attribute));
  });
}
