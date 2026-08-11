import { readFileSync } from 'node:fs';

const identifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;

function escapeAttribute(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function validateUniqueNames(items, field, errors) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item.name)) {
      errors.push(`Duplicate visual ${field} name: ${item.name}.`);
    }
    seen.add(item.name);
  }
}

export function validateVisualConfig(config) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['Visual fixture configuration must be an object.'];
  }
  if (config.schemaVersion !== 1) {
    errors.push('Visual fixture schemaVersion must be 1.');
  }
  if (!Array.isArray(config.themes) || config.themes.length === 0) {
    errors.push('Visual fixture configuration requires at least one theme.');
  } else {
    validateUniqueNames(config.themes, 'theme', errors);
    for (const theme of config.themes) {
      if (!identifierPattern.test(theme.name) || typeof theme.attribute !== 'string' || theme.attribute === '') {
        errors.push('Each visual theme requires a kebab-case name and non-empty attribute.');
      }
    }
  }
  if (!Array.isArray(config.viewports) || config.viewports.length === 0) {
    errors.push('Visual fixture configuration requires at least one viewport.');
  } else {
    validateUniqueNames(config.viewports, 'viewport', errors);
    for (const viewport of config.viewports) {
      if (
        !identifierPattern.test(viewport.name) ||
        !Number.isInteger(viewport.width) ||
        viewport.width < 1 ||
        !Number.isInteger(viewport.height) ||
        viewport.height < 1
      ) {
        errors.push('Each visual viewport requires a kebab-case name and positive integer dimensions.');
      }
    }
  }
  if (!Array.isArray(config.stylesheets) || config.stylesheets.some((value) => typeof value !== 'string' || !value)) {
    errors.push('Visual fixture stylesheets must be an array of non-empty strings.');
  }
  return errors;
}

export function readVisualConfig(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function selectByName(items, selectedNames, label, caseId) {
  if (!selectedNames) {
    return items;
  }
  const byName = new Map(items.map((item) => [item.name, item]));
  return selectedNames.map((name) => {
    const item = byName.get(name);
    if (!item) {
      throw new Error(`${caseId} selects unknown visual ${label} ${name}.`);
    }
    return item;
  });
}

export function createVisualDocument({ canonicalHtml, fixtureId, stylesheets, theme }) {
  const stylesheetLinks = stylesheets
    .map((href) => `    <link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join('\n');
  return `<!doctype html>
<html lang="en" data-cm-theme="${escapeAttribute(theme.attribute)}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeAttribute(fixtureId)}</title>
${stylesheetLinks ? `${stylesheetLinks}\n` : ''}    <style>
      html { color-scheme: light dark; }
      body { margin: 0; }
      .cm-visual-root { box-sizing: border-box; min-height: 100vh; padding: 24px; }
    </style>
  </head>
  <body>
    <main class="cm-visual-root" data-cm-visual-fixture="${escapeAttribute(fixtureId)}">
${canonicalHtml.trim()}
    </main>
  </body>
</html>
`;
}

export function createVisualFixtureMatrix(componentCases, config, { platform = 'canonical' } = {}) {
  const configErrors = validateVisualConfig(config);
  if (configErrors.length > 0) {
    throw new Error(`Invalid visual fixture configuration:\n${configErrors.join('\n')}`);
  }
  if (!identifierPattern.test(platform)) {
    throw new Error(`Visual platform must use lowercase kebab-case: ${platform}.`);
  }

  const fixtures = [];
  for (const componentCase of componentCases) {
    if (componentCase.data.visual?.enabled === false) {
      continue;
    }
    const themes = selectByName(config.themes, componentCase.data.visual?.themes, 'theme', componentCase.id);
    const viewports = selectByName(
      config.viewports,
      componentCase.data.visual?.viewports,
      'viewport',
      componentCase.id,
    );
    for (const theme of themes) {
      for (const viewport of viewports) {
        const id = `${componentCase.id}--${theme.name}--${viewport.name}`;
        fixtures.push({
          caseId: componentCase.id,
          document: createVisualDocument({
            canonicalHtml: componentCase.canonicalHtml,
            fixtureId: id,
            stylesheets: config.stylesheets,
            theme,
          }),
          id,
          platform,
          snapshotPath: `${platform}/${id}.png`,
          theme: theme.name,
          viewport: { height: viewport.height, name: viewport.name, width: viewport.width },
        });
      }
    }
  }
  return fixtures;
}
