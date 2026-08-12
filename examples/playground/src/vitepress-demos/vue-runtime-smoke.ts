import { defineComponent, h } from 'vue';
import { CmBadge, CmButton, CmCard } from '@codemonster-ru/ui-vue';
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
              'background: linear-gradient(180deg, color-mix(in oklab, var(--vf-color-background-canvas) 92%, var(--vf-color-brand-primary) 8%), var(--vf-color-background-canvas))'
            ].join(';')
        },
        [
          h(CmCard, { style: 'width: min(100%, 840px); margin-inline: auto;' }, {
            default: () =>
              h('div', { style: 'display:grid;gap:calc(var(--vf-layout-space-layout-base) * 0.75);' }, [
                h('h2', { style: 'margin:0;' }, 'Vue runtime smoke'),
                h('p', { style: 'margin:0;' }, 'Bundled by Vite, rendered without iframe runtime.'),
                h(CmBadge, { tone: 'primary' }, { default: () => 'CodeMonster UI' }),
                h(CmButton, { variant: 'primary' }, { default: () => 'Smoke passed' })
              ])
          }),
          h(
            'div',
            {
              style:
                'width:min(100%,840px);margin-inline:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;'
            },
            [
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'Vue 3 + Vite build') }),
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'CodeMonster UI tokens') }),
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'No iframe runtime') })
            ]
          )
        ]
      );
  }
});
