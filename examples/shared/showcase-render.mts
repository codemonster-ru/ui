import * as components from '@codemonster-ru/ui-vue';
import * as layouts from '@codemonster-ru/ui-layouts';
import {
  arrowLeft,
  arrowRight,
  bell,
  checkCircle,
  chevronDown,
  circleHalf,
  ellipsis,
  fileText,
  filter,
  info,
  lock,
  magnifyingGlass,
  moon,
  pencil,
  questionCircle,
  star,
  user,
  warning,
  xCircle,
} from '@codemonster-ru/ui-icons';
import {
  createStaticVNode,
  defineComponent,
  h,
  onBeforeUnmount,
  reactive,
  ref,
  type Component,
  type PropType,
  type Ref,
  type VNodeChild,
} from 'vue';
import { drawerExampleGroups, type DemoContent, type DemoNode, type ShowcaseExample } from './showcase-cases.mts';
import {
  handleShowcaseDemoClick,
  modalExamples,
  scopeShowcaseAttribute,
  showcaseDemoClass,
  showcaseExamplePrefix,
  skeletonLoadDelay,
} from './showcase-inline.mjs';

const registry = { ...components, ...layouts } as Record<string, unknown>;
const invalidFieldMessages: Record<string, string> = {
  'checkbox-default--invalid': 'Select an update preference.',
  'checkbox-default--invalid-indeterminate': 'Review your update preferences.',
  'radio-default--invalid': 'Choose an update frequency.',
  'switch-default--invalid': 'Turn on dark mode to continue.',
  'input-invalid': 'Enter a project name.',
  'textarea-invalid': 'Add a third line to the summary.',
  'select-selected': 'Choose a status other than Draft.',
  'date-picker-default--invalid': 'Choose a date.',
};

const iconRegistry: Record<string, unknown> = {
  arrowLeft,
  arrowRight,
  bell,
  checkCircle,
  chevronDown,
  circleHalf,
  ellipsis,
  fileText,
  filter,
  info,
  lock,
  magnifyingGlass,
  moon,
  pencil,
  questionCircle,
  star,
  user,
  warning,
  xCircle,
};

export interface ShowcaseRenderOptions {
  avatar: string;
  staticContent: (html: string, prefix: string) => VNodeChild;
  staticPreview?: boolean;
}

