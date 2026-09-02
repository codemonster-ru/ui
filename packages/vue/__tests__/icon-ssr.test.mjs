import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import * as iconGeometry from '../../icons/dist/index.js';
import { CmIcon } from '../dist/index.js';

const casesDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../../contracts/icon/cases');
const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

for (const caseFile of caseFiles) {
  test(`matches canonical icon DOM for ${caseFile}`, async () => {
    const basename = caseFile.slice(0, -'.case.json'.length);
    const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
    const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');

    // A case names its icon; Vue takes the geometry itself, so the name is resolved here rather than
    // the component carrying a registry the Razor adapter would have to mirror.
    const props = { ...definition.props, icon: iconGeometry[definition.props.icon] };
    assert.ok(props.icon, `Unknown icon in fixture: ${definition.props.icon}.`);

    const actual = await renderToString(createSSRApp({ render: () => h(CmIcon, props) }));
    const comparison = compareSignificantDom(expected, actual);

    assert.equal(comparison.equal, true, comparison.difference);
  });
}

test('renders every generated icon without an empty body', async () => {
  for (const name of iconGeometry.cmIconNames) {
    const html = await renderToString(createSSRApp({ render: () => h(CmIcon, { icon: iconGeometry[name] }) }));
    assert.match(html, /<svg[^>]*>.+<\/svg>/u, `Icon ${name} rendered an empty body.`);
  }
});
