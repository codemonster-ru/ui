/** The marker and event used when a framework takes over server-rendered component HTML. */
export const cmFrameworkOwnership = {
  attribute: 'data-cm-hydrated',
  claimEvent: 'cm:framework-claim',
} as const;
