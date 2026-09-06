// Compile-time proof that the neutral preset still satisfies the published Vue
// token contract.
//
// M09 moved the preset values into @codemonster-ru/vueforge-theme so both
// adapters can build token CSS from one owner. The completeness check stayed
// here, in the package that publishes VfThemeTokens: the neutral owner should
// not have to know the Vue adapter's interface, but a missing or misspelled
// component token must still fail the build.
//
// Types only. Nothing is emitted at runtime.
import type { VfPrimitiveColorTokenName, VfSemanticColorTokenName } from '@codemonster-ru/vueforge-theme';
import { componentThemePresetSource, defaultThemePresetSource } from '../../../theme/src/theme/default-preset-source';
import type { VfThemePreset, VfThemeTokens } from '@/types/theme';

type ColorTokenName = VfPrimitiveColorTokenName | VfSemanticColorTokenName;
type ComponentThemeTokens = Omit<Required<VfThemeTokens>, ColorTokenName>;

type ComponentThemePreset = Omit<VfThemePreset, 'tokens' | 'dark'> & {
  tokens: ComponentThemeTokens;
  dark?: Partial<ComponentThemeTokens>;
};

type CompleteDefaultThemePreset = Omit<VfThemePreset, 'tokens' | 'dark'> & {
  tokens: Required<VfThemeTokens>;
  dark?: Partial<Required<VfThemeTokens>>;
};

// Assigning to the contract type is the check: a token the published interface
// requires but the preset does not provide is a type error here.
const componentPresetSatisfiesContract: ComponentThemePreset = componentThemePresetSource;
const defaultPresetSatisfiesContract: CompleteDefaultThemePreset = defaultThemePresetSource;

export type { ComponentThemePreset, CompleteDefaultThemePreset };
export { componentPresetSatisfiesContract, defaultPresetSatisfiesContract };
