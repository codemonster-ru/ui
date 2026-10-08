// How the pixels of a parity screenshot are acquired (M35).
//
// Until M35 every screenshot was taken with captureBeyondViewport:true. Chrome
// implements that by resizing the frame to the document for the duration of
// the capture: two Page.frameResized, one window and one visualViewport resize
// per screenshot, occasionally through a transient 1x1 viewport - which made a
// width-changing relayout repaint fractional fixed layers and flip the raster
// of an unchanged page (the Popover open-two flip of P1-1). The component under
// test saw its viewport change while its evidence was being taken.
//
// Two acquisition modes now exist, and which one a capture uses is decided
// here and nowhere else.
//
//   semantic-scroll (Mode A) - every capture but the allowlist below. The page
//   keeps its 1000x900 viewport. A clip that is visible is captured as it is;
//   one that is not is brought into view by an ordinary window scroll to a
//   position chosen before any pixel is taken, the existing settle runs, the
//   acquisition invariants are checked, the clip is captured once without
//   extending the frame, and the scroll is put back and checked. A page still
//   moving by itself is first given the existing settle until it is at rest,
//   bounded - otherwise its own motion could not be told from the scroll's.
//   Anything the invariants reject fails the capture: nothing is retried,
//   cropped, resized or handed to the legacy path.
//
//   legacy (Mode L) - exactly the captures listed in LEGACY_ACQUISITION. They
//   are taken as before, with captureBeyondViewport:true, because their clip is
//   taller than the viewport and no equally strong viewport-contained evidence
//   exists for them (M35 R2: cropping drops paint the accepted capture sees,
//   and replaying Chrome's layer paint misses compositor effects). This is a
//   documented exception, not a solved path: these captures still resize the
//   frame while they are taken.
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';

export const SEMANTIC_SCROLL = 'semantic-scroll';
export const LEGACY = 'legacy';

/**
 * The only captures allowed to extend the frame beyond the viewport. Keyed by
 * profile, case and stage - never by size - so a new tall capture fails
 * instead of joining the exception, and growing this list is a source change
 * that the acquisition tests pin.
 *
 * `stage` is the screenshot stage of run.mjs: 'initial', 'post' (the natural
 * post-interaction frame), 'post-blurred' or 'transitioned'.
 */
export const LEGACY_ACQUISITION = Object.freeze([
  Object.freeze({
    profile: 'dropdown',
    caseId: 'dropdown/interaction-scroll-follow',
    stage: 'post',
    reason:
      'The 1420px case root - a 1400px consumer margin that gives the window room to scroll - is taller than the 900px viewport; its accepted evidence covers the whole root.',
  }),
  Object.freeze({
    profile: 'popover',
    caseId: 'popover/interaction-scroll-follow',
    stage: 'post',
    reason:
      'The 1420px case root - a 1400px consumer margin that gives the window room to scroll - is taller than the 900px viewport; its accepted evidence covers the whole root.',
  }),
]);

export function legacyAcquisition(profile, caseId, stage) {
  return (
    LEGACY_ACQUISITION.find((entry) => entry.profile === profile && entry.caseId === caseId && entry.stage === stage) ??
    null
  );
}

/** Positions after the nearest one, evenly spaced towards the far alignment. */
export const SCROLL_CANDIDATE_STEPS = 12;

/**
 * The scroll positions tried, in order, for a clip that fits the viewport but
 * is not visible. Every scroll position in [clip bottom - viewport height,
 * clip top] shows the whole clip; the nearest end of that range comes first,
 * then SCROLL_CANDIDATE_STEPS positions evenly spaced towards the other end.
 * A pure function of the geometry and the current scroll, so the same case in
 * the same state is always acquired from the same position - and it never sees
 * a screenshot.
 */
export function scrollCandidates(clip, scrollY, viewportHeight, maxScrollY) {
  const low = Math.max(0, clip.y + clip.height - viewportHeight);
  const high = Math.min(clip.y, Math.max(0, maxScrollY));
  if (high < low) return [];
  const nearest = scrollY > high ? high : low;
  const far = nearest === low ? high : low;
  const positions = [nearest];
  for (let step = 1; step <= SCROLL_CANDIDATE_STEPS; step += 1) {
    positions.push(Math.round(nearest + ((far - nearest) * step) / SCROLL_CANDIDATE_STEPS));
  }
  return [...new Set(positions)];
}

