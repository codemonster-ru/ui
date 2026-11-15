import { historicalComponentEntries } from '../build/historical-component-entries.mjs';

const packages = [
  ['@codemonster-ru/vueforge-core', '@codemonster-ru/ui-vue'],
  ['@codemonster-ru/vueforge-layouts', '@codemonster-ru/ui-layouts'],
];
const aliases = packages.flatMap(([legacy, current]) =>
  historicalComponentEntries(current).map(({ slug }) => {
    const from = JSON.stringify(`^${legacy}/${slug}$`);
    const to = JSON.stringify(`${current}/historical/${slug}`);
    return `  { find: new RegExp(${from}, 'u'), replacement: ${to} },`;
  }),
);

console.log(
  ['// Generated Vite aliases for VueForge component subpaths.', 'export default [', ...aliases, '];'].join('\n'),
);
