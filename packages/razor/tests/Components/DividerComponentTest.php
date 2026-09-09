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
 * Server-rendered VfDivider.
 *
 * Mirrors packages/core/src/components/divider/VfDivider.characterization.spec.ts.
 * The assertions that matter here are the ones a reviewer would want to
 * "correct": the div root, the roleless horizontal divider carrying an
 * aria-orientation, and the consumer's ability to override either ARIA
 * attribute. All three are the reference contract.
 */
final class DividerComponentTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(array $props = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-divider');
        self::assertNotNull($component, 'The vf-divider component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    /** @param array<string, mixed> $props */
    private function divider(array $props = []): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($props) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $node = (new DOMXPath($document))->query('//div')?->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

    public function testRendersADivRootNotAnHr(): void
    {
        self::assertSame('div', $this->divider()->tagName);
        self::assertStringNotContainsString('<hr', $this->render());
    }

    public function testAlwaysEmitsAnOrientationModifierIncludingTheDefault(): void
    {
        // Unlike VfBadge and VfTag in the same batch, where the default tone
        // emits nothing. Two conventions inside one milestone.
        self::assertSame('vf-divider vf-divider--horizontal', $this->divider()->getAttribute('class'));
        self::assertSame(
            'vf-divider vf-divider--vertical',
            $this->divider(['orientation' => 'vertical'])->getAttribute('class'),
        );
    }

    public function testAHorizontalDividerCarriesAriaOrientationAndNoRole(): void
    {
        $divider = $this->divider();

        self::assertSame('horizontal', $divider->getAttribute('aria-orientation'));
        self::assertFalse($divider->hasAttribute('role'), 'A horizontal divider must expose no role at all.');
    }

    public function testAVerticalDividerCarriesBothTheSeparatorRoleAndAriaOrientation(): void
    {
        $divider = $this->divider(['orientation' => 'vertical']);

        self::assertSame('separator', $divider->getAttribute('role'));
        self::assertSame('vertical', $divider->getAttribute('aria-orientation'));
    }

    public function testAConsumerCanAddARoleToAHorizontalDivider(): void
    {
        self::assertSame('presentation', $this->divider(['role' => 'presentation'])->getAttribute('role'));
    }

    public function testAConsumerCanReplaceTheSeparatorRoleOnAVerticalDivider(): void
    {
        self::assertSame(
            'none',
            $this->divider(['orientation' => 'vertical', 'role' => 'none'])->getAttribute('role'),
        );
    }

    public function testAConsumerCanOverrideAriaOrientationAgainstTheProp(): void
    {
        // The class still says horizontal. The two are allowed to disagree,
        // because nothing historically reconciles them.
        $divider = $this->divider(['aria-orientation' => 'vertical']);

        self::assertSame('vertical', $divider->getAttribute('aria-orientation'));
        self::assertStringContainsString('vf-divider--horizontal', $divider->getAttribute('class'));
    }

    public function testAConsumerCanOverrideBothAtOnce(): void
    {
        $divider = $this->divider([
            'orientation' => 'vertical',
            'role' => 'presentation',
            'aria-orientation' => 'horizontal',
        ]);

        self::assertSame('presentation', $divider->getAttribute('role'));
        self::assertSame('horizontal', $divider->getAttribute('aria-orientation'));
        self::assertStringContainsString('vf-divider--vertical', $divider->getAttribute('class'));
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertSame('vf-divider vf-divider--horizontal mine', $this->divider(['class' => 'mine'])->getAttribute('class'));
    }

    public function testForwardsStyleDataAndIdToTheRoot(): void
    {
        $divider = $this->divider(['style' => 'margin: 4px', 'data-testid' => 'divider', 'id' => 'd1']);

        self::assertSame('margin: 4px', $divider->getAttribute('style'));
        self::assertSame('divider', $divider->getAttribute('data-testid'));
        self::assertSame('d1', $divider->getAttribute('id'));
    }

    public function testRendersNoChildren(): void
    {
        self::assertSame(
            '<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>',
            $this->render(),
        );
    }

    public function testRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-thing' => ['nested']]);
    }
}
