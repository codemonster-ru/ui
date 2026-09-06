// Type declarations for style-entry-sources.mjs. The implementation is a plain
// ES module so the .mjs contract/parity/geometry scripts and the TypeScript
// specs can share one copy of the forward-resolution rule.
export declare function readForwardTarget(entryPath: string): string | null;
export declare function resolveStyleEntrySource(entryPath: string): string;
export declare function isForwardingEntry(entryPath: string): boolean;
