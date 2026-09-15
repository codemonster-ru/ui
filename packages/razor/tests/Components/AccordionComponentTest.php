<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\AccordionComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfAccordion.
 *
 * The assertions mirror
 * packages/core/src/components/accordion/VfAccordion.characterization.spec.ts
 * for the half a server renders: the initial state, the trigger's identity and
 * ARIA, the id relationships, the panel's presence, the slots, the consumer
 * attributes. What a server cannot render - the toggle, the events, the
 * transition - is the browser gate's (scripts/ci/check-razor-browser.mjs) and
 * the parity harness's, and the three things this suite pins about it are
 * that the no-JS output is truthful, that nothing here pretends to toggle, and
 * that the deferred content is inert.
 */
final class AccordionComponentTest extends TestCase
{
    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-accordion');
        self::assertNotNull($component, 'The vf-accordion component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    private static function icon(bool $open): string
    {
        return '<span aria-hidden="true" class="vf-accordion__icon' . ($open ? ' vf-accordion__icon--open' : '') . '">'
            . IconRenderer::render('chevron-down', 'var(--vf-icon-size-sm)')
            . '</span>';
    }

    private static function trigger(string $content, bool $open, bool $disabled = false): string
    {
        return '<button id="vf-accordion-trigger-r-0" aria-controls="vf-accordion-content-r-1"'
            . ' aria-expanded="' . ($open ? 'true' : 'false') . '"'
            . ($disabled ? ' disabled' : '')
            . ' class="vf-accordion__trigger" type="button">'
            . $content . self::icon($open) . '</button>';
    }

    // ------------------------------------------------------------- structure

    public function testItRendersTheClosedMarkupWithNoPanelAndTheContentDeferred(): void
    {
        self::assertSame(
            '<section class="vf-accordion" data-vf-razor="accordion">'
                . self::trigger('<span>Details</span>', false)
                . '<template data-vf-razor-accordion="content">Body</template>'
                . '</section>',
            $this->render(['title' => 'Details'], ['default' => self::slot('Body')]),
        );
    }

    public function testItRendersTheOpenMarkupWithTheRegionAndTheInnerWrapper(): void
    {
        self::assertSame(
            '<section class="vf-accordion" data-vf-razor="accordion">'
                . self::trigger('<span>Details</span>', true)
                . '<div id="vf-accordion-content-r-1" aria-labelledby="vf-accordion-trigger-r-0" class="vf-accordion__content" role="region">'
                . '<div class="vf-accordion__content-inner">Body</div>'
                . '</div>'
                . '</section>',
            $this->render(['title' => 'Details', 'default-open' => true], ['default' => self::slot('Body')]),
        );
    }

    public function testTheTriggerIsANativeButtonOfTypeButtonWithNoRoleAndNoTabindex(): void
    {
        $markup = $this->render(['title' => 'Details']);

        self::assertSame(1, substr_count($markup, '<button'));
        self::assertStringContainsString('class="vf-accordion__trigger" type="button"', $markup);
        self::assertStringNotContainsString('role="button"', $markup);
        self::assertStringNotContainsString('tabindex', $markup);
        self::assertStringNotContainsString('<a ', $markup);
    }

    public function testItRendersExactlyOneTriggerInEveryConfiguration(): void
    {
        foreach ([[], ['default-open' => true], ['disabled' => true], ['disabled' => true, 'open' => true]] as $props) {
            $markup = $this->render($props, ['default' => self::slot('Body')]);

            self::assertSame(1, substr_count($markup, '<button'), json_encode($props, JSON_THROW_ON_ERROR));
            self::assertSame(1, substr_count($markup, 'vf-accordion__trigger'));
            self::assertSame(1, substr_count($markup, 'vf-accordion__icon"') + substr_count($markup, 'vf-accordion__icon vf-accordion__icon--open"'));
        }
    }

    public function testTheRegionHasNoTabindexNoNameOfItsOwnAndNoHeading(): void
    {
        $markup = $this->render(['title' => 'Details', 'open' => true], ['default' => self::slot('Body')]);

        self::assertStringContainsString('role="region"', $markup);
        self::assertStringNotContainsString('tabindex', $markup);
        self::assertStringNotContainsString('aria-label=', $markup);
        self::assertDoesNotMatchRegularExpression('/<h[1-6]/', $markup);
    }

    // ---------------------------------------------------------- initial state

    public function testItIsClosedByDefault(): void
    {
        $markup = $this->render([], ['default' => self::slot('Body')]);

        self::assertStringContainsString('aria-expanded="false"', $markup);
        self::assertStringNotContainsString('vf-accordion__content', $markup);
        self::assertStringNotContainsString('role="region"', $markup);
        self::assertStringNotContainsString('vf-accordion__icon--open', $markup);
    }

    public function testDefaultOpenOpensItInEitherSpelling(): void
    {
        foreach (['default-open', 'defaultOpen'] as $name) {
            $markup = $this->render([$name => true]);

            self::assertStringContainsString('aria-expanded="true"', $markup, $name);
            self::assertStringContainsString('role="region"', $markup, $name);
            self::assertStringContainsString('vf-accordion__icon--open', $markup, $name);
        }
    }

    public function testTheControlledPropWinsOverTheSeedInBothDirections(): void
    {
        self::assertStringContainsString('aria-expanded="true"', $this->render(['open' => true, 'default-open' => false]));

        $closed = $this->render(['open' => false, 'default-open' => true]);
        self::assertStringContainsString('aria-expanded="false"', $closed);
        self::assertStringNotContainsString('vf-accordion__content', $closed);
    }

    public function testANullOpenAttributeIsNothingSaidAndDefersToTheSeed(): void
    {
        // The adapter convention, at the adapter boundary: `:open="$x ?? null"`
        // leaves the decision to default-open. The Vue reference would read an
        // explicit null as controlled-closed; the shared rule's docblock says
        // where that difference is owned, and this is the test that owns it.
        self::assertStringContainsString('aria-expanded="true"', $this->render(['open' => null, 'default-open' => true]));
        self::assertStringContainsString('aria-expanded="false"', $this->render(['open' => null]));
    }

    public function testTemplateTextBooleansAreReadTheWayTheOtherComponentsReadThem(): void
    {
        self::assertStringContainsString('aria-expanded="true"', $this->render(['open' => 'true']));
        self::assertStringContainsString('aria-expanded="false"', $this->render(['open' => 'false', 'default-open' => 'true']));
        self::assertStringContainsString('aria-expanded="false"', $this->render(['default-open' => '0']));
    }

    public function testANonBooleanOpenIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['open' => ['yes']]);
    }

    // ------------------------------------------------------------ ids / ARIA

    public function testTheTriggerControlsThePanelAndThePanelIsLabelledByTheTrigger(): void
    {
        $markup = $this->render(['open' => true]);

        self::assertStringContainsString('id="vf-accordion-trigger-r-0" aria-controls="vf-accordion-content-r-1"', $markup);
        self::assertStringContainsString('id="vf-accordion-content-r-1" aria-labelledby="vf-accordion-trigger-r-0"', $markup);
    }

    public function testTheQuirkWhileClosedAriaControlsNamesAnIdNoElementCarries(): void
    {
        $markup = $this->render();

        self::assertStringContainsString('aria-controls="vf-accordion-content-r-1"', $markup);
        self::assertStringNotContainsString('id="vf-accordion-content-r-1"', $markup);
    }

    public function testSiblingAccordionsGetDistinctIdsAndLocalRelationships(): void
    {
        $first = $this->render(['open' => true]);
        $second = $this->render(['open' => true]);

        self::assertStringContainsString('id="vf-accordion-trigger-r-0" aria-controls="vf-accordion-content-r-1"', $first);
        self::assertStringContainsString('id="vf-accordion-trigger-r-2" aria-controls="vf-accordion-content-r-3"', $second);
        self::assertStringContainsString('aria-labelledby="vf-accordion-trigger-r-2"', $second);
        self::assertStringNotContainsString('r-0', $second);
    }

    public function testANestedAccordionKeepsItsOwnIdsInsideTheOuterPanel(): void
    {
        $inner = $this->render(['title' => 'Inner']);
        FieldIds::reset();
        // Render the outer after the inner's ids were taken, as a template
        // engine would when the slot renders first; ids stay unique either way
        // because the counter is monotonic within a request.
        $outer = (new AccordionComponent())->render(new ComponentRenderContext(
            ['title' => 'Outer', 'open' => true],
            ['default' => self::slot($inner)],
        ))->value();

        self::assertSame(2, substr_count($outer, '<button'));
        self::assertSame(2, substr_count($outer, 'aria-controls="'));
        self::assertStringContainsString('aria-labelledby="vf-accordion-trigger-r-0"', $outer);
        self::assertStringContainsString('<template data-vf-razor-accordion="content"></template>', $outer);
    }

    public function testItWritesNoAriaDisabledAriaPressedOrAriaLabelOfItsOwn(): void
    {
        foreach ([[], ['disabled' => true], ['open' => true, 'title' => 'T']] as $props) {
            $markup = $this->render($props);

            foreach (['aria-disabled', 'aria-pressed', 'aria-label=', 'aria-haspopup'] as $attribute) {
                self::assertStringNotContainsString($attribute, $markup, $attribute);
            }
        }
    }

    // ---------------------------------------------------------- title & slots

    public function testTheTitleIsEscapedInsideABareSpan(): void
    {
        self::assertStringContainsString('<span>&lt;b&gt;Billing&lt;/b&gt;</span>', $this->render(['title' => '<b>Billing</b>']));
    }

    public function testTheQuirkAnAbsentOrEmptyTitleStillRendersAnEmptySpan(): void
    {
        self::assertStringContainsString('type="button"><span></span><span aria-hidden="true"', $this->render());
        self::assertStringContainsString('type="button"><span></span><span aria-hidden="true"', $this->render(['title' => '']));
    }

    public function testTheTriggerSlotReplacesTheTitleSpanAndKeepsTheIconLast(): void
    {
        $markup = $this->render(['title' => 'Ignored'], ['trigger' => self::slot('<em>Custom</em>')]);

        self::assertStringContainsString('type="button"><em>Custom</em><span aria-hidden="true" class="vf-accordion__icon">', $markup);
        self::assertStringNotContainsString('Ignored', $markup);
        self::assertStringNotContainsString('<span></span>', $markup);
    }

    public function testATriggerSlotThatRendersNothingStillReplacesTheTitle(): void
    {
        // A slot is content once passed; there is no fallback to the title
        // for an empty one - the reference's slot renders whatever it renders.
        $markup = $this->render(['title' => 'Ignored'], ['trigger' => self::slot('')]);

        self::assertStringContainsString('type="button"><span aria-hidden="true" class="vf-accordion__icon">', $markup);
        self::assertStringNotContainsString('Ignored', $markup);
    }

    public function testAnOpenAccordionWithNoDefaultSlotRendersTheEmptyWrappers(): void
    {
        self::assertStringContainsString(
            'role="region"><div class="vf-accordion__content-inner"></div></div>',
            $this->render(['open' => true]),
        );
    }

    public function testConsumerContentIsRenderedVerbatimInsideTheInnerWrapper(): void
    {
        $markup = $this->render(['open' => true], ['default' => self::slot('<p>Text</p><button type="button">Retry</button>')]);

        self::assertStringContainsString(
            '<div class="vf-accordion__content-inner"><p>Text</p><button type="button">Retry</button></div>',
            $markup,
        );
        self::assertSame(2, substr_count($markup, '<button'));
    }

    public function testASlotItDoesNotDeclareIsIgnored(): void
    {
        self::assertStringNotContainsString('Nope', $this->render(['open' => true], ['footer' => self::slot('Nope')]));
    }

    // ------------------------------------------------------------ deferred content

    public function testAClosedAccordionKeepsItsContentInAnInertTemplateAndNowhereElse(): void
    {
        $markup = $this->render([], ['default' => self::slot('<p>Text</p><button type="button">Retry</button>')]);

        self::assertStringContainsString(
            '<template data-vf-razor-accordion="content"><p>Text</p><button type="button">Retry</button></template>',
            $markup,
        );
        // Only the trigger is outside the template.
        self::assertSame(1, substr_count(preg_replace('/<template.*?<\/template>/s', '', $markup) ?? '', '<button'));
        self::assertStringNotContainsString('vf-accordion__content', $markup);
    }

    public function testAnOpenAccordionCarriesNoTemplate(): void
    {
        self::assertStringNotContainsString('<template', $this->render(['open' => true], ['default' => self::slot('Body')]));
    }

    public function testAClosedAccordionWithoutASlotStillCarriesAnEmptyTemplate(): void
    {
        self::assertStringContainsString('<template data-vf-razor-accordion="content"></template>', $this->render());
    }

    public function testTheServerNeverWritesAnInlineStyleOnThePanel(): void
    {
        // The reference animates only on a change. An open render carries no
        // height, opacity, overflow or transition.
        $markup = $this->render(['open' => true], ['default' => self::slot('Body')]);

        // The icon wrapper's custom-property style is the glyph's, as on the
        // Vue side; the region and the inner wrapper carry none.
        self::assertStringContainsString('class="vf-accordion__content" role="region"><div class="vf-accordion__content-inner">', $markup);
        self::assertSame(1, substr_count($markup, 'style='));
        self::assertStringContainsString('class="vf-icon-wrapper" style=', $markup);
    }

    // ---------------------------------------------------------------- disabled

    public function testDisabledWritesTheNativeAttributeOnTheTriggerAndNothingElse(): void
    {
        $markup = $this->render(['disabled' => true]);

        self::assertStringContainsString('aria-expanded="false" disabled class="vf-accordion__trigger"', $markup);
        self::assertStringNotContainsString('aria-disabled', $markup);
        self::assertStringNotContainsString('--disabled', $markup);
        self::assertStringNotContainsString('<section class="vf-accordion" disabled', $markup);
    }

    public function testDisabledIsNotWrittenAtAllWhenFalse(): void
    {
        self::assertStringNotContainsString('disabled', $this->render(['disabled' => false]));
    }

    public function testDisablingDoesNotCloseAnOpenAccordion(): void
    {
        $markup = $this->render(['disabled' => true, 'default-open' => true], ['default' => self::slot('Body')]);

        self::assertStringContainsString('aria-expanded="true" disabled', $markup);
        self::assertStringContainsString('role="region"', $markup);
    }

    // -------------------------------------------------------- consumer attrs

    public function testAConsumerClassIsAppendedAfterTheCanonicalOne(): void
    {
        self::assertStringContainsString('<section class="vf-accordion mine"', $this->render(['class' => 'mine']));
    }

    public function testConsumerAttributesLandOnTheRootAndNeverOnTheTriggerOrThePanel(): void
    {
        $markup = $this->render(
            ['open' => true, 'id' => 'faq', 'style' => 'margin: 4px', 'role' => 'group', 'data-testid' => 'acc', 'aria-label' => 'FAQ'],
            ['default' => self::slot('Body')],
        );

        self::assertStringStartsWith(
            '<section id="faq" role="group" data-testid="acc" aria-label="FAQ" class="vf-accordion" style="margin: 4px" data-vf-razor="accordion">',
            $markup,
        );
        self::assertStringContainsString('<button id="vf-accordion-trigger-r-0"', $markup);
        self::assertSame(1, substr_count($markup, 'role="group"'));
        self::assertSame(1, substr_count($markup, 'data-testid'));
        self::assertStringContainsString('role="region"', $markup);
    }

    public function testAConsumerAriaExpandedLandsOnTheRootAndLeavesTheTriggerAlone(): void
    {
        $markup = $this->render(['aria-expanded' => 'true']);

        self::assertStringStartsWith('<section aria-expanded="true" class="vf-accordion"', $markup);
        self::assertStringContainsString('<button id="vf-accordion-trigger-r-0" aria-controls="vf-accordion-content-r-1" aria-expanded="false"', $markup);
    }

    public function testANullConsumerAttributeIsNothingSaid(): void
    {
        self::assertStringStartsWith('<section class="vf-accordion" data-vf-razor="accordion">', $this->render(['role' => null, 'id' => null]));
    }

    public function testANonScalarConsumerAttributeIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-config' => ['a' => 1]]);
    }

    // ------------------------------------------------------- what is not here

    public function testTheServerRendersNoToggleMechanismOfItsOwn(): void
    {
        // No <details>, no checkbox hack, no inline handler, no form action:
        // without the controller the trigger does nothing, and that is the
        // documented no-JS contract rather than a substitute behaviour.
        $markup = $this->render(['title' => 'T'], ['default' => self::slot('Body')]);

        self::assertStringNotContainsString('<details', $markup);
        self::assertStringNotContainsString('<input', $markup);
        self::assertStringNotContainsString('onclick', $markup);
        self::assertStringNotContainsString('<script', $markup);
        self::assertStringNotContainsString('href=', $markup);
    }

    public function testTheOwnershipMarkerIsTheOnlyAdapterMetadataOnTheRoot(): void
    {
        $markup = $this->render(['open' => true], ['default' => self::slot('Body')]);

        self::assertSame(1, substr_count($markup, 'data-vf-razor="accordion"'));
        self::assertSame(0, substr_count($markup, 'data-vf-razor-accordion='), 'an open accordion carries no template marker');
        self::assertSame(1, substr_count($this->render(), 'data-vf-razor-accordion="content"'));
    }

    public function testItIsRegisteredBesideTheOtherComponentsAndTakesNoConstructorArgument(): void
    {
        $provider = new VueForgeRazorProvider();
        $components = $provider->components();

        self::assertInstanceOf(AccordionComponent::class, $components['accordion']);
        self::assertNull((new \ReflectionClass(AccordionComponent::class))->getConstructor());
        self::assertCount(21, $components);
    }
}
