<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import {
  CmAlert,
  CmBadge,
  CmButton,
  CmCard,
  CmField,
  CmFormLayout,
  CmInput,
  CmSelect,
  CmSwitch,
  CmTable,
  CmTabs,
  CmTextarea,
} from '@codemonster-ru/ui-vue';
import {
  defaultWorkspaceName,
  filterReleases,
  initialReleases,
  releaseEnvironments,
  releaseStates,
  sampleSignIn,
  stateFilters,
  summarizeReleases,
  validateReleaseName,
  workspaceViews,
} from '../../shared/application-example-data.mts';
import '../../shared/application-examples.css';

const view = ref('overview');
const releases = ref([...initialReleases]);
const query = ref('');
const stateFilter = ref('all');
const filtered = computed(() => filterReleases(releases.value, query.value, stateFilter.value));
const summary = computed(() => summarizeReleases(releases.value));

const releaseName = ref('');
const environment = ref(releaseEnvironments[0].value);
const notes = ref('');
const requireApproval = ref(true);
const releaseError = ref('');
const releaseStatus = ref('');

const workspaceName = ref(defaultWorkspaceName);
const draftWorkspaceName = ref(workspaceName.value);
const notifyReleased = ref(true);
const notifyApproval = ref(false);
const settingsStatus = ref('');

const signInEmail = ref('');
const signInPassword = ref('');
const signInError = ref('');
const signInStatus = ref('');

function clearFilters() {
  query.value = '';
  stateFilter.value = 'all';
}

function resetFilter() {
  clearFilters();
  document.getElementById('release-filter-query')?.focus();
}

async function openView(value: string) {
  if (value === 'overview') clearFilters();
  view.value = value;
  await nextTick();
  document.getElementById(`release-workspace-tab-${value}`)?.focus();
}

async function createRelease() {
  releaseStatus.value = '';
  releaseError.value = validateReleaseName(releases.value, releaseName.value, environment.value);
  if (releaseError.value) {
    await nextTick();
    document.getElementById('release-name')?.focus();
    return;
  }

  const name = releaseName.value.trim();
  const state = requireApproval.value ? 'review' : 'queued';
  releases.value.unshift({
    id: `release-${releases.value.length}`,
    name,
    environment: environment.value,
    note: notes.value.trim(),
    state,
  });
  releaseStatus.value = state === 'review' ? `${name} is ready for review.` : `${name} was queued.`;
  releaseName.value = '';
  notes.value = '';
}

function saveSettings() {
  const name = draftWorkspaceName.value.trim();
  if (!name) {
    settingsStatus.value = 'Enter a workspace name.';
    document.getElementById('release-workspace-name')?.focus();
    return;
  }
  workspaceName.value = name;
  const channels = [
    ...(notifyReleased.value ? ['deployment results'] : []),
    ...(notifyApproval.value ? ['approval requests'] : []),
  ];
  settingsStatus.value = channels.length
    ? `Settings saved. Email updates: ${channels.join(' and ')}.`
    : 'Settings saved. Email updates are off.';
}

function previewSignIn() {
  signInError.value = '';
  signInStatus.value = '';
  if (signInEmail.value.trim() !== sampleSignIn.email || signInPassword.value !== sampleSignIn.password) {
    signInError.value = 'Use the sample email and password shown above.';
  } else {
    signInStatus.value = 'Signed in to the preview as Release Operator.';
  }
  signInPassword.value = '';
}
</script>

