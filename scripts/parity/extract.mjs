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
  // VfAlert. Found missing by the attribute-coverage gate in M19, the sixth
  // time it has caught an attribute nothing compared. The alert is the first
  // migrated component whose root carries a live-region role, and the
  // reference writes *neither* of the two attributes that would tune it - no
  // aria-live, no aria-atomic. Their absence is the contract, and an adapter
  // that started writing aria-live="polite" on a danger alert would change
  // how it is announced while every class, style and role comparison passed.
  'aria-live',
  'aria-atomic',
  // VfSkeletonGate. Found missing by the attribute-coverage gate in M17, the
  // fifth time it has caught an attribute nothing compared - after aria-busy in
  // M12, four native attributes in M13, aria-orientation in M15 and alt/src in
  // M16. `inert` is half the gate's loading contract: aria-hidden takes the
  // faded content out of the accessibility tree, and `inert` is what takes it
  // out of reach of a pointer and the tab order. A gate that stopped writing it
  // would leave a consumer's buttons clickable underneath a skeleton, and every
  // class, style and ARIA comparison would still pass.
  'inert',
  // VfProgressSpinner. Found missing by the attribute-coverage gate in M20,
  // the seventh time it has caught an attribute nothing compared. The
  // spinner's root is a progressbar that writes *no* value - no aria-valuenow,
  // aria-valuemin or aria-valuemax - and passes a consumer's through; before
  // M20 an adapter that started writing aria-valuemin="0" aria-valuemax="100"
  // on every spinner would have compared equal. `focusable` is the other half
  // of the artwork's accessibility contract beside aria-hidden: it keeps the
  // svg out of the tab order of engines that still put it there, and the
  // reference writes it on every spinner.
  'aria-valuenow',
  'aria-valuemin',
  'aria-valuemax',
  // VfProgressBar. Found missing by the attribute-coverage gate in M21, the
  // eighth time it has caught an attribute nothing compared. The bar is the
  // first migrated progressbar that writes a value, and aria-valuetext is
  // the one attribute that would change how that value is announced while
  // leaving aria-valuenow, the width and every screenshot alone. The
  // reference never writes it and forwards a consumer's; before M21 an
  // adapter that wrote aria-valuetext="50%" on every determinate bar would
  // have compared equal.
  'aria-valuetext',
  // VfAccordion. Found missing by the attribute-coverage gate in M22, the
  // ninth time it has caught an attribute nothing compared. `aria-expanded`
  // is the accordion's whole announced state: before M22 no migrated
  // component wrote it, and an adapter whose trigger announced the opposite
  // of its panel would have compared equal on every attribute while the
  // relationship graph and the screenshot both passed. `aria-disabled` is the
  // other half of the disabled contract - the reference writes the native
  // attribute and *never* this one, and an adapter that wrote both would
  // announce the trigger twice.
  'aria-expanded',
  'aria-disabled',
  // VfStepper. Found missing by the attribute-coverage gate in M23, the
  // tenth time it has caught an attribute nothing compared. `aria-current`
  // is the stepper's whole announced selection: before M23 no migrated
  // component wrote it, and a target whose current trigger lost it - or
  // whose every trigger gained aria-current="false" - compared equal on
  // every attribute while the classes, the factor and the screenshot all
  // passed. The reference writes `step` on the current trigger and nothing
  // elsewhere, and forwards a consumer's onto the nav.
  'aria-current',
  // VfTabs. Found missing by the attribute-coverage gate in M24, the
  // eleventh time it has caught an attribute nothing compared, and the first
  // time the hole was also reproduced as a false PASS on a real capture: a
  // Razor page whose roving tabindex was inverted (the selected tab at -1,
  // the others at 0) and one whose aria-selected stayed on the wrong tab
  // both compared equal to the reference on every DOM dimension. `tabindex`
  // is the tabs' whole keyboard-reachability contract - which tab Tab lands
  // on - and no accessibility tree exposes it; `aria-selected` is the tabs'
  // whole announced selection. Neither is an invariant the comparator knows
  // ("exactly one 0", "exactly one true"): the reference legitimately writes
  // zero of each for an unknown value and two of each for a duplicated one,
  // and the comparison is of what the reference wrote.
  'tabindex',
  'aria-selected',
  // VfLink. Found missing by the attribute-coverage gate in M25 and reproduced
  // as a false PASS on real captures before being added: with these absent
  // the DOM record of an anchor described no destination at all, so a Razor
  // page whose href pointed elsewhere, whose target=_blank was removed and
  // whose derived rel was removed each compared equal to the reference on
  // every DOM dimension. The three are what a native link is made of.
  'href',
  'target',
  'rel',
  // VfDropdown (M28): the trigger's announced popup type, and Chrome exposes
  // it. Caught by the attribute-coverage gate, and reproduced as a false PASS
  // on a real capture: a Razor trigger announcing aria-haspopup="true"
  // compared equal to the reference's "menu" on every DOM dimension.
  'aria-haspopup',
  // VfSelect (M32). Found missing by a Razor mutation that dropped the title a
  // consumer forwards to the trigger - reproduced as a false PASS on real
  // captures before being added: title is one of the four attribute kinds the
  // select forwards, and nothing compared it.
  'title',
  // VfFieldset (M34). The fieldset's native form association: `form` is not a
  // prop, it reaches the fieldset as an attribute, and nothing compared it -
  // VfGroupBox recorded the same gap in outsideTheCatalog. A fieldset whose
  // form attribute moved or vanished would have compared equal everywhere.
  'form',
  // VfBreadcrumbs. Found missing by the attribute-coverage gate in M26 - the
  // thirteenth attribute it has caught nobody compared - and reproduced as a
  // false PASS on real captures before being added: the separator glyph is a
  // polyline, chevron-right and chevron-down differ in nothing but their
  // points, and a Razor page rendering the wrong one passed every DOM
  // dimension, every ownership check and the accessibility tree (the
  // separator is aria-hidden) on a case with no screenshot. `d`, `cx` and
  // the other geometry attributes below were compared already; `points` is
  // the polyline's, and the first migrated glyph drawn with one.
  'points',
  'focusable',
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
 * What is wrong with a profile's `followedReferences` declaration, if anything.
 *
 * M28.0. A declaration names an element inside the case (`source`) and one id
 * reference attribute on it (`attribute`); the element that reference names is
 * then part of the case even when it is rendered outside the case root. That is
 * the whole vocabulary. Nothing here knows what the source or the target is, and
 * nothing scans the case for references on its own: only declared edges are
 * followed, and a declaration that cannot mean anything is refused rather than
 * skipped, because a rule the extractor silently ignores is evidence nobody has.
 */
export function followedReferenceProblems(declaration) {
  if (!Array.isArray(declaration)) return ['followedReferences must be an array'];
  const wellFormed = (rule, index) =>
    Object.keys(rule ?? {}).every((key) => key === 'source' || key === 'attribute') &&
    /\S/.test(typeof rule?.source === 'string' ? rule.source : '') &&
    REFERENCE_ATTRIBUTES.includes(rule.attribute) &&
    declaration.findIndex((other) => other?.source === rule.source && other?.attribute === rule.attribute) === index;
  return declaration.flatMap((rule, index) =>
    wellFormed(rule, index) ? [] : [`followedReferences[${index}] is not one unrepeated { source, attribute } rule`],
  );
}

/**
 * Extracts every case on the page.
 *
 * `measuredRoles` comes from the component profile: the generic half of this
 * expression - the DOM description, the attribute filtering, the clip - is the
 * same for every component, and only the list of roles worth measuring differs.
 * `followedReferences`, also from the profile, is described at
 * followedReferenceProblems.
 */
