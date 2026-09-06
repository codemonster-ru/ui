// Browser-side extraction for the three-way parity harness.
//
// One function runs against every target, so the three descriptions are
// produced identically and a difference can only come from the rendered page.
//
// What is dropped is deliberate and small. What is kept is everything the
// product contract depends on: structure, canonical classes, consumer classes,
// native attributes, text, aria, product data attributes and the resolved
// relationship graph.

/** Attributes compared verbatim on every element. */
const COMPARED_ATTRIBUTES = [
  'type',
  'name',
  'value',
  'placeholder',
  'required',
  'disabled',
  'readonly',
  'min',
  'max',
  'step',
  'autocomplete',
  'maxlength',
  'inputmode',
  'role',
  'aria-invalid',
  'aria-label',
  'aria-pressed',
  'aria-hidden',
  'aria-required',
  'style',
  'hidden',
  'viewBox',
  'width',
  'height',
  'stroke-width',
  'fill',
  'stroke',
  'd',
  'x1',
  'y1',
  'x2',
  'y2',
  'cx',
  'cy',
  'r',
];

/** Attributes that identify the renderer rather than the product. */
const FRAMEWORK_ATTRIBUTE_PATTERN = /^(data-v-|data-vf-razor)/;

/** Relationship attributes whose values are id references. */
const REFERENCE_ATTRIBUTES = ['for', 'aria-describedby', 'aria-labelledby', 'aria-controls'];

export const extractCasesExpression = `(() => {
  const COMPARED_ATTRIBUTES = ${JSON.stringify(COMPARED_ATTRIBUTES)};
  const FRAMEWORK_ATTRIBUTE_PATTERN = ${FRAMEWORK_ATTRIBUTE_PATTERN.toString()};
  const REFERENCE_ATTRIBUTES = ${JSON.stringify(REFERENCE_ATTRIBUTES)};

  // Generated ids differ between adapters by design. They are replaced with a
  // document-order token, and every reference to them is rewritten through the
  // same map, so the relationship graph is compared while the concrete value is
  // not. A reference pointing at the wrong element still differs.
  function buildIdMap(root) {
    const map = new Map();
    let index = 0;
    for (const element of root.querySelectorAll('[id]')) {
      map.set(element.id, '#id' + index++);
    }
    return map;
  }

  function canonicaliseReference(value, idMap) {
    return value
      .split(/\\s+/)
      .filter(Boolean)
      .map((token) => idMap.get(token) ?? ('#unresolved:' + token))
      .join(' ');
  }

  function normaliseStyle(value) {
    return value
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .map((declaration) => {
        const separator = declaration.indexOf(':');
        return separator === -1
          ? declaration
          : declaration.slice(0, separator).trim() + ':' + declaration.slice(separator + 1).trim();
      })
      .sort()
      .join(';');
  }

  function directText(element) {
    return [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent)
      .join('')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  function describe(element, idMap) {
    const classes = [...element.classList];
    const attributes = {};

    if (element.hasAttribute('id')) {
      attributes.id = idMap.get(element.id) ?? '#unmapped';
    }

    for (const name of COMPARED_ATTRIBUTES) {
      if (!element.hasAttribute(name)) continue;
      // A style attribute is compared as a set of declarations. The two
      // renderers serialise the same declarations with different whitespace;
      // the declarations themselves are product semantics and are compared.
      attributes[name] =
        name === 'style' ? normaliseStyle(element.getAttribute(name)) : element.getAttribute(name);
    }

    for (const name of REFERENCE_ATTRIBUTES) {
      if (!element.hasAttribute(name)) continue;
      attributes[name] = canonicaliseReference(element.getAttribute(name), idMap);
    }

    // Product data attributes are semantics; renderer markers are not.
    for (const attribute of element.attributes) {
      if (!attribute.name.startsWith('data-') || FRAMEWORK_ATTRIBUTE_PATTERN.test(attribute.name)) continue;
      if (attribute.name.startsWith('data-parity')) continue;
      attributes[attribute.name] = attribute.value;
    }

    const node = {
      tag: element.tagName.toLowerCase(),
      classes: classes.filter((name) => name.startsWith('vf-')).sort(),
      consumerClasses: classes.filter((name) => !name.startsWith('vf-') && !name.startsWith('parity-')).sort(),
      attributes: Object.fromEntries(Object.entries(attributes).sort(([a], [b]) => (a < b ? -1 : 1))),
      children: [...element.children].map((child) => describe(child, idMap)),
    };

    const text = directText(element);
    if (text !== '') node.text = text;

    // The live value of a control is state, not markup, and is what a user sees.
    if (element instanceof HTMLInputElement) {
      node.liveValue = element.value;
      node.operable = !element.disabled;
    }
    if (element instanceof HTMLButtonElement) {
      node.operable = !element.disabled && !element.hidden && getComputedStyle(element).display !== 'none';
    }

    return node;
  }

  const STYLE_PROPERTIES = [
    'width', 'height', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border-top-width', 'border-radius', 'border-top-style',
    'font-size', 'line-height',
    'color', 'background-color', 'border-top-color',
    'display', 'align-items', 'justify-content', 'position',
  ];

  function measure(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const measured = { boxWidth: Math.round(rect.width), boxHeight: Math.round(rect.height) };
    for (const property of STYLE_PROPERTIES) measured[property] = style.getPropertyValue(property);
    return measured;
  }

  // The roles a case can contain, measured by role rather than by selector
  // position so the two adapters are compared like for like.
  const MEASURED_ROLES = {
    control: 'input.vf-input',
    wrapper: '.vf-input-wrap',
    leading: '.vf-input-wrap__icon--leading',
    leadingGlyph: '.vf-input-wrap__icon--leading svg',
    trailing: '.vf-input-wrap__icon--trailing',
    trailingGlyph: '.vf-input-wrap__icon--trailing svg',
    clear: '.vf-input-wrap__clear',
    clearGlyph: '.vf-input-wrap__clear svg',
    reveal: '.vf-input-wrap__password-toggle',
    revealGlyph: '.vf-input-wrap__password-toggle svg',
    fieldLabel: '.vf-field__label',
  };

  // An element the user cannot see has no geometry worth comparing. This is how
  // an inert Razor action, which Vue does not render at all, stops being a
  // geometry difference while remaining a structural one.
  function isVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  const results = {};

  for (const root of document.querySelectorAll('[data-parity-case]')) {
    const caseId = root.getAttribute('data-parity-case');
    const idMap = buildIdMap(root);
    const styles = {};

    for (const [role, selector] of Object.entries(MEASURED_ROLES)) {
      const element = root.querySelector(selector);
      if (element && isVisible(element)) styles[role] = measure(element);
    }

    const rect = root.getBoundingClientRect();

    results[caseId] = {
      dom: [...root.children].map((child) => describe(child, idMap)),
      styles,
      clip: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  }

  return results;
})()`;

