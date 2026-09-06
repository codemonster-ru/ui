<!--
  Unchanged historical consumer of VfInput, kept as a compile-and-run fixture
  for the migration gate (architecture plan, section 18.1, "Historical API").

  It is written the way a consumer writes it at reference commit
  fd793696f50d3be0fcd3788f0f8f751c63869963: package-level imports, the public
  prop names, the documented slots, v-model, native attributes and the exported
  `VfControlSize` type. `@/index` and `@/components/input` are the source
  modules behind the published `.` and `./input` subpaths recorded in
  baseline/reference-inventory.json.

  Do not modernise this file. If a migration step forces an edit here, that edit
  is the regression.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { VfField, type VfControlSize } from '@/index';
import { VfInput } from '@/components/input';

const workspace = ref('Acme');
const search = ref('');
const secret = ref('hunter2');
const seats = ref('5');
const startsOn = ref('2025-01-01');
const amount = ref('');
const size = ref<VfControlSize>('md');
const lastEmitted = ref('');

function onSearchUpdate(value: string): void {
  lastEmitted.value = value;
}
</script>

<template>
  <form class="historical-consumer" @submit.prevent>
    <VfField label="Workspace name" description="Shown in workspace settings." label-placement="floating" required>
      <template #default="{ controlId, describedBy, invalid, required }">
        <VfInput
          :id="controlId"
          v-model="workspace"
          :size="size"
          :invalid="invalid"
          :aria-describedby="describedBy"
          :aria-required="required ? 'true' : undefined"
          name="workspace"
          autocomplete="organization"
          placeholder="Acme"
        />
      </template>
    </VfField>

    <VfInput
      v-model="search"
      class="historical-consumer__search"
      leading-icon="magnifyingGlass"
      trailing-icon="circleInfo"
      clearable
      size="sm"
      type="search"
      name="q"
      placeholder="Search"
      @update:model-value="onSearchUpdate"
    />

    <VfField label="Password" error="Too short.">
      <template #default="{ controlId, describedBy, invalid }">
        <VfInput
          :id="controlId"
          v-model="secret"
          :invalid="invalid"
          :aria-describedby="describedBy"
          type="password"
          name="password"
          autocomplete="current-password"
          password-reveal
          clearable
        />
      </template>
    </VfField>

    <VfInput v-model="seats" type="number" name="seats" min="1" max="99" step="1" size="lg" />

    <VfInput v-model="startsOn" type="date" name="starts-on" leading-icon="calendar" />

    <VfInput v-model="amount" class="historical-consumer__amount" name="amount" inputmode="decimal" readonly>
      <template #leading><span class="historical-consumer__prefix">$</span></template>
      <template #trailing><span class="historical-consumer__suffix">USD</span></template>
    </VfInput>

    <output class="historical-consumer__echo">{{ lastEmitted }}</output>
  </form>
</template>
