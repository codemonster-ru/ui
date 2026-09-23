// The negative fixtures for the VfMenu and VfMenuItem parity gates.
//
// The M27 set, and two registries rather than one, because the components own
// different things and a defect in either must never be creditable to the
// other's evidence.
//
// VfMenu is one div with a class and a role around consumer content, so its
// mutations are about the three things it can lose: the role (including the
// fact that a consumer may *replace* it), the tag and the shape of the content
// it must not touch - plus the one budget rule that carries it, that every
// focusable element in a menu is the consumer's.
//
// VfMenuItem is one native control, and the mutations that carry the milestone
// are the ones that keep the page looking like a menu item while changing what
// it is:
//
//   - the branch. A button rendered as an anchor or the reverse preserves the
//     owned-control *total* - the profile's two rules find one either way - so
//     the ownership stage alone cannot see it. The ordered DOM record and the
//     native attributes against the immutable reference are what catch it, and
//     `menu-item-button-becomes-anchor` exists to prove that;
//   - the role. Removed, substituted, or moved to a child: both ownership
//     rules declare the explicit role, so a substituted one fails by identity
//     and the explicit-role total catches one that moved;
//   - the disabled anchor, whose contract is four separate facts. Each gets
//     its own mutation, because normalising "disabled" into one rule is
//     exactly how a migration would break it;
//   - the rel. `menu-item-rel-derived-for-blank` writes the `noopener
//     noreferrer` VfLink derives and this component does not. It is the
//     milestone's headline defect and the one a tidying pass would introduce;
//   - the glyph. `browser-menu-item-glyph-swapped` replaces the `bookmark`
//     path with `filter`'s on a real Razor page. The two glyphs - and `moon`,
//     the fallback - have identical structure, identical svg presentation
//     attributes and identical wrapper styles, and differ in nothing but
//     `path[d]`. This is the first migrated component whose glyph a *consumer*
//     names, so the swap is a reachable defect and not a hypothetical one.
//
//     M27 reproduced the false PASS the way M26 did for the chevron's
//     `points`, and the reproduction has two halves that say different things.
//
//     Striking `d` from the *menuItem profile* changes nothing: both glyph
//     mutations are still detected, because extraction reads the extractor's
//     global vocabulary and not the profile's, and `d` has been in that
//     vocabulary since M07 - which the M26 note beside `points` states.
//
//     Striking `d` from the *global vocabulary* is the genuine pre-`d`
//     comparator, and there the swap is a real false PASS. Widening this
//     mutation's expectation to all sixteen dimensions reported every one of
//     the fifteen non-pixel dimensions missing, across both directions and
//     both themes: no structure, class, attribute, text, ARIA, relationship,
//     geometry or colour difference, nothing from the accessibility tree
//     because the glyph is aria-hidden, and nothing from the ownership
//     snapshot because it counts controls. The two capture mutations below
//     cannot even apply in that state - the DOM record carries no geometry to
//     change - and report that rather than counting as detections. Only the
//     screenshot fires, and a screenshot-only catch is not closure.
//
//     So `d` is load-bearing, and what this profile's declaration buys is the
//     attribute-coverage gate: it turns the global list's continued carriage
//     of `d` into an assertion, on the one component whose glyph a consumer
//     names;
//   - the three directions: a defect only current Vue has, a defect only Razor
//     has, and the same defect in both - the last caught by the reference
//     direction alone, which is why the reference is immutable.
//
// What is deliberately *not* here is a mutation for the class-order inversion
// between the two components. The extractor compares canonical and consumer
// classes as two sorted lists and does not record the raw class attribute at
// all - the position M26 recorded, because the two renderers legitimately
// serialise the same classes in different orders. A mutation of it here cannot
// apply and would prove nothing; the ordering is pinned where it is observable,
// by both characterization suites, by the PHP component tests, and by the
// characterization mutations `menu-class-order-flipped` and
// `menu-item-consumer-class-last`.
//
// Each mutation names the dimension that must catch it, and each fails the
// harness rather than counting as a detection if it cannot find what it is
// supposed to break. Nothing here touches the source tree.
//
// Capture mutations name only the DOM dimensions, and that is a property of
// the harness worth stating: a capture mutation edits the extracted DOM record
// and nothing else, so it cannot reach the ownership snapshot or the
// accessibility tree, which are measured separately on the page. The ownership
// and AX evidence is therefore exercised only by the browser mutations below,
// which change the real document before anything is measured - and that is the
// right way round, because it means no edit to a capture can forge a passing
// ownership stage.
import { eachTheme, fail, findNode, mutateElements } from './mutations.mjs';

