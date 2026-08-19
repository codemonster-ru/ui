<script setup lang="ts">
import { ref } from 'vue';
import {
  CmAccordion,
  CmButton,
  CmCard,
  CmContainer,
  CmField,
  CmInput,
  CmInline,
  CmSection,
  CmStack,
} from '@codemonster-ru/ui-vue';
import parityShowcase from '../../shared/parity-showcase.json';

import '@codemonster-ru/ui-css/accordion.css';
import '@codemonster-ru/ui-css/button.css';
import '@codemonster-ru/ui-css/card.css';
import '@codemonster-ru/ui-css/container.css';
import '@codemonster-ru/ui-css/field.css';
import '@codemonster-ru/ui-css/input.css';
import '@codemonster-ru/ui-css/inline.css';
import '@codemonster-ru/ui-css/section.css';
import '@codemonster-ru/ui-css/stack.css';

const email = ref(parityShowcase.form.email);
</script>

<template>
  <CmContainer element="main" size="lg" class="parity-showcase">
    <CmSection>
      <CmStack gap="lg">
        <header>
          <h1>{{ parityShowcase.title }}</h1>
          <p>{{ parityShowcase.intro }}</p>
        </header>

        <CmCard title="Button">
          <CmStack gap="sm">
            <CmInline gap="sm">
              <CmButton>{{ parityShowcase.button.primaryLabel }}</CmButton>
              <CmButton variant="secondary">{{ parityShowcase.button.secondaryLabel }}</CmButton>
              <CmButton loading>{{ parityShowcase.button.loadingLabel }}</CmButton>
            </CmInline>
          </CmStack>
        </CmCard>

        <CmCard :title="parityShowcase.card.title">
          <template #footer>{{ parityShowcase.card.footer }}</template>
        </CmCard>

        <CmCard title="Field and Input">
          <form @submit.prevent>
            <CmStack gap="md">
              <CmField
                :control-id="parityShowcase.form.controlId"
                label="Email"
                :description="parityShowcase.form.description"
                required
              >
                <CmInput
                  :id="parityShowcase.form.controlId"
                  v-model="email"
                  name="email"
                  type="email"
                  required
                />
              </CmField>
              <CmButton type="submit">Save profile</CmButton>
            </CmStack>
          </form>
        </CmCard>

        <CmCard title="Accordion">
          <CmAccordion
            :id="parityShowcase.accordion.id"
            :items="parityShowcase.accordion.items"
            :default-open-items="parityShowcase.accordion.defaultOpenItems"
          />
        </CmCard>
      </CmStack>
    </CmSection>
  </CmContainer>
</template>
