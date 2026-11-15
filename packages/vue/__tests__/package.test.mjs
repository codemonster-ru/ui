import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToString } from '@vue/server-renderer';
import { h } from 'vue';

test('publishes the Vue component adapter entries', async () => {
  const entry = await import('@codemonster-ru/ui-vue');

  assert.deepEqual(Object.keys(entry), [
    'CmAccordion',
    'CmAlert',
    'CmAvatar',
    'CmBadge',
    'CmBreadcrumbs',
    'CmButton',
    'CmCard',
    'CmCheckbox',
    'CmColumnChooser',
    'CmCommandPalette',
    'CmConfirmDialog',
    'CmContainer',
    'CmDataTable',
    'CmDatePicker',
    'CmDialog',
    'CmDivider',
    'CmDrawer',
    'CmDropdown',
    'CmField',
    'CmFieldset',
    'CmFormLayout',
    'CmGrid',
    'CmGroupBox',
    'CmIcon',
    'CmIconButton',
    'CmInline',
    'CmInput',
    'CmLink',
    'CmMenu',
    'CmMenuBar',
    'CmNavMenu',
    'CmPageHeader',
    'CmPanel',
    'CmPopover',
    'CmProgressBar',
    'CmProgressSpinner',
    'CmRadio',
    'CmSection',
    'CmSelect',
    'CmSkeleton',
    'CmSkeletonGate',
    'CmStack',
    'CmStepper',
    'CmSwitch',
    'CmTable',
    'CmTableOfContents',
    'CmTabs',
    'CmTag',
    'CmTextarea',
    'CmThemeProvider',
    'CmThemeSwitch',
    'CmTooltip',
    'VfButton',
    'VfCommandPalette',
    'VfConfirmDialog',
    'VfField',
    'VfFormLayout',
    'VfGroupBox',
    'VfLink',
    'VfPageHeader',
    'VfPanel',
    'VfProgressBar',
    'VfSkeletonGate',
    'VfStepper',
    'VfTable',
    'VfTabs',
    'VfThemeProvider',
    'VfThemeSwitch',
    'VfTooltip',
    'createAsyncWithSkeleton',
    'useCmTheme',
    'useTheme',
  ]);
  assert.equal(entry.CmAccordion.__name, 'CmAccordion');
  assert.equal(entry.CmButton.__name, 'CmButton');
  assert.equal(entry.CmCard.__name, 'CmCard');
  assert.equal(entry.CmField.__name, 'CmField');
  assert.equal(entry.CmFieldset.__name, 'CmFieldset');
  assert.equal(entry.CmIconButton.__name, 'CmIconButton');
  assert.equal(entry.CmInput.__name, 'CmInput');
  assert.equal(entry.CmProgressBar.__name, 'CmProgressBar');
  assert.equal(entry.CmProgressSpinner.__name, 'CmProgressSpinner');
  assert.equal(entry.CmAlert.__name, 'CmAlert');
  assert.equal(entry.CmAvatar.__name, 'CmAvatar');
  assert.equal(entry.CmBadge.__name, 'CmBadge');
  assert.equal(entry.CmDivider.__name, 'CmDivider');
  assert.equal(entry.CmSkeleton.__name, 'CmSkeleton');
});