<template>
  <section class="release-workspace" aria-labelledby="release-workspace-title">
    <header class="release-workspace__heading">
      <p>Release workspace</p>
      <h2 id="release-workspace-title">{{ workspaceName }}</h2>
    </header>
    <CmTabs id="release-workspace" v-model="view" :items="workspaceViews">
      <template #panelOverview>
        <div class="release-workspace__view">
          <div class="release-workspace__toolbar">
            <div>
              <h3>Overview</h3>
              <p>Track deployments across environments.</p>
            </div>
            <CmButton @click="openView('new-release')">New release</CmButton>
          </div>
          <div class="release-workspace__metrics">
            <CmCard v-for="{ state, label, hint, count } in summary" :key="state" element="div" compact>
              <p class="release-workspace__metric-label">{{ label }}</p>
              <p class="release-workspace__metric-value">{{ count }}</p>
              <p class="release-workspace__metric-note">{{ hint }}</p>
            </CmCard>
          </div>
          <CmCard class="release-workspace__section" aria-labelledby="release-deployments-title">
            <template #header>
              <h4 id="release-deployments-title" class="cm-card__title">Deployments</h4>
            </template>
            <div class="release-workspace__filters">
              <CmField v-slot="{ controlId }" control-id="release-filter-query" label="Find a deployment">
                <CmInput :id="controlId" v-model="query" type="search" placeholder="Release or environment" />
              </CmField>
              <CmField control-id="release-filter-state" label="State">
                <CmSelect id="release-filter-state" v-model="stateFilter" :options="stateFilters" />
              </CmField>
            </div>
            <p class="release-workspace__results" role="status">
              {{ filtered.length }} of {{ releases.length }} deployments
            </p>
            <CmTable
              v-if="filtered.length"
              class="release-workspace__table"
              caption="Deployment records"
              density="compact"
            >
              <template #header>
                <tr>
                  <th scope="col">Release</th>
                  <th scope="col">State</th>
                </tr>
              </template>
              <tr v-for="record in filtered" :key="record.id">
                <th scope="row">
                  {{ record.name }}<span class="release-workspace__environment">{{ record.environment }}</span>
                  <small v-if="record.note" class="release-workspace__note">{{ record.note }}</small>
                </th>
                <td>
                  <CmBadge :tone="releaseStates[record.state].tone">{{ releaseStates[record.state].label }}</CmBadge>
                </td>
              </tr>
            </CmTable>
            <div v-else class="release-workspace__empty">
              <p>No deployments match those filters.</p>
              <CmButton variant="secondary" @click="resetFilter"> Clear filters </CmButton>
            </div>
          </CmCard>
        </div>
      </template>

      <template #panelNewRelease>
        <CmCard class="release-workspace__section" title="New release" aria-label="New release">
          <p>Choose an environment and decide whether the deployment needs approval.</p>
          <form class="release-workspace__form" @submit.prevent="createRelease">
            <CmFormLayout>
              <CmField
                v-slot="{ controlId, describedBy, invalid }"
                control-id="release-name"
                label="Release name"
                description="Use a unique name within the selected environment."
                :error="releaseError"
                required
              >
                <CmInput
                  :id="controlId"
                  v-model="releaseName"
                  :aria-describedby="describedBy"
                  :invalid="invalid"
                  maxlength="80"
                  required
                  @update:model-value="releaseError = ''"
                />
              </CmField>
              <CmField control-id="release-environment" label="Environment">
                <CmSelect
                  id="release-environment"
                  v-model="environment"
                  :options="releaseEnvironments"
                  @update:model-value="releaseError = ''"
                />
              </CmField>
              <CmField v-slot="{ controlId }" control-id="release-notes" label="Release notes">
                <CmTextarea :id="controlId" v-model="notes" rows="3" maxlength="400" />
              </CmField>
            </CmFormLayout>
            <CmSwitch v-model="requireApproval" label="Require approval before deployment" />
            <div class="release-workspace__actions">
              <CmButton type="submit">Create release</CmButton>
              <CmButton v-if="releaseStatus" variant="secondary" @click="openView('overview')"
                >View deployments</CmButton
              >
            </div>
            <p class="release-workspace__message" role="status">{{ releaseStatus }}</p>
          </form>
        </CmCard>
      </template>

      <template #panelSettings>
        <CmCard class="release-workspace__section" title="Workspace settings" aria-label="Workspace settings">
          <p>Set the workspace name and choose which email updates to receive in this preview.</p>
          <form class="release-workspace__form" @submit.prevent="saveSettings">
            <CmField v-slot="{ controlId }" control-id="release-workspace-name" label="Workspace name" required>
              <CmInput :id="controlId" v-model="draftWorkspaceName" maxlength="50" required />
            </CmField>
            <fieldset class="release-workspace__preferences">
              <legend>Email updates</legend>
              <CmSwitch v-model="notifyReleased" label="Deployment results" />
              <CmSwitch v-model="notifyApproval" label="Approval requests" />
            </fieldset>
            <div class="release-workspace__actions"><CmButton type="submit">Save settings</CmButton></div>
            <p class="release-workspace__message" role="status">{{ settingsStatus }}</p>
          </form>
        </CmCard>
      </template>

      <template #panelSignIn>
        <CmCard class="release-workspace__section" title="Sign in" aria-label="Sign in">
          <CmAlert>
            Use <code>{{ sampleSignIn.email }}</code> and password <code>{{ sampleSignIn.password }}</code
            >. Sign-in runs in this preview.
          </CmAlert>
          <form class="release-workspace__form" autocomplete="off" @submit.prevent="previewSignIn">
            <CmField v-slot="{ controlId }" control-id="release-sign-in-email" label="Email" required>
              <CmInput :id="controlId" v-model="signInEmail" type="email" required />
            </CmField>
            <CmField
              v-slot="{ controlId, describedBy, invalid }"
              control-id="release-sign-in-password"
              label="Password"
              :error="signInError"
              required
            >
              <CmInput
                :id="controlId"
                v-model="signInPassword"
                type="password"
                :aria-describedby="describedBy"
                :invalid="invalid"
                required
                @update:model-value="signInError = ''"
              />
            </CmField>
            <div class="release-workspace__actions"><CmButton type="submit">Sign in</CmButton></div>
            <p class="release-workspace__message" role="status">{{ signInStatus || signInError }}</p>
          </form>
        </CmCard>
      </template>
    </CmTabs>
  </section>
</template>
