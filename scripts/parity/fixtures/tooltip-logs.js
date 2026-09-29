// The neutral VfTooltip logs the parity snapshot reads (M31).
//
// One source for both render targets: the Vue fixture imports it and the Razor
// fixture inlines it, so the two cannot keep their evidence differently. It
// records, per case, from the moment the page is ready:
//
//   - every activation and deactivation of a tooltip wrapper - mouseenter and
//     focusin, mouseleave and focusout - with the path it came by. These are
//     the events that open and close a tooltip, so they are what arms the
//     timing evidence; pointerdown and keydown, which arm the popover's and
//     the dropdown's logs, never happen on a hover or a programmatic focus;
//   - every aria-describedby a trigger gains or loses;
//   - every enter and leave a tooltip node goes through, with its duration
//     from the node's own class changes and whether it began on its -from
//     frame - the frame a reduced-motion screenshot never sees;
//   - every keydown, with whether the product prevented it. A navigation key
//     or Escape the product left unhandled is then swallowed, after it was
//     recorded: headless Chrome hides a tab for good when one reaches it.
//
// Instances are numbered as the snapshot numbers them: the case root's
// tooltips in document order, then those inside the case's open popover
// panels.
export function installTooltipLogs(delays) {
  const logs = (window.__parityTooltipLogs = {});
  const transitions = (window.__parityTooltipTransitions = {});
  const keys = (window.__parityTooltipKeys = []);
  window.__parityTooltipDelays = delays;

  const ready = () => document.documentElement.getAttribute('data-parity-ready') === 'true';
  const caseOf = (element) => {
    const direct = element.closest('[data-parity-case]');
    if (direct) return direct;
    const panel = element.closest('.vf-popover__content');
    const owner = panel ? document.querySelector('[aria-controls="' + panel.id + '"]') : null;
    return owner ? owner.closest('[data-parity-case]') : null;
  };
  const instancesOf = (caseRoot) => {
    const panels = [...caseRoot.querySelectorAll('.vf-popover__trigger')]
      .map((trigger) => document.getElementById(trigger.getAttribute('aria-controls')))
      .filter((panel) => panel && !caseRoot.contains(panel));
    return [
      ...caseRoot.querySelectorAll('.vf-tooltip'),
      ...panels.flatMap((panel) => [...panel.querySelectorAll('.vf-tooltip')]),
    ];
  };
  const locate = (root) => {
    const caseRoot = caseOf(root);
    return caseRoot
      ? { caseId: caseRoot.getAttribute('data-parity-case'), instance: instancesOf(caseRoot).indexOf(root) }
      : null;
  };
  const record = (root, entry) => {
    if (!ready()) return;
    const where = locate(root);
    if (where) (logs[where.caseId] ??= []).push({ ...entry, instance: where.instance, t: performance.now() });
  };

  const onWrapper = (kind, via) => (event) => {
    if (event.target instanceof Element && event.target.matches('.vf-tooltip')) record(event.target, { kind, via });
  };
  const inWrapper = (kind, via) => (event) => {
    const root = event.target instanceof Element ? event.target.closest('.vf-tooltip') : null;
    if (root) record(root, { kind, via });
  };
  document.addEventListener('mouseenter', onWrapper('activate', 'pointer'), true);
  document.addEventListener('mouseleave', onWrapper('deactivate', 'pointer'), true);
  document.addEventListener('focusin', inWrapper('activate', 'focus'), true);
  document.addEventListener('focusout', inWrapper('deactivate', 'focus'), true);

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

  const running = new Map();
  const owners = new WeakMap();
  const phase = (element) =>
    !element.isConnected
      ? 'removed'
      : [...element.classList].some((name) => name.startsWith('vf-floating-transition-leave'))
        ? 'leave'
        : [...element.classList].some((name) => name.startsWith('vf-floating-transition-enter'))
          ? 'enter'
          : 'none';
  new MutationObserver((records) => {
    if (!ready()) return;
    const now = performance.now();
    for (const record of records) {
      if (record.type === 'attributes' && record.attributeName === 'aria-describedby') {
        const trigger = record.target;
        if (!(trigger instanceof Element) || !trigger.matches('.vf-tooltip__trigger')) continue;
        const described = trigger.hasAttribute('aria-describedby');
        if (described === (record.oldValue !== null)) continue;
        const where = locate(trigger.parentElement);
        if (where)
          (logs[where.caseId] ??= []).push({
            kind: described ? 'describe' : 'undescribe',
            instance: where.instance,
            t: now,
          });
        continue;
      }
      const nodes = record.type === 'childList' ? [...record.addedNodes, ...record.removedNodes] : [record.target];
      for (const node of nodes) {
        if (!(node instanceof HTMLElement) || !node.matches('.vf-tooltip__content')) continue;
        if (!owners.has(node) && node.isConnected) {
          const trigger = document.querySelector('[aria-describedby="' + node.id + '"]');
          const where = trigger ? locate(trigger.parentElement) : null;
          if (where) owners.set(node, where);
        }
        const where = owners.get(node);
        if (!where) continue;
        const state = phase(node);
        const current = running.get(node);
        if (current && (current.kind === 'enter' ? state !== 'enter' : state === 'removed')) {
          current.ms = Math.round(now - current.start);
          running.delete(node);
        }
        if (!running.has(node) && (state === 'enter' || state === 'leave')) {
          const entry = {
            kind: state,
            framed: node.classList.contains('vf-floating-transition-' + state + '-from'),
            instance: where.instance,
            start: now,
            ms: null,
          };
          (transitions[where.caseId] ??= []).push(entry);
          running.set(node, entry);
        }
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeOldValue: true,
    attributeFilter: ['class', 'aria-describedby'],
  });
}
