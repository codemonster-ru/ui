<?php

declare(strict_types=1);

namespace Codemonster\Ui\Support;

/**
 * The theme preference, as the server sees it.
 *
 * This mirrors runtime/src/core/theme.ts. The mode is written to the document root verbatim,
 * `system` included, because the stylesheet resolves that case through a media query — so the
 * server never has to guess which way a deferred preference resolves in a browser it cannot see.
 */
final class Theme
{
    public const ATTRIBUTE = 'data-cm-theme';
    public const COOKIE = 'cm-theme';
    public const DARK = 'dark';
    public const LIGHT = 'light';
    public const SYSTEM = 'system';

    /** @return list<string> */
    public static function modes(): array
    {
        return [self::LIGHT, self::DARK, self::SYSTEM];
    }

    public static function normalizeMode(?string $value): string
    {
        return in_array($value, self::modes(), true) ? $value : self::SYSTEM;
    }

    /**
     * Reads the preference out of a cookie jar, falling back to deferring to the operating system.
     *
     * @param array<string, mixed> $cookies
     */
    public static function modeFromCookie(array $cookies, string $name = self::COOKIE): string
    {
        $value = $cookies[$name] ?? null;

        return self::normalizeMode(is_string($value) ? $value : null);
    }

    /**
     * Renders the root attribute for a mode, for a layout to place on its `<html>` element.
     *
     * @param array<string, mixed> $cookies
     */
    public static function rootAttribute(array $cookies, string $name = self::COOKIE): string
    {
        return sprintf('%s="%s"', self::ATTRIBUTE, self::modeFromCookie($cookies, $name));
    }
}
