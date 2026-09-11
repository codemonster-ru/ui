// The TypeScript half of the cross-language contract for VfAlert.
//
// packages/razor/tests/Support/AlertStateVectorsTest.php runs the same file
// against the PHP mirror.
import { describe, expect, it } from 'vitest';
import vectors from '../src/alert/state-vectors.json' with { type: 'json' };
import { resolveAlertClasses, resolveAlertIcon, resolveAlertRegions } from '../src/alert/state.js';
import { resolveBadgeClasses, resolveTagClasses } from '../src/presentation/state.js';

const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

const regions = (input: Partial<Parameters<typeof resolveAlertRegions>[0]>) =>
  resolveAlertRegions({ hideIcon: false, hasIconSlot: false, hasTitleSlot: false, ...input });

describe('shared alert state vectors', () => {
  it('covers every rule the PHP adapter restates', () => {
    expect(
      Object.keys(vectors)
        .filter((key) => !key.startsWith('$'))
        .sort(),
    ).toEqual(['resolveAlertClasses', 'resolveAlertIcon', 'resolveAlertRegions']);
  });

  it('suppresses the modifier at primary and emits it at neutral', () => {
    // The mirror image of the badge and the tag. This is the line a shared
    // "toned block" resolver would get wrong for one of the three components.
    expect(resolveAlertClasses('primary')).toEqual(['vf-alert']);
    expect(resolveAlertClasses('neutral')).toEqual(['vf-alert', 'vf-alert--neutral']);
  });

  it('is not the badge or tag resolver under another name', () => {
    // Same eight inputs, different answers at the two tones where the rules
    // disagree - and different block names everywhere.
    for (const tone of TONES) {
      const alert = resolveAlertClasses(tone).join(' ');

      expect(alert).not.toContain('vf-badge');
      expect(alert).not.toContain('vf-tag');
      expect(resolveBadgeClasses(tone).join(' ')).not.toContain('vf-alert');
      expect(resolveTagClasses(tone).join(' ')).not.toContain('vf-alert');
    }
    expect(resolveAlertClasses('neutral').length).not.toBe(resolveBadgeClasses('neutral').length);
    expect(resolveAlertClasses('primary').length).not.toBe(resolveTagClasses('primary').length);
  });

  it('maps four tones onto one glyph', () => {
    for (const tone of ['neutral', 'primary', 'info', 'contrast']) {
      expect(resolveAlertIcon({ tone })).toBe('info-circle');
    }
  });

  it('lets an explicit icon win, including the empty string', () => {
    expect(resolveAlertIcon({ tone: 'danger', icon: 'user' })).toBe('user');
    expect(resolveAlertIcon({ tone: 'danger', icon: '' })).toBe('');
    expect(resolveAlertIcon({ tone: 'danger', icon: null })).toBe('x-circle');
  });

  it('decides nothing about a role, because tone never changes it', () => {
    // There is no resolveAlertRole and no resolveAlertLiveRegion, and the
    // regions rule does not carry one either. Every alert writes role="alert";
    // an implementation that grew a "danger is assertive" mapping would have to
    // add a field here, and this is what refuses it.
    for (const vector of vectors.resolveAlertRegions) {
      expect(Object.keys(vector.expected).sort()).toEqual(['icon', 'iconGlyph', 'title', 'titleText']);
    }
    expect(Object.keys(regions({ title: 'Saved' })).sort()).toEqual(['icon', 'iconGlyph', 'title', 'titleText']);
  });

  it('decides nothing about a dismiss control, because there is none', () => {
    expect(regions({ title: 'Saved' })).not.toHaveProperty('dismiss');
    expect(regions({ title: 'Saved' })).not.toHaveProperty('close');
  });

  it('keys the icon container on hideIcon alone', () => {
    expect(regions({ hideIcon: true, hasIconSlot: true, iconSlotContent: true }).icon).toBe(false);
    expect(regions({ hideIcon: false }).icon).toBe(true);
  });

  it('proves an empty-string title renders no paragraph, but an empty title slot renders an empty one', () => {
    expect(regions({ title: '' }).title).toBe(false);
    expect(regions({ title: '', hasTitleSlot: true, titleSlotContent: false })).toEqual({
      icon: true,
      iconGlyph: true,
      title: true,
      titleText: true,
    });
  });

  it('proves both fallbacks come back when their slot renders nothing', () => {
    expect(regions({ hasIconSlot: true, iconSlotContent: false }).iconGlyph).toBe(true);
    expect(regions({ hasIconSlot: true, iconSlotContent: true }).iconGlyph).toBe(false);
    expect(regions({ title: 'Saved', hasTitleSlot: true, titleSlotContent: false }).titleText).toBe(true);
    expect(regions({ title: 'Saved', hasTitleSlot: true, titleSlotContent: true }).titleText).toBe(false);
  });

  it.each(vectors.resolveAlertClasses)('resolveAlertClasses($tone) -> $expected', (vector) => {
    expect(resolveAlertClasses(vector.tone)).toEqual(vector.expected);
  });

  it.each(vectors.resolveAlertIcon)('resolveAlertIcon($tone, $icon) -> $expected', (vector) => {
    expect(resolveAlertIcon({ tone: vector.tone, icon: vector.icon })).toBe(vector.expected);
  });

  it.each(vectors.resolveAlertRegions)(
    'resolveAlertRegions(hideIcon=$hideIcon, iconSlot=$hasIconSlot/$iconSlotContent, title=$title, titleSlot=$hasTitleSlot/$titleSlotContent) -> $expected',
    (vector) => {
      expect(
        resolveAlertRegions({
          hideIcon: vector.hideIcon,
          hasIconSlot: vector.hasIconSlot,
          iconSlotContent: vector.iconSlotContent,
          title: vector.title,
          hasTitleSlot: vector.hasTitleSlot,
          titleSlotContent: vector.titleSlotContent,
        }),
      ).toEqual(vector.expected);
    },
  );
});