// ---------------------------------------------------------------- VfMenu ids
const M_SPANS = 'menu/spans';
const M_EMPTY = 'menu/empty';
const M_NESTED = 'menu/nested';
const M_CONTROL = 'menu/consumer-control';
const M_CLASS = 'menu/class-and-style';
const M_ROLE = 'menu/role-override';
const M_LABEL = 'menu/aria-label';

// ------------------------------------------------------------ VfMenuItem ids
const I_BUTTON = 'menu-item/button';
const I_BUTTON_DISABLED = 'menu-item/button-disabled';
const I_ANCHOR = 'menu-item/anchor';
const I_ANCHOR_DISABLED = 'menu-item/anchor-disabled';
const I_EMPTY_HREF = 'menu-item/empty-href';
const I_ACTIVE = 'menu-item/active';
const I_DANGER = 'menu-item/danger';
const I_ICON = 'menu-item/icon';
const I_ICON_UNKNOWN = 'menu-item/icon-unknown';
const I_BLANK = 'menu-item/blank-without-rel';
const I_CLASS = 'menu-item/consumer-class-and-style';
const I_ROLE = 'menu-item/consumer-role-loses';
const I_TABINDEX_ANCHOR = 'menu-item/consumer-tabindex-anchor';

const menuRoot = (node) => node.classes.includes('vf-menu');
const item = (node) => node.classes.includes('vf-menu__item');
const glyph = (node) => node.classes.includes('vf-menu__item-icon');
const label = (node) => node.classes.includes('vf-menu__item-label');

const BOOKMARK_D = 'M7 3h10a2 2 0 0 1 2 2v16l-7-4.5L5 21V5a2 2 0 0 1 2-2Z';
const FILTER_D = 'M3 3.5h18l-7 8V20l-4-2v-6.5Z';

// ===========================================================================
// VfMenu
// ===========================================================================

export const menuParityMutations = [
  // ------------------------------------------------------------------- role
  {
    id: 'menu-role-removed',
    klass: 'aria',
    description: 'the menu root renders without role=menu, so it is a plain div in the tree',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        if (node.attributes.role !== 'menu') fail('the root did not carry role=menu');
        const { role, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-role-not-overridable',
    klass: 'aria',
    description:
      'the consumer role is ignored and role=menu is written anyway - the tidying that protects a role the reference leaves replaceable',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [M_ROLE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_ROLE, menuRoot, 'menu root');
        if (node.attributes.role !== 'list') fail('the consumer role did not win in the capture');
        node.attributes = { ...node.attributes, role: 'menu' };
      });
    },
  },
  {
    id: 'menu-role-moved-to-a-child',
    klass: 'aria',
    description: 'role=menu moves off the root onto the first child, so the menu is a div containing a menu',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        const child = node.children[0];
        if (!child) fail('the menu had no child to move the role onto');
        const { role, ...rest } = node.attributes;
        node.attributes = rest;
        child.attributes = { ...child.attributes, role: 'menu' };
      });
    },
  },

  // -------------------------------------------------------------- structure
  {
    id: 'menu-root-tag-changed',
    klass: 'structure',
    description: 'the menu root is a ul rather than a div',
    expect: { dimensions: ['dom.structure'], caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        findNode(capture, M_SPANS, menuRoot, 'menu root').tag = 'ul';
      });
    },
  },
  {
    id: 'menu-slot-wrapped',
    klass: 'structure',
    description: 'the consumer content is wrapped in a list element the reference does not render',
    expect: { dimensions: ['dom.structure'], caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        if (node.children.length !== 3) fail('the menu did not hold three children');
        node.children = [
          { tag: 'div', classes: [], consumerClasses: ['vf-menu__list'], attributes: {}, children: node.children },
        ];
      });
    },
  },
  {
    id: 'menu-child-dropped',
    klass: 'structure',
    description: 'one of the three consumer children is missing',
    expect: { dimensions: ['dom.structure'], caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        if (node.children.length !== 3) fail('the menu did not hold three children');
        node.children = node.children.slice(0, 2);
      });
    },
  },
  {
    id: 'menu-nested-content-flattened',
    klass: 'structure',
    description: 'nested consumer markup is re-parented into the root, which the menu must never do',
    expect: { dimensions: ['dom.structure'], caseIds: [M_NESTED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_NESTED, menuRoot, 'menu root');
        const group = node.children[0];
        if (!group || group.children.length === 0) fail('the nested group was not in the capture');
        node.children = group.children;
      });
    },
  },

  // ----------------------------------------------------------------- classes
  {
    id: 'menu-block-class-lost',
    klass: 'classes',
    description: 'the root loses vf-menu, so nothing the stylesheet writes reaches it',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        node.classes = node.classes.filter((name) => name !== 'vf-menu');
      });
    },
  },

  // -------------------------------------------------------------------- attrs
  {
    id: 'menu-attrs-dropped',
    klass: 'native attributes',
    description: 'a consumer aria-label never reaches the root',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-label'] }, caseIds: [M_LABEL] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_LABEL, menuRoot, 'menu root');
        if (node.attributes['aria-label'] === undefined) fail('the capture carried no aria-label');
        const { 'aria-label': dropped, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  // ------------------------------------------------------------- directional
  {
    id: 'menu-current-and-razor-identically-protect-the-role',
    klass: 'directional',
    description:
      'current Vue and Razor both ignore the consumer role and write role=menu anyway; the two adapters agree with each other and only the reference direction can see it',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['role'] },
      caseIds: [M_ROLE],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = findNode(capture, M_ROLE, menuRoot, 'menu root');
          if (node.attributes.role !== 'list') fail('the consumer role did not win in the capture');
          node.attributes = { ...node.attributes, role: 'menu' };
        });
      }
    },
  },
  {
    id: 'menu-gives-itself-a-tabindex',
    klass: 'ownership',
    description:
      'the menu writes a tabindex of its own, which makes the root focusable and breaks the consumer budget on every target at once',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['tabindex'] }, caseIds: [M_SPANS] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, M_SPANS, menuRoot, 'menu root');
        node.attributes = { ...node.attributes, tabindex: '0' };
      });
    },
  },
];

