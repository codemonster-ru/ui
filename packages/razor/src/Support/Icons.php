<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

use RuntimeException;

/**
 * Reads the generated icon geometry.
 *
 * The geometry is produced by packages/icons/scripts/generate-icons.mjs from the VueForge renderer
 * and shared with the Vue adapter, so nothing here draws anything. Reimplementing that renderer in
 * PHP would have meant two engines obliged to agree on 879 outputs, and an icon that renders
 * slightly differently still renders -- the drift would not announce itself.
 *
 * One file per icon: PHP has no tree shaking, so a single bundle would make drawing one arrow cost
 * the whole set.
 */
final class Icons
{
    private const DEFAULT_FAMILY = 'classic';
    private const FALLBACK = 'classic/solid';

    /** @var array<string, array<string, array{body: string, viewBox: string}>> */
    private static array $cache = [];

    private static function directory(): string
    {
        return dirname(__DIR__, 2) . '/resources/icons';
    }

    /**
     * Reads one rendering, falling back to the form a brand mark actually has.
     *
     * A brand has one canonical rendering, so asking for a thin-stroke logo is not an error to
     * refuse -- it is a request the set answers with the only form that exists.
     *
     * @return array{body: string, viewBox: string}|null
     */
    public static function resolve(string $name, string $family = self::DEFAULT_FAMILY, string $variant = 'regular'): ?array
    {
        $geometry = self::geometry($name);
        if ($geometry === null) {
            return null;
        }

        return $geometry["{$family}/{$variant}"] ?? $geometry[self::FALLBACK] ?? null;
    }

    /** @return array<string, array{body: string, viewBox: string}>|null */
    public static function geometry(string $name): ?array
    {
        if (array_key_exists($name, self::$cache)) {
            return self::$cache[$name];
        }

        if (preg_match('/^[A-Za-z][A-Za-z0-9]*$/', $name) !== 1) {
            return null;
        }

        $path = self::directory() . "/{$name}.json";
        if (!is_file($path)) {
            return null;
        }

        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new RuntimeException("Unable to read icon geometry at {$path}.");
        }

        /** @var array<string, array{body: string, viewBox: string}> $decoded */
        $decoded = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        self::$cache[$name] = $decoded;

        return $decoded;
    }

    /** @return list<string> */
    public static function names(): array
    {
        $contents = file_get_contents(self::directory() . '/index.json');
        if ($contents === false) {
            throw new RuntimeException('Unable to read the icon index.');
        }

        /** @var list<string> $names */
        $names = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);

        return $names;
    }
}
