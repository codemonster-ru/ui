<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\FieldsetComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfFieldset.
 *
 * The assertions mirror
 * packages/core/src/components/field/VfFieldset.characterization.spec.ts where
 * a server render can say the same thing. The scoped default slot has no
 * counterpart here (see FieldsetComponent), so nothing below pretends to test
 * one.
 */
final class FieldsetComponentTest extends TestCase
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
        $component = $registry->resolve('vf-fieldset');
        self::assertNotNull($component, 'The vf-fieldset component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    public function testTheProviderRegistersTheFieldset(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(FieldsetComponent::class, $components['fieldset']);
        self::assertCount(34, $components);
    }

    public function testItRendersTheMinimalMarkup(): void
    {
        self::assertSame(
            '<fieldset class="vf-fieldset"><div class="vf-fieldset__control"></div></fieldset>',
            $this->render(),
        );
    }

    public function testItRendersLegendControlDescriptionThenError(): void
    {
        self::assertSame(
            '<fieldset class="vf-fieldset vf-fieldset--invalid" aria-describedby="vf-fieldset-description-r-0 vf-fieldset-error-r-1">'
            . '<legend class="vf-fieldset__legend">Plan</legend>'
            . '<div class="vf-fieldset__control">Controls</div>'
            . '<p id="vf-fieldset-description-r-0" class="vf-fieldset__description">Choose one.</p>'
            . '<p id="vf-fieldset-error-r-1" class="vf-fieldset__error">Required.</p>'
            . '</fieldset>',
            $this->render(
                ['label' => 'Plan', 'description' => 'Choose one.', 'error' => 'Required.'],
                ['default' => self::slot('Controls')],
            ),
        );
    }

    public function testItAllocatesBothIdsInOrderWhateverRenders(): void
    {
        self::assertStringContainsString('id="vf-fieldset-error-r-1"', $this->render(['error' => 'E']));
        FieldIds::reset();
        self::assertStringContainsString('id="vf-fieldset-description-r-0"', $this->render(['description' => 'D']));
    }

    public function testTwoFieldsetsNeverShareAnId(): void
    {
        $first = $this->render(['description' => 'D1', 'error' => 'E1']);
        $second = $this->render(['description' => 'D2', 'error' => 'E2']);

        self::assertStringContainsString('aria-describedby="vf-fieldset-description-r-0 vf-fieldset-error-r-1"', $first);
        self::assertStringContainsString('aria-describedby="vf-fieldset-description-r-2 vf-fieldset-error-r-3"', $second);
    }

    public function testTheLegendHoldsPlainTextWithNoIdAndTheFieldsetNoLabelledBy(): void
    {
        $markup = $this->render(['label' => 'Shipping']);

        self::assertStringContainsString('<legend class="vf-fieldset__legend">Shipping</legend>', $markup);
        self::assertStringNotContainsString('aria-labelledby', $markup);
        self::assertStringNotContainsString('<span', $markup);
    }

    public function testPresenceIsJavaScriptTruthiness(): void
    {
        self::assertSame(
            '<fieldset class="vf-fieldset"><div class="vf-fieldset__control"></div></fieldset>',
            $this->render(['label' => '', 'description' => '', 'error' => '']),
        );

        $zero = $this->render(['label' => '0', 'description' => '0', 'error' => '0']);
        self::assertStringContainsString('<legend class="vf-fieldset__legend">0</legend>', $zero);
        self::assertStringContainsString('class="vf-fieldset__description">0</p>', $zero);
        self::assertStringContainsString('class="vf-fieldset__error">0</p>', $zero);
        self::assertStringContainsString('vf-fieldset--invalid', $zero);
    }

    public function testASlotReplacesItsProp(): void
    {
        $markup = $this->render(
            ['label' => 'Prop', 'description' => 'Prop', 'error' => 'Prop'],
            [
                'label' => self::slot('<strong>Slot</strong>'),
                'description' => self::slot('<em>Slot</em>'),
                'error' => self::slot('<b>Slot</b>'),
            ],
        );

        self::assertStringContainsString('<legend class="vf-fieldset__legend"><strong>Slot</strong></legend>', $markup);
        self::assertStringContainsString('class="vf-fieldset__description"><em>Slot</em></p>', $markup);
        self::assertStringContainsString('class="vf-fieldset__error"><b>Slot</b></p>', $markup);
        self::assertStringNotContainsString('Prop', $markup);
    }

    public function testSlotsAloneOpenEveryPartAndAnErrorSlotIsInvalid(): void
    {
        $markup = $this->render([], [
            'label' => self::slot('L'),
            'description' => self::slot('D'),
            'error' => self::slot('E'),
        ]);

        self::assertStringContainsString('<legend class="vf-fieldset__legend">L</legend>', $markup);
        self::assertStringContainsString('class="vf-fieldset vf-fieldset--invalid"', $markup);
        self::assertStringContainsString('aria-describedby="vf-fieldset-description-r-0 vf-fieldset-error-r-1"', $markup);
    }

    public function testAnEmptySlotCountsAndFallsBackToItsProp(): void
    {
        $markup = $this->render(
            ['label' => 'Fallback label', 'description' => 'Fallback description'],
            ['label' => self::slot(''), 'description' => self::slot('  '), 'error' => self::slot('')],
        );

        self::assertStringContainsString('<legend class="vf-fieldset__legend">Fallback label</legend>', $markup);
        self::assertStringContainsString('class="vf-fieldset__description">Fallback description</p>', $markup);
        self::assertStringContainsString('<p id="vf-fieldset-error-r-1" class="vf-fieldset__error"></p>', $markup);
        self::assertStringContainsString('vf-fieldset--invalid', $markup);
    }

    public function testInvalidIsAClassAndNothingElse(): void
    {
        self::assertSame(
            '<fieldset class="vf-fieldset vf-fieldset--invalid"><div class="vf-fieldset__control"></div></fieldset>',
            $this->render(['invalid' => true]),
        );

        $markup = $this->render(['invalid' => true, 'error' => 'E']);
        self::assertStringNotContainsString('aria-invalid', $markup);
        self::assertStringNotContainsString('role=', $markup);
        self::assertStringNotContainsString('aria-live', $markup);
    }

    public function testAnErrorIsInvalidEvenWhenInvalidIsFalse(): void
    {
        self::assertStringContainsString('class="vf-fieldset vf-fieldset--invalid"', $this->render(['invalid' => false, 'error' => 'E']));
        self::assertStringContainsString('class="vf-fieldset vf-fieldset--invalid"', $this->render(['invalid' => 'true']));
        self::assertStringStartsWith('<fieldset class="vf-fieldset">', $this->render(['invalid' => 'false']));
    }

    public function testConsumerAttributesLandOnTheFieldsetAfterTheComponentsOwn(): void
    {
        $markup = $this->render(
            ['invalid' => true, 'class' => 'consumer', 'style' => 'max-width: 30rem', 'id' => 'billing', 'data-testid' => 'fs'],
            ['default' => self::slot('x')],
        );

        self::assertStringStartsWith(
            '<fieldset class="vf-fieldset vf-fieldset--invalid consumer" id="billing" data-testid="fs" style="max-width: 30rem">',
            $markup,
        );
    }

    public function testAConsumerDescribedByReplacesTheComputedOne(): void
    {
        $markup = $this->render(['description' => 'D', 'error' => 'E', 'aria-describedby' => 'outside']);

        self::assertStringContainsString('aria-describedby="outside"', $markup);
        self::assertSame(1, substr_count($markup, 'aria-describedby'));
    }

    public function testDisabledFormAndNameStayNativeFieldsetAttributes(): void
    {
        $markup = $this->render(['disabled' => true, 'form' => 'checkout', 'name' => 'shipping'], [
            'default' => self::slot('<input class="nested">'),
        ]);

        self::assertStringStartsWith('<fieldset class="vf-fieldset" disabled form="checkout" name="shipping">', $markup);
        self::assertStringContainsString('<input class="nested">', $markup);
    }

    public function testNothingLeaksOntoTheLegendTheControlOrTheParagraphs(): void
    {
        $markup = $this->render(
            ['label' => 'L', 'description' => 'D', 'error' => 'E', 'title' => 'Hint', 'data-testid' => 'fs'],
            ['default' => self::slot('x')],
        );

        self::assertSame(1, substr_count($markup, 'title="Hint"'));
        self::assertSame(1, substr_count($markup, 'data-testid="fs"'));
        self::assertStringContainsString('<legend class="vf-fieldset__legend">', $markup);
        self::assertStringContainsString('<div class="vf-fieldset__control">', $markup);
    }

    public function testItRendersNoInteractiveElementOrGroupBoxMarkupOfItsOwn(): void
    {
        $markup = $this->render(['label' => 'L', 'description' => 'D', 'error' => 'E']);

        foreach (['<button', '<a ', '<input', 'tabindex', 'vf-group-box', 'data-vf-razor'] as $forbidden) {
            self::assertStringNotContainsString($forbidden, $markup);
        }
    }

    public function testItEscapesHostilePropText(): void
    {
        $markup = $this->render(['label' => '<b>x</b>', 'description' => '"q"', 'error' => '<i>e</i>']);

        self::assertStringContainsString('&lt;b&gt;x&lt;/b&gt;', $markup);
        self::assertStringContainsString('&quot;q&quot;', $markup);
        self::assertStringNotContainsString('<i>', $markup);
    }

    public function testItRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['nested']]);
    }
}
