import { Comment, Fragment, Text, isVNode, type Slot } from 'vue';

function hasContent(node: unknown): boolean {
  if (Array.isArray(node)) return node.some(hasContent);
  if (typeof node === 'string') return node.trim().length > 0;
  if (typeof node === 'number') return true;
  if (!isVNode(node) || node.type === Comment) return false;
  if (node.type === Text || node.type === Fragment) return hasContent(node.children);
  return true;
}

export function hasLayoutSlotContent(slot: Slot | undefined): boolean {
  return hasContent(slot?.());
}
