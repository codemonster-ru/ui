<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\BadgeComponent;
use Codemonster\VueForge\Razor\Components\DividerComponent;
use Codemonster\VueForge\Razor\Components\TagComponent;
use Codemonster\VueForge\Razor\Support\Html;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Every value these components write into markup is escaped.
 *
 * Two different contracts are exercised here and the difference matters.
 *
 * Attribute values are written by the component from a props map, so the
 * component escapes them itself - the same rule InputEscapingTest pins.
 *
 * Slot content is not. `RenderedHtml` is already-rendered markup, and
 * `fromTrustedString` is an explicit assertion that the caller escaped it: in a
 * real template the Razor compiler escapes interpolated values before they ever
 * reach a slot. So the tests below escape hostile text the way a template
 * would, then assert the parsed DOM carries it as data rather than as markup.
 * Handing raw hostile markup to `fromTrustedString` and demanding the component
 * neutralise it would be inventing a different escaping contract to make a test
 * pass, which section 15 of the M15 plan forbids.
 */
final class PresentationEscapingTest extends TestCase
{
    /** @return array<string, array{string}> */
    public static function hostileValueProvider(): array
    {
        return [
            'double quote' => ['say "hello"'],
            'single quote' => ["it's mine"],
            'angle brackets' => ['<script>alert(1)</script>'],
            'ampersand' => ['Tom & Jerry'],
            'attribute injection' => ['" onfocus="alert(1)'],
            'tag injection' => ['"><img src=x onerror=alert(1)>'],
            'closing the root span' => ['</span><img src=x onerror=alert(1)>'],
            'unicode' => ['Приве́т 🌍 日本語'],
        ];
    }

    private function parse(string $markup, string $tag): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $markup . '</body></html>',
            LIBXML_NOERROR,
        ));
        $node = (new DOMXPath($document))->query('//' . $tag)?->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testBadgeSlotTextSurvivesAsTextNotMarkup(string $hostile): void
    {
        // Escaped the way the Razor compiler escapes an interpolated value.
        $slot = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(Html::escape($hostile))];
        $markup = (new BadgeComponent())->render(new ComponentRenderContext([], $slot))->value();

        $span = $this->parse($markup, 'span');
        self::assertSame($hostile, $span->textContent);
        self::assertSame(0, $span->getElementsByTagName('img')->length, 'Hostile text became markup.');
        self::assertSame(0, $span->getElementsByTagName('script')->length, 'Hostile text became markup.');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testTagSlotTextSurvivesAsTextNotMarkup(string $hostile): void
    {
        $slot = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(Html::escape($hostile))];
        $markup = (new TagComponent())->render(new ComponentRenderContext([], $slot))->value();

        $span = $this->parse($markup, 'span');
        self::assertSame($hostile, $span->textContent);
        self::assertSame(0, $span->getElementsByTagName('img')->length, 'Hostile text became markup.');
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testBadgeEscapesHostileAttributeValues(string $hostile): void
    {
        // The component wrote this one itself, so the component escaped it.
        $markup = (new BadgeComponent())->render(new ComponentRenderContext(
            ['data-hostile' => $hostile, 'title' => $hostile],
            [],
        ))->value();

        $span = $this->parse($markup, 'span');
        self::assertSame($hostile, $span->getAttribute('data-hostile'));
        self::assertSame($hostile, $span->getAttribute('title'));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testTagEscapesHostileAttributeValues(string $hostile): void
    {
        $markup = (new TagComponent())->render(new ComponentRenderContext(
            ['data-hostile' => $hostile, 'title' => $hostile],
            [],
        ))->value();

        $span = $this->parse($markup, 'span');
        self::assertSame($hostile, $span->getAttribute('data-hostile'));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testDividerEscapesHostileAttributeValues(string $hostile): void
    {
        $markup = (new DividerComponent())->render(new ComponentRenderContext(
            ['data-hostile' => $hostile, 'role' => $hostile],
            [],
        ))->value();

        $divider = $this->parse($markup, 'div');
        self::assertSame($hostile, $divider->getAttribute('data-hostile'));
        // Even the overridable role is escaped: the override path is not an
        // escape hatch out of escaping.
        self::assertSame($hostile, $divider->getAttribute('role'));
    }

    public function testTheDividerHasNoSlotToEscape(): void
    {
        // Slot content is not a channel this component has. A slot passed to it
        // is ignored rather than rendered, which is also what Vue does.
        $slot = [
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<img src=x onerror=alert(1)>'),
        ];
        $markup = (new DividerComponent())->render(new ComponentRenderContext([], $slot))->value();

        self::assertSame('<div class="vf-divider vf-divider--horizontal" aria-orientation="horizontal"></div>', $markup);
    }

    public function testAnUnsafeAttributeNameIsRejectedRatherThanWritten(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new BadgeComponent())->render(new ComponentRenderContext(['onload=x y' => 'boom'], []))->value();
    }
}