// ===========================================================================
// VfMenuItem
// ===========================================================================

export const menuItemParityMutations = [
  // ----------------------------------------------------------------- branch
  {
    id: 'menu-item-button-becomes-anchor',
    klass: 'structure',
    description:
      'the button renders as an anchor with the same role and class - the owned-control total is unchanged, so only the ordered DOM and the native attributes see it',
    expect: { dimensions: ['dom.structure', 'dom.nativeAttributes'], caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, item, 'menu item');
        if (node.tag !== 'button') fail('the capture did not carry a button');
        node.tag = 'a';
        const { type, ...rest } = node.attributes;
        node.attributes = { ...rest, href: '/edit' };
      });
    },
  },
  {
    id: 'menu-item-anchor-becomes-button',
    klass: 'structure',
    description: 'the anchor renders as a button with the same role and class, its destination gone',
    expect: { dimensions: ['dom.structure', 'dom.nativeAttributes'], caseIds: [I_ANCHOR] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR, item, 'menu item');
        if (node.tag !== 'a') fail('the capture did not carry an anchor');
        node.tag = 'button';
        const { href, ...rest } = node.attributes;
        node.attributes = { ...rest, type: 'button' };
      });
    },
  },
  {
    id: 'menu-item-becomes-a-div-with-the-role',
    klass: 'structure',
    description: 'the control is a div carrying role=menuitem, which the tree still calls a menuitem',
    expect: { dimensions: ['dom.structure'], caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, item, 'menu item');
        node.tag = 'div';
        const { type, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-empty-href-becomes-an-anchor',
    klass: 'structure',
    description: "href='' renders an anchor with an empty href, which is VfLink's rule applied where it does not belong",
    expect: { dimensions: ['dom.structure', 'dom.nativeAttributes'], caseIds: [I_EMPTY_HREF] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_EMPTY_HREF, item, 'menu item');
        if (node.tag !== 'button') fail('the capture did not carry the button branch');
        node.tag = 'a';
        const { type, ...rest } = node.attributes;
        node.attributes = { ...rest, href: '' };
      });
    },
  },
  {
    id: 'menu-item-type-button-removed',
    klass: 'native attributes',
    description: 'the button loses type=button, the attribute that identifies its branch',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['type'] }, caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, item, 'menu item');
        if (node.attributes.type !== 'button') fail('the capture carried no type=button');
        const { type, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },

  // ------------------------------------------------------------------- role
  {
    id: 'menu-item-role-removed',
    klass: 'aria',
    description: 'the control loses role=menuitem and is announced as a plain button',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, item, 'menu item');
        if (node.attributes.role !== 'menuitem') fail('the capture carried no role=menuitem');
        const { role, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-role-substituted',
    klass: 'aria',
    description: 'the control carries role=option rather than role=menuitem',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [I_ANCHOR] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR, item, 'menu item');
        node.attributes = { ...node.attributes, role: 'option' };
      });
    },
  },
  {
    id: 'menu-item-role-moved-to-the-label',
    klass: 'aria',
    description: 'role=menuitem moves off the control onto the label span inside it',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, item, 'menu item');
        const span = node.children.find(label);
        if (!span) fail('the item had no label span');
        const { role, ...rest } = node.attributes;
        node.attributes = rest;
        span.attributes = { ...span.attributes, role: 'menuitem' };
      });
    },
  },
  {
    id: 'menu-item-consumer-role-wins',
    klass: 'aria',
    description:
      'the consumer role overrides role=menuitem, as it does on VfMenu - the inversion that must not be normalised',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['role'] }, caseIds: [I_ROLE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ROLE, item, 'menu item');
        if (node.attributes.role !== 'menuitem') fail('the component role did not win in the capture');
        node.attributes = { ...node.attributes, role: 'option' };
      });
    },
  },

  // --------------------------------------------------------------- disabled
  {
    id: 'menu-item-disabled-anchor-keeps-href',
    klass: 'native attributes',
    description: 'the disabled anchor keeps its href and stays a working link',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['href'] }, caseIds: [I_ANCHOR_DISABLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR_DISABLED, item, 'menu item');
        if (node.attributes.href !== undefined) fail('the disabled anchor already carried an href');
        node.attributes = { ...node.attributes, href: '/docs' };
      });
    },
  },
  {
    id: 'menu-item-disabled-anchor-loses-target-and-rel',
    klass: 'native attributes',
    description: 'the disabled anchor drops target and rel along with its href, which the reference keeps',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['target'] },
      caseIds: [I_ANCHOR_DISABLED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR_DISABLED, item, 'menu item');
        if (node.attributes.target !== '_blank') fail('the disabled anchor carried no target');
        const { target, rel, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-disabled-anchor-loses-tabindex',
    klass: 'native attributes',
    description: 'the disabled anchor keeps its place in the tab order',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [I_ANCHOR_DISABLED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR_DISABLED, item, 'menu item');
        if (node.attributes.tabindex !== '-1') fail('the disabled anchor carried no tabindex=-1');
        const { tabindex, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-disabled-anchor-loses-aria-disabled',
    klass: 'aria',
    description: 'the disabled anchor loses aria-disabled, which is the whole of its disabled semantics',
    expect: {
      dimensions: ['dom.aria'],
      details: { 'dom.aria': ['aria-disabled'] },
      caseIds: [I_ANCHOR_DISABLED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ANCHOR_DISABLED, item, 'menu item');
        if (node.attributes['aria-disabled'] !== 'true') fail('the disabled anchor carried no aria-disabled');
        const { 'aria-disabled': dropped, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-disabled-button-loses-disabled',
    klass: 'native attributes',
    description: 'the disabled button loses its native attribute and becomes operable',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['disabled'] },
      caseIds: [I_BUTTON_DISABLED],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON_DISABLED, item, 'menu item');
        if (node.attributes.disabled === undefined) fail('the disabled button carried no disabled attribute');
        const { disabled, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-disabled-gains-a-modifier',
    klass: 'classes',
    description: 'a disabled item gains a --disabled modifier, which no stylesheet selects and the reference never wrote',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [I_BUTTON_DISABLED] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON_DISABLED, item, 'menu item');
        node.classes = [...node.classes, 'vf-menu__item--disabled'].sort();
      });
    },
  },

  // -------------------------------------------------------------------- rel
  {
    id: 'menu-item-rel-derived-for-blank',
    klass: 'native attributes',
    description:
      "target=_blank gains the noopener noreferrer VfLink derives - the milestone's headline defect, and the one a tidying pass introduces",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [I_BLANK] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BLANK, item, 'menu item');
        if (node.attributes.rel !== undefined) fail('the capture already carried a rel');
        node.attributes = { ...node.attributes, rel: 'noopener noreferrer' };
      });
    },
  },

  // --------------------------------------------------------------- modifiers
  {
    id: 'menu-item-active-modifier-lost',
    klass: 'classes',
    description: 'the active item loses its modifier, so the active surface is never painted',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [I_ACTIVE] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ACTIVE, item, 'menu item');
        if (!node.classes.includes('vf-menu__item--active')) fail('the item carried no active modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-menu__item--active');
      });
    },
  },
  {
    id: 'menu-item-danger-modifier-lost',
    klass: 'classes',
    description: 'the danger item loses its modifier, so the destructive colour is never applied',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [I_DANGER] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_DANGER, item, 'menu item');
        if (!node.classes.includes('vf-menu__item--danger')) fail('the item carried no danger modifier');
        node.classes = node.classes.filter((name) => name !== 'vf-menu__item--danger');
      });
    },
  },

  // ------------------------------------------------------------------ attrs
  {
    id: 'menu-item-anchor-keeps-consumer-tabindex',
    klass: 'native attributes',
    description: 'the enabled anchor keeps the consumer tabindex the component binds undefined over',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['tabindex'] },
      caseIds: [I_TABINDEX_ANCHOR],
    },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_TABINDEX_ANCHOR, item, 'menu item');
        if (node.attributes.tabindex !== undefined) fail('the enabled anchor already carried a tabindex');
        node.attributes = { ...node.attributes, tabindex: '3' };
      });
    },
  },

  // ------------------------------------------------------------------- icon
  {
    id: 'menu-item-icon-class-on-the-wrapper',
    klass: 'classes',
    description: 'the icon class moves off the svg onto the wrapper span, which changes which element the sizing rules reach',
    expect: { dimensions: ['dom.canonicalClasses'], caseIds: [I_ICON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ICON, item, 'menu item');
        const wrapper = node.children.find((child) => child.classes.includes('vf-icon-wrapper'));
        const svg = wrapper?.children.find(glyph);
        if (!wrapper || !svg) fail('the icon wrapper and glyph were not in the capture');
        svg.classes = svg.classes.filter((name) => name !== 'vf-menu__item-icon');
        wrapper.classes = [...wrapper.classes, 'vf-menu__item-icon'].sort();
      });
    },
  },
  {
    id: 'menu-item-icon-not-hidden',
    klass: 'aria',
    description: 'the glyph loses aria-hidden and is announced beside the label',
    expect: { dimensions: ['dom.aria'], details: { 'dom.aria': ['aria-hidden'] }, caseIds: [I_ICON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ICON, glyph, 'menu item glyph');
        if (node.attributes['aria-hidden'] !== 'true') fail('the glyph carried no aria-hidden');
        const { 'aria-hidden': dropped, ...rest } = node.attributes;
        node.attributes = rest;
      });
    },
  },
  {
    id: 'menu-item-glyph-swapped-in-dom',
    klass: 'native attributes',
    description:
      "the DOM record of the glyph carries filter's path instead of bookmark's - the two differ in nothing else at all",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['d'] }, caseIds: [I_ICON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ICON, (candidate) => candidate.tag === 'path', 'glyph path');
        // Before M27 the record carried no `d` at all - the extractor never
        // described the geometry - and injecting one here would be testing an
        // attribute nothing compares. The mutation refuses to apply instead.
        if (node.attributes.d === undefined)
          fail('the DOM record carries no d; the glyph geometry was never extracted');
        if (node.attributes.d !== BOOKMARK_D) fail('the capture did not carry the bookmark path');
        node.attributes = { ...node.attributes, d: FILTER_D };
      });
    },
  },
  {
    id: 'menu-item-unknown-icon-renders-the-wrong-glyph',
    klass: 'native attributes',
    description:
      'the unknown icon name falls back to bookmark rather than moon - the two share every attribute but their path',
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['d'] }, caseIds: [I_ICON_UNKNOWN] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_ICON_UNKNOWN, (candidate) => candidate.tag === 'path', 'glyph path');
        if (node.attributes.d === undefined)
          fail('the DOM record carries no d; the glyph geometry was never extracted');
        node.attributes = { ...node.attributes, d: BOOKMARK_D };
      });
    },
  },

  // ------------------------------------------------------------- directional
  {
    id: 'menu-item-current-and-razor-identically-derive-rel',
    klass: 'directional',
    description:
      "current Vue and Razor both derive VfLink's rel for target=_blank; the two adapters agree with each other and only the reference direction can see it - which is exactly how a shared rule imported into both would fail",
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['rel'] },
      caseIds: [I_BLANK],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = findNode(capture, I_BLANK, item, 'menu item');
          if (node.attributes.rel !== undefined) fail('the capture already carried a rel');
          node.attributes = { ...node.attributes, rel: 'noopener noreferrer' };
        });
      }
    },
  },
  {
    id: 'menu-item-current-and-razor-identically-keep-the-disabled-href',
    klass: 'directional',
    description:
      'current Vue and Razor both leave the href on the disabled anchor; only the reference direction can see it',
    expect: {
      dimensions: ['dom.nativeAttributes'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [I_ANCHOR_DISABLED],
      directions: ['reference-vs-current', 'reference-vs-razor'],
    },
    apply(captures) {
      for (const target of ['current', 'razor']) {
        eachTheme(captures, target, (capture) => {
          const node = findNode(capture, I_ANCHOR_DISABLED, item, 'menu item');
          node.attributes = { ...node.attributes, href: '/docs' };
        });
      }
    },
  },

  // ------------------------------------------------------------------- text
  {
    id: 'menu-item-label-lost',
    klass: 'text',
    description: 'the label span renders empty, so the item has no accessible name',
    expect: { dimensions: ['dom.text'], caseIds: [I_BUTTON] },
    apply(captures) {
      eachTheme(captures, 'razor', (capture) => {
        const node = findNode(capture, I_BUTTON, label, 'label span');
        if (!node.text) fail('the label span carried no text');
        delete node.text;
      });
    },
  },
];

