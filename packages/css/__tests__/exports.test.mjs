import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';
import { URL } from 'node:url';

const packageUrl = new URL('../package.json', import.meta.url);
const manifest = JSON.parse(await readFile(packageUrl, 'utf8'));

test('publishes only the approved CSS subpath exports', async () => {
  assert.deepEqual(manifest.exports, {
    './accordion.css': './dist/components/accordion.css',
    './alert.css': './dist/components/alert.css',
    './avatar.css': './dist/components/avatar.css',
    './badge.css': './dist/components/badge.css',
    './breadcrumbs.css': './dist/components/breadcrumbs.css',
    './button.css': './dist/components/button.css',
    './card.css': './dist/components/card.css',
    './checkbox.css': './dist/components/checkbox.css',
    './command-palette.css': './dist/components/command-palette.css',
    './data-table.css': './dist/components/data-table.css',
    './date-picker.css': './dist/components/date-picker.css',
    './divider.css': './dist/components/divider.css',
    './dialog.css': './dist/components/dialog.css',
    './dropdown.css': './dist/components/dropdown.css',
    './drawer.css': './dist/components/drawer.css',
    './field.css': './dist/components/field.css',
    './foundation.css': './dist/foundation.css',
    './input.css': './dist/components/input.css',
    './link.css': './dist/components/link.css',
    './menu.css': './dist/components/menu.css',
    './popover.css': './dist/components/popover.css',
    './radio.css': './dist/components/radio.css',
    './select.css': './dist/components/select.css',
    './skeleton.css': './dist/components/skeleton.css',
    './switch.css': './dist/components/switch.css',
    './table.css': './dist/components/table.css',
    './textarea.css': './dist/components/textarea.css',
    './tabs.css': './dist/components/tabs.css',
    './tooltip.css': './dist/components/tooltip.css',
    './styles.css': './dist/styles.css',
  });

  for (const target of Object.values(manifest.exports)) {
    await access(new URL(`..${target.slice(1)}`, import.meta.url));
  }
});

test('marks only distributed CSS as side effects', () => {
  assert.deepEqual(manifest.sideEffects, ['./dist/*.css']);
  assert.equal(
    Object.keys(manifest.exports).some((name) => name.includes('foundation/')),
    false,
  );
  assert.equal(
    Object.keys(manifest.exports).some((name) => name.includes('primitives/')),
    false,
  );
});
