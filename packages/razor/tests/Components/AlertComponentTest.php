<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\AlertComponent;
use Codemonster\VueForge\Razor\Components\BadgeComponent;
use Codemonster\VueForge\Razor\Components\TagComponent;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfAlert.
 *
 * The assertions mirror
 * packages/core/src/components/alert/VfAlert.characterization.spec.ts case for
 * case. The block that carries the milestone is "what an alert does not have":
 * no dismiss control in any configuration, no live-region attribute of its
 * own, no role change per tone. An implementation that "completed" the alert
 * with a close button passes every rendering assertion about the parts it does
 * have, and fails here.
 *
 * This is also where `iconGlyph` and `titleText` are covered: the Vue template
 * never reads those halves of the shared rule - the compiler answers them
 * through slot fallback - so no Vue mutation can detect them and this suite is
 * their only executable proof outside the shared vectors.
 */
final class AlertComponentTest extends TestCase
{
    private const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-alert');
        self::assertNotNull($component, 'The vf-alert component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    private static function glyph(string $name): string
    {
        return IconRenderer::render($name, 'var(--vf-icon-size-lg)');
    }

    // ------------------------------------------------------------- structure

    public function testItRendersAnEmptyAlert(): void
    {
        // The icon container with the primary glyph, no title paragraph, and
        // the unconditional empty body.
        self::assertSame(
            '<section class="vf-alert" role="alert">'
                . '<div class="vf-alert__icon" aria-hidden="true">' . self::glyph('info-circle') . '</div>'
                . '<div class="vf-alert__content"><div class="vf-alert__body"></div></div>'
                . '</section>',
            $this->render(),
        );
    }

    public function testItRendersTheFullComposition(): void
    {
        self::assertSame(
            '<section class="vf-alert vf-alert--success" role="alert">'
                . '<div class="vf-alert__icon" aria-hidden="true">' . self::glyph('check-circle') . '</div>'
                . '<div class="vf-alert__content">'
                . '<p class="vf-alert__title">Saved</p>'
                . '<div class="vf-alert__body">Changes were saved.</div>'
                . '</div></section>',
            $this->render(['tone' => 'success', 'title' => 'Saved'], ['default' => self::slot('Changes were saved.')]),
        );
    }

    public function testTheBodyWrapperIsUnconditional(): void
    {
        self::assertStringContainsString('<div class="vf-alert__body"></div>', $this->render());
        self::assertStringContainsString(
            '<div class="vf-alert__body"></div>',
            $this->render([], ['default' => self::slot('')]),
        );
    }

    // ---------------------------------------------- what an alert does not have

    public function testItRendersNoInteractiveElementOfItsOwnInAnyConfiguration(): void
    {
        foreach (self::TONES as $tone) {
            foreach ([false, true] as $hideIcon) {
                foreach ([null, 'Saved'] as $title) {
                    $markup = $this->render(
                        ['tone' => $tone, 'hide-icon' => $hideIcon, 'title' => $title],
                        ['default' => self::slot('Body'), 'title' => self::slot('Custom'), 'icon' => self::slot('<i>i</i>')],
                    );

                    self::assertStringNotContainsString('<button', $markup, "tone {$tone}");
                    self::assertStringNotContainsString('<a ', $markup, "tone {$tone}");
                    self::assertStringNotContainsString('tabindex', $markup, "tone {$tone}");
                    self::assertSame(1, substr_count($markup, 'role='), "tone {$tone} exposes a second role");
                }
            }
        }
    }

    public function testAConsumerAttributeThatSoundsLikeADismissSwitchGrowsNoControl(): void
    {
        // `dismissible` is not a prop. It falls through to the section as an
        // attribute and does nothing else, which is what the reference does.
        $markup = $this->render(['dismissible' => 'true', 'closable' => true]);

        self::assertStringContainsString('dismissible="true"', $markup);
        self::assertStringNotContainsString('<button', $markup);
    }

    public function testItWritesNoLiveRegionAttributesOfItsOwn(): void
    {
        $markup = $this->render(['tone' => 'danger', 'title' => 'Failed']);

        self::assertStringNotContainsString('aria-live', $markup);
        self::assertStringNotContainsString('aria-atomic', $markup);
        self::assertStringNotContainsString('aria-label', $markup);
        self::assertStringNotContainsString('aria-describedby', $markup);
        // The one ARIA attribute it does write is on the icon container.
        self::assertSame(1, substr_count($markup, 'aria-'));
    }

    public function testItIsNotImplementedThroughTheBadgeOrTagComponent(): void
    {
        // The tone vocabularies look alike; the components are not alike. A
        // vf-alert that delegated its class list would still emit the right
        // classes for six of eight tones; this refuses the delegation itself.
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $alert = $registry->resolve('vf-alert');

        self::assertInstanceOf(AlertComponent::class, $alert);
        self::assertNotInstanceOf(BadgeComponent::class, $alert);
        self::assertNotInstanceOf(TagComponent::class, $alert);

        $source = (string) file_get_contents(
            (string) (new \ReflectionClass(AlertComponent::class))->getFileName(),
        );
        $code = preg_replace('#/\*\*.*?\*/#s', '', $source);
        self::assertIsString($code);
        self::assertStringNotContainsString('BadgeComponent', $code);
        self::assertStringNotContainsString('TagComponent', $code);
        self::assertStringNotContainsString('PresentationState', $code);
    }

    // ------------------------------------------------------------------ tone

    public function testEveryToneEmitsItsModifierExceptPrimary(): void
    {
        self::assertStringContainsString('class="vf-alert"', $this->render(['tone' => 'primary']));
        self::assertStringContainsString('class="vf-alert"', $this->render());
        foreach (['neutral', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as $tone) {
            self::assertStringContainsString("class=\"vf-alert vf-alert--{$tone}\"", $this->render(['tone' => $tone]));
        }
    }

    public function testEveryToneFallsBackToItsGlyph(): void
    {
        $expected = [
            'neutral' => 'info-circle',
            'primary' => 'info-circle',
            'success' => 'check-circle',
            'info' => 'info-circle',
            'warn' => 'alert-circle',
            'help' => 'question-circle',
            'danger' => 'x-circle',
            'contrast' => 'info-circle',
        ];

        foreach ($expected as $tone => $glyph) {
            self::assertStringContainsString(
                '<div class="vf-alert__icon" aria-hidden="true">' . self::glyph($glyph) . '</div>',
                $this->render(['tone' => $tone]),
                "tone {$tone}",
            );
        }
    }

    public function testToneNeverChangesTheRole(): void
    {
        foreach (self::TONES as $tone) {
            self::assertStringContainsString('role="alert"', $this->render(['tone' => $tone]), "tone {$tone}");
        }
    }

    public function testItNeverRendersABadgeOrTagBlockName(): void
    {
        foreach (self::TONES as $tone) {
            $markup = $this->render(['tone' => $tone]);

            self::assertStringNotContainsString('vf-badge', $markup);
            self::assertStringNotContainsString('vf-tag', $markup);
        }
    }

    // ------------------------------------------------------------------ icon

    public function testTheGlyphRendersThroughTheNeutralRegistryAtTheLargeSize(): void
    {
        // Not an alert-specific icon map and not an SVG copied into the
        // component: the same registry every other Razor component reads, at
        // the size the reference passes explicitly.
        $markup = $this->render(['tone' => 'warn']);

        self::assertStringContainsString('width="var(--vf-icon-size-lg)"', $markup);
        self::assertStringContainsString(self::glyph('alert-circle'), $markup);
    }

    public function testOnlyTheContainerIsMarkedDecorative(): void
    {
        // aria-hidden on the div, not on the svg. The glyph is hidden by
        // inheritance, exactly as the reference writes it.
        $markup = $this->render();

        self::assertStringContainsString('<div class="vf-alert__icon" aria-hidden="true">', $markup);
        self::assertStringNotContainsString('<svg aria-hidden', $markup);
        self::assertSame(1, substr_count($markup, 'aria-hidden'));
    }

    public function testAnExplicitIconReplacesTheToneGlyph(): void
    {
        self::assertStringContainsString(self::glyph('user'), $this->render(['tone' => 'danger', 'icon' => 'user']));
        self::assertStringNotContainsString(self::glyph('x-circle'), $this->render(['tone' => 'danger', 'icon' => 'user']));
    }

    public function testAnUnknownIconNameIsRejectedByTheRegistry(): void
    {
        // The alert validates nothing of its own; the registry does. The Vue
        // icon package falls back to a default glyph here instead, which is a
        // divergence of the icon pipeline rather than of the alert, and it is
        // the one every icon-rendering Razor component already has.
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['icon' => 'no-such-glyph']);
    }

    public function testAnIconSlotReplacesTheGlyphButNotTheContainer(): void
    {
        self::assertStringContainsString(
            '<div class="vf-alert__icon" aria-hidden="true"><i class="mine">i</i></div>',
            $this->render(['icon' => 'user'], ['icon' => self::slot('<i class="mine">i</i>')]),
        );
        self::assertStringNotContainsString('<svg', $this->render([], ['icon' => self::slot('<i>i</i>')]));
    }

    public function testAnIconSlotThatRendersNothingBringsTheGlyphBack(): void
    {
        self::assertStringContainsString(
            '<div class="vf-alert__icon" aria-hidden="true">' . self::glyph('alert-circle') . '</div>',
            $this->render(['tone' => 'warn'], ['icon' => self::slot('')]),
        );
    }

    public function testHideIconRemovesTheContainerConsumerSlotIncluded(): void
    {
        $markup = $this->render(['hide-icon' => true, 'icon' => 'user'], ['icon' => self::slot('<i class="mine">i</i>')]);

        self::assertSame(
            '<section class="vf-alert" role="alert">'
                . '<div class="vf-alert__content"><div class="vf-alert__body"></div></div>'
                . '</section>',
            $markup,
        );
    }

    public function testHideIconAcceptsBothSpellings(): void
    {
        self::assertStringNotContainsString('vf-alert__icon', $this->render(['hideIcon' => true]));
        self::assertStringNotContainsString('vf-alert__icon', $this->render(['hide-icon' => 'true']));
        self::assertStringContainsString('vf-alert__icon', $this->render(['hide-icon' => 'false']));
    }

    // ----------------------------------------------------------------- title

    public function testTheTitleIsAClassedParagraph(): void
    {
        self::assertStringContainsString('<p class="vf-alert__title">Saved</p>', $this->render(['title' => 'Saved']));
    }

    public function testAnEmptyStringTitleRendersNoParagraph(): void
    {
        self::assertStringNotContainsString('vf-alert__title', $this->render(['title' => '']));
    }

    public function testATitleSlotOpensTheParagraphWithNoProp(): void
    {
        self::assertStringContainsString(
            '<p class="vf-alert__title"><em class="mine">Custom</em></p>',
            $this->render([], ['title' => self::slot('<em class="mine">Custom</em>')]),
        );
    }

    public function testATitleSlotDropsThePropTextEvenWhenATitleWasPassed(): void
    {
        $markup = $this->render(['title' => 'Saved'], ['title' => self::slot('Custom')]);

        self::assertStringContainsString('<p class="vf-alert__title">Custom</p>', $markup);
        self::assertStringNotContainsString('Saved', $markup);
    }

    public function testATitleSlotThatRendersNothingBringsThePropTextBack(): void
    {
        self::assertStringContainsString(
            '<p class="vf-alert__title">Saved</p>',
            $this->render(['title' => 'Saved'], ['title' => self::slot('')]),
        );
    }

    public function testAnEmptyTitleSlotWithAnEmptyPropRendersAnEmptyParagraph(): void
    {
        // The slot opened the paragraph; it produced nothing; the fallback is
        // the empty prop.
        self::assertStringContainsString(
            '<p class="vf-alert__title"></p>',
            $this->render(['title' => ''], ['title' => self::slot('')]),
        );
    }

    public function testAHostileTitleIsEscaped(): void
    {
        self::assertStringContainsString(
            '<p class="vf-alert__title">&lt;img src=x onerror=alert(1)&gt;</p>',
            $this->render(['title' => '<img src=x onerror=alert(1)>']),
        );
    }

    // ------------------------------------------------------- ARIA and attrs

    public function testItWritesRoleAlertOnTheSection(): void
    {
        self::assertStringStartsWith('<section class="vf-alert" role="alert">', $this->render());
    }

    public function testAConsumerRoleReplacesItsOwn(): void
    {
        $markup = $this->render(['role' => 'status']);

        self::assertStringContainsString('role="status"', $markup);
        self::assertStringNotContainsString('role="alert"', $markup);
        self::assertSame(1, substr_count($markup, 'role='));
    }

    public function testANullConsumerRoleLeavesTheComponentRoleInPlace(): void
    {
        // What a Razor template writes for `:role="$case['attrs']['role'] ?? null"`
        // when the case has none: the attribute arrives as null and must not
        // erase the component's own role.
        self::assertStringContainsString('role="alert"', $this->render(['role' => null]));
    }

    public function testAConsumerMayAddLiveRegionAttributesAndAName(): void
    {
        $markup = $this->render(['aria-live' => 'polite', 'aria-atomic' => 'false', 'aria-label' => 'Save']);

        self::assertStringContainsString('aria-live="polite"', $markup);
        self::assertStringContainsString('aria-atomic="false"', $markup);
        self::assertStringContainsString('aria-label="Save"', $markup);
        self::assertStringContainsString('role="alert"', $markup);
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-alert vf-alert--warn consumer-alert"',
            $this->render(['tone' => 'warn', 'class' => 'consumer-alert']),
        );
        self::assertStringContainsString('class="vf-alert consumer-alert"', $this->render(['class' => 'consumer-alert']));
    }

