<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfButton.
 *
 * The assertions deliberately mirror
 * packages/core/src/components/button/VfButton.characterization.spec.ts case
 * for case. Where that file records what the historical Vue component does,
 * this one records that the Razor component does the same thing, so the two can
 * be read side by side. The browser-level proof that they agree is the parity
 * gate; this suite is what fails first, and points at the attribute.
 */
final class ButtonComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     */
    private function render(array $props = [], string $label = 'Save'): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-button');
        self::assertNotNull($component, 'The vf-button component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($label),
        ]))->value();
    }

    /** @param array<string, mixed> $props */
    private function button(array $props = [], string $label = 'Save'): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($props, $label) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $button = (new DOMXPath($document))->query('//button')?->item(0);
        self::assertInstanceOf(DOMElement::class, $button);

        return $button;
    }

    public function testRendersANativeButtonElement(): void
    {
        self::assertSame('button', $this->button()->tagName);
    }

    public function testDefaultsToPrimaryMediumAndAnExplicitButtonType(): void
    {
        $button = $this->button();

        self::assertSame('vf-button vf-button--primary', $button->getAttribute('class'));
        self::assertSame('button', $button->getAttribute('type'));
    }

    public function testOmitsTheSizeModifierAtTheDefaultMediumSize(): void
    {
        self::assertSame('vf-button vf-button--primary', $this->button(['size' => 'md'])->getAttribute('class'));
    }

    public function testIsNeitherDisabledNorBusyByDefault(): void
    {
        $button = $this->button();

        self::assertFalse($button->hasAttribute('disabled'));
        self::assertFalse($button->hasAttribute('aria-busy'));
    }

    public function testRendersItsSlotAsTheButtonContent(): void
    {
        self::assertSame('Save changes', $this->button([], 'Save changes')->textContent);
    }

    public function testRendersNoSpinnerWhenNotLoading(): void
    {
        self::assertStringNotContainsString('vf-button__spinner', $this->render());
    }

    public function testEmitsAModifierForEveryDocumentedVariant(): void
    {
        foreach (
            ['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'ghost'] as $variant
        ) {
            self::assertStringContainsString(
                'vf-button--' . $variant,
                $this->button(['variant' => $variant])->getAttribute('class'),
            );
        }
    }

    public function testEmitsAModifierForTheTwoNonDefaultSizes(): void
    {
        foreach (['sm', 'lg'] as $size) {
            self::assertStringContainsString(
                'vf-button--' . $size,
                $this->button(['size' => $size])->getAttribute('class'),
            );
        }
    }

    public function testInterpolatesAnUndocumentedVariantOrSizeWithoutValidatingIt(): void
    {
        $classes = $this->button(['variant' => 'nonsense', 'size' => 'xl'])->getAttribute('class');

        self::assertStringContainsString('vf-button--nonsense', $classes);
        self::assertStringContainsString('vf-button--xl', $classes);
    }

    public function testEmitsTheBlockModifierOnlyWhenAsked(): void
    {
        self::assertStringContainsString('vf-button--block', $this->button(['block' => true])->getAttribute('class'));
        self::assertStringNotContainsString('vf-button--block', $this->button()->getAttribute('class'));
    }

    public function testEmitsClassesInTheReferenceOrder(): void
    {
        self::assertSame(
            'vf-button vf-button--danger vf-button--lg vf-button--block vf-button--loading',
            $this->button(['variant' => 'danger', 'size' => 'lg', 'block' => true, 'loading' => true])
                ->getAttribute('class'),
        );
    }

    public function testLetsTheTypePropOverrideTheDefault(): void
    {
        self::assertSame('submit', $this->button(['type' => 'submit'])->getAttribute('type'));
    }

    public function testForwardsNativeAttributesOntoTheButton(): void
    {
        $button = $this->button(['name' => 'save', 'value' => 'now', 'data-testid' => 'save']);

        self::assertSame('save', $button->getAttribute('name'));
        self::assertSame('now', $button->getAttribute('value'));
        self::assertSame('save', $button->getAttribute('data-testid'));
    }

    public function testForwardsAriaAttributesOntoTheButton(): void
    {
        $button = $this->button(['aria-label' => 'Save', 'aria-pressed' => 'true']);

        self::assertSame('Save', $button->getAttribute('aria-label'));
        self::assertSame('true', $button->getAttribute('aria-pressed'));
    }

    public function testMergesAConsumerClassWithTheCanonicalOnes(): void
    {
        self::assertSame(
            'vf-button vf-button--primary consumer-button',
            $this->button(['class' => 'consumer-button'])->getAttribute('class'),
        );
    }

    public function testForwardsAConsumerStyleOntoTheButton(): void
    {
        self::assertSame('margin-top: 8px', $this->button(['style' => 'margin-top: 8px'])->getAttribute('style'));
    }

    public function testIsDisabledWhenTheAttributeIsRequested(): void
    {
        self::assertTrue($this->button(['disabled' => true])->hasAttribute('disabled'));
    }

    public function testIsNotDisabledWhenTheAttributeIsFalse(): void
    {
        self::assertFalse($this->button(['disabled' => false])->hasAttribute('disabled'));
    }

    public function testAppliesTheLoadingModifierAndMarksTheButtonBusy(): void
    {
        $button = $this->button(['loading' => true]);

        self::assertStringContainsString('vf-button--loading', $button->getAttribute('class'));
        self::assertSame('true', $button->getAttribute('aria-busy'));
    }

    public function testDisablesTheButtonNativelyWhileLoading(): void
    {
        // Loading is not a visual state: the native attribute is what stops
        // both the pointer and the keyboard.
        self::assertTrue($this->button(['loading' => true])->hasAttribute('disabled'));
    }

    public function testStaysDisabledWhileLoadingEvenWhenDisabledSaysOtherwise(): void
    {
        self::assertTrue($this->button(['loading' => true, 'disabled' => false])->hasAttribute('disabled'));
    }

    public function testKeepsItsSlotContentWhileLoading(): void
    {
        self::assertStringContainsString('Save', $this->button(['loading' => true])->textContent);
    }

    public function testRendersTheSpinnerBeforeTheSlotContent(): void
    {
        $markup = $this->render(['loading' => true]);

        self::assertLessThan(
            strpos($markup, 'Save'),
            strpos($markup, 'vf-button__spinner'),
            'The spinner must precede the label.',
        );
    }

    public function testExposesTheSpinnerAsANamedProgressbar(): void
    {
        $button = $this->button(['loading' => true]);
        $spinner = (new DOMXPath($button->ownerDocument))
            ->query('//span[contains(concat(" ", normalize-space(@class), " "), " vf-button__spinner ")]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $spinner);
        self::assertSame('progressbar', $spinner->getAttribute('role'));
        self::assertSame('Loading', $spinner->getAttribute('aria-label'));
        self::assertStringContainsString('vf-progress-spinner', $spinner->getAttribute('class'));
    }

    public function testHidesTheSpinnerArtworkFromAssistiveTechnology(): void
    {
        $svg = (new DOMXPath($this->button(['loading' => true])->ownerDocument))
            ->query('//svg')?->item(0);

        self::assertInstanceOf(DOMElement::class, $svg);
        self::assertSame('true', $svg->getAttribute('aria-hidden'));
        self::assertSame('false', $svg->getAttribute('focusable'));
    }

    public function testSizesTheSpinnerFromTheButtonIconSizeAndThickensItsStroke(): void
    {
        $markup = $this->render(['loading' => true]);

        self::assertStringContainsString('--vf-progress-spinner-size: var(--vf-icon-current-size);', $markup);
        self::assertStringContainsString('stroke-width="5"', $markup);
    }

    public function testNeedsNoBrowserControllerAtAll(): void
    {
        // A native button already handles pointer, Enter, Space, focus and the
        // disabled state. Carrying an ownership marker would claim otherwise.
        self::assertStringNotContainsString('data-vf-razor', $this->render(['loading' => true]));
    }

    public function testEscapesEveryConsumerSuppliedValue(): void
    {
        $markup = $this->render([
            'variant' => '"><script>alert(1)</script>',
            'aria-label' => "it's \"quoted\"",
            'class' => 'a"b',
        ]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringContainsString('&lt;script&gt;', $markup);
        self::assertStringContainsString('&#039;', $markup);
        self::assertStringContainsString('a&quot;b', $markup);
    }
}
