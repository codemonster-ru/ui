import { mount } from '@vue/test-utils';
import { defineComponent, effectScope, h, nextTick, ref } from 'vue';
import { expect, it } from 'vitest';
import { useDisclosure } from './disclosure';
import { useId } from './id';

it('reports controlled changes and keeps the last accepted state when control is released', async () => {
  const scope = effectScope();
  const external = ref<boolean>();
  const requests: boolean[] = [];
  const disclosure = scope.run(() => useDisclosure({ open: external, onOpenChange: (open) => requests.push(open) }))!;

  try {
    disclosure.open();
    expect(disclosure.isOpen.value).toBe(true);
    external.value = false;
    await nextTick();
    disclosure.toggle();
    expect(disclosure.isOpen.value).toBe(false);
    external.value = true;
    await nextTick();
    external.value = undefined;
    await nextTick();
    expect(disclosure.isOpen.value).toBe(true);
    disclosure.close();
    expect(disclosure.isOpen.value).toBe(false);
    expect(requests).toEqual([true, true, false]);
  } finally {
    scope.stop();
  }
});

it('uses the reactive supplied ID or returns the original generated ID when removed', async () => {
  const Host = defineComponent({
    props: { authoredId: { type: String, default: undefined } },
    setup(props) {
      const id = useId({ prefix: 'panel', providedId: () => props.authoredId });
      const second = useId();
      return () => h('div', { id: id.value }, h('span', { id: second.value }));
    },
  });
  const host = mount(Host);

  try {
    const generated = host.attributes('id');
    const second = host.get('span').attributes('id');
    expect(generated).toMatch(/^panel-/u);
    expect(second).toMatch(/^vf-/u);
    await host.setProps({ authoredId: 'authored' });
    expect(host.attributes('id')).toBe('authored');
    await host.setProps({ authoredId: undefined });
    expect(host.attributes('id')).toBe(generated);
    expect(host.get('span').attributes('id')).toBe(second);
  } finally {
    host.unmount();
  }
});
