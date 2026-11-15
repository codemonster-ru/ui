import {
  primaryReferenceCase,
  referenceSupplements,
  renderReferenceDetail,
  renderReferenceIndex,
  renderReferenceSupplement,
} from '../../examples/shared/showcase-component-reference.mts';

export function renderComponentReference(groups, components, casesByComponent, renderCases) {
  const details = new Map(
    [...components].map(([slug, component]) => {
      const cases = casesByComponent.get(slug).map(({ data, canonicalHtml }) => ({ ...data, canonicalHtml }));
      const example = primaryReferenceCase(slug, cases);
      return [
        slug,
        renderReferenceDetail(
          component,
          example,
          renderCases(slug, { only: example.id, heading: 'h3' }),
          renderCases(slug, { except: example.id, heading: 'h3' }),
        ),
      ];
    }),
  );
  for (const supplement of referenceSupplements) {
    details.set(supplement.slug, renderReferenceSupplement(supplement));
  }
  return [renderReferenceIndex(groups, components), details];
}
