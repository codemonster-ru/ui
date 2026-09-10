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
export const COMPARED_ATTRIBUTES = [
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
  'minlength',
  'inputmode',
  // VfTextarea. `rows` decides the control's rendered height, and the other
  // three are native behaviour a consumer sets deliberately.
  'rows',
  'wrap',
  'spellcheck',
  'role',
  'aria-busy',
  // VfDivider. Found missing by the attribute-coverage gate in M15: the
  // divider's whole accessibility contract is role plus aria-orientation, and
  // no comparison would have reported a difference in the second one. That is
  // the third time this gate has caught an attribute nothing compared - after
  // aria-busy in M12 and four native attributes in M13.
  'aria-orientation',
  // VfAvatar. Found missing by the attribute-coverage gate in M16, which is the
  // fourth time it has caught an attribute nothing compared - after aria-busy
  // in M12, four native attributes in M13 and aria-orientation in M15. `alt` is
  // half the avatar's accessibility contract: it is always written, and its
  // empty default is what makes the image decorative rather than unlabelled.
  // `src` is the other half of the image branch and had no comparison at all.
  'alt',
  'src',
  // The checkable controls. `checked` is the attribute the server rendered -
  // the live property is recorded separately, because after an interaction the
  // two say different things and only the property is true.
  'checked',
  'aria-checked',
  'aria-invalid',
  'aria-label',
  'aria-pressed',
  'aria-hidden',
  'aria-required',
  // VfSkeletonGate. Found missing by the attribute-coverage gate in M17, the
  // fifth time it has caught an attribute nothing compared - after aria-busy in
  // M12, four native attributes in M13, aria-orientation in M15 and alt/src in
  // M16. `inert` is half the gate's loading contract: aria-hidden takes the
  // faded content out of the accessibility tree, and `inert` is what takes it
  // out of reach of a pointer and the tab order. A gate that stopped writing it
  // would leave a consumer's buttons clickable underneath a skeleton, and every
  // class, style and ARIA comparison would still pass.
  'inert',
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
/**
 * Semantics the extractor records as live DOM properties rather than attributes.
 *
 * `indeterminate` has no HTML attribute at all, and `checked` as a property
 * diverges from the attribute the moment a user touches the control. A profile
 * may declare these as part of its contract, and
 * scripts/ci/attribute-coverage.test.mjs accepts them on that basis.
 */
export const LIVE_PROPERTIES = ['checked', 'indeterminate', 'value'];

export const REFERENCE_ATTRIBUTES = ['for', 'aria-describedby', 'aria-labelledby', 'aria-controls'];

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

  // A style attribute is compared as a set of declarations, parsed by the
  // browser rather than by this function.
  //
  // The two renderers do not produce the attribute the same way. Vue sets style
  // properties through the CSSOM, so what lands in the attribute is the
  // browser's own serialisation; the Razor adapter writes the attribute text
  // directly, so what lands there is what the server wrote. Those differ for
  // values the CSSOM canonicalises - a zero border-radius becomes 0px on the
  // Vue side and stays 0 on the Razor side - and that is a difference in
  // serialisation, not in the product: the computed style, the geometry and the
  // screenshot are identical.
  //
  // Found by the M16 skeleton parity run, which is the first component whose own
  // inline style a consumer can also write into.
  //
  // Running both sides through the browser's parser is what removes the whole
  // class of difference, and it does so without this file knowing any CSS: the
  // authority is the same engine both targets are rendered in. It is stricter
  // than comparing text, not looser - a declaration the browser rejects
  // disappears, so an adapter writing something unparseable differs from one
  // writing a real declaration. Two adapters writing the *same* unparseable
  // declaration compare equal, which is the same blind spot text comparison had
  // and is what the reference direction exists to cover.
  const styleProbe = document.createElement('div');

  function normaliseStyle(value) {
    styleProbe.style.cssText = '';
    styleProbe.style.cssText = value;

    return [...styleProbe.style]
      .map((property) => property + ':' + styleProbe.style.getPropertyValue(property).trim())
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
      if (name === 'style') {
        const declarations = normaliseStyle(element.getAttribute(name));
        // A style attribute holding no declarations is not a style. It is
        // recorded as absent rather than as an empty string, because the two
        // are indistinguishable to the CSSOM, to rendering and to a user, and
        // the difference between them is pure framework bookkeeping.
        //
        // Found by the M17 transition stage. Vue's v-show remembers an
        // element's display at mount and restores it when the element becomes
        // visible again, and restoring an element that never had an inline
        // display leaves the attribute behind, empty. So a gate driven ready
        // and back carries style="" on its overlay where a gate rendered
        // loading from the start carries no attribute at all - a difference
        // that is real in the DOM and is nothing at all in the product. The
        // quirk itself is pinned by VfSkeletonGate.characterization.spec.ts;
        // this is what stops it being reported as a product divergence.
        if (declarations !== '') attributes[name] = declarations;
        continue;
      }
      attributes[name] = element.getAttribute(name);
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

    // The live value of a control is state, not markup, and is what a user
    // sees. Textareas were omitted here until M13, which mattered more for them
    // than for inputs: a textarea's value is never an attribute on either
    // adapter, so nothing else in the capture described it at all.
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      node.liveValue = element.value;
      node.operable = !element.disabled;
    }

    // A checkable control's state is a property, and after any interaction it
    // is the only truthful source: the checked attribute records what the
    // server said, not what the user did. indeterminate has no attribute at
    // all, so without this it would be compared by nothing.
    if (element instanceof HTMLInputElement && (element.type === 'checkbox' || element.type === 'radio')) {
      node.liveChecked = element.checked;
      node.liveIndeterminate = element.indeterminate;
    }

    // A textarea is the one element whose text is a value rather than content,
    // and neither representation of that value is part of its contract:
    //
    //   - HTML defines no value content attribute for textarea at all. Vue's
    //     client render writes one anyway, as a side effect of binding :value.
    //   - the element's text is its *default* value, which the browser never
    //     renders as content - what a user reads is the live value.
    //
    // Comparing either would compare how a framework transports the value
    // rather than what the value is, and the two adapters transport it
    // differently by necessity: a server-rendered control has only the text,
    // because there is no client to set a property. So both are dropped here
    // and liveValue above carries the comparison instead - which is strictly
    // more than was compared before M13, when nothing described a textarea's
    // value at all. A wrong value still fails, on dom.liveValue.
    if (element instanceof HTMLTextAreaElement) {
      delete node.attributes.value;
      delete node.text;
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
    } else if (step.action === 'focusCheckable') {
      await page.evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)})
          .querySelectorAll('input.vf-checkbox__input, input.vf-radio__input, input.vf-switch__input')[${step.index ?? 0}];
        if (!control) throw new Error('missing checkable control');
        control.focus();
      })()`);
    } else if (step.action === 'clickCheckable') {
      // The visible control, not the input. All three components hide the
      // native input (1px, clipped, opacity 0) and paint a span in its place,
      // so the span is what a person's pointer actually lands on - and the
      // wrapping label is what delivers the click to the input. Clicking the
      // hidden input instead would be testing something no user can do, and
      // would also skip the label indirection this contract depends on.
      await pointerClick(
        page,
        selector,
        '.vf-checkbox__control, .vf-radio__control, .vf-switch__control',
        step.index ?? 0,
      );
    } else if (step.action === 'clickCheckableContent') {
      // A click on the label text. The root of all three components is a
      // <label>, so this must reach the input natively - no `for`, no JS.
      await pointerClick(
        page,
        selector,
        '.vf-checkbox__content, .vf-radio__content, .vf-switch__content',
        step.index ?? 0,
      );
    } else if (step.action === 'focusTextarea') {
      await page.evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)}).querySelector('textarea.vf-textarea');
        if (!control) throw new Error('missing textarea');
        control.focus();
      })()`);
    } else if (step.action === 'typeTextarea') {
      // Focus, then real key events through CDP so the browser applies the
      // control's own rules: a disabled control takes nothing, a readonly one
      // takes focus and keeps its value. Assigning .value directly would type
      // straight past both.
      await page.evaluate(`(() => {
        const control = document.querySelector(${JSON.stringify(selector)}).querySelector('textarea.vf-textarea');
        if (!control) throw new Error('missing textarea');
        control.focus();
        control.setSelectionRange?.(0, control.value.length);
      })()`);
      await typeText(page, step.value);
    } else if (step.action === 'blurTextarea') {
      await page.evaluate(`document.activeElement?.blur()`);
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
async function pointerClick(page, caseSelector, targetSelector, index = 0) {
  const point = await page.evaluate(`(() => {
    // index picks a member of a group; every other caller wants the first
    // match, which is what a plain querySelector already gave them.
    const action = document.querySelector(${JSON.stringify(caseSelector)})
      .querySelectorAll(${JSON.stringify(targetSelector)})[${index}];
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

/**
 * Types a string with real key events, replacing whatever is selected.
 *
 * An empty string means "clear", which is a backspace over the selection. Every
 * character goes through the browser, so a disabled or readonly control refuses
 * the input exactly as it would for a person.
 */
async function typeText(page, value) {
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyDown',
    windowsVirtualKeyCode: 8,
    code: 'Backspace',
    key: 'Backspace',
  });
  await page.send('Input.dispatchKeyEvent', {
    type: 'keyUp',
    windowsVirtualKeyCode: 8,
    code: 'Backspace',
    key: 'Backspace',
  });

  for (const character of value) {
    if (character === '\n') {
      await page.send('Input.dispatchKeyEvent', {
        type: 'keyDown',
        windowsVirtualKeyCode: 13,
        code: 'Enter',
        key: 'Enter',
        text: '\r',
      });
      await page.send('Input.dispatchKeyEvent', {
        type: 'keyUp',
        windowsVirtualKeyCode: 13,
        code: 'Enter',
        key: 'Enter',
      });
      continue;
    }
    await page.send('Input.dispatchKeyEvent', { type: 'keyDown', text: character, key: character });
    await page.send('Input.dispatchKeyEvent', { type: 'keyUp', key: character });
  }
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
 * The fields a static snapshot must carry.
 *
 * Exported because the runner checks for them rather than trusting that the
 * expression ran: a snapshot that came back empty on *every* target would
 * otherwise compare equal to itself and report a clean pass, which is the
 * silent skip this whole mechanism exists to prevent. The comparator only ever
 * sees differences; absence on both sides is not one.
 *
 * Found by the M15 adversarial proof: the first implementation compared the
 * snapshots faithfully and still passed when both of them were empty.
 */
export const STATIC_SNAPSHOT_FIELDS = [
  'interactionPosture',
  'caseRendered',
  'focusableCount',
  'interactiveRoleCount',
  'focusRole',
];

/**
 * What a component with nothing to drive reports.
 *
 * M15 is the first batch whose components have no interaction at all, and the
 * obvious implementation - skip the stage - is the one thing this must not do.
 * A skipped stage is indistinguishable from a stage that ran and found nothing,
 * so a target that silently stopped producing interaction evidence would still
 * report PASS. That is the M07 failure mode the contracts README describes.
 *
 * So "there is nothing to drive" is measured instead of assumed. The snapshot
 * asserts the case root exists, then counts what a user could actually reach
 * inside it: focusable elements, and elements exposing an interactive role. For
 * VfBadge, VfTag and VfDivider all of those are zero, and zero recorded on both
 * targets is evidence. If either adapter ever rendered a button, a link or a
 * tabindex inside one of these components, the counts would differ and the
 * static.noInteraction dimension would move.
 *
 * The snapshot itself is unchanged in M16. What changed is what the runner does
 * with it - see staticOwnershipViolations below.
 */
function staticInteractionExpression(caseId) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const elements = Array.from(root.querySelectorAll('*'));

    return {
      // Declared rather than derived: the profile said this component has no
      // scenario, and the snapshot records that claim next to the measurement
      // that tests it. A run that produced no measurement at all would be
      // missing these keys, and the comparator rejects mismatched shapes.
      interactionPosture: 'none',
      caseRendered: true,
      focusableCount: root.querySelectorAll(FOCUSABLE).length,
      interactiveRoleCount: elements.filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''))
        .length,
      // Nothing was driven, so nothing inside the case may hold focus. This is
      // what notices an adapter that autofocuses something the other does not.
      focusRole: root.contains(document.activeElement) ? 'inside-case' : 'outside-case',
    };
  })()`;
}

/**
 * Whether a static snapshot matches what the case said the consumer put in it.
 *
 * M16 is the first batch with a component whose slots hold arbitrary consumer
 * content, and it exposed a hole in how M15 used this measurement - not a false
 * failure, which is what the plan anticipated, but the opposite.
 *
 * M15 compared the counts between targets and required nothing of their value.
 * That works for VfBadge, VfTag and VfDivider because their counts are zero, and
 * the file above says so in as many words: "zero recorded on both targets is
 * evidence". But the comparator only ever sees differences. Put a consumer
 * button inside a VfCard slot and every target reports focusableCount 1, the
 * comparison is clean, and the snapshot goes on declaring interactionPosture
 * 'none' next to a measurement that now contradicts it. Nothing fails, and the
 * absolute half of the evidence - the half that made zero mean something -
 * quietly stops existing.
 *
 * So the value is asserted, against a number the *case* declares rather than a
 * number the component can influence:
 *
 *   - a case that declares nothing must measure zero. That is every case of
 *     every M15 component and most of M16, and it is strictly stronger than
 *     what M15 required, not weaker;
 *   - a case that says "the consumer puts one control in a slot" must measure
 *     exactly one. Not "at most" - exactly, so a component that added a control
 *     of its own next to the consumer's still fails;
 *   - a missing measurement is a failure, never a skip.
 *
 * The declaration cannot be forged by an adapter: it lives in the shared case
 * catalog, both adapters render from it, and neither can see it. A component
 * that started rendering a button would be measured against the consumer's
 * number and exceed it on both targets at once - which is exactly the case the
 * three-way comparison cannot catch, because two identically wrong adapters
 * agree.
 *
 * Explicit ARIA roles are held at zero: no case gives consumer slot content an
 * interactive role attribute, so a non-zero count here is always the component's
 * doing. If a future case needs one, this is where that would be declared, and
 * refusing to guess is the point.
 *
 * Returns the problems as strings so a test can drive it directly.
 */
export function staticOwnershipViolations(parityCase, snapshot) {
  const violations = [];
  const declared = parityCase.consumerInteractive ?? 0;

  if (!snapshot || typeof snapshot !== 'object') {
    return [`case ${parityCase.id} produced no static snapshot at all`];
  }

  const missing = STATIC_SNAPSHOT_FIELDS.filter((field) => !(field in snapshot));
  if (missing.length > 0) {
    return [
      `case ${parityCase.id} is missing [${missing.join(', ')}]. ` +
        'A stage that records nothing is a failure, not a pass.',
    ];
  }

  if (snapshot.interactionPosture !== 'none' || snapshot.caseRendered !== true) {
    violations.push(
      `case ${parityCase.id} reports posture=${JSON.stringify(snapshot.interactionPosture)} ` +
        `rendered=${JSON.stringify(snapshot.caseRendered)}`,
    );
  }

  if (snapshot.focusableCount !== declared) {
    violations.push(
      `case ${parityCase.id} measured ${snapshot.focusableCount} focusable element(s) but the catalog declares ` +
        `${declared} consumer-provided control(s). A component whose own markup is focusable fails here even when ` +
        'every target agrees, which is the failure a three-way comparison cannot see.',
    );
  }

  if (snapshot.interactiveRoleCount !== 0) {
    violations.push(
      `case ${parityCase.id} measured ${snapshot.interactiveRoleCount} element(s) carrying an interactive role. ` +
        'No case gives consumer slot content an explicit role, so this is the component exposing one.',
    );
  }

  return violations;
}

/**
 * What a VfSkeletonGate case reports.
 *
 * The static ownership fields first, because the gate owns no interaction and
 * has to say so the same way VfBadge and VfCard do - and because its content
 * slot may hold a consumer control, so the declared-budget assertion in
 * staticOwnershipViolations applies unchanged.
 *
 * Then the state fields, which are the part that is new. They describe which
 * half the gate is presenting *as measured*, not as configured:
 *
 *   - `overlayDisplay` is the computed display of the overlay, so a target that
 *     left a stale skeleton visible after a transition differs here even though
 *     its markup still contains both halves;
 *   - `contentReady`, `rootBusy` and `contentInert` are the three outputs the
 *     predicate drives, read back off the live DOM;
 *   - `childSkeletonPresent` is whether the canonical child is in the overlay.
 *
 * Together these are what a "branch" means for a component that has none. A
 * case whose intended state disappeared cannot pass by resembling another valid
 * case, because the state is recorded per case and compared per case.
 */
function skeletonGateInteractionExpression(caseId) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const elements = Array.from(root.querySelectorAll('*'));
    const gate = root.querySelector('.vf-skeleton-gate');
    const content = root.querySelector('.vf-skeleton-gate__content');
    const overlay = root.querySelector('.vf-skeleton-gate__overlay');
    if (!gate || !content || !overlay) throw new Error('case ${caseId} rendered no gate');

    return {
      interactionPosture: 'none',
      caseRendered: true,
      focusableCount: root.querySelectorAll(FOCUSABLE).length,
      interactiveRoleCount: elements.filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''))
        .length,
      focusRole: root.contains(document.activeElement) ? 'inside-case' : 'outside-case',
      // The presented state, measured rather than configured.
      contentReady: content.classList.contains('vf-skeleton-gate__content--ready'),
      rootBusy: gate.getAttribute('aria-busy'),
      contentHidden: content.getAttribute('aria-hidden'),
      contentInert: content.hasAttribute('inert'),
      overlayDisplay: getComputedStyle(overlay).display,
      overlayHidden: overlay.getAttribute('aria-hidden'),
      childSkeletonPresent: overlay.querySelector('.vf-skeleton') !== null,
      contentText: (content.textContent ?? '').replace(/\\s+/g, ' ').trim(),
    };
  })()`;
}

/**
 * Drives a declared transition and reports what the case became.
 *
 * The mechanism is the component's own public API: the fixture holds `ready` in
 * reactive state and exposes a setter, and this calls it. Nothing here reaches
 * into the component, and nothing re-renders the page - which is the difference
 * between measuring a transition and generating a second static page that
 * happens to show the other state.
 *
 * A target that has no setter reports `supported: false` rather than being
 * skipped. The distinction matters: a skipped stage and a stage that ran and
 * found nothing compare equal to each other, and a target that quietly stopped
 * supporting transitions would otherwise pass.
 */
export function transitionExpression(caseId, to) {
  return `(async () => {
    const apply = window.__parityTransition;
    if (typeof apply !== 'function') {
      return { supported: false };
    }

    const applied = await apply(${JSON.stringify(caseId)}, ${JSON.stringify(to)});

    return { supported: true, applied };
  })()`;
}

/**
 * Marks the two elements a transition must not destroy, and reads the marks back.
 *
 * `phase` is 'mark' before the transition and 'read' after it. The mark is an
 * expando property rather than an attribute, so it cannot reach the DOM
 * comparison and cannot change what any other dimension sees. A recreated
 * element is a fresh object and carries no property, which is exactly the
 * signal wanted: the question is node identity, not markup equality.
 *
 * This is what a `v-if` rewrite of either half fails. Such a rewrite produces
 * the correct markup in both states and converges on the right one, and it
 * destroys the consumer's DOM on every change - scroll position, focus, an
 * uncontrolled input's value, a playing media element - which nothing else
 * here would notice.
 */
export function transitionIdentityExpression(caseId, phase) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const content = root.querySelector('.vf-skeleton-gate__content');
    const overlay = root.querySelector('.vf-skeleton-gate__overlay');
    const nodes = {
      contentChild: content ? content.firstElementChild : null,
      overlayChild: overlay ? overlay.firstElementChild : null,
    };

    if (${JSON.stringify(phase)} === 'mark') {
      const marked = {};
      for (const [name, node] of Object.entries(nodes)) {
        if (node) node.__parityIdentity = name;
        marked[name] = node ? 'marked' : 'absent';
      }
      return marked;
    }

    const read = {};
    for (const [name, node] of Object.entries(nodes)) {
      read[name] = node ? (node.__parityIdentity === name ? 'same-node' : 'recreated') : 'absent';
    }
    return read;
  })()`;
}