/** Drives one interaction scenario inside a case and reports the observable result. */
export function interactionExpression(caseId, steps) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const control = root.querySelector('input.vf-input');
    const clear = root.querySelector('.vf-input-wrap__clear');
    const reveal = root.querySelector('.vf-input-wrap__password-toggle');
    const tick = () => new Promise((done) => setTimeout(done, 40));

    for (const step of ${JSON.stringify(steps)}) {
      if (step.action === 'type') {
        control.focus();
        control.value = step.value;
        control.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (step.action === 'clickClear') {
        root.querySelector('.vf-input-wrap__clear')?.click();
      } else if (step.action === 'clickReveal') {
        root.querySelector('.vf-input-wrap__password-toggle')?.click();
      } else if (step.action === 'setSelection') {
        control.focus();
        control.setSelectionRange(step.start, step.end, step.direction);
      }
      await tick();
      await tick();
    }

    const liveControl = root.querySelector('input.vf-input');
    const activeElement = document.activeElement;
    const focusRole = activeElement === liveControl
      ? 'control'
      : activeElement === root.querySelector('.vf-input-wrap__clear')
        ? 'clear'
        : activeElement === root.querySelector('.vf-input-wrap__password-toggle')
          ? 'reveal'
          : activeElement === document.body
            ? 'body'
            : root.contains(activeElement) ? 'other-inside-case' : 'outside-case';

    // An action the user cannot reach is not an action. Reporting it as absent
    // is what makes "no clear available" comparable between an adapter that
    // omits the element and one that keeps it inert.
    const describeAction = (element) => {
      if (element === null) return null;
      const operable =
        !element.disabled && !element.hidden && getComputedStyle(element).display !== 'none';
      if (!operable) return null;

      return {
        operable: true,
        label: element.getAttribute('aria-label'),
        pressed: element.getAttribute('aria-pressed'),
      };
    };

    return {
      value: liveControl.value,
      type: liveControl.getAttribute('type'),
      filled: liveControl.getAttribute('data-vf-filled'),
      selection: liveControl.selectionStart === null
        ? null
        : {
            start: liveControl.selectionStart,
            end: liveControl.selectionEnd,
            direction: liveControl.selectionDirection,
          },
      focusRole,
      clear: describeAction(root.querySelector('.vf-input-wrap__clear')),
      reveal: describeAction(root.querySelector('.vf-input-wrap__password-toggle')),
      wrapperClasses: root.querySelector('.vf-input-wrap')
        ? [...root.querySelector('.vf-input-wrap').classList].filter((name) => name.startsWith('vf-')).sort()
        : null,
      controlClasses: [...liveControl.classList].filter((name) => name.startsWith('vf-')).sort(),
    };
  })()`;
}
