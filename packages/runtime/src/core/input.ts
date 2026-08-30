/**
 * Text input adornment rules, with no DOM and no framework.
 */

export interface CmPasswordRevealLabels {
  readonly hide: string;
  readonly show: string;
}

export interface CmPasswordRevealState {
  /** `aria-pressed` on the reveal button. */
  readonly ariaPressed: boolean;
  /** Accessible name for the reveal button, describing what pressing it will do. */
  readonly label: string;
  /** The `type` the native input should carry. */
  readonly type: 'password' | 'text';
}

/**
 * Resolves everything the password reveal affects, so the input type, the pressed state and the
 * button's name cannot disagree.
 *
 * The label names the action the button performs, not the current state: while the value is
 * revealed the button offers to hide it.
 */
export function resolvePasswordReveal(revealed: boolean, labels: CmPasswordRevealLabels): CmPasswordRevealState {
  return {
    ariaPressed: revealed,
    label: revealed ? labels.hide : labels.show,
    type: revealed ? 'text' : 'password',
  };
}

/**
 * Reports whether the clear action is offered at all.
 *
 * A disabled or read-only field must not offer to clear itself: the control is there to say the
 * value cannot be changed right now.
 */
export function resolveInputClearable(options: {
  readonly clearable: boolean;
  readonly disabled?: boolean;
  readonly readonly?: boolean;
}): boolean {
  return options.clearable && options.disabled !== true && options.readonly !== true;
}

/** Reports whether the clear button is currently visible, given the value in the field. */
export function isInputClearVisible(clearable: boolean, value: string): boolean {
  return clearable && value.length > 0;
}