/**
 * Whether a transition's result is well formed, and converged.
 *
 * Returns problems as strings so a test can drive it directly.
 *
 * Three things are checked, and the third is the one that matters:
 *
 *   - the transition ran at all on a target that claims to support it. A run
 *     that reported nothing is a failure, never a skip;
 *   - the case ended up in the state it was driven to;
 *   - the case's DOM equals the DOM of the case the catalog names as the state
 *     it should land in, on the same target. That is what a hybrid fails: a
 *     gate that updated its classes but left a stale overlay visible is in the
 *     right state by every attribute and still not equal to a gate that
 *     rendered that state from the start.
 */
export function transitionViolations(parityCase, result, postDom, expectedDom) {
  const problems = [];
  const to = parityCase.transition?.to ?? {};

  if (!result || typeof result !== 'object') {
    return [`case ${parityCase.id} produced no transition result at all`];
  }
  if (result.supported !== true) {
    return [
      `case ${parityCase.id} declares a transition, but this target exposes no way to drive it. ` +
        'A target that cannot transition has to say so where it is rendered, not by producing no evidence.',
    ];
  }
  if (result.applied !== true) {
    problems.push(`case ${parityCase.id} reported applied=${JSON.stringify(result.applied)}`);
  }
  if (typeof to.ready === 'boolean' && result.state?.contentReady !== to.ready) {
    problems.push(
      `case ${parityCase.id} was driven to ready=${to.ready} but reports contentReady=` +
        `${JSON.stringify(result.state?.contentReady)}`,
    );
  }
  if (JSON.stringify(postDom) !== JSON.stringify(expectedDom)) {
    problems.push(
      `case ${parityCase.id} did not converge on ${parityCase.transition.matches}. ` +
        'A transition has to land on the state a fresh render of that state produces, not on a hybrid of the two.',
    );
  }

  return problems;
}

