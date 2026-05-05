import { computed, type MaybeRefOrGetter, toValue } from 'vue';

let idCounter = 0;

interface UseIdOptions {
  prefix?: string;
  providedId?: MaybeRefOrGetter<string | undefined>;
}

export function useId(options: UseIdOptions = {}) {
  const generatedId = `${options.prefix ?? 'vf'}-${++idCounter}`;

  return computed(() => toValue(options.providedId) ?? generatedId);
}
