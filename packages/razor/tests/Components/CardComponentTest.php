<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfCard.
 *
 * The assertions mirror
 * packages/core/src/components/card/VfCard.characterization.spec.ts case for
 * case. The unclassed header and footer wrappers get their own tests because
 * they are the historical detail a reviewer would "fix" first, and a card with
 * vf-card__header on it still looks exactly like a card.
 *
 * This is also where `headerTitle` is covered: the Vue template never reads
 * that half of the shared rule - the compiler answers it through slot fallback -
 * so no Vue mutation can detect it and this suite is its only executable proof
 * outside the shared vectors.
 */
final class CardComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-card');
        self::assertNotNull($component, 'The vf-card component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    public function testItRendersAnEmptySectionWhenNothingIsPassed(): void
    {
        self::assertSame('<section class="vf-card"></section>', $this->render());
    }

    public function testItRendersASectionRatherThanADivOrArticle(): void
    {
        self::assertStringStartsWith('<section', $this->render());
    }

    public function testItRendersHeaderBodyAndFooterInThatOrder(): void
    {
        self::assertSame(
            '<section class="vf-card"><header><h3 class="vf-card__title">Workspace</h3></header>'
            . '<div class="vf-card__body">Body</div><footer>Footer</footer></section>',
            $this->render(['title' => 'Workspace'], [
                'default' => self::slot('Body'),
                'footer' => self::slot('Footer'),
            ]),
        );
    }

    public function testItRendersNoInteractiveElementOfItsOwn(): void
    {
        // The component-owned half of the static contract. Whatever a consumer
        // puts in a slot is the consumer's; the card never adds a control.
        $markup = $this->render(['title' => 'Workspace', 'compact' => true], [
            'default' => self::slot('Body'),
            'footer' => self::slot('Footer'),
        ]);

        foreach (['<a ', '<button', '<input', '<select', '<textarea', 'tabindex'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $markup);
        }
    }

    // ----------------------------------------------------------- the classes

    public function testItEmitsNoModifierAtTheDefault(): void
    {
        self::assertStringContainsString('class="vf-card"', $this->render());
    }

    public function testItEmitsTheCompactModifier(): void
    {
        foreach ([true, 'true', '1'] as $compact) {
            self::assertStringContainsString('class="vf-card vf-card--compact"', $this->render(['compact' => $compact]));
        }
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertStringContainsString(
            'class="vf-card vf-card--compact mine"',
            $this->render(['compact' => true, 'class' => 'mine']),
        );
    }

    public function testItNeverEmitsAPanelClass(): void
    {
        // VfPanel is the nearest structural neighbour VfCard has and is
        // deliberately not migrated. This is what notices if this component is
        // ever generalised over a block name.
        self::assertStringNotContainsString('vf-panel', $this->render(['compact' => true, 'title' => 'Workspace']));
    }

    // ------------------------------------------------------------ the header

    public function testTheHeaderWrapperCarriesNoClass(): void
    {
        // The quirk a reviewer would fix first. There is no vf-card__header.
        self::assertStringContainsString('<header><h3', $this->render(['title' => 'Workspace']));
    }

    public function testTheTitleIsRenderedInsideAClassedHeading(): void
    {
        self::assertStringContainsString(
            '<h3 class="vf-card__title">Workspace</h3>',
            $this->render(['title' => 'Workspace']),
        );
    }

    public function testThereIsNoHeaderWithoutATitleOrAHeaderSlot(): void
    {
        self::assertStringNotContainsString('<header>', $this->render([], ['default' => self::slot('Body')]));
    }

    public function testAnEmptyStringTitleRendersNoHeaderAtAll(): void
    {
        // Falsy, so it reads as no title. An empty header would be the
        // charitable reading and is not what happens.
        self::assertSame('<section class="vf-card"></section>', $this->render(['title' => '']));
    }

    public function testAHeaderSlotOpensTheHeaderWithNoTitle(): void
    {
        self::assertSame(
            '<section class="vf-card"><header><span class="mine">Custom</span></header></section>',
            $this->render([], ['header' => self::slot('<span class="mine">Custom</span>')]),
        );
    }

    public function testAHeaderSlotDropsTheFallbackHeadingEvenWithATitle(): void
    {
        // The title is silently unused. Rendering both would be the obvious
        // improvement and would change what every existing consumer sees.
        $markup = $this->render(['title' => 'Workspace'], ['header' => self::slot('Custom')]);

        self::assertStringNotContainsString('<h3', $markup);
        self::assertStringNotContainsString('Workspace', $markup);
    }

    public function testAHeaderSlotThatRendersNothingBringsTheFallbackHeadingBack(): void
    {
        // The subtlest rule in M16, and the only one the Vue suite cannot
        // mutate: the wrapper is keyed on the slot being passed, the heading on
        // that slot producing content. Vue gets the second answer from slot
        // fallback; here it is decided explicitly.
        self::assertSame(
            '<section class="vf-card"><header><h3 class="vf-card__title">Workspace</h3></header></section>',
            $this->render(['title' => 'Workspace'], ['header' => self::slot('')]),
        );
    }

    public function testAnEmptyHeaderSlotWithNoTitleRendersAnEmptyHeading(): void
    {
        self::assertSame(
            '<section class="vf-card"><header><h3 class="vf-card__title"></h3></header></section>',
            $this->render([], ['header' => self::slot('   ')]),
        );
    }

    public function testItEscapesAHostileTitle(): void
    {
        $markup = $this->render(['title' => '<img src=x onerror=alert(1)>']);

        self::assertStringContainsString('&lt;img', $markup);
        self::assertStringNotContainsString('<img', $markup);
    }

    // -------------------------------------------------------------- the body

    public function testTheBodyWrapperIsTheOnlyClassedWrapper(): void
    {
        self::assertStringContainsString(
            '<div class="vf-card__body">Body</div>',
            $this->render([], ['default' => self::slot('Body')]),
        );
    }

    public function testThereIsNoBodyWrapperWithoutADefaultSlot(): void
    {
        self::assertStringNotContainsString('vf-card__body', $this->render(['title' => 'Workspace']));
    }

    public function testAnEmptyDefaultSlotStillProducesItsWrapper(): void
    {
        // Keyed on the slot existing, not on its output. The empty div still
        // takes a row in the flex column and still contributes the column gap.
        self::assertSame(
            '<section class="vf-card"><div class="vf-card__body"></div></section>',
            $this->render([], ['default' => self::slot('')]),
        );
    }

    public function testItRendersAConsumerProvidedInteractiveControlInsideTheBody(): void
    {
        // The component owns no interaction; the consumer may own plenty. This
        // is the fixture the static slot-ownership review is built on.
        self::assertStringContainsString(
            '<div class="vf-card__body"><button type="button">Rename</button></div>',
            $this->render([], ['default' => self::slot('<button type="button">Rename</button>')]),
        );
    }

    // ------------------------------------------------------------ the footer

    public function testTheFooterWrapperCarriesNoClass(): void
    {
        self::assertStringContainsString('<footer>Footer</footer>', $this->render([], ['footer' => self::slot('Footer')]));
    }

    public function testNoPropOpensTheFooter(): void
    {
        // Unlike the header, which `title` can open on its own.
        self::assertStringNotContainsString('<footer>', $this->render(['title' => 'Workspace', 'compact' => true]));
    }

    public function testAnEmptyFooterSlotStillProducesItsWrapper(): void
    {
        self::assertSame('<section class="vf-card"><footer></footer></section>', $this->render([], ['footer' => self::slot('')]));
    }

    public function testAFooterCanRenderWithNoHeaderAndNoBody(): void
    {
        // The three regions are independent, not ordered gates.
        self::assertSame(
            '<section class="vf-card"><footer>Footer</footer></section>',
            $this->render([], ['footer' => self::slot('Footer')]),
        );
    }

    public function testItRendersBodyAndFooterWithNoHeader(): void
    {
        self::assertSame(
            '<section class="vf-card"><div class="vf-card__body">B</div><footer>F</footer></section>',
            $this->render([], ['default' => self::slot('B'), 'footer' => self::slot('F')]),
        );
    }

    // ------------------------------------------------------- ARIA and attrs

    public function testItWritesNoRoleOrAccessibleNameOfItsOwn(): void
    {
        // A section with no accessible name exposes no landmark role. Naming it
        // would add a landmark to every card in every existing application.
        $markup = $this->render(['title' => 'Workspace']);

        self::assertStringNotContainsString(' role=', $markup);
        self::assertStringNotContainsString('aria-label', $markup);
        self::assertStringNotContainsString(' id=', $markup);
    }

    public function testAConsumerCanPutARoleAndNameOnTheSection(): void
    {
        $markup = $this->render(['role' => 'region', 'aria-label' => 'Workspace']);

        self::assertStringContainsString('role="region"', $markup);
        self::assertStringContainsString('aria-label="Workspace"', $markup);
    }

    public function testItForwardsStyleAndProductDataAttributes(): void
    {
        $markup = $this->render(['style' => 'opacity: 0.5', 'data-testid' => 'card']);

        self::assertStringContainsString('style="opacity: 0.5"', $markup);
        self::assertStringContainsString('data-testid="card"', $markup);
    }

    public function testItDoesNotLeakConsumerAttributesOntoARegionWrapper(): void
    {
        $markup = $this->render(['data-testid' => 'card'], [
            'default' => self::slot('B'),
            'footer' => self::slot('F'),
        ]);

        self::assertSame(1, substr_count($markup, 'data-testid'));
    }

    public function testItEscapesHostileAttributeValues(): void
    {
        self::assertStringContainsString('data-x="a&quot;b&lt;c&amp;d"', $this->render(['data-x' => 'a"b<c&d']));
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $this->render(['data-x' => ['array']]);
    }
}
