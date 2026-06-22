import type { InjectionKey, Ref } from 'vue';

export type VfFieldLabelPlacement = 'top' | 'floating';
export type VfFieldFloatingVariant = 'in' | 'on' | 'over';

export interface VfFieldContext {
  labelPlacement: Ref<VfFieldLabelPlacement>;
  setFilled: (value: boolean) => void;
  setFloatingSupported: (value: boolean) => void;
}

export const vfFieldContextKey: InjectionKey<VfFieldContext> = Symbol('vf-field-context');
