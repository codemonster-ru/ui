import { cmFrameworkOwnership } from '@codemonster-ru/ui-runtime/core';
import { getCurrentInstance, onBeforeMount, onBeforeUnmount, onMounted } from 'vue';

const { attribute, claimEvent } = cmFrameworkOwnership;

function claim(element: Element): void {
  if (element.hasAttribute(attribute)) return;
  element.setAttribute(attribute, '');
  const EventConstructor = element.ownerDocument.defaultView?.Event;
  if (EventConstructor) element.dispatchEvent(new EventConstructor(claimEvent));
}

/**
 * Claims this component's root element for Vue.
 *
 * Every interactive component renders `data-cm-controller` so its markup matches the canonical DOM
 * that Vanilla templates produces. On a hybrid page a running `CmRuntime` would otherwise
 * attach its own controller to that element and start writing `aria-selected`, `hidden` and friends
 * imperatively — behind a component that already owns them declaratively. The two agree while they
 * happen to reach the same answer and diverge the moment they do not, most visibly when a parent
 * declines a controlled change.
 *
 * The marker is set after mount, so server-rendered output is untouched and a progressively
 * enhanced page still gets its controller.
 */
export function useCmHydrated(): void {
  const instance = getCurrentInstance();

  const root = (): Element | null => {
    const element = instance?.proxy?.$el as unknown;
    return element instanceof Element ? element : null;
  };

  onMounted(() => {
    const element = root();
    if (element) claim(element);
  });

  onBeforeUnmount(() => {
    root()?.removeAttribute(attribute);
  });
}

/** Lets the controller restore browser-measured attributes before Vue compares the SSR root. */
export function useCmHydratedBeforeMount(): void {
  const instance = getCurrentInstance();
  onBeforeMount(() => {
    const element: unknown = instance?.vnode.el;
    if (element instanceof Element) claim(element);
  });
  useCmHydrated();
}
