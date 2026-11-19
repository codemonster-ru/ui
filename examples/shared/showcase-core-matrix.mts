import { folder, house, resolveCmIcon } from '@codemonster-ru/ui-icons';
import { tones } from './showcase-matrices.mts';
import { renderShowcaseTabs } from './showcase-tabs.mts';

const releaseTabs = [
  'Overview',
  'API',
  'Status',
  'Roadmap',
  'Examples',
  'Docs',
  'Testing',
  'Releases',
  'Changelog',
  'A11y',
  'Community',
].map((title) => ({ title, panel: title + ' content.' }));

const examples: Record<string, readonly string[]> = {
  tooltip: ['top', 'bottom', 'start', 'end'],
  popover: ['default', 'composed'],
  dropdown: ['default', 'composed', 'pills'],
  card: ['regions', 'compact'],
  avatar: ['image', 'label'],
  badge: ['default', 'danger'],
  tag: ['default'],
  divider: ['horizontal', 'vertical'],
  fieldset: ['default'],
  table: ['default', 'presentation'],
  'data-table': ['default', 'interactive', 'empty'],
  'column-chooser': ['default'],
  alert: [...tones, 'without-icon'],
  'progress-bar': ['determinate', 'indeterminate'],
  'progress-spinner': ['default', 'danger-lg'],
  skeleton: ['default', 'static-height'],
  field: ['default', 'help-error'],
  input: ['default', 'invalid', 'disabled', 'readonly'],
  textarea: ['default', 'invalid'],
  select: ['default', 'selected', 'clearable'],
  'date-picker': ['default', 'clearable'],
  checkbox: ['default', 'checked', 'indeterminate'],
  radio: ['default', 'checked', 'disabled'],
  switch: ['default', 'checked', 'disabled'],
  breadcrumbs: ['default'],
  menu: ['default'],
  'menu-bar': ['default', 'pills'],
  'nav-menu': ['inline', 'pills', 'sidebar', 'collapsed', 'wrapping-labels', 'routes'],
  'table-of-contents': ['default', 'pills'],
  stepper: ['horizontal', 'vertical'],
  tabs: ['release', 'release-overflow', 'disabled'],
  accordion: ['one-open', 'multiple-open'],
  dialog: ['default'],
  drawer: ['default'],
  'command-palette': ['default'],
};

export function renderCoreMatrix(slug: string, read: (id: string) => string | undefined, avatar: string) {
  const cases = examples[slug];
  if (!cases) return '';
  return `<div class="core-example-grid">${cases
    .map((name) => {
      const id = `${slug}-${name}`;
      const source = coreExampleSource(slug, name, read);
      if (source === undefined) throw new Error(`Missing showcase matrix case: ${id}`);
      const ids = new Set([...source.matchAll(/\bid="([^"]+)"/gu)].map((match) => match[1]));
      const prefix = `matrix-${id}-`;
      const exampleTitle = name.replaceAll('-', ' ');
      const matrixLabel = `${coreComponentTitle(slug)} · ${exampleTitle}`;
      const labelId = `${prefix}label`;
      const closedSource =
        slug === 'dropdown' && (name === 'composed' || name === 'pills')
          ? source
              .replace(' cm-dropdown--open', '')
              .replace('aria-expanded="true"', 'aria-expanded="false"')
              .replace('data-cm-controller="menu"', 'data-cm-controller="menu" hidden')
          : source;
      const html = closedSource
        .replaceAll('src="/avatar.png"', `src="${avatar}"`)
        .replace(/(<nav\b[^>]*\baria-label="[^"]+)"/gu, `$1 · ${matrixLabel}"`)
        .replace(
          /class="(cm-(?:data-)?table__scroll)"/gu,
          `class="$1" role="region" aria-label="${matrixLabel}" tabindex="0"`,
        )
        .replace(
          /\b(id|name|for|form|list|aria-controls|aria-describedby|aria-labelledby|aria-activedescendant|aria-owns)="([^"]+)"/gu,
          (_, attribute: string, value: string) =>
            `${attribute}="${value
              .split(' ')
              .map((token) => (attribute === 'name' || ids.has(token) ? prefix + token : token))
              .join(' ')}"`,
        )
        .replace(/href="#([^"]+)"/gu, (match, target: string) =>
          ids.has(target) ? `href="#${prefix}${target}"` : match,
        )
        .replace(/(class="cm-accordion__panel"[^>]*\baria-labelledby="[^"]+)"/gu, `$1 ${labelId}"`);
      const modal = ['dialog', 'drawer', 'command-palette'].includes(slug);
      return `<div class="core-example"><p id="${labelId}" class="core-example-label">${exampleTitle}</p>
      ${modal ? `<button type="button" class="cm-button cm-button--secondary cm-button--md" data-matrix-open>Open ${slug.replaceAll('-', ' ')}</button>` : ''}
      ${html}</div>`;
    })
    .join('')}</div>`;
}

