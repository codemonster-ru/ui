<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\CardComponent;
use Codemonster\VueForge\Razor\Components\PanelComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfPanel.
 *
 * The assertions mirror
 * packages/core/src/components/panel/VfPanel.characterization.spec.ts case for
 * case. The tests that carry the milestone are the ones about what a panel does
 * *not* have: no body wrapper, no footer, no compact modifier. A Card-shaped
 * implementation passes every other assertion in this file.
 *
 * This is also where `headerTitle` is covered: the Vue template never reads that
 * half of the shared rule - the compiler answers it through slot fallback - so
 * no Vue mutation can detect it and this suite is its only executable proof
 * outside the shared vectors.
 */
final class PanelComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-panel');
        self::assertNotNull($component, 'The vf-panel component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    public function testItRendersAnEmptySectionWhenNothingIsPassed(): void
    {
        self::assertSame('<section class="vf-panel"></section>', $this->render());
    }

    public function testItRendersASectionRatherThanADivOrArticle(): void
    {
        self::assertStringStartsWith('<section', $this->render());
    }

    public function testItRendersTheHeaderBeforeTheDefaultSlot(): void
    {
        self::assertSame(
            '<section class="vf-panel"><header><h3 class="vf-panel__title">Workspace</h3></header>'
                . '<p>Body</p></section>',
            $this->render(['title' => 'Workspace'], ['default' => self::slot('<p>Body</p>')]),
        );
    }

    // ------------------------------------------------- what a panel does not have

    public function testTheDefaultSlotRendersStraightIntoTheSectionWithNoWrapper(): void
    {
        // The sharpest structural difference from VfCard. A card puts its
        // default slot in a classed div; a panel puts it nowhere at all.
        $markup = $this->render([], ['default' => self::slot('<p>Body</p>')]);

        self::assertSame('<section class="vf-panel"><p>Body</p></section>', $markup);
        self::assertStringNotContainsString('__body', $markup);
        self::assertStringNotContainsString('<div', $markup);
    }

    public function testAnEmptyDefaultSlotRendersNothingAtAll(): void
    {
        // A card emits an empty classed div here, which still holds a row and a
        // column gap open in the flex layout. A panel emits nothing, because
        // there is no wrapper to emit.
        self::assertSame('<section class="vf-panel"></section>', $this->render([], ['default' => self::slot('')]));
    }

    public function testAFooterSlotIsIgnoredEntirely(): void
    {
        // Not an empty footer: no footer element. A Card-shaped implementation
        // would render one keyed on the slot being present.
        $markup = $this->render(['title' => 'Workspace'], ['footer' => self::slot('Updated 3 minutes ago')]);

        self::assertStringNotContainsString('<footer', $markup);
        self::assertStringNotContainsString('Updated 3 minutes ago', $markup);
    }

    public function testItNeverRendersACardBlockName(): void
    {
        $markup = $this->render(
            ['title' => 'Workspace', 'subtle' => true],
            ['default' => self::slot('Body'), 'footer' => self::slot('Footer')],
        );

        self::assertStringNotContainsString('vf-card', $markup);
    }

    public function testItIsNotImplementedThroughTheCardComponent(): void
    {
        // The M18 independence proof, as executable evidence rather than as a
        // comment. A panel that delegated would still pass every rendering
        // assertion above; this is what refuses the delegation itself.
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $panel = $registry->resolve('vf-panel');
        $card = $registry->resolve('vf-card');

        self::assertInstanceOf(PanelComponent::class, $panel);
        self::assertNotInstanceOf(CardComponent::class, $panel);
        self::assertNotSame($card, $panel);

        // Nothing in the class's own source names the card, in any casing: not
        // a use statement, not a call, not a property holding one.
        $source = (string) file_get_contents(
            (string) (new \ReflectionClass(PanelComponent::class))->getFileName(),
        );
        $code = preg_replace('#/\*\*.*?\*/#s', '', $source);
        self::assertIsString($code);
        self::assertStringNotContainsString('CardComponent', $code);
        self::assertStringNotContainsString('CardState', $code);
    }

    public function testItHasNoCompactModifier(): void
    {
        // `compact` is VfCard's prop. On a panel it is an unknown attribute and
        // falls through to the section, which is the historical behaviour for
        // anything the component does not declare.
        $markup = $this->render(['compact' => 'true']);

        self::assertStringNotContainsString('vf-panel--compact', $markup);
        self::assertStringNotContainsString('vf-card--compact', $markup);
    }

    // ---------------------------------------------------------------- the header

    public function testTheHeaderWrapperCarriesNoClass(): void
    {
        self::assertStringContainsString('<header><h3', $this->render(['title' => 'Workspace']));
    }

    public function testAnEmptyStringTitleRendersNoHeader(): void
    {
        self::assertSame('<section class="vf-panel"></section>', $this->render(['title' => '']));
    }

    public function testAHeaderSlotOpensTheHeaderWithNoTitle(): void
    {
        self::assertSame(
            '<section class="vf-panel"><header><span>Custom</span></header></section>',
            $this->render([], ['header' => self::slot('<span>Custom</span>')]),
        );
    }

    public function testAHeaderSlotDropsTheFallbackHeadingEvenWithATitle(): void
    {
        $markup = $this->render(['title' => 'Workspace'], ['header' => self::slot('Custom')]);

        self::assertStringNotContainsString('<h3', $markup);
        self::assertStringNotContainsString('Workspace', $markup);
    }

    public function testAHeaderSlotThatRendersNothingBringsTheFallbackHeadingBack(): void
    {
        // The rule Vue answers through slot fallback and this adapter has to
        // decide, because a Razor slot arrives as already-rendered markup.
        self::assertSame(
            '<section class="vf-panel"><header><h3 class="vf-panel__title">Workspace</h3></header></section>',
            $this->render(['title' => 'Workspace'], ['header' => self::slot('')]),
        );
    }

    public function testAnEmptyHeaderSlotWithNoTitleRendersAnEmptyHeading(): void
    {
        self::assertSame(
            '<section class="vf-panel"><header><h3 class="vf-panel__title"></h3></header></section>',
            $this->render([], ['header' => self::slot('')]),
        );
    }

    public function testAHostileTitleIsEscaped(): void
    {
        self::assertStringContainsString(
            '<h3 class="vf-panel__title">&lt;img src=x onerror=alert(1)&gt;</h3>',
            $this->render(['title' => '<img src=x onerror=alert(1)>']),
        );
    }

    // --------------------------------------------------------- classes and attrs

    public function testItEmitsTheSubtleModifier(): void
    {
        self::assertStringContainsString('class="vf-panel vf-panel--subtle"', $this->render(['subtle' => true]));
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-panel vf-panel--subtle consumer-panel"',
            $this->render(['subtle' => true, 'class' => 'consumer-panel']),
        );
    }

    public function testItForwardsConsumerAttributesToTheSection(): void
    {
        $markup = $this->render([
            'style' => 'opacity: 0.6',
            'data-testid' => 'panel',
            'role' => 'region',
            'aria-label' => 'Workspace',
        ]);

        self::assertStringContainsString('style="opacity: 0.6"', $markup);
        self::assertStringContainsString('data-testid="panel"', $markup);
        self::assertStringContainsString('role="region"', $markup);
        self::assertStringContainsString('aria-label="Workspace"', $markup);
    }

    public function testItWritesNoRoleOrAccessibleNameOfItsOwn(): void
    {
        $markup = $this->render(['title' => 'Workspace']);

        self::assertStringNotContainsString('role=', $markup);
        self::assertStringNotContainsString('aria-', $markup);
    }

    public function testItRendersNoInteractiveElementOfItsOwn(): void
    {
        $markup = $this->render(
            ['title' => 'Workspace', 'subtle' => true],
            ['default' => self::slot('Body')],
        );

        self::assertStringNotContainsString('<button', $markup);
        self::assertStringNotContainsString('<a ', $markup);
        self::assertStringNotContainsString('tabindex', $markup);
    }

    public function testAConsumerControlInASlotSurvivesUnchanged(): void
    {
        self::assertSame(
            '<section class="vf-panel"><button type="button">Rename</button></section>',
            $this->render([], ['default' => self::slot('<button type="button">Rename</button>')]),
        );
    }

    public function testAnUnsupportedPropTypeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['not', 'scalar']]);
    }
}