// ===========================================================================
// Browser mutations: applied to a real page before extraction
// ===========================================================================

export const menuBrowserMutations = [
  // ------------------------------------------------------------ current-only
  {
    id: 'browser-menu-current-only-role-removed',
    target: 'current',
    caseIds: [M_SPANS],
    verifyIsolation: true,
    description: 'only the real current Vue menu loses role=menu; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['dom.aria', 'a11y.role'],
      details: { 'dom.aria': ['role'] },
      caseIds: [M_SPANS],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements(
      [M_SPANS],
      '.vf-menu',
      `
      if (element.getAttribute('role') !== 'menu') throw new Error('MUTATION_NOT_APPLIED: not the menu root');
      element.removeAttribute('role');
    `,
    ),
  },

  {
    id: 'browser-menu-role-removed',
    target: 'razor',
    caseIds: [M_SPANS],
    description: 'the real Razor menu renders without role=menu',
    expect: { dimensions: ['dom.aria', 'a11y.role'], details: { 'dom.aria': ['role'] }, caseIds: [M_SPANS] },
    beforeExtract: mutateElements(
      [M_SPANS],
      '.vf-menu',
      `
      if (element.getAttribute('role') !== 'menu') throw new Error('MUTATION_NOT_APPLIED: not the menu root');
      element.removeAttribute('role');
    `,
    ),
  },
  {
    id: 'browser-menu-grows-a-control',
    target: 'razor',
    caseIds: [M_EMPTY],
    description:
      'the real Razor menu renders a button of its own, which is the defect the consumer budget exists to catch',
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: [M_EMPTY] },
    beforeExtract: mutateElements(
      [M_EMPTY],
      '.vf-menu',
      `
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Grown';
      element.appendChild(button);
    `,
    ),
  },
  {
    id: 'browser-menu-consumer-control-swallowed',
    target: 'razor',
    caseIds: [M_CONTROL],
    description:
      "the real Razor menu renders the consumer's control as an inert span, so the declared budget is not met",
    expect: { dimensions: ['dom.structure', 'static.noInteraction'], caseIds: [M_CONTROL] },
    // Replaced rather than removed: an empty menu is a flex column with no box
    // at all, and the screenshot stage cannot capture a zero-height element.
    // The span keeps the case visible and still takes the focusable away.
    beforeExtract: mutateElements(
      [M_CONTROL],
      '.vf-menu .consumer-control',
      `
      const span = document.createElement('span');
      span.className = element.className;
      span.textContent = element.textContent;
      element.replaceWith(span);
    `,
    ),
  },
];

