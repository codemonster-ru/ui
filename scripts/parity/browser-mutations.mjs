// Real DOM/CSS/event mutations on fresh pages served by the three real targets.
// They exercise extraction and screenshots as well as the comparator. No source
// file, baseline image or captured hash is rewritten to manufacture a failure.
import { wrapperPresenceCases } from './mutations.mjs';

function mutateElements(caseIds, selector, operation) {
  return `(() => {
    const evidence = [];
    let applied = 0;
    for (const caseId of ${JSON.stringify(caseIds)}) {
      const root = document.querySelector('[data-parity-case="' + caseId + '"]');
      const elements = [...(root?.querySelectorAll(${JSON.stringify(selector)}) ?? [])];
      if (elements.length === 0) throw new Error('MUTATION_NOT_APPLIED: ' + caseId + ' ${selector}');
      for (const element of elements) {
        ${operation}
        applied += 1;
      }
      evidence.push({caseId, elements: elements.length});
    }
    return {applied, evidence};
  })()`;
}

const nativeExpectation = {
  dimensions: ['dom.nativeAttributes', 'dom.productData'],
  details: { 'dom.nativeAttributes': ['name', 'autocomplete', 'maxlength'], 'dom.productData': ['data-vf-audit'] },
  caseIds: wrapperPresenceCases,
};

const glyphCases = [
  'input/interaction-typing',
  'input/interaction-empty-again',
  'input/interaction-clear',
  'input/interaction-reveal',
  'input/interaction-hide',
  'input/interaction-selection',
  'input/interaction-wrapper-transition',
];

function blockAction(caseId, selector) {
  return mutateElements(
    [caseId],
    selector,
    `
    if (element.disabled || element.hidden) throw new Error('MUTATION_NOT_APPLIED: action is inert');
    root.dataset.parityMutationHits = '0';
    root.addEventListener('click', (event) => {
      if (!element.contains(event.target)) return;
      root.dataset.parityMutationHits = String(Number(root.dataset.parityMutationHits) + 1);
      event.preventDefault();
      event.stopImmediatePropagation();
    }, true);
  `,
  );
}

function assertActionBlocked(caseId) {
  return `(() => {
    const hits = Number(document.querySelector('[data-parity-case="${caseId}"]').dataset.parityMutationHits);
    if (hits !== 1) throw new Error('MUTATION_NOT_APPLIED: expected one intercepted real action, got ' + hits);
    return {applied: hits, evidence: {interceptedClicks: hits}};
  })()`;
}