    public function testItForwardsConsumerAttributesToTheSectionOnly(): void
    {
        $markup = $this->render(
            ['title' => 'Saved', 'style' => 'opacity: 0.6', 'data-testid' => 'alert'],
            ['default' => self::slot('Body')],
        );

        self::assertStringContainsString('style="opacity: 0.6"', $markup);
        self::assertSame(1, substr_count($markup, 'data-testid="alert"'));
        self::assertStringContainsString('<div class="vf-alert__icon" aria-hidden="true">', $markup);
        self::assertStringContainsString('<div class="vf-alert__content">', $markup);
        self::assertStringContainsString('<p class="vf-alert__title">', $markup);
        self::assertStringContainsString('<div class="vf-alert__body">', $markup);
    }

    public function testAConsumerControlInTheBodySurvivesUnchanged(): void
    {
        self::assertStringContainsString(
            '<div class="vf-alert__body"><button type="button">Retry</button></div>',
            $this->render([], ['default' => self::slot('<button type="button">Retry</button>')]),
        );
    }

    public function testAConsumerControlInTheTitleSurvivesUnchanged(): void
    {
        self::assertStringContainsString(
            '<p class="vf-alert__title"><a href="#docs">Read more</a></p>',
            $this->render([], ['title' => self::slot('<a href="#docs">Read more</a>')]),
        );
    }

    public function testAnUnsupportedPropTypeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['not', 'scalar']]);
    }
}
