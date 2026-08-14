import { defineComponent, h } from 'vue';
import { CmBadge, CmButton, CmCard } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/styles.css';

export default defineComponent({
  name: 'VueRuntimeSmokeDemo',
  setup() {
    return () =>
      h(
        'main',
        {
          style:
            [
              'padding: var(--cm-space-6)',
              'display: grid',
              'align-content: start',
              'gap: var(--cm-space-4)',
              'background: linear-gradient(180deg, color-mix(in oklab, var(--cm-color-background-canvas) 92%, var(--cm-color-interactive-primary-background) 8%), var(--cm-color-background-canvas))'
            ].join(';')
        },
        [
          h(CmCard, { style: 'width: min(100%, 840px); margin-inline: auto;' }, {
            default: () =>
              h('div', { style: 'display:grid;gap:var(--cm-space-3);' }, [
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