export function extractCasesExpression(measuredRoles, followedReferences = []) {
  const problems = followedReferenceProblems(followedReferences);
  if (problems.length > 0) throw new Error(`Malformed followedReferences: ${problems.join('; ')}.`);

  return `(() => {
  const COMPARED_ATTRIBUTES = ${JSON.stringify(COMPARED_ATTRIBUTES)};
  const FRAMEWORK_ATTRIBUTE_PATTERN = ${FRAMEWORK_ATTRIBUTE_PATTERN.toString()};
  const REFERENCE_ATTRIBUTES = ${JSON.stringify(REFERENCE_ATTRIBUTES)};
  const FOLLOWED_REFERENCES = ${JSON.stringify(followedReferences)};

  // Generated ids differ between adapters by design. They are replaced with a
  // document-order token, and every reference to them is rewritten through the
  // same map, so the relationship graph is compared while the concrete value is
  // not. A reference pointing at the wrong element still differs.
  //
  // M28.0: the map also covers the case's followed targets - elements a
  // declared reference names that are rendered outside the case root, such as
  // an overlay moved to the body. They are numbered after the root's ids and in
  // their own document order, so a target is identified by where it is, never
  // by the order it happened to be reached in. That distinction is load-bearing:
  // numbering targets in the order the references reach them would make two
  // consistently cross-wired instances isomorphic to two correctly wired ones.
  function buildIdMap(root, followed = []) {
    const map = new Map();
    let index = 0;
    for (const element of [...root.querySelectorAll('[id]'), ...followed.flatMap((node) => [node, ...node.querySelectorAll('[id]')])]) {
      map.set(element.id, '#id' + index++);
    }
    return map;
  }

  // The targets a case's declared references name outside its root. A source
  // the declaration names but the case does not render is refused: the profile
  // said every case has one. A target that is missing is not refused - that is
  // a reference to something not rendered, and canonicaliseReference records it
  // as #dangling so it is compared against the reference like anything else. A
  // target inside another case is refused, because that is two cases sharing a
  // node, which no comparison of either could attribute.
  function followReferences(root, caseId) {
    const followed = [];
    for (const rule of FOLLOWED_REFERENCES) {
      const sources = [...root.querySelectorAll(rule.source)];
      if (sources.length === 0) throw new Error('case ' + caseId + ': followed source ' + rule.source + ' matched nothing');
      for (const token of sources.flatMap((source) => (source.getAttribute(rule.attribute) ?? '').split(/\\s+/))) {
        const target = token ? document.getElementById(token) : null;
        if (!target || root.contains(target) || followed.includes(target)) continue;
        if (target.closest('[data-parity-case]')) throw new Error('case ' + caseId + ': ' + rule.attribute + ' follows into another case');
        followed.push(target);
      }
    }
    return followed.sort((left, right) => (left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  }

  // A reference outside the case keeps its literal: it is a consumer's own id,
  // written into the catalog, and a target that rewrote it would differ. A
  // reference that resolves *nowhere* in the document is recorded as
  // #dangling, without the literal. Found by M22: a closed accordion's
  // aria-controls names the generated id of a panel v-if has removed, on
  // every target, and the generated literal differs by construction - so the
  // literal would have made the closed state a permanent difference while
  // saying nothing about the product. The dangling form is still a difference
  // against a resolved one, which is what the relationship attacks need.
  function canonicaliseReference(value, idMap) {
    return value
      .split(/\\s+/)
      .filter(Boolean)
      .map((token) =>
        idMap.get(token) ?? (document.getElementById(token) ? '#outside-case:' + token : '#dangling'),
      )
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

  function isAdapterTemplate(element) {
    return element.tagName === 'TEMPLATE' && [...element.attributes].some((attribute) => attribute.name.startsWith('data-vf-razor'));
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
      // A <template> carrying the Razor ownership marker is the adapter's
      // deferred content store - the closed accordion's panel, waiting to be
      // rendered on open - and not product DOM: it is inert, unpainted and
      // absent from the accessibility tree, and the reference has no node
      // there at all. It is the one element dropped here, and only with the
      // marker: a consumer's own <template> in a slot is compared, and any
      // other element with the marker is compared. What the template holds is
      // compared the moment it renders, by the post-interaction DOM.
      children: [...element.children].filter((child) => !isAdapterTemplate(child)).map((child) => describe(child, idMap)),
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
  //
  // Across cases only, since M24. Two items of one VfTabs sharing a value
  // share their generated id - the immutable reference renders
  // tabs/duplicate-values that way, and this check refused the historical
  // contract itself. A duplicate *inside* a case is compared, not refused:
  // both elements take the same position token, so a target that
  // de-duplicated them differs on dom.relationships against the reference,
  // and a normal case cannot pass with one because the reference has none.
  const seenIds = new Map();
  const duplicateIds = [];
  for (const element of document.querySelectorAll('[data-parity-case] [id]')) {
    const owner = element.closest('[data-parity-case]').getAttribute('data-parity-case');
    if (seenIds.has(element.id) && seenIds.get(element.id) !== owner) {
      duplicateIds.push({ id: element.id, cases: [seenIds.get(element.id), owner] });
      continue;
    }
    seenIds.set(element.id, owner);
  }

  for (const root of document.querySelectorAll('[data-parity-case]')) {
    const caseId = root.getAttribute('data-parity-case');
    const followed = followReferences(root, caseId);
    const idMap = buildIdMap(root, followed);
    const styles = {};

    for (const [role, selector] of Object.entries(MEASURED_ROLES)) {
      const element = root.querySelector(selector);
      if (element && isVisible(element)) styles[role] = measure(element);
    }

    const rect = root.getBoundingClientRect();

    results[caseId] = {
      // Followed targets are described after the root's own children, as
      // top-level entries of their own. A target rendered inside the root is
      // never followed - it is already a descendant - so an overlay one target
      // renders in place and another moves to the body differs structurally.
      dom: [...root.children, ...followed].map((child) => describe(child, idMap)),
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
    // M35.0: a keydown's answer is read on window, in the bubble phase, after
    // every product handler has run, and frozen there; only then is the
    // browser default of an unconsumed navigation key swallowed - see
    // browserDefaultKeys. Read later, like the other events, it would see the
    // harness's own preventDefault and record [true] for a key the component
    // left alone.
    const keydowns = new WeakMap();
    const frozen = new WeakSet();
    for (const type of ['pointerdown', 'mousedown', 'mouseup', 'click', 'input', 'keydown']) {
      document.addEventListener(type, (event) => {
        if (!root.contains(event.target)) return;
        if (type === 'click' && event.target.closest(${JSON.stringify(activationSelector)})) {
          window.__parityActivations += 1;
        }
        const entry = { type, trusted: event.isTrusted, defaultPrevented: false };
        window.__parityInputEvents.push(entry);
        if (type === 'keydown') keydowns.set(event, entry);
        setTimeout(() => { if (!frozen.has(entry)) entry.defaultPrevented = event.defaultPrevented; }, 0);
      }, true);
    }
    window.addEventListener('keydown', (event) => {
      const entry = keydowns.get(event);
      if (entry) {
        entry.defaultPrevented = event.defaultPrevented;
        frozen.add(entry);
      }
      if (event.isTrusted && !event.defaultPrevented && ${JSON.stringify(browserDefaultKeys)}.includes(event.key)) {
        event.preventDefault();
      }
    });
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
  // M31: a scroll under a held pointer makes Chrome re-hit-test and move the
  // hover by itself, so a scenario must release a hover before it scrolls.
  let hovering = false;
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
      // `index` picks a member of a group or a nested pair, as it does for the
      // checkable controls; every earlier button case wanted the first match.
      // `through` (M28) searches inside the element a case element's declared
      // reference names - a menu teleported out of the case root.
      await pointerClick(page, selector, step.selector ?? '.vf-icon-button', step.index ?? 0, step.through);
    } else if (step.action === 'scrollWindow') {
      if (hovering) throw new Error('scrollWindow while a hover is held; unhover first');
      await page.evaluate(`window.scrollBy(0, ${Number(step.y)})`);
    } else if (step.action === 'hover' || step.action === 'unhover') {
      hovering = step.action === 'hover';
      const target = `${scopeExpression(selector, step.through)}.querySelectorAll(${JSON.stringify(step.selector)})[${step.index ?? 0}]`;
      await pointerRest(page, hovering ? target : null);
    } else if (step.action === 'wait') {
      await page.evaluate(`new Promise((done) => setTimeout(done, ${Number(step.ms)}))`);
    } else if (step.action === 'pressKey') {
      await pressKey(page, step.key);
    } else if (step.action === 'focusButton') {
      // `index` picks a member, as it does for clickButton since M22; a
      // stepper (M23) owns several buttons and its keyboard scenarios start
      // from a named one.
      await page.evaluate(`(() => {
        const button = ${scopeExpression(selector, step.through)}.querySelectorAll(${JSON.stringify(step.selector ?? '.vf-icon-button')})[${step.index ?? 0}];
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
/** The case root, or the element `through.attribute` of a case element names. */
const scopeExpression = (caseSelector, through) =>
  through
    ? `document.getElementById(document.querySelector(${JSON.stringify(caseSelector)}).querySelectorAll(${JSON.stringify(through.selector)})[${through.index ?? 0}].getAttribute(${JSON.stringify(through.attribute)}))`
    : `document.querySelector(${JSON.stringify(caseSelector)})`;

async function pointerClick(page, caseSelector, targetSelector, index = 0, through = undefined) {
  const point = await page.evaluate(`(() => {
    // index picks a member of a group; every other caller wants the first
    // match, which is what a plain querySelector already gave them.
    const action = ${scopeExpression(caseSelector, through)}
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
 * A real pointer resting on an element, or taken away again (M31).
 *
 * VfTooltip is the first component whose contract is a pointer that stays:
 * clickButton enters, presses, releases and parks at (900, 1) within a few
 * milliseconds, so it can never show what a held hover does. `hover` is one CDP
 * mouseMoved to the target's centre and nothing else - no button, no click -
 * and the pointer stays there; `unhover` (target null) is one mouseMoved to
 * clickButton's neutral point. Both fail closed rather than drive the wrong
 * element: Chrome's hit test at the point must find the target (an open
 * overlay can cover it) or, for the neutral point, the page itself; and
 * afterwards the element found then - not one looked up again, which a
 * tooltip closing under the pointer would have taken away - must match
 * :hover, or nothing inside body may.
 */
async function pointerRest(page, target) {
  const point = await page.evaluate(`(() => {
    const target = (window.__parityPointerTarget = ${target});
    target?.scrollIntoView({ block: 'center' });
    const rect = target?.getBoundingClientRect();
    if (${target !== null} && !(rect?.width && rect.height && getComputedStyle(target).visibility === 'visible')) throw new Error('hover target is missing or not visible');
    const point = target ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : { x: 900, y: 1 };
    const hit = document.elementFromPoint(point.x, point.y);
    if (target ? !target.contains(hit) : hit !== document.body && hit !== document.documentElement) throw new Error((target ? 'hover target is covered by ' : 'the neutral point is occupied by ') + hit?.outerHTML.slice(0, 80));
    return point;
  })()`);
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  const rests = target ? `window.__parityPointerTarget.matches(':hover')` : `!document.querySelector('body :hover')`;
  if (!(await page.evaluate(rests))) throw new Error(target ? 'hover target is not :hover' : 'unhover left a :hover');
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
  Escape: { code: 'Escape', virtualKeyCode: 27, text: undefined },
  // The navigation keys, added for VfStepper (M23): the first component
  // whose keyboard contract is movement between owned controls rather than
  // activation of one. None produces a character.
  Home: { code: 'Home', virtualKeyCode: 36, text: undefined },
  End: { code: 'End', virtualKeyCode: 35, text: undefined },
  ArrowLeft: { code: 'ArrowLeft', virtualKeyCode: 37, text: undefined },
  ArrowUp: { code: 'ArrowUp', virtualKeyCode: 38, text: undefined },
  ArrowRight: { code: 'ArrowRight', virtualKeyCode: 39, text: undefined },
  ArrowDown: { code: 'ArrowDown', virtualKeyCode: 40, text: undefined },
};

/**
 * The keys whose browser default driveInteraction swallows once the page has
 * answered them (M35.0) - the overlay fixtures' list since M28. Headless Chrome
 * hands an unconsumed one to the browser, which opened chrome://settings/help
 * as the active tab: the stepper's wrong-axis ArrowDown left the capture page
 * hidden, without a frame, for every later scenario. None produces a
 * character; Enter, Space and Tab keep their defaults, because native
 * activation and focus moves are behaviour the scenarios measure.
 */
export const browserDefaultKeys = [
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Escape',
];

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

  // No nativeVirtualKeyCode (M35.0c). It was the Windows code, which macOS
  // reads as another physical key - 39 is the quote key, 40 the K - and an
  // unconsumed one of those reached the browser as a shortcut that opened
  // chrome://settings/help. The page sees key, code and keyCode, all of which
  // come from the fields below.
  const base = {
    key,
    code: descriptor.code,
    windowsVirtualKeyCode: descriptor.virtualKeyCode,
  };
  // A key that produces a character is sent as one keyDown carrying it, which
  // Chrome expands into the keydown and the keypress itself. Until M24 it was
  // sent as rawKeyDown followed by a separate char event, and Chrome 153
  // routed that pair for an unhandled Enter or Space to the browser as an
  // accelerator: a chrome://settings/help page opened, became the active
  // target, and every later scenario on the page ran with
  // document.visibilityState === 'hidden' and no animation frame - found
  // when the tabs' readiness classes never appeared after the Enter case
  // (the stepper's Enter and Space scenarios had run that way in M23, with
  // nothing frame-dependent to notice). Any key the page leaves entirely to
  // the browser does the same; M35.0 found the stepper's wrong-axis ArrowDown
  // doing it, which is why driveInteraction swallows browserDefaultKeys after
  // recording the page's answer. The activation contract is unchanged: one
  // native click, keydown not prevented, as the Enter and Space scenarios of
  // every profile still claim.
  if (descriptor.text !== undefined) {
    await page.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      ...base,
      text: descriptor.text,
      unmodifiedText: descriptor.text,
    });
  } else {
    await page.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...base });
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
 * Marks the two elements a VfSkeletonGate transition must not destroy, and reads
 * the marks back.
 *
 * Component-specific, and named so since M17.1. It selects the gate's own
 * elements, exactly as skeletonGateInteractionExpression above it does, and the
 * generic name it shipped with in M17 hid that: the LOC accounting counted it
 * as reusable infrastructure, and a second component declaring a transition
 * would have inherited selectors that match nothing. transitionViolations now
 * refuses a run where the marks came back empty, so the next component gets a
 * failure instead of a dimension that measures zero.
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
export function skeletonGateIdentityExpression(caseId, phase) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');
    const content = root.querySelector('.vf-skeleton-gate__content');
    const overlay = root.querySelector('.vf-skeleton-gate__overlay');
    // firstChild rather than firstElementChild for the content, because a
    // consumer's content is often a bare text node and its identity is just as
    // load-bearing: a recreated text node means the wrapper was rebuilt and
    // whatever the consumer had inside it is gone. The overlay's child is
    // always an element - the skeleton, or whatever a skeleton slot rendered.
    const nodes = {
      contentChild: content ? content.firstChild : null,
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
 * Whether a target's actual transition capability matches what its profile declared.
 *
 * Extracted from the runner in M17.1. It was an inline `throw` in run.mjs,
 * which meant the guard M17 relied on to make `transitionTargets` mean
 * something could not be tested and never had been - see
 * transition-evidence.test.mjs. It is the same shape as
 * staticOwnershipViolations: a pure function the runner calls, so both
 * directions are assertable.
 *
 * Both directions matter, and the second is the one an inline check tends to
 * omit:
 *
 *   - a target the profile expects to drive a transition, reporting no
 *     support, has quietly lost its mechanism. Without this it would be
 *     excused as "that one does not transition" and take the stage down with
 *     it silently;
 *   - a target the profile does *not* expect to drive one, reporting support,
 *     has grown client behaviour the reference component never had. For the
 *     Razor adapter that would be an API appearing out of nowhere.
 *
 * A profile that declares no targets is read strictly - every target is
 * expected to transition - so a future profile that forgets the field gets a
 * loud failure rather than a silent exemption.
 *
 * Returns the problem as a string, or null when the capability is as declared.
 */
export function transitionCapabilityViolation(profile, label, supported, caseId) {
  const declared = (profile.transitionTargets ?? ['reference', 'current', 'razor']).includes(label);

  if (declared === (supported === true)) {
    return null;
  }

  return (
    `Transition capability on ${label} contradicts the ${profile.id} profile: ` +
    `the profile ${declared ? 'expects' : 'does not expect'} ${label} to drive ${caseId}, ` +
    `but it reported supported=${JSON.stringify(supported)}.`
  );
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

  // The identity measurement has to have measured something.
  //
  // Added in M17.1, after the audit reproduced the hole in a real browser: the
  // identity expression finds its nodes by selector, and the comparator only
  // reports a difference for a node that was marked *and* came back recreated.
  // Selectors matching nothing therefore produce an all-absent mark, an
  // all-absent read, no difference, and a clean pass - transition.identity
  // measuring zero while looking like live protection.
  //
  // Checked per role rather than "at least one was marked", so a component
  // whose overlay stopped being found cannot keep passing on the strength of
  // the half that still works. What each marked node *became* is not judged
  // here: a recreated node is a difference for the comparator, and throwing on
  // it would abort the mutation harness before it could report the recreation
  // it was built to find.
  const marks = result.identityBefore;
  const unmeasured =
    marks && typeof marks === 'object'
      ? Object.entries(marks)
          .filter(([, value]) => value !== 'marked')
          .map(([role]) => role)
      : null;

  if (unmeasured === null || Object.keys(marks).length === 0) {
    problems.push(
      `case ${parityCase.id} marked no node for the identity measurement, so transition.identity compared ` +
        'nothing. A dimension that can measure zero and pass is not protection.',
    );
  } else if (unmeasured.length > 0) {
    problems.push(
      `case ${parityCase.id} marked no node for [${unmeasured.join(', ')}], so transition.identity is blind ` +
        'to those roles while still reporting on the others.',
    );
  }

  return problems;
}

/**
 * The fields an ownership snapshot must carry.
 *
 * Exported for the same reason STATIC_SNAPSHOT_FIELDS is: the runner checks
 * for them rather than trusting that the expression ran, because a snapshot
 * that came back without them on every target compares equal to itself.
 */
export const OWNERSHIP_SNAPSHOT_FIELDS = [
  'ownershipPosture',
  'componentControls',
  'consumerControlCount',
  'focusableTotal',
  'interactiveRoleTotal',
];

/**
 * Whether an ownership snapshot matches what the case and the profile declare.
 *
 * The other direction from staticOwnershipViolations. M15 to M21 proved
 * "expected component-owned controls = 0" on eight components; M22 is the
 * first whose component renders a control of its own, and the measurement has
 * to say more than a count. What is asserted, against declarations no adapter
 * can see:
 *
 *   - the profile names the controls the component owns - a role, the
 *     selector that finds it and the tag it has to be. A profile that names
 *     none has nothing to measure and fails closed rather than passing
 *     vacuously;
 *   - the case declares how many such controls it renders, and the snapshot
 *     must contain exactly that many. Missing, extra and duplicated all
 *     differ from the number;
 *   - each one has the declared tag. A div with role=button is found by the
 *     selector and rejected by its tag: identity, not count;
 *   - the consumer controls - every focusable element that is not one of the
 *     component's - number what the case declares for the state it is in, or
 *     what the scenario declares for the state it ends in;
 *   - the totals add up. A node counted as the component's *and* the
 *     consumer's, or counted twice as the component's, breaks the equation
 *     against the plain focusable count of the case;
 *   - no explicit interactive role. The reference's trigger is a native
 *     button and its region is not interactive.
 *
 * The declarations cannot be forged by an adapter: the budget lives in the
 * shared catalog and the identity in the profile, and both adapters render
 * from the catalog without seeing either. A component that rendered its
 * trigger as a div, or grew a second one, on every target at once - the case
 * a three-way comparison is blind to - fails here.
 *
 * Returns the problems as strings so a test can drive it directly.
 */
/**
 * The checks that accumulate once the snapshot is well formed, as a table.
 *
 * M22.1: eight `if (...) violations.push(...)` branches differed only by a
 * predicate and a message, and their messages named the accordion's trigger
 * from inside a function that must know nothing about accordions. Each row
 * is one independent claim with its own diagnostic; a row that fires says
 * exactly which claim failed, so a mutation is still attributed to the reason
 * it was built to violate rather than to "ownership differed".
 */
const OWNERSHIP_CHECKS = [
  {
    problem: ({ controls, expected, id }) =>
      !Number.isInteger(expected)
        ? `case ${id} declares no componentInteractive budget. A profile that owns controls needs every case to say ` +
          'how many, or the measurement has nothing to be wrong against.'
        : controls.length !== expected
          ? `case ${id} measured ${controls.length} component-owned control(s) but the catalog declares ${expected}. ` +
            'Missing, duplicated and extra all fail here, on every target at once.'
          : null,
  },
  {
    problem: ({ controls, declared, id }) =>
      controls
        .map((control) => {
          const rule = declared[control.role];
          if (!rule) return `case ${id} measured a control with role [${control.role}] the profile does not declare`;
          if (control.tag !== rule.tag) {
            return (
              `case ${id}: the ${control.role} is a <${control.tag}>, not the declared <${rule.tag}>. ` +
              'Tag identity is part of the contract; an element with the right role attribute is not the control.'
            );
          }
          // M24: a rule may declare the explicit role its controls carry, and
          // then every one of them must carry exactly it - a missing or
          // substituted role fails here by identity. A rule that declares
          // none is unchanged: its controls are covered by the total below.
          if (rule.ariaRole !== undefined && control.ariaRole !== rule.ariaRole) {
            return `case ${id}: the ${control.role} carries role=${JSON.stringify(control.ariaRole ?? null)}, not the declared role=${JSON.stringify(rule.ariaRole)}`;
          }
          return null;
        })
        .filter(Boolean)
        .join('; ') || null,
  },
  {
    problem: ({ snapshot, consumerBudget, id }) =>
      snapshot.consumerControlCount !== consumerBudget
        ? `case ${id} measured ${snapshot.consumerControlCount} consumer control(s) but the catalog declares ` +
          `${consumerBudget}. A component control counted as the consumer's, or a consumer control the component ` +
          'grew, fails here.'
        : null,
  },
  {
    problem: ({ snapshot, controls, id }) =>
      snapshot.focusableTotal !== controls.length + snapshot.consumerControlCount
        ? `case ${id}: ${controls.length} component + ${snapshot.consumerControlCount} consumer controls do not add ` +
          `up to the ${snapshot.focusableTotal} focusable element(s) measured. A node was counted twice or classified as both.`
        : null,
  },
  {
    // The explicit-role total equals the number of owned controls whose rule
    // declares one - zero for every profile that declares none, which is the
    // pre-M24 rule unchanged. An undeclared role anywhere in the case, on an
    // owned control or a consumer's, still fails here.
    problem: ({ snapshot, controls, declared, id, consumerRoles }) =>
      snapshot.interactiveRoleTotal !==
      controls.filter((control) => declared[control.role]?.ariaRole !== undefined).length + consumerRoles
        ? `case ${id} measured ${snapshot.interactiveRoleTotal} element(s) carrying an explicit interactive role. ` +
          'A component whose controls are native elements needs none beyond the roles its profile declares.'
        : null,
  },
];

export function controlOwnershipViolations(
  parityCase,
  snapshot,
  profile,
  { componentInteractive, consumerInteractive, consumerInteractiveRoles } = {},
) {
  const declared = profile?.controlOwnership;
  const roles = declared && typeof declared === 'object' ? Object.entries(declared) : [];
  const id = parityCase.id;

  // Fail closed, in order: nothing to look for, an unusable declaration, no
  // snapshot, a snapshot without its fields, a snapshot of the wrong shape.
  if (roles.length === 0) {
    return [
      `the ${profile?.id ?? 'unknown'} profile declares no component-owned control, so the ownership stage has ` +
        'nothing to look for. An expression that can measure nothing and pass is not evidence.',
    ];
  }
  const unusable = roles.find(
    ([, rule]) => !rule?.selector || !rule?.tag || (rule.ariaRole !== undefined && !rule.ariaRole),
  );
  if (unusable) {
    return [
      `the ${profile.id} profile declares control [${unusable[0]}] without a selector and a tag, or with an empty ariaRole; identity needs all of them`,
    ];
  }
  if (!snapshot || typeof snapshot !== 'object') {
    return [`case ${id} produced no ownership snapshot at all`];
  }
  const missing = OWNERSHIP_SNAPSHOT_FIELDS.filter((field) => !(field in snapshot));
  if (missing.length > 0) {
    return [`case ${id} is missing [${missing.join(', ')}]. A stage that records nothing is a failure, not a pass.`];
  }
  if (snapshot.ownershipPosture !== 'component' || !Array.isArray(snapshot.componentControls)) {
    return [`case ${id} reports posture=${JSON.stringify(snapshot.ownershipPosture)} with no control list`];
  }

  const context = {
    id,
    snapshot,
    declared,
    controls: snapshot.componentControls,
    // M30: a scenario that opens or closes an owned panel declares the count
    // it ends with, as it already declared the consumer's. Only an absent
    // declaration falls back; null, a string or a fraction is not an integer
    // and fails the first check below, closed.
    expected: componentInteractive === undefined ? parityCase.componentInteractive : componentInteractive,
    consumerBudget: consumerInteractive ?? parityCase.consumerInteractive ?? 0,
    // M28: how many of the consumer's controls the case says carry an explicit
    // interactive role. Zero unless declared.
    consumerRoles: consumerInteractiveRoles ?? parityCase.consumerInteractiveRoles ?? 0,
  };

  return OWNERSHIP_CHECKS.map((check) => check.problem(context)).filter(Boolean);
}

/**
 * What a VfAccordion case reports, before and after an interaction.
 *
 * Component-specific and named so, like skeletonGateInteractionExpression. It
 * selects the accordion's own elements; what it records falls into four
 * groups, each compared as its own dimension so a defect is attributed to the
 * half it is in:
 *
 *   - ownership: every control the profile says the component owns, with its
 *     tag, type, place and state, and every focusable element that is not one
 *     of them. Measured by the profile's selector and classified by identity,
 *     not by containment, so a consumer control nested inside the trigger
 *     slot is still the consumer's;
 *   - state: aria-expanded of every trigger, whether the first trigger's panel
 *     is in the DOM and painted, the icon modifier, the panel text, and
 *     whether the transition has settled;
 *   - relationships: whether the first trigger's aria-controls resolves to a
 *     panel that points back at it, measured on the live DOM rather than read
 *     as attribute text;
 *   - the scenario's own record: activations, focus, and the neutral event log
 *     the fixture keeps.
 *
 * Asynchronous, because the reference's enter and leave hooks hold inline
 * declarations for the theme's normal duration and remove a leaving panel
 * only when that timer fires. A snapshot taken on the next frame would
 * measure a panel mid-flight on every target and compare equal to itself. So
 * the expression waits until no panel in the case carries an inline
 * transition, bounded, and records whether it got there: `settled` is a
 * field the catalog expects and the comparator compares.
 */
function accordionInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);

    const panels = () => [...root.querySelectorAll('.vf-accordion__content')];
    const unsettled = () => panels().some((panel) => panel.style.transition !== '');
    const deadline = performance.now() + 2500;
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 25));
    }
    const settled = !unsettled();

    const pathOf = (element) => {
      const segments = [];
      for (let node = element; node && node !== root; node = node.parentElement) {
        const classes = [...node.classList].filter((name) => name.startsWith('vf-')).sort();
        segments.unshift(node.tagName.toLowerCase() + (classes.length ? '.' + classes.join('.') : ''));
      }
      return segments.join('>');
    };

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        const controls = element.getAttribute('aria-controls');
        const target = controls ? document.getElementById(controls) : null;
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            path: pathOf(element),
            expanded: element.getAttribute('aria-expanded'),
            disabled: element.hasAttribute('disabled'),
            focusable: focusable.includes(element),
            controls: !controls
              ? 'none'
              : !target
                ? 'dangling'
                : root.contains(target) && target.getAttribute('aria-labelledby') === element.id
                  ? 'panel'
                  : 'other',
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const triggers = owned.filter((entry) => entry.record.role === 'trigger').map((entry) => entry.element);
    const first = triggers[0] ?? null;
    const firstControls = first?.getAttribute('aria-controls') ?? null;
    const panel = firstControls ? document.getElementById(firstControls) : null;
    const panelInCase = panel && root.contains(panel) ? panel : null;
    const rect = panelInCase?.getBoundingClientRect();
    const style = panelInCase ? getComputedStyle(panelInCase) : null;

    const activeElement = document.activeElement;
    const focusRole = first && activeElement === first
      ? 'trigger'
      : triggers.includes(activeElement)
        ? 'other-trigger'
        : panelInCase && panelInCase.contains(activeElement)
          ? 'panel'
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
      // Ownership. Declared posture beside the measurement, as the static
      // snapshot does; the list is what the count is derived from.
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      // State, on the live DOM.
      expanded: first?.getAttribute('aria-expanded') ?? null,
      expandedStates: triggers.map((trigger) => trigger.getAttribute('aria-expanded')),
      panelPresent: panelInCase !== null,
      panelCount: panels().length,
      panelVisible: panelInCase !== null && style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0,
      panelRole: panelInCase?.getAttribute('role') ?? null,
      iconOpen: first?.querySelector('.vf-accordion__icon')?.classList.contains('vf-accordion__icon--open') ?? null,
      panelText: panelInCase ? (panelInCase.textContent ?? '').replace(/\\s+/g, ' ').trim() : null,
      settled,
      // Relationships, resolved rather than read.
      controlsResolved: first === null ? null : !firstControls ? 'none' : !panel ? 'dangling' : panelInCase ? 'panel' : 'outside-case',
      panelLabelledBy: panelInCase === null
        ? null
        : panelInCase.getAttribute('aria-labelledby') === first.id ? 'trigger' : 'other',
      // The scenario's own record.
      activations: window.__parityActivations ?? 0,
      focusRole,
      events: window.__parityAccordionEvents?.[${JSON.stringify(caseId)}] ?? [],
    };
  })()`;
}

/**
 * What a VfGroupBox case reports, before and after an interaction.
 *
 * Component-specific and named so, like accordionInteractionExpression, and
 * deliberately a separate function rather than that one with its selectors
 * swapped: the group box's trigger lives in a legend and exists only when the
 * group is collapsible, its content is a direct child of the fieldset with no
 * inner wrapper, a static group owns no control at all, and there is no
 * transition to wait for. The field names are the accordion's where the
 * meaning is the same - so the comparator's existing rules apply - and the
 * record falls into the same four groups:
 *
 *   - ownership: every trigger the profile's rule finds, with its tag, type,
 *     place and state, and every focusable element that is not one of them;
 *   - state: aria-expanded of every trigger, whether the first group's content
 *     is in the DOM and painted, its role and text, how many content elements
 *     the case holds, and the first root's class list;
 *   - relationships: whether the first trigger's aria-controls resolves to
 *     content that points back at it, on the live DOM;
 *   - the scenario's own record: native activations, whether each keydown was
 *     prevented, focus, and the neutral collapsed-change log.
 *
 * Synchronous: the reference removes and renders its content in the same tick,
 * and a snapshot that waited would hide a port that did not.
 */
function groupBoxInteractionExpression(caseId, controlOwnership = {}) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);

    const pathOf = (element) => {
      const segments = [];
      for (let node = element; node && node !== root; node = node.parentElement) {
        const classes = [...node.classList].filter((name) => name.startsWith('vf-')).sort();
        segments.unshift(node.tagName.toLowerCase() + (classes.length ? '.' + classes.join('.') : ''));
      }
      return segments.join('>');
    };

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        const controls = element.getAttribute('aria-controls');
        const target = controls ? document.getElementById(controls) : null;
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            path: pathOf(element),
            expanded: element.getAttribute('aria-expanded'),
            disabled: element.hasAttribute('disabled'),
            focusable: focusable.includes(element),
            controls: !controls
              ? 'none'
              : !target
                ? 'dangling'
                : root.contains(target) && target.getAttribute('aria-labelledby') === element.id
                  ? 'panel'
                  : 'other',
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const triggers = owned.filter((entry) => entry.record.role === 'trigger').map((entry) => entry.element);
    const first = triggers[0] ?? null;
    const firstRoot = root.querySelector('.vf-group-box');
    const firstControls = first?.getAttribute('aria-controls') ?? null;
    const controlled = firstControls ? document.getElementById(firstControls) : null;
    // With a trigger, the content is whatever it controls; without one - a
    // static group - it is the first root's own content element.
    const content = first
      ? (controlled && root.contains(controlled) ? controlled : null)
      : firstRoot?.querySelector(':scope > .vf-group-box__content') ?? null;
    const rect = content?.getBoundingClientRect();
    const style = content ? getComputedStyle(content) : null;

    const activeElement = document.activeElement;
    const focusRole = first && activeElement === first
      ? 'trigger'
      : triggers.includes(activeElement)
        ? 'other-trigger'
        : content && content.contains(activeElement)
          ? 'panel'
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
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      expanded: first?.getAttribute('aria-expanded') ?? null,
      expandedStates: triggers.map((trigger) => trigger.getAttribute('aria-expanded')),
      panelPresent: content !== null,
      panelCount: root.querySelectorAll('.vf-group-box__content').length,
      panelVisible: content !== null && style.display !== 'none' && style.visibility !== 'hidden' && rect.height > 0,
      panelRole: content?.getAttribute('role') ?? null,
      panelText: content ? (content.textContent ?? '').replace(/\\s+/g, ' ').trim() : null,
      rootClasses: firstRoot ? [...firstRoot.classList] : [],
      controlsResolved: first === null ? null : !firstControls ? 'none' : !controlled ? 'dangling' : content ? 'panel' : 'outside-case',
      panelLabelledBy: !first || content === null
        ? null
        : content.getAttribute('aria-labelledby') === first.id ? 'trigger' : 'other',
      activations: window.__parityActivations ?? 0,
      keydownPrevented: (window.__parityInputEvents ?? []).filter((entry) => entry.type === 'keydown').map((entry) => entry.defaultPrevented),
      focusRole,
      events: window.__parityGroupBoxEvents?.[${JSON.stringify(caseId)}] ?? [],
    };
  })()`;
}

