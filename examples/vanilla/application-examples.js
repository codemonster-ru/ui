import './showcase.js';
import {
  filterReleases,
  initialReleases,
  releaseStates,
  sampleSignIn,
  summarizeReleases,
  validateReleaseName,
} from './application-example-data.js';

const root = document.querySelector('.release-workspace');
const get = (id) => document.getElementById(id);
const releases = [...initialReleases];
const filterForm = get('release-filters');
const query = get('release-filter-query');
const results = get('release-filter-results');
const rows = get('release-deployment-rows');
const table = root.querySelector('.release-workspace__table');
const empty = root.querySelector('.release-workspace__empty');
let stateFilter = 'all';

function updateOverview() {
  const filtered = filterReleases(releases, query.value, stateFilter);
  const fragment = document.createDocumentFragment();
  for (const release of filtered) {
    const row = document.createElement('tr');
    const name = document.createElement('th');
    const environment = document.createElement('span');
    const state = document.createElement('td');
    const badge = document.createElement('span');
    name.scope = 'row';
    name.textContent = release.name;
    environment.className = 'release-workspace__environment';
    environment.textContent = release.environment;
    name.append(environment);
    if (release.note) {
      const note = document.createElement('small');
      note.className = 'release-workspace__note';
      note.textContent = release.note;
      name.append(note);
    }
    badge.className = `cm-badge cm-badge--${releaseStates[release.state].tone}`;
    badge.textContent = releaseStates[release.state].label;
    state.append(badge);
    row.append(name, state);
    fragment.append(row);
  }
  rows.replaceChildren(fragment);
  table.hidden = filtered.length === 0;
  empty.hidden = filtered.length !== 0;
  results.textContent = `${filtered.length} of ${releases.length} deployments`;
}

function clearFilters() {
  filterForm.reset();
  stateFilter = 'all';
  updateOverview();
}

filterForm.addEventListener('submit', (event) => event.preventDefault());
query.addEventListener('input', updateOverview);
filterForm.addEventListener('cm:select-value-change', (event) => {
  stateFilter = event.detail.value;
  updateOverview();
});
get('release-clear-filters').addEventListener('click', () => {
  clearFilters();
  query.focus();
});
for (const button of root.querySelectorAll('[data-release-open]')) {
  button.addEventListener('click', () => {
    const view = button.dataset.releaseOpen;
    if (view === 'overview') clearFilters();
    const tab = get(`release-workspace-tab-${view}`);
    tab.click();
    tab.focus();
  });
}

function showError(input, message, description = '') {
  const errorId = `${input.id}-error`;
  const error = get(errorId);
  error.textContent = message;
  error.hidden = message === '';
  input.closest('.cm-field').classList.toggle('cm-field--invalid', Boolean(message));
  input.classList.toggle('cm-input--invalid', Boolean(message));
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  const describedBy = [description, message ? errorId : ''].filter(Boolean).join(' ');
  if (describedBy) input.setAttribute('aria-describedby', describedBy);
  else input.removeAttribute('aria-describedby');
}

const releaseForm = get('release-new-form');
const releaseName = get('release-name');
const releaseNotes = get('release-notes');
const showReleaseError = (error) => showError(releaseName, error, 'release-name-description');
releaseName.addEventListener('input', () => showReleaseError(''));
releaseForm.addEventListener('cm:select-value-change', () => showReleaseError(''));
releaseForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(releaseForm);
  const environment = data.get('release-environment');
  const error = validateReleaseName(releases, releaseName.value, environment);
  const overviewButton = releaseForm.querySelector('[data-release-open="overview"]');
  const message = releaseForm.querySelector('.release-workspace__message');
  message.textContent = '';
  overviewButton.hidden = Boolean(error);
  showReleaseError(error);
  if (error) {
    releaseName.focus();
    return;
  }

  const name = releaseName.value.trim();
  const state = data.has('requireApproval') ? 'review' : 'queued';
  releases.unshift({ name, environment, state, note: releaseNotes.value.trim() });
  for (const item of summarizeReleases(releases))
    root.querySelector(`[data-release-count="${item.state}"]`).textContent = item.count;
  updateOverview();
  message.textContent = state === 'review' ? `${name} is ready for review.` : `${name} was queued.`;
  releaseName.value = '';
  releaseNotes.value = '';
});

const settingsForm = get('release-settings-form');
const workspaceName = get('release-workspace-name');
settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const name = workspaceName.value.trim();
  const message = settingsForm.querySelector('.release-workspace__message');
  if (!name) {
    message.textContent = 'Enter a workspace name.';
    workspaceName.focus();
    return;
  }
  get('release-workspace-title').textContent = name;
  const data = new FormData(settingsForm);
  const channels = [
    ...(data.has('notifyReleased') ? ['deployment results'] : []),
    ...(data.has('notifyApproval') ? ['approval requests'] : []),
  ];
  message.textContent = channels.length
    ? `Settings saved. Email updates: ${channels.join(' and ')}.`
    : 'Settings saved. Email updates are off.';
});

const signInForm = get('release-sign-in-form');
const email = get('release-sign-in-email');
const password = get('release-sign-in-password');
const signInMessage = signInForm.querySelector('.release-workspace__message');
password.addEventListener('input', () => {
  showError(password, '');
  signInMessage.textContent = '';
});
signInForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const matches = email.value.trim() === sampleSignIn.email && password.value === sampleSignIn.password;
  const error = matches ? '' : 'Use the sample email and password shown above.';
  showError(password, error);
  signInMessage.textContent = matches ? 'Signed in to the preview as Release Operator.' : error;
  password.value = '';
});