test('publishes the opt-in historical icon and Vue components', async () => {
  const entry = await import('@codemonster-ru/ui-vue/historical');

  assert.deepEqual(Object.keys(entry), [
    'VfAccordion',
    'VfAlert',
    'VfAvatar',
    'VfBadge',
    'VfCheckbox',
    'VfDataTableColumnChooser',
    'VfDatePicker',
    'VfDialog',
    'VfDrawer',
    'VfDropdown',
    'VfIconButton',
    'VfInput',
    'VfMenu',
    'VfMenuItem',
    'VfNavMenu',
    'VfPopover',
    'VfProgressSpinner',
    'VfRadio',
    'VfSelect',
    'VfSwitch',
    'VfTableOfContents',
    'VfTag',
    'VueIconify',
    'useTableOfContents',
  ]);
  assert.match(await renderToString(h(entry.VfMenu, null, () => 'Actions')), /role="menu"[\s\S]*Actions/u);
  assert.match(await renderToString(h(entry.VueIconify)), /<svg[^>]+aria-hidden="true"/u);
  const navMenu = await renderToString(
    h(entry.VfNavMenu, {
      items: [{ value: 'home', label: 'Home', href: '/', leadingIcon: 'house' }],
      defaultValue: 'home',
      variant: 'sidebar',
      compact: true,
    }),
  );
  assert.match(navMenu, /cm-nav-menu--sidebar-compact/u);
  assert.match(navMenu, /aria-current="page"[^>]*>[\s\S]*<svg[^>]*cm-nav-menu__leading-icon/u);
  const button = await renderToString(
    h(entry.VfIconButton, { icon: 'gear', variant: 'warn', 'aria-label': 'Settings' }),
  );
  assert.match(button, /<button[^>]*class="[^"]*cm-icon-button--warn/u);
  assert.match(button, /aria-label="Settings"[\s\S]*<svg/u);
  const select = await renderToString(
    h(entry.VfSelect, {
      'aria-label': 'Frequency',
      leadingIcon: 'gear',
      placement: 'bottom-end',
      options: [{ value: 'weekly', label: 'Weekly' }],
    }),
  );
  const listboxId = /aria-controls="([^"]+)"/u.exec(select)?.[1];
  assert.ok(listboxId);
  assert.ok(select.includes(`id="${listboxId}"`));
  assert.match(select, /cm-select__icon--leading[\s\S]*<svg/u);
  assert.match(select, /data-cm-placement="bottom-end"/u);
  assert.equal(typeof entry.useTableOfContents, 'function');
  const contents = await renderToString(
    h(entry.VfTableOfContents, {
      ariaLabel: 'On this page',
      activeId: 'intro',
      scrollOffset: 64,
      variant: 'pills',
      items: [
        { id: 'intro', label: 'Intro' },
        { id: 'appendix', label: 'Appendix', href: '/appendix', level: 2 },
      ],
    }),
  );
  assert.match(contents, /cm-table-of-contents--pills/u);
  assert.match(contents, /aria-label="On this page"/u);
  assert.match(contents, /data-cm-toc-scroll-offset="64"/u);
  assert.match(contents, /href="#intro" aria-current="location">Intro/u);
  assert.match(contents, /href="\/appendix">Appendix/u);
});

test('server-renders historical overlays around a single authored trigger', async () => {
  const { VfDropdown, VfPopover } = await import('@codemonster-ru/ui-vue/historical');
  for (const [component, popup] of [
    [VfDropdown, 'menu'],
    [VfPopover, 'dialog'],
  ]) {
    const source = await renderToString(
      h(
        component,
        { disableTeleport: true },
        {
          trigger: () => h('button', { class: 'custom-trigger' }, 'Details'),
          default: () => 'More information',
        },
      ),
    );
    assert.equal((source.match(/<button\b/gu) ?? []).length, 1);
    assert.match(source, /class="custom-trigger"/u);
    assert.ok(source.includes(`aria-haspopup="${popup}"`));
    const panelId = /aria-controls="([^"]+)"/u.exec(source)?.[1];
    assert.ok(panelId && source.includes(`id="${panelId}"`));
  }
});

test('server-renders the historical chooser with a named gear trigger and required column', async () => {
  const { VfDataTableColumnChooser } = await import('@codemonster-ru/ui-vue/historical');
  const source = await renderToString(
    h(VfDataTableColumnChooser, {
      id: 'project-columns',
      columns: [{ key: 'name', header: 'Name' }],
      modelValue: [],
      requiredColumnKeys: ['name'],
    }),
  );
  assert.match(source, /<button[^>]*aria-label="Configure columns"[^>]*>/);
  assert.match(source, /<svg/);
  assert.match(source, /<input[^>]*data-cm-column-chooser-key="name"[^>]*checked[^>]*disabled/);
});

test('generates historical modal ids and names without requiring a visible title', async () => {
  const { VfDialog, VfDrawer } = await import('@codemonster-ru/ui-vue/historical');
  for (const [component, name] of [
    [VfDialog, 'Dialog'],
    [VfDrawer, 'Drawer'],
  ]) {
    const source = await renderToString(h(component, { defaultOpen: true, closable: false }, () => 'Settings'));
    assert.match(source, /<dialog[^>]*\bid="[^"]+"[^>]*\bopen\b/u);
    assert.ok(source.includes(`aria-label="${name}"`));
    assert.doesNotMatch(source, /<h2|<button/u);
  }
});