/**
 * What a VfStepper case reports, before and after an interaction.
 *
 * Component-specific and named so, like accordionInteractionExpression. It
 * selects the stepper's own elements; what it records falls into three
 * groups, each compared as its own dimension so a defect is attributed to the
 * half it is in:
 *
 *   - ownership: every control the profile says the component owns - here
 *     several of one role - with its tag, type, value, place and state, and
 *     every focusable element that is not one of them. A consumer button
 *     beside the stepper is classified by identity, not containment;
 *   - state, on the live DOM and in four separately recorded halves: which
 *     trigger carries aria-current, which carries the trigger's own current
 *     modifier, every item's state modifier, and the root's inline progress
 *     factor - beside the disabled triggers, the item and trigger counts,
 *     and (for a group) the current value of every instance. A port that
 *     moves one half and not another differs on the half that is wrong;
 *   - the scenario's own record: activations, which trigger has focus, whether
 *     each keydown was prevented, and the neutral change log the fixture
 *     keeps.
 *
 * Synchronous: the stepper has no transition to wait out. Every item stays in
 * the DOM across a selection change, which is what lets convergence compare
 * the whole post-gesture DOM against a fresh render of the target case.
 */
function stepperInteractionExpression(caseId, controlOwnership = {}) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);

    const pathOf = (element) => {
      const segments = [];
      for (let node = element; node && node !== root; node = node.parentElement) {
        const classes = [...node.classList].filter((name) => name.startsWith('vf-')).sort();
        segments.unshift(node.tagName.toLowerCase() + (classes.length ? '.' + classes.join('.') : ''));
      }
      return segments.join('>');
    };

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            path: pathOf(element),
            value: element.getAttribute('data-vf-stepper-value'),
            current: element.getAttribute('aria-current'),
            currentClass: element.classList.contains('vf-stepper__trigger--current'),
            disabled: element.hasAttribute('disabled'),
            focusable: focusable.includes(element),
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const roots = [...root.querySelectorAll('.vf-stepper')];
    const first = roots[0] ?? null;
    const triggersOf = (stepper) => [...stepper.querySelectorAll('.vf-stepper__trigger')];
    const currentOf = (stepper) =>
      triggersOf(stepper).find((trigger) => trigger.getAttribute('aria-current') === 'step')?.getAttribute('data-vf-stepper-value') ?? null;
    const stateOf = (item) =>
      [...item.classList].find((name) => name.startsWith('vf-stepper__item--'))?.slice('vf-stepper__item--'.length) ?? null;

    const activeElement = document.activeElement;
    const focusedTrigger = triggersOf(root).find((trigger) => trigger === activeElement) ?? null;
    const focusRole = focusedTrigger
      ? 'trigger'
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
      // Ownership. Declared posture beside the measurement, as the static
      // snapshot does; the list is what the count is derived from.
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      // State, on the live DOM, one half per field.
      currentValue: first ? currentOf(first) : null,
      currentValues: roots.map(currentOf),
      currentClassValue: first
        ? (triggersOf(first).find((trigger) => trigger.classList.contains('vf-stepper__trigger--current'))?.getAttribute('data-vf-stepper-value') ?? null)
        : null,
      itemStates: first ? [...first.querySelectorAll('.vf-stepper__item')].map(stateOf) : [],
      itemCount: first ? first.querySelectorAll('.vf-stepper__item').length : 0,
      triggerCount: first ? triggersOf(first).length : 0,
      progressFactor: first ? (first.style.getPropertyValue('--vf-stepper-progress-factor').trim() || null) : null,
      itemCountVariable: first ? (first.style.getPropertyValue('--vf-stepper-item-count').trim() || null) : null,
      disabledValues: first
        ? triggersOf(first).filter((trigger) => trigger.hasAttribute('disabled')).map((trigger) => trigger.getAttribute('data-vf-stepper-value'))
        : [],
      // The scenario's own record.
      activations: window.__parityActivations ?? 0,
      focusRole,
      focusValue: focusedTrigger?.getAttribute('data-vf-stepper-value') ?? null,
      keydownPrevented: (window.__parityInputEvents ?? []).filter((entry) => entry.type === 'keydown').map((entry) => entry.defaultPrevented),
      events: window.__parityStepperEvents?.[${JSON.stringify(caseId)}] ?? [],
    };
  })()`;
}

/**
 * What a VfTabs case reports, before and after an interaction.
 *
 * Component-specific and named so, like stepperInteractionExpression. It
 * selects the tabs' own elements; what it records falls into five groups,
 * each compared as its own dimension so a defect is attributed to the half
 * it is in:
 *
 *   - ownership: every control the profile says the component owns - the
 *     tabs with their explicit role, both scroll buttons, the panel - with
 *     tag, type, role, place and state, and every focusable element that is
 *     not one of them;
 *   - selection: the selected value(s) - read as the value part of the
 *     selected tab's generated id, `…-tab-<value>` - aria-selected and
 *     tabindex per tab, the disabled tabs, the panel's presence, text and
 *     tabindex, resolved on the live DOM;
 *   - indicator: the three inline declarations as the CSSOM holds them,
 *     unrounded, and the ready / no-transition classes;
 *   - scroller: scrollLeft, the can-scroll state, both buttons' four hidden
 *     halves, the fades, the scrolling state, the readiness classes;
 *   - the scenario's own record: activations, focus by role, value and
 *     instance, prevented keys, and the neutral event log the fixture keeps.
 *
 * Asynchronous, and bounded: the scroller marks 140 ms of scrolling on the
 * viewport's scrollbar-width variable and the indicator's no-transition
 * class, and a scroll-button scenario measured on the next frame would catch
 * that state mid-flight on every target and compare equal to itself. So the
 * expression waits until no instance in the case is scrolling - at most a
 * second, polled - and records whether it got there: `settled` is a field
 * the catalog claims and the comparator compares, and a wait that ran out
 * is a recorded false, never a silent pass.
 */
function tabsInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);

    const isScrolling = () =>
      [...root.querySelectorAll('.vf-tabs__list-scroller')].some((viewport) =>
        viewport.style.getPropertyValue('--vf-horizontal-scroller-scrollbar-width').trim() === 'thin') ||
      root.querySelector('.vf-tabs__indicator--no-transition') !== null;
    const settled = await new Promise((resolve) => {
      const started = performance.now();
      const check = () => {
        if (!isScrolling()) return resolve(true);
        if (performance.now() - started > 1000) return resolve(false);
        setTimeout(check, 20);
      };
      check();
    });

    const pathOf = (element) => {
      const segments = [];
      for (let node = element; node && node !== root; node = node.parentElement) {
        const classes = [...node.classList].filter((name) => name.startsWith('vf-')).sort();
        segments.unshift(node.tagName.toLowerCase() + (classes.length ? '.' + classes.join('.') : ''));
      }
      return segments.join('>');
    };
    const valueOf = (tab) => tab.id.replace(/^.*-tab-/, '');
    // A consumer's own tabId / panelId is a literal the id graph cannot see:
    // the extractor rewrites every id to its document position, so a target
    // that ignored the override and generated its own id would form the same
    // graph. The literal is recorded here as itself, a generated id as the
    // word 'generated' - the two adapters' generated ids differ by design.
    const idLiteral = (id) => (/^vf-tabs-[a-z]+-\\d+-(tab|panel)-/.test(id) ? 'generated' : id);

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            ariaRole: element.getAttribute('role'),
            path: pathOf(element),
            selected: element.getAttribute('aria-selected'),
            tabindex: element.getAttribute('tabindex'),
            hidden: element.classList.contains('vf-tabs__scroll-button--hidden'),
            ariaHidden: element.getAttribute('aria-hidden'),
            disabled: element.hasAttribute('disabled'),
            focusable: focusable.includes(element),
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const roots = [...root.querySelectorAll('.vf-tabs')];
    const first = roots[0] ?? null;
    const tabsOf = (tabs) => [...tabs.querySelectorAll('[role="tablist"] > .vf-tabs__tab')];
    const selectedOf = (tabs) => tabsOf(tabs).filter((tab) => tab.getAttribute('aria-selected') === 'true');
    const panelOf = (tabs) => tabs.querySelector(':scope > .vf-tabs__panel');
    const listOf = (tabs) => tabs.querySelector(':scope > .vf-tabs__list');
    const viewportOf = (tabs) => tabs.querySelector('.vf-tabs__list-scroller');
    const buttonOf = (tabs, side) => tabs.querySelector('.vf-tabs__scroll-button--' + side);
    const indicatorOf = (tabs) => tabs.querySelector('.vf-tabs__indicator');
    const resolvedControls = (tabs) =>
      tabsOf(tabs).map((tab) => {
        const controls = tab.getAttribute('aria-controls');
        if (controls === null) return null;
        const target = document.getElementById(controls);
        if (!target) return 'dangling';
        return target === panelOf(tabs) ? 'panel' : 'foreign';
      });

    const activeElement = document.activeElement;
    const focusedTab = roots.flatMap(tabsOf).find((tab) => tab === activeElement) ?? null;
    const focusedInstance = roots.findIndex((tabs) => tabs.contains(activeElement));
    const focusRole = focusedTab
      ? 'tab'
      : activeElement?.classList?.contains('vf-tabs__panel') && root.contains(activeElement)
        ? 'panel'
        : activeElement?.classList?.contains('vf-tabs__scroll-button--left') && root.contains(activeElement)
          ? 'scroll-left'
          : activeElement?.classList?.contains('vf-tabs__scroll-button--right') && root.contains(activeElement)
            ? 'scroll-right'
            : activeElement === document.body
              ? 'body'
              : root.contains(activeElement) ? 'other-inside-case' : 'outside-case';

    const caseRect = root.getBoundingClientRect();
    const indicator = first ? indicatorOf(first) : null;
    const viewport = first ? viewportOf(first) : null;
    const left = first ? buttonOf(first, 'left') : null;
    const right = first ? buttonOf(first, 'right') : null;
    const panel = first ? panelOf(first) : null;
    const firstSelected = first ? (selectedOf(first)[0] ?? null) : null;

    return {
      clip: {
        x: Math.round(caseRect.left + window.scrollX),
        y: Math.round(caseRect.top + window.scrollY),
        width: Math.round(caseRect.width),
        height: Math.round(caseRect.height),
      },
      // Ownership. Declared posture beside the measurement, as the static
      // snapshot does; the list is what the count is derived from.
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      // Selection, on the live DOM, one half per field.
      selectedValue: firstSelected ? valueOf(firstSelected) : null,
      selectedValues: roots.map((tabs) => (selectedOf(tabs)[0] ? valueOf(selectedOf(tabs)[0]) : null)),
      selectedCount: first ? selectedOf(first).length : 0,
      ariaSelected: first ? tabsOf(first).map((tab) => tab.getAttribute('aria-selected')) : [],
      tabindexes: first ? tabsOf(first).map((tab) => tab.getAttribute('tabindex')) : [],
      disabledValues: first ? tabsOf(first).filter((tab) => tab.hasAttribute('disabled')).map(valueOf) : [],
      tabCount: first ? tabsOf(first).length : 0,
      panelPresent: panel !== null,
      panelCount: root.querySelectorAll('.vf-tabs__panel').length,
      panelRole: panel?.getAttribute('role') ?? null,
      panelTabindex: panel?.getAttribute('tabindex') ?? null,
      panelText: panel ? (panel.textContent ?? '').replace(/\\s+/g, ' ').trim() : null,
      panelLabelledByActive: panel
        ? document.getElementById(panel.getAttribute('aria-labelledby') ?? '') === firstSelected && firstSelected !== null
        : null,
      controlsResolvedPerTab: first ? resolvedControls(first) : [],
      tabIdLiterals: first ? tabsOf(first).map((tab) => idLiteral(tab.id)) : [],
      panelIdLiteral: panel ? idLiteral(panel.id) : null,
      // The indicator, as the CSSOM holds the inline declarations.
      indicatorOpacity: indicator?.style.opacity ?? null,
      indicatorTransform: indicator?.style.transform ?? null,
      indicatorWidth: indicator?.style.width ?? null,
      indicatorReady: indicator?.classList.contains('vf-tabs__indicator--ready') ?? null,
      scrolling: indicator?.classList.contains('vf-tabs__indicator--no-transition') ?? null,
      // The scroller.
      scrollLeft: viewport?.scrollLeft ?? null,
      scrollbarWidth: viewport?.style.getPropertyValue('--vf-horizontal-scroller-scrollbar-width').trim() ?? null,
      canScrollLeft: first ? listOf(first).classList.contains('vf-tabs__list--can-scroll-left') : null,
      canScrollRight: first ? listOf(first).classList.contains('vf-tabs__list--can-scroll-right') : null,
      leftHidden: left?.classList.contains('vf-tabs__scroll-button--hidden') ?? null,
      rightHidden: right?.classList.contains('vf-tabs__scroll-button--hidden') ?? null,
      leftAriaHidden: left?.getAttribute('aria-hidden') ?? null,
      rightAriaHidden: right?.getAttribute('aria-hidden') ?? null,
      leftTabindex: left?.getAttribute('tabindex') ?? null,
      rightTabindex: right?.getAttribute('tabindex') ?? null,
      leftDisabled: left?.disabled ?? null,
      rightDisabled: right?.disabled ?? null,
      fades: first ? [...listOf(first).querySelectorAll(':scope > .vf-horizontal-scroller__fade')].map((fade) =>
        fade.classList.contains('vf-horizontal-scroller__fade--left') ? 'left' : 'right') : [],
      controlsReady: first?.classList.contains('vf-tabs--scroll-controls-ready') ?? null,
      controlsAnimated: first?.classList.contains('vf-tabs--scroll-controls-animated') ?? null,
      settled,
      // The scenario's own record.
      activations: window.__parityActivations ?? 0,
      focusRole,
      focusValue: focusedTab ? valueOf(focusedTab) : null,
      focusInstance: focusedInstance,
      keydownPrevented: (window.__parityInputEvents ?? []).filter((entry) => entry.type === 'keydown').map((entry) => entry.defaultPrevented),
      events: window.__parityTabsEvents?.[${JSON.stringify(caseId)}] ?? [],
    };
  })()`;
}

