// Resolves a core style entry to the file that actually owns its rules.
//
// M04 moved the VfInput CSS dependency closure into
// @codemonster-ru/vueforge-styles. The core entries that used to hold those
// rules are now single-import forwards, so the existing CSS contract, parity and
// geometry checks would otherwise inspect an empty file. Resolving the forward
// hands them byte-identical content to the file they read before the move, so
// no assertion is weakened.
//
// A forward is derived, not listed: an entry whose entire body is one @import is
// a forward. Nothing has to be kept in sync when the next closure moves.
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const singleImportPattern = /^@import\s+['"](.+?)['"];$/;

export function readForwardTarget(entryPath) {
  const body = readFileSync(entryPath, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();
  const match = body.match(singleImportPattern);

  if (!match || !match[1].startsWith('.')) {
    return null;
  }

  return resolve(dirname(entryPath), match[1]);
}

/** The canonical source of a style entry: the forward target, or the entry itself. */
export function resolveStyleEntrySource(entryPath) {
  return readForwardTarget(entryPath) ?? entryPath;
}

export function isForwardingEntry(entryPath) {
  return readForwardTarget(entryPath) !== null;
}