export const browserMutations = [
  {
    id: 'browser-blind-six-native-attributes',
    target: 'razor',
    caseIds: wrapperPresenceCases,
    description: 'exact audit corruption on the actual Razor inputs',
    expect: nativeExpectation,
    beforeExtract: mutateElements(
      wrapperPresenceCases,
      'input.vf-input',
      `
      const values = { name: 'CORRUPTED-NAME', autocomplete: 'cc-number', maxlength: '3', 'data-vf-audit': 'wrong' };
      for (const [name, value] of Object.entries(values)) {
        if (element.getAttribute(name) === value) throw new Error('MUTATION_NOT_APPLIED: already corrupted ' + name);
        element.setAttribute(name, value);
      }
      evidence.push({caseId, attributes: values});
    `,
    ),
  },
  {
    id: 'browser-wrong-wrapper-arrangement',
    target: 'razor',
    caseIds: ['input/clearable-empty'],
    description: 'insert a wrong container between the wrapper and control',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/clearable-empty'] },
    beforeExtract: mutateElements(
      ['input/clearable-empty'],
      'input.vf-input',
      `
      if (!element.parentElement.classList.contains('vf-input-wrap')) throw new Error('MUTATION_NOT_APPLIED: wrapper');
      const container = document.createElement('section');
      element.replaceWith(container);
      container.append(element);
    `,
    ),
  },
  {
    id: 'browser-missing-clear-action',
    target: 'razor',
    caseIds: ['input/clearable-filled'],
    description: 'remove the meaningful clear button',
    expect: { dimensions: ['dom.structure'], caseIds: ['input/clearable-filled'] },
    beforeExtract: mutateElements(['input/clearable-filled'], '.vf-input-wrap__clear', 'element.remove();'),
  },
  {
    id: 'browser-missing-modifier',
    target: 'razor',
    caseIds: ['input/clearable-filled'],
    description: 'remove the canonical trailing modifier',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: ['input/clearable-filled'] },
    beforeExtract: mutateElements(
      ['input/clearable-filled'],
      'input.vf-input',
      `
      if (!element.classList.contains('vf-input--with-trailing')) throw new Error('MUTATION_NOT_APPLIED: modifier');
      element.classList.remove('vf-input--with-trailing');
    `,
    ),
  },
  {
    id: 'browser-wrong-aria-label',
    target: 'razor',
    caseIds: ['input/clearable-filled'],
    description: 'corrupt both the DOM aria-label and browser accessible name',
    expect: { dimensions: ['dom.aria', 'a11y.name'], caseIds: ['input/clearable-filled'] },
    beforeExtract: mutateElements(
      ['input/clearable-filled'],
      '.vf-input-wrap__clear',
      `element.setAttribute('aria-label', 'CORRUPTED-LABEL');`,
    ),
  },
  {
    id: 'browser-broken-label-relationship',
    target: 'razor',
    caseIds: ['input/field-top-filled'],
    description: 'point the real label at an unresolved control id',
    expect: {
      dimensions: ['dom.relationships'],
      details: { 'dom.relationships': ['for'] },
      caseIds: ['input/field-top-filled'],
    },
    beforeExtract: mutateElements(
      ['input/field-top-filled'],
      'label[for]',
      `element.setAttribute('for', 'MISSING-CONTROL');`,
    ),
  },
  {
    id: 'browser-clear-does-not-reset',
    target: 'razor',
    caseIds: ['input/interaction-clear'],
    description: 'intercept the clear click before its controller handles it',
    expect: { dimensions: ['interaction.value'], caseIds: ['input/interaction-clear'] },
    beforeInteraction: blockAction('input/interaction-clear', '.vf-input-wrap__clear'),
    afterInteraction: assertActionBlocked('input/interaction-clear'),
  },
  {
    id: 'browser-reveal-does-not-switch-type',
    target: 'razor',
    caseIds: ['input/interaction-reveal'],
    description: 'intercept reveal so the native type stays password',
    expect: { dimensions: ['interaction.state'], caseIds: ['input/interaction-reveal'] },
    beforeInteraction: blockAction('input/interaction-reveal', '.vf-input-wrap__password-toggle'),
    afterInteraction: assertActionBlocked('input/interaction-reveal'),
  },
  ...['visibility', 'display'].map((property) => ({
    id: `browser-glyph-${property}`,
    target: 'razor',
    caseIds: glyphCases,
    description: `${property}:${property === 'visibility' ? 'hidden' : 'none'} on real visible post-interaction glyph wrappers`,
    expect: { dimensions: ['visual.postInteraction'], caseIds: glyphCases },
    afterInteraction: mutateElements(
      glyphCases,
      '.vf-icon-wrapper',
      `
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || element.getClientRects().length === 0) continue;
      element.style.setProperty('${property}', '${property === 'visibility' ? 'hidden' : 'none'}', 'important');
    `,
    ),
  })),
  {
    id: 'browser-padding-border',
    target: 'razor',
    caseIds: ['input/plain-filled'],
    description: 'change real input padding and border width',
    expect: { dimensions: ['style.geometry', 'visual'], caseIds: ['input/plain-filled'] },
    beforeExtract: mutateElements(
      ['input/plain-filled'],
      'input.vf-input',
      `
      element.style.paddingTop = '31px';
      element.style.borderTopWidth = '7px';
    `,
    ),
  },
  {
    id: 'browser-unregistered-glyph-child-style',
    target: 'razor',
    caseIds: ['input/leading-icon'],
    description: 'SVG path styles must not inherit the wrapper or SVG layout approval',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['style'] },
      caseIds: ['input/leading-icon'],
    },
    beforeExtract: mutateElements(['input/leading-icon'], 'svg path', `element.style.opacity = '0.25';`),
  },
  {
    id: 'browser-current-only-css',
    target: 'current',
    caseIds: ['input/plain-filled'],
    verifyIsolation: true,
    description: 'a current-only CSS rule leaves reference and Razor independent',
    expect: {
      dimensions: ['style.geometry', 'visual'],
      caseIds: ['input/plain-filled'],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements(
      ['input/plain-filled'],
      'input.vf-input',
      `
      const style = document.createElement('style');
      style.textContent = '[data-parity-case="input/plain-filled"] input { padding-top:31px !important; border-top-width:7px !important; }';
      document.head.append(style);
    `,
    ),
  },
];