/**
 * What a VfLink case reports.
 *
 * Component-specific and named so, like the accordion's. The first ownership
 * snapshot for a component that owns an anchor rather than a button, and the
 * first taken with nothing driven: a link handles no click and no key, so
 * there is no post-scenario state and this is measured once per case. Two
 * groups, each compared as its own dimension:
 *
 *   - ownership: every control the profile says the component owns - found
 *     by the profile's selector, which carries `[href]` because an anchor
 *     without a destination is not a control - with its tag, its three native
 *     link attributes, its classes and whether it is focusable; and every
 *     focusable element that is not one of them, which is the consumer's;
 *   - the anchor's own record: the tag, href, target, rel, classes and
 *     focusability of the `.vf-link` element whether or not it has an href.
 *     The no-destination case has an anchor and owns no control, and this is
 *     where that anchor is still described - so a target that gave it a
 *     placeholder href, or rendered it as a span, differs here as well as in
 *     the DOM.
 *
 * Deliberately not a second DOM extractor: the slot content inside the anchor
 * is compared by the ordinary DOM comparison and is not repeated here.
 */
function linkInteractionExpression(caseId, controlOwnership = {}) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            href: element.getAttribute('href'),
            target: element.getAttribute('target'),
            rel: element.getAttribute('rel'),
            classes: vfClasses(element),
            focusable: focusable.includes(element),
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const anchor = root.querySelector('.vf-link');
    const activeElement = document.activeElement;
    const focusRole = anchor && activeElement === anchor
      ? 'anchor'
      : activeElement === document.body
        ? 'body'
        : root.contains(activeElement) ? 'inside-case' : 'outside-case';

    return {
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''),
      ).length,
      anchorTag: anchor ? anchor.tagName.toLowerCase() : null,
      anchorHref: anchor?.getAttribute('href') ?? null,
      anchorTarget: anchor?.getAttribute('target') ?? null,
      anchorRel: anchor?.getAttribute('rel') ?? null,
      anchorClasses: anchor ? vfClasses(anchor) : null,
      anchorFocusable: anchor ? focusable.includes(anchor) : null,
      focusRole,
    };
  })()`;
}

/**
 * What a VfMenuItem case reports.
 *
 * Component-specific and named so, like the link's. Taken once per case with
 * nothing driven: the component handles no key, and the click it does handle
 * changes no DOM and no state - it emits a Vue event, which has no counterpart
 * on a server and nothing to compare. Two groups, each compared as its own
 * dimension:
 *
 *   - ownership: every control the profile's two rules find, with its tag, its
 *     explicit role, the attributes that tell the branches apart and whether it
 *     is focusable; and every focusable element that is not one of them, which
 *     is the consumer's;
 *   - the item's own record: the tag, branch-identifying attributes, classes
 *     and focusability of the `.vf-menu__item` element, plus whether a glyph is
 *     present and which classes it carries. Recorded separately from the
 *     ownership group because the ownership rules find a control only when it
 *     matches a rule, and an item that stopped matching either - a div, a span,
 *     a control that lost its type and its href at once - is still described
 *     here rather than vanishing from the evidence.
 *
 * Deliberately not a second DOM extractor. The glyph's geometry is *not*
 * repeated here: it is `path[d]`, it is compared by the ordinary DOM
 * comparison because the profile lists the attribute, and recording it twice
 * would mean two places to keep honest.
 */
function menuItemInteractionExpression(caseId, controlOwnership = {}) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            type: element.getAttribute('type'),
            href: element.getAttribute('href'),
            target: element.getAttribute('target'),
            rel: element.getAttribute('rel'),
            disabled: element.hasAttribute('disabled'),
            ariaDisabled: element.getAttribute('aria-disabled'),
            tabindex: element.getAttribute('tabindex'),
            classes: vfClasses(element),
            focusable: focusable.includes(element),
            name: (element.textContent ?? '').replace(/\\s+/g, ' ').trim(),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const item = root.querySelector('.vf-menu__item');
    const glyph = root.querySelector('.vf-menu__item-icon');
    const wrapper = root.querySelector('.vf-icon-wrapper');
    const activeElement = document.activeElement;
    const focusRole = item && activeElement === item
      ? 'item'
      : activeElement === document.body
        ? 'body'
        : root.contains(activeElement) ? 'inside-case' : 'outside-case';

    return {
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''),
      ).length,
      itemTag: item ? item.tagName.toLowerCase() : null,
      itemType: item?.getAttribute('type') ?? null,
      itemHref: item?.getAttribute('href') ?? null,
      itemTarget: item?.getAttribute('target') ?? null,
      itemRel: item?.getAttribute('rel') ?? null,
      itemDisabled: item ? item.hasAttribute('disabled') : null,
      itemAriaDisabled: item?.getAttribute('aria-disabled') ?? null,
      itemTabindex: item?.getAttribute('tabindex') ?? null,
      itemClasses: item ? vfClasses(item) : null,
      itemFocusable: item ? focusable.includes(item) : null,
      // Where the glyph's class actually landed. The wrapper span is the flex
      // child of the item and must stay untouched; the icon class belongs on
      // the svg inside it, which is where the Vue icon component spreads its
      // attrs.
      glyphPresent: glyph !== null,
      glyphTag: glyph ? glyph.tagName.toLowerCase() : null,
      glyphClasses: glyph ? vfClasses(glyph) : null,
      glyphAriaHidden: glyph?.getAttribute('aria-hidden') ?? null,
      wrapperClasses: wrapper ? vfClasses(wrapper) : null,
      focusRole,
    };
  })()`;
}

