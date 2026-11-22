<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { CmButton, CmConfirmDialog, CmInline, CmStack, CmTag } from '@codemonster-ru/ui-vue';

type DialogProps = InstanceType<typeof CmConfirmDialog>['$props'];
interface Scenario {
  id: string;
  label: string;
  props?: DialogProps;
  footer?: boolean;
}

defineProps<{ staticPreview?: boolean }>();

const samples: Scenario[] = [
  { id: 'default', label: 'sm' },
  { id: 'medium', label: 'md', props: { size: 'md' } },
  { id: 'large', label: 'lg', props: { size: 'lg' } },
  {
    id: 'labels',
    label: 'Custom confirm',
    props: {
      title: 'Archive project?',
      description: 'The project will move to the archive.',
      confirmLabel: 'Archive',
      cancelLabel: 'Keep project',
      confirmVariant: 'primary',
      dividers: false,
      initialFocus: 'confirm',
    },
  },
  { id: 'disabled', label: 'Disabled confirm', props: { disabled: true, initialFocus: 'confirm' } },
  { id: 'loading', label: 'Loading', props: { loading: true } },
  { id: 'keep-open', label: 'Stay open', props: { closeOnConfirm: false } },
  { id: 'footer', label: 'Custom footer', footer: true },
];
const states = reactive<Record<string, { open: boolean; loading: boolean }>>(
  Object.fromEntries(samples.map(({ id }) => [id, { open: false, loading: false }])),
);
const lastResult = ref('');

function open(sample: Scenario) {
  Object.assign(states[sample.id], { open: true, loading: sample.props?.loading ?? false });
}

async function finishLoading(id: string, event: MouseEvent) {
  const dialog = (event.currentTarget as HTMLElement).closest('dialog');
  states[id].loading = false;
  await nextTick();
  dialog?.querySelector<HTMLButtonElement>('.cm-confirm-dialog__actions button')?.focus();
}
</script>

<template>
  <CmStack
    id="demo-confirm-dialog"
    as="section"
    class="showcase-contracts"
    data-showcase-component="confirm-dialog"
    aria-labelledby="component-confirm-dialog"
  >
    <header><h3 id="component-confirm-dialog" class="showcase-component-title">Confirm Dialog</h3></header>
    <CmInline class="showcase-modal-launchers">
      <div
        v-for="sample in samples"
        :id="`preview-confirm-dialog-${sample.id}`"
        :key="sample.id"
        class="showcase-demo"
        :data-showcase-example="`confirm-dialog-${sample.id}`"
        :data-confirm-keep-open="sample.props?.closeOnConfirm === false ? '' : undefined"
      >
        <CmButton
          variant="secondary"
          :aria-label="`${sample.label} (Confirm Dialog)`"
          :data-showcase-open="staticPreview ? '' : undefined"
          @click="open(sample)"
        >
          {{ sample.label }}
        </CmButton>
        <CmConfirmDialog
          v-bind="sample.props"
          v-model:open="states[sample.id].open"
          :disable-teleport="staticPreview"
          :initial-focus="staticPreview && sample.props?.loading ? 'dialog' : sample.props?.initialFocus"
          :loading="states[sample.id].loading"
          @confirm="lastResult = `${sample.label} · Confirmed`"
          @cancel="lastResult = `${sample.label} · Cancelled`"
        >
          <CmButton
            v-if="states[sample.id].loading || (staticPreview && sample.props?.loading)"
            variant="secondary"
            data-confirm-finish
            @click="finishLoading(sample.id, $event)"
          >
            Finish loading
          </CmButton>
          <template v-if="staticPreview && sample.props?.loading" #footer>
            <CmButton variant="secondary" disabled>Cancel</CmButton>
            <CmButton variant="danger" loading>Confirm</CmButton>
          </template>
          <template v-else-if="sample.footer" #footer="{ cancel, confirm }">
            <CmButton variant="secondary" @click="cancel">Go back</CmButton>
            <CmButton @click="confirm">Apply change</CmButton>
          </template>
        </CmConfirmDialog>
      </div>
    </CmInline>
    <CmInline role="status" data-confirm-result>
      <CmTag v-if="staticPreview || lastResult" v-show="lastResult">{{ lastResult }}</CmTag>
    </CmInline>
  </CmStack>
</template>
