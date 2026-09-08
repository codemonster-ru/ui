// Where hand-maintained icon geometry is allowed to live.
//
// M10 gave icons one owner and deleted the per-component blob VfInput had been
// fed. The guard that pinned that read filenames: anything matching
// /icon.*data.*\.json/i outside packages/icons was a violation. So the rule was
// really "do not call it icon-data.json", and the next per-component blob only
// had to be named something else. `field-glyphs.json` dropped into the Razor
// adapter, full of hand-written path data, passed cleanly.
//
// So ownership is decided by what a file contains and where it sits, not by
// what it is called. A JSON file carrying SVG geometry is an icon source; there
// are exactly three places one may be, and everywhere else is the blob coming
// back.
//
// Deliberately limited to structured data files. Inline SVG in a component that
// draws its own artwork - the progress spinner, the admin shell - is not an
// icon registry, and flagging it would make this guard unusable.

/** The authored geometry owner. Everything else is derived from it. */
export const CANONICAL_ICON_SOURCE = 'packages/icons/';

/**
 * Generated registries, and the generator each one must name.
 *
 * Provenance is reused rather than invented: the generator already stamps
 * `$comment` into both copies, and check:icon-data plus the byte-for-byte
 * assertion in icon-ownership.test.mjs pin their contents to the canonical
 * source. This list is what makes "generated into an approved destination"
 * distinguishable from "hand-written and given an approved-looking name".
 */
export const GENERATED_ICON_REGISTRIES = [
  'packages/shared-core/src/icons/icon-registry.json',
  'packages/razor/resources/icons/icon-registry.json',
];

const GENERATOR = 'scripts/build/generate-icon-registry.mjs';

/** SVG drawing elements, as they appear inside a serialised glyph body. */
const SVG_BODY = /<\s*(path|circle|ellipse|line|polyline|polygon|rect|mask|defs|use|g)\b/i;

/** Keys whose value is glyph geometry rather than prose or a filesystem path. */
const GEOMETRY_KEYS = new Set(['d', 'body', 'path']);

/**
 * SVG path data: a move command followed by coordinates.
 *
 * This is what keeps `"path": "packages/icons/dist"` from reading as geometry.
 * A filesystem path does not begin with a move command and a number.
 */
const PATH_DATA = /^[Mm][\s,]*-?\d/;

/**
 * Why a JSON document looks like icon geometry.
 *
 * @returns {string[]} Distinct evidence kinds; empty means no geometry.
 */
export function geometryEvidence(value, key = '') {
  const found = new Set();

  const walk = (node, nodeKey) => {
    if (typeof node === 'string') {
      // Provenance prose is allowed to describe what the artifact holds.
      if (nodeKey.startsWith('$comment')) return;
      if (SVG_BODY.test(node)) found.add('svg-body');
      if (GEOMETRY_KEYS.has(nodeKey) && PATH_DATA.test(node.trim())) found.add(`path-data:${nodeKey}`);
      return;
    }
    if (Array.isArray(node)) {
      for (const entry of node) walk(entry, nodeKey);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [childKey, child] of Object.entries(node)) walk(child, childKey);
    }
  };

  walk(value, key);

  return [...found];
}

/**
 * Every tracked JSON file that owns icon geometry it is not allowed to own.
 *
 * @param {string[]} files Repo-relative tracked paths.
 * @param {(file: string) => string} readFile
 * @returns {string[]} One message per unauthorized artifact.
 */
export function unauthorizedGeometryBlobs(files, readFile) {
  const violations = [];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    // The canonical source is where authored geometry belongs.
    if (file.startsWith(CANONICAL_ICON_SOURCE)) continue;

    let document;
    try {
      document = JSON.parse(readFile(file));
    } catch {
      continue;
    }

    const evidence = geometryEvidence(document);
    if (evidence.length === 0) continue;

    if (!GENERATED_ICON_REGISTRIES.includes(file)) {
      violations.push(
        `${file}: carries icon geometry (${evidence.join(', ')}) outside ${CANONICAL_ICON_SOURCE}. ` +
          'The registry is the only neutral icon source; generate it, do not hand-maintain a copy.',
      );
      continue;
    }

    // An approved destination still has to be the generator's output.
    if (!String(document.$comment ?? '').includes(GENERATOR)) {
      violations.push(`${file}: is an approved icon registry path but does not record ${GENERATOR} as its generator.`);
    }
  }

  return violations;
}
