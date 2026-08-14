import { defineComponent, h } from 'vue';
import { CmBadge, CmButton, CmCard } from '@codemonster-ru/ui-vue';
import '@codemonster-ru/ui-css/styles.css';

export default defineComponent({
  name: 'CustomResolverSmokeDemo',
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
              'background: linear-gradient(180deg, color-mix(in oklab, var(--cm-color-background-canvas) 94%, var(--cm-color-status-help-solid-background) 6%), var(--cm-color-background-canvas))'
            ].join(';')
        },
        [
          h(CmCard, { style: 'width: min(100%, 840px); margin-inline: auto;' }, {
            default: () =>
              h('div', { style: 'display:grid;gap:var(--cm-space-3);' }, [
                h('h2', { style: 'margin:0;' }, 'Custom resolver smoke'),
                h('p', { style: 'margin:0;' }, 'Vite-built preview path (vitepress-like).'),
                h(CmBadge, { tone: 'neutral' }, { default: () => 'resolveImport' }),
                h(CmButton, { variant: 'secondary' }, { default: () => 'Resolver passed' })
              ])
          }),
          h(
            'div',
            {
              style:
                'width:min(100%,840px);margin-inline:auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;'
            },
            [
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'Host controls imports') }),
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'Stable module graph') }),
              h(CmCard, null, { default: () => h('p', { style: 'margin:0;' }, 'No CORS trap') })
            ]
          )
        ]
      );
  }
});
