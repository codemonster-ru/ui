import {
  primaryReferenceCase,
  referenceCatalog,
  referenceSupplements,
  renderReferenceDetail,
  renderReferenceIndex,
  renderReferenceSupplement,
} from '../../examples/shared/showcase-component-reference.mts';

export function renderComponentReference(groups, components, casesByComponent, renderCases) {
  const catalog = referenceCatalog(groups, components);
  const details = new Map(
    [...components].map(([slug, component]) => {
      const cases = casesByComponent.get(slug).map(({ data, canonicalHtml }) => ({ ...data, canonicalHtml }));
      const example = primaryReferenceCase(slug, cases);
      return [
        slug,
        renderReferenceDetail({
          component,
          example,
          catalog,
          preview: renderCases(slug, { only: example.id, heading: 'h3' }),
          variants: renderCases(slug, { except: example.id, heading: 'h3' }),
        }),
      ];
    }),
  );
  for (const supplement of referenceSupplements) {
    details.set(supplement.slug, renderReferenceSupplement(supplement, catalog));
  }
  return [renderReferenceIndex(groups, components), details];
}
