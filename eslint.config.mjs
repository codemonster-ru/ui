import coreConfig from './packages/core/eslint.config.js';
import codeblockConfig from './packages/codeblock/eslint.config.js';
import iconsConfig from './packages/icons/eslint.config.mjs';
import layoutsConfig from './packages/layouts/eslint.config.js';
import playgroundConfig from './packages/playground/eslint.config.mjs';
import playgroundCoreConfig from './packages/playground-core/eslint.config.mjs';
import themeConfig from './packages/theme/eslint.config.ts';
import examplePlaygroundConfig from './examples/playground/eslint.config.mjs';

function asArray(config) {
  return Array.isArray(config) ? config : [config];
}

export default [
  ...asArray(coreConfig),
  ...asArray(codeblockConfig),
  ...asArray(iconsConfig),
  ...asArray(layoutsConfig),
  ...asArray(playgroundConfig),
  ...asArray(playgroundCoreConfig),
  ...asArray(themeConfig),
  ...asArray(examplePlaygroundConfig),
];