function coreExampleSource(slug: string, name: string, read: (id: string) => string | undefined) {
  switch (slug) {
    case 'tooltip':
      return read('tooltip-default')
        ?.replace('cm-tooltip--top', `cm-tooltip--${name}`)
        .replace('data-cm-controller="tooltip"', 'data-cm-controller="tooltip" data-cm-tooltip-teleport-to="body"')
        .replace('aria-label="Save" ', '')
        .replace('>Save</button>', `>${name}</button>`)
        .replace('>Save changes</span>', `>Tooltip placement: ${name}</span>`);
    case 'card':
      if (name === 'regions')
        return read('card-regions')?.replace(
          '<button type="button">Continue</button>',
          '<button class="cm-button cm-button--secondary cm-button--md" type="button"><span class="cm-button__label">Continue</span></button>',
        );
      break;
    case 'alert':
      if (name === 'without-icon') {
        return read('alert-default')
          ?.replace('Saved', 'Without icon')
          .replace('Changes were saved.', 'Text-first alert content alignment.');
      }
      return read('alert-danger-icon')
        ?.replace('cm-alert--danger', `cm-alert--${name}`)
        .replace('role="alert"', name === 'danger' ? 'role="alert"' : 'role="status"')
        .replace('Submission failed', `${name} alert`)
        .replace('Review the failed fields.', 'Consistent icon, border, and content spacing.');
    case 'tabs':
      if (name === 'release') return renderShowcaseTabs('release', 'Release overview', releaseTabs.slice(0, 4));
      if (name === 'release-overflow')
        return renderShowcaseTabs('release-overflow', 'Release sections', releaseTabs, 2);
      break;
    case 'stepper':
      if (name === 'horizontal') return read('stepper-default');
      return read('stepper-default')?.replace(
        'class="cm-stepper"',
        'class="cm-stepper cm-stepper--vertical cm-stepper--content-inline"',
      );
    case 'nav-menu': {
      if (name === 'pills') return read('nav-menu-pills');
      if (name === 'routes') return read('nav-menu-routes')?.replaceAll('href="/', 'href="./');
      const source = read('nav-menu-default');
      if (name === 'inline') return source?.replace('cm-nav-menu--sidebar', 'cm-nav-menu--inline');
      if (name === 'wrapping-labels') {
        return source
          ?.replace('cm-nav-menu--sidebar', 'cm-nav-menu--sidebar cm-nav-menu--sidebar-expanded')
          .replace('>Dashboard<', '>Documentation and getting started<')
          .replace('>Projects<', '>Examples and implementation guides<');
      }
      return source
        ?.replace(
          'class="cm-nav-menu cm-nav-menu--sidebar"',
          name === 'collapsed'
            ? 'class="cm-nav-menu cm-nav-menu--sidebar cm-nav-menu--sidebar-compact core-collapsed-nav"'
            : 'class="cm-nav-menu cm-nav-menu--sidebar cm-nav-menu--sidebar-expanded"',
        )
        .replace(
          'aria-label="Main navigation"',
          `aria-label="${name === 'collapsed' ? 'Collapsed sidebar navigation' : 'Sidebar navigation'}"`,
        )
        .replace(
          /<span class="cm-nav-menu__label">(Dashboard|Projects|Active|Archived|Docs)<\/span>/gu,
          (labelMarkup, label: string) => {
            const icon = resolveCmIcon(label === 'Dashboard' ? house : folder, 'classic', 'regular');
            return icon
              ? `<svg class="cm-icon cm-icon--classic cm-icon--regular cm-nav-menu__leading-icon" viewBox="${icon.viewBox}" aria-hidden="true" focusable="false">${icon.body}</svg>${labelMarkup}`
              : labelMarkup;
          },
        )
        .replace('href="/dashboard"', 'href="/dashboard" aria-label="Dashboard"')
        .replace('data-cm-nav-menu-branch="projects"', 'data-cm-nav-menu-branch="projects" aria-label="Projects"')
        .replace(
          /data-cm-nav-menu-value="(active|archived|docs)"/gu,
          (match, value: string) => `${match} aria-label="${value[0].toUpperCase() + value.slice(1)}"`,
        );
    }
    case 'table-of-contents':
      if (name === 'pills')
        return read('table-of-contents-default')?.replace(
          'class="cm-table-of-contents"',
          'class="cm-table-of-contents cm-table-of-contents--pills"',
        );
      break;
  }
  return read(`${slug}-${name}`);
}

export function coreRecipesFor(source: string, group: string) {
  return (
    [...source.matchAll(/<template data-core-group="([^"]+)">([\s\S]*?)<\/template>/gu)].find(
      ([, id]) => id === group,
    )?.[2] ?? ''
  );
}

export function coreComponentTitle(slug: string) {
  return slug.replace(
    /(^|-)([a-z])/gu,
    (_, separator: string, letter: string) => (separator ? ' ' : '') + letter.toUpperCase(),
  );
}
