import assert from 'node:assert/strict';
import test from 'node:test';
import * as geometry from '@codemonster-ru/ui-icons';
import * as controls from '@codemonster-ru/ui-icons/controls';
import {
  coreIconNames,
  iconCatalog,
  iconFamilies,
  iconGroups,
  iconNames,
  icons,
  outlineIconVariants,
} from '@codemonster-ru/ui-icons/catalog';

test('keeps the complete historical catalogue ordered, unique and paired with geometry', () => {
  assert.equal(iconNames.length, 116);
  assert.equal(new Set(iconNames).size, iconNames.length);
  assert.deepEqual(new Set(iconNames), new Set(geometry.cmIconNames));
  assert.deepEqual(new Set(Object.keys(iconCatalog)), new Set(iconNames));
  assert.deepEqual(
    iconGroups.flatMap(({ icons }) => icons),
    [...iconNames],
  );
  assert.ok(coreIconNames.every((name) => iconNames.includes(name)));
  assert.equal(icons.arrowLeft, 'arrow-left');
  assert.equal(iconCatalog.arrowLeft.title, 'Arrow Left');
  assert.ok(iconCatalog.arrowLeft.keywords.includes('left'));

  for (const name of iconNames) {
    const { variants, brand } = iconCatalog[name];
    for (const family of iconFamilies) {
      const expected = family === 'duotone' && brand ? [] : variants.map((variant) => `${family}/${variant}`);
      const available = Object.keys(geometry[name]).filter((key) => key.startsWith(`${family}/`));
      assert.deepEqual(new Set(available), new Set(expected), `${name} ${family} variants drifted`);
    }
  }
  assert.deepEqual(outlineIconVariants, ['regular', 'light', 'thin']);
});

test('control imports keep just the regular rendering from the complete geometry', () => {
  for (const [name, icon] of Object.entries(controls)) {
    assert.deepEqual(icon, { 'classic/regular': geometry[name]['classic/regular'] }, name);
  }
});
