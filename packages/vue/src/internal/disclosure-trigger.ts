import {
  cloneVNode,
  Comment,
  Fragment,
  h,
  isVNode,
  Text,
  type ComponentPublicInstance,
  type FunctionalComponent,
  type VNode,
} from 'vue';

interface TriggerProps {
  id: string;
  label: string;
  panelId: string;
  popup: 'dialog' | 'menu';
  triggerClass: string;
  open: boolean;
  disabled: boolean;
  capture: (element: Element | ComponentPublicInstance | null) => void;
  activate: (event: MouseEvent) => void;
  onTriggerKeydown?: (event: KeyboardEvent) => void;
}

function triggerNodes(nodes: readonly VNode[]): VNode[] {
  return nodes.flatMap((node) => {
    if (node.type === Fragment && Array.isArray(node.children)) return triggerNodes(node.children.filter(isVNode));
    if (node.type === Comment || (node.type === Text && typeof node.children === 'string' && !node.children.trim()))
      return [];
    return [node];
  });
}

const authoredTrigger: FunctionalComponent<TriggerProps> = (props, { slots }) => {
  const children = triggerNodes(slots.default?.() ?? []);
  const child = children[0];
  const attributes = {
    id: props.id,
    ref: props.capture,
    'aria-haspopup': props.popup,
    'aria-controls': props.panelId,
    'aria-expanded': props.open,
    onClick: props.activate,
    onKeydown: props.onTriggerKeydown,
  };
  if (children.length === 1 && child) {
    const disabled = props.disabled ? { disabled: true } : {};
    if (child.type === 'button') {
      const type: unknown = child.props?.type;
      return cloneVNode(child, { ...attributes, type: typeof type === 'string' ? type : 'button', ...disabled }, true);
    }
    if (typeof child.type === 'object' || typeof child.type === 'function') {
      return cloneVNode(child, { ...attributes, ...disabled }, true);
    }
  }
  const text = children.length && children.every((node) => node.type === Text) ? children : props.label;
  return h(
    'button',
    {
      ...attributes,
      type: 'button',
      class: props.triggerClass,
      disabled: props.disabled || undefined,
    },
    text,
  );
};
export const CmAuthoredTrigger = /* @__PURE__ */ Object.assign(authoredTrigger, {
  props: [
    'id',
    'label',
    'panelId',
    'popup',
    'triggerClass',
    'open',
    'disabled',
    'capture',
    'activate',
    'onTriggerKeydown',
  ],
});

export function authoredTriggerElement(element: Element | ComponentPublicInstance | null): HTMLElement | undefined {
  if (element instanceof HTMLElement) return element;
  const root: unknown = element && '$el' in element ? element.$el : undefined;
  return root instanceof HTMLElement ? root : undefined;
}

export function disclosureTriggerActions(toggle: (event?: MouseEvent) => void) {
  let handled = false;
  return {
    activate: (event: MouseEvent) => {
      if (!handled && !event.defaultPrevented) toggle(event);
    },
    toggleFromSlot: (event?: MouseEvent) => {
      if (event?.defaultPrevented) return;
      handled = true;
      toggle(event);
      queueMicrotask(() => {
        handled = false;
      });
    },
  };
}
