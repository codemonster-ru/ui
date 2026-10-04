// Characterization of the historical VfTable at reference commit
// fd793696f50d3be0fcd3788f0f8f751c63869963.
//
// A native table inside two wrappers: div.vf-table-wrap, which is the
// component's root and the element every consumer attribute lands on, and
// div.vf-table-scroll, which owns the horizontal overflow. The table itself
// carries only its own class list. It owns no interaction and no generated id.
//
// Empirically established facts that are easy to "correct" and must not be:
//
//   - inheritAttrs is false and the attributes are bound onto the wrapper, so
//     a consumer class, style, id, aria-* or listener never reaches the
//     table. A port that moved them to the table - where `aria-label` would
//     at least name something - changes what every existing stylesheet and
//     test selects;
//   - there are two wrappers, not one. The scroll container has no tabindex,
//     no role and no label, so it is not keyboard scrollable by itself;
//   - the caption is present when the prop is truthy *or* a caption slot is
//     passed; the slot replaces the prop, and a slot that renders nothing
//     falls back to the prop text. "" is no caption and "0" is one;
//   - thead, tbody and tfoot are each keyed on the *presence* of their slot,
//     not on what it renders: an empty slot still produces an empty section.
//     There is no prop that opens any of them;
//   - the four modifiers are table classes, in the fixed order
//     column-dividers, compact, striped, sticky-header, independent of the
//     order the props are written in. Sticky headers are pure CSS: the class
//     and the stylesheet rule, no inline style and no script.
import { mount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createSSRApp, defineComponent, h, nextTick, ref } from 'vue';
import { describe, expect, it } from 'vitest';

import VfTable from './VfTable.vue';

type TableProps = InstanceType<typeof VfTable>['$props'];

const HEADER = '<tr><th>Name</th><th>Role</th></tr>';
const BODY = '<tr><td>Ada</td><td>Admin</td></tr><tr><td>Lin</td><td>Viewer</td></tr>';
const FOOTER = '<tr><td colspan="2">2 members</td></tr>';

function mountTable({
  props = {},
  attrs = {},
  slots = {},
}: {
  props?: Partial<TableProps>;
  attrs?: Record<string, unknown>;
  slots?: Record<string, unknown>;
} = {}) {
  return mount(VfTable, { props: props as TableProps, attrs, slots: slots as never });
}

async function ssrTable(props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) {
  return await renderToString(createSSRApp({ render: () => h(VfTable, props, slots) }));
}

const sections = (wrapper: ReturnType<typeof mountTable>) =>
  Array.from(wrapper.get('table').element.children).map((child) => `${child.tagName.toLowerCase()}.${child.className}`);

/** The stylesheet rule text for a selector, following one forwarding @import if the entry is a forward. */
function cssRule(selector: string): string {
  const entry = resolve(import.meta.dirname, '../../styles/entries/table.css');
  let source = readFileSync(entry, 'utf8');
  const forward = /^@import '([^']+)';\s*$/.exec(source.trim());
  if (forward) source = readFileSync(resolve(dirname(entry), forward[1]), 'utf8');
  const start = source.indexOf(`${selector} {`);
  if (start < 0) return '';

  return source.slice(start, source.indexOf('}', start) + 1);
}

// ------------------------------------------------------------------ API

describe('VfTable characterization: props and options', () => {
  it('accepts exactly five props with the historical defaults and types', () => {
    const declared = (VfTable as unknown as { props: Record<string, { default?: unknown; type: unknown }> }).props;

    expect(Object.keys(declared).sort()).toEqual(['caption', 'columnDividers', 'compact', 'stickyHeader', 'striped']);
    expect(declared.caption.default).toBeUndefined();
    expect(declared.caption.type).toBe(String);
    for (const name of ['columnDividers', 'compact', 'striped', 'stickyHeader']) {
      expect(declared[name].default).toBe(false);
      expect(declared[name].type).toBe(Boolean);
    }
  });

  it('sets inheritAttrs to false and declares no emits', () => {
    expect((VfTable as unknown as { inheritAttrs?: boolean }).inheritAttrs).toBe(false);
    expect((VfTable as unknown as { emits?: unknown }).emits).toBeUndefined();
  });
});

// ------------------------------------------------------------------ structure