/**
 * What a VfDropdown case reports, before and after an interaction.
 *
 * Component-specific and named so, like the others. The first snapshot for a
 * component whose product DOM is partly outside its case: every dropdown's
 * menu is found through its trigger's aria-controls - the same declared edge
 * the extractor follows - and measured wherever it is, in <body>, in place or
 * in another element. What it records falls into five groups:
 *
 *   - ownership: the trigger wrappers the profile says the component owns,
 *     with their identity and state, and every focusable element in the case
 *     *and in its menus* that is not one of them - the consumer's controls,
 *     menu items included. `interactiveRoleTotal` counts explicit interactive
 *     roles in the same scope, so the menu items a consumer marks role=menuitem
 *     are counted against the case's declared consumer roles;
 *   - state, per instance and in halves a port can move separately:
 *     aria-expanded, whether a menu exists, where it is, its classes, its
 *     arrow's classes, its item labels, and the geometry of the menu relative
 *     to its trigger - the semantic form of the inline position the DOM
 *     comparison compares exactly;
 *   - relationships, resolved on the live DOM: whether each trigger's
 *     aria-controls reaches a menu labelled by that same trigger;
 *   - transitions: the snapshot waits, bounded, until no menu of the case
 *     carries a vf-floating-transition class, and records whether it got there
 *     (`settled`) and every enter and leave the fixture's observer saw complete
 *     since the first user input, each with its duration bucketed from the
 *     menu's own class changes;
 *   - the scenario's own record: focus, the neutral open-change log and the
 *     per-key record of what was prevented, both kept by the fixture.
 */
function dropdownInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const nameOf = (element) => (element.textContent ?? '').replace(/\\s+/g, ' ').trim();

    const dropdowns = [...root.querySelectorAll('.vf-dropdown')];
    const triggerOf = (dropdown) => dropdown.querySelector(':scope > .vf-dropdown__trigger');
    const menuOf = (dropdown) => {
      const id = triggerOf(dropdown)?.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    };
    const transitionOf = (menu) => [...menu.classList].filter((name) => name.startsWith('vf-floating-transition-')).join(' ');

    const deadline = performance.now() + 2000;
    const unsettled = () => dropdowns.some((dropdown) => { const menu = menuOf(dropdown); return menu !== null && transitionOf(menu) !== ''; });
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    const settled = !unsettled();

    const menus = dropdowns.map(menuOf);
    const scope = [root, ...menus.filter((menu) => menu !== null && !root.contains(menu))];
    const inScope = (selector) => scope.flatMap((node) => [...node.querySelectorAll(selector)]);
    const focusable = inScope(FOCUSABLE);
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            expanded: element.getAttribute('aria-expanded'),
            hasPopup: element.getAttribute('aria-haspopup'),
            ariaDisabled: element.getAttribute('aria-disabled'),
            tabindex: element.getAttribute('tabindex'),
            focusable: focusable.includes(element),
            name: nameOf(element),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const round = (value) => Math.round(value * 1000) / 1000;
    const location = (dropdown, menu) =>
      menu.parentElement === document.body ? 'body' : dropdown.contains(menu) ? 'in-place' : root.contains(menu) ? 'in-case' : 'elsewhere';
    const menuStates = dropdowns.map((dropdown, index) => {
      const menu = menus[index];
      if (!menu) return null;
      const arrow = menu.firstElementChild;
      return {
        location: location(dropdown, menu),
        classes: vfClasses(menu),
        role: menu.getAttribute('role'),
        arrowClasses: arrow && arrow.classList.contains('vf-dropdown__arrow') ? vfClasses(arrow) : null,
        items: [...menu.querySelectorAll('[role="menuitem"]')].map(nameOf),
      };
    });
    const geometry = () => dropdowns.map((dropdown, index) => {
      const menu = menus[index];
      if (!menu) return null;
      const trigger = triggerOf(dropdown).getBoundingClientRect();
      const box = menu.getBoundingClientRect();
      return {
        side: box.top >= trigger.bottom ? 'below' : box.bottom <= trigger.top ? 'above' : 'overlapping',
        left: round(box.left - trigger.left),
        right: round(box.right - trigger.right),
        gap: round(box.top >= trigger.bottom ? box.top - trigger.bottom : trigger.top - box.bottom),
      };
    });
    // The position floater.js computed when the menu entered - while the
    // enter-from frame's scale still applied - and then the position after
    // one resize, which autoUpdate answers on the next frame with the settled
    // box. The pair is the resize wiring measured, and doing it here makes
    // every later capture of this page - the DOM, the screenshot, whose
    // beyond-viewport resize would otherwise race the same update - see a
    // position that no longer moves.
    const menuGeometry = geometry();
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)));
      setTimeout(done, 500);
    });
    const menuGeometryAfterResize = geometry();
    // Then one full repaint, so the moved menus are rasterised afresh. Without
    // it the rounded corners of a composited menu keep whichever raster its
    // layer happened to get - two variants, one in about eight runs,
    // reproduced between reference and current. <body> is no case's DOM, and
    // its inline style is restored before anything is captured.
    const bodyStyle = document.body.getAttribute('style');
    document.body.style.opacity = '0.999';
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const relationships = dropdowns.map((dropdown, index) => {
      const trigger = triggerOf(dropdown);
      const controls = trigger.getAttribute('aria-controls');
      const menu = menus[index];
      return {
        controls: !controls ? 'none' : !menu ? 'dangling' : menu.getAttribute('role') === 'menu' ? 'menu' : 'other',
        labelledBy: !menu ? null : menu.getAttribute('aria-labelledby') === trigger.id ? 'own-trigger' : 'other',
      };
    });

    const active = document.activeElement;
    const owner = dropdowns.findIndex((dropdown, index) => dropdown.contains(active) || (menus[index] !== null && menus[index].contains(active)));
    const focusRole = active === document.body
      ? 'body'
      : owner < 0
        ? root.contains(active) ? 'other-inside-case' : 'outside-case'
        : active === triggerOf(dropdowns[owner])
          ? 'trigger'
          : triggerOf(dropdowns[owner]).contains(active)
            ? 'trigger-control'
            : active.getAttribute('role') === 'menuitem' ? 'item' : 'menu-control';

    const bucket = (ms) => ms < 300 ? 'short' : ms < 480 ? 'normal' : 'long';
    const transitions = menus.map((menu, index) => {
      const id = triggerOf(dropdowns[index]).getAttribute('aria-controls');
      return (window.__parityDropdownTransitions?.[id] ?? []).map((entry) => entry.kind + ':' + (entry.ms === null ? 'unfinished' : bucket(entry.ms)));
    });

    const caseRect = root.getBoundingClientRect();
    const boxes = [caseRect, ...menus.filter(Boolean).map((menu) => menu.getBoundingClientRect())];
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));

    return {
      // The screenshot covers the case and every menu it owns, wherever it is.
      clip: {
        x: Math.round(left + window.scrollX),
        y: Math.round(top + window.scrollY),
        width: Math.round(Math.max(...boxes.map((box) => box.right)) - left),
        height: Math.round(Math.max(...boxes.map((box) => box.bottom)) - top),
      },
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: inScope('*').filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      instanceCount: dropdowns.length,
      expandedStates: dropdowns.map((dropdown) => triggerOf(dropdown).getAttribute('aria-expanded')),
      menuStates,
      menuGeometry,
      menuGeometryAfterResize,
      menuRelationships: relationships,
      settled,
      transitions,
      focusRole,
      focusInstance: owner < 0 ? null : owner,
      focusItem: focusRole === 'item' ? nameOf(active) : null,
      events: window.__parityDropdownEvents?.[${JSON.stringify(caseId)}] ?? [],
      keydownPrevented: (window.__parityDropdownKeys ?? []).map((entry) => entry.key + ':' + entry.prevented),
    };
  })()`;
}

/**
 * What a VfPopover case reports, before and after an interaction.
 *
 * Component-specific and named so, like the dropdown's, whose shape it keeps:
 * the owned controls - here the trigger wrapper and, while open, the panel,
 * which takes focus - and every other focusable element, the consumer's; per
 * instance, aria-expanded, the panel's place, tag, classes, role, tabindex and
 * arrow, its geometry relative to its trigger before and after one resize,
 * and the live relationship both ways; the transitions the fixture saw
 * complete; focus, the event log and the keydown log.
 *
 * Two records the dropdown has no need for, because a popover is the first
 * overlay that holds another:
 *
 *   - nestedMenus: every VfDropdown in the case or in one of its open panels,
 *     with aria-expanded and where its menu is - so the escape stack the two
 *     components share is measured on the dropdown as well as the popover;
 *   - bodyOverlays: every panel or menu that is a direct child of <body>,
 *     named by what still owns it - a live popover trigger of the case
 *     ('panel'), a live dropdown trigger ('menu') - or 'orphan' when no live
 *     trigger names it. A nested dropdown the popover's close did not unmount
 *     leaves exactly that behind.
 */
function popoverInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const nameOf = (element) => (element.textContent ?? '').replace(/\\s+/g, ' ').trim();
    const referenced = (element) => {
      const id = element?.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    };
    const isOverlay = (node) => node.matches('.vf-popover__content, .vf-dropdown__menu');
    const transitioning = (node) => [...node.classList].some((name) => name.startsWith('vf-floating-transition-'));

    const popovers = [...root.querySelectorAll('.vf-popover')];
    const triggerOf = (popover) => popover.querySelector(':scope > .vf-popover__trigger');

    const deadline = performance.now() + 2000;
    const unsettled = () => [...document.querySelectorAll('.vf-popover__content, .vf-dropdown__menu')].some(transitioning);
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    const settled = !unsettled();

    const panels = popovers.map((popover) => referenced(triggerOf(popover)));
    const outside = panels.filter((panel) => panel !== null && !root.contains(panel));
    const inCase = (node) => root.contains(node) || outside.some((panel) => panel.contains(node));
    const dropdowns = [...root.querySelectorAll('.vf-dropdown'), ...outside.flatMap((panel) => [...panel.querySelectorAll('.vf-dropdown')])];
    const dropdownTriggerOf = (dropdown) => dropdown.querySelector(':scope > .vf-dropdown__trigger');
    const menus = dropdowns.map((dropdown) => referenced(dropdownTriggerOf(dropdown)));
    const scope = [root, ...outside, ...menus.filter((menu) => menu !== null && !inCase(menu))];
    const inScope = (selector) => scope.flatMap((node) => [...node.querySelectorAll(selector)]);
    const focusable = [...outside.filter((panel) => panel.matches(FOCUSABLE)), ...inScope(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      const found = [...root.querySelectorAll(rule.selector), ...outside.filter((panel) => panel.matches(rule.selector))];
      for (const element of found) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            expanded: element.getAttribute('aria-expanded'),
            hasPopup: element.getAttribute('aria-haspopup'),
            tabindex: element.getAttribute('tabindex'),
            focusable: focusable.includes(element),
            name: nameOf(element),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const round = (value) => Math.round(value * 1000) / 1000;
    const location = (popover, panel) =>
      panel.parentElement === document.body ? 'body' : popover.contains(panel) ? 'in-place' : root.contains(panel) ? 'in-case' : 'elsewhere';
    const panelStates = popovers.map((popover, index) => {
      const panel = panels[index];
      if (!panel) return null;
      const arrow = panel.firstElementChild;
      return {
        location: location(popover, panel),
        tag: panel.tagName.toLowerCase(),
        classes: vfClasses(panel),
        role: panel.getAttribute('role'),
        tabindex: panel.getAttribute('tabindex'),
        arrowClasses: arrow && arrow.classList.contains('vf-popover__arrow') ? vfClasses(arrow) : null,
        text: nameOf(panel),
      };
    });
    const geometry = () => popovers.map((popover, index) => {
      const panel = panels[index];
      if (!panel) return null;
      const trigger = triggerOf(popover).getBoundingClientRect();
      const box = panel.getBoundingClientRect();
      return {
        side: box.top >= trigger.bottom ? 'below' : box.bottom <= trigger.top ? 'above' : 'overlapping',
        left: round(box.left - trigger.left),
        right: round(box.right - trigger.right),
        gap: round(box.top >= trigger.bottom ? box.top - trigger.bottom : trigger.top - box.bottom),
      };
    });
    // As the dropdown's: the entered position, then one resize autoUpdate
    // answers, then one full repaint so the moved panels are rasterised afresh.
    const panelGeometry = geometry();
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)));
      setTimeout(done, 500);
    });
    const panelGeometryAfterResize = geometry();
    const bodyStyle = document.body.getAttribute('style');
    document.body.style.opacity = '0.999';
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    const panelRelationships = popovers.map((popover, index) => {
      const trigger = triggerOf(popover);
      const controls = trigger.getAttribute('aria-controls');
      const panel = panels[index];
      return {
        controls: !controls ? 'none' : !panel ? 'dangling' : panel.getAttribute('role') === 'dialog' ? 'dialog' : 'other',
        labelledBy: !panel ? null : panel.getAttribute('aria-labelledby') === trigger.id ? 'own-trigger' : 'other',
      };
    });
    const nestedMenus = dropdowns.map((dropdown, index) => ({
      place: root.contains(dropdown) ? 'case' : 'panel',
      expanded: dropdownTriggerOf(dropdown)?.getAttribute('aria-expanded') ?? null,
      menu: !menus[index] ? null : menus[index].parentElement === document.body ? 'body' : dropdown.contains(menus[index]) ? 'in-place' : 'elsewhere',
    }));
    const liveTriggers = [...document.querySelectorAll('[aria-controls]')];
    const bodyOverlays = [...document.body.children].filter(isOverlay).map((node) => {
      const owner = liveTriggers.find((element) => element.getAttribute('aria-controls') === node.id);
      if (!owner) return 'orphan';
      return owner.classList.contains('vf-popover__trigger') ? 'panel' : 'menu';
    }).sort();

    const active = document.activeElement;
    const owner = popovers.findIndex((popover, index) => popover.contains(active) || (panels[index] !== null && panels[index].contains(active)));
    const inDropdown = dropdowns.find((dropdown, index) => dropdown.contains(active) || (menus[index] !== null && menus[index].contains(active)));
    const focusRole = active === document.body
      ? 'body'
      : inDropdown
        ? active === dropdownTriggerOf(inDropdown) ? 'dropdown-trigger' : active.getAttribute('role') === 'menuitem' ? 'dropdown-item' : 'dropdown-other'
        : owner < 0
          ? root.contains(active) ? 'other-inside-case' : 'outside-case'
          : active === triggerOf(popovers[owner])
            ? 'trigger'
            : triggerOf(popovers[owner]).contains(active)
              ? 'trigger-control'
              : active === panels[owner] ? 'panel' : 'panel-control';

    const bucket = (ms) => ms < 300 ? 'short' : ms < 480 ? 'normal' : 'long';
    const transitions = popovers.map((popover) => {
      const id = triggerOf(popover).getAttribute('aria-controls');
      return (window.__parityPopoverTransitions?.[id] ?? []).map((entry) => entry.kind + ':' + (entry.ms === null ? 'unfinished' : bucket(entry.ms)));
    });

    const caseRect = root.getBoundingClientRect();
    const boxes = [caseRect, ...panels.filter(Boolean).map((panel) => panel.getBoundingClientRect())];
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));

    return {
      clip: {
        x: Math.round(left + window.scrollX),
        y: Math.round(top + window.scrollY),
        width: Math.round(Math.max(...boxes.map((box) => box.right)) - left),
        height: Math.round(Math.max(...boxes.map((box) => box.bottom)) - top),
      },
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: inScope('*').filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      instanceCount: popovers.length,
      expandedStates: popovers.map((popover) => triggerOf(popover).getAttribute('aria-expanded')),
      panelStates,
      panelGeometry,
      panelGeometryAfterResize,
      panelRelationships,
      nestedMenus,
      bodyOverlays,
      settled,
      transitions,
      focusRole,
      focusInstance: owner < 0 ? null : owner,
      focusItem: ['panel-control', 'dropdown-item'].includes(focusRole) ? nameOf(active) : null,
      events: window.__parityPopoverEvents?.[${JSON.stringify(caseId)}] ?? [],
      keydownPrevented: (window.__parityPopoverKeys ?? []).map((entry) => entry.key + ':' + entry.prevented),
    };
  })()`;
}

/**
 * What a VfTooltip case reports, before and after a scenario (M31).
 *
 * Component-specific and named so, like the popover's. The tooltip owns no
 * control: the profile's rules name its trigger span and the tooltip, and a
 * match is counted as an owned control only when it is focusable - so the
 * declared budget is zero everywhere, and a port that made either focusable
 * fails ownership rather than growing a control quietly. What it records falls
 * into five groups, each compared as its own dimension:
 *
 *   - ownership: the owned focusable matches, and every other focusable in the
 *     case, its followed tooltips and its open popover panels;
 *   - relationships: per instance, whether the trigger's aria-describedby
 *     names nothing, a missing id, or a tooltip - and which tooltip, by its
 *     index in document order. Nothing points back from a tooltip, so this and
 *     the tooltip's position are what tell two instances' tooltips apart;
 *   - state: each described tooltip - where it is, its tag, role, classes, its
 *     arrow and whether that is last, its text - its geometry against its own
 *     trigger once a resize has settled it, every tooltip node in the document
 *     by what names it (an orphan is one nothing names), which roots the
 *     pointer rests on, and the open state of a popover in the case;
 *   - timing: from the fixture's log, every reference written - with how the
 *     instance was last activated and the latency from that activation,
 *     bucketed against the instance's openDelay, or while-inactive when a
 *     deactivation came after it - every reference removed,
 *     with the lag from the last deactivation, and every enter and leave a
 *     tooltip completed;
 *   - focus and keys, as the popover's.
 *
 * Asynchronous: it waits, bounded, until no tooltip or popover panel carries
 * a vf-floating-transition-* class, and records whether it got there. The
 * catalog guarantees no open timer is still pending when it runs.
 */
function tooltipInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const round = (value) => Math.round(value * 1000) / 1000;

    const deadline = performance.now() + 2000;
    const unsettled = () => document.querySelector('.vf-tooltip__content[class*="vf-floating-transition-"], .vf-popover__content[class*="vf-floating-transition-"]') !== null;
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    const settled = !unsettled();

    const popoverTriggers = [...root.querySelectorAll('.vf-popover__trigger')];
    const panels = popoverTriggers
      .map((trigger) => document.getElementById(trigger.getAttribute('aria-controls')))
      .filter((panel) => panel !== null && !root.contains(panel));
    const instances = [...root.querySelectorAll('.vf-tooltip'), ...panels.flatMap((panel) => [...panel.querySelectorAll('.vf-tooltip')])];
    const triggerOf = (instance) => instance.querySelector(':scope > .vf-tooltip__trigger');
    const nodes = [...document.querySelectorAll('.vf-tooltip__content')];
    const describedOf = (instance) => {
      const id = triggerOf(instance)?.getAttribute('aria-describedby');
      return id ? document.getElementById(id) : null;
    };
    const tooltips = instances.map(describedOf);

    const outside = [...panels, ...tooltips.filter((node) => node !== null && !root.contains(node))];
    const scope = [root, ...outside];
    const inScope = (selector) => scope.flatMap((node) => [...(node.matches(selector) ? [node] : []), ...node.querySelectorAll(selector)]);
    const focusable = [...new Set(inScope(FOCUSABLE))];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of inScope(rule.selector).filter((element) => focusable.includes(element))) {
        owned.push({
          element,
          record: { role, tag: element.tagName.toLowerCase(), ariaRole: element.getAttribute('role'), tabindex: element.getAttribute('tabindex') },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const describedStates = instances.map((instance, index) => {
      const id = triggerOf(instance)?.getAttribute('aria-describedby');
      if (!id) return 'none';
      const node = tooltips[index];
      if (!node) return 'dangling';
      return node.matches('.vf-tooltip__content[role="tooltip"]') ? 'tooltip' : 'other';
    });
    const describedTargets = tooltips.map((node) => (node ? nodes.indexOf(node) : null));
    const place = (node) =>
      node.parentElement === document.body ? 'body' : node.closest('.vf-tooltip') ? 'in-place' : root.contains(node) ? 'in-case' : 'elsewhere';
    const tooltipStates = tooltips.map((node) => {
      if (!node) return null;
      const arrow = node.lastElementChild;
      const isArrow = Boolean(arrow && arrow.classList.contains('vf-tooltip__arrow'));
      return {
        location: place(node),
        tag: node.tagName.toLowerCase(),
        role: node.getAttribute('role'),
        classes: vfClasses(node),
        arrowClasses: isArrow ? vfClasses(arrow) : null,
        arrowLast: isArrow && arrow.getAttribute('aria-hidden') === 'true',
        text: [...node.childNodes].filter((child) => child !== arrow || !isArrow).map((child) => child.textContent).join(''),
      };
    });
    const geometry = () => instances.map((instance, index) => {
      const node = tooltips[index];
      if (!node) return null;
      const trigger = triggerOf(instance).getBoundingClientRect();
      const box = node.getBoundingClientRect();
      const arrow = node.querySelector(':scope > .vf-tooltip__arrow')?.getBoundingClientRect();
      const centre = trigger.left + trigger.width / 2;
      return {
        side: box.top >= trigger.bottom ? 'below' : box.bottom <= trigger.top ? 'above' : 'overlapping',
        gap: round(box.top >= trigger.bottom ? box.top - trigger.bottom : trigger.top - box.bottom),
        left: round(box.left - trigger.left),
        right: round(box.right - trigger.right),
        arrowFromCentre: arrow ? round(arrow.left + arrow.width / 2 - centre) : null,
      };
    });
    // One resize autoUpdate answers, then the geometry, then one full repaint
    // so the moved tooltips are rasterised afresh. Unlike the popover's, the
    // entered position before the resize is not recorded: floater.js measures
    // the arrow with getBoundingClientRect, so a placement computed during the
    // enter frames sees the arrow under the enter-from scale, and which frame
    // autoUpdate's first answer lands in is scheduler timing. M31 measured it:
    // identical in isolation and in a reduced run, the arrow 1 px apart on one
    // to three flip or shift cases of a full run - never the tooltip, the
    // settled geometry, the inline style or a pixel. What is compared is the
    // placement a recomputation settles on.
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)));
      setTimeout(done, 500);
    });
    const tooltipGeometry = geometry();
    const bodyStyle = document.body.getAttribute('style');
    document.body.style.opacity = '0.999';
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));

    const bodyTooltips = [...document.querySelectorAll('.vf-tooltip__content')].map((node) => {
      const owner = instances.findIndex((instance) => triggerOf(instance)?.getAttribute('aria-describedby') === node.id);
      return { place: place(node), owner: owner < 0 ? 'orphan' : 'instance:' + owner };
    });

    const delays = window.__parityTooltipDelays?.[${JSON.stringify(caseId)}] ?? [];
    const latency = (ms, delay) => (ms < delay / 2 ? 'early' : ms <= delay + 150 ? 'on-time' : 'late');
    const lastActivation = new Map();
    const lastDeactivation = new Map();
    const openings = [];
    const closings = [];
    for (const entry of window.__parityTooltipLogs?.[${JSON.stringify(caseId)}] ?? []) {
      if (entry.kind === 'activate') lastActivation.set(entry.instance, entry);
      else if (entry.kind === 'deactivate') lastDeactivation.set(entry.instance, entry);
      else if (entry.kind === 'describe') {
        const from = lastActivation.get(entry.instance);
        // An opening after the instance was last deactivated is a pending
        // timer a leave did not cancel, however on time it looks.
        const inactive = from && (lastDeactivation.get(entry.instance)?.t ?? -1) > from.t;
        openings.push({
          instance: entry.instance,
          via: from?.via ?? null,
          latency: from ? (inactive ? 'while-inactive' : latency(entry.t - from.t, delays[entry.instance] ?? 80)) : null,
        });
      } else if (entry.kind === 'undescribe') {
        const from = lastDeactivation.get(entry.instance);
        closings.push({
          instance: entry.instance,
          via: from?.via ?? null,
          lag: from ? (entry.t - from.t < 50 ? 'immediate' : 'late') : null,
        });
      }
    }
    const bucket = (ms) => (ms < 300 ? 'short' : ms < 480 ? 'normal' : 'long');
    const transitions = (window.__parityTooltipTransitions?.[${JSON.stringify(caseId)}] ?? []).map(
      (entry) =>
        entry.instance +
        ':' +
        entry.kind +
        (entry.framed ? '' : '-unframed') +
        ':' +
        (entry.ms === null ? 'unfinished' : bucket(entry.ms)),
    );

    const active = document.activeElement;
    const focusInstance = instances.findIndex((instance) => instance.contains(active));
    const focusRole = active === document.body
      ? 'body'
      : focusInstance >= 0
        ? active.matches('.parity-trigger-control') ? 'control' : 'other-in-tooltip'
        : active.matches('.parity-after-control')
          ? 'after-control'
          : popoverTriggers.includes(active)
            ? 'popover-trigger'
            : panels.some((panel) => panel.contains(active))
              ? 'popover-panel'
              : root.contains(active) ? 'other-inside-case' : 'outside-case';

    const caseRect = root.getBoundingClientRect();
    const boxes = [caseRect, ...outside.map((node) => node.getBoundingClientRect())];
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));

    return {
      clip: {
        x: Math.round(left + window.scrollX),
        y: Math.round(top + window.scrollY),
        width: Math.round(Math.max(...boxes.map((box) => box.right)) - left),
        height: Math.round(Math.max(...boxes.map((box) => box.bottom)) - top),
      },
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: inScope('*').filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      instanceCount: instances.length,
      describedStates,
      describedTargets,
      tooltipStates,
      tooltipGeometry,
      bodyTooltips,
      hoverStates: instances.map((instance) => String(instance.matches(':hover'))),
      expandedStates: popoverTriggers.map((trigger) => trigger.getAttribute('aria-expanded')),
      openings,
      closings,
      transitions,
      settled,
      focusRole,
      focusInstance: focusInstance < 0 ? null : focusInstance,
      keydownPrevented: (window.__parityTooltipKeys ?? []).map((entry) => entry.key + ':' + entry.prevented),
    };
  })()`;
}

/**
 * What a VfBreadcrumbs case reports.
 *
 * Component-specific and named so, like the link's. The second ownership
 * snapshot for a component that owns anchors, and the first that owns N of
 * them at once with the count decided per item by a rule. Taken once per case,
 * with nothing driven: a breadcrumb trail handles no click and no key. Two
 * groups, each compared as its own dimension:
 *
 *   - ownership: every control the profile says the component owns - found by
 *     the profile's selector, which carries `[href]` because a span is not a
 *     control and neither is an anchor without a destination - with its tag,
 *     its three native link attributes, its classes, its name and whether it
 *     is focusable, in document order; and every focusable element that is
 *     not one of them, which is the consumer's;
 *   - the trail's own record: the item count, the first child of every item
 *     in order - its tag, href, target, rel and name - the indices that carry
 *     aria-current, the separator count and the nav's label. This is where a
 *     current item rendered as a link, a link rendered as a span, a second
 *     current item, a swapped pair of destinations, a separator after the last
 *     item or a renamed landmark differ on their own account, beside the DOM.
 *
 * Deliberately not a second DOM extractor: the separator's content and every
 * attribute the nav forwards are compared by the ordinary DOM comparison and
 * are not repeated here.
 */
/**
 * What a VfSelect case reports, before and after a scenario (M32).
 *
 * Component-specific and named so, like the dropdown's, whose shape it keeps
 * for the listbox. The select owns its trigger, its clear button and, while
 * open, every option of its listbox - the profile's rules, found in the case
 * and in the listboxes its triggers' aria-controls reach. A hidden form input
 * is not focusable and is not counted. The listbox container is the select's
 * structural overlay node, as the dropdown's role=menu is: its composite role
 * is not counted among the explicit interactive roles (the options are, by
 * the profile's declared role), and it is compared by the DOM and the tree.
 * What it records, each compared as its own dimension:
 *
 *   - ownership: the owned controls and every other focusable element in the
 *     case and its open listboxes;
 *   - state: per instance aria-expanded, the trigger's label and classes, the
 *     listbox's place, classes, role and options, its geometry against its
 *     trigger before and after one resize, its scroll, the hidden input, the
 *     field around it, a popover around it, and every listbox node in <body>
 *     by what names it (an orphan is one no live trigger of the case names);
 *   - forms: the entries of the form around the case and its validity;
 *   - relationships: per instance, where aria-controls resolves and whether
 *     the listbox is labelled by its own trigger;
 *   - focus, the value-change log, the keydown log and the transitions.
 *
 * Asynchronous: it waits, bounded, until no listbox carries a
 * vf-floating-transition class, and records whether it got there.
 */
function selectInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const nameOf = (element) => (element.textContent ?? '').replace(/\\s+/g, ' ').trim();
    const round = (value) => Math.round(value * 1000) / 1000;

    const selects = [...root.querySelectorAll('.vf-select-wrap')];
    const triggerOf = (select) => select.querySelector(':scope > button.vf-select');
    const listboxOf = (select) => {
      const id = triggerOf(select)?.getAttribute('aria-controls');
      return id ? document.getElementById(id) : null;
    };
    const transitionOf = (listbox) => [...listbox.classList].filter((name) => name.startsWith('vf-floating-transition-')).join(' ');

    const deadline = performance.now() + 2000;
    const unsettled = () => selects.some((select) => { const listbox = listboxOf(select); return listbox !== null && transitionOf(listbox) !== ''; });
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    const settled = !unsettled();

    const listboxes = selects.map(listboxOf);
    const outside = listboxes.filter((listbox) => listbox !== null && !root.contains(listbox));
    const scope = [root, ...outside];
    const inScope = (selector) => scope.flatMap((node) => [...node.querySelectorAll(selector)]);
    const focusable = inScope(FOCUSABLE);
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of inScope(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            expanded: element.getAttribute('aria-expanded'),
            hasPopup: element.getAttribute('aria-haspopup'),
            selected: element.getAttribute('aria-selected'),
            disabled: element.disabled === true,
            tabindex: element.getAttribute('tabindex'),
            focusable: focusable.includes(element),
            name: nameOf(element) || element.getAttribute('aria-label') || '',
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const location = (select, listbox) =>
      listbox.parentElement === document.body ? 'body' : select.contains(listbox) ? 'in-place' : root.contains(listbox) ? 'in-case' : listbox.parentElement?.id ? 'target:' + listbox.parentElement.id : 'elsewhere';
    const triggerStates = selects.map((select) => {
      const trigger = triggerOf(select);
      return {
        label: trigger.querySelector(':scope > .vf-select__value')?.textContent ?? null,
        classes: vfClasses(trigger),
        wrapperClasses: vfClasses(select),
        filled: trigger.getAttribute('data-vf-filled'),
        clear: select.querySelector(':scope > .vf-select-wrap__clear') !== null,
        chevron: trigger.querySelector(':scope > .vf-select__icon--chevron') !== null,
      };
    });
    const listboxStates = selects.map((select, index) => {
      const listbox = listboxes[index];
      if (!listbox) return null;
      return {
        location: location(select, listbox),
        classes: vfClasses(listbox),
        role: listbox.getAttribute('role'),
        options: [...listbox.children].map((option) => ({
          tag: option.tagName.toLowerCase(),
          role: option.getAttribute('role'),
          label: nameOf(option),
          selected: option.getAttribute('aria-selected'),
          selectedClass: option.classList.contains('vf-select__option--selected'),
          disabled: option.disabled === true,
          tabindex: option.getAttribute('tabindex'),
        })),
      };
    });
    const geometry = () => selects.map((select, index) => {
      const listbox = listboxes[index];
      if (!listbox) return null;
      const trigger = triggerOf(select);
      const edge = trigger.getBoundingClientRect();
      const box = listbox.getBoundingClientRect();
      return {
        side: box.top >= edge.bottom ? 'below' : box.bottom <= edge.top ? 'above' : 'overlapping',
        left: round(box.left - edge.left),
        right: round(box.right - edge.right),
        gap: round(box.top >= edge.bottom ? box.top - edge.bottom : edge.top - box.bottom),
        minWidth: listbox.style.minWidth,
        triggerWidth: trigger.offsetWidth + 'px',
        withinViewport: box.left >= 0 && box.right <= window.innerWidth,
      };
    });
    const listboxGeometry = geometry();
    window.dispatchEvent(new Event('resize'));
    await new Promise((done) => {
      requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(done)));
      setTimeout(done, 500);
    });
    const listboxGeometryAfterResize = geometry();
    // One full repaint, as the dropdown's snapshot does, so a moved listbox is
    // rasterised afresh before anything is captured. Each wait has the settle
    // fallback: headless Chrome may produce no frame at all, and a bare double
    // rAF would then hang the evaluate until the DevTools request timed out.
    const frames = () => new Promise((done) => {
      let finished = false;
      const finish = () => { if (!finished) { finished = true; done(); } };
      requestAnimationFrame(() => requestAnimationFrame(finish));
      setTimeout(finish, 500);
    });
    const bodyStyle = document.body.getAttribute('style');
    document.body.style.opacity = '0.999';
    await frames();
    if (bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', bodyStyle);
    await frames();

    const active = document.activeElement;
    const listboxScroll = listboxes.map((listbox) => {
      if (!listbox) return null;
      const box = listbox.getBoundingClientRect();
      const focused = listbox.contains(active) && active !== listbox ? active.getBoundingClientRect() : null;
      return {
        scrollTop: Math.round(listbox.scrollTop),
        scrollable: listbox.scrollHeight > listbox.clientHeight,
        focusedInView: focused ? focused.top >= box.top - 0.5 && focused.bottom <= box.bottom + 0.5 : null,
      };
    });
    const listboxRelationships = selects.map((select, index) => {
      const trigger = triggerOf(select);
      const controls = trigger.getAttribute('aria-controls');
      const listbox = listboxes[index];
      return {
        controls: !controls ? 'none' : !listbox ? 'dangling' : listbox.getAttribute('role') === 'listbox' ? 'listbox' : 'other',
        labelledBy: !listbox ? null : listbox.getAttribute('aria-labelledby') === trigger.id ? 'own-trigger' : 'other',
        activedescendant: trigger.hasAttribute('aria-activedescendant') || (listbox?.hasAttribute('aria-activedescendant') ?? false),
      };
    });
    const liveIds = new Set(listboxes.filter(Boolean).map((listbox) => listbox.id));
    const bodyListboxes = [...document.body.children]
      .filter((node) => node.classList.contains('vf-select__menu'))
      .map((node) => (liveIds.has(node.id) ? 'listbox:' + listboxes.findIndex((listbox) => listbox === node) : 'orphan'));
    const hiddenInputs = selects.map((select) => {
      const input = select.querySelector(':scope > input[type="hidden"]');
      return input ? { name: input.getAttribute('name'), value: input.value, disabled: input.disabled, first: select.firstElementChild === input } : null;
    });
    const form = root.querySelector('form');
    const formData = form ? [...new FormData(form).entries()].map(([name, value]) => [name, String(value)]) : null;
    const formValid = form ? form.checkValidity() : null;
    const fieldStates = [...root.querySelectorAll('.vf-field')].map((field) => {
      const control = field.querySelector('.vf-field__control');
      const label = field.querySelector('label.vf-field__label');
      const trigger = field.querySelector('button.vf-select');
      return {
        classes: vfClasses(field),
        controlClasses: control ? vfClasses(control) : null,
        labelTargetsTrigger: Boolean(label && trigger && label.getAttribute('for') === trigger.id),
      };
    });
    const popoverStates = [...root.querySelectorAll('.vf-popover')].map((popover) => popover.querySelector(':scope > .vf-popover__trigger')?.getAttribute('aria-expanded') ?? null);

    const owner = selects.findIndex((select, index) => select.contains(active) || (listboxes[index] !== null && listboxes[index].contains(active)));
    const focusRole = active === document.body
      ? 'body'
      : owner < 0
        ? root.contains(active) ? 'other-inside-case' : 'outside-case'
        : active === triggerOf(selects[owner])
          ? 'trigger'
          : active.classList.contains('vf-select-wrap__clear')
            ? 'clear'
            : active.getAttribute('role') === 'option' ? 'option' : 'other-inside-select';

    const bucket = (ms) => ms < 300 ? 'short' : ms < 480 ? 'normal' : 'long';
    const transitions = selects.map((select) => {
      const id = triggerOf(select).getAttribute('aria-controls');
      return (window.__paritySelectTransitions?.[id] ?? []).map((entry) => entry.kind + ':' + (entry.ms === null ? 'unfinished' : bucket(entry.ms)));
    });

    const caseRect = root.getBoundingClientRect();
    const boxes = [caseRect, ...listboxes.filter(Boolean).map((listbox) => listbox.getBoundingClientRect())];
    const left = Math.min(...boxes.map((box) => box.left));
    const top = Math.min(...boxes.map((box) => box.top));

    return {
      clip: {
        x: Math.round(left + window.scrollX),
        y: Math.round(top + window.scrollY),
        width: Math.round(Math.max(...boxes.map((box) => box.right)) - left),
        height: Math.round(Math.max(...boxes.map((box) => box.bottom)) - top),
      },
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: inScope('*').filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      instanceCount: selects.length,
      expandedStates: selects.map((select) => triggerOf(select).getAttribute('aria-expanded')),
      triggerStates,
      listboxStates,
      listboxGeometry,
      listboxGeometryAfterResize,
      listboxScroll,
      listboxRelationships,
      bodyListboxes,
      hiddenInputs,
      formData,
      formValid,
      fieldStates,
      popoverStates,
      settled,
      transitions,
      focusRole,
      focusInstance: owner < 0 ? null : owner,
      focusOption: focusRole === 'option' ? nameOf(active) : null,
      events: window.__paritySelectEvents?.[${JSON.stringify(caseId)}] ?? [],
      keydownPrevented: (window.__paritySelectKeys ?? []).map((entry) => entry.key + ':' + entry.prevented),
    };
  })()`;
}

