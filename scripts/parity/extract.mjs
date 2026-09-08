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
  'aria-busy',
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

/**
 * Extracts every case on the page.
 *
 * `measuredRoles` comes from the component profile: the generic half of this
 * expression - the DOM description, the attribute filtering, the clip - is the
 * same for every component, and only the list of roles worth measuring differs.
 */
export function extractCasesExpression(measuredRoles) {
  return `(() => {
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

  const MEASURED_ROLES = ${JSON.stringify(measuredRoles)};

  // An element the user cannot see has no geometry worth comparing. This is how
  // an inert Razor action, which Vue does not render at all, stops being a
  // geometry difference while remaining a structural one.
  function isVisible(element) {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0;
  }

  const results = {};

  // Ids are canonicalised per case, so the comparator can see a reference
  // pointing at the wrong element inside a case but not two cases claiming the
  // same id. Document-level uniqueness is therefore checked here rather than
  // compared: a collision is wrong on every target at once, so there is nothing
  // for a three-way comparison to disagree about, and it would silently make
  // one field's label reach another field's control.
  const seenIds = new Map();
  const duplicateIds = [];
  for (const element of document.querySelectorAll('[data-parity-case] [id]')) {
    const owner = element.closest('[data-parity-case]').getAttribute('data-parity-case');
    if (seenIds.has(element.id)) {
      duplicateIds.push({ id: element.id, cases: [seenIds.get(element.id), owner] });
      continue;
    }
    seenIds.set(element.id, owner);
  }

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

  return { cases: results, duplicateIds };
})()`;
}

/**
 * Drives the scenario vocabulary with native browser input events.
 *
 * Selection setup remains explicit because caret direction is scenario data.
 * Resolve the control for every step: Vue may replace it during a wrapper
 * transition, so retaining the first element would exercise a detached node.
 *
 * The vocabulary is shared across components rather than split per profile.
 * `clickButton` and `pressKey` were added for VfIconButton, and they dispatch
 * the same real CDP pointer and key events the Input scenarios already used -
 * a synthesised `element.click()` would prove nothing about whether a keyboard
 * user can reach and operate the control.
 */
