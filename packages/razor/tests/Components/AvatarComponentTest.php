<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfAvatar.
 *
 * The assertions mirror
 * packages/core/src/components/avatar/VfAvatar.characterization.spec.ts case
 * for case. The fallback chain gets a test per branch rather than one test that
 * checks "something rendered": each branch produces a different element with
 * different accessibility semantics, and a reordering renders an avatar either
 * way.
 */
final class AvatarComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-avatar');
        self::assertNotNull($component, 'The vf-avatar component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    public function testItRendersAnEmptySpanWhenNothingSelectsABranch(): void
    {
        self::assertSame('<span class="vf-avatar"></span>', $this->render());
    }

    // ------------------------------------------------------------ the chain

    public function testAnImageBeatsEverythingAfterIt(): void
    {
        $markup = $this->render(
            ['image' => '/a.png', 'label' => 'MC', 'icon' => 'user'],
            ['default' => self::slot('SLOT')],
        );

        self::assertStringContainsString('vf-avatar__image', $markup);
        self::assertStringNotContainsString('vf-avatar__label', $markup);
        self::assertStringNotContainsString('vf-avatar__icon', $markup);
        self::assertStringNotContainsString('SLOT', $markup);
    }

    public function testALabelBeatsAnIconAndTheSlot(): void
    {
        // The adjacent pair most easily reversed: both are plausible avatar
        // content, and swapping them renders an avatar either way.
        $markup = $this->render(['label' => 'MC', 'icon' => 'user'], ['default' => self::slot('SLOT')]);

        self::assertStringContainsString('vf-avatar__label', $markup);
        self::assertStringNotContainsString('vf-avatar__icon', $markup);
        self::assertStringNotContainsString('SLOT', $markup);
    }

    public function testAnIconBeatsTheSlot(): void
    {
        $markup = $this->render(['icon' => 'user'], ['default' => self::slot('SLOT')]);

        self::assertStringContainsString('vf-avatar__icon', $markup);
        self::assertStringNotContainsString('SLOT', $markup);
    }

    public function testTheSlotIsReachedOnlyWhenAllThreePropsAreAbsent(): void
    {
        self::assertStringContainsString('SLOT', $this->render([], ['default' => self::slot('SLOT')]));
    }

    public function testAnEmptyStringDoesNotSelectItsBranch(): void
    {
        self::assertStringContainsString('vf-avatar__label', $this->render(['image' => '', 'label' => 'MC']));
        self::assertStringContainsString('vf-avatar__icon', $this->render(['label' => '', 'icon' => 'user']));
        self::assertSame('<span class="vf-avatar"></span>', $this->render(['image' => '', 'label' => '', 'icon' => '']));
    }

    // ------------------------------------------------------------ the image

    public function testTheImageBranchWritesTheClassAndSource(): void
    {
        self::assertStringContainsString(
            '<img class="vf-avatar__image" src="/a.png" alt="Maya">',
            $this->render(['image' => '/a.png', 'image-alt' => 'Maya']),
        );
    }

    public function testTheImageIsDecorativeByDefault(): void
    {
        // alt="" rather than a missing alt. The two are different things to a
        // screen reader, and the reference chose the empty one.
        self::assertStringContainsString('alt=""', $this->render(['image' => '/a.png']));
    }

    public function testTheImageCarriesNoLoadingOrDimensionAttributes(): void
    {
        $markup = $this->render(['image' => '/a.png']);

        foreach (['loading=', 'decoding=', 'width=', 'height=', 'referrerpolicy='] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $markup);
        }
    }

    public function testImageAltIsIgnoredWhenTheImageBranchIsNotTaken(): void
    {
        self::assertStringNotContainsString('unused', $this->render(['label' => 'L', 'image-alt' => 'unused']));
    }

    public function testItEscapesAHostileAltAndSource(): void
    {
        $markup = $this->render(['image' => '/a.png?x="y', 'image-alt' => 'a"b<c&d']);

        self::assertStringContainsString('alt="a&quot;b&lt;c&amp;d"', $markup);
        self::assertStringContainsString('src="/a.png?x=&quot;y"', $markup);
    }

    // ------------------------------------------------------------ the label

    public function testTheLabelBranchWrapsItsTextInAClassedSpan(): void
    {
        self::assertStringContainsString('<span class="vf-avatar__label">MC</span>', $this->render(['label' => 'MC']));
    }

    public function testTheLabelIsNotTransformed(): void
    {
        // No initials extraction, no uppercasing. The stylesheet ellipsises;
        // the component writes what it was given.
        self::assertStringContainsString('>maya chen<', $this->render(['label' => 'maya chen']));
    }

    public function testItEscapesHostileLabelText(): void
    {
        $markup = $this->render(['label' => '<img src=x onerror=alert(1)>']);

        self::assertStringContainsString('&lt;img', $markup);
        self::assertStringNotContainsString('<img', $markup);
    }

    // ------------------------------------------------------------- the icon

    public function testTheIconBranchRendersThroughTheNeutralRegistry(): void
    {
        // Not an avatar-specific icon map and not an SVG copied into the
        // component: the same registry every other Razor component reads.
        self::assertSame(
            '<span class="vf-avatar">' . IconRenderer::render(
                'user',
                'var(--vf-icon-current-size, var(--vf-icon-size-md))',
                true,
                'vf-avatar__icon',
            ) . '</span>',
            $this->render(['icon' => 'user']),
        );
    }

    public function testTheAvatarClassLandsOnTheGlyphRatherThanAWrapper(): void
    {
        // VueIconify sets inheritAttrs: false and spreads its attrs onto the
        // inner svg, so the avatar's class reaches the glyph and the wrapper
        // span keeps only vf-icon-wrapper.
        $markup = $this->render(['icon' => 'user']);

        self::assertStringContainsString('<span class="vf-icon-wrapper"', $markup);
        self::assertStringContainsString('<svg class="vf-avatar__icon vf-icon', $markup);
    }

    public function testTheGlyphIsDecorative(): void
    {
        // So an icon-only avatar exposes no accessible name at all.
        self::assertStringContainsString('aria-hidden="true"', $this->render(['icon' => 'user']));
    }

    public function testTheGlyphTakesTheIconPackageDefaultSize(): void
    {
        // VfAvatar passes no size prop, so the icon component's own default
        // applies and both adapters must write the same custom properties.
        self::assertStringContainsString(
            'width="var(--vf-icon-current-size, var(--vf-icon-size-md))"',
            $this->render(['icon' => 'user']),
        );
    }

    public function testAnUnknownGlyphIsARefusalRatherThanASilentGap(): void
    {
        // The registry throws rather than rendering nothing. The Vue icon
        // component instead falls back to a placeholder glyph; that difference
        // is recorded as a divergence in the avatar parity policy rather than
        // papered over here.
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['icon' => 'no-such-glyph']);
    }

    // ------------------------------------------------------------- the slot

    public function testTheSlotBranchWrapsItsContentInNothing(): void
    {
        // Unlike the label branch, which wraps its text in a classed span.
        self::assertSame('<span class="vf-avatar"><b>X</b></span>', $this->render([], ['default' => self::slot('<b>X</b>')]));
    }

    // ----------------------------------------------------------- the classes

    public function testItEmitsNoModifierAtTheDefaultSizeAndShape(): void
    {
        self::assertStringContainsString('class="vf-avatar"', $this->render(['size' => 'md', 'shape' => 'square']));
    }

    public function testItEmitsTheSizeThenTheShapeModifier(): void
    {
        self::assertStringContainsString(
            'class="vf-avatar vf-avatar--lg vf-avatar--circle"',
            $this->render(['size' => 'lg', 'shape' => 'circle']),
        );
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-avatar vf-avatar--sm mine"',
            $this->render(['size' => 'sm', 'class' => 'mine']),
        );
    }

    public function testNoBranchPutsAClassOnTheRoot(): void
    {
        foreach ([['image' => '/a.png'], ['label' => 'MC'], ['icon' => 'user']] as $props) {
            self::assertStringContainsString('<span class="vf-avatar">', $this->render($props));
        }
    }

    // ------------------------------------------------------------- the attrs

    public function testItWritesNoRoleOrAccessibleNameOfItsOwn(): void
    {
        $markup = $this->render(['image' => '/a.png', 'image-alt' => 'Maya']);

        self::assertStringNotContainsString(' role=', $markup);
        self::assertStringNotContainsString('aria-label', $markup);
    }

    public function testItForwardsConsumerAriaStyleAndData(): void
    {
        $markup = $this->render([
            'icon' => 'user',
            'role' => 'img',
            'aria-label' => 'Maya Chen',
            'style' => 'opacity: 0.5',
            'data-testid' => 'avatar',
        ]);

        self::assertStringContainsString('role="img"', $markup);
        self::assertStringContainsString('aria-label="Maya Chen"', $markup);
        self::assertStringContainsString('style="opacity: 0.5"', $markup);
        self::assertStringContainsString('data-testid="avatar"', $markup);
    }

    public function testItDoesNotLeakConsumerAttributesOntoTheBranchChild(): void
    {
        $markup = $this->render(['image' => '/a.png', 'data-testid' => 'avatar']);

        self::assertSame(1, substr_count($markup, 'data-testid'));
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['data-x' => ['array']]);
    }
}