function breadcrumbsInteractionExpression(caseId, controlOwnership = {}) {
  return `(() => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const nameOf = (element) => (element.textContent ?? '').replace(/\\s+/g, ' ').trim();

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({
          element,
          record: {
            role,
            tag: element.tagName.toLowerCase(),
            ariaRole: element.getAttribute('role'),
            href: element.getAttribute('href'),
            target: element.getAttribute('target'),
            rel: element.getAttribute('rel'),
            classes: vfClasses(element),
            focusable: focusable.includes(element),
            name: nameOf(element),
          },
        });
      }
    }
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const nav = root.querySelector('.vf-breadcrumbs');
    const items = nav ? [...nav.querySelectorAll(':scope > ol > li')] : [];
    const records = items.map((item) => {
      const node = item.firstElementChild;
      return node
        ? {
            tag: node.tagName.toLowerCase(),
            href: node.getAttribute('href'),
            target: node.getAttribute('target'),
            rel: node.getAttribute('rel'),
            name: nameOf(node),
          }
        : null;
    });
    const activeElement = document.activeElement;
    const focusRole = activeElement === document.body
      ? 'body'
      : root.contains(activeElement) ? 'inside-case' : 'outside-case';

    return {
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) =>
        INTERACTIVE_ROLES.has(element.getAttribute('role') ?? ''),
      ).length,
      itemCount: items.length,
      breadcrumbItems: records,
      currentIndices: items.flatMap((item, index) => (item.querySelector(':scope > [aria-current]') ? [index] : [])),
      separatorCount: nav ? nav.querySelectorAll('.vf-breadcrumbs__separator').length : null,
      navLabel: nav?.getAttribute('aria-label') ?? null,
      focusRole,
    };
  })()`;
}

/**
 * Reports the actual post-scenario state before any visual focus normalization.
 *
 * The shape is component-specific - a caret position means nothing on a button,
 * an activation count means nothing on a text field - so the profile selects
 * it. Everything downstream compares whatever shape comes back, key by key.
 */
/**
 * What a VfNavMenu case reports, before and after a scenario (M33).
 *
 * Component-specific and named so. The nav menu owns a native button per
 * branch, a native button or anchor per leaf - the profile's three rules -
 * and nothing else: the nav, the lists, the groups and the collapse wrappers
 * are structure. What it records, each compared as its own dimension:
 *
 *   - ownership: the owned controls with their tag, type and label in
 *     document order, and every other focusable element in the case;
 *   - the tree: every item element in document order - group, branch, button
 *     or link - with its level declaration, classes, its li's classes,
 *     aria-expanded, aria-current, the native disabled, aria-disabled,
 *     tabindex, href, target, rel and its two glyph slots; the labels of the
 *     expanded branches and of the current items;
 *   - the collapse wrappers: each one's owner, classes and inline style once
 *     settled, and the frame-sampled life the fixture log kept - the states it
 *     was inserted in, the ones each hook frame wrote, and its removal;
 *   - compactness: per instance whether it is compact, and, for every
 *     sidebar, what every instance in the case reports after its own box is
 *     narrowed to 100px, widened to 400px and restored - the ResizeObserver
 *     contract and the isolation between instances;
 *   - the scenario's record: the change log, the location hash a link left,
 *     focus and the keydown log.
 *
 * Asynchronous: it waits, bounded, until no collapse carries a transition
 * class or an inline declaration, and records whether it got there.
 */
function navMenuInteractionExpression(caseId, controlOwnership = {}) {
  return `(async () => {
    const root = document.querySelector('[data-parity-case="${caseId}"]');
    if (!root) throw new Error('missing case ${caseId}');

    const OWNED = ${JSON.stringify(controlOwnership)};
    const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex], [contenteditable=""], [contenteditable="true"]';
    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'checkbox', 'radio', 'switch', 'textbox', 'combobox',
      'listbox', 'menuitem', 'option', 'slider', 'spinbutton', 'tab',
    ]);
    const vfClasses = (element) => [...element.classList].filter((name) => name.startsWith('vf-')).sort();
    const frames = (count) => new Promise((done) => {
      let left = count;
      const tick = () => (--left <= 0 ? done() : requestAnimationFrame(tick));
      requestAnimationFrame(tick);
      setTimeout(done, 1000);
    });

    const collapses = () => [...root.querySelectorAll('.vf-nav-menu__collapse')];
    const unsettled = () =>
      collapses().some((element) => [...element.classList].some((name) => !name.startsWith('vf-')) || (element.getAttribute('style') ?? '') !== '');
    const deadline = performance.now() + 2000;
    while (unsettled() && performance.now() < deadline) {
      await new Promise((tick) => setTimeout(tick, 20));
    }
    const settled = !unsettled();
    // The fixture samples once per frame: two more frames, so the settled
    // state - or a removal - is in its log before the log is read.
    await frames(2);

    const labelOf = (element) =>
      (element.querySelector(':scope > .vf-nav-menu__item-content > .vf-nav-menu__label, :scope > .vf-nav-menu__item-content > .vf-nav-menu__group-label')?.textContent ?? null);
    const levelOf = (element) => element.style.getPropertyValue('--vf-nav-menu-level').trim() || null;

    const focusable = [...root.querySelectorAll(FOCUSABLE)];
    const owned = [];
    for (const [role, rule] of Object.entries(OWNED)) {
      for (const element of root.querySelectorAll(rule.selector)) {
        owned.push({ element, record: { role, tag: element.tagName.toLowerCase(), type: element.getAttribute('type'), label: labelOf(element) } });
      }
    }
    owned.sort((left, right) => (left.element.compareDocumentPosition(right.element) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const ownedElements = owned.map((entry) => entry.element);
    const consumer = focusable.filter((element) => !ownedElements.includes(element));

    const navs = [...root.querySelectorAll('nav.vf-nav-menu')];
    const navItems = [...root.querySelectorAll('.vf-nav-menu__item, .vf-nav-menu__group')].map((element) => ({
      instance: navs.indexOf(element.closest('nav.vf-nav-menu')),
      kind: element.classList.contains('vf-nav-menu__group')
        ? 'group:' + element.tagName.toLowerCase()
        : element.classList.contains('vf-nav-menu__item--branch')
          ? 'branch:' + element.tagName.toLowerCase()
          : 'leaf:' + element.tagName.toLowerCase(),
      label: labelOf(element),
      level: levelOf(element),
      classes: vfClasses(element),
      node: element.parentElement ? vfClasses(element.parentElement) : [],
      expanded: element.getAttribute('aria-expanded'),
      current: element.getAttribute('aria-current'),
      disabled: element.hasAttribute('disabled'),
      ariaDisabled: element.getAttribute('aria-disabled'),
      tabindex: element.getAttribute('tabindex'),
      href: element.getAttribute('href'),
      target: element.getAttribute('target'),
      rel: element.getAttribute('rel'),
      leadingIcon: element.querySelector(':scope > .vf-nav-menu__item-content > .vf-nav-menu__leading-icon') !== null,
      chevron: element.querySelector(':scope > .vf-nav-menu__icon:not(.vf-nav-menu__icon--external)') ? vfClasses(element.querySelector(':scope > .vf-nav-menu__icon')) : null,
      external: element.querySelector(':scope > .vf-nav-menu__icon--external') !== null,
    }));
    const collapseStates = collapses().map((element) => ({
      owner: element.parentElement ? labelOf(element.parentElement.querySelector(':scope > .vf-nav-menu__item')) : null,
      classes: [...element.classList].sort(),
      style: element.getAttribute('style') ?? '',
      parent: element.parentElement?.tagName.toLowerCase() ?? null,
    }));
    const collapseTransitions = (window.__parityNavMenuLogs?.[${JSON.stringify(caseId)}] ?? []).map((record) => ({
      owner: record.owner,
      states: [...record.states],
    }));
    const compactOf = () => navs.map((nav) => nav.classList.contains('vf-nav-menu--sidebar-compact'));
    const compactStates = compactOf();

    const active = document.activeElement;
    const focusItem = active === document.body
      ? 'body'
      : root.contains(active)
        ? (active.matches('.vf-nav-menu__item') ? 'item:' + labelOf(active) : 'other-inside-case')
        : 'outside-case';
    const caseRect = root.getBoundingClientRect();
    const expandedLabels = [...root.querySelectorAll('.vf-nav-menu__item[aria-expanded="true"]')].map(labelOf);
    const currentLabels = [...root.querySelectorAll('[aria-current]')].map((element) => labelOf(element) + ':' + element.getAttribute('aria-current'));
    const locationHash = location.hash;
    const events = window.__parityNavMenuEvents?.[${JSON.stringify(caseId)}] ?? [];
    const keydownPrevented = (window.__parityNavMenuKeys ?? []).map((entry) => entry.key + ':' + entry.prevented);

    // Last, and undone: every sidebar's box narrowed, widened and restored,
    // with every instance read after each, so the observer answers and its
    // isolation are measured on the live component.
    const compactProbe = [];
    for (const [instance, nav] of navs.entries()) {
      if (!nav.classList.contains('vf-nav-menu--sidebar')) continue;
      const box = nav.parentElement;
      const style = box.getAttribute('style');
      box.style.width = '100px';
      await frames(3);
      const narrow = compactOf();
      box.style.width = '400px';
      await frames(3);
      const wide = compactOf();
      if (style === null) box.removeAttribute('style');
      else box.setAttribute('style', style);
      await frames(3);
      compactProbe.push({ instance, narrow, wide, restored: compactOf() });
    }

    return {
      clip: {
        x: Math.round(caseRect.left + window.scrollX),
        y: Math.round(caseRect.top + window.scrollY),
        width: Math.round(caseRect.width),
        height: Math.round(caseRect.height),
      },
      ownershipPosture: 'component',
      componentControls: owned.map((entry) => entry.record),
      consumerControlCount: consumer.length,
      focusableTotal: focusable.length,
      interactiveRoleTotal: [...root.querySelectorAll('*')].filter((element) => INTERACTIVE_ROLES.has(element.getAttribute('role') ?? '')).length,
      instanceCount: navs.length,
      navItems,
      expandedLabels,
      currentLabels,
      collapseStates,
      collapseTransitions,
      compactStates,
      compactProbe,
      locationHash,
      events,
      settled,
      focusItem,
      keydownPrevented,
    };
  })()`;
}

export function interactionExpression(caseId, snapshot = 'input', controlOwnership = undefined) {
  if (snapshot === 'static') {
    return staticInteractionExpression(caseId);
  }

  if (snapshot === 'skeleton-gate') {
    return skeletonGateInteractionExpression(caseId);
  }

  if (snapshot === 'accordion') {
    return accordionInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'stepper') {
    return stepperInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'tabs') {
    return tabsInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'link') {
    return linkInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'breadcrumbs') {
    return breadcrumbsInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'menu-item') {
    return menuItemInteractionExpression(caseId, controlOwnership);
  }

  if (snapshot === 'dropdown') {
    return dropdownInteractionExpression(caseId, controlOwnership);
  }
  if (snapshot === 'group-box') {
    return groupBoxInteractionExpression(caseId, controlOwnership);
  }
  if (snapshot === 'popover') {
    return popoverInteractionExpression(caseId, controlOwnership);
  }
  if (snapshot === 'tooltip') {
    return tooltipInteractionExpression(caseId, controlOwnership);
  }
  if (snapshot === 'nav-menu') {
    return navMenuInteractionExpression(caseId, controlOwnership);
  }
  if (snapshot === 'select') {
    return selectInteractionExpression(caseId, controlOwnership);
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
