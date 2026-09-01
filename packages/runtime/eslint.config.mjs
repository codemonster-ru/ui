import { createTsConfig } from '../../eslint.base.mjs';

// A controller runs against whatever document owns its element, and a page is not always one realm:
// the parity harness drives two at once. `event.target instanceof HTMLElement` compares against the
// constructor of the realm this module was loaded in, so across realms it reports false rather than
// failing -- the controller silently does nothing and reads as working code. That mistake shipped
// twice in one day before this rule existed.
//
// Restricting the value blocks `instanceof X` and `new X` while leaving type positions alone, since
// a type reference is not a value reference. Read the constructor off `root.ownerDocument.defaultView`
// instead.
const realmSensitiveGlobals = [
  'CustomEvent',
  'Element',
  'HTMLElement',
  'HTMLInputElement',
  'KeyboardEvent',
  'MouseEvent',
  'MutationObserver',
  'Node',
  'ResizeObserver',
].map((name) => ({
  name,
  message: `Read ${name} off the owning document's defaultView; the global belongs to whichever realm loaded this module.`,
}));

export default createTsConfig({
  ignores: ['dist/**', 'node_modules/**'],
  tsconfigRootDir: import.meta.dirname,
  rules: {
    'no-restricted-globals': ['error', ...realmSensitiveGlobals],
  },
});
