import { VueIconify, icons, type IconCatalogEntry } from '@codemonster-ru/vueforge-icons';
import { h, type Component } from 'vue';

const components: Component[] = [VueIconify];
const catalogStyles: IconCatalogEntry['style'][] = ['solid', 'outline'];

const sizedGenericIcon = h(VueIconify, { icon: icons.moon, size: '2rem' });
const sizedSecondaryGenericIcon = h(VueIconify, { icon: icons.externalLink, size: 20 });
const sizedCalendarGenericIcon = h(VueIconify, { icon: icons.calendar, size: 20 });
const sizedTableGenericIcon = h(VueIconify, { icon: icons.checkCircle, size: 18 });
const sizedSaasGenericIcon = h(VueIconify, { icon: icons.columns, size: 18 });
const sizedInfraCoreGenericIcon = h(VueIconify, { icon: icons.share, size: 18 });
const sizedInfraGenericIcon = h(VueIconify, { icon: icons.cloud, size: 21 });
const sizedEnterpriseGenericIcon = h(VueIconify, { icon: icons.activity, size: 19 });

void components;
void catalogStyles;
void sizedGenericIcon;
void sizedSecondaryGenericIcon;
void sizedCalendarGenericIcon;
void sizedTableGenericIcon;
void sizedSaasGenericIcon;
void sizedInfraCoreGenericIcon;
void sizedInfraGenericIcon;
void sizedEnterpriseGenericIcon;
