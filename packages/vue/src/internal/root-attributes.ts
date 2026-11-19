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

export function mergeCmPickerTriggerAttrs(
  attrs: Readonly<Record<string, unknown>>,
  owned: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const omitted = new Set(['class', 'name', 'value', 'required', ...Object.keys(owned)]);
  const forwarded = Object.entries(attrs).filter(([attribute]) => {
    // Vue prefixes forced property and attribute bindings, and the DOM reflects ARIA properties.
    const name = attribute
      .replace(/^[.^]/u, '')
      .replace(/^aria(?=[A-Z])/u, 'aria-')
      .toLowerCase();
    return !omitted.has(name);
  });
  return { ...Object.fromEntries(forwarded), ...owned };
}
