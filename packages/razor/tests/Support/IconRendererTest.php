<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\IconButtonState;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * The neutral icon registry, rendered.
 *
 * A note on what this suite can and cannot prove. `Html::escape` on the values
 * IconRenderer writes is defence in depth, not a live boundary: every one of
 * them is generated into icon-registry.json from the Vue icon package, and the
 * only consumer-controlled input is the glyph name, which is rejected unless it
 * names a registry entry. Deleting those escape calls therefore breaks no test,
 * because no reachable input needs escaping.
 *
 * So the invariant is asserted directly instead: the registry contains nothing
 * that would need escaping, and no consumer-supplied string reaches the markup.
 * A poisoned or hand-edited registry fails here rather than in a browser.
 */
final class IconRendererTest extends TestCase
{
    /** @return array<string, array{wrapperClass: string, wrapperStyle: string, attributes: array<string, string>, body: string}> */
    private static function registry(): array
    {
        $path = dirname(__DIR__, 2) . '/resources/icons/icon-registry.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "The icon registry is missing at [{$path}].");

        return json_decode($contents, true, 512, JSON_THROW_ON_ERROR)['icons'];
    }

    public function testTheRegistryShipsTheWholeIconSystemRatherThanAPerComponentSubset(): void
    {
        $registry = self::registry();

        // The point of M10: a component migration needs no icon extraction
        // step, because every published glyph is already here. The exact count
        // is not pinned - the icons package may add glyphs - but a registry
        // that shrank back to a handful means the per-component blob returned.
        self::assertGreaterThan(100, count($registry));

        foreach (['xmark', 'eye', 'eye-slash'] as $name) {
            self::assertArrayHasKey($name, $registry, 'The VfInput action glyphs must still be present.');
        }
    }

    public function testNoRegistryValueNeedsEscaping(): void
    {
        foreach (self::registry() as $name => $icon) {
            self::assertSame($name, htmlspecialchars($name, ENT_QUOTES), "Glyph name [{$name}] needs escaping.");

            foreach (['wrapperClass', 'wrapperStyle'] as $field) {
                self::assertSame(
                    $icon[$field],
                    htmlspecialchars($icon[$field], ENT_QUOTES),
                    "[{$name}.{$field}] needs escaping, so the registry is not the benign data this adapter assumes.",
                );
            }

            foreach ($icon['attributes'] as $attribute => $value) {
                self::assertMatchesRegularExpression('/^[A-Za-z_:][A-Za-z0-9_:.-]*$/', $attribute);
                self::assertSame(
                    $value,
                    htmlspecialchars($value, ENT_QUOTES),
                    "[{$name}.attributes.{$attribute}] needs escaping.",
                );
            }
        }
    }

    public function testEveryRegistryGlyphRendersAsOneWellFormedIcon(): void
    {
        foreach (array_keys(self::registry()) as $name) {
            $document = new DOMDocument();
            self::assertTrue(
                $document->loadHTML(
                    '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
                        . IconRenderer::render($name, 'var(--vf-icon-size-md)', ariaHidden: true)
                        . '</body></html>',
                    LIBXML_NOERROR,
                ),
                "Glyph [{$name}] did not render parseable markup.",
            );

            $xpath = new DOMXPath($document);
            self::assertSame(1, $xpath->query('//span[@class="vf-icon-wrapper"]')?->length, "wrapper for [{$name}]");

            $svg = $xpath->query('//svg')?->item(0);
            self::assertInstanceOf(DOMElement::class, $svg, "svg for [{$name}]");
            self::assertSame('true', $svg->getAttribute('aria-hidden'));
            self::assertFalse($svg->hasAttribute('style'), "Glyph [{$name}] still carries inline layout.");
        }
    }

    public function testTheOnlyConsumerControlledInputIsRejectedUnlessItNamesARegistryEntry(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Unknown VueForge Razor icon ["><script>alert(1)</script>]');

        IconRenderer::render('"><script>alert(1)</script>', 'var(--vf-icon-size-md)');
    }

    public function testNoConsumerSuppliedSizeCanReachTheMarkup(): void
    {
        // The other argument IconRenderer writes is the size, and it is never
        // taken from a consumer: an unrecognised size collapses to a fixed
        // token, so a hostile `size` prop cannot become a width attribute.
        foreach (['"><script>alert(1)</script>', 'sm; color: red', ''] as $hostile) {
            self::assertSame('var(--vf-icon-size-md)', IconButtonState::resolveIconSize($hostile));
        }
    }
}