/**
 * Every way an acquisition can fail, and what kind of failure it is (M35.1).
 *
 *   infrastructure - the harness or the environment could not produce
 *     trustworthy pixels: the viewport, the frame, the PNG or the timing was
 *     wrong. Never evidence about the target.
 *   rejection - the target's own geometry or behaviour under the acquisition
 *     scroll ruled the capture out. It may be what a mutation caused, or not;
 *     a mutation has to declare it to have it accepted as expected, and even
 *     then it is not detection.
 *
 * Neither kind is a screenshot. A failed acquisition is never turned into a
 * visual difference.
 */
export const INFRASTRUCTURE = 'infrastructure';
export const REJECTION = 'rejection';
export const ACQUISITION_FAILURES = Object.freeze({
  'viewport-not-semantic': INFRASTRUCTURE,
  'legacy-entry-stale': INFRASTRUCTURE,
  'page-not-at-rest': INFRASTRUCTURE,
  'viewport-resized-during-capture': INFRASTRUCTURE,
  'viewport-resized-during-acquisition': INFRASTRUCTURE,
  'page-changed-during-capture': INFRASTRUCTURE,
  'screenshot-unreadable': INFRASTRUCTURE,
  'screenshot-size-mismatch': INFRASTRUCTURE,
  'clip-exceeds-viewport': REJECTION,
  'clip-outside-viewport-horizontally': REJECTION,
  'no-valid-scroll-position': REJECTION,
  'restoration-failed': REJECTION,
});

export class AcquisitionError extends Error {
  constructor(message, diagnostics) {
    super(message);
    this.name = 'AcquisitionError';
    this.diagnostics = diagnostics;
  }
}

/**
 * The structured record of a failed acquisition, as a screenshot record and a
 * mutation verdict carry it: which capture, which failure in full, and what it
 * left behind. `obtainedSha256` is provenance of pixels that were taken and
 * then refused - never parity evidence.
 */
export function acquisitionOutcome(diagnostics) {
  return {
    profile: diagnostics.profile,
    caseId: diagnostics.caseId,
    stage: diagnostics.stage,
    target: diagnostics.target,
    theme: diagnostics.theme,
    mode: diagnostics.mode ?? null,
    code: diagnostics.failureCode,
    kind: diagnostics.failureKind,
    reason: diagnostics.failure,
    screenshotObtained: diagnostics.screenshotObtained,
    obtainedSha256: diagnostics.obtainedSha256 ?? null,
    restoration: diagnostics.restoration,
    cleanupFailure: diagnostics.cleanupFailure ?? null,
    pageUsable: diagnostics.pageUsable,
  };
}

/**
 * Thrown by the harness, not by acquisition, when a failed acquisition left a
 * page it could not verifiably put back: nothing more may be measured on it.
 * Carries the acquisition's diagnostics and the page's acquisition log so far.
 */
export class PageInvalidated extends Error {
  constructor(error, acquisitions) {
    super(`${error.message} The page is not usable for further evidence.`);
    this.name = 'PageInvalidated';
    this.diagnostics = error.diagnostics;
    this.acquisitions = acquisitions;
  }
}

/**
 * The page as acquisition sees it: the viewport, the scroll, a fingerprint of
 * the target case and every visible fixed element.
 *
 * The fingerprint is the case's markup, the computed style of every rendered
 * element and the document-coordinate border box of every rendered HTML
 * element and <svg> root. Two things are left out of the boxes because they
 * move with the scroll by construction, not because the case changed:
 *
 *   - unrendered elements (display:none and the like) - Chrome reports their
 *     box as 0x0 at the viewport origin, so its document position is the
 *     scroll offset;
 *   - geometry inside an <svg> - path and group bounds are floating-point
 *     transforms of the path data and differ by thousandths of a pixel between
 *     scroll offsets (measured on the tabs scroller icons: 8.334 vs 8.333).
 *
 * Their markup and computed styles stay in the fingerprint, and none of this
 * touches parity evidence: the DOM, accessibility and visual comparisons still
 * read every element, SVG geometry included.
 *
 * Fixed elements are 'own' when the case contains them or one of its elements
 * names them through aria-controls, aria-describedby or a followed reference.
 * Their offset to the case root is recorded: an overlay that follows its
 * anchor keeps it under a scroll.
 */
