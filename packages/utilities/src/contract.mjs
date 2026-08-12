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