export const menuItemBrowserMutations = [
  // ------------------------------------------------------------ current-only
  {
    id: 'browser-menu-item-current-only-role-removed',
    target: 'current',
    caseIds: [I_BUTTON],
    verifyIsolation: true,
    description:
      'only the real current Vue control loses role=menuitem; reference and Razor are re-captured untouched',
    expect: {
      dimensions: ['dom.aria', 'a11y.role', 'ownership.controls'],
      details: { 'dom.aria': ['role'] },
      caseIds: [I_BUTTON],
      directions: ['reference-vs-current', 'current-vs-razor'],
    },
    beforeExtract: mutateElements(
      [I_BUTTON],
      '.vf-menu__item',
      `
      if (element.getAttribute('role') !== 'menuitem') throw new Error('MUTATION_NOT_APPLIED: not a menu item');
      element.removeAttribute('role');
    `,
    ),
  },

  // ------------------------------------------------------- the glyph geometry
  //
  // The false PASS this milestone reproduced. Run with the pre-M27 compared
  // vocabulary this reports MISSED: the ownership snapshot counts controls, the
  // glyph is aria-hidden so the tree ignores it, the wrapper style and every
  // svg presentation attribute are identical between the two glyphs, and the
  // DOM record never described the path. With `d` in the vocabulary it is
  // detected on the named dimension.
  {
    id: 'browser-menu-item-glyph-swapped',
    target: 'razor',
    caseIds: [I_ICON],
    description:
      "the real Razor glyph renders filter in place of bookmark - the two differ in nothing but their path data",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['d'] }, caseIds: [I_ICON] },
    beforeExtract: mutateElements(
      [I_ICON],
      '.vf-menu__item-icon path',
      `
      if (element.getAttribute('d') !== ${JSON.stringify(BOOKMARK_D)}) throw new Error('MUTATION_NOT_APPLIED: not the bookmark path');
      element.setAttribute('d', ${JSON.stringify(FILTER_D)});
    `,
    ),
  },
  {
    id: 'browser-menu-item-role-removed',
    target: 'razor',
    caseIds: [I_BUTTON],
    description: 'the real Razor control loses role=menuitem',
    expect: {
      dimensions: ['dom.aria', 'a11y.role', 'ownership.controls'],
      details: { 'dom.aria': ['role'] },
      caseIds: [I_BUTTON],
    },
    beforeExtract: mutateElements(
      [I_BUTTON],
      '.vf-menu__item',
      `
      if (element.getAttribute('role') !== 'menuitem') throw new Error('MUTATION_NOT_APPLIED: not a menu item');
      element.removeAttribute('role');
    `,
    ),
  },
  {
    id: 'browser-menu-item-becomes-a-div',
    target: 'razor',
    caseIds: [I_BUTTON],
    description: 'the real Razor control is a div with role=menuitem, which the tree still calls a menuitem',
    expect: { dimensions: ['dom.structure', 'ownership.controls'], caseIds: [I_BUTTON] },
    beforeExtract: mutateElements(
      [I_BUTTON],
      '.vf-menu__item',
      `
      if (element.tagName !== 'BUTTON') throw new Error('MUTATION_NOT_APPLIED: not a button');
      const div = document.createElement('div');
      for (const attribute of [...element.attributes]) div.setAttribute(attribute.name, attribute.value);
      div.removeAttribute('type');
      div.innerHTML = element.innerHTML;
      element.replaceWith(div);
    `,
    ),
  },
  {
    id: 'browser-menu-item-disabled-anchor-restored',
    target: 'razor',
    caseIds: [I_ANCHOR_DISABLED],
    description: 'the real Razor disabled anchor gets its href back and becomes a working link again',
    expect: {
      dimensions: ['dom.nativeAttributes', 'ownership.controls'],
      details: { 'dom.nativeAttributes': ['href'] },
      caseIds: [I_ANCHOR_DISABLED],
    },
    beforeExtract: mutateElements(
      [I_ANCHOR_DISABLED],
      '.vf-menu__item',
      `
      if (element.hasAttribute('href')) throw new Error('MUTATION_NOT_APPLIED: the disabled anchor already had an href');
      element.setAttribute('href', '/docs');
    `,
    ),
  },
  {
    id: 'browser-menu-item-rel-derived',
    target: 'razor',
    caseIds: [I_BLANK],
    description: "the real Razor anchor derives VfLink's rel for target=_blank",
    expect: { dimensions: ['dom.nativeAttributes'], details: { 'dom.nativeAttributes': ['rel'] }, caseIds: [I_BLANK] },
    beforeExtract: mutateElements(
      [I_BLANK],
      '.vf-menu__item',
      `
      if (element.hasAttribute('rel')) throw new Error('MUTATION_NOT_APPLIED: the anchor already had a rel');
      element.setAttribute('rel', 'noopener noreferrer');
    `,
    ),
  },
  {
    id: 'browser-menu-item-grows-a-second-control',
    target: 'razor',
    caseIds: [I_BUTTON],
    description: 'the real Razor item renders a second control, which the owned-control count has to reject',
    expect: { dimensions: ['dom.structure', 'ownership.controls'], caseIds: [I_BUTTON] },
    beforeExtract: mutateElements(
      [I_BUTTON],
      '.vf-menu__item',
      `
      const extra = element.cloneNode(true);
      element.after(extra);
    `,
    ),
  },
];