function stateExpression(caseId, followedReferences) {
  return `(() => {
    const root = document.querySelector(${JSON.stringify(`[data-parity-case="${caseId}"]`)});
    if (!root) throw new Error('acquisition: case ${caseId} is not in the document');
    const owners = new Set();
    for (const element of root.querySelectorAll('[aria-controls],[aria-describedby]')) {
      for (const name of ['aria-controls', 'aria-describedby']) {
        for (const id of (element.getAttribute(name) || '').split(/\\s+/).filter(Boolean)) {
          const target = document.getElementById(id);
          if (target) owners.add(target);
        }
      }
    }
    for (const rule of ${JSON.stringify(followedReferences ?? [])}) {
      for (const source of root.querySelectorAll(rule.source)) {
        const target = document.getElementById(source.getAttribute(rule.attribute));
        if (target) owners.add(target);
      }
    }
    const owned = (element) => root.contains(element) || [...owners].some((owner) => owner.contains(element));
    const rendered = (element) => element.getClientRects().length > 0;
    const svgInternal = (element) => element instanceof SVGElement && !(element instanceof SVGSVGElement);
    const fnv = (text) => { let hash = 2166136261; for (let i = 0; i < text.length; i += 1) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 16777619); } return (hash >>> 0).toString(16) + ':' + text.length; };
    const elements = [root, ...root.querySelectorAll('*')].filter(rendered);
    let boxes = '';
    let styles = '';
    for (const element of elements) {
      if (!svgInternal(element)) {
        const box = element.getBoundingClientRect();
        boxes += (box.x + scrollX) + ',' + (box.y + scrollY) + ',' + box.width + ',' + box.height + ';';
      }
      const computed = getComputedStyle(element);
      for (let i = 0; i < computed.length; i += 1) styles += computed[i] + ':' + computed.getPropertyValue(computed[i]) + ';';
      styles += '|';
    }
    const rootBox = root.getBoundingClientRect();
    const fixed = [...document.querySelectorAll('body *')]
      .filter((element) => rendered(element) && getComputedStyle(element).position === 'fixed')
      .map((element) => {
        const box = element.getBoundingClientRect();
        return {
          id: element.id,
          classes: String(element.getAttribute('class') ?? ''),
          own: owned(element),
          x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height,
          dx: box.x - rootBox.x, dy: box.y - rootBox.y,
        };
      });
    const viewport = window.visualViewport;
    return {
      scrollX, scrollY, innerWidth, innerHeight,
      visual: { left: viewport.pageLeft, top: viewport.pageTop, width: viewport.width, height: viewport.height, scale: viewport.scale },
      maxScrollY: document.documentElement.scrollHeight - innerHeight,
      fingerprint: fnv(root.outerHTML) + '/' + fnv(boxes) + '/' + fnv(styles),
      fixed,
    };
  })()`;
}

const visible = (state, clip) =>
  clip.x >= state.visual.left &&
  clip.y >= state.visual.top &&
  clip.x + clip.width <= state.visual.left + state.visual.width &&
  clip.y + clip.height <= state.visual.top + state.visual.height;

const intersects = (element, clip) =>
  element.x < clip.x + clip.width &&
  element.x + element.width > clip.x &&
  element.y < clip.y + clip.height &&
  element.y + element.height > clip.y;

const ownOverlays = (state) =>
  JSON.stringify(
    state.fixed
      .filter((element) => element.own)
      .map(({ id, classes, dx, dy, width, height }) => [id, classes, dx, dy, width, height]),
  );

const foreignInClip = (state, clip) =>
  JSON.stringify(
    state.fixed
      .filter((element) => !element.own && intersects(element, clip))
      .map(({ id, classes }) => [id, classes])
      .sort(),
  );

/** Which parts of the page differ between two states - for failure messages. */
export function stateChanges(a, b) {
  const [markupA, boxesA, stylesA] = a.fingerprint.split('/');
  const [markupB, boxesB, stylesB] = b.fingerprint.split('/');
  const changes = [];
  if (a.scrollX !== b.scrollX || a.scrollY !== b.scrollY)
    changes.push(`scroll (${a.scrollX}, ${a.scrollY}) -> (${b.scrollX}, ${b.scrollY})`);
  if (markupA !== markupB) changes.push('target markup');
  if (boxesA !== boxesB) changes.push('target layout boxes');
  if (stylesA !== stylesB) changes.push('target computed styles');
  if (JSON.stringify(a.fixed) !== JSON.stringify(b.fixed)) changes.push('fixed elements');
  if (a.innerWidth !== b.innerWidth || a.innerHeight !== b.innerHeight) changes.push('viewport');
  return changes;
}

