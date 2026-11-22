import { defineComponent, type PropType } from 'vue';
import { showcaseComponentCases, showcasePanelExamples, type ShowcaseCase } from '../../shared/showcase-cases.mts';
import { renderShowcasePanel, staticShowcaseContent } from '../../shared/showcase-render.mts';

const manifests = import.meta.glob<Parameters<typeof showcaseComponentCases>[2]>('../../../contracts/*/manifest.json', {
  eager: true,
  import: 'default',
});
const fixtures = import.meta.glob<ShowcaseCase>('../../../contracts/*/cases/*.case.json', {
  eager: true,
  import: 'default',
});
const byComponent = new Map<string, ShowcaseCase[]>();
for (const [path, fixture] of Object.entries(fixtures)) {
  const slug = path.split('/').at(-3)!;
  const cases = byComponent.get(slug) ?? [];
  cases.push(fixture);
  byComponent.set(slug, cases);
}
const options = {
  avatar: new URL('../../vanilla/avatar.png', import.meta.url).href,
  staticContent: staticShowcaseContent,
};

export default defineComponent({
  name: 'ContractExamples',
  props: {
    slug: { type: String, required: true },
    heading: { type: String as PropType<'h2' | 'h3'>, default: 'h3' },
  },
  setup({ slug, heading }, { slots }) {
    const examples = showcasePanelExamples(slug, (component) =>
      showcaseComponentCases(
        component,
        byComponent.get(component) ?? [],
        manifests[`../../../contracts/${component}/manifest.json`],
      ),
    );
    return () => renderShowcasePanel(slug, heading, examples, options, slots.default);
  },
});
