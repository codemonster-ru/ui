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
 * Server-rendered VfTag.
 *
 * Mirrors packages/core/src/components/tag/VfTag.characterization.spec.ts, and
 * is kept separate from BadgeComponentTest for the same reason the components
 * are kept separate: two near-identical implementations need two sets of
 * evidence, or neither is evidence of anything.
 */
final class TagComponentTest extends TestCase
{
    /** Every literal the public VfFeedbackTone union allows. */
    private const TONES = ['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'];

    /** @param array<string, mixed> $props */
    private function render(array $props = [], ?string $content = 'Beta'): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-tag');
        self::assertNotNull($component, 'The vf-tag component must be registered by the provider.');

        $slots = $content === null
            ? []
            : ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content)];

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @param array<string, mixed> $props */
    private function tag(array $props = [], ?string $content = 'Beta'): DOMElement
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
        self::assertSame('span', $this->tag()->tagName);
    }

    public function testTheDefaultToneEmitsNoModifierAtAll(): void
    {
        self::assertSame('<span class="vf-tag">Beta</span>', $this->render());
    }

    public function testAnExplicitNeutralToneAlsoEmitsNoModifier(): void
    {
        self::assertSame('<span class="vf-tag">Beta</span>', $this->render(['tone' => 'neutral']));
    }

    public function testEveryNonNeutralToneEmitsItsModifier(): void
    {
        foreach (self::TONES as $tone) {
            if ($tone === 'neutral') {
                continue;
            }

            self::assertSame(
                'vf-tag vf-tag--' . $tone,
                $this->tag(['tone' => $tone])->getAttribute('class'),
                sprintf('tone=%s', $tone),
            );
        }
    }

    public function testNeverEmitsABadgeClass(): void
    {
        foreach (self::TONES as $tone) {
            self::assertStringNotContainsString('vf-badge', $this->render(['tone' => $tone]));
        }
    }

    public function testAConsumerClassIsAppendedAfterTheCanonicalClasses(): void
    {
        self::assertSame(
            'vf-tag vf-tag--danger mine other',
            $this->tag(['tone' => 'danger', 'class' => 'mine other'])->getAttribute('class'),
        );
    }

    public function testAConsumerClassIsAppendedAtTheNeutralToneToo(): void
    {
        self::assertSame('vf-tag mine', $this->tag(['class' => 'mine'])->getAttribute('class'));
    }

    public function testForwardsStyleDataIdAndTitleToTheRoot(): void
    {
        $tag = $this->tag([
            'style' => 'color: red',
            'data-testid' => 'tag',
            'id' => 't1',
            'title' => 'Stage',
        ]);

        self::assertSame('color: red', $tag->getAttribute('style'));
        self::assertSame('tag', $tag->getAttribute('data-testid'));
        self::assertSame('t1', $tag->getAttribute('id'));
        self::assertSame('Stage', $tag->getAttribute('title'));
    }

    public function testWritesNoAriaOfItsOwnAndForwardsWhatTheConsumerSupplies(): void
    {
        $bare = $this->tag();
        self::assertFalse($bare->hasAttribute('role'));
        self::assertFalse($bare->hasAttribute('aria-label'));

        $labelled = $this->tag(['role' => 'note', 'aria-label' => 'Beta stage']);
        self::assertSame('note', $labelled->getAttribute('role'));
        self::assertSame('Beta stage', $labelled->getAttribute('aria-label'));
    }

    public function testRendersAnEmptySpanWithoutSlotContent(): void
    {
        self::assertSame('<span class="vf-tag"></span>', $this->render([], null));
    }

    public function testRejectsANonScalarAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-thing' => ['nested']]);
    }
}
