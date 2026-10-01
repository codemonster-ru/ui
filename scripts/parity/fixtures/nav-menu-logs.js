// The neutral VfNavMenu logs the parity snapshot reads (M33).
//
// One source for both render targets, as the tooltip's logs are: the Vue
// fixture imports it and the Razor fixture inlines it, so the two cannot keep
// their evidence differently. From the moment the page is ready it records,
// per case:
//
//   - every collapse wrapper's life, sampled once per animation frame: its
//     transition classes (every class that is not the component's own `vf-`
//     class), its inline height (zero, the element's scroll height, empty or
//     something else), opacity, overflow and transition, and `removed` once
//     it leaves the document. A state is recorded only when it differs from
//     the last one. The sampler's frame callback is always the first of its
//     frame - it re-arms itself inside the previous one - so it sees each
//     frame's state before any product callback of that frame runs: the
//     state a collapse is inserted in, the state its first hook frame wrote,
//     and so on. A transition that ends on the element's computed duration
//     and one that ends on a fixed timer leave different sequences behind;
//   - every change the component announced, through `record`, which each
//     fixture calls from its own event transport;
//   - every keydown, with whether the product prevented it. A navigation key
//     the product left unhandled is then swallowed, after it was recorded.
export function installNavMenuLogs() {
  const logs = (window.__parityNavMenuLogs = {});
  const events = (window.__parityNavMenuEvents = {});
  const keys = (window.__parityNavMenuKeys = []);
  const ready = () => document.documentElement.getAttribute('data-parity-ready') === 'true';

  window.__parityNavMenuRecord = (element, value) => {
    const caseRoot = element.closest('[data-parity-case]');
    if (!caseRoot || !ready()) return;
    const instance = [...caseRoot.querySelectorAll('nav.vf-nav-menu')].indexOf(element.closest('nav.vf-nav-menu'));
    (events[caseRoot.getAttribute('data-parity-case')] ??= []).push({ instance, value });
  };

  const entries = new WeakMap();
  const swallowed = new Set([
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Home',
    'End',
    'PageUp',
    'PageDown',
    'Escape',
  ]);
  document.addEventListener(
    'keydown',
    (event) => {
      const entry = { key: event.key, prevented: false };
      keys.push(entry);
      entries.set(event, entry);
    },
    true,
  );
  window.addEventListener('keydown', (event) => {
    const entry = entries.get(event);
    if (entry) entry.prevented = event.defaultPrevented;
    if (!event.defaultPrevented && swallowed.has(event.key)) event.preventDefault();
  });

  const height = (element) => {
    const value = element.style.height;
    if (value === '') return '';
    if (value === '0px') return '0';
    return value === `${element.scrollHeight}px` ? 'scroll' : 'other';
  };
  const state = (element) =>
    [
      [...element.classList]
        .filter((name) => !name.startsWith('vf-'))
        .sort()
        .join(' '),
      'h:' + height(element),
      'o:' + element.style.opacity,
      'ov:' + element.style.overflow,
      't:' +
        (element.style.transition === ''
          ? ''
          : /^height .*, opacity /.test(element.style.transition)
            ? 'collapse'
            : 'other'),
    ].join('|');
  const live = new Map();
  const sample = () => {
    requestAnimationFrame(sample);
    if (!ready()) return;
    const seen = new Set();
    for (const element of document.querySelectorAll('[data-parity-case] .vf-nav-menu__collapse')) {
      seen.add(element);
      let record = live.get(element);
      if (!record) {
        const caseRoot = element.closest('[data-parity-case]');
        const owner = element.parentElement?.querySelector(':scope > .vf-nav-menu__item .vf-nav-menu__label');
        record = { owner: owner?.textContent ?? null, states: [] };
        (logs[caseRoot.getAttribute('data-parity-case')] ??= []).push(record);
        live.set(element, record);
      }
      const current = state(element);
      if (record.states.at(-1) !== current) record.states.push(current);
    }
    for (const [element, record] of live) {
      if (seen.has(element)) continue;
      record.states.push('removed');
      live.delete(element);
    }
  };
  requestAnimationFrame(sample);
}
