<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\ButtonComponent;
use Codemonster\VueForge\Razor\Components\ProgressSpinnerComponent;
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
 *
 * The spinner-composition group at the bottom is the part that is new in M20.
 * It is what tells "the button renders something that looks like a spinner"
 * apart from "the button renders the canonical spinner" - and the last test in
 * it is the substitution attack: a button built over a copy of the old
 * Support\ProgressSpinner markup passes every other assertion in this file and
 * fails there.
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
    // ---------------------------------------------------------------------
    // Spinner composition. Sections 19, 20 and 31 of the M20 plan.
    // ---------------------------------------------------------------------

    public function testTheProviderHandsTheButtonTheSameSpinnerItRegisters(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        $spinner = $components['progress-spinner'];
        $button = $components['button'];

        self::assertInstanceOf(ProgressSpinnerComponent::class, $spinner);
        self::assertInstanceOf(ButtonComponent::class, $button);

        // Reach the private constructor property. Reflection rather than a
        // getter, because the button has no business exposing its child to
        // application code - the point is that this test can see it and a
        // consumer cannot.
        $child = (new \ReflectionClass($button))->getProperty('spinner')->getValue($button);

        self::assertSame(
            $spinner,
            $child,
            'The button must render the canonical registered spinner, not a private copy of it.',
        );
    }

    public function testTheButtonDelegatesToTheInjectedSpinnerRatherThanAuthoringSpinnerMarkup(): void
    {
        // A test double that renders nothing a spinner would render. If the
        // button contained its own copy of the spinner markup, the canonical
        // classes would still appear below and the probe's output would not.
        $probe = self::probe();

        $loading = (new ButtonComponent($probe))->render(new ComponentRenderContext(
            ['loading' => true],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')],
        ))->value();

        self::assertStringContainsString('<probe-child></probe-child>', $loading);
        self::assertStringNotContainsString('vf-progress-spinner', $loading);
        self::assertStringNotContainsString('<svg', $loading);
        self::assertStringNotContainsString('progressbar', $loading);
        self::assertCount(1, $probe->calls);
    }

    public function testTheButtonDoesNotCallTheSpinnerWhenNotLoading(): void
    {
        $probe = self::probe();

        $idle = (new ButtonComponent($probe))->render(new ComponentRenderContext(
            [],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')],
        ))->value();

        self::assertStringNotContainsString('<probe-child>', $idle);
        self::assertStringNotContainsString('vf-progress-spinner', $idle);
        self::assertCount(0, $probe->calls);
    }

    public function testTheButtonForwardsExactlyItsClassTheIconSizeTokenAndAStrokeWidthOfFive(): void
    {
        // Not "at least these": exactly. A button that also forwarded its own
        // size name, its variant as a tone, or a label would render a plausible
        // spinner and be a different component. And the same three for every
        // button size: the spinner is sized by the token the button's size
        // modifier sets, never by a size name mapped onto it.
        foreach (['sm', 'md', 'lg'] as $size) {
            $probe = self::probe();
            (new ButtonComponent($probe))->render(new ComponentRenderContext(
                ['loading' => true, 'size' => $size, 'variant' => 'danger'],
                ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')],
            ));

            self::assertSame(
                [['class' => 'vf-button__spinner', 'size' => 'var(--vf-icon-current-size)', 'stroke-width' => 5]],
                $probe->calls,
                "The button forwarded something other than its three props at size {$size}.",
            );
        }
    }

    public function testTheButtonAndTheStandaloneSpinnerAgreeOnTheChildMarkup(): void
    {
        // The same markup, from the same class, reached two ways. If the button
        // ever grew its own copy this is where the two would drift.
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $standalone = $registry->resolve('vf-progress-spinner')
            ->render(new ComponentRenderContext(
                ['class' => 'vf-button__spinner', 'size' => 'var(--vf-icon-current-size)', 'stroke-width' => 5],
                [],
            ))
            ->value();

        self::assertStringStartsWith('<span class="vf-progress-spinner vf-button__spinner"', $standalone);
        self::assertStringContainsString($standalone, $this->render(['loading' => true]));
    }

    public function testAChildThatChangesItsOutputChangesTheButtonsLoadingState(): void
    {
        // The spinner-to-button direction: a different child, a different
        // button. Two doubles, two outputs, one button class.
        $first = new class implements ComponentInterface {
            public function render(ComponentRenderContext $context): RenderedHtml
            {
                return RenderedHtml::fromTrustedString('<first-spinner></first-spinner>');
            }
        };
        $second = new class implements ComponentInterface {
            public function render(ComponentRenderContext $context): RenderedHtml
            {
                return RenderedHtml::fromTrustedString('<second-spinner></second-spinner>');
            }
        };
        $slot = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')];

        $withFirst = (new ButtonComponent($first))->render(new ComponentRenderContext(['loading' => true], $slot))->value();
        $withSecond = (new ButtonComponent($second))->render(new ComponentRenderContext(['loading' => true], $slot))->value();

        self::assertStringContainsString('<first-spinner>', $withFirst);
        self::assertStringContainsString('<second-spinner>', $withSecond);
        self::assertSame(
            str_replace('<first-spinner></first-spinner>', '', $withFirst),
            str_replace('<second-spinner></second-spinner>', '', $withSecond),
            'Everything the button owns must be identical whatever the child renders.',
        );
    }

    public function testACopiedSpinnerRendererIsBehaviourallyIdenticalAndIsNotTheCanonicalOne(): void
    {
        // The M20 substitution attack. A renderer carrying a byte-for-byte copy
        // of the markup the pre-M20 Support\ProgressSpinner produced for the
        // button - the old support class, in effect, reinstated as a private
        // dependency. Every behavioural assertion in this file passes against
        // it: same classes, same role, same name, same artwork, same size and
        // stroke. What distinguishes it is identity, which is what the provider
        // test above measures and what this test proves is the *only* thing
        // that measures it.
        $copied = new class implements ComponentInterface {
            public function render(ComponentRenderContext $context): RenderedHtml
            {
                return RenderedHtml::fromTrustedString(
                    '<span class="vf-progress-spinner vf-button__spinner"'
                    . ' style="--vf-progress-spinner-size: var(--vf-icon-current-size);" role="progressbar" aria-label="Loading">'
                    . '<svg class="vf-progress-spinner__svg" viewBox="0 0 50 50" aria-hidden="true" focusable="false">'
                    . '<circle class="vf-progress-spinner__track" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>'
                    . '<circle class="vf-progress-spinner__value" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>'
                    . '</svg></span>',
                );
            }
        };
        $slot = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')];

        $substituted = (new ButtonComponent($copied))->render(new ComponentRenderContext(['loading' => true], $slot))->value();

        // Behaviourally identical: the substitution passes the output check.
        self::assertSame($this->render(['loading' => true]), $substituted);

        // And is caught only by identity: the copy is not the registered
        // spinner, and a provider that wired it in would fail the identity
        // assertion while every output assertion stayed green.
        $registered = (new VueForgeRazorProvider())->components()['progress-spinner'];
        self::assertNotSame($registered, $copied);
        self::assertNotInstanceOf(ProgressSpinnerComponent::class, $copied);
    }

    /** A spinner double that records what it was asked to render. */
    private static function probe(): ComponentInterface
    {
        return new class implements ComponentInterface {
            /** @var list<array<string, mixed>> */
            public array $calls = [];

            public function render(ComponentRenderContext $context): RenderedHtml
            {
                $this->calls[] = $context->props();

                return RenderedHtml::fromTrustedString('<probe-child></probe-child>');
            }
        };
    }
}
