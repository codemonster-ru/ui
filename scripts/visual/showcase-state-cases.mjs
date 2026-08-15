import { readFileSync } from 'node:fs';

const identifierPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const supportedPseudoClasses = new Set(['active', 'focus', 'focus-visible', 'hover']);
const supportedMedia = new Set(['no-preference', 'reduce']);

export function readShowcaseStateConfig(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function validateShowcaseStateConfig(config, routes = []) {
  const errors = [];
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    return ['Showcase state configuration must be an object.'];
  }
  if (config.schemaVersion !== 1) {
    errors.push('Showcase state schemaVersion must be 1.');
  }
  if (!Array.isArray(config.states) || config.states.length === 0) {
    errors.push('Showcase state configuration requires at least one state.');
    return errors;
  }

  const knownRoutes = new Set(routes);
  const ids = new Set();
  for (const state of config.states) {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      errors.push('Each showcase state must be an object.');
      continue;
    }
    if (!identifierPattern.test(state.id)) {
      errors.push('Each showcase state requires a kebab-case id.');
    } else if (ids.has(state.id)) {
      errors.push(`Duplicate showcase state id: ${state.id}.`);
    }
    ids.add(state.id);
    if (!knownRoutes.has(state.route)) {
      errors.push(`Showcase state ${state.id} uses unknown route: ${state.route}.`);
    }
    if (typeof state.selector !== 'string' || state.selector.trim() === '') {
      errors.push(`Showcase state ${state.id} requires a non-empty selector.`);
    }
    if (state.index !== undefined && (!Number.isInteger(state.index) || state.index < 0)) {
      errors.push(`Showcase state ${state.id} index must be a non-negative integer.`);
    }
    if (state.padding !== undefined && (!Number.isInteger(state.padding) || state.padding < 0 || state.padding > 256)) {
      errors.push(`Showcase state ${state.id} padding must be an integer between 0 and 256.`);
    }
    if (
      state.pseudoClasses !== undefined &&
      (!Array.isArray(state.pseudoClasses) ||
        state.pseudoClasses.length === 0 ||
        state.pseudoClasses.some((pseudoClass) => !supportedPseudoClasses.has(pseudoClass)))
    ) {
      errors.push(`Showcase state ${state.id} uses unsupported pseudo-classes.`);
    }
    if (state.media !== undefined && !supportedMedia.has(state.media)) {
      errors.push(`Showcase state ${state.id} uses unsupported reduced-motion media value.`);
    }
    if (state.assertReducedMotion !== undefined && typeof state.assertReducedMotion !== 'boolean') {
      errors.push(`Showcase state ${state.id} assertReducedMotion must be boolean.`);
    }
    if (state.assertReducedMotion && state.media !== 'reduce') {
      errors.push(`Showcase state ${state.id} can assert reduced motion only with reduce media.`);
    }
  }
  return errors;
}

export function createShowcaseStateMatrix(stateConfig, visualConfig) {
  const errors = validateShowcaseStateConfig(stateConfig, visualConfig.reference.routes);
  if (errors.length > 0) {
    throw new Error(`Invalid showcase state configuration:\n${errors.join('\n')}`);
  }

  return visualConfig.viewports.flatMap((viewport) =>
    visualConfig.themes.flatMap((theme) =>
      stateConfig.states.map((state) => ({
        ...state,
        filename: `state--${state.id}--${theme.name}--${viewport.name}.png`,
        index: state.index ?? 0,
        media: state.media ?? 'reduce',
        padding: state.padding ?? 24,
        theme,
        viewport,
      })),
    ),
  );
}
