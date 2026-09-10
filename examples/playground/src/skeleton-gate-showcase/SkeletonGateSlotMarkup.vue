<template>
  <template v-if="shape === 'paragraphs'">
    <p>Storage, seats and outbound transfer.</p>
    <p>Updated hourly.</p>
  </template>
  <template v-else-if="shape === 'article'">
    <h4>Billing period</h4>
    <p>Storage, seats and outbound transfer for the current period.</p>
    <ul>
      <li>Storage: 42 GB</li>
      <li>Seats: 12</li>
    </ul>
  </template>
  <template v-else-if="shape === 'bars'">
    <div class="parity-bar" style="height: 12px; background: #ccc"></div>
    <div class="parity-bar" style="height: 12px; background: #ccc; margin-top: 6px"></div>
  </template>
</template>

<script setup lang="ts">
// The consumer markup a shared gate case names.
//
// The catalog names a shape rather than carrying HTML, so the two showcase
// applications and the two parity fixtures all build the same elements from the
// same name. Showcase fixture only: this is what a consumer writes into the
// gate's slots, and nothing here is component implementation.
defineProps<{ shape: 'paragraphs' | 'article' | 'bars' }>();
</script>
