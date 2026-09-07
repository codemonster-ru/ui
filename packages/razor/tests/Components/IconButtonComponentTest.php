<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfIconButton.
 *
 * The assertions deliberately mirror
 * packages/core/src/components/icon-button/VfIconButton.characterization.spec.ts
 * case for case. Where that file records what the historical Vue component
 * does, this one records that the Razor component does the same thing, so the
 * two can be read side by side. The browser-level proof that they agree is the
 * parity gate; this suite is what fails first, and points at the attribute.
 */
final class IconButtonComponentTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(array $props = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-icon-button');
        self::assertNotNull($component, 'The vf-icon-button component must be registered by the provider.');

        return $component->render(new ComponentRenderContext(array_merge(['icon' => 'xmark'], $props), []))->value();
    }

    /** @param array<string, mixed> $props */
    private function button(array $props = []): DOMElement
    {
        // The charset meta is required: DOMDocument otherwise decodes the
        // markup as ISO-8859-1 and mangles UTF-8 attribute values.
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $this->render($props) . '</body></html>',
            LIBXML_NOERROR,
        ));

        $button = (new DOMXPath($document))->query('//button')?->item(0);
        self::assertInstanceOf(DOMElement::class, $button);

        return $button;
    }

    /** @param array<string, mixed> $props */
    private function classes(array $props = []): array
    {
        return explode(' ', $this->button($props)->getAttribute('class'));
    }

    // Element and defaults.

    public function testRendersANativeButtonElement(): void
    {
        self::assertSame('button', $this->button()->tagName);
    }

    public function testDefaultsToGhostVariantMediumSizeAndAnExplicitButtonType(): void
    {
        self::assertSame(['vf-icon-button', 'vf-icon-button--ghost'], $this->classes());
        self::assertSame('button', $this->button()->getAttribute('type'));
    }

    public function testOmitsTheSizeModifierAtTheDefaultMediumSize(): void
    {
        self::assertNotContains('vf-icon-button--md', $this->classes(['size' => 'md']));
        self::assertSame(['vf-icon-button', 'vf-icon-button--ghost'], $this->classes(['size' => 'md']));
    }

    public function testRendersExactlyOneIconAndNoText(): void
    {
        $button = $this->button();

        self::assertSame(1, $button->getElementsByTagName('svg')->length);
        self::assertSame(1, $button->getElementsByTagName('span')->length);
        self::assertSame('', trim($button->textContent));
    }

    // Variants and sizes.

    /** @return iterable<string, array{string}> */
    public static function variantProvider(): iterable
    {
        foreach (['primary', 'secondary', 'success', 'info', 'warn', 'help', 'danger', 'contrast', 'ghost'] as $v) {
            yield $v => [$v];
        }
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('variantProvider')]
    public function testAddsTheVariantModifier(string $variant): void
    {
        $classes = $this->classes(['variant' => $variant]);

        self::assertContains('vf-icon-button--' . $variant, $classes);
        self::assertSame('vf-icon-button', $classes[0]);
    }

    public function testAddsTheSizeModifierForSmallAndLarge(): void
    {
        self::assertContains('vf-icon-button--sm', $this->classes(['size' => 'sm']));
        self::assertContains('vf-icon-button--lg', $this->classes(['size' => 'lg']));
    }

    /** @return iterable<string, array{string, string}> */
    public static function iconSizeProvider(): iterable
    {
        yield 'sm' => ['sm', 'var(--vf-icon-size-sm)'];
        yield 'md' => ['md', 'var(--vf-icon-size-md)'];
        yield 'lg' => ['lg', 'var(--vf-icon-size-lg)'];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('iconSizeProvider')]
    public function testSizesTheGlyphThroughTheIconSizeToken(string $size, string $expected): void
    {
        $svg = $this->button(['size' => $size])->getElementsByTagName('svg')->item(0);
        self::assertInstanceOf(DOMElement::class, $svg);

        self::assertSame($expected, $svg->getAttribute('width'));
        self::assertSame($expected, $svg->getAttribute('height'));
    }

    // Icon contract.

    public function testPassesTheRequestedGlyphStraightThrough(): void
    {
        // The eye and the struck-through eye differ in child count, which is
        // the cheapest way to prove the glyph changed rather than the name.
        $eye = $this->button(['icon' => 'eye'])->getElementsByTagName('svg')->item(0);
        $eyeSlash = $this->button(['icon' => 'eye-slash'])->getElementsByTagName('svg')->item(0);
        self::assertInstanceOf(DOMElement::class, $eye);
        self::assertInstanceOf(DOMElement::class, $eyeSlash);

        self::assertNotSame($eye->ownerDocument?->saveHTML($eye), $eyeSlash->ownerDocument?->saveHTML($eyeSlash));
    }

    public function testHidesTheGlyphFromAssistiveTechnologySoTheButtonOwnsTheAccessibleName(): void
    {
        $svg = $this->button()->getElementsByTagName('svg')->item(0);
        self::assertInstanceOf(DOMElement::class, $svg);

        self::assertSame('true', $svg->getAttribute('aria-hidden'));
    }

    public function testCarriesNoInlineLayoutOnTheGlyph(): void
    {
        // M10 moved the icon layout into the shared stylesheet. The wrapper
        // keeps only the per-glyph custom properties and the svg keeps nothing,
        // which is what let two parity approvals be deleted rather than kept.
        $button = $this->button();
        $wrapper = $button->getElementsByTagName('span')->item(0);
        $svg = $button->getElementsByTagName('svg')->item(0);
        self::assertInstanceOf(DOMElement::class, $wrapper);
        self::assertInstanceOf(DOMElement::class, $svg);

        self::assertFalse($svg->hasAttribute('style'));
        self::assertStringNotContainsString('display', $wrapper->getAttribute('style'));
        self::assertStringNotContainsString('place-items', $wrapper->getAttribute('style'));
        self::assertStringContainsString('--vf-icon-scale', $wrapper->getAttribute('style'));
    }

    // Attribute forwarding.

    public function testForwardsNativeAndAriaAttributesOntoTheButton(): void
    {
        $button = $this->button([
            'aria-label' => 'Clear input',
            'aria-pressed' => 'false',
            'id' => 'clear-control',
            'title' => 'Clear',
            'name' => 'clear',
            'data-testid' => 'clear',
        ]);

        self::assertSame('Clear input', $button->getAttribute('aria-label'));
        self::assertSame('false', $button->getAttribute('aria-pressed'));
        self::assertSame('clear-control', $button->getAttribute('id'));
        self::assertSame('Clear', $button->getAttribute('title'));
        self::assertSame('clear', $button->getAttribute('name'));
        self::assertSame('clear', $button->getAttribute('data-testid'));
    }

    public function testMergesAConsumerClassWithTheCanonicalClassesRatherThanReplacingThem(): void
    {
        $classes = $this->classes(['class' => 'consumer-class']);

        self::assertContains('vf-icon-button', $classes);
        self::assertContains('vf-icon-button--ghost', $classes);
        self::assertContains('consumer-class', $classes);
    }

    public function testKeepsAConsumerStyleOnTheButton(): void
    {
        self::assertStringContainsString('margin-top: 4px', $this->button(['style' => 'margin-top: 4px;'])->getAttribute('style'));
    }

    public function testLetsAConsumerOverrideTheRenderedTypeThroughTheProp(): void
    {
        self::assertSame('submit', $this->button(['type' => 'submit'])->getAttribute('type'));
    }

    public function testRendersTheNativeDisabledAttributeAConsumerSupplies(): void
    {
        self::assertTrue($this->button(['disabled' => true])->hasAttribute('disabled'));
    }

    // Failure modes. Unlike Vue, a server renderer can refuse.

    public function testRejectsAMissingIcon(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('[icon] prop of vf-icon-button is required');

        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $registry->resolve('vf-icon-button')?->render(new ComponentRenderContext([], []));
    }

    public function testRejectsAnUnknownGlyph(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown VueForge Razor icon [not-a-real-icon]');

        $this->render(['icon' => 'not-a-real-icon']);
    }

    public function testRejectsANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('[data-thing] attribute of vf-icon-button must be a scalar or null');

        $this->render(['data-thing' => ['nested']]);
    }

    public function testEscapesConsumerSuppliedValues(): void
    {
        $markup = $this->render([
            'class' => '"><script>alert(1)</script>',
            'aria-label' => '"><img src=x onerror=alert(1)>',
        ]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringNotContainsString('<img', $markup);
        self::assertStringContainsString('&lt;script&gt;', $markup);
    }
}
