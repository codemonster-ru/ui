// Generates the neutral icon data VfInput needs, from the Vue icon system.
//
// The Vue icons package stays the single geometry owner. This script
// server-renders the three glyphs the Input closure uses and writes their shape
// as plain data, so the Razor adapter can draw the same icons without importing
// a Vue component. Nothing here is hand-transcribed: re-running it is the only
// supported way to change the artifact, and scripts/ci/check-icon-data.mjs
// fails when a committed copy drifts from a fresh render.
//
// Run through vite-node so the real SFC is compiled:
//   npx vite-node --config scripts/build/icon-data.vite.config.mts \
//     scripts/build/generate-input-icon-data.mjs
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSSRApp, h } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { VueIconify } from '../../packages/icons/src/lib/index.ts';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

// The glyph names VfInput.vue asks for: `icons.xmark`, `icons.eye` and
// `icons.eyeSlash` resolve to these kebab-case names.
export const inputIconNames = ['xmark', 'eye', 'eye-slash'];

const SIZE_PLACEHOLDER = '__VF_ICON_SIZE__';

// The Vue icon gets its layout from a `<style scoped>` block, which compiles to
// selectors carrying a scope attribute. Razor markup has no such attribute, so
// the layout would simply not apply. The declarations are read out of the built
// icons stylesheet and carried in the neutral data as inline style, which keeps
// packages/icons the single owner: nothing here is transcribed, and re-running
// the generator re-derives it.
function readScopedIconLayout() {
  const cssPath = resolve(repositoryRoot, 'packages/icons/dist/index.css');
  const css = readFileSync(cssPath, 'utf8');
  const layout = {};

  for (const [, selector, declarations] of css.matchAll(/(\.vf-icon(?:-wrapper)?)\[data-v-[0-9a-f]+\]\{([^}]*)\}/g)) {
    // Custom properties are already emitted inline by the component itself;
    // only the layout declarations are missing from the markup.
    const layoutOnly = declarations
      .split(';')
      .map((declaration) => declaration.trim())
      .filter((declaration) => declaration !== '' && !declaration.startsWith('--'))
      .join(';');

    if (layoutOnly !== '') {
      layout[selector] = layoutOnly;
    }
  }

  if (!layout['.vf-icon-wrapper'] || !layout['.vf-icon']) {
    throw new Error(
      'Could not read the scoped icon layout from packages/icons/dist/index.css. Build the icons package first.',
    );
  }

  return layout;
}

function parseRenderedIcon(name, html) {
  const wrapper = html.match(/^<span class="([^"]*)" style="([^"]*)">(.*)<\/span>$/s);
  if (!wrapper) {
    throw new Error(`Unexpected wrapper markup for icon "${name}".`);
  }

  const [, wrapperClass, wrapperStyle, svgMarkup] = wrapper;
  const svg = svgMarkup.match(/^<svg ([^>]*)>(.*)<\/svg>$/s);
  if (!svg) {
    throw new Error(`Unexpected svg markup for icon "${name}".`);
  }

  const [, attributeSource, body] = svg;
  const attributes = {};
  for (const [, attributeName, value] of attributeSource.matchAll(/([a-zA-Z:-]+)="([^"]*)"/g)) {
    attributes[attributeName] = value;
  }

  if (attributes.width !== SIZE_PLACEHOLDER || attributes.height !== SIZE_PLACEHOLDER) {
    throw new Error(`Icon "${name}" did not render the size placeholder; the icon API may have changed.`);
  }

  delete attributes.width;
  delete attributes.height;

  // Self-closing form keeps the data usable by a plain string renderer.
  const normalisedBody = body.replace(/><\/(path|circle|line|rect|polyline|polygon|ellipse)>/g, '/>');

  return { wrapperClass, wrapperStyle, attributes, body: normalisedBody };
}

async function renderIcon(name) {
  const app = createSSRApp({ render: () => h(VueIconify, { icon: name, size: SIZE_PLACEHOLDER }) });
  app.config.warnHandler = () => {};

  return parseRenderedIcon(name, await renderToString(app));
}

export async function buildInputIconData() {
  const layout = readScopedIconLayout();
  const icons = {};

  for (const name of inputIconNames) {
    const icon = await renderIcon(name);
    icon.wrapperStyle = `${icon.wrapperStyle}${layout['.vf-icon-wrapper']};`;
    icon.attributes = { ...icon.attributes, style: layout['.vf-icon'] };
    icons[name] = icon;
  }

  return {
    $comment:
      'Generated from packages/icons by scripts/build/generate-input-icon-data.mjs. Do not edit by hand; run the generator.',
    icons,
  };
}

export const inputIconDataTargets = [
  'packages/shared-core/src/icons/input-icon-data.json',
  'packages/razor/resources/icons/input-icon-data.json',
];

export function serialiseInputIconData(data) {
  return `${JSON.stringify(data, null, 2)}\n`;
}

// `--write` regenerates the artifacts; the default mode compares the committed
// copies against a fresh render and fails on drift, so neither the canonical
// file nor the packaged Razor copy can be edited by hand.
const shouldWrite = process.argv.includes('--write');
const serialised = serialiseInputIconData(await buildInputIconData());
const differences = [];

for (const target of inputIconDataTargets) {
  const absolutePath = resolve(repositoryRoot, target);

  if (shouldWrite) {
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, serialised);
    process.stdout.write(`Wrote ${target}\n`);
    continue;
  }

  if (!existsSync(absolutePath)) {
    differences.push(`${target}: missing; run npm run icons:input-data -- --write`);
    continue;
  }

  if (readFileSync(absolutePath, 'utf8') !== serialised) {
    differences.push(`${target}: differs from a fresh render of the Vue icon system`);
  }
}

if (differences.length > 0) {
  process.stderr.write(`Input icon data drifted:\n  - ${differences.join('\n  - ')}\n`);
  process.exit(1);
}

if (!shouldWrite) {
  process.stdout.write(
    `Input icon data matches the Vue icon system: ${inputIconNames.length} glyphs, ` +
      `${inputIconDataTargets.length} artifacts in sync.\n`,
  );
}