// ===========================================================================
// Policy mutations: approvals the registry itself has to reject
// ===========================================================================
//
// M27 ships zero approvals, so these prove the registry would still refuse the
// wrong ones. Two of them are this milestone's own shape: an approval for the
// glyph's path, which is what a "the icon is close enough" waiver would look
// like, and an approval naming a case about the `select` emit, which is what a
// "Razor cannot emit" waiver would look like - and which is rejected because no
// such case exists and none should.

const push = (policy, entry) => policy.approvedDivergences.push(entry);

const smuggled = (id, dimension, caseIds, description) => ({
  id,
  description,
  rejectedBy: 'validation',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'smuggled',
    });
  },
});

/** A well-formed approval on an approvable dimension that tolerates no real difference: rejected by accounting. */
const idle = (id, dimension, caseIds, detail, pathSelector, left, right, description) => ({
  id,
  description,
  rejectedBy: 'occurrences',
  apply(policy) {
    push(policy, {
      id,
      dimension,
      target: 'razor',
      caseIds,
      detail,
      pathSelector,
      left,
      right,
      classification: 'framework-specific',
      expectedOccurrences: 4,
      directions: ['reference-vs-razor', 'current-vs-razor'],
      reason: 'A deliberately idle entry used by the parity mutation harness.',
    });
  },
});