/** Bound on settles spent waiting for a page to stop changing by itself before an acquisition scroll. */
export const REST_SETTLES = 20;

/** Why a scroll position may not be used, compared with the state before acquisition; empty when it may. */
export function candidateRejections(before, after, clip, resizedDuringCandidate) {
  const reasons = [];
  if (after.innerWidth !== before.innerWidth || after.innerHeight !== before.innerHeight || resizedDuringCandidate) {
    reasons.push('the viewport was resized');
  }
  if (!visible(after, clip)) reasons.push('the clip is not fully inside the viewport at this position');
  if (after.fingerprint !== before.fingerprint)
    reasons.push("the target's markup, computed styles or layout boxes changed");
  if (ownOverlays(after) !== ownOverlays(before)) {
    reasons.push('a fixed overlay owned by the target moved relative to the target or changed its classes');
  }
  if (foreignInClip(after, clip) !== foreignInClip(before, clip)) {
    reasons.push('a fixed element the target does not own entered or left the clip');
  }
  return reasons;
}

/**
 * Width, height and whether every pixel is the same colour, read from a PNG as
 * Chrome writes it (8-bit RGB or RGBA, not interlaced). Anything else is
 * refused rather than guessed at.
 */
export function inspectPng(bytes) {
  if (bytes.length < 33 || bytes.readUInt32BE(0) !== 0x89504e47)
    throw new Error('acquisition: the screenshot is not a PNG');
  const width = bytes.readUInt32BE(16);
  const height = bytes.readUInt32BE(20);
  const depth = bytes[24];
  const colourType = bytes[25];
  const interlace = bytes[28];
  const channels = colourType === 6 ? 4 : colourType === 2 ? 3 : 0;
  if (depth !== 8 || !channels || interlace !== 0)
    throw new Error(`acquisition: unsupported PNG (depth ${depth}, colour type ${colourType}, interlace ${interlace})`);
  const chunks = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  let previous = Buffer.alloc(stride);
  let first = null;
  let uniform = true;
  for (let row = 0; row < height && uniform; row += 1) {
    const filter = raw[row * (stride + 1)];
    const line = Buffer.from(raw.subarray(row * (stride + 1) + 1, (row + 1) * (stride + 1)));
    for (let i = 0; i < stride; i += 1) {
      const left = i >= channels ? line[i - channels] : 0;
      const up = previous[i];
      const upLeft = i >= channels ? previous[i - channels] : 0;
      let add = 0;
      if (filter === 1) add = left;
      else if (filter === 2) add = up;
      else if (filter === 3) add = (left + up) >> 1;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left),
          pb = Math.abs(p - up),
          pc = Math.abs(p - upLeft);
        add = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
      } else if (filter !== 0) throw new Error(`acquisition: unknown PNG filter ${filter}`);
      line[i] = (line[i] + add) & 0xff;
    }
    if (first === null) first = Buffer.from(line.subarray(0, channels));
    for (let i = 0; i < stride && uniform; i += channels) {
      for (let c = 0; c < channels; c += 1)
        if (line[i + c] !== first[c]) {
          uniform = false;
          break;
        }
    }
    previous = line;
  }
  return {
    width,
    height,
    uniform,
    uniformColour: uniform ? [...first].map((v) => v.toString(16).padStart(2, '0')).join('') : null,
  };
}

/**
 * Takes one screenshot of `clip` and returns its bytes with the acquisition
 * diagnostics, or throws an AcquisitionError carrying them.
 *
 * `context` names the capture (profile, caseId, stage, target, theme), gives
 * the semantic viewport, the case's followed references and the settle the
 * harness already uses after every page change.
 */