describe('VfTable characterization: structure', () => {
  it('renders exactly the historical minimal markup: two wrappers around an empty table', () => {
    expect(mountTable().html({ raw: true })).toBe(
      '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table">' +
        '<!--v-if--><!--v-if--><!--v-if--><!--v-if-->' +
        '</table></div></div>',
    );
  });

  it('renders exactly the historical full markup', () => {
    const wrapper = mountTable({
      props: { caption: 'Members' },
      slots: { header: HEADER, default: BODY, footer: FOOTER },
    });

    expect(wrapper.html({ raw: true })).toBe(
      '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table">' +
        '<caption class="vf-table__caption">Members</caption>' +
        `<thead class="vf-table__head">${HEADER}</thead>` +
        `<tbody class="vf-table__body">${BODY}</tbody>` +
        `<tfoot class="vf-table__foot">${FOOTER}</tfoot>` +
        '</table></div></div>',
    );
  });

  it('nests exactly one scroll container in the wrapper and exactly one table in the scroll container', () => {
    const root = mountTable({ slots: { default: BODY } }).element as HTMLElement;

    expect(root.tagName).toBe('DIV');
    expect(root.children).toHaveLength(1);
    expect(root.children[0].tagName).toBe('DIV');
    expect(root.children[0].className).toBe('vf-table-scroll');
    expect(root.children[0].children).toHaveLength(1);
    expect(root.children[0].children[0].tagName).toBe('TABLE');
  });

  it('gives the scroll container no tabindex, role or label, and the table no role', () => {
    const wrapper = mountTable({ props: { caption: 'C' }, slots: { default: BODY } });

    expect(wrapper.get('.vf-table-scroll').attributes()).toEqual({ class: 'vf-table-scroll' });
    expect(wrapper.get('table').attributes()).toEqual({ class: 'vf-table' });
    expect(wrapper.attributes()).toEqual({ class: 'vf-table-wrap' });
  });

  it('serialises the historical server markup', async () => {
    expect(await ssrTable({ caption: 'Members', striped: true }, { default: () => h('tr', [h('td', 'Ada')]) })).toBe(
      '<div class="vf-table-wrap"><div class="vf-table-scroll"><table class="vf-table vf-table--striped">' +
        '<caption class="vf-table__caption"><!--[-->Members<!--]--></caption><!--v-if-->' +
        '<tbody class="vf-table__body"><!--[--><tr><td>Ada</td></tr><!--]--></tbody><!--v-if-->' +
        '</table></div></div>',
    );
  });

  it('renders the sections in the fixed order caption, thead, tbody, tfoot whatever order the slots are given in', () => {
    const wrapper = mountTable({ slots: { footer: FOOTER, default: BODY, caption: 'C', header: HEADER } });

    expect(sections(wrapper)).toEqual([
      'caption.vf-table__caption',
      'thead.vf-table__head',
      'tbody.vf-table__body',
      'tfoot.vf-table__foot',
    ]);
  });
});

// ------------------------------------------------------------------ wrapper attrs

describe('VfTable characterization: attributes land on the wrapper', () => {
  it('appends a consumer class after vf-table-wrap and keeps the table class list untouched', () => {
    const wrapper = mountTable({ props: { striped: true }, attrs: { class: 'consumer' } });

    expect(wrapper.attributes('class')).toBe('vf-table-wrap consumer');
    expect(wrapper.get('table').attributes('class')).toBe('vf-table vf-table--striped');
    expect(wrapper.get('.vf-table-scroll').attributes('class')).toBe('vf-table-scroll');
  });

  it('forwards style, id, data, aria and native attributes to the wrapper and to nothing inside it', () => {
    const wrapper = mountTable({
      attrs: {
        style: 'max-height: 12rem',
        id: 'members',
        'data-testid': 'table',
        'aria-label': 'Members',
        'aria-describedby': 'members-hint',
        title: 'Team',
        role: 'region',
        tabindex: '0',
      },
      slots: { default: BODY },
    });

    expect(wrapper.attributes()).toEqual({
      class: 'vf-table-wrap',
      style: 'max-height: 12rem;',
      id: 'members',
      'data-testid': 'table',
      'aria-label': 'Members',
      'aria-describedby': 'members-hint',
      title: 'Team',
      role: 'region',
      tabindex: '0',
    });
    expect(wrapper.get('.vf-table-scroll').attributes()).toEqual({ class: 'vf-table-scroll' });
    expect(wrapper.get('table').attributes()).toEqual({ class: 'vf-table' });
  });

  it('forwards a consumer listener to the wrapper', async () => {
    const clicks: string[] = [];
    const wrapper = mountTable({ attrs: { onClick: () => clicks.push('wrapper') } });

    await wrapper.trigger('click');
    expect(clicks).toEqual(['wrapper']);
  });

  it('does not treat the modifier props as attributes', () => {
    const wrapper = mountTable({
      props: { caption: 'C', columnDividers: true, compact: true, striped: true, stickyHeader: true },
    });

    expect(wrapper.attributes()).toEqual({ class: 'vf-table-wrap' });
  });
});

// ------------------------------------------------------------------ caption

