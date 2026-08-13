import { normalizeClass, type HTMLAttributes } from 'vue';

export type CmClassValue = HTMLAttributes['class'];

export function mergeCmClasses(...values: CmClassValue[]): string {
  return [...new Set(normalizeClass(values).split(/\s+/u).filter(Boolean))].join(' ');
}

export function omitCmOwnedAttrs(
  attrs: Readonly<Record<string, unknown>>,
  ownedAttributes: readonly string[],
): Record<string, unknown> {
  const omittedAttributes = new Set(['class', ...ownedAttributes]);

  return Object.fromEntries(Object.entries(attrs).filter(([attribute]) => !omittedAttributes.has(attribute)));
}
