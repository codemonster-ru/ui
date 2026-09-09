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
 * Server-rendered VfBadge.
 *
 * The assertions deliberately mirror
 * packages/core/src/components/badge/VfBadge.characterization.spec.ts case for
 * case, so the two can be read side by side. The browser-level proof that they
 * agree is the parity gate; this suite is what fails first, and points at the
 * attribute.
 *
 * A separate file from TagComponentTest even though the two components render
 * nearly identical markup: shared evidence for near-identical components is how
 * a substitution goes unnoticed.
 */
final class BadgeComponentTest extends TestCase
{
    /** Every literal the public VfBadgeTone union allows. */
    private const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

    /** @param array<string, mixed> $props */
    private function render(array $props = [], ?string $content = 'Draft'): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-badge');
        self::assertNotNull($component, 'The vf-badge component must be registered by the provider.');

        $slots = $content === null
            ? []
            : ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content)];

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @param array<string, mixed> $props */
    private function badge(array $props = [], ?string $content = 'Draft'): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($props, $content) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $node = (new DOMXPath($document))->query('//span')?->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

    public function testRendersASpanRoot(): void
    {
        self::assertSame('span', $this->badge()->tagName);
    }

    public function testTheDefaultToneEmitsNoModifierAtAll(): void
    {
        // Neutral is expressed by absence, the opposite of the checkable
        // controls where the default size still emits a modifier.
        self::assertSame('<span class="vf-badge">Draft</span>', $this->render());
    }

    public function testAnExplicitNeutralToneAlsoEmitsNoModifier(): void
    {
        self::assertSame('<span class="vf-badge">Draft</span>', $this->render(['tone' => 'neutral']));
    }

    public function testEveryNonNeutralToneEmitsItsModifier(): void
    {
        foreach (self::TONES as $tone) {
            if ($tone === 'neutral') {
                continue;
            }

            self::assertSame(
                'vf-badge vf-badge--' . $tone,
                $this->badge(['tone' => $tone])->getAttribute('class'),
                sprintf('tone=%s', $tone),
            );
        }
    }

    public function testNeverEmitsATagClass(): void
    {
        foreach (self::TONES as $tone) {
            self::assertStringNotContainsString('vf-tag', $this->render(['tone' => $tone]));
        }
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertSame(
            'vf-badge vf-badge--primary mine other',
            $this->badge(['tone' => 'primary', 'class' => 'mine other'])->getAttribute('class'),
        );
    }

    public function testAConsumerClassIsAppendedAtTheNeutralToneToo(): void
    {
        self::assertSame('vf-badge mine', $this->badge(['class' => 'mine'])->getAttribute('class'));
    }

    public function testForwardsStyleDataIdAndTitleToTheRoot(): void
    {
        $badge = $this->badge([
            'style' => 'color: red',
            'data-testid' => 'badge',
            'id' => 'b1',
            'title' => 'Status',
        ]);

        self::assertSame('color: red', $badge->getAttribute('style'));
        self::assertSame('badge', $badge->getAttribute('data-testid'));
        self::assertSame('b1', $badge->getAttribute('id'));
        self::assertSame('Status', $badge->getAttribute('title'));
    }

    public function testWritesNoAriaOfItsOwnAndForwardsWhatTheConsumerSupplies(): void
    {
        $bare = $this->badge();
        self::assertFalse($bare->hasAttribute('role'));
        self::assertFalse($bare->hasAttribute('aria-label'));

        $labelled = $this->badge(['role' => 'status', 'aria-label' => 'Two items']);
        self::assertSame('status', $labelled->getAttribute('role'));
        self::assertSame('Two items', $labelled->getAttribute('aria-label'));
    }

    public function testRendersAnEmptySpanWithoutSlotContent(): void
    {
        self::assertSame('<span class="vf-badge"></span>', $this->render([], null));
    }

    public function testRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-thing' => ['nested']]);
    }
}