describe('VfTable characterization: caption', () => {
  it('renders the caption prop as the first child of the table', () => {
    const wrapper = mountTable({ props: { caption: 'Members' }, slots: { default: BODY } });
    const caption = wrapper.get('table').element.firstElementChild!;

    expect(caption.outerHTML).toBe('<caption class="vf-table__caption">Members</caption>');
  });

  it('treats an empty caption as none and "0" as a caption', () => {
    expect(
      mountTable({ props: { caption: '' } })
        .find('caption')
        .exists(),
    ).toBe(false);
    expect(
      mountTable({ props: { caption: '0' } })
        .get('caption')
        .text(),
    ).toBe('0');
  });

  it('renders a caption slot alone', () => {
    expect(
      mountTable({ slots: { caption: 'Slot caption' } })
        .get('caption')
        .text(),
    ).toBe('Slot caption');
  });

  it('lets the caption slot replace the prop', () => {
    const caption = mountTable({ props: { caption: 'Prop' }, slots: { caption: '<strong>Slot</strong>' } }).get(
      'caption',
    );

    expect(caption.html({ raw: true })).toBe('<caption class="vf-table__caption"><strong>Slot</strong></caption>');
  });

  it('counts a caption slot that renders nothing: the prop is its fallback, or the caption is empty', () => {
    expect(
      mountTable({ props: { caption: 'Fallback' }, slots: { caption: () => [] } })
        .get('caption')
        .text(),
    ).toBe('Fallback');
    expect(
      mountTable({ slots: { caption: () => [] } })
        .get('caption')
        .html({ raw: true }),
    ).toBe('<caption class="vf-table__caption"></caption>');
  });

  it('escapes hostile caption text', () => {
    const caption = mountTable({ props: { caption: '<i>x</i>' } }).get('caption');

    expect(caption.text()).toBe('<i>x</i>');
    expect(caption.find('i').exists()).toBe(false);
  });
});

// ------------------------------------------------------------------ sections

describe('VfTable characterization: section presence', () => {
  it('renders no section without its slot', () => {
    const wrapper = mountTable({ props: { caption: 'C' } });

    expect(sections(wrapper)).toEqual(['caption.vf-table__caption']);
  });

  it.each([
    ['header', 'thead.vf-table__head', HEADER],
    ['default', 'tbody.vf-table__body', BODY],
    ['footer', 'tfoot.vf-table__foot', FOOTER],
  ])('renders the %s slot alone in its classed section', (slot, section, markup) => {
    const wrapper = mountTable({ slots: { [slot]: markup } });

    expect(sections(wrapper)).toEqual([section]);
    expect(wrapper.get(section).element.innerHTML).toBe(markup);
  });

  it.each([
    ['header', 'thead.vf-table__head'],
    ['default', 'tbody.vf-table__body'],
    ['footer', 'tfoot.vf-table__foot'],
  ])('keys the %s section on presence: a slot that renders nothing still renders an empty section', (slot, section) => {
    const wrapper = mountTable({ slots: { [slot]: () => [] } });

    expect(sections(wrapper)).toEqual([section]);
    expect(wrapper.get(section).element.innerHTML).toBe('');
  });

  it('renders head and foot without a body', () => {
    expect(sections(mountTable({ slots: { header: HEADER, footer: FOOTER } }))).toEqual([
      'thead.vf-table__head',
      'tfoot.vf-table__foot',
    ]);
  });

  it('renders head and body without a foot', () => {
    expect(sections(mountTable({ slots: { header: HEADER, default: BODY } }))).toEqual([
      'thead.vf-table__head',
      'tbody.vf-table__body',
    ]);
  });

  it('renders body and foot without a head', () => {
    expect(sections(mountTable({ slots: { default: BODY, footer: FOOTER } }))).toEqual([
      'tbody.vf-table__body',
      'tfoot.vf-table__foot',
    ]);
  });

  it('passes slot rows through unwrapped and unclassed', () => {
    const wrapper = mountTable({ slots: { header: HEADER, default: BODY } });

    expect(wrapper.findAll('tbody > tr')).toHaveLength(2);
    expect(wrapper.findAll('thead > tr > th')).toHaveLength(2);
    expect(wrapper.get('tbody > tr').attributes()).toEqual({});
  });
  it('follows the slots a parent passes on every render, not only at mount', async () => {
    // The section tests read $slots in the template, so they are evaluated on
    // every render. A parent that swaps its slots re-renders the table with
    // the new set of sections even though no prop changed.
    const on = ref(false);
    const Host = defineComponent({
      render: () =>
        h(
          VfTable,
          null,
          on.value
            ? { caption: () => 'Late', header: () => h('tr', [h('th', 'H')]) }
            : { default: () => h('tr', [h('td', 'B')]) },
        ),
    });
    const wrapper = mount(Host);
    const sectionsOf = () =>
      Array.from(wrapper.get('table').element.children).map((child) => child.tagName.toLowerCase());

    expect(sectionsOf()).toEqual(['tbody']);
    on.value = true;
    await nextTick();
    expect(sectionsOf()).toEqual(['caption', 'thead']);
    on.value = false;
    await nextTick();
    expect(sectionsOf()).toEqual(['tbody']);
  });
});

