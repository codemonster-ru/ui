import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const chromeEndpoint = process.env.VUEFORGE_VISUAL_CHROME_ENDPOINT ?? 'http://127.0.0.1:9226';
const showcaseOrigin = process.env.VUEFORGE_VISUAL_ORIGIN ?? 'http://127.0.0.1:5185';
const outputDirectory = resolve(process.env.VUEFORGE_VISUAL_OUTPUT_DIR ?? '/private/tmp/vueforge-phase2');
const baselineDirectory = process.env.VUEFORGE_VISUAL_BASELINE_DIR
  ? resolve(process.env.VUEFORGE_VISUAL_BASELINE_DIR)
  : null;
const storageKey = 'codemonster-showcase-theme';
const sleep = (milliseconds) => new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds));

const viewports = [
  { name: 'desktop', width: 1440, height: 1100, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const routes = [
  { name: 'colors', pathname: '/colors', readySelector: '.color-system__theme-grid' },
  { name: 'core', pathname: '/core', readySelector: '[data-test="form-geometry-matrix"]' },
  {
    name: 'codeblock',
    pathname: '/codeblock',
    readySelector: '.vf-skeleton-gate__content--ready .vf-codeblock',
  },
  {
    name: 'playground',
    pathname: '/playground',
    readySelector: '.vf-skeleton-gate__content--ready .vf-playground',
  },
];

mkdirSync(outputDirectory, { recursive: true });

const targets = await fetch(`${chromeEndpoint}/json/list`).then((response) => {
  if (!response.ok) {
    throw new Error(`Chrome DevTools endpoint returned ${response.status}.`);
  }
  return response.json();
});
const target = targets.find((candidate) => candidate.type === 'page');
if (!target) {
  throw new Error('Chrome page target is unavailable. Start Chrome with remote debugging enabled.');
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolvePromise, reject) => {
  socket.addEventListener('open', resolvePromise, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const browserErrors = [];
const networkErrors = [];
const networkRequests = new Map();

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timeoutId);
    if (message.error) request.reject(new Error(`${request.method}: ${message.error.message}`));
    else request.resolve(message.result);
    return;
  }

  if (message.method === 'Runtime.exceptionThrown') {
    browserErrors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    browserErrors.push(message.params.args.map((argument) => argument.value ?? argument.description).join(' '));
  }
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
    browserErrors.push(message.params.entry.text);
  }
  if (message.method === 'Network.responseReceived') {
    const { response } = message.params;
    if (response.status >= 400 && response.url.startsWith(showcaseOrigin)) {
      networkErrors.push(`${response.status} ${response.url}`);
    }
  }
  if (message.method === 'Network.requestWillBeSent') {
    const { requestId, request } = message.params;
    if (request.url.startsWith(showcaseOrigin)) networkRequests.set(requestId, request.url);
  }
  if (message.method === 'Network.loadingFailed') {
    const { requestId, canceled, errorText } = message.params;
    const url = networkRequests.get(requestId);
    if (url && !canceled && errorText !== 'net::ERR_ABORTED') {
      networkErrors.push(`${errorText} ${url}`);
    }
    networkRequests.delete(requestId);
  }
  if (message.method === 'Network.loadingFinished') {
    networkRequests.delete(message.params.requestId);
  }
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolvePromise, reject) => {
    const timeoutId = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`${method}: Chrome DevTools request timed out.`));
    }, 30_000);
    pending.set(id, { resolve: resolvePromise, reject, method, timeoutId });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitFor(expression, timeout = 30_000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeout) {
    try {
      const value = await evaluate(expression);
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(100);
  }
  throw new Error(`Timed out waiting for ${expression}${lastError ? `: ${lastError.message}` : ''}`);
}

async function forcePseudoState(nodeId, selector, forcedPseudoClasses) {
  assert(nodeId, `State-matrix fixture node is missing: ${selector}`);
  await send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses });
}

async function forceSelectorPseudoState(selector, forcedPseudoClasses) {
  const { root } = await send('DOM.getDocument', { depth: 0 });
  const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
  await forcePseudoState(nodeId, selector, forcedPseudoClasses);
}

