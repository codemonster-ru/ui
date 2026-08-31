import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cmShellAttributes,
  resolveMobileToggleLabel,
  shellEscapeState,
  shouldEnterAdvance,
  toggleShellMobileSidebar,
  toggleShellSidebar,
} from '../dist/core/index.js';

const closed = { mobileSidebarOpen: false, sidebarCollapsed: false };

test('the attribute names are shared so both adapters spell them the same', () => {
  assert.equal(cmShellAttributes.sidebarCollapsed, 'data-cm-sidebar-collapsed');
  assert.equal(cmShellAttributes.mobileSidebarOpen, 'data-cm-mobile-sidebar-open');
});

test('the mobile toggle names the action, not the state', () => {
  const labels = { close: 'Close navigation', open: 'Open navigation' };
  assert.equal(resolveMobileToggleLabel(false, labels), 'Open navigation');
  assert.equal(resolveMobileToggleLabel(true, labels), 'Close navigation');
});

test('escape closes the mobile drawer', () => {
  assert.deepEqual(shellEscapeState({ ...closed, mobileSidebarOpen: true }), closed);
});

test('escape leaves a collapsed sidebar alone, because that is a preference', () => {
  const collapsed = { mobileSidebarOpen: true, sidebarCollapsed: true };
  assert.deepEqual(shellEscapeState(collapsed), { mobileSidebarOpen: false, sidebarCollapsed: true });
});

test('escape does nothing when no drawer is open', () => {
  assert.equal(shellEscapeState(closed), null);
  assert.equal(shellEscapeState({ ...closed, sidebarCollapsed: true }), null);
});

test('toggling one part of the state leaves the other alone', () => {
  assert.deepEqual(toggleShellSidebar(closed), { mobileSidebarOpen: false, sidebarCollapsed: true });
  assert.deepEqual(toggleShellMobileSidebar(closed), { mobileSidebarOpen: true, sidebarCollapsed: false });
  assert.deepEqual(toggleShellSidebar({ mobileSidebarOpen: true, sidebarCollapsed: true }), {
    mobileSidebarOpen: true,
    sidebarCollapsed: false,
  });
});

test('enter advances from a single-line text field', () => {
  assert.equal(shouldEnterAdvance({ tagName: 'INPUT', inputType: 'text' }), true);
  assert.equal(shouldEnterAdvance({ tagName: 'INPUT', inputType: 'email' }), true);
  assert.equal(shouldEnterAdvance({ tagName: 'DIV' }), true);
  assert.equal(shouldEnterAdvance({}), true);
});

test('enter belongs to the field where the field uses it', () => {
  assert.equal(shouldEnterAdvance({ tagName: 'TEXTAREA' }), false);
  assert.equal(shouldEnterAdvance({ tagName: 'SELECT' }), false);
  assert.equal(shouldEnterAdvance({ editable: true }), false);
  assert.equal(shouldEnterAdvance({ tagName: 'INPUT', inputType: 'checkbox' }), false);
  assert.equal(shouldEnterAdvance({ tagName: 'INPUT', inputType: 'radio' }), false);
});

test('enter is left to a control that is already about to act on it', () => {
  assert.equal(shouldEnterAdvance({ interactive: true }), false);
  assert.equal(shouldEnterAdvance({ interactive: true, tagName: 'INPUT', inputType: 'text' }), false);
});
