<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\DropdownState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfDropdown.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * none of the browser rules - a `resolveMenuNavigation` or a
 * `resolveArrowOffset` appearing here would be a server pretending to hold a
 * key, a focused element or floater.js's output.
 */
final class DropdownStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/dropdown/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame([
            'resolveDropdownArrowClasses',
            'resolveDropdownMenuClasses',
            'resolveDropdownOpen',
            'resolveDropdownTeleport',
            'resolveDropdownTriggerState',
        ], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(DropdownState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame([
            'resolveArrowClasses',
            'resolveMenuClasses',
            'resolveOpen',
            'resolveTeleport',
            'resolveTriggerState',
        ], $methods);
    }

    public function testResolveOpen(): void
    {
        foreach (self::$vectors['resolveDropdownOpen'] as $vector) {
            self::assertSame($vector['expected'], DropdownState::resolveOpen($vector['disabled'], $vector['open']));
        }
    }

    public function testResolveTriggerState(): void
    {
        foreach (self::$vectors['resolveDropdownTriggerState'] as $vector) {
            // The JSON omits an absent aria-disabled; the mirror spells it null.
            $expected = ['ariaDisabled' => $vector['expected']['ariaDisabled'] ?? null] + $vector['expected'];
            ksort($expected);
            $actual = DropdownState::resolveTriggerState($vector['disabled'], $vector['open']);
            ksort($actual);

            self::assertSame($expected, $actual);
        }
    }

    public function testResolveMenuClasses(): void
    {
        foreach (self::$vectors['resolveDropdownMenuClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                DropdownState::resolveMenuClasses($vector['variant'], $vector['placement']),
            );
        }
    }

    public function testResolveArrowClasses(): void
    {
        foreach (self::$vectors['resolveDropdownArrowClasses'] as $vector) {
            self::assertSame($vector['expected'], DropdownState::resolveArrowClasses($vector['placement']));
        }
    }

    public function testResolveTeleport(): void
    {
        $ran = 0;

        foreach (self::$vectors['resolveDropdownTeleport'] as $vector) {
            if (($vector['$vueOnly'] ?? false) === true) {
                continue;
            }

            self::assertSame(
                $vector['expected'],
                DropdownState::resolveTeleport($vector['teleportTo'] ?? null, $vector['disableTeleport']),
            );
            $ran++;
        }

        // Exactly one vector is Vue's own spelling of in-place rendering.
        self::assertSame(count(self::$vectors['resolveDropdownTeleport']) - 1, $ran);
    }
}
