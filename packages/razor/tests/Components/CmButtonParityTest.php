<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmButton;
use Codemonster\View\Locator\DefaultLocator;
use DOMDocument;
use DOMElement;
use DOMNode;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmButtonParityTest extends TestCase
{
    private const BOOLEAN_ATTRIBUTES = ['disabled', 'hidden', 'required', 'readonly', 'multiple', 'checked'];

    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-parity-' . bin2hex(random_bytes(6));
    }

    protected function tearDown(): void
    {
        foreach (glob($this->cache . '/*') ?: [] as $file) {
            unlink($file);
        }

        if (is_dir($this->cache)) {
            rmdir($this->cache);
        }
    }

    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $slots = [];

        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }

        $actual = $this->button()->render(new ComponentRenderContext($case['props'], $slots))->value();
        $expected = (string) file_get_contents($htmlPath);

        self::assertSame($this->normalize($expected), $this->normalize($actual));
    }

    /** @return iterable<string, array{string, string}> */
    public static function caseProvider(): iterable
    {
        $cases = dirname(__DIR__, 4) . '/contracts/button/cases';

        foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
            $basename = substr(basename($casePath), 0, -strlen('.case.json'));
            yield $basename => [$casePath, $cases . '/' . $basename . '.html'];
        }
    }

    private function button(): CmButton
    {
        return new CmButton(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }

    /** @return list<array<string, mixed>> */
    private function normalize(string $html): array
    {
        $document = new DOMDocument('1.0', 'UTF-8');
        $previous = libxml_use_internal_errors(true);
        $document->loadHTML(
            '<div data-parity-root>' . $html . '</div>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD,
        );
        libxml_clear_errors();
        libxml_use_internal_errors($previous);
        $root = $document->documentElement;

        self::assertInstanceOf(DOMElement::class, $root);

        return $this->normalizeChildren($root);
    }

    /** @return list<array<string, mixed>> */
    private function normalizeChildren(DOMNode $parent): array
    {
        $children = [];

        foreach ($parent->childNodes as $node) {
            if ($node->nodeType === XML_COMMENT_NODE
                || ($node->nodeType === XML_TEXT_NODE && trim((string) $node->nodeValue) === '')) {
                continue;
            }

            if ($node->nodeType === XML_TEXT_NODE) {
                $children[] = ['text' => $node->nodeValue];
                continue;
            }

            if (!$node instanceof DOMElement) {
                continue;
            }

            $attributes = [];

            foreach ($node->attributes as $attribute) {
                $value = in_array($attribute->name, self::BOOLEAN_ATTRIBUTES, true) ? true : $attribute->value;

                if ($attribute->name === 'class') {
                    $classes = preg_split('/\s+/', trim($attribute->value), -1, PREG_SPLIT_NO_EMPTY) ?: [];
                    sort($classes);
                    $value = implode(' ', array_unique($classes));
                }

                $attributes[$attribute->name] = $value;
            }

            ksort($attributes);
            $children[] = [
                'tag' => $node->tagName,
                'attributes' => $attributes,
                'children' => $this->normalizeChildren($node),
            ];
        }

        return $children;
    }
}
