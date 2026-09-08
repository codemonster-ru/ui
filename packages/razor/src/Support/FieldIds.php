<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Support;

/**
 * Generated ids for field relationships.
 *
 * Vue's useId produces `v-0`, `v-1`, ... per application; this produces `r-0`,
 * `r-1`, ... per request. The literal values were never going to match across
 * platforms and are not compared: the parity harness rewrites every id to its
 * document position and compares the relationships those positions form, so a
 * label pointing at the wrong control fails while a different token does not.
 *
 * What does have to hold is uniqueness. Two fields sharing a description id
 * would cross-wire their descriptions, and that is a real defect on either
 * platform, so the counter is monotonic for the life of the request.
 *
 * @internal
 */
final class FieldIds
{
    private static int $sequence = 0;

    public static function next(string $prefix): string
    {
        return $prefix . '-r-' . self::$sequence++;
    }

    /** Test seam: makes a rendered document reproducible from a known point. */
    public static function reset(): void
    {
        self::$sequence = 0;
    }
}
