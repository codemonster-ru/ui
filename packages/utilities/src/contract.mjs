export const displayUtilities = Object.freeze({
  block: { display: 'block' },
  'inline-block': { display: 'inline-block' },
  inline: { display: 'inline' },
  flex: { display: 'flex' },
  'inline-flex': { display: 'inline-flex' },
  grid: { display: 'grid' },
  hidden: { display: 'none' },
});

export const flexUtilities = Object.freeze({
  'flex-row': { 'flex-direction': 'row' },
  'flex-col': { 'flex-direction': 'column' },
  'flex-wrap': { 'flex-wrap': 'wrap' },
  'flex-nowrap': { 'flex-wrap': 'nowrap' },
  'items-start': { 'align-items': 'flex-start' },
  'items-center': { 'align-items': 'center' },
  'items-end': { 'align-items': 'flex-end' },
  'items-stretch': { 'align-items': 'stretch' },
  'justify-start': { 'justify-content': 'flex-start' },
  'justify-center': { 'justify-content': 'center' },
  'justify-end': { 'justify-content': 'flex-end' },
  'justify-between': { 'justify-content': 'space-between' },
});

export const gridUtilities = Object.freeze(
  Object.fromEntries(
    [1, 2, 3, 4, 6, 12].map((columns) => [
      `grid-cols-${columns}`,
      { 'grid-template-columns': `repeat(${columns}, minmax(0, 1fr))` },
    ]),
  ),
);

const spacingProperties = Object.freeze({
  m: 'margin',
  mt: 'margin-block-start',
  me: 'margin-inline-end',
  mb: 'margin-block-end',
  ms: 'margin-inline-start',
  mx: 'margin-inline',
  my: 'margin-block',
  p: 'padding',
  pt: 'padding-block-start',
  pe: 'padding-inline-end',
  pb: 'padding-block-end',
  ps: 'padding-inline-start',
  px: 'padding-inline',
  py: 'padding-block',
});

export const spacingUtilities = Object.freeze(
  Object.fromEntries(
    cmSpacingTokenNames.flatMap((tokenName) => {
      const suffix = tokenName.slice('space'.length);
      const value = tokenVariable(tokenName);
      return [
        ...Object.entries(spacingProperties).map(([prefix, property]) => [
          `${prefix}-${suffix}`,
          { [property]: value },
        ]),
        [`gap-${suffix}`, { gap: value }],
        [`row-gap-${suffix}`, { 'row-gap': value }],
        [`column-gap-${suffix}`, { 'column-gap': value }],
      ];
    }),
  ),
);

export const sizingUtilities = Object.freeze({
  'w-full': { 'inline-size': '100%' },
  'min-w-0': { 'min-inline-size': '0' },
  'h-full': { 'block-size': '100%' },
  ...Object.fromEntries(
    cmSizingTokenNames
      .filter((name) => name.startsWith('controlHeight'))
      .map((name) => [
        `h-control-${name.slice('controlHeight'.length).toLowerCase()}`,
        { 'block-size': tokenVariable(name) },
      ]),
  ),
  ...Object.fromEntries(
    cmSizingTokenNames
      .filter((name) => name.startsWith('iconSize'))
      .map((name) => {
        const value = tokenVariable(name);
        return [
          `size-icon-${name.slice('iconSize'.length).toLowerCase()}`,
          { 'block-size': value, 'inline-size': value },
        ];
      }),
  ),
});
import {
  cmSizingTokenNames,
  cmSpacingTokenNames,
  serializeCmThemeTokensToCssVars,
} from '@codemonster-ru/ui-tokens';

function tokenVariable(name) {
  const [variable] = Object.keys(serializeCmThemeTokensToCssVars({ [name]: '' }));
  return `var(${variable})`;
}
