import type { ComputedRef, InjectionKey } from 'vue';

export const cmFloatingFieldKey: InjectionKey<ComputedRef<boolean>> = Symbol('CodeMonster UI floating field');
