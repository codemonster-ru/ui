import { computed, toValue, useId as useVueId, type MaybeRefOrGetter } from 'vue';

export interface UseIdOptions {
  prefix?: string;
  providedId?: MaybeRefOrGetter<string | undefined>;
}

export function useId(options: UseIdOptions = {}) {
  const generated = `${options.prefix ?? 'vf'}-${useVueId()}`;
  return computed(() => toValue(options.providedId) ?? generated);
}
