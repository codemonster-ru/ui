<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\InputComponent;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Every value the component writes into markup is escaped.
 *
 * The Razor compiler escapes values interpolated by a template, but this
 * component assembles elements from a props map, so it escapes what it writes
 * itself. These tests feed hostile values and assert the parsed DOM carries the
 * value verbatim as data rather than as markup.
 */
final class InputEscapingTest extends TestCase
{
    /** @param array<string, mixed> $props */
    private function render(array $props, array $slots = []): string
    {
        $slotClosures = [];
        foreach ($slots as $name => $markup) {
            $slotClosures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }

        return (new InputComponent())->render(new ComponentRenderContext($props, $slotClosures))->value();
    }

    /** @param array<string, mixed> $props */
    private function input(array $props): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $this->render($props) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $node = (new DOMXPath($document))->query('//input')->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

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
            'unicode' => ['Приве́т 🌍 日本語'],
            'entity looking' => ['&amp;lt;already escaped&amp;gt;'],
            'newline' => ["line one\nline two"],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testValueIsEscapedAndSurvivesAsData(string $hostile): void
    {
        self::assertSame($hostile, $this->input(['value' => $hostile])->getAttribute('value'));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testPlaceholderIsEscapedAndSurvivesAsData(string $hostile): void
    {
        self::assertSame($hostile, $this->input(['placeholder' => $hostile])->getAttribute('placeholder'));
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('hostileValueProvider')]
    public function testNameAndDataAttributesAreEscaped(string $hostile): void
    {
        $input = $this->input(['name' => $hostile, 'data-note' => $hostile, 'aria-label' => $hostile]);

        self::assertSame($hostile, $input->getAttribute('name'));
        self::assertSame($hostile, $input->getAttribute('data-note'));
        self::assertSame($hostile, $input->getAttribute('aria-label'));
    }

    public function testInjectionAttemptsDoNotCreateNewElementsOrAttributes(): void
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
                . $this->render(['value' => '"><img src=x onerror=alert(1)>', 'placeholder' => '" onfocus="alert(1)'])
                . '</body></html>',
            LIBXML_NOERROR,
        ));
        $xpath = new DOMXPath($document);

        self::assertSame(0, $xpath->query('//img')->length, 'A value must not be able to introduce an element.');
        self::assertSame(0, $xpath->query('//*[@onerror]')->length);
        self::assertSame(0, $xpath->query('//*[@onfocus]')->length);
    }

    public function testClassAndStyleAreEscaped(): void
    {
        $input = $this->input(['class' => 'a" onmouseover="x', 'style' => 'color:red" onload="x']);

        self::assertStringContainsString('a" onmouseover="x', $input->getAttribute('class'));
        self::assertSame('color:red" onload="x', $input->getAttribute('style'));
    }

    public function testActionLabelsAreEscaped(): void
    {
        $markup = $this->render([
            'clearable' => true,
            'value' => 'x',
            'clear-label' => '"><script>alert(1)</script>',
        ]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringContainsString('&quot;&gt;&lt;script&gt;', $markup);
    }

    public function testSlotContentIsTreatedAsAlreadyRenderedHtml(): void
    {
        // Slot content arrives as RenderedHtml from the engine, which is an
        // explicit assertion by the caller that it is already safe. The
        // component composes it without double-escaping, exactly like the
        // engine's own slot handling.
        $markup = $this->render(['value' => 'x'], ['leading' => '<span class="unit">€</span>']);

        self::assertStringContainsString('<span class="unit">€</span>', $markup);
    }

    public function testUnsafeAttributeNamesAreRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/Unsafe HTML attribute name/');

        $this->render(['data-x" onload="alert(1)' => 'boom']);
    }
}
