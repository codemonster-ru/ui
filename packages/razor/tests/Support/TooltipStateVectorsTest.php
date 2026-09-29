<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\TooltipState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfTooltip.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * none of the browser rules.
 */
final class TooltipStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/tooltip/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame(['resolveTooltipHasContent', 'resolveTooltipTeleport'], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(TooltipState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame(['resolveHasContent', 'resolveTeleport'], $methods);
    }

    public function testTheDefaultOpenDelayIsTheSharedConstant(): void
    {
        self::assertSame(self::$vectors['constants']['TOOLTIP_OPEN_DELAY'], TooltipState::OPEN_DELAY);
    }

    public function testResolveTeleport(): void
    {
        $ran = 0;

        foreach (self::$vectors['resolveTooltipTeleport'] as $vector) {
            if (($vector['$vueOnly'] ?? false) === true) {
                continue;
            }

            self::assertSame(
                $vector['expected'],
                TooltipState::resolveTeleport($vector['teleportTo'] ?? null, $vector['disableTeleport']),
            );
            $ran++;
        }

        // Exactly two vectors are Vue's own spellings: null for in place, true for body.
        self::assertSame(count(self::$vectors['resolveTooltipTeleport']) - 2, $ran);
    }

    public function testResolveHasContent(): void
    {
        foreach (self::$vectors['resolveTooltipHasContent'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TooltipState::resolveHasContent($vector['text'] ?? null, $vector['hasContentSlot']),
            );
        }
    }
}