async function navigate(pathname, readySelector) {
  await send('Page.navigate', { url: `${showcaseOrigin}${pathname}` });
  await waitFor(`document.readyState === 'complete' && document.querySelector(${JSON.stringify(readySelector)})`);
  await sleep(500);
}

async function setMode(mode, readySelector) {
  await evaluate(
    `localStorage.setItem(${JSON.stringify(storageKey)}, ${JSON.stringify(mode)}); location.reload(); true`,
  );
  await waitFor(`document.readyState === 'complete' && document.querySelector(${JSON.stringify(readySelector)})`);
  await waitFor(`document.documentElement.dataset.vfTheme === ${JSON.stringify(mode)}`);
  await sleep(700);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const stateMatrixSelectors = {
  input: '[data-vf-state-matrix="input-invalid"]',
  textarea: '[data-vf-state-matrix="textarea-invalid"]',
  select: '[data-vf-state-matrix="select-invalid-open"]',
  selectOption: '[data-vf-state-matrix="select-option-disabled"]',
  selectedTab: '[data-vf-state-matrix="tab-selected"]',
  secondaryButton: '[data-vf-state-matrix="button-secondary"]',
  secondaryIconButton: '[data-vf-state-matrix="icon-button-secondary"]',
  dropdownNative: '[data-vf-state-matrix="dropdown-native-disabled"]',
  dropdownLink: '[data-vf-state-matrix="dropdown-link-disabled"]',
  navNative: '[data-vf-state-matrix="nav-native-disabled"]',
  navLink: '[data-vf-state-matrix="nav-link-disabled"]',
  menuNative: '[data-vf-state-matrix="menu-native-disabled"]',
  menuLink: '[data-vf-state-matrix="menu-link-disabled"]',
};

const stateMatrixMarkup = `
  <div id="vf-phase2-state-matrix" aria-hidden="true">
    <style>
      #vf-phase2-state-matrix {
        position: fixed;
        inset: 0 auto auto -10000px;
        width: 320px;
        pointer-events: none;
      }

      #vf-phase2-state-matrix *,
      #vf-phase2-state-matrix *::before,
      #vf-phase2-state-matrix *::after {
        animation: none !important;
        transition: none !important;
      }
    </style>
    <input class="vf-input vf-input--invalid" data-vf-state-matrix="input-invalid" />
    <textarea class="vf-textarea vf-textarea--invalid" data-vf-state-matrix="textarea-invalid"></textarea>
    <button
      type="button"
      class="vf-select vf-select--invalid vf-select--open"
      data-vf-state-matrix="select-invalid-open"
    >Invalid open select</button>
    <div class="vf-select__dropdown">
      <button
        type="button"
        class="vf-select__option"
        data-vf-state-matrix="select-option-disabled"
        disabled
      >Disabled option</button>
    </div>
    <div class="vf-tabs">
      <div class="vf-tabs__list" role="tablist">
        <button
          type="button"
          class="vf-tabs__tab"
          data-vf-state-matrix="tab-selected"
          aria-selected="true"
          role="tab"
        >Selected tab</button>
      </div>
    </div>
    <button
      type="button"
      class="vf-button vf-button--secondary"
      data-vf-state-matrix="button-secondary"
    >Secondary button</button>
    <button
      type="button"
      class="vf-icon-button vf-icon-button--secondary"
      data-vf-state-matrix="icon-button-secondary"
      aria-label="Secondary icon button"
    ></button>
    <div class="vf-dropdown__menu">
      <button
        type="button"
        class="vf-dropdown__item vf-dropdown__item--active"
        data-vf-state-matrix="dropdown-native-disabled"
        disabled
      >Disabled native dropdown item</button>
      <a
        class="vf-dropdown__item vf-dropdown__item--active"
        data-vf-state-matrix="dropdown-link-disabled"
        aria-disabled="true"
      >Disabled dropdown link</a>
    </div>
    <nav class="vf-nav-menu vf-nav-menu--pills">
      <button
        type="button"
        class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--branch vf-nav-menu__item--active vf-nav-menu__item--ancestor-active"
        data-vf-state-matrix="nav-native-disabled"
        disabled
      >Disabled native branch</button>
      <a
        class="vf-nav-menu__item vf-nav-menu__item--top vf-nav-menu__item--active vf-nav-menu__item--ancestor-active vf-nav-menu__item--disabled"
        data-vf-state-matrix="nav-link-disabled"
        aria-disabled="true"
      >Disabled link</a>
    </nav>
    <nav class="vf-menu-bar vf-menu-bar--pills">
      <button
        type="button"
        class="vf-menu-bar__item vf-menu-bar__item--top vf-menu-bar__item--branch vf-menu-bar__item--active vf-menu-bar__item--ancestor-active vf-menu-bar__item--open"
        data-vf-state-matrix="menu-native-disabled"
        disabled
      >Disabled native branch</button>
      <a
        class="vf-menu-bar__item vf-menu-bar__item--top vf-menu-bar__item--active vf-menu-bar__item--ancestor-active vf-menu-bar__item--open vf-menu-bar__item--disabled"
        data-vf-state-matrix="menu-link-disabled"
        aria-disabled="true"
      >Disabled link</a>
    </nav>
  </div>
`;

const stateMatrixSnapshotExpression = `(() => {
  const selectors = ${JSON.stringify(stateMatrixSelectors)};
  const root = document.documentElement;
  const fixture = document.querySelector('#vf-phase2-state-matrix');
  if (!fixture) throw new Error('Phase 2 state-matrix fixture is unavailable.');

  const elementFor = (key) => {
    const element = document.querySelector(selectors[key]);
    if (!element) throw new Error('Phase 2 state-matrix node is unavailable: ' + key);
    return element;
  };
  const material = (element) => {
    const style = getComputedStyle(element);
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      borderColor: style.borderColor,
      boxShadow: style.boxShadow,
      cursor: style.cursor,
      focus: element.matches(':focus'),
      focusVisible: element.matches(':focus-visible'),
      hover: element.matches(':hover'),
      active: element.matches(':active'),
    };
  };
  const tokenColor = (token) => {
    const probe = document.createElement('span');
    probe.style.color = 'var(' + token + ')';
    fixture.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  };
  const focusShadow = () => {
    const probe = document.createElement('span');
    probe.style.boxShadow = '0 0 0 var(--vf-focus-ring-width) var(--vf-color-focus-ring)';
    fixture.append(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
  };
  const elements = Object.fromEntries(
    Object.keys(selectors).map((key) => [key, material(elementFor(key))]),
  );
  const disabledExpected = {
    color: tokenColor('--vf-color-text-disabled'),
    backgroundColor: tokenColor('--vf-color-background-surface-disabled'),
    borderColor: tokenColor('--vf-color-border-disabled'),
  };

  return {
    elements,
    expected: {
      invalidBorder: {
        input: tokenColor('--vf-input-invalid-border-color'),
        textarea: tokenColor('--vf-textarea-invalid-border-color'),
        select: tokenColor('--vf-select-invalid-border-color'),
      },
      focusShadow: {
        input: focusShadow(),
        textarea: focusShadow(),
        select: focusShadow(),
      },
      selectOptionDisabledColor: tokenColor('--vf-select-option-disabled-color'),
      selectedTab: {
        base: tokenColor('--vf-tabs-tab-active-background'),
        hover: tokenColor('--vf-color-background-surface-selected-hover'),
        active: tokenColor('--vf-color-background-surface-selected-active'),
      },
      secondaryControlBorder: tokenColor('--vf-color-border-interactive'),
      disabledNavigation: disabledExpected,
      rawTokens: {
        focusRing: getComputedStyle(root).getPropertyValue('--vf-color-focus-ring').trim(),
        selectedHover: getComputedStyle(root)
          .getPropertyValue('--vf-color-background-surface-selected-hover')
          .trim(),
        selectedActive: getComputedStyle(root)
          .getPropertyValue('--vf-color-background-surface-selected-active')
          .trim(),
      },
    },
  };
})()`;

function validateComputedStateMatrix(mode, matrix) {
  for (const key of ['input', 'textarea', 'select']) {
    const actual = matrix.forcedFocus.elements[key];
    assert(
      actual.borderColor === matrix.expected.invalidBorder[key],
      `${mode} state matrix: ${key} invalid border lost to focus/open cascade (${actual.borderColor} !== ${matrix.expected.invalidBorder[key]})`,
    );
    assert(
      actual.boxShadow === matrix.expected.focusShadow[key],
      `${mode} state matrix: ${key} focus material is missing (${actual.boxShadow} !== ${matrix.expected.focusShadow[key]}; :focus=${actual.focus}; :focus-visible=${actual.focusVisible})`,
    );
  }

  const disabledOption = matrix.forcedHover.elements.selectOption;
  assert(
    disabledOption.color === matrix.expected.selectOptionDisabledColor,
    `${mode} state matrix: disabled Select option lost its disabled foreground on hover`,
  );
  assert(
    disabledOption.backgroundColor === matrix.baseline.elements.selectOption.backgroundColor,
    `${mode} state matrix: disabled Select option acquired a hover background`,
  );

  for (const key of ['secondaryButton', 'secondaryIconButton']) {
    assert(
      matrix.baseline.elements[key].borderColor === matrix.expected.secondaryControlBorder,
      `${mode} state matrix: ${key} lost the interactive control boundary`,
    );
  }

  assert(
    matrix.baseline.elements.selectedTab.backgroundColor === matrix.expected.selectedTab.base,
    `${mode} state matrix: selected tab base material drifted`,
  );
  assert(
    matrix.forcedHover.elements.selectedTab.backgroundColor === matrix.expected.selectedTab.hover,
    `${mode} state matrix: selected + hover material drifted`,
  );
  assert(
    matrix.forcedActive.elements.selectedTab.backgroundColor === matrix.expected.selectedTab.active,
    `${mode} state matrix: selected + active material drifted`,
  );

  for (const key of ['dropdownNative', 'dropdownLink', 'navNative', 'navLink', 'menuNative', 'menuLink']) {
    const baseline = matrix.baseline.elements[key];
    const forced = matrix.forcedHover.elements[key];
    for (const property of ['color', 'backgroundColor', 'borderColor']) {
      assert(
        forced[property] === matrix.expected.disabledNavigation[property],
        `${mode} state matrix: ${key} ${property} escaped the disabled material`,
      );
      assert(
        forced[property] === baseline[property],
        `${mode} state matrix: ${key} ${property} changed under forced hover + active`,
      );
    }
    assert(forced.cursor === 'not-allowed', `${mode} state matrix: ${key} disabled cursor drifted`);
  }
}

async function runComputedStateMatrix(mode) {
  await evaluate(`(() => {
    document.querySelector('#vf-phase2-state-matrix')?.remove();
    const host = document.createElement('div');
    host.innerHTML = ${JSON.stringify(stateMatrixMarkup)};
    document.body.append(host.firstElementChild);
    return true;
  })()`);

  const forcedSelectors = [
    stateMatrixSelectors.input,
    stateMatrixSelectors.textarea,
    stateMatrixSelectors.select,
    stateMatrixSelectors.selectOption,
    stateMatrixSelectors.selectedTab,
    stateMatrixSelectors.dropdownNative,
    stateMatrixSelectors.dropdownLink,
    stateMatrixSelectors.navNative,
    stateMatrixSelectors.navLink,
    stateMatrixSelectors.menuNative,
    stateMatrixSelectors.menuLink,
  ];
  const { root } = await send('DOM.getDocument', { depth: 0 });
  const forcedNodeIds = new Map();
  for (const selector of forcedSelectors) {
    const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
    assert(nodeId, `State-matrix fixture node is missing: ${selector}`);
    forcedNodeIds.set(selector, nodeId);
  }

  try {
    const baseline = await evaluate(stateMatrixSnapshotExpression);

    for (const selector of [stateMatrixSelectors.input, stateMatrixSelectors.textarea, stateMatrixSelectors.select]) {
      await forcePseudoState(forcedNodeIds.get(selector), selector, ['focus', 'focus-visible']);
    }
    await forcePseudoState(forcedNodeIds.get(stateMatrixSelectors.selectOption), stateMatrixSelectors.selectOption, [
      'hover',
    ]);
    await forcePseudoState(forcedNodeIds.get(stateMatrixSelectors.selectedTab), stateMatrixSelectors.selectedTab, [
      'hover',
    ]);
    for (const selector of [
      stateMatrixSelectors.dropdownNative,
      stateMatrixSelectors.dropdownLink,
      stateMatrixSelectors.navNative,
      stateMatrixSelectors.navLink,
      stateMatrixSelectors.menuNative,
      stateMatrixSelectors.menuLink,
    ]) {
      await forcePseudoState(forcedNodeIds.get(selector), selector, ['hover', 'active']);
    }
    const forcedHover = await evaluate(stateMatrixSnapshotExpression);
    await forcePseudoState(forcedNodeIds.get(stateMatrixSelectors.selectedTab), stateMatrixSelectors.selectedTab, [
      'active',
    ]);
    const forcedActive = await evaluate(stateMatrixSnapshotExpression);

    const matrix = {
      source: 'synthetic fixtures using the current page stylesheet',
      driver: 'Chrome DevTools Protocol CSS.forcePseudoState',
      baseline,
      forcedFocus: forcedHover,
      forcedHover,
      forcedActive,
      expected: forcedHover.expected,
    };
    validateComputedStateMatrix(mode, matrix);
    return matrix;
  } finally {
    for (const selector of forcedSelectors) {
      try {
        await forcePseudoState(forcedNodeIds.get(selector), selector, []);
      } catch {
        // Fixture cleanup is best-effort after a failed assertion or navigation.
      }
    }
    await evaluate(`document.querySelector('#vf-phase2-state-matrix')?.remove(); true`);
  }
}

async function capture(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const contents = Buffer.from(result.data, 'base64');
  const filename = `${name}.png`;
  const outputPath = resolve(outputDirectory, filename);

  if (baselineDirectory) {
    const baselinePath = resolve(baselineDirectory, filename);
    assert(existsSync(baselinePath), `Missing visual baseline: ${baselinePath}`);
    assert(contents.equals(readFileSync(baselinePath)), `Visual baseline differs: ${filename}`);
  }

  writeFileSync(outputPath, contents);

  return {
    filename,
    bytes: contents.length,
    sha256: createHash('sha256').update(contents).digest('hex'),
  };
}

const validationExpressions = {
  colors: `(() => {
    const panels = [...document.querySelectorAll('.color-system__theme')];
    const primitives = document.querySelectorAll('.color-system__primitive');
    const codeBlocks = [...document.querySelectorAll('.color-system__theme .vf-codeblock')];
    const buttons = [...document.querySelectorAll('.color-system__theme .vf-button')];
    buttons[0]?.focus();
    buttons[0]?.scrollIntoView({ block: 'center' });
    return {
      primitiveCount: primitives.length,
      panelCount: panels.length,
      alertCount: document.querySelectorAll('.color-system__theme .vf-alert').length,
      semanticSwatchCount: document.querySelectorAll('.color-system__semantic').length,
      codeBlockCount: codeBlocks.length,
      highlightedTokenCount: document.querySelectorAll('.color-system__theme .vf-codeblock__shiki-token').length,
      panelModes: panels.map((panel) => panel.getAttribute('data-vf-theme')),
      panelBackgrounds: panels.map((panel) => getComputedStyle(panel).backgroundColor),
      codeBlockModes: codeBlocks.map((block) => block.getAttribute('data-vf-resolved-theme')),
      alertIconCount: document.querySelectorAll('.color-system__theme .vf-alert__icon').length,
      checkboxMarkCount: document.querySelectorAll('.color-system__theme .vf-checkbox__mark').length,
      documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      focused: document.activeElement?.classList.contains('vf-button') ?? false,
    };
  })()`,
  core: `(() => {
    const root = document.documentElement;
    const button = [...document.querySelectorAll('.vf-button')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && !element.disabled;
    });
    button?.focus();
    button?.scrollIntoView({ block: 'center' });
    return {
      componentCount: document.querySelectorAll('[class^="vf-"], [class*=" vf-"]').length,
      focusRing: getComputedStyle(root).getPropertyValue('--vf-color-focus-ring').trim(),
      interactiveBorder: getComputedStyle(root).getPropertyValue('--vf-color-border-interactive').trim(),
      invalidStateCount: document.querySelectorAll('[class*="--invalid"]').length,
      focused: document.activeElement === button,
      buttonBackground: button ? getComputedStyle(button).backgroundColor : '',
    };
  })()`,
  codeblock: `(() => {
    const block = [...document.querySelectorAll('.vf-codeblock')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    const pre = block?.querySelector('.vf-codeblock__pre');
    const copy = block?.querySelector('.vf-codeblock__copy:not(:disabled)');
    copy?.focus();
    block?.scrollIntoView({ block: 'center' });
    return {
      visible: Boolean(block && block.getBoundingClientRect().width > 0 && block.getBoundingClientRect().height > 0),
      resolvedTheme: block?.getAttribute('data-vf-resolved-theme'),
      highlightedTokenCount: block?.querySelectorAll('.vf-codeblock__shiki-token').length ?? 0,
      background: block ? getComputedStyle(block).backgroundColor : '',
      codeBackground: pre ? getComputedStyle(pre).backgroundColor : '',
      syntaxBackground: block ? getComputedStyle(block).getPropertyValue('--vf-codeblock-syntax-background').trim() : '',
      copyFocused: document.activeElement === copy,
      copyOutline: copy ? getComputedStyle(copy).outlineStyle : '',
    };
  })()`,
  playground: `(() => {
    const playground = [...document.querySelectorAll('.vf-playground')].find((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    playground?.scrollIntoView({ block: 'center' });
    return {
      visible: Boolean(playground && playground.getBoundingClientRect().width > 0 && playground.getBoundingClientRect().height > 0),
      resolvedTheme: playground?.getAttribute('data-vf-resolved-theme'),
      background: playground ? getComputedStyle(playground).backgroundColor : '',
      border: playground ? getComputedStyle(playground).borderColor : '',
      codeBlockCount: playground?.querySelectorAll('.vf-codeblock').length ?? 0,
      iframeCount: document.querySelectorAll('.vf-playground__iframe').length,
    };
  })()`,
};

function validateSnapshot(route, mode, snapshot) {
  if (route === 'colors') {
    assert(snapshot.primitiveCount === 66, `${mode} colors: expected 66 primitives`);
    assert(snapshot.panelCount === 2, `${mode} colors: scoped light/dark panels are missing`);
    assert(snapshot.alertCount === 10, `${mode} colors: status examples are incomplete`);
    assert(snapshot.semanticSwatchCount === 170, `${mode} colors: semantic token matrix is incomplete`);
    assert(snapshot.codeBlockCount === 2, `${mode} colors: scoped CodeBlocks are missing`);
    assert(snapshot.highlightedTokenCount > 0, `${mode} colors: syntax highlighting did not finish`);
    assert(snapshot.panelModes.join(',') === 'light,dark', `${mode} colors: scoped mode order drifted`);
    assert(snapshot.codeBlockModes.join(',') === 'light,dark', `${mode} colors: CodeBlock scope drifted`);
    assert(snapshot.panelBackgrounds[0] !== snapshot.panelBackgrounds[1], `${mode} colors: mode surfaces collapsed`);
    assert(snapshot.alertIconCount === 10, `${mode} colors: status icon cues are incomplete`);
    assert(snapshot.checkboxMarkCount === 2, `${mode} colors: selected shape cues are incomplete`);
    assert(!snapshot.documentOverflow, `${mode} colors: document has horizontal overflow`);
    assert(snapshot.focused, `${mode} colors: a control could not receive focus`);
  } else if (route === 'core') {
    assert(snapshot.componentCount > 100, `${mode} core: showcase did not render`);
    assert(snapshot.focusRing, `${mode} core: focus token is missing`);
    assert(snapshot.interactiveBorder, `${mode} core: control boundary token is missing`);
    assert(snapshot.invalidStateCount > 0, `${mode} core: invalid states are absent`);
    assert(snapshot.focused, `${mode} core: a control could not receive focus`);
    assert(snapshot.buttonBackground !== 'rgba(0, 0, 0, 0)', `${mode} core: primary control is transparent`);
  } else if (route === 'codeblock') {
    assert(snapshot.visible, `${mode} CodeBlock: component is not visible`);
    assert(snapshot.resolvedTheme === mode, `${mode} CodeBlock: inherited mode drifted`);
    assert(snapshot.highlightedTokenCount > 0, `${mode} CodeBlock: Shiki tokens are absent`);
    assert(snapshot.background === snapshot.codeBackground, `${mode} CodeBlock: editor backgrounds diverged`);
    assert(snapshot.syntaxBackground, `${mode} CodeBlock: syntax background is missing`);
    assert(snapshot.copyFocused, `${mode} CodeBlock: copy action could not receive focus`);
    assert(snapshot.copyOutline !== 'none', `${mode} CodeBlock: copy focus indicator is absent`);
  } else if (route === 'playground') {
    assert(snapshot.visible, `${mode} Playground: component is not visible`);
    assert(snapshot.resolvedTheme === mode, `${mode} Playground: inherited mode drifted`);
    assert(snapshot.background !== 'rgba(0, 0, 0, 0)', `${mode} Playground: surface is transparent`);
    assert(snapshot.border, `${mode} Playground: border is missing`);
    assert(snapshot.codeBlockCount > 0 || snapshot.iframeCount > 0, `${mode} Playground: no content surface rendered`);
  }
}

await send('Page.enable');
await send('Runtime.enable');
await send('DOM.enable');
await send('CSS.enable');
await send('Log.enable');
await send('Network.enable');

const report = {
  origin: showcaseOrigin,
  baselineDirectory,
  snapshots: [],
  screenshots: [],
  cvdScreenshots: [],
  browserErrors,
  networkErrors,
};

try {
  for (const viewport of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
    });

    for (const route of routes) {
      await navigate(route.pathname, route.readySelector);
      for (const mode of ['light', 'dark']) {
        await setMode(mode, route.readySelector);
        if (route.name === 'codeblock') {
          await forceSelectorPseudoState('.vf-codeblock__copy:not(:disabled)', ['focus', 'focus-visible']);
        }
        const snapshot = await evaluate(validationExpressions[route.name]);
        if (route.name === 'core') {
          snapshot.computedStateMatrix = await runComputedStateMatrix(mode);
        }
        validateSnapshot(route.name, mode, snapshot);
        await sleep(250);

        const id = `${viewport.name}-${mode}-${route.name}`;
        report.snapshots.push({ id, ...snapshot });
        report.screenshots.push(await capture(`vueforge-phase2-${id}`));
      }
    }
  }

  await send('Emulation.setDeviceMetricsOverride', {
    width: viewports[0].width,
    height: viewports[0].height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await navigate('/colors', '.color-system__theme-grid');
  for (const deficiency of ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia']) {
    for (const mode of ['light', 'dark']) {
      await setMode(mode, '.color-system__theme-grid');
      const cvdSnapshot = await evaluate(`(() => {
        const panel = [...document.querySelectorAll('.color-system__theme')].find(
          (candidate) => candidate.getAttribute('data-vf-theme') === ${JSON.stringify(mode)},
        );
        const statuses = panel?.querySelector('.color-system__statuses');
        const invalidInput = panel?.querySelector('[data-phase2-state="invalid-input"]');
        invalidInput?.focus();
        statuses?.scrollIntoView({ block: 'center' });
        return {
          panelMode: panel?.getAttribute('data-vf-theme') ?? '',
          statusCount: statuses?.querySelectorAll('.vf-alert').length ?? 0,
          invalidInputFocused: document.activeElement === invalidInput,
          scrollY: window.scrollY,
        };
      })()`);
      assert(cvdSnapshot.panelMode === mode, `${mode} CVD: matching scoped panel is missing`);
      assert(cvdSnapshot.statusCount === 5, `${mode} CVD: status cues are incomplete`);
      assert(cvdSnapshot.invalidInputFocused, `${mode} CVD: invalid focus cue is unavailable`);
      await sleep(100);
      await send('Emulation.setEmulatedVisionDeficiency', { type: deficiency });
      report.cvdScreenshots.push({
        deficiency,
        mode,
        ...cvdSnapshot,
        ...(await capture(`vueforge-phase2-desktop-${mode}-colors-${deficiency}`)),
      });
    }
  }
  await send('Emulation.setEmulatedVisionDeficiency', { type: 'none' });

  assert(browserErrors.length === 0, `Browser errors: ${browserErrors.join(' | ')}`);
  assert(networkErrors.length === 0, `Showcase network errors: ${networkErrors.join(' | ')}`);
  writeFileSync(resolve(outputDirectory, 'manifest.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Phase 2 visual smoke passed. Artifacts: ${outputDirectory}`);
} finally {
  socket.close();
}
