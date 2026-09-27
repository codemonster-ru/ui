<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\PopoverState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfPopover.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * none of the browser rules.
 */
final class PopoverStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/popover/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame([
            'resolvePopoverArrowClasses',
            'resolvePopoverContentClasses',
            'resolvePopoverTeleport',
            'resolvePopoverTriggerState',
        ], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(PopoverState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame([
            'resolveArrowClasses',
            'resolveContentClasses',
            'resolveTeleport',
            'resolveTriggerState',
        ], $methods);
    }

    public function testResolveTriggerState(): void
    {
        foreach (self::$vectors['resolvePopoverTriggerState'] as $vector) {
            self::assertSame($vector['expected'], PopoverState::resolveTriggerState($vector['open']));
        }
    }

    public function testResolveContentClasses(): void
    {
        foreach (self::$vectors['resolvePopoverContentClasses'] as $vector) {
            self::assertSame($vector['expected'], PopoverState::resolveContentClasses($vector['placement']));
        }
    }

    public function testResolveArrowClasses(): void
    {
        foreach (self::$vectors['resolvePopoverArrowClasses'] as $vector) {
            self::assertSame($vector['expected'], PopoverState::resolveArrowClasses($vector['placement']));
        }
    }

    public function testResolveTeleport(): void
    {
        $ran = 0;

        foreach (self::$vectors['resolvePopoverTeleport'] as $vector) {
            if (($vector['$vueOnly'] ?? false) === true) {
                continue;
            }

            self::assertSame(
                $vector['expected'],
                PopoverState::resolveTeleport($vector['teleportTo'] ?? null, $vector['disableTeleport']),
            );
            $ran++;
        }

        // Exactly one vector is Vue's own spelling of in-place rendering.
        self::assertSame(count(self::$vectors['resolvePopoverTeleport']) - 1, $ran);
    }
}
