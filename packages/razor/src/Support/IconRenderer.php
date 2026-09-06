<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * Renders the neutral icon data extracted from the Vue icon package.
 *
 * The geometry is owned by packages/icons and generated into
 * resources/icons/input-icon-data.json; `npm run check:icon-data` fails if that
 * file drifts from a fresh render. This class only turns the data into markup.
 *
 * Only the glyphs the Input closure needs are extracted. An unknown name throws
 * rather than silently rendering nothing, so a missing glyph is a visible
 * development error instead of an invisible gap in the UI.
 *
 * @internal
 */
final class IconRenderer
{
    /** @var array<string, array{wrapperClass: string, wrapperStyle: string, attributes: array<string, string>, body: string}>|null */
    private static ?array $icons = null;

    public static function has(string $name): bool
    {
        return isset(self::icons()[$name]);
    }

    /** @return list<string> */
    public static function available(): array
    {
        return array_keys(self::icons());
    }

    /**
     * Renders one glyph at the given CSS size.
     *
     * `$size` is written into width/height exactly as the Vue icon does, so the
     * same custom properties drive both adapters. `$ariaHidden` mirrors the flag
     * the Vue adapter passes for an icon inside a labelled action button.
     */
    public static function render(string $name, string $size, bool $ariaHidden = false): string
    {
        $icons = self::icons();

        if (!isset($icons[$name])) {
            throw new \InvalidArgumentException(sprintf(
                'Unknown VueForge Razor icon [%s]. Available: %s. Extract more glyphs with '
                . 'scripts/build/generate-input-icon-data.mjs, or use the leading/trailing slots.',
                $name,
                implode(', ', self::available()),
            ));
        }

        $icon = $icons[$name];
        $attributes = $icon['attributes'];
        $attributes['width'] = $size;
        $attributes['height'] = $size;

        if ($ariaHidden) {
            $attributes['aria-hidden'] = 'true';
        }

        return '<span class="' . Html::escape($icon['wrapperClass']) . '"'
            . ' style="' . Html::escape($icon['wrapperStyle']) . '">'
            . '<svg' . Html::attributes($attributes) . '>' . $icon['body'] . '</svg>'
            . '</span>';
    }

    /** @return array<string, array{wrapperClass: string, wrapperStyle: string, attributes: array<string, string>, body: string}> */
    private static function icons(): array
    {
        if (self::$icons !== null) {
            return self::$icons;
        }

        $path = dirname(__DIR__, 2) . '/resources/icons/input-icon-data.json';
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new \RuntimeException("Unable to read VueForge icon data at [{$path}].");
        }

        /** @var array{icons: array<string, array{wrapperClass: string, wrapperStyle: string, attributes: array<string, string>, body: string}>} $decoded */
        $decoded = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);

        return self::$icons = $decoded['icons'];
    }
}
