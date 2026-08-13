import { CmModalController } from './modal.js';
import type { CmControllerFactory } from './runtime.js';

export class CmDrawerController extends CmModalController {
  constructor(root: Element) {
    super(root, {
      className: 'cm-drawer--open',
      closeSelector: '[data-cm-drawer-close]',
      eventName: 'drawer',
      stateAttribute: 'cmDrawerState',
    });
  }
}

export const createCmDrawerController: CmControllerFactory = (element) => new CmDrawerController(element);
