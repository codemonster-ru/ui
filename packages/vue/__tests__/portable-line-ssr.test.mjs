import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import { CmAdminLayout, CmAdminShell, CmSetupLayout } from '../../layouts/dist/index.js';
import { CmColumnChooser, CmMenuBar, CmNavMenu, CmStepper, CmTableOfContents, CmThemeSwitch } from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The components carried across after the VueForge line, plus the theme switch.
 *
 * The Razor adapter has been compared against these fixtures since it was written; the Vue adapter
 * had not been, so the canonical markup was being enforced on one side only.
 */
const components = {
  'admin-layout': CmAdminLayout,
  'admin-shell': CmAdminShell,
  'column-chooser': CmColumnChooser,
  'menu-bar': CmMenuBar,
  'nav-menu': CmNavMenu,
  'setup-layout': CmSetupLayout,
  stepper: CmStepper,
  'table-of-contents': CmTableOfContents,
  'theme-switch': CmThemeSwitch,
};

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const slots = Object.fromEntries(
        Object.entries(definition.slots ?? {}).map(([name, content]) => [name, () => content]),
      );
      const actual = await renderToString(
        createSSRApp({ render: () => h(component, { ...definition.attributes, ...definition.props }, slots) }),
      );
      const comparison = compareSignificantDom(expected, actual);

      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}
