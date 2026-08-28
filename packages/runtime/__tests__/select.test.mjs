import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { CmRuntime, createCmSelectController } from '../dist/index.js';

const markup = `
  <div class="cm-select-wrap" data-cm-controller="select">
    <input type="hidden" name="frequency" value="">
    <button class="cm-select cm-select--md" id="frequency" type="button" role="combobox"
      aria-haspopup="listbox" aria-controls="frequency-listbox" aria-expanded="false"
      data-cm-placeholder="Choose frequency"><span class="cm-select__value">Choose frequency</span></button>
    <button class="cm-select__clear" type="button" data-cm-select-clear hidden>&times;</button>
    <div class="cm-select__listbox" id="frequency-listbox" role="listbox" hidden>
      <button class="cm-select__option" type="button" role="option" tabindex="-1" aria-selected="false"
        data-cm-select-value="daily">Daily</button>
      <button class="cm-select__option" type="button" role="option" tabindex="-1" aria-selected="false"
        data-cm-select-value="weekly">Weekly</button>
      <button class="cm-select__option" type="button" role="option" tabindex="-1" aria-selected="false"
        aria-disabled="true" data-cm-select-value="never">Never</button>
    </div>
  </div>
`;

function mount() {
  const dom = new JSDOM(markup);
  const { document } = dom.window;
  new CmRuntime().register('select', createCmSelectController).start(document);
  return {
    dom,
    document,
    trigger: document.querySelector('.cm-select'),
    listbox: document.querySelector('.cm-select__listbox'),
    clear: document.querySelector('[data-cm-select-clear]'),
    input: document.querySelector('input[type="hidden"]'),
    options: [...document.querySelectorAll('.cm-select__option')],
    key: (target, key) => target.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true })),
  };
}

test('opens and closes the listbox from the trigger', () => {
  const { trigger, listbox } = mount();
  assert.equal(listbox.hidden, true);
  trigger.click();
  assert.equal(listbox.hidden, false);
  assert.equal(trigger.getAttribute('aria-expanded'), 'true');
  trigger.click();
  assert.equal(listbox.hidden, true);
  assert.equal(trigger.getAttribute('aria-expanded'), 'false');
});

test('opens from the keyboard and focuses the first selectable option', () => {
  const { trigger, listbox, options, key, document } = mount();
  key(trigger, 'ArrowDown');
  assert.equal(listbox.hidden, false);
  assert.equal(document.activeElement, options[0]);
});

test('moves between selectable options and skips the disabled one', () => {
  const { trigger, options, key, document } = mount();
  key(trigger, 'ArrowDown');
  key(options[0], 'ArrowDown');
  assert.equal(document.activeElement, options[1]);
  key(options[1], 'ArrowDown');
  assert.equal(document.activeElement, options[0], 'wraps past the disabled option');
  key(options[0], 'End');
  assert.equal(document.activeElement, options[1], 'End lands on the last selectable option');
});

test('commits a selection and reports it once', () => {
  const { trigger, listbox, options, input, document } = mount();
  const changes = [];
  document.addEventListener('change', () => changes.push(input.value));

  trigger.click();
  options[1].click();

  assert.equal(input.value, 'weekly');
  assert.equal(trigger.querySelector('.cm-select__value').textContent, 'Weekly');
  assert.equal(trigger.dataset.cmFilled, 'true');
  assert.equal(options[1].getAttribute('aria-selected'), 'true');
  assert.ok(options[1].classList.contains('cm-select__option--selected'));
  assert.equal(listbox.hidden, true);
  assert.equal(document.activeElement, trigger);
  assert.deepEqual(changes, ['weekly']);
});

test('refuses a disabled option', () => {
  const { trigger, listbox, options, input } = mount();
  trigger.click();
  options[2].click();
  assert.equal(input.value, '');
  assert.equal(listbox.hidden, false);
});

test('escape closes without changing the value and restores focus', () => {
  const { trigger, listbox, options, input, key, document } = mount();
  trigger.click();
  options[0].focus();
  key(options[0], 'Escape');
  assert.equal(listbox.hidden, true);
  assert.equal(input.value, '');
  assert.equal(document.activeElement, trigger);
});

test('clears the value and reports the change', () => {
  const { trigger, options, clear, input, document } = mount();
  trigger.click();
  options[0].click();
  assert.equal(clear.hidden, false);

  const changes = [];
  document.addEventListener('change', () => changes.push(input.value));
  clear.click();

  assert.equal(input.value, '');
  assert.equal(trigger.querySelector('.cm-select__value').textContent, 'Choose frequency');
  assert.equal(trigger.dataset.cmFilled, undefined);
  assert.equal(clear.hidden, true);
  assert.deepEqual(changes, ['']);
});

test('submits the committed value through the hidden input', () => {
  const { dom, document, trigger, options, input } = mount();
  trigger.click();
  options[1].click();
  const form = document.createElement('form');
  form.append(document.querySelector('.cm-select-wrap'));
  assert.equal(new dom.window.FormData(form).get('frequency'), 'weekly');
  assert.equal(input.value, 'weekly');
});

test('a pointer press outside closes the listbox', () => {
  const { document, trigger, listbox } = mount();
  trigger.click();
  document.body.dispatchEvent(new document.defaultView.Event('click', { bubbles: true }));
  assert.equal(listbox.hidden, true);
});
