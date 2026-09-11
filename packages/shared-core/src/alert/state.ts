// Platform-independent presentation rules for VfAlert.
//
// Its own file, and deliberately not a rule about "feedback surfaces" or
// "toned components". VfBadge and VfTag are typed against the same eight tone
// literals and their class rules read almost like the one below, and the
// resemblance is exactly where a shared `resolveTonedClasses(block, tone)` would
// be reached for. It would be wrong for this component on its first line:
//
//   - a badge and a tag suppress the modifier at `neutral`. An alert suppresses
//     it at `primary`, its own default, and emits `vf-alert--neutral` - a class
//     no stylesheet defines, so a neutral alert paints exactly like a primary
//     one and differs only in its class list. A shared rule parameterised on
//     the block name would have to be parameterised on the suppressed tone as
//     well, and at that point it is two rules wearing one name;
//   - an alert's tone also selects a glyph. Neither span has a glyph.
//
// Tone is paint plus glyph choice and nothing else. It does not change the
// role, and there is no rule here that maps a tone onto a role, a live-region
// politeness or an accessible name, because the reference has none: every
// alert writes `role="alert"` and every alert writes nothing else. Adding a
// "danger is assertive, info is polite" mapping would be an accessibility
// improvement and a product change.
//
// There is also no rule about a dismiss control, for the reason there is no
// element: the reference has no such prop, no such button and no such event.
//
// These record the behaviour of the reference implementation at
// fd793696f50d3be0fcd3788f0f8f751c63869963.

/** Which of the alert's optional parts render, and which fallbacks fill them. */
export interface VfAlertRegions {
  /** The decorative `div.vf-alert__icon` container. Absent for `hideIcon`, consumer slot and all. */
  icon: boolean;
  /** The tone glyph inside it, which the icon slot falls back to. */
  iconGlyph: boolean;
  /** The `p.vf-alert__title` paragraph. */
  title: boolean;
  /** The interpolated title prop inside it, which the title slot falls back to. */
  titleText: boolean;
}

/**
 * The alert root class list, in the order the reference emits it.
 *
 * `primary` - the default - emits no modifier. Every other tone does, including
 * `neutral`, which no stylesheet styles.
 */
export function resolveAlertClasses(tone: string): string[] {
  const classes = ['vf-alert'];

  if (tone !== 'primary') classes.push(`vf-alert--${tone}`);

  return classes;
}

/**
 * The glyph the alert renders when the icon slot falls back.
 *
 * An explicit `icon` wins whatever it is - including the empty string, because
 * the reference tests it with `??` rather than for truthiness, so an empty
 * name is handed to the icon package as a name. Otherwise the tone chooses:
 * six tones are named in the reference's chain and `neutral` is not, so it
 * falls to the chain's final default, which is the same glyph `info` and
 * `contrast` name explicitly. Four tones sharing one glyph is the contract,
 * not a simplification of it.
 *
 * Registry names, as the Vue `icons` map spells them: the component reads
 * `icons.checkCircle` and gets `'check-circle'`.
 */
export function resolveAlertIcon(input: { tone: string; icon?: string | null }): string {
  if (input.icon !== undefined && input.icon !== null) return input.icon;

  switch (input.tone) {
    case 'success':
      return 'check-circle';
    case 'warn':
      return 'alert-circle';
    case 'help':
      return 'question-circle';
    case 'danger':
      return 'x-circle';
    case 'info':
    case 'contrast':
    default:
      return 'info-circle';
  }
}

/**
 * Which optional parts an alert renders.
 *
 * Two containers keyed on two different questions, and two fallbacks keyed on
 * a third:
 *
 *   - the icon container is keyed on `hideIcon` alone. It renders whether or
 *     not an icon slot was passed, and `hideIcon` removes it whether or not
 *     one was - a consumer's icon slot is discarded along with the glyph;
 *   - the title paragraph is keyed on `title || $slots.title`. An empty-string
 *     title is falsy, so it renders no paragraph rather than an empty one - but
 *     an empty-string title *with* a title slot that renders nothing renders an
 *     empty paragraph, because the slot opened it and the fallback is the prop;
 *   - both fallbacks are slot fallback content, so they disappear when their
 *     slot renders something and come back when it renders nothing. Vue gets
 *     that answer from its slot mechanics; the Razor adapter has to decide it,
 *     because a Razor slot arrives as already-rendered markup rather than as a
 *     vnode list. `iconSlotContent` and `titleSlotContent` are that decision.
 *
 * The body wrapper has no field here because it has no decision: it always
 * renders, with or without content.
 */
export function resolveAlertRegions(input: {
  hideIcon: boolean;
  hasIconSlot: boolean;
  iconSlotContent?: boolean;
  title?: string | null;
  hasTitleSlot: boolean;
  titleSlotContent?: boolean;
}): VfAlertRegions {
  return {
    icon: !input.hideIcon,
    iconGlyph: !(input.iconSlotContent ?? input.hasIconSlot),
    title: Boolean(input.title) || input.hasTitleSlot,
    titleText: !(input.titleSlotContent ?? input.hasTitleSlot),
  };
}
