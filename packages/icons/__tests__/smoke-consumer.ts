import {
  VueIconify,
  coreIconNames,
  iconCatalog,
  iconGroups,
  iconNames,
  outlineIconVariants,
  showcaseIconEntries,
  icons,
  iconVariants,
  iconFamilies,
  type IconCatalogEntry,
  type IconName,
  type IconShowcaseEntry,
  type IconVariant,
  type IconFamily,
  type OutlineIconVariant,
} from '@codemonster-ru/vueforge-icons';
import { h, type Component } from 'vue';

const components: Component[] = [VueIconify];
const variants: IconVariant[] = [...iconVariants];
const families: IconFamily[] = [...iconFamilies];
const catalogVariants: IconCatalogEntry['variants'] = variants;
const names: readonly IconName[] = iconNames;
const outlineVariants: readonly OutlineIconVariant[] = outlineIconVariants;
const showcaseEntries: readonly IconShowcaseEntry[] = showcaseIconEntries;

const sizedGenericIcon = h(VueIconify, { icon: icons.moon, size: '2rem' });
const solidGenericIcon = h(VueIconify, { icon: icons.moon, variant: 'solid' });
const lightGenericIcon = h(VueIconify, { icon: icons.moon, variant: 'light' });
const thinGenericIcon = h(VueIconify, { icon: icons.moon, variant: 'thin' });
const duotoneGenericIcon = h(VueIconify, {
  icon: icons.moon,
  family: 'duotone',
  secondaryColor: '#94a3b8',
  secondaryOpacity: 1,
});
const sizedSecondaryGenericIcon = h(VueIconify, { icon: icons.externalLink, size: 20 });
const sizedCalendarGenericIcon = h(VueIconify, { icon: icons.calendar, size: 20 });
const sizedTableGenericIcon = h(VueIconify, { icon: icons.checkCircle, size: 18 });
const sizedSaasGenericIcon = h(VueIconify, { icon: icons.columns, size: 18 });
const sizedInfraCoreGenericIcon = h(VueIconify, { icon: icons.share, size: 18 });
const sizedInfraGenericIcon = h(VueIconify, { icon: icons.cloud, size: 21 });
const sizedEnterpriseGenericIcon = h(VueIconify, { icon: icons.activity, size: 19 });

void components;
void variants;
void families;
void catalogVariants;
void coreIconNames;
void iconCatalog;
void iconGroups;
void names;
void outlineVariants;
void showcaseEntries;
void sizedGenericIcon;
void solidGenericIcon;
void lightGenericIcon;
void thinGenericIcon;
void duotoneGenericIcon;
void sizedSecondaryGenericIcon;
void sizedCalendarGenericIcon;
void sizedTableGenericIcon;
void sizedSaasGenericIcon;
void sizedInfraCoreGenericIcon;
void sizedInfraGenericIcon;
void sizedEnterpriseGenericIcon;
