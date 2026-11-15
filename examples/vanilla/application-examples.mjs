import {
  defaultWorkspaceName,
  initialReleases,
  releaseEnvironments,
  releaseStates,
  sampleSignIn,
  stateFilters,
  summarizeReleases,
  workspaceViews,
} from '../shared/application-example-data.mts';

function text(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function button(label, { variant = 'primary', type = 'button', attrs = '' } = {}) {
  return `<button class="cm-button cm-button--${variant} cm-button--md" type="${type}" ${attrs}><span class="cm-button__label">${label}</span></button>`;
}

function field(id, label, control, { required = false, description = '', error = false } = {}) {
  return `<div class="cm-field">
    <label class="cm-field__label" for="${id}">${label}${required ? '<span class="cm-field__required" aria-hidden="true">*</span>' : ''}</label>
    <div class="cm-field__control">${control}</div>
    ${description ? `<p class="cm-field__description" id="${id}-description">${description}</p>` : ''}
    ${error ? `<p class="cm-field__error" id="${id}-error" hidden></p>` : ''}
  </div>`;
}

function input(id, attrs = '') {
  return `<input class="cm-input cm-input--md" id="${id}" ${attrs}>`;
}

function select(id, options, selected) {
  return `<div class="cm-select-wrap" data-cm-controller="select">
    <input type="hidden" name="${id}" value="${selected}">
    <button class="cm-select cm-select--md" id="${id}" type="button" role="combobox" aria-haspopup="listbox" aria-controls="${id}-listbox" aria-expanded="false" data-cm-filled="true">
      <span class="cm-select__value">${options.find(({ value }) => value === selected).label}</span>
      <span class="cm-select__icon cm-select__icon--chevron" aria-hidden="true"><svg class="cm-select__chevron" viewBox="0 0 24 24" fill="none" focusable="false"><polyline points="5.75 8.75 12 15 18.25 8.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    </button>
    <div class="cm-select__listbox" id="${id}-listbox" role="listbox" aria-labelledby="${id}" hidden>
      ${options.map(({ value, label }) => `<button class="cm-select__option" type="button" role="option" tabindex="-1" aria-selected="${value === selected}" data-cm-select-value="${value}">${label}</button>`).join('')}
    </div>
  </div>`;
}

function switchControl(name, label, checked = false) {
  return `<label class="cm-switch cm-switch--md" data-cm-controller="switch">
    <input class="cm-switch__input" type="checkbox" role="switch" name="${name}" aria-checked="${checked}"${checked ? ' checked' : ''}>
    <span class="cm-switch__control" aria-hidden="true"><span class="cm-switch__thumb"></span></span>
    <span class="cm-switch__content">${label}</span>
  </label>`;
}

function card(id, title, body, heading = 'h3') {
  return `<section class="cm-card release-workspace__section" aria-labelledby="${id}">
    <header class="cm-card__header"><${heading} class="cm-card__title" id="${id}">${title}</${heading}></header>
    <div class="cm-card__body">${body}</div>
  </section>`;
}

function panel(id, body) {
  return `<div class="cm-tabs__panel" id="release-workspace-panel-${id}" role="tabpanel" aria-labelledby="release-workspace-tab-${id}" tabindex="0"${id === 'overview' ? '' : ' hidden'}>${body}</div>`;
}

function overview() {
  return `<div class="release-workspace__view">
    <div class="release-workspace__toolbar">
      <div><h3>Overview</h3><p>Track deployments across environments.</p></div>
      ${button('New release', { attrs: 'data-release-open="new-release"' })}
    </div>
    <div class="release-workspace__metrics">
      ${summarizeReleases(initialReleases)
        .map(
          ({ state, label, count, hint }) => `<div class="cm-card cm-card--compact"><div class="cm-card__body">
        <p class="release-workspace__metric-label">${label}</p>
        <p class="release-workspace__metric-value" data-release-count="${state}">${count}</p>
        <p class="release-workspace__metric-note">${hint}</p>
      </div></div>`,
        )
        .join('')}
    </div>
    ${card(
      'release-deployments-title',
      'Deployments',
      `
      <form class="release-workspace__filters" id="release-filters">
        ${field('release-filter-query', 'Find a deployment', input('release-filter-query', 'type="search" placeholder="Release or environment"'))}
        ${field('release-filter-state', 'State', select('release-filter-state', stateFilters, 'all'))}
      </form>
      <p class="release-workspace__results" role="status" id="release-filter-results">${initialReleases.length} of ${initialReleases.length} deployments</p>
      <div class="cm-table-wrap release-workspace__table">
        <div class="cm-table__scroll">
          <table class="cm-table cm-table--compact">
            <caption class="cm-table__caption">Deployment records</caption>
            <thead class="cm-table__head"><tr><th scope="col">Release</th><th scope="col">State</th></tr></thead>
            <tbody class="cm-table__body" id="release-deployment-rows">
              ${initialReleases
                .map(
                  ({ name, environment, state }) => `<tr>
                <th scope="row">${text(name)}<span class="release-workspace__environment">${environment}</span></th>
                <td><span class="cm-badge cm-badge--${releaseStates[state].tone}">${releaseStates[state].label}</span></td>
              </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="release-workspace__empty" hidden>
        <p>No deployments match those filters.</p>
        ${button('Clear filters', { variant: 'secondary', attrs: 'id="release-clear-filters"' })}
      </div>
    `,
      'h4',
    )}
  </div>`;
}

function newRelease() {
  return card(
    'release-new-title',
    'New release',
    `
    <p>Choose an environment and decide whether the deployment needs approval.</p>
    <form class="release-workspace__form" id="release-new-form">
      <div class="cm-form-layout cm-form-layout--stacked">
        ${field(
          'release-name',
          'Release name',
          input('release-name', 'maxlength="80" aria-describedby="release-name-description" required'),
          {
            required: true,
            description: 'Use a unique name within the selected environment.',
            error: true,
          },
        )}
        ${field('release-environment', 'Environment', select('release-environment', releaseEnvironments, releaseEnvironments[0].value))}
        ${field('release-notes', 'Release notes', '<textarea class="cm-textarea cm-textarea--md" id="release-notes" rows="3" maxlength="400"></textarea>')}
      </div>
      ${switchControl('requireApproval', 'Require approval before deployment', true)}
      <div class="release-workspace__actions">
        ${button('Create release', { type: 'submit' })}
        ${button('View deployments', { variant: 'secondary', attrs: 'data-release-open="overview" hidden' })}
      </div>
      <p class="release-workspace__message" role="status"></p>
    </form>`,
  );
}

function settings() {
  return card(
    'release-settings-title',
    'Workspace settings',
    `
    <p>Set the workspace name and choose which email updates to receive in this preview.</p>
    <form class="release-workspace__form" id="release-settings-form">
      ${field('release-workspace-name', 'Workspace name', input('release-workspace-name', `maxlength="50" value="${defaultWorkspaceName}" required`), { required: true })}
      <fieldset class="release-workspace__preferences">
        <legend>Email updates</legend>
        ${switchControl('notifyReleased', 'Deployment results', true)}
        ${switchControl('notifyApproval', 'Approval requests')}
      </fieldset>
      <div class="release-workspace__actions">${button('Save settings', { type: 'submit' })}</div>
      <p class="release-workspace__message" role="status"></p>
    </form>`,
  );
}

function signIn() {
  return card(
    'release-sign-in-title',
    'Sign in',
    `
    <section class="cm-alert" role="status"><div class="cm-alert__content"><div class="cm-alert__body">
      Use <code>${sampleSignIn.email}</code> and password <code>${sampleSignIn.password}</code>.
      Sign-in runs in this preview.
    </div></div></section>
    <form class="release-workspace__form" id="release-sign-in-form" autocomplete="off">
      ${field('release-sign-in-email', 'Email', input('release-sign-in-email', 'type="email" required'), { required: true })}
      ${field('release-sign-in-password', 'Password', input('release-sign-in-password', 'type="password" required'), { required: true, error: true })}
      <div class="release-workspace__actions">${button('Sign in', { type: 'submit' })}</div>
      <p class="release-workspace__message" role="status"></p>
    </form>`,
  );
}

export function renderApplicationExamples() {
  const panels = { overview, 'new-release': newRelease, settings, 'sign-in': signIn };
  return `<section class="release-workspace" aria-labelledby="release-workspace-title">
    <header class="release-workspace__heading"><p>Release workspace</p><h2 id="release-workspace-title">${defaultWorkspaceName}</h2></header>
    <div class="cm-tabs" data-cm-controller="tabs" data-cm-tabs-value="overview">
      <div class="cm-tabs__list" role="tablist" aria-orientation="horizontal">
        ${workspaceViews.map(({ value, label }) => `<button class="cm-tabs__tab" id="release-workspace-tab-${value}" type="button" role="tab" aria-controls="release-workspace-panel-${value}" aria-selected="${value === 'overview'}" tabindex="${value === 'overview' ? 0 : -1}">${label}</button>`).join('')}
      </div>
      ${workspaceViews.map(({ value }) => panel(value, panels[value]())).join('')}
    </div>
  </section>`;
}