export function showcaseComponentTitle(slug: string) {
  return slug
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function renderableProps(slug: string, source: Record<string, unknown>, prefix: string, avatar: string) {
  const props = { ...source };
  if (['input', 'select', 'date-picker', 'tabs', 'textarea'].includes(slug) && Object.hasOwn(props, 'value')) {
    props.modelValue = props.value;
    delete props.value;
  }
  if (['checkbox', 'switch'].includes(slug) && Object.hasOwn(props, 'checked')) {
    props.modelValue = props.checked;
    delete props.checked;
  }
  if (slug === 'radio') {
    if (props.checked) props.modelValue = props.value;
    delete props.checked;
  }
  if (slug === 'icon' && typeof props.icon === 'string') {
    const geometry = iconRegistry[props.icon];
    if (!geometry) throw new Error(`Unknown showcase icon ${props.icon}`);
    props.icon = geometry;
  }
  if (slug === 'avatar' && props.image === '/avatar.png') props.image = avatar;
  if (slug === 'theme-switch') {
    props.name ??= 'cm-theme';
    delete props.modelValue;
  }
  // Keep native dialogs closed until their launcher is used. Inline overlays open beside a visible trigger.
  if (modalExamples.has(slug) || ['dropdown', 'popover', 'tooltip'].includes(slug)) {
    if (typeof props.open === 'boolean' || modalExamples.has(slug)) props.open = false;
    if (props.defaultOpen) props.defaultOpen = false;
    if (props.defaultVisible) props.defaultVisible = false;
  }
  return Object.fromEntries(
    Object.entries(props).map(([key, value]) => {
      const attribute = key.replace(/[A-Z]/gu, (letter) => `-${letter.toLowerCase()}`);
      return [key, typeof value === 'string' ? scopeShowcaseAttribute(attribute, value, prefix) : value];
    }),
  );
}

function prepareComponent(
  node: DemoNode,
  prefix: string,
  options: ShowcaseRenderOptions,
  radioValue?: Ref<string | undefined>,
) {
  const component = registry[`Cm${showcaseComponentTitle(node.component).replaceAll(' ', '')}`] as
    Component | undefined;
  if (!component) throw new Error(`Missing showcase component ${node.component}`);
  const props = reactive(renderableProps(node.component, node.props ?? {}, prefix, options.avatar));
  // The server can't measure overflow. Emit the scroll buttons so the Vanilla controller can reveal them.
  if (node.component === 'tabs' && options.staticPreview) props.scrollControls ??= true;
  if (options.staticPreview && node.component === 'data-table' && props.paginationMode === 'client') {
    // Emit all rows for Vanilla, which pages the rendered nodes in the browser.
    props.paginationMode = 'manual';
    props.totalRows = (props.rows as unknown[]).length;
  }
  const slots = Object.fromEntries(
    Object.entries(node.slots ?? {}).map(([name, content]) => [
      name,
      prepareContent(content, prefix, options, radioValue),
    ]),
  );
  for (const key of [
    ...(node.component === 'theme-switch' ? [] : ['modelValue']),
    ...(node.component === 'nav-menu' ? ['value'] : []),
    'open',
    'openItems',
    'query',
    'sort',
    'page',
    'pageSize',
    'selectedRowIds',
    'openPath',
    'columnWidths',
    'visibleColumnKeys',
    'sidebarCollapsed',
    'mobileSidebarOpen',
    'collapsed',
    'expandedValues',
  ]) {
    props[`onUpdate:${key}`] = (value: unknown) => {
      props[key] = value;
    };
  }
  const radio = node.component === 'radio' ? radioValue : undefined;
  if (radio) props['onUpdate:modelValue'] = (value: string) => (radio.value = value);
  return {
    props,
    render: (scope?: Record<string, unknown>) => {
      const attributes = node.scopeAttributes ? scope?.[node.scopeAttributes] : undefined;
      return h(
        component,
        { ...props, ...(radio && { modelValue: radio.value }), ...(attributes as Record<string, unknown> | undefined) },
        slots,
      );
    },
  };
}

function prepareContent(
  content: DemoContent,
  prefix: string,
  options: ShowcaseRenderOptions,
  radioValue?: Ref<string | undefined>,
): () => VNodeChild {
  if (typeof content === 'string') return () => options.staticContent(content, prefix);
  if (Array.isArray(content)) {
    const children = content.map((node) => prepareContent(node, prefix, options, radioValue));
    return () => children.map((render) => render());
  }
  return prepareComponent(content, prefix, options, radioValue).render;
}

function usesPortal(content: DemoContent): boolean {
  if (typeof content === 'string') return content.includes('teleport-to=');
  if (Array.isArray(content)) return content.some(usesPortal);
  return Boolean(content.props?.teleportTo) || Object.values(content.slots ?? {}).some(usesPortal);
}

function renderVariant(
  title: string,
  content: () => VNodeChild,
  attrs: Record<string, unknown> = {},
  heading: 'h3' | 'h4' = 'h4',
) {
  return h(components.CmStack, { ...attrs, class: ['showcase-variant', attrs.class] }, () => [
    title ? h(heading, { class: 'showcase-variant-title' }, title) : null,
    content(),
  ]);
}

const Example = defineComponent({
  name: 'ShowcaseExample',
  props: {
    example: { type: Object as PropType<ShowcaseExample>, required: true },
    options: { type: Object as PropType<ShowcaseRenderOptions>, required: true },
    heading: { type: String as PropType<'h3' | 'h4'>, default: 'h4' },
  },
  setup({ example, options, heading }) {
    const prefix = showcaseExamplePrefix(example.id);
    const fieldError = invalidFieldMessages[example.id];
    const controlId = example.props.id ?? 'control';
    const node = {
      component: example.slug,
      props: {
        ...example.props,
        ...example.attributes,
        ...(fieldError ? { id: controlId, 'aria-describedby': `${controlId}-error` } : {}),
      },
      slots: example.slots,
    };
    const contactMethod = example.id === 'fieldset-help-error' ? ref<string>() : undefined;
    const { props, render } = prepareComponent(node, prefix, options, contactMethod);
    const mixedCheckbox = example.id === 'checkbox-default--invalid-indeterminate';
    if (mixedCheckbox) {
      props['onUpdate:modelValue'] = (checked: boolean) => {
        props.modelValue = checked;
        props.indeterminate = false;
      };
    }
    const resetMixedCheckbox = ({ currentTarget }: MouseEvent) => {
      props.modelValue = false;
      props.indeterminate = true;
      if (currentTarget instanceof HTMLElement) currentTarget.ownerDocument.getElementById(String(props.id))?.focus();
    };
    const skeletonGate = example.slug === 'skeleton-gate';
    if (skeletonGate) props.id = `${prefix}-gate`;
    let skeletonTimer: ReturnType<typeof setTimeout> | undefined;
    if (skeletonGate) onBeforeUnmount(() => clearTimeout(skeletonTimer));
    const loadSkeleton = () => {
      if (!props.ready) return;
      props.ready = false;
      skeletonTimer = setTimeout(() => (props.ready = true), skeletonLoadDelay);
    };
    const chooserWithTable = example.id === 'column-chooser-default';
    const setFieldsetInvalid = (invalid: boolean) => {
      props.invalid = invalid;
      props.error = invalid ? example.props.error : null;
    };
    const renderContent = contactMethod
      ? () =>
          h(
            components.CmStack,
            {
              as: 'form',
              onReset: ({ currentTarget }: Event) => {
                contactMethod.value = undefined;
                setFieldsetInvalid(true);
                if (currentTarget instanceof HTMLFormElement)
                  currentTarget.querySelector<HTMLInputElement>('input[type="radio"][value="email"]')?.focus();
              },
            },
            () => [
              render(),
              h(components.CmInline, () =>
                h(components.CmButton, { type: 'reset', variant: 'secondary', size: 'sm' }, () => 'Reset'),
              ),
            ],
          )
      : chooserWithTable
        ? () =>
            h(components.CmStack, () => [
              h(components.CmInline, () => render()),
              h(components.CmDataTable, {
                id: `${prefix}-projects`,
                caption: 'Projects',
                columns: props.columns as components.CmDataTableColumn[],
                visibleColumnKeys: props.visibleColumnKeys as string[] | undefined,
                rows: [
                  { id: 'atlas', cells: { name: 'Atlas', owner: 'Ada', size: '4 MB' } },
                  { id: 'beacon', cells: { name: 'Beacon', owner: 'Grace', size: '2 MB' } },
                ],
              }),
            ])
        : skeletonGate
          ? () =>
              h(components.CmStack, () => [
                h(components.CmInline, () =>
                  h(
                    components.CmButton,
                    {
                      variant: 'secondary',
                      'aria-controls': props.id,
                      ...(options.staticPreview ? { 'data-showcase-skeleton-load': '' } : { onClick: loadSkeleton }),
                    },
                    () => 'Load invoice',
                  ),
                ),
                h(components.CmCard, { element: 'article', compact: true, style: { maxInlineSize: '22rem' } }, () =>
                  render(),
                ),
              ])
          : render;
    const renderExample = () =>
      fieldError
        ? h(components.CmField, { controlId: String(props.id), error: fieldError }, renderContent)
        : renderContent();
    const modal = modalExamples.has(example.slug);
    const title = showcaseComponentTitle(example.slug);
    const id = `preview-${example.id}`;
    const demo = () =>
      h(
        'div',
        {
          id: example.buttonStyle || modal ? id : undefined,
          class: showcaseDemoClass(example.slug),
          'data-showcase-example': example.id,
          onClick: (event: MouseEvent) => handleShowcaseDemoClick(event.currentTarget as HTMLElement, event),
          onChange:
            example.id === 'fieldset-invalid' || contactMethod
              ? ({ target }: Event) => {
                  if (!(target instanceof HTMLInputElement)) return;
                  setFieldsetInvalid(!target.checked);
                }
              : undefined,
        },
        [
          usesPortal(node) ? h('div', { id: `${prefix}-portal` }) : null,
          modal
            ? h(
                components.CmButton,
                {
                  'data-showcase-open': '',
                  variant: 'secondary',
                  'aria-label': `${example.label} (${title})`,
                  onClick: () => {
                    props.open = true;
                  },
                },
                () => example.label,
              )
            : null,
          mixedCheckbox
            ? h(components.CmStack, () => [
                renderExample(),
                h(components.CmInline, () =>
                  h(
                    components.CmButton,
                    {
                      type: 'button',
                      variant: 'secondary',
                      size: 'sm',
                      ...(options.staticPreview
                        ? { 'data-showcase-checkbox-reset': '' }
                        : { onClick: resetMixedCheckbox }),
                    },
                    () => 'Reset',
                  ),
                ),
              ])
            : renderExample(),
        ],
      );
    return () => (example.buttonStyle || modal ? demo() : renderVariant(example.label, demo, { id }, heading));
  },
});

function renderButtonStyles(examples: ShowcaseExample[], options: ShowcaseRenderOptions) {
  const groups = new Map<string, { title: string; samples: { label: string; example: ShowcaseExample }[] }>();
  for (const example of examples) {
    const style = example.buttonStyle;
    if (!style) continue;
    const [title, label] =
      style.axis === 'size'
        ? [`Sizes · ${style.variant}`, style.size]
        : style.axis === 'variant'
          ? [`Colors · ${style.size}`, style.variant]
          : [`States · ${style.size}`, style.state];
    const group = groups.get(style.axis) ?? { title, samples: [] };
    group.samples.push({ label, example });
    groups.set(style.axis, group);
  }

  return [...groups].map(([axis, { title, samples }]) =>
    renderVariant(
      title,
      () =>
        h(components.CmInline, { class: 'showcase-button-samples' }, () =>
          samples.map(({ label, example }) =>
            h(
              components.CmStack,
              { key: example.id, class: 'showcase-button-sample', role: 'group', 'aria-label': label },
              () => [h('span', { class: 'showcase-api-label' }, label), h(Example, { example, options })],
            ),
          ),
        ),
      { key: axis, class: 'showcase-button-variant', 'data-button-axis': axis },
    ),
  );
}

function renderModalExamples(slug: string, examples: ShowcaseExample[], options: ShowcaseRenderOptions) {
  const row = (buttons: VNodeChild[]) => h(components.CmInline, { class: 'showcase-modal-launchers' }, () => buttons);
  const launcher = (example: ShowcaseExample) => h(Example, { example, options, key: example.id });
  if (slug !== 'drawer') return row(examples.map(launcher));

  const groupedIds = new Set(drawerExampleGroups.flatMap(({ ids }) => ids));
  return [
    ...drawerExampleGroups.map(({ label, ids }) => {
      const buttons = examples.filter(({ id }) => ids.includes(id)).map(launcher);
      if (label === 'Sizes') {
        // End also demonstrates the default width. Both launchers open that same drawer.
        const target = 'preview-drawer-default';
        buttons.splice(
          1,
          0,
          h(
            components.CmButton,
            {
              key: 'md',
              variant: 'secondary',
              'aria-label': 'md (Drawer)',
              'data-showcase-open': target,
              onClick: ({ currentTarget }: MouseEvent) => {
                (currentTarget as HTMLElement).ownerDocument
                  .getElementById(target)
                  ?.querySelector<HTMLElement>('[data-showcase-open]')
                  ?.click();
              },
            },
            () => 'md',
          ),
        );
      }
      return h(components.CmStack, { key: label, role: 'group', 'aria-label': label }, () => [
        h('h4', { class: 'showcase-variant-title' }, label),
        row(buttons),
      ]);
    }),
    row(examples.filter(({ id }) => !groupedIds.has(id)).map(launcher)),
  ];
}

export function renderShowcasePanel(
  slug: string,
  heading: 'h2' | 'h3',
  examples: ShowcaseExample[],
  options: ShowcaseRenderOptions,
  before?: () => VNodeChild,
) {
  const label = `component-${slug}`;
  const variantHeading = heading === 'h2' ? 'h3' : 'h4';
  const extraExamples = examples.filter((example) => !example.buttonStyle);
  return h(
    components.CmStack,
    {
      as: 'section',
      class: 'showcase-contracts',
      id: `demo-${slug}`,
      'aria-labelledby': label,
      'data-showcase-component': slug,
      'data-layout-preview': before ? slug : undefined,
      tabindex: -1,
    },
    () => [
      h('header', [h(heading, { id: label, class: 'showcase-component-title' }, showcaseComponentTitle(slug))]),
      h(components.CmDivider, { 'aria-hidden': 'true' }),
      before?.(),
      modalExamples.has(slug)
        ? renderModalExamples(slug, examples, options)
        : examples.length
          ? h(components.CmGrid, { class: 'showcase-variants' }, () => [
              ...renderButtonStyles(examples, options),
              ...extraExamples.map((example) =>
                h(Example, { example, options, heading: variantHeading, key: example.id }),
              ),
            ])
          : null,
    ],
  );
}

export function staticShowcaseContent(html: string, prefix: string) {
  const template = document.createElement('template');
  template.innerHTML = html;
  for (const element of template.content.querySelectorAll('*')) {
    for (const { namespaceURI, name, value } of [...element.attributes]) {
      if (name === 'autofocus') {
        element.removeAttribute(name);
        element.setAttribute('data-autofocus', '');
      } else {
        const scoped = scopeShowcaseAttribute(name, value, prefix);
        if (scoped !== value) element.setAttributeNS(namespaceURI, name, scoped);
      }
    }
  }
  return createStaticVNode(template.innerHTML, template.content.childNodes.length);
}
