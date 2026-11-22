import { cmTypographyTokens } from '@codemonster-ru/ui-tokens';
import { CmDivider, CmGrid, CmLink, CmPanel, CmStack } from '@codemonster-ru/ui-vue';
import { h, type CSSProperties, type VNode } from 'vue';

const text = 'Aa Бб 012345';
const sizeScale = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs'];
const families = ['base', 'heading', 'mono'];
const weights = [
  ['regular', cmTypographyTokens.fontWeightRegular],
  ['medium', cmTypographyTokens.fontWeightMedium],
  ['semibold', cmTypographyTokens.fontWeightSemibold],
  ['bold', cmTypographyTokens.fontWeightBold],
];
const leading = [
  ['tight', cmTypographyTokens.lineHeightTight],
  ['normal', cmTypographyTokens.lineHeightNormal],
  ['relaxed', cmTypographyTokens.lineHeightRelaxed],
];

function section(title: string, samples: VNode[]) {
  return h(CmStack, { class: 'showcase-variant' }, () => [
    h('h3', { class: 'showcase-variant-title' }, title),
    ...samples,
  ]);
}

function sample(label: string, style: CSSProperties, content = text, heading?: string) {
  return h(CmGrid, { class: 'showcase-typography-row' }, () => [
    h('code', { class: 'showcase-api-label' }, label),
    h(heading ?? 'p', { style, 'aria-hidden': heading ? true : undefined }, content),
  ]);
}

function renderSamples(path: string) {
  return h(CmGrid, { class: 'showcase-typography' }, () => [
    section(
      'Headings and sizes',
      sizeScale.map((size, index) => {
        const heading = index < 6 ? `h${index + 1}` : undefined;
        return sample(
          heading ? `${heading} · ${size}` : size,
          {
            fontSize: `var(--cm-font-size-${size})`,
            fontFamily: heading ? 'var(--cm-font-family-heading)' : 'var(--cm-font-family-base)',
            fontWeight: heading ? 'var(--cm-font-weight-bold)' : 'var(--cm-font-weight-regular)',
            lineHeight: heading ? 'var(--cm-line-height-tight)' : 'var(--cm-line-height-normal)',
          },
          'Release notes',
          heading,
        );
      }),
    ),
    section(
      'Font families',
      families.map((family) => sample(family, { fontFamily: `var(--cm-font-family-${family})` })),
    ),
    section(
      'Font weights',
      weights.map(([weight, value]) =>
        sample(`${weight} · ${value}`, { fontWeight: `var(--cm-font-weight-${weight})` }),
      ),
    ),
    section(
      'Line heights',
      leading.map(([height, value]) =>
        sample(
          `${height} · ${value}`,
          { lineHeight: `var(--cm-line-height-${height})`, whiteSpace: 'pre-line' },
          'Publish updates.\nReview changes.',
        ),
      ),
    ),
    section(
      'Text roles',
      ['body', 'label', 'caption'].map((role) =>
        sample(role, {
          fontSize: `var(--cm-text-${role}-font-size)`,
          fontWeight: `var(--cm-text-${role}-font-weight)`,
          lineHeight: `var(--cm-text-${role}-line-height)`,
        }),
      ),
    ),
    section('Native HTML', [
      h('p', [
        'A paragraph with a ',
        h(CmLink, { href: `${path}#typography`, underline: 'always' }, () => 'link'),
        ', ',
        h('strong', 'bold text'),
        ', and ',
        h('code', 'inline code'),
        '.',
      ]),
      h('p', { lang: 'ru' }, 'Обновление доступно. Откройте журнал изменений.'),
      h('ul', [h('li', 'Unordered item')]),
      h('ol', [h('li', 'Ordered item')]),
      h('blockquote', 'Blockquote'),
    ]),
  ]);
}

export function renderShowcaseTypography(path = '') {
  return h(
    CmPanel,
    { id: 'typography', class: 'showcase-group', 'aria-labelledby': 'showcase-typography-title', tabindex: -1 },
    {
      header: () => h('h2', { id: 'showcase-typography-title', class: 'showcase-component-title' }, 'Typography'),
      default: () => [h(CmDivider, { 'aria-hidden': 'true' }), renderSamples(path)],
    },
  );
}
