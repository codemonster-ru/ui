import { CmModalController } from './modal.js';
import type { CmControllerFactory } from './runtime.js';

export class CmDialogController extends CmModalController {
  constructor(root: Element) {
    super(root, {
      className: 'cm-dialog--open',
      closeSelector: '[data-cm-dialog-close]',
      eventName: 'dialog',
      stateAttribute: 'cmDialogState',
      allowEscape: () => root.getAttribute('data-cm-dialog-close-on-escape') !== 'false',
    });
  }
}

export const createCmDialogController: CmControllerFactory = (element) => new CmDialogController(element);