export async function driveInteraction(page, caseId, steps, activationSelector = '.vf-icon-button') {
  const selector = `[data-parity-case="${caseId}"]`;
  await page.evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    if (!root) throw new Error('missing interaction case');
    window.__parityInputEvents = [];
    // Activations are counted separately rather than derived from the event log
    // later, so that "Enter activated the button" is a recorded fact on both
    // adapters instead of an inference about which entry belongs to what.
    window.__parityActivations = 0;
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'input', 'keydown']) {
      document.addEventListener(type, (event) => {
        if (!root.contains(event.target)) return;
        if (type === 'click' && event.target.closest(${JSON.stringify(activationSelector)})) {
          window.__parityActivations += 1;
        }
        const entry = { type, trusted: event.isTrusted, defaultPrevented: false };
        window.__parityInputEvents.push(entry);
        setTimeout(() => { entry.defaultPrevented = event.defaultPrevented; }, 0);
      }, true);
    }
  })()`);
  // Same fallback as run.mjs settleExpression: a step that paints nothing -
  // pressing Enter on an already focused button - produces no frame, and a bare
  // rAF wait would hang until the DevTools request timed out.
  const settle = () =>
    page.evaluate(`new Promise((done) => {
      let settled = false;
      const finish = () => { if (!settled) { settled = true; done(); } };
      requestAnimationFrame(() => requestAnimationFrame(finish));
      setTimeout(finish, 500);
    })`);
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
      await pointerClick(page, selector, actionSelector);
    } else if (step.action === 'clickLabel') {
      // A real pointer click on the label. Native label activation is what
      // moves focus to the associated control, so this proves the for/id edge
      // in the only way that matters to a user - not by reading the attribute.
      await pointerClick(page, selector, step.selector ?? '.vf-field__label');
    } else if (step.action === 'clickButton') {
      await pointerClick(page, selector, step.selector ?? '.vf-icon-button');
    } else if (step.action === 'pressKey') {
      await pressKey(page, step.key);
    } else if (step.action === 'focusButton') {
      await page.evaluate(`(() => {
        const button = document.querySelector(${JSON.stringify(selector)}).querySelector(${JSON.stringify(step.selector ?? '.vf-icon-button')});
        if (!button) throw new Error('missing interaction button');
        button.focus();
      })()`);
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

/**
 * A real pointer click at the centre of an element.
 *
 * Not `element.click()`: a synthesised activation bypasses hit testing, so it
 * would happily "click" a control that is covered, zero-sized or disabled, and
 * report success where a user would get nothing.
 */
async function pointerClick(page, caseSelector, targetSelector) {
  const point = await page.evaluate(`(() => {
    const action = document.querySelector(${JSON.stringify(caseSelector)}).querySelector(${JSON.stringify(targetSelector)});
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
}

/** Virtual key codes for the keys the scenario vocabulary can press. */
const KEY_CODES = {
  Enter: { code: 'Enter', virtualKeyCode: 13, text: '\r' },
  ' ': { code: 'Space', virtualKeyCode: 32, text: ' ' },
  Tab: { code: 'Tab', virtualKeyCode: 9, text: undefined },
};

/**
 * A real key press on whatever currently has focus.
 *
 * A native button activates on keydown for Enter and on keyup for Space, so the
 * full down/char/up sequence is dispatched rather than a single event: sending
 * only keydown would make Space look broken on both adapters at once.
 */
async function pressKey(page, key) {
  const descriptor = KEY_CODES[key];

  if (!descriptor) {
    throw new Error(`unsupported interaction key: ${JSON.stringify(key)}`);
  }

  const base = {
    key,
    code: descriptor.code,
    windowsVirtualKeyCode: descriptor.virtualKeyCode,
    nativeVirtualKeyCode: descriptor.virtualKeyCode,
  };
  await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
  if (descriptor.text !== undefined) {
    await page.send('Input.dispatchKeyEvent', {
      type: 'char',
      ...base,
      text: descriptor.text,
      unmodifiedText: descriptor.text,
    });
  }
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
}

/**
 * Reports the actual post-scenario state before any visual focus normalization.
 *
 * The shape is component-specific - a caret position means nothing on a button,
 * an activation count means nothing on a text field - so the profile selects
 * it. Everything downstream compares whatever shape comes back, key by key.
 */
export function interactionExpression(caseId, snapshot = 'input') {
  if (snapshot === 'field') {
    return fieldInteractionExpression(caseId);
  }

  if (snapshot === 'icon-button' || snapshot === 'button') {
    return buttonInteractionExpression(caseId, snapshot === 'button' ? '.vf-button' : '.vf-icon-button');
  }

  if (snapshot !== 'input') {
    throw new Error(`Unknown interaction snapshot: ${snapshot}`);
  }

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

/**
 * Post-scenario state of a field.
 *
 * What matters on a field is whether the relationships still hold and whether
 * the state the label depends on moved. Focus is reported by role rather than
 * by element, because the two adapters generate different ids and the question
 * is "did the control get focus", not "did element X get focus".
 *
 * The relationships are re-read after the scenario rather than only before it:
 * a control that loses its id when its wrapper is replaced would otherwise pass
 * on the initial DOM comparison and be broken by the time a user reached it.
 */
function fieldInteractionExpression(caseId) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const field = root.querySelector('.vf-field');
    if (!field) throw new Error('missing field in case ${caseId}');
    const control = field.querySelector('input.vf-input');
    const wrapper = field.querySelector('.vf-field__control');
    const label = field.querySelector('.vf-field__label');
    const description = field.querySelector('.vf-field__description');
    const error = field.querySelector('.vf-field__error');
    const active = document.activeElement;
    const focusRole = active === control
      ? 'control'
      : active === label
        ? 'label'
        : active === document.body
          ? 'body'
          : field.contains(active) ? 'other-inside-field' : 'outside-field';

    const rect = root.getBoundingClientRect();
    // Relationships as edges, not as id values: "the label points at the
    // control" is the claim, and the generated token differs by construction.
    const describedTargets = (control?.getAttribute('aria-describedby') ?? '')
      .split(/\\s+/)
      .filter(Boolean)
      .map((id) => {
        const target = document.getElementById(id);
        if (!target) return 'missing';
        if (target === description) return 'description';
        if (target === error) return 'error';
        return 'foreign';
      });

    return {
      clip: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      focusRole,
      value: control?.value ?? null,
      filled: wrapper?.classList.contains('vf-field__control--filled') ?? null,
      floating: field.classList.contains('vf-field--floating'),
      invalid: field.classList.contains('vf-field--invalid'),
      fieldClasses: [...field.classList].filter((name) => name.startsWith('vf-')).sort(),
      controlClasses: [...(wrapper?.classList ?? [])].filter((name) => name.startsWith('vf-')).sort(),
      // The two edges a broken field passes every static check on.
      labelTargetsControl: label === null ? null : (label.getAttribute('for') ?? '') !== '' &&
        document.getElementById(label.getAttribute('for')) === control,
      describedTargets,
      accessibleName: control?.getAttribute('aria-label') ?? null,
      controlInvalid: control?.getAttribute('aria-invalid') ?? null,
      disabled: control?.disabled ?? null,
    };
  })()`;
}

/**
 * Post-scenario state of a button.
 *
 * What matters on a button is whether it actually activated, whether focus
 * landed on it, and whether it still reports the same accessible name and
 * pressed state afterwards. Those are the things a pointer user and a keyboard
 * user can each tell apart, and they have to agree across all three targets.
 *
 * The selector is a parameter because VfIconButton and VfButton have the same
 * post-scenario shape. Two copies of this expression would be two places for
 * the activation contract to drift.
 */
function buttonInteractionExpression(caseId, selector) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const button = root.querySelector('${selector}');
    if (!button) throw new Error('missing ${selector} in case ${caseId}');
    const activeElement = document.activeElement;
    const focusRole = activeElement === button
      ? 'button'
      : activeElement === document.body
        ? 'body'
        : root.contains(activeElement) ? 'other-inside-case' : 'outside-case';

    const caseRect = root.getBoundingClientRect();

    return {
      clip: {
        x: Math.round(caseRect.left + window.scrollX),
        y: Math.round(caseRect.top + window.scrollY),
        width: Math.round(caseRect.width),
        height: Math.round(caseRect.height),
      },
      // The count a pointer click and an Enter press must both produce, and a
      // disabled button must not.
      activations: window.__parityActivations ?? 0,
      focusRole,
      disabled: button.disabled,
      operable: !button.disabled && !button.hidden && getComputedStyle(button).display !== 'none',
      accessibleName: button.getAttribute('aria-label'),
      pressed: button.getAttribute('aria-pressed'),
      type: button.getAttribute('type'),
      buttonClasses: [...button.classList].filter((name) => name.startsWith('vf-')).sort(),
      glyphHidden: root.querySelector('${selector} svg')?.getAttribute('aria-hidden') ?? null,
    };
  })()`;
}