export const menuPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [M_SPANS],
    'an approval for dom.structure, which must never be waivable - and which here is what tells one div from a list wrapper the menu never renders',
  ),
  smuggled('smuggled-visual-approval', 'visual', [M_SPANS], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.aria',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'static.noInteraction',
    [M_CONTROL],
    'an approval for ownership.controls - the evidence that VfMenu owns no control and that every focusable element in it is the consumer\'s',
  ),
  smuggled(
    'smuggled-role-approval',
    'a11y.role',
    [M_ROLE],
    'an approval for the computed role - the shape a "the consumer role override is close enough" waiver would take',
  ),
  smuggled(
    'smuggled-absent-case',
    'dom.aria',
    ['menu/keyboard'],
    'an approval naming a case the catalog does not have - the shape a "Razor has no arrow keys" waiver would take, for behaviour VfMenu never had',
  ),
  idle(
    'idle-aria-label-approval',
    'dom.aria',
    [M_LABEL],
    'aria-label',
    'div.vf-menu',
    'Workspace actions',
    'Something else',
    'a well-formed aria-label approval that tolerates a difference no target produces: the accounting rejects it as unused',
  ),
];

export const menuItemPolicyMutations = [
  smuggled(
    'smuggled-structure-approval',
    'dom.structure',
    [I_BUTTON],
    'an approval for dom.structure, which must never be waivable - and which here is what tells a button from an anchor when the owned-control total is unchanged',
  ),
  smuggled('smuggled-visual-approval', 'visual', [I_ICON], 'an approval for rendered pixels'),
  smuggled(
    'smuggled-wildcard-case',
    'dom.nativeAttributes',
    ['*'],
    'an approval that covers every case at once instead of naming them',
  ),
  smuggled(
    'smuggled-ownership-approval',
    'ownership.controls',
    [I_BUTTON],
    'an approval for ownership.controls - the evidence that the item owns exactly one native control carrying the declared role',
  ),
  smuggled(
    'smuggled-snapshot-approval',
    'interaction.state',
    [I_ANCHOR_DISABLED],
    "an approval for the item's own record, where the branch, href, target, rel and tabindex are recorded a second time",
  ),
  idle(
    'idle-glyph-approval',
    'dom.nativeAttributes',
    [I_ICON],
    'd',
    'path',
    BOOKMARK_D,
    FILTER_D,
    'a well-formed approval for the glyph geometry - the shape a "the icon is close enough" waiver would take, on the one attribute that tells bookmark, filter and moon apart. It tolerates a difference no target produces, so the accounting rejects it as unused',
  ),
  smuggled(
    'smuggled-select-emit-case',
    'interaction.state',
    ['menu-item/select-emit'],
    'an approval naming a case the catalog does not have - the shape a "Razor cannot emit select" waiver would take, for a Vue event that changes no DOM and is characterised rather than compared',
  ),
  idle(
    'idle-rel-approval',
    'dom.nativeAttributes',
    [I_BLANK],
    'rel',
    'a.vf-menu__item',
    'noopener noreferrer',
    'nofollow',
    'a well-formed rel approval that tolerates a difference no target produces: the accounting rejects it as unused',
  ),
];