// ------------------------------------------------------------------ modifiers

describe('VfTable characterization: modifiers', () => {
  it('renders the bare table class by default', () => {
    expect(mountTable().get('table').attributes('class')).toBe('vf-table');
  });

  it.each([
    ['columnDividers', 'vf-table--column-dividers'],
    ['compact', 'vf-table--compact'],
    ['striped', 'vf-table--striped'],
    ['stickyHeader', 'vf-table--sticky-header'],
  ])('adds exactly one class for %s, on the table and not the wrapper', (prop, modifier) => {
    const wrapper = mountTable({ props: { [prop]: true } });

    expect(wrapper.get('table').classes()).toEqual(['vf-table', modifier]);
    expect(wrapper.classes()).toEqual(['vf-table-wrap']);
  });

  it('emits all four in the fixed historical order whatever order the props are written in', () => {
    const wrapper = mountTable({ props: { stickyHeader: true, striped: true, compact: true, columnDividers: true } });

    expect(wrapper.get('table').attributes('class')).toBe(
      'vf-table vf-table--column-dividers vf-table--compact vf-table--striped vf-table--sticky-header',
    );
  });

  it('combines non-adjacent modifiers without the ones in between', () => {
    expect(
      mountTable({ props: { columnDividers: true, striped: true } })
        .get('table')
        .attributes('class'),
    ).toBe('vf-table vf-table--column-dividers vf-table--striped');
    expect(
      mountTable({ props: { compact: true, stickyHeader: true } })
        .get('table')
        .attributes('class'),
    ).toBe('vf-table vf-table--compact vf-table--sticky-header');
  });

  it('follows the modifier props reactively', async () => {
    const wrapper = mountTable({ props: { stickyHeader: false } });

    await wrapper.setProps({ stickyHeader: true });
    expect(wrapper.get('table').classes()).toContain('vf-table--sticky-header');
    await wrapper.setProps({ stickyHeader: false, compact: true });
    expect(wrapper.get('table').classes()).toEqual(['vf-table', 'vf-table--compact']);
  });
});

// ------------------------------------------------------------------ sticky header

describe('VfTable characterization: the sticky header is CSS only', () => {
  it('writes no inline style anywhere for a sticky header', () => {
    const wrapper = mountTable({ props: { stickyHeader: true }, slots: { header: HEADER, default: BODY } });

    expect(wrapper.findAll('[style]')).toHaveLength(0);
  });

  it('is the stylesheet rule that sticks every header cell to the top of the scroll container', () => {
    const rule = cssRule('.vf-table--sticky-header thead th');

    expect(rule).toContain('position: sticky;');
    expect(rule).toContain('top: 0;');
    expect(rule).toContain('z-index: 1;');
  });

  it('keeps the overflow on the scroll container and clips on the wrapper', () => {
    expect(cssRule('.vf-table-scroll')).toContain('overflow-x: auto;');
    expect(cssRule('.vf-table-wrap')).toContain('overflow: hidden;');
  });
});

// ------------------------------------------------------------------ instances

describe('VfTable characterization: instances', () => {
  it('keeps two instances independent: attributes, modifiers and sections do not leak', () => {
    const Pair = defineComponent({
      render: () =>
        h('div', [
          h(
            VfTable,
            { caption: 'First', striped: true, class: 'first', 'data-testid': 'one' },
            { default: () => h('tr', [h('td', '1')]) },
          ),
          h(VfTable, { compact: true, id: 'second' }, { header: () => h('tr', [h('th', 'H')]) }),
        ]),
    });
    const [first, second] = mount(Pair).findAll('.vf-table-wrap');

    expect(first.attributes()).toEqual({ class: 'vf-table-wrap first', 'data-testid': 'one' });
    expect(second.attributes()).toEqual({ class: 'vf-table-wrap', id: 'second' });
    expect(first.get('table').classes()).toEqual(['vf-table', 'vf-table--striped']);
    expect(second.get('table').classes()).toEqual(['vf-table', 'vf-table--compact']);
    expect(first.find('thead').exists()).toBe(false);
    expect(second.find('tbody').exists()).toBe(false);
    expect(second.find('caption').exists()).toBe(false);
  });

  it('writes no generated id, so nothing can be cross-wired between instances', () => {
    const wrapper = mountTable({ props: { caption: 'C' }, slots: { header: HEADER, default: BODY, footer: FOOTER } });

    expect(wrapper.findAll('[id]')).toHaveLength(0);
  });
});
