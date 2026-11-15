import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, h } from 'vue';
import { compareSignificantDom } from '../../../scripts/contracts/significant-dom.mjs';
import {
  CmAdminLayout,
  CmAdminShell,
  CmAppShell,
  CmAsideArea,
  CmAuthLayout,
  CmContentArea,
  CmDocumentLayout,
  CmErrorLayout,
  CmFooterArea,
  CmHeaderArea,
  CmSetupLayout,
  CmSidebarArea,
  VfContainer,
  VfGrid,
  VfInline,
  VfSection,
  VfStack,
  vfBreakpoints,
} from '../../layouts/dist/index.js';
import { cmBreakpoints } from '@codemonster-ru/ui-tokens';
import {
  CmColumnChooser,
  CmGroupBox,
  CmMenuBar,
  CmNavMenu,
  CmStepper,
  CmTableOfContents,
  CmThemeSwitch,
} from '../dist/index.js';

const packageDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('preserves historical layout primitive exports and the shared breakpoint registry', async () => {
  const vue = await import('../dist/index.js');
  assert.equal(VfContainer, vue.CmContainer);
  assert.equal(VfGrid, vue.CmGrid);
  assert.equal(VfInline, vue.CmInline);
  assert.equal(VfSection, vue.CmSection);
  assert.equal(VfStack, vue.CmStack);
  assert.equal(vfBreakpoints, cmBreakpoints);
});

/**
 * The components carried across after the VueForge line, plus the theme switch.
 *
 * The Razor adapter has been compared against these fixtures since it was written; the Vue adapter
 * had not been, so the canonical markup was being enforced on one side only.
 */
const components = {
  'admin-layout': CmAdminLayout,
  'admin-shell': CmAdminShell,
  'app-shell': CmAppShell,
  'aside-area': CmAsideArea,
  'auth-layout': CmAuthLayout,
  'content-area': CmContentArea,
  'document-layout': CmDocumentLayout,
  'error-layout': CmErrorLayout,
  'footer-area': CmFooterArea,
  'header-area': CmHeaderArea,
  'column-chooser': CmColumnChooser,
  'group-box': CmGroupBox,
  'menu-bar': CmMenuBar,
  'nav-menu': CmNavMenu,
  'setup-layout': CmSetupLayout,
  'sidebar-area': CmSidebarArea,
  stepper: CmStepper,
  'table-of-contents': CmTableOfContents,
  'theme-switch': CmThemeSwitch,
};

/**
 * A case file states slot content as markup, which Vue would render as escaped text. The canonical
 * fixture means it as elements, so the few cases that need real elements name them here rather than
 * weakening the comparison to make a string pass.
 */
function slotContent(content) {
  if (content === '<button type="button" data-cm-sidebar-toggle aria-expanded="true">Collapse</button>') {
    return h('button', { 'aria-expanded': 'true', 'data-cm-sidebar-toggle': '', type: 'button' }, 'Collapse');
  }
  if (content === '<label>Reference <input name="reference" value="PO-123" required></label>') {
    return h('label', ['Reference ', h('input', { name: 'reference', value: 'PO-123', required: true })]);
  }
  return content;
}

for (const [slug, component] of Object.entries(components)) {
  const casesDirectory = resolve(packageDirectory, `../../contracts/${slug}/cases`);
  const caseFiles = (await readdir(casesDirectory)).filter((file) => file.endsWith('.case.json')).sort();

  for (const caseFile of caseFiles) {
    test(`matches canonical ${slug} DOM for ${caseFile}`, async () => {
      const basename = caseFile.slice(0, -'.case.json'.length);
      const definition = JSON.parse(await readFile(resolve(casesDirectory, caseFile), 'utf8'));
      const expected = await readFile(resolve(casesDirectory, `${basename}.html`), 'utf8');
      const slots = Object.fromEntries(
        Object.entries(definition.slots ?? {}).map(([name, content]) => [name, () => slotContent(content)]),
      );
      const app = createSSRApp({
        render: () => h(component, { ...definition.attributes, ...definition.props }, slots),
      });
      if (definition.id === 'nav-menu-routes') {
        app.component('RouterLink', {
          props: { to: { type: [String, Object], required: true } },
          setup(props, { slots }) {
            return () =>
              h(
                'a',
                { href: typeof props.to === 'string' ? props.to : props.to.path + (props.to.hash ?? '') },
                slots.default?.(),
              );
          },
        });
      }
      const actual = await renderToString(app);
      const comparison = compareSignificantDom(expected, actual);

      assert.equal(comparison.equal, true, comparison.difference);
    });
  }
}
