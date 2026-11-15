export const workspaceViews = [
  { value: 'overview', label: 'Overview' },
  { value: 'new-release', label: 'New release' },
  { value: 'settings', label: 'Settings' },
  { value: 'sign-in', label: 'Sign in' },
];

export const releaseEnvironments = ['Production', 'Staging', 'Preview'].map((value) => ({ value, label: value }));

export const releaseStates = {
  released: { label: 'Released', tone: 'success' },
  queued: { label: 'Queued', tone: 'info' },
  review: { label: 'In review', tone: 'warning' },
} as const;

export type ReleaseState = keyof typeof releaseStates;

export interface ReleaseRecord {
  id: string;
  name: string;
  environment: string;
  state: ReleaseState;
  note?: string;
}

export const initialReleases: readonly ReleaseRecord[] = [
  { id: 'payments', name: 'Payments API', environment: 'Production', state: 'released' },
  { id: 'reporting', name: 'International settlement reports', environment: 'Staging', state: 'review' },
  { id: 'search', name: 'Catalog search', environment: 'Production', state: 'released' },
  { id: 'permissions', name: 'Workspace permissions', environment: 'Preview', state: 'queued' },
  { id: 'billing', name: 'Billing statements', environment: 'Production', state: 'released' },
  { id: 'onboarding', name: 'Customer onboarding', environment: 'Staging', state: 'queued' },
];

export const stateFilters = [
  { value: 'all', label: 'All states' },
  ...Object.entries(releaseStates).map(([value, { label }]) => ({ value, label })),
];

export const defaultWorkspaceName = 'Northstar';
export const sampleSignIn = { email: 'operator@example.test', password: 'demo-release' };

export function filterReleases(releases: readonly ReleaseRecord[], query: string, state: string): ReleaseRecord[] {
  const search = query.trim().toLowerCase();
  return releases.filter(
    (release) =>
      (state === 'all' || release.state === state) &&
      `${release.name} ${release.environment}`.toLowerCase().includes(search),
  );
}

export function summarizeReleases(releases: readonly ReleaseRecord[]) {
  const counts = { released: 0, queued: 0, review: 0 };
  for (const { state } of releases) counts[state]++;
  return Object.entries(releaseStates).map(([state, { label }]) => ({
    state,
    label,
    count: counts[state as ReleaseState],
  }));
}

export function validateReleaseName(releases: readonly ReleaseRecord[], value: string, environment: string): string {
  const name = value.trim().toLowerCase();
  if (name.length < 3) return 'Enter at least three characters.';
  if (releases.some((release) => release.environment === environment && release.name.toLowerCase() === name)) {
    return 'This release already exists in the selected environment.';
  }
  return '';
}