export async function acquireScreenshot(page, clip, context) {
  const { profile, caseId, stage, target, theme, viewport, followedReferences, settleExpression } = context;
  const diagnostics = { profile, caseId, stage, target, theme, clip: { ...clip } };
  // What a failure leaves behind, kept current so a thrown error reports it:
  // whether pixels were obtained at all, whether the page is back where the
  // harness left it, and whether anything more may be measured on it.
  diagnostics.screenshotObtained = false;
  diagnostics.restoration = 'not-needed';
  diagnostics.pageUsable = true;
  const resized = () => page.eventCounts['Page.frameResized'];
  const fail = async (code, reason, extra = {}) => {
    if (!(code in ACQUISITION_FAILURES)) throw new Error(`acquisition: unknown failure code ${code}`);
    Object.assign(diagnostics, extra, { failureCode: code, failureKind: ACQUISITION_FAILURES[code], failure: reason });
    throw new AcquisitionError(
      `Screenshot acquisition failed for ${caseId} [${stage}] on ${target} (${theme}): ${reason}.`,
      diagnostics,
    );
  };
  const readState = () => page.evaluate(stateExpression(caseId, followedReferences));
  const capture = async (beyondViewport) => {
    const shot = await page.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: beyondViewport,
      fromSurface: true,
      clip: { ...clip, scale: 1 },
    });
    const bytes = Buffer.from(shot.data, 'base64');
    // Provenance of the pixels actually obtained, whatever happens to them next.
    diagnostics.screenshotObtained = true;
    diagnostics.obtainedSha256 = createHash('sha256').update(bytes).digest('hex');
    return bytes;
  };
  // A uniform image is recorded, not refused: the catalog has legitimate ones -
  // a skeleton that fills its case, a spinner with a zero stroke. What makes a
  // capture silently blank is a clip outside the painted viewport, and that is
  // excluded before and after the capture, not guessed from the pixels.
  const validate = async (bytes) => {
    let png;
    try {
      png = inspectPng(bytes);
    } catch (error) {
      await fail('screenshot-unreadable', error.message);
    }
    diagnostics.screenshot = {
      width: png.width,
      height: png.height,
      uniform: png.uniform,
      uniformColour: png.uniformColour,
    };
    if (png.width !== clip.width || png.height !== clip.height) {
      await fail(
        'screenshot-size-mismatch',
        `the screenshot is ${png.width}x${png.height}, the clip ${clip.width}x${clip.height}`,
      );
    }
  };

  const before = await readState();
  diagnostics.viewport = { width: before.innerWidth, height: before.innerHeight };
  diagnostics.scrollBefore = { x: before.scrollX, y: before.scrollY };
  if (before.innerWidth !== viewport.width || before.innerHeight !== viewport.height || before.visual.scale !== 1) {
    await fail(
      'viewport-not-semantic',
      `the page does not have the semantic ${viewport.width}x${viewport.height} viewport`,
      { pageUsable: false },
    );
  }
  const resizedAtStart = resized();

  const legacy = legacyAcquisition(profile, caseId, stage);
  if (legacy) {
    diagnostics.mode = LEGACY;
    diagnostics.legacyReason = legacy.reason;
    diagnostics.scrolled = false;
    if (clip.width <= before.innerWidth && clip.height <= before.innerHeight) {
      await fail(
        'legacy-entry-stale',
        'an allowlisted legacy capture fits the semantic viewport - the allowlist entry is stale and must be removed',
      );
    }
    const bytes = await capture(true);
    diagnostics.frameResized = resized() - resizedAtStart;
    await validate(bytes);
    return { bytes, diagnostics };
  }

  diagnostics.mode = SEMANTIC_SCROLL;
  if (clip.width > before.innerWidth || clip.height > before.innerHeight) {
    await fail(
      'clip-exceeds-viewport',
      'the clip is larger than the semantic viewport and the capture is not on the legacy allowlist',
    );
  }

  let rest = before;
  let bytes;
  // Set before the first acquisition scroll: from then on every exit, failed
  // or not, goes through the restoration below.
  let scrolledAway = false;
  let primary = null;
  diagnostics.scrolled = false;
  diagnostics.candidates = [];
  try {
    bytes = await acquireInView();
  } catch (error) {
    primary = error;
  }
  if (scrolledAway) {
    // Restoration is attempted and verified on every path that scrolled. A
    // restoration that cannot be verified - it differs, or it threw - leaves a
    // page nothing more may be measured on; its own failure is recorded beside
    // the original error, never in its place.
    try {
      await page.evaluate(`window.scrollTo(${rest.scrollX}, ${rest.scrollY})`);
      await page.evaluate(settleExpression);
      const changes = stateChanges(rest, await readState());
      diagnostics.restoration = changes.length === 0 ? 'verified' : 'failed';
      if (changes.length) diagnostics.restorationChanges = changes;
    } catch (error) {
      diagnostics.restoration = 'failed';
      diagnostics.cleanupFailure = String(error?.message ?? error);
    }
    if (diagnostics.restoration !== 'verified') diagnostics.pageUsable = false;
  }
  diagnostics.frameResized = resized() - resizedAtStart;
  // A resize reached the page's own listeners, so what it measures next is not
  // what it measured before.
  if (diagnostics.frameResized !== 0) diagnostics.pageUsable = false;
  if (primary) throw primary;
  if (diagnostics.restoration === 'failed') {
    await fail(
      'restoration-failed',
      'the page did not return to its state before acquisition when the scroll was restored ' +
        `(${(diagnostics.restorationChanges ?? [diagnostics.cleanupFailure]).join(', ')})`,
    );
  }
  if (diagnostics.frameResized !== 0) {
    await fail('viewport-resized-during-acquisition', 'the viewport was resized during semantic-scroll acquisition');
  }
  return { bytes, diagnostics };

  /** The clip brought into view if it is not, captured once, and checked. */
  async function acquireInView() {
    let atCapture;
    if (!visible(before, clip)) {
      // An acquisition scroll is judged by what it changes, which can only be
      // told apart from what the page changes by itself on a page at rest - a
      // scenario may leave one in motion: Space on a disabled checkbox starts the
      // browser's animated page scroll, which runs for several frames after the
      // scenario's own settle. The existing settle is repeated, bounded, until
      // two consecutive states agree; a page that never comes to rest fails.
      diagnostics.restSettles = 0;
      for (let previous = before; ;) {
        await page.evaluate(settleExpression);
        diagnostics.restSettles += 1;
        rest = await readState();
        if (stateChanges(previous, rest).length === 0) break;
        if (diagnostics.restSettles >= REST_SETTLES) {
          await fail(
            'page-not-at-rest',
            `the page did not come to rest within ${REST_SETTLES} settles (${stateChanges(previous, rest).join(', ')})`,
          );
        }
        previous = rest;
      }
      diagnostics.scrollAtRest = { x: rest.scrollX, y: rest.scrollY };
    }
    if (!visible(rest, clip)) {
      const before = rest;
      if (clip.x < before.visual.left || clip.x + clip.width > before.visual.left + before.visual.width) {
        await fail(
          'clip-outside-viewport-horizontally',
          'the clip is outside the viewport horizontally; acquisition only scrolls vertically',
        );
      }
      let chosen = null;
      for (const y of scrollCandidates(clip, before.scrollY, before.innerHeight, before.maxScrollY)) {
        const resizedBefore = resized();
        scrolledAway = true;
        await page.evaluate(`window.scrollTo(${before.scrollX}, ${y})`);
        await page.evaluate(settleExpression);
        const state = await readState();
        const rejected = candidateRejections(before, state, clip, resized() !== resizedBefore);
        diagnostics.candidates.push({ y, scrollY: state.scrollY, rejected });
        if (rejected.length === 0) {
          chosen = state;
          break;
        }
      }
      if (!chosen) await fail('no-valid-scroll-position', 'no scroll position satisfied the acquisition invariants');
      atCapture = chosen;
      diagnostics.scrolled = true;
      diagnostics.chosenScrollY = chosen.scrollY;
    } else {
      atCapture = rest;
    }

    const resizedBeforeCapture = resized();
    const bytes = await capture(false);
    if (resized() !== resizedBeforeCapture) {
      await fail('viewport-resized-during-capture', 'the viewport was resized while the screenshot was taken', {
        pageUsable: false,
      });
    }
    // What acquisition answers for: the clip was inside the viewport when the
    // pixels were taken, and - when it scrolled - the target it validated is the
    // target it captured. A capture that needed no scroll took the page as the
    // harness left it, as captures always have; whether that page was still
    // changing is not something acquisition did.
    const captured = await readState();
    const moved =
      captured.scrollX !== atCapture.scrollX || captured.scrollY !== atCapture.scrollY || !visible(captured, clip);
    if (moved || (diagnostics.scrolled && captured.fingerprint !== atCapture.fingerprint)) {
      await fail(
        'page-changed-during-capture',
        `the page changed while the screenshot was taken (${stateChanges(atCapture, captured).join(', ') || 'the clip left the viewport'})`,
      );
    }
    await validate(bytes);
    return bytes;
  }
}
