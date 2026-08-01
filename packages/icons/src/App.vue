<template>
  <main class="audit demo-page">
    <div class="audit__container demo-container">
      <nav class="mode-tabs" aria-label="Review mode">
        <button
          v-for="option in viewOptions"
          :key="option.id"
          type="button"
          :class="{ active: view === option.id }"
          @click="view = option.id"
        >
          {{ option.label }}
        </button>
      </nav>

      <section
        v-if="
          view === 'reference' ||
          view === 'batch2' ||
          view === 'batch3' ||
          view === 'batch4' ||
          view === 'batch5' ||
          view === 'batch6' ||
          view === 'batch7' ||
          view === 'batch8' ||
          view === 'batch9' ||
          view === 'batch10' ||
          view === 'batch11' ||
          view === 'batch12' ||
          view === 'batch13' ||
          view === 'batch14' ||
          view === 'batch15' ||
          view === 'batch16' ||
          view === 'batch17' ||
          view === 'batch18' ||
          view === 'batch19' ||
          view === 'batch20' ||
          view === 'batch21' ||
          view === 'batch22' ||
          view === 'batch23'
        "
        class="reference-review"
      >
        <header class="section-heading">
          <div>
            <p class="eyebrow">{{ activeReviewCopy.eyebrow }}</p>
            <h2>Old, new, and overlay</h2>
          </div>
          <p>{{ activeReviewCopy.note }}</p>
        </header>

        <article v-for="item in referenceReview" :key="item.icon" class="reference-card">
          <header class="reference-card__header">
            <div>
              <strong>{{ item.icon }}</strong>
              <span>{{ item.family }}</span>
            </div>
            <span class="change-badge">{{ item.change }}</span>
          </header>

          <div class="reference-card__body">
            <div class="reference-samples">
              <div class="sample-head"><span>Size</span><span>Old</span><span>New</span><span>Overlay</span></div>
              <div v-for="size in sizes" :key="size" class="sample-row" :class="{ 'sample-row--primary': size === 20 }">
                <strong>{{ size }} px</strong>
                <span class="actual-size-stage">
                  <span class="before-icon" :style="sizeStyle(size)" :innerHTML="activeBeforeIcons[item.icon]" />
                </span>
                <span class="actual-size-stage"><VueIconify :icon="item.icon" :size="size" /></span>
                <span class="actual-size-stage overlay-stage">
                  <span
                    class="before-icon overlay-old"
                    :style="sizeStyle(size)"
                    :innerHTML="activeBeforeIcons[item.icon]"
                  />
                  <VueIconify class="overlay-new" :icon="item.icon" :size="size" />
                </span>
              </div>
            </div>

            <div class="measurement-block">
              <div class="measure-canvas">
                <VueIconify :icon="item.icon" :size="120" />
                <span class="axis axis--x" />
                <span class="axis axis--y" />
                <span
                  class="bounds"
                  :style="{
                    left: `${(item.bounds.x / 24 + item.opticalOffset.x) * 100}%`,
                    top: `${(item.bounds.y / 24 + item.opticalOffset.y) * 100}%`,
                    width: `${(item.bounds.width / 24) * 100}%`,
                    height: `${(item.bounds.height / 24) * 100}%`,
                  }"
                />
                <span class="visual-center" title="Canvas geometric center" />
              </div>
              <dl>
                <div>
                  <dt>Visual bounds</dt>
                  <dd>{{ item.bounds.width }} × {{ item.bounds.height }}</dd>
                </div>
                <div>
                  <dt>Geometric center</dt>
                  <dd>12, 12</dd>
                </div>
                <div>
                  <dt>Bounds center</dt>
                  <dd>{{ item.center.x }}, {{ item.center.y }}</dd>
                </div>
                <div>
                  <dt>Center Δ</dt>
                  <dd>{{ item.center.dx }}, {{ item.center.dy }}</dd>
                </div>
                <div>
                  <dt>Optical offset</dt>
                  <dd>{{ item.opticalOffset.x }}, {{ item.opticalOffset.y }}</dd>
                </div>
              </dl>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="view === 'stroke'" class="stroke-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Temporary presentation override</p>
            <h2>Stroke comparison</h2>
          </div>
          <p>These CSS previews do not modify canonical SVG data.</p>
        </header>

        <article v-for="condition in strokeConditions" :key="condition.id" class="stroke-condition">
          <header>
            <strong>{{ condition.label }}</strong
            ><span>{{ condition.note }}</span>
          </header>
          <div :class="['stroke-surface', `stroke-surface--${condition.id}`]">
            <div class="stroke-grid stroke-grid--head">
              <span>Size</span><strong>1.75</strong><strong>1.8</strong><strong>2</strong>
            </div>
            <div v-for="size in strokeSizes" :key="size" class="stroke-grid">
              <strong>{{ size }} px</strong>
              <div v-for="stroke in strokeWidths" :key="stroke" class="stroke-cell">
                <VueIconify
                  v-for="iconName in referenceSet"
                  :key="iconName"
                  class="stroke-preview"
                  :style="{ '--review-stroke': stroke }"
                  :icon="iconName"
                  :size="size"
                />
              </div>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="view === 'ui'" class="ui-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Production-scale contexts</p>
            <h2>Compact SaaS page</h2>
          </div>
          <p>Four simultaneous theme/density combinations. Only reference-set icons are used.</p>
        </header>

        <slot name="saas-contexts">
          <article
            v-for="variant in uiVariants"
            :key="variant.id"
            :class="['saas-frame', `saas-frame--${variant.theme}`, `saas-frame--${variant.density}`]"
          >
            <header class="saas-frame__label">
              <strong>{{ variant.theme }}</strong
              ><span>{{ variant.density }} density</span>
            </header>
            <div class="saas-app">
              <aside class="saas-sidebar">
                <div class="saas-logo"><VueIconify icon="grid" :size="18" /><strong>VueForge</strong></div>
                <nav>
                  <span class="selected"><VueIconify icon="house" :size="18" />Overview</span>
                  <span><VueIconify icon="users" :size="18" />Customers</span>
                  <span><VueIconify icon="folder" :size="18" />Projects</span>
                  <span><VueIconify icon="chartBar" :size="18" />Reports</span>
                  <span><VueIconify icon="gear" :size="18" />Settings</span>
                </nav>
                <div class="saas-user"><VueIconify icon="user" :size="18" /><span>Ada Lovelace</span></div>
              </aside>

              <div class="saas-main">
                <div class="saas-toolbar">
                  <label class="saas-search">
                    <VueIconify icon="magnifyingGlass" :size="16" /><span>Search projects</span>
                  </label>
                  <button class="ui-icon-button"><VueIconify icon="bell" :size="17" /></button>
                  <button class="ui-button"><VueIconify icon="plus" :size="16" />New project</button>
                </div>

                <div class="saas-content">
                  <div class="saas-title">
                    <div>
                      <small>Workspace</small>
                      <h3>Operations overview</h3>
                    </div>
                    <button class="ui-icon-button"><VueIconify icon="download" :size="17" /></button>
                  </div>

                  <div class="saas-tabs">
                    <span class="active"><VueIconify icon="grid" :size="16" />Overview</span>
                    <span><VueIconify icon="chartBar" :size="16" />Analytics</span>
                    <span><VueIconify icon="columns" :size="16" />Data</span>
                  </div>

                  <div class="dashboard-cards">
                    <div>
                      <VueIconify icon="users" :size="19" /><span>Active users<strong>12,480</strong></span>
                    </div>
                    <div>
                      <VueIconify icon="database" :size="19" /><span>Storage<strong>68%</strong></span>
                    </div>
                    <div>
                      <VueIconify icon="cloud" :size="19" /><span>Uptime<strong>99.98%</strong></span>
                    </div>
                  </div>

                  <div class="inline-messages">
                    <div class="ui-alert"><VueIconify icon="warning" :size="17" />Backup requires attention.</div>
                    <div class="ui-notification"><VueIconify icon="infoCircle" :size="17" />3 updates are ready.</div>
                  </div>

                  <div class="data-panel">
                    <div class="data-panel__head">
                      <strong>Recent projects</strong>
                      <div class="dropdown-demo">
                        <button class="ui-button">Status <VueIconify icon="chevronDown" :size="14" /></button>
                        <div class="dropdown-menu">
                          <span><VueIconify icon="check" :size="14" />Active</span>
                        </div>
                      </div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Project</th>
                          <th>Owner</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><VueIconify icon="file" :size="16" />Atlas migration</td>
                          <td><VueIconify icon="user" :size="16" />M. Chen</td>
                          <td><span class="status-dot">Healthy</span></td>
                          <td class="row-actions">
                            <button><VueIconify icon="pencil" :size="15" /></button>
                            <button><VueIconify icon="trash" :size="15" /></button>
                          </td>
                        </tr>
                        <tr>
                          <td><VueIconify icon="mail" :size="16" />Lifecycle email</td>
                          <td><VueIconify icon="user" :size="16" />S. Rivera</td>
                          <td><span class="status-dot">Healthy</span></td>
                          <td class="row-actions">
                            <button><VueIconify icon="pencil" :size="15" /></button>
                            <button><VueIconify icon="trash" :size="15" /></button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <footer class="pagination">
                      <span>1–2 of 24</span>
                      <button><VueIconify icon="arrowDown" :size="14" /></button>
                      <button><VueIconify icon="arrowRight" :size="14" /></button>
                    </footer>
                  </div>

                  <div class="empty-state">
                    <VueIconify icon="message" :size="24" />
                    <div><strong>No pending messages</strong><span>New activity will appear here.</span></div>
                    <button class="ui-icon-button"><VueIconify icon="upload" :size="16" /></button>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </slot>
      </section>

      <section v-else-if="view === 'families'" class="family-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Unlabelled glyph test</p>
            <h2>Family consistency</h2>
          </div>
          <p>Names are intentionally hidden. Evaluate the icon row before reading the family heading.</p>
        </header>
        <article v-for="familyEntry in reviewFamilies" :key="familyEntry.name">
          <div class="family-glyphs">
            <VueIconify v-for="iconName in familyEntry.icons" :key="iconName" :icon="iconName" :size="24" />
          </div>
          <p>{{ familyEntry.name }}</p>
        </article>
      </section>

      <section v-else-if="view === 'mass'" class="mass-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">20 px · equal spacing</p>
            <h2>Optical mass</h2>
          </div>
          <label class="segmented">
            <button :class="{ active: massMode === 'outline' }" @click="massMode = 'outline'">Outline</button>
            <button :class="{ active: massMode === 'silhouette' }" @click="massMode = 'silhouette'">
              Silhouette stress
            </button>
          </label>
        </header>
        <div :class="['mass-grid', `mass-grid--${massMode}`]">
          <VueIconify v-for="iconName in referenceSet" :key="iconName" :icon="iconName" :size="20" />
        </div>
        <p v-if="massMode === 'silhouette'" class="mode-note">
          Stress preview uses a moderate 2.6 stroke to expose fragile gaps and uneven mass. It is not an approval target
          or alternate icon data.
        </p>
        <p v-else class="mode-note">
          Canonical 20 px outline rendering. Use this mode for the primary optical-mass decision.
        </p>
      </section>

      <section v-else-if="view === 'blind'" class="blind-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Locally stored owner input</p>
            <h2>Blind comparison</h2>
          </div>
          <button class="reset-button" type="button" @click="resetVotes">Reset local votes</button>
        </header>

        <div class="blind-summary">
          <div>
            <strong>{{ voteSummary.a }}</strong
            ><span>A better</span>
          </div>
          <div>
            <strong>{{ voteSummary.b }}</strong
            ><span>B better</span>
          </div>
          <div>
            <strong>{{ voteSummary.equal }}</strong
            ><span>Equal</span>
          </div>
          <div>
            <strong>{{ voteSummary.redraw }}</strong
            ><span>Both need work</span>
          </div>
          <div>
            <strong>{{ voteSummary.pending }}</strong
            ><span>Pending</span>
          </div>
        </div>

        <div class="blind-grid">
          <article v-for="item in blindItems" :key="item.icon">
            <header>
              <strong>{{ item.icon }}</strong
              ><span>20 px</span>
            </header>
            <div class="blind-variants">
              <div>
                <strong>Variant A</strong>
                <span
                  v-if="item.oldIsA"
                  class="before-icon"
                  :style="sizeStyle(20)"
                  :innerHTML="beforeIcons[item.icon]"
                />
                <VueIconify v-else :icon="item.icon" :size="20" />
              </div>
              <div>
                <strong>Variant B</strong>
                <VueIconify v-if="item.oldIsA" :icon="item.icon" :size="20" />
                <span v-else class="before-icon" :style="sizeStyle(20)" :innerHTML="beforeIcons[item.icon]" />
              </div>
            </div>
            <div class="vote-actions">
              <button
                v-for="choice in voteChoices"
                :key="choice.id"
                :class="{ selected: votes[item.icon] === choice.id }"
                type="button"
                @click="setVote(item.icon, choice.id)"
              >
                {{ choice.label }}
              </button>
            </div>
          </article>
        </div>
      </section>

      <section v-else class="catalog-review">
        <header class="section-heading">
          <div>
            <p class="eyebrow">Full catalog diagnostics</p>
            <h2>Measured outliers</h2>
          </div>
          <label><input v-model="suspiciousOnly" type="checkbox" /> Suspicious only</label>
        </header>
        <div class="catalog-table">
          <table>
            <thead>
              <tr>
                <th>Icon</th>
                <th>20 px</th>
                <th>Group</th>
                <th>Bounds</th>
                <th>Area</th>
                <th>Ink</th>
                <th>Center Δ</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in catalogItems" :key="item.icon">
                <td>
                  <strong>{{ item.icon }}</strong>
                </td>
                <td><VueIconify :icon="item.icon" :size="20" /></td>
                <td>{{ item.group }}</td>
                <td>{{ item.bounds.width }} × {{ item.bounds.height }}</td>
                <td>{{ item.boundsArea }}</td>
                <td>{{ item.inkArea }}%</td>
                <td>{{ item.center.dx }}, {{ item.center.dy }}</td>
                <td>{{ item.warnings.join(', ') || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import VueIconify from './lib/components/icon.vue';
import auditJson from './lib/iconAudit.json';
import migrationBatch02BeforeJson from './lib/iconMigrationBatch02Before.json';
import migrationBatch02Json from './lib/iconMigrationBatch02.json';
import migrationBatch03BeforeJson from './lib/iconMigrationBatch03Before.json';
import migrationBatch03Json from './lib/iconMigrationBatch03.json';
import migrationBatch04BeforeJson from './lib/iconMigrationBatch04Before.json';
import migrationBatch04Json from './lib/iconMigrationBatch04.json';
import migrationBatch05BeforeJson from './lib/iconMigrationBatch05Before.json';
import migrationBatch05Json from './lib/iconMigrationBatch05.json';
import migrationBatch06BeforeJson from './lib/iconMigrationBatch06Before.json';
import migrationBatch06Json from './lib/iconMigrationBatch06.json';
import migrationBatch07BeforeJson from './lib/iconMigrationBatch07Before.json';
import migrationBatch07Json from './lib/iconMigrationBatch07.json';
import migrationBatch08BeforeJson from './lib/iconMigrationBatch08Before.json';
import migrationBatch08Json from './lib/iconMigrationBatch08.json';
import migrationBatch09BeforeJson from './lib/iconMigrationBatch09Before.json';
import migrationBatch09Json from './lib/iconMigrationBatch09.json';
import migrationBatch10BeforeJson from './lib/iconMigrationBatch10Before.json';
import migrationBatch10Json from './lib/iconMigrationBatch10.json';
import migrationBatch11BeforeJson from './lib/iconMigrationBatch11Before.json';
import migrationBatch11Json from './lib/iconMigrationBatch11.json';
import migrationBatch12BeforeJson from './lib/iconMigrationBatch12Before.json';
import migrationBatch12Json from './lib/iconMigrationBatch12.json';
import migrationBatch13BeforeJson from './lib/iconMigrationBatch13Before.json';
import migrationBatch13Json from './lib/iconMigrationBatch13.json';
import migrationBatch14BeforeJson from './lib/iconMigrationBatch14Before.json';
import migrationBatch14Json from './lib/iconMigrationBatch14.json';
import migrationBatch15BeforeJson from './lib/iconMigrationBatch15Before.json';
import migrationBatch15Json from './lib/iconMigrationBatch15.json';
import migrationBatch16BeforeJson from './lib/iconMigrationBatch16Before.json';
import migrationBatch16Json from './lib/iconMigrationBatch16.json';
import migrationBatch17BeforeJson from './lib/iconMigrationBatch17Before.json';
import migrationBatch17Json from './lib/iconMigrationBatch17.json';
import migrationBatch18BeforeJson from './lib/iconMigrationBatch18Before.json';
import migrationBatch18Json from './lib/iconMigrationBatch18.json';
import migrationBatch19BeforeJson from './lib/iconMigrationBatch19Before.json';
import migrationBatch19Json from './lib/iconMigrationBatch19.json';
import migrationBatch20BeforeJson from './lib/iconMigrationBatch20Before.json';
import migrationBatch20Json from './lib/iconMigrationBatch20.json';
import migrationBatch21BeforeJson from './lib/iconMigrationBatch21Before.json';
import migrationBatch21Json from './lib/iconMigrationBatch21.json';
import migrationBatch22BeforeJson from './lib/iconMigrationBatch22Before.json';
import migrationBatch22Json from './lib/iconMigrationBatch22.json';
import migrationBatch23BeforeJson from './lib/iconMigrationBatch23Before.json';
import migrationBatch23Json from './lib/iconMigrationBatch23.json';
import beforeIconsJson from './lib/iconReferenceBefore.json';
import referenceSetJson from './lib/iconReferenceSet.json';
import type { IconName } from './lib/iconMeta';

type View =
  | 'reference'
  | 'batch2'
  | 'batch3'
  | 'batch4'
  | 'batch5'
  | 'batch6'
  | 'batch7'
  | 'batch8'
  | 'batch9'
  | 'batch10'
  | 'batch11'
  | 'batch12'
  | 'batch13'
  | 'batch14'
  | 'batch15'
  | 'batch16'
  | 'batch17'
  | 'batch18'
  | 'batch19'
  | 'batch20'
  | 'batch21'
  | 'batch22'
  | 'batch23'
  | 'stroke'
  | 'ui'
  | 'families'
  | 'mass'
  | 'blind'
  | 'catalog';
type Vote = 'a' | 'b' | 'equal' | 'redraw';
type Votes = Partial<Record<IconName, Vote>>;
type BlindItem = { icon: IconName; oldIsA: boolean };

const audit = auditJson;
const beforeIcons = beforeIconsJson as Partial<Record<IconName, string>>;
const migrationBatch02Before = migrationBatch02BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch02 = migrationBatch02Json as IconName[];
const migrationBatch03Before = migrationBatch03BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch03 = migrationBatch03Json as IconName[];
const migrationBatch04Before = migrationBatch04BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch04 = migrationBatch04Json as IconName[];
const migrationBatch05Before = migrationBatch05BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch05 = migrationBatch05Json as IconName[];
const migrationBatch06Before = migrationBatch06BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch06 = migrationBatch06Json as IconName[];
const migrationBatch07Before = migrationBatch07BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch07 = migrationBatch07Json as IconName[];
const migrationBatch08Before = migrationBatch08BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch08 = migrationBatch08Json as IconName[];
const migrationBatch09Before = migrationBatch09BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch09 = migrationBatch09Json as IconName[];
const migrationBatch10Before = migrationBatch10BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch10 = migrationBatch10Json as IconName[];
const migrationBatch11Before = migrationBatch11BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch11 = migrationBatch11Json as IconName[];
const migrationBatch12Before = migrationBatch12BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch12 = migrationBatch12Json as IconName[];
const migrationBatch13Before = migrationBatch13BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch13 = migrationBatch13Json as IconName[];
const migrationBatch14Before = migrationBatch14BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch14 = migrationBatch14Json as IconName[];
const migrationBatch15Before = migrationBatch15BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch15 = migrationBatch15Json as IconName[];
const migrationBatch16Before = migrationBatch16BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch16 = migrationBatch16Json as IconName[];
const migrationBatch17Before = migrationBatch17BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch17 = migrationBatch17Json as IconName[];
const migrationBatch18Before = migrationBatch18BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch18 = migrationBatch18Json as IconName[];
const migrationBatch19Before = migrationBatch19BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch19 = migrationBatch19Json as IconName[];
const migrationBatch20Before = migrationBatch20BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch20 = migrationBatch20Json as IconName[];
const migrationBatch21Before = migrationBatch21BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch21 = migrationBatch21Json as IconName[];
const migrationBatch22Before = migrationBatch22BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch22 = migrationBatch22Json as IconName[];
const migrationBatch23Before = migrationBatch23BeforeJson as Partial<Record<IconName, string>>;
const migrationBatch23 = migrationBatch23Json as IconName[];
const referenceSet = referenceSetJson as IconName[];
const sizes = [16, 20, 24, 32] as const;
const strokeSizes = [16, 20, 24] as const;
const strokeWidths = [1.75, 1.8, 2] as const;
const view = ref<View>('reference');
const massMode = ref<'outline' | 'silhouette'>('outline');
const suspiciousOnly = ref(true);
const votes = ref<Votes>({});
const voteStorageKey = 'vueforge-icons-reference-review-votes-v1';
const voteRevisionStorageKey = `${voteStorageKey}:revision`;
const voteRevision = 'users-symmetric-occluded-rear-shoulders-2026-07-31';
const revisedIcons: IconName[] = ['users'];

const viewOptions: Array<{ id: View; label: string }> = [
  { id: 'reference', label: 'Reference review' },
  { id: 'batch2', label: 'Batch 2 review' },
  { id: 'batch3', label: 'Batch 3 review' },
  { id: 'batch4', label: 'Batch 4 review' },
  { id: 'batch5', label: 'Batch 5 review' },
  { id: 'batch6', label: 'Batch 6 review' },
  { id: 'batch7', label: 'Batch 7 review' },
  { id: 'batch8', label: 'Batch 8 review' },
  { id: 'batch9', label: 'Batch 9 review' },
  { id: 'batch10', label: 'Batch 10 review' },
  { id: 'batch11', label: 'Batch 11 review' },
  { id: 'batch12', label: 'Batch 12 review' },
  { id: 'batch13', label: 'Batch 13 review' },
  { id: 'batch14', label: 'Batch 14 review' },
  { id: 'batch15', label: 'Batch 15 review' },
  { id: 'batch16', label: 'Batch 16 review' },
  { id: 'batch17', label: 'Batch 17 review' },
  { id: 'batch18', label: 'Batch 18 review' },
  { id: 'batch19', label: 'Batch 19 review' },
  { id: 'batch20', label: 'Batch 20 review' },
  { id: 'batch21', label: 'Batch 21 review' },
  { id: 'batch22', label: 'Batch 22 review' },
  { id: 'batch23', label: 'Batch 23 review' },
  { id: 'stroke', label: 'Stroke 1.75 / 1.8 / 2' },
  { id: 'ui', label: 'SaaS contexts' },
  { id: 'families', label: 'Families' },
  { id: 'mass', label: 'Optical mass' },
  { id: 'blind', label: 'Blind comparison' },
  { id: 'catalog', label: 'Full audit' },
];

const refinementIcons = new Set<IconName>([
  'arrowLeft',
  'arrowRight',
  'arrowUp',
  'arrowDown',
  'chevronLeft',
  'chevronRight',
  'chevronUp',
  'chevronDown',
  'check',
  'xmark',
  'plus',
  'magnifyingGlass',
  'minus',
]);
const reviewFamilyByIcon: Partial<Record<IconName, string>> = {
  arrowLeft: 'Directional',
  arrowRight: 'Directional',
  arrowUp: 'Directional',
  arrowDown: 'Directional',
  chevronLeft: 'Directional',
  chevronRight: 'Directional',
  chevronUp: 'Directional',
  chevronDown: 'Directional',
  caretLeft: 'Directional',
  caretRight: 'Directional',
  caretUp: 'Directional',
  caretDown: 'Directional',
  download: 'Directional',
  upload: 'Directional',
  check: 'System symbols',
  xmark: 'System symbols',
  plus: 'System symbols',
  warning: 'System symbols',
  infoCircle: 'System symbols',
  user: 'People',
  users: 'People',
  file: 'Content',
  folder: 'Content',
  mail: 'Content',
  message: 'Content',
  house: 'Navigation and administration',
  grid: 'Navigation and administration',
  columns: 'Navigation and administration',
  gear: 'Navigation and administration',
  cloud: 'Infrastructure',
  database: 'Infrastructure',
  lock: 'Infrastructure',
  chartBar: 'Data',
  calendar: 'Data',
  pencil: 'Editing',
  trash: 'Editing',
  bell: 'Communication',
  magnifyingGlass: 'Search',
  minus: 'System symbols',
  userPlus: 'People',
  userMinus: 'People',
  userCheck: 'People',
  unlock: 'Infrastructure',
  fileText: 'Content',
  folderOpen: 'Content',
  info: 'System feedback',
  question: 'System feedback',
  questionCircle: 'System feedback',
  alertCircle: 'System feedback',
  checkCircle: 'System feedback',
  xCircle: 'System feedback',
  ban: 'System feedback',
  eye: 'Visibility',
  eyeSlash: 'Visibility',
  sun: 'Appearance',
  moon: 'Appearance',
  circleHalf: 'Appearance',
  clock: 'Time',
  history: 'Time',
  refresh: 'Circular motion',
  rotateRight: 'Circular motion',
  circleNotch: 'Circular motion',
  copy: 'Content operations',
  clipboard: 'Content operations',
  inbox: 'Storage containers',
  archive: 'Storage containers',
  arrowLeftLong: 'Long directional',
  arrowRightLong: 'Long directional',
  arrowUpLong: 'Long directional',
  arrowDownLong: 'Long directional',
  arrowTurnUpLeft: 'Turn directional',
  arrowTurnUpRight: 'Turn directional',
  arrowTurnRightUp: 'Turn directional',
  arrowTurnLeftDown: 'Turn directional',
  logIn: 'Session actions',
  logOut: 'Session actions',
  filter: 'Filtering actions',
  funnelX: 'Filtering actions',
  server: 'Infrastructure storage',
  hardDrive: 'Infrastructure storage',
  terminal: 'Developer tools',
  code: 'Developer tools',
  creditCard: 'Financial objects',
  wallet: 'Financial objects',
  receipt: 'Financial objects',
  building: 'Workplace objects',
  briefcase: 'Workplace objects',
  expand: 'Layout actions',
  collapse: 'Layout actions',
  sliders: 'Data controls',
  sort: 'Data controls',
  link: 'Navigation links',
  externalLink: 'Navigation links',
  bars: 'Menu triggers',
  ellipsis: 'Menu triggers',
  bookmark: 'Favorite markers',
  heart: 'Favorite markers',
  star: 'Favorite markers',
};

const family = (name: string, icons: IconName[]) => ({ name, icons });
const reviewFamilies = [
  family('Directional', ['arrowRight', 'arrowDown', 'chevronRight', 'chevronDown', 'download', 'upload']),
  family('System symbols', ['check', 'xmark', 'plus', 'warning', 'infoCircle']),
  family('People', ['user', 'users']),
  family('Content', ['file', 'folder', 'mail', 'message']),
  family('Navigation and administration', ['house', 'grid', 'columns', 'gear']),
  family('Infrastructure', ['cloud', 'database', 'lock']),
  family('Data', ['chartBar', 'calendar']),
  family('Editing', ['pencil', 'trash']),
];

const strokeConditions = [
  { id: 'normal', label: 'Normal display', note: 'Neutral production canvas' },
  { id: 'low-contrast', label: 'Simulated low contrast', note: 'Muted foreground and reduced contrast' },
  { id: 'light', label: 'Light background', note: 'Dark foreground on white' },
  { id: 'dark', label: 'Dark background', note: 'Light foreground on dark surface' },
];

const uiVariants = [
  { id: 'light-normal', theme: 'light', density: 'normal' },
  { id: 'light-compact', theme: 'light', density: 'compact' },
  { id: 'dark-normal', theme: 'dark', density: 'normal' },
  { id: 'dark-compact', theme: 'dark', density: 'compact' },
] as const;

const voteChoices: Array<{ id: Vote; label: string }> = [
  { id: 'a', label: 'A better' },
  { id: 'b', label: 'B better' },
  { id: 'equal', label: 'Equal' },
  { id: 'redraw', label: 'Both need work' },
];

const activeReviewCopy = computed(() => {
  if (view.value === 'batch2') {
    return {
      eyebrow: 'Migration batch 2 · approved',
      note: 'Eight directional icons approved by the project owner.',
    };
  }
  if (view.value === 'batch3') {
    return {
      eyebrow: 'Migration batch 3 · approved',
      note: 'Seven derived-family icons approved by the project owner.',
    };
  }
  if (view.value === 'batch4') {
    return {
      eyebrow: 'Migration batch 4 · approved',
      note: 'Seven system-feedback icons approved by the project owner.',
    };
  }
  if (view.value === 'batch5') {
    return {
      eyebrow: 'Migration batch 5 · approved',
      note: 'Two visibility icons approved by the project owner.',
    };
  }
  if (view.value === 'batch6') {
    return {
      eyebrow: 'Migration batch 6 · approved',
      note: 'Three appearance icons approved by the project owner.',
    };
  }
  if (view.value === 'batch7') {
    return {
      eyebrow: 'Migration batch 7 · approved',
      note: 'Two time icons approved by the project owner.',
    };
  }
  if (view.value === 'batch8') {
    return {
      eyebrow: 'Migration batch 8 · approved',
      note: 'Three circular-motion icons approved by the project owner.',
    };
  }
  if (view.value === 'batch9') {
    return {
      eyebrow: 'Migration batch 9 · approved',
      note: 'Two content-operation icons approved by the project owner.',
    };
  }
  if (view.value === 'batch10') {
    return {
      eyebrow: 'Migration batch 10 · approved',
      note: 'Two storage-container icons approved by the project owner.',
    };
  }
  if (view.value === 'batch11') {
    return {
      eyebrow: 'Migration batch 11 · approved',
      note: 'Four long-directional icons approved by the project owner.',
    };
  }
  if (view.value === 'batch12') {
    return {
      eyebrow: 'Migration batch 12 · approved',
      note: 'Four turn-directional icons approved by the project owner.',
    };
  }
  if (view.value === 'batch13') {
    return {
      eyebrow: 'Migration batch 13 · approved',
      note: 'Two session-action icons approved by the project owner.',
    };
  }
  if (view.value === 'batch14') {
    return {
      eyebrow: 'Migration batch 14 · approved',
      note: 'Two filtering-action icons approved by the project owner.',
    };
  }
  if (view.value === 'batch15') {
    return {
      eyebrow: 'Migration batch 15 · approved',
      note: 'Two infrastructure-storage icons approved by the project owner.',
    };
  }
  if (view.value === 'batch16') {
    return {
      eyebrow: 'Migration batch 16 · approved',
      note: 'Two developer-tool icons approved by the project owner.',
    };
  }
  if (view.value === 'batch17') {
    return {
      eyebrow: 'Migration batch 17 · approved',
      note: 'Three financial-object icons approved by the project owner.',
    };
  }
  if (view.value === 'batch18') {
    return {
      eyebrow: 'Migration batch 18 · approved',
      note: 'Two workplace-object icons approved by the project owner.',
    };
  }
  if (view.value === 'batch19') {
    return {
      eyebrow: 'Migration batch 19 · approved',
      note: 'Two layout-action icons approved by the project owner.',
    };
  }
  if (view.value === 'batch20') {
    return {
      eyebrow: 'Migration batch 20 · approved',
      note: 'Two data-control icons approved by the project owner.',
    };
  }
  if (view.value === 'batch21') {
    return {
      eyebrow: 'Migration batch 21 · approved',
      note: 'Two navigation-link icons approved by the project owner.',
    };
  }
  if (view.value === 'batch22') {
    return {
      eyebrow: 'Migration batch 22 · approved',
      note: 'Two menu-trigger icons approved by the project owner.',
    };
  }
  if (view.value === 'batch23') {
    return {
      eyebrow: 'Migration batch 23 · approved',
      note: 'Three favorite-marker icons approved by the project owner.',
    };
  }
  return {
    eyebrow: 'Approved reference review',
    note: 'Icons render at their stated production size. The emphasized row is 20 px.',
  };
});

const activeReviewSet = computed(() => {
  if (view.value === 'batch2') return migrationBatch02;
  if (view.value === 'batch3') return migrationBatch03;
  if (view.value === 'batch4') return migrationBatch04;
  if (view.value === 'batch5') return migrationBatch05;
  if (view.value === 'batch6') return migrationBatch06;
  if (view.value === 'batch7') return migrationBatch07;
  if (view.value === 'batch8') return migrationBatch08;
  if (view.value === 'batch9') return migrationBatch09;
  if (view.value === 'batch10') return migrationBatch10;
  if (view.value === 'batch11') return migrationBatch11;
  if (view.value === 'batch12') return migrationBatch12;
  if (view.value === 'batch13') return migrationBatch13;
  if (view.value === 'batch14') return migrationBatch14;
  if (view.value === 'batch15') return migrationBatch15;
  if (view.value === 'batch16') return migrationBatch16;
  if (view.value === 'batch17') return migrationBatch17;
  if (view.value === 'batch18') return migrationBatch18;
  if (view.value === 'batch19') return migrationBatch19;
  if (view.value === 'batch20') return migrationBatch20;
  if (view.value === 'batch21') return migrationBatch21;
  if (view.value === 'batch22') return migrationBatch22;
  if (view.value === 'batch23') return migrationBatch23;
  return referenceSet;
});
const activeBeforeIcons = computed(() => {
  if (view.value === 'batch2') return migrationBatch02Before;
  if (view.value === 'batch3') return migrationBatch03Before;
  if (view.value === 'batch4') return migrationBatch04Before;
  if (view.value === 'batch5') return migrationBatch05Before;
  if (view.value === 'batch6') return migrationBatch06Before;
  if (view.value === 'batch7') return migrationBatch07Before;
  if (view.value === 'batch8') return migrationBatch08Before;
  if (view.value === 'batch9') return migrationBatch09Before;
  if (view.value === 'batch10') return migrationBatch10Before;
  if (view.value === 'batch11') return migrationBatch11Before;
  if (view.value === 'batch12') return migrationBatch12Before;
  if (view.value === 'batch13') return migrationBatch13Before;
  if (view.value === 'batch14') return migrationBatch14Before;
  if (view.value === 'batch15') return migrationBatch15Before;
  if (view.value === 'batch16') return migrationBatch16Before;
  if (view.value === 'batch17') return migrationBatch17Before;
  if (view.value === 'batch18') return migrationBatch18Before;
  if (view.value === 'batch19') return migrationBatch19Before;
  if (view.value === 'batch20') return migrationBatch20Before;
  if (view.value === 'batch21') return migrationBatch21Before;
  if (view.value === 'batch22') return migrationBatch22Before;
  if (view.value === 'batch23') return migrationBatch23Before;
  return beforeIcons;
});

const referenceReview = computed(() =>
  activeReviewSet.value.map((icon) => {
    const auditEntry = audit.icons.find((entry) => entry.icon === icon);
    if (!auditEntry) throw new Error(`Missing audit data for ${icon}`);
    return {
      ...auditEntry,
      icon,
      family: reviewFamilyByIcon[icon] ?? auditEntry.group,
      change: refinementIcons.has(icon) ? 'refinement' : 'complete redraw',
    };
  }),
);

const blindItems = computed<BlindItem[]>(() =>
  referenceSet.map((icon) => ({
    icon,
    oldIsA: [...icon].reduce((sum, character) => sum + character.charCodeAt(0), 0) % 2 === 0,
  })),
);

const voteSummary = computed(() => {
  const values = Object.values(votes.value);
  return {
    a: values.filter((value) => value === 'a').length,
    b: values.filter((value) => value === 'b').length,
    equal: values.filter((value) => value === 'equal').length,
    redraw: values.filter((value) => value === 'redraw').length,
    pending: referenceSet.length - values.length,
  };
});

const catalogItems = computed(() => audit.icons.filter((item) => !suspiciousOnly.value || item.warnings.length > 0));

const sizeStyle = (size: number) => ({ width: `${size}px`, height: `${size}px` });

const setVote = (icon: IconName, vote: Vote) => {
  votes.value = { ...votes.value, [icon]: vote };
  window.localStorage.setItem(voteStorageKey, JSON.stringify(votes.value));
};

const resetVotes = () => {
  votes.value = {};
  window.localStorage.removeItem(voteStorageKey);
};

onMounted(() => {
  const storedVotes = window.localStorage.getItem(voteStorageKey);
  if (!storedVotes) {
    window.localStorage.setItem(voteRevisionStorageKey, voteRevision);
    return;
  }

  try {
    const parsedVotes = JSON.parse(storedVotes) as Votes;

    if (window.localStorage.getItem(voteRevisionStorageKey) !== voteRevision) {
      for (const icon of revisedIcons) {
        delete parsedVotes[icon];
      }

      window.localStorage.setItem(voteStorageKey, JSON.stringify(parsedVotes));
      window.localStorage.setItem(voteRevisionStorageKey, voteRevision);
    }

    votes.value = parsedVotes;
  } catch {
    window.localStorage.removeItem(voteStorageKey);
    window.localStorage.setItem(voteRevisionStorageKey, voteRevision);
  }
});
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
:global(button),
:global(input) {
  font: inherit;
}
:global(button) {
  cursor: pointer;
}
.audit {
  --audit-canvas: var(--vf-color-background-canvas, #eef1f5);
  --audit-surface: var(--vf-color-background-surface, #fff);
  --audit-elevated: var(--vf-color-background-surface-elevated, var(--audit-surface));
  --audit-subtle: var(--vf-color-background-surface-subtle, #f3f5f8);
  --audit-hover: var(--vf-color-background-surface-hover, var(--audit-subtle));
  --audit-text: var(--vf-color-text-primary, #18202d);
  --audit-muted: var(--vf-color-text-muted, #687386);
  --audit-border: var(--vf-color-border-default, #d9dee7);
  --audit-divider: var(--vf-color-border-divider, var(--audit-border));
  --audit-accent: var(--vf-color-interactive-primary-background, #5b5bd6);
  --audit-accent-foreground: var(--vf-color-interactive-primary-foreground, #fff);
  --audit-accent-subtle: color-mix(in srgb, var(--audit-accent) 12%, var(--audit-surface));
  --audit-radius: var(--vf-layout-section-radius, 12px);
  --audit-space: var(--vf-layout-space-layout-base, 16px);
  min-height: 100%;
  padding-block: var(--audit-space);
  color: var(--audit-text);
  font-family: var(--vf-font-family-base, Inter, ui-sans-serif, system-ui, sans-serif);
  font-size: var(--vf-text-body-font-size, 14px);
  line-height: var(--vf-text-body-line-height, 1.45);
}
.audit__container {
  width: 100%;
  max-width: var(--vf-breakpoint-2xl, 1536px);
  margin-inline: auto;
}
.eyebrow {
  margin: 0;
  color: var(--audit-accent);
  font-size: var(--vf-text-caption-font-size, 11px);
  font-weight: var(--vf-text-caption-font-weight, 700);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
h2,
h3,
p {
  margin-top: 0;
}
h2 {
  margin-bottom: 0;
  font-family: var(--vf-font-family-heading, inherit);
  font-size: var(--vf-heading-h-3-font-size, 24px);
  font-weight: var(--vf-heading-font-weight, 700);
  line-height: var(--vf-heading-h-3-line-height, 1.2);
}
h3 {
  margin-bottom: 0;
}
.section-heading > p,
.mode-note {
  color: var(--audit-muted);
}
.mode-tabs {
  display: flex;
  gap: calc(var(--audit-space) * 0.25);
  overflow-x: auto;
  margin-bottom: var(--audit-space);
  padding: calc(var(--audit-space) * 0.375);
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.mode-tabs button,
.segmented button,
.reset-button,
.vote-actions button {
  min-height: 34px;
  padding: 0 11px;
  border: 0;
  border-radius: calc(var(--audit-radius) * 0.6);
  background: transparent;
  color: var(--audit-muted);
  white-space: nowrap;
}
.mode-tabs button.active,
.segmented button.active {
  background: var(--audit-accent);
  color: var(--audit-accent-foreground);
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--audit-space);
  margin-bottom: var(--audit-space);
}
.section-heading > p {
  min-width: 0;
  max-width: 520px;
  margin-bottom: 0;
  overflow-wrap: anywhere;
  text-align: right;
}
.reference-review {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 720px), 1fr));
  gap: var(--audit-space);
  min-width: 0;
}
.reference-review > .section-heading {
  grid-column: 1 / -1;
}
.reference-card {
  min-width: 0;
  padding: var(--vf-layout-section-inset-default, var(--audit-space));
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.reference-card__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  margin-bottom: 14px;
}
.reference-card__header div {
  display: grid;
}
.reference-card__header div span {
  color: var(--audit-muted);
  font-size: 12px;
}
.change-badge {
  padding: 3px 7px;
  border-radius: 999px;
  background: var(--audit-accent-subtle);
  color: var(--audit-accent);
  font-size: 10px;
  font-weight: 750;
  text-transform: uppercase;
}
.reference-card__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(240px, 280px);
  gap: 20px;
  min-width: 0;
}
.reference-samples {
  display: grid;
  align-content: start;
  min-width: 0;
}
.sample-head,
.sample-row {
  display: grid;
  grid-template-columns: 54px repeat(3, 1fr);
  align-items: center;
  min-height: 46px;
  text-align: center;
}
.sample-head {
  min-height: 27px;
  color: var(--audit-muted);
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.sample-row {
  border-top: 1px solid var(--audit-divider);
}
.sample-row > strong {
  color: var(--audit-muted);
  font-size: 11px;
}
.sample-row--primary {
  min-height: 62px;
  border: 1px solid color-mix(in srgb, var(--audit-accent) 55%, var(--audit-border));
  border-radius: 8px;
  background: var(--audit-accent-subtle);
}
.actual-size-stage {
  position: relative;
  display: grid;
  min-height: 36px;
  place-items: center;
}
.before-icon,
.after-icon {
  display: inline-grid;
  color: currentColor;
}
.before-icon :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
.overlay-stage > * {
  grid-area: 1 / 1;
}
.overlay-old {
  color: var(--vf-color-status-danger-icon, #e04b77);
  opacity: 0.6;
}
.overlay-new {
  color: var(--vf-color-status-info-icon, #1478c9);
  opacity: 0.6;
}
.measurement-block {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 14px;
  align-items: start;
  min-width: 0;
}
.measure-canvas {
  position: relative;
  width: 120px;
  height: 120px;
  overflow: hidden;
  border: 1px solid var(--audit-border);
  background-size: 12px 12px;
  background-image:
    linear-gradient(45deg, var(--audit-subtle) 25%, transparent 25%),
    linear-gradient(-45deg, var(--audit-subtle) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, var(--audit-subtle) 75%),
    linear-gradient(-45deg, transparent 75%, var(--audit-subtle) 75%);
}
.measure-canvas :deep(.vf-icon-wrapper) {
  position: absolute;
  inset: 0;
}
.measure-canvas :deep(svg) {
  width: 100%;
  height: 100%;
}
.axis,
.bounds,
.visual-center {
  position: absolute;
  pointer-events: none;
}
.axis {
  background: color-mix(in srgb, var(--audit-accent) 32%, transparent);
}
.axis--x {
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  transform: translateY(-50%);
}
.axis--y {
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  transform: translateX(-50%);
}
.bounds {
  outline: 1px solid var(--vf-color-status-danger-icon, #e14d7b);
  outline-offset: 1px;
}
.visual-center {
  top: 50%;
  left: 50%;
  box-sizing: border-box;
  width: 8px;
  height: 8px;
  border: 1px solid var(--vf-color-status-success-icon, #139769);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}
dl {
  display: grid;
  gap: 5px;
  min-width: 0;
  margin: 0;
}
dl div {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px dotted var(--audit-border);
}
dt {
  color: var(--audit-muted);
}
dd {
  margin: 0;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}
.stroke-review,
.ui-review,
.family-review,
.blind-review {
  display: grid;
  gap: var(--audit-space);
}
.stroke-condition {
  overflow: hidden;
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.stroke-condition > header {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--audit-divider);
}
.stroke-condition > header span {
  color: var(--audit-muted);
}
.stroke-surface {
  padding: 12px;
  background: var(--audit-surface);
  color: var(--audit-text);
}
.stroke-surface--low-contrast {
  background: var(--audit-subtle);
  color: color-mix(in srgb, var(--audit-muted) 72%, var(--audit-subtle));
}
.stroke-surface--light {
  background: white;
  color: #111827;
}
.stroke-surface--dark {
  background: #151a23;
  color: #eef2f8;
}
.stroke-grid {
  display: grid;
  grid-template-columns: 55px repeat(3, 1fr);
  align-items: center;
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}
.stroke-grid--head {
  min-height: 30px;
  border-top: 0;
  text-align: center;
}
.stroke-grid > strong:first-child {
  font-size: 11px;
}
.stroke-cell {
  display: grid;
  grid-template-columns: repeat(10, minmax(22px, 1fr));
  align-items: center;
  justify-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 7px;
  border-left: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}
.stroke-preview :deep(svg) {
  stroke-width: var(--review-stroke);
}
.saas-frame {
  overflow: hidden;
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.saas-frame__label {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--audit-divider);
  background: var(--audit-subtle);
  font-size: 11px;
  text-transform: capitalize;
}
.saas-frame__label span {
  color: var(--audit-muted);
}
.saas-app {
  --ui-bg: #f5f7fa;
  --ui-surface: #fff;
  --ui-ink: #1d2635;
  --ui-muted: #6e7888;
  --ui-line: #dce1e8;
  --ui-accent: #5b5bd6;
  display: grid;
  grid-template-columns: 170px 1fr;
  min-height: 520px;
  background: var(--ui-bg);
  color: var(--ui-ink);
  font-size: 12px;
}
.saas-frame--dark .saas-app {
  --ui-bg: #11161e;
  --ui-surface: #1b222d;
  --ui-ink: #edf1f7;
  --ui-muted: #9ba5b5;
  --ui-line: #343d4a;
  --ui-accent: #aaa9ff;
}
.saas-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 10px;
  border-right: 1px solid var(--ui-line);
  background: var(--ui-surface);
}
.saas-logo,
.saas-user,
.saas-sidebar nav span,
.saas-toolbar,
.saas-search,
.ui-button,
.saas-tabs span,
.dashboard-cards > div,
.ui-alert,
.ui-notification,
.data-panel__head,
.data-panel td,
.pagination,
.empty-state {
  display: flex;
  align-items: center;
}
.saas-logo,
.saas-user,
.saas-sidebar nav span {
  gap: 8px;
}
.saas-sidebar nav {
  display: grid;
  gap: 3px;
}
.saas-sidebar nav span {
  min-height: 34px;
  padding: 0 8px;
  border-radius: 7px;
  color: var(--ui-muted);
}
.saas-sidebar nav span.selected {
  background: color-mix(in srgb, var(--ui-accent) 11%, transparent);
  color: var(--ui-accent);
}
.saas-user {
  margin-top: auto;
  padding: 8px;
  border-top: 1px solid var(--ui-line);
}
.saas-main {
  min-width: 0;
}
.saas-toolbar {
  justify-content: flex-end;
  gap: 7px;
  min-height: 52px;
  padding: 8px 14px;
  border-bottom: 1px solid var(--ui-line);
  background: var(--ui-surface);
}
.saas-search {
  width: 220px;
  min-height: 34px;
  margin-right: auto;
  padding: 0 10px;
  gap: 7px;
  border: 1px solid var(--ui-line);
  border-radius: 7px;
  color: var(--ui-muted);
}
.ui-icon-button,
.ui-button,
.row-actions button,
.pagination button {
  display: inline-grid;
  min-width: 32px;
  min-height: 32px;
  padding: 0;
  place-items: center;
  border: 1px solid var(--ui-line);
  border-radius: 7px;
  background: var(--ui-surface);
  color: var(--ui-ink);
}
.ui-button {
  display: inline-flex;
  padding: 0 10px;
  gap: 6px;
}
.saas-content {
  display: grid;
  gap: 12px;
  padding: 16px;
}
.saas-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.saas-title small {
  color: var(--ui-muted);
}
.saas-title h3 {
  font-size: 18px;
}
.saas-tabs {
  display: flex;
  gap: 4px;
  border-bottom: 1px solid var(--ui-line);
}
.saas-tabs span {
  gap: 6px;
  min-height: 34px;
  padding: 0 9px;
  color: var(--ui-muted);
}
.saas-tabs span.active {
  border-bottom: 2px solid var(--ui-accent);
  color: var(--ui-accent);
}
.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 9px;
}
.dashboard-cards > div {
  gap: 9px;
  padding: 11px;
  border: 1px solid var(--ui-line);
  border-radius: 8px;
  background: var(--ui-surface);
}
.dashboard-cards span {
  display: grid;
  color: var(--ui-muted);
}
.dashboard-cards strong {
  color: var(--ui-ink);
  font-size: 16px;
}
.inline-messages {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.ui-alert,
.ui-notification {
  min-height: 34px;
  padding: 0 10px;
  gap: 7px;
  border-radius: 7px;
}
.ui-alert {
  background: #fff2e6;
  color: #9b4b0f;
}
.ui-notification {
  background: color-mix(in srgb, var(--ui-accent) 10%, var(--ui-surface));
  color: var(--ui-accent);
}
.data-panel {
  border: 1px solid var(--ui-line);
  border-radius: 9px;
  background: var(--ui-surface);
}
.data-panel__head {
  justify-content: space-between;
  min-height: 42px;
  padding: 0 10px;
  border-bottom: 1px solid var(--ui-line);
}
.dropdown-demo {
  position: relative;
}
.dropdown-menu {
  position: absolute;
  z-index: 2;
  top: 36px;
  right: 0;
  width: 100px;
  padding: 5px;
  border: 1px solid var(--ui-line);
  border-radius: 7px;
  background: var(--ui-surface);
  box-shadow: 0 8px 20px rgb(0 0 0 / 10%);
}
.dropdown-menu span {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px;
}
.data-panel table {
  width: 100%;
  border-collapse: collapse;
}
.data-panel th,
.data-panel td {
  height: 38px;
  padding: 0 10px;
  border-bottom: 1px solid var(--ui-line);
  text-align: left;
}
.data-panel td {
  gap: 6px;
}
.data-panel th {
  color: var(--ui-muted);
  font-size: 10px;
}
.row-actions {
  justify-content: flex-end;
}
.row-actions button {
  min-width: 28px;
  min-height: 28px;
  margin-left: 4px;
}
.status-dot {
  color: #15805e;
}
.pagination {
  justify-content: flex-end;
  gap: 5px;
  min-height: 38px;
  padding: 0 9px;
}
.pagination span {
  margin-right: auto;
  color: var(--ui-muted);
}
.pagination button {
  min-width: 27px;
  min-height: 27px;
}
.empty-state {
  gap: 10px;
  padding: 10px;
  border: 1px dashed var(--ui-line);
  border-radius: 8px;
  background: var(--ui-surface);
}
.empty-state div {
  display: grid;
  flex: 1;
}
.empty-state span {
  color: var(--ui-muted);
}
.saas-frame--compact .saas-app {
  grid-template-columns: 150px 1fr;
  font-size: 11px;
}
.saas-frame--compact .saas-sidebar {
  padding: 10px 7px;
}
.saas-frame--compact .saas-sidebar nav span {
  min-height: 28px;
}
.saas-frame--compact .saas-toolbar {
  min-height: 44px;
}
.saas-frame--compact .saas-content {
  gap: 8px;
  padding: 10px;
}
.saas-frame--compact .dashboard-cards > div {
  padding: 7px;
}
.saas-frame--compact .data-panel th,
.saas-frame--compact .data-panel td {
  height: 32px;
}
.family-review > article {
  padding: var(--vf-layout-section-inset-default, var(--audit-space));
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.family-glyphs {
  display: flex;
  align-items: center;
  gap: 28px;
  min-height: 52px;
}
.family-review article p {
  margin: 10px 0 0;
  color: var(--audit-muted);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.segmented {
  display: flex;
  padding: 4px;
  border: 1px solid var(--audit-border);
  border-radius: 9px;
  background: var(--audit-surface);
}
.mass-grid {
  display: grid;
  grid-template-columns: repeat(15, 20px);
  gap: 18px;
  align-items: center;
  justify-content: start;
  padding: 20px 0;
  color: var(--audit-text);
}
.mass-grid--silhouette :deep(svg) {
  stroke-width: 2.6;
}
.mode-note {
  font-size: 12px;
}
.reset-button {
  border: 1px solid var(--audit-border);
  background: var(--audit-surface);
}
.blind-summary {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}
.blind-summary div {
  display: grid;
  padding: 12px;
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.blind-summary strong {
  font-size: 22px;
}
.blind-summary span {
  color: var(--audit-muted);
  font-size: 11px;
}
.blind-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}
.blind-grid article {
  padding: var(--vf-layout-section-inset-default, var(--audit-space));
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.blind-grid article > header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}
.blind-grid article > header span {
  color: var(--audit-muted);
  font-size: 11px;
}
.blind-variants {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.blind-variants > div {
  display: grid;
  min-height: 76px;
  place-items: center;
  border-radius: 8px;
  background: var(--audit-subtle);
}
.blind-variants > div > strong {
  font-size: 11px;
}
.vote-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin-top: 9px;
}
.vote-actions button {
  border: 1px solid var(--audit-border);
  background: var(--audit-surface);
  font-size: 11px;
}
.vote-actions button.selected {
  border-color: var(--audit-accent);
  background: var(--audit-accent-subtle);
  color: var(--audit-accent);
}
.catalog-review label {
  display: flex;
  gap: 7px;
}
.catalog-table {
  overflow: auto;
  border: var(--vf-layout-border-base, 1px solid var(--audit-border));
  border-radius: var(--audit-radius);
  background: var(--vf-layout-surface-base, var(--audit-surface));
}
.catalog-table table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
  font-size: 12px;
}
.catalog-table th,
.catalog-table td {
  min-height: 40px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--audit-divider);
  text-align: left;
}
.catalog-table th {
  color: var(--audit-muted);
  font-size: 10px;
  text-transform: uppercase;
}
@media (max-width: 900px) {
  .reference-card__body {
    grid-template-columns: 1fr;
  }
  .stroke-cell {
    grid-template-columns: repeat(6, 1fr);
  }
  .saas-app {
    grid-template-columns: 130px 1fr;
  }
  .dashboard-cards {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 620px) {
  .section-heading {
    align-items: start;
    flex-direction: column;
  }
  .section-heading > p {
    text-align: left;
  }
  .reference-card__body {
    min-width: 0;
  }
  .measurement-block {
    grid-template-columns: 100px 1fr;
  }
  .measure-canvas {
    width: 100px;
    height: 100px;
  }
  .stroke-grid {
    grid-template-columns: 42px repeat(3, minmax(220px, 1fr));
  }
  .stroke-surface {
    overflow: auto;
  }
  .saas-app {
    grid-template-columns: 1fr;
  }
  .saas-sidebar {
    display: none;
  }
  .blind-summary {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