/**
 * Reports the actual post-scenario state before any visual focus normalization.
 *
 * The shape is component-specific - a caret position means nothing on a button,
 * an activation count means nothing on a text field - so the profile selects
 * it. Everything downstream compares whatever shape comes back, key by key.
 */
export function interactionExpression(caseId, snapshot = 'input') {
  if (snapshot === 'static') {
    return staticInteractionExpression(caseId);
  }

  if (snapshot === 'skeleton-gate') {
    return skeletonGateInteractionExpression(caseId);
  }

  if (snapshot === 'checkable') {
    return checkableInteractionExpression(
      caseId,
      'input.vf-checkbox__input, input.vf-radio__input, input.vf-switch__input',
    );
  }

  if (snapshot === 'textarea') {
    return textareaInteractionExpression(caseId);
  }

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
 * Post-scenario state of a checkable control.
 *
 * One snapshot for VfCheckbox, VfRadio and VfSwitch, and unlike their class
 * lists this really is one shape: did it end up checked, is it indeterminate,
 * where did focus land, and - for a radio - what happened to the rest of its
 * group. The selector comes from the profile.
 *
 * Group state is recorded for every component rather than only radios, so a
 * checkbox that started behaving like a radio would show up here rather than
 * being invisible because nobody looked.
 */
function checkableInteractionExpression(caseId, selector) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const controls = [...root.querySelectorAll('${selector}')];
    if (controls.length === 0) throw new Error('missing ${selector} in case ${caseId}');
    const control = controls[0];
    const active = document.activeElement;
    const focusRole = controls.indexOf(active) !== -1
      ? 'control'
      : active === document.body
        ? 'body'
        : root.contains(active) ? 'other-inside-case' : 'outside-case';

    const rect = root.getBoundingClientRect();
    const checkedMembers = controls.filter((candidate) => candidate.checked);

    return {
      clip: {
        x: Math.round(rect.left + window.scrollX),
        y: Math.round(rect.top + window.scrollY),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      // The property, not the attribute: after a click the attribute still
      // says whatever the server rendered.
      liveChecked: control.checked,
      liveIndeterminate: control.indeterminate,
      focusRole,
      disabled: control.disabled,
      operable: !control.disabled,
      ariaChecked: control.getAttribute('aria-checked'),
      controlRole: control.getAttribute('role'),
      controlValue: control.getAttribute('value'),
      controlName: control.getAttribute('name'),
      rootClasses: [...(root.firstElementChild?.classList ?? [])].filter((name) => name.startsWith('vf-')).sort(),
      // Group state. For a lone control this is the control itself, which is
      // exactly what a broken mutual exclusion would change.
      groupSize: controls.length,
      groupCheckedCount: checkedMembers.length,
      groupChecked: checkedMembers.length === 1 ? checkedMembers[0].getAttribute('value') : null,
    };
  })()`;
}

/**
 * Post-scenario state of a textarea, and of the field around it.
 *
 * Almost nothing this component does is visible in markup: the value lives in a
 * property, the filled signal belongs to a different element, and the
 * relationships come from the field. So the snapshot records the value the user
 * would read back, where focus ended up, and whether the label still reaches
 * this control - the three things a broken textarea keeps looking fine without.
 */
function textareaInteractionExpression(caseId) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const control = root.querySelector('textarea.vf-textarea');
    if (!control) throw new Error('missing textarea in case ${caseId}');
    const field = root.querySelector('.vf-field');
    const wrapper = root.querySelector('.vf-field__control');
    const label = root.querySelector('.vf-field__label');
    const description = root.querySelector('.vf-field__description');
    const error = root.querySelector('.vf-field__error');
    const active = document.activeElement;
    const focusRole = active === control
      ? 'control'
      : active === label
        ? 'label'
        : active === document.body
          ? 'body'
          : root.contains(active) ? 'other-inside-case' : 'outside-case';

    const rect = root.getBoundingClientRect();
    const describedTargets = (control.getAttribute('aria-describedby') ?? '')
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
      // The value as the user would read it back, newlines and all.
      value: control.value,
      focusRole,
      filled: wrapper === null ? null : wrapper.classList.contains('vf-field__control--filled'),
      controlFilled: control.getAttribute('data-vf-filled'),
      floating: field === null ? null : field.classList.contains('vf-field--floating'),
      invalid: field === null ? null : field.classList.contains('vf-field--invalid'),
      controlInvalid: control.getAttribute('aria-invalid'),
      disabled: control.disabled,
      readOnly: control.readOnly,
      operable: !control.disabled && !control.readOnly,
      controlClasses: [...control.classList].filter((name) => name.startsWith('vf-')).sort(),
      labelTargetsControl: label === null ? null : (label.getAttribute('for') ?? '') !== '' &&
        document.getElementById(label.getAttribute('for')) === control,
      describedTargets,
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
