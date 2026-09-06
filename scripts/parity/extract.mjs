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

/**
 * Drives the small Input scenario vocabulary with native browser input events.
 * Selection setup remains explicit because caret direction is scenario data.
 * Resolve the control for every step: Vue may replace it during a wrapper
 * transition, so retaining the first element would exercise a detached node.
 */
export async function driveInteraction(page, caseId, steps) {
  const selector = `[data-parity-case="${caseId}"]`;
  await page.evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    if (!root) throw new Error('missing interaction case');
    window.__parityInputEvents = [];
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'input', 'keydown']) {
      document.addEventListener(type, (event) => {
        if (!root.contains(event.target)) return;
        const entry = { type, trusted: event.isTrusted, defaultPrevented: false };
        window.__parityInputEvents.push(entry);
        setTimeout(() => { entry.defaultPrevented = event.defaultPrevented; }, 0);
      }, true);
    }
  })()`);
  const settle = () => page.evaluate(`new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))`);
  for (const step of steps) {
    if (step.action === 'type') {
      await page.evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)}).querySelector('input.vf-input');
        control.focus();
        control.value = ${JSON.stringify(step.value)};
        control.dispatchEvent(new Event('input', { bubbles: true }));
      })()`);
    } else if (step.action === 'clickClear' || step.action === 'clickReveal') {
      const actionSelector = step.action === 'clickClear' ? '.vf-input-wrap__clear' : '.vf-input-wrap__password-toggle';
      if (step.action === 'clickReveal') {
        await page.evaluate(
          `document.querySelector(${JSON.stringify(selector)}).querySelector(${JSON.stringify(actionSelector)})?.click()`,
        );
        await settle();
        continue;
      }
      const point = await page.evaluate(`(() => {
        const action = document.querySelector(${JSON.stringify(selector)}).querySelector(${JSON.stringify(actionSelector)});
        if (!action) throw new Error('missing interaction action');
        action.scrollIntoView({ block: 'center' });
        const rect = action.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0 || action.disabled || action.hidden) {
          throw new Error('interaction action is not operable');
        }
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
      await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
      await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
      // Native hover would otherwise change only the clicked action's state.
      await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 900, y: 1 });
    } else if (step.action === 'setSelection' || step.action === 'focus') {
      await page.evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)}).querySelector('input.vf-input');
        control.focus();
        ${step.action === 'setSelection' ? `control.setSelectionRange(${step.start}, ${step.end}, ${JSON.stringify(step.direction)});` : ''}
      })()`);
    } else {
      throw new Error(`unknown interaction step: ${step.action}`);
    }
    await settle();
  }
  return page.evaluate('window.__parityInputEvents');
}

/** Reports the actual post-scenario state before any visual focus normalization. */
export function interactionExpression(caseId) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
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

    // The clip of the case root as it stands after the scenario. A screenshot
    // taken here is what catches a change that leaves the DOM intact - content
    // that is present but invisible, a focus ring that should or should not be
    // there - which the DOM and geometry dimensions cannot see on their own.
    const caseRect = root.getBoundingClientRect();

    return {
      clip: {
        x: Math.round(caseRect.left + window.scrollX),
        y: Math.round(caseRect.top + window.scrollY),
        width: Math.round(caseRect.width),
        height: Math.round(caseRect.height),
      },
      value: liveControl.value,
      type: liveControl.getAttribute('type'),
      filled: liveControl.getAttribute('data-vf-filled'),
      selection: liveControl.disabled || liveControl.selectionStart === null
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
