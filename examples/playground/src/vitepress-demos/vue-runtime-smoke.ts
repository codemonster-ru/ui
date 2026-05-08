import { defineComponent, h } from 'vue';
import { VfBadge, VfButton, VfCard } from '@codemonster-ru/vueforge-core';
import '@codemonster-ru/vueforge-core/styles.css';

export default defineComponent({
  name: 'VueRuntimeSmokeDemo',
  setup() {
    return () =>
      h(
        'main',
        {
          style:
            [
              'padding: var(--vf-layout-space-layout-lg)',
              'display: grid',
              'align-content: start',
              'gap: var(--vf-layout-space-layout-base)',
              'background: linear-gradient(180deg, color-mix(in oklab, var(--vf-color-bg) 92%, var(--vf-color-brand-primary) 8%), var(--vf-color-bg))'
            ].join(';')
        },
        [
          h(VfCard, { style: 'width: min(100%, 840px); margin-inline: auto;' }, {
            default: () =>
              h('div', { style: 'display:grid;gap:calc(var(--vf-layout-space-layout-base) * 0.75);' }, [
                h('h2', { style: 'margin:0;' }, 'Vue runtime smoke'),
                h('p', { style: 'margin:0;' }, 'Bundled by Vite, rendered without iframe runtime.'),
                h(VfBadge, { variant: 'primary' }, { default: () => 'vueforge-core' }),
                h(VfButton, { variant: 'primary' }, { default: () => 'Smoke passed' })
              ])
          }),
          h(
            'div',
            {
              style:
                'width:min(100%,840px);margin-inline:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;'
            },
            [
              h(VfCard, null, { default: () => h('p', { style: 'margin:0;' }, 'Vue 3 + Vite build') }),
              h(VfCard, null, { default: () => h('p', { style: 'margin:0;' }, 'VueForge tokens') }),
              h(VfCard, null, { default: () => h('p', { style: 'margin:0;' }, 'No iframe runtime') })
            ]
          )
        ]
      );
  }
});
