import { computed, type MaybeRefOrGetter, toValue, useId as useVueId } from 'vue';

export interface UseIdOptions {
  prefix?: string;
  providedId?: MaybeRefOrGetter<string | undefined>;
}

export function useId(options: UseIdOptions = {}) {
  const generatedId = `${options.prefix ?? 'vf'}-${useVueId()}`;

  return computed(() => toValue(options.providedId) ?? generatedId);
}
