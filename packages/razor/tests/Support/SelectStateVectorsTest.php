<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\SelectState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfSelect.
 *
 * Only the server sections: the vector file names them in `$serverRules`, and
 * this test asserts that the mirror has a method for exactly those and for
 * none of the browser rules - a `resolveMenuNavigation` or a `resolveScrollTop`
 * appearing here would be a server pretending to hold a key, a focused option
 * or a measurement.
 */
final class SelectStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/select/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileNamesTheServerSubsetAndTheMirrorHoldsExactlyThat(): void
    {
        $serverRules = self::$vectors['$serverRules'];
        sort($serverRules);
        self::assertSame([
            'resolveSelectDisplayLabel',
            'resolveSelectFieldFilled',
            'resolveSelectForwardsAttribute',
            'resolveSelectHasClearControl',
            'resolveSelectHasValue',
            'resolveSelectRendersHiddenInput',
            'resolveSelectSelectedOption',
            'resolveSelectTeleport',
            'resolveSelectTriggerClasses',
            'resolveSelectWrapperClasses',
        ], $serverRules);

        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(SelectState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame(
            array_map(static fn (string $rule): string => 'resolve' . substr($rule, strlen('resolveSelect')), $serverRules),
            $methods,
        );
    }

    public function testResolveHasValue(): void
    {
        foreach (self::$vectors['resolveSelectHasValue'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveHasValue($vector['modelValue']));
        }
    }

    public function testResolveSelectedOption(): void
    {
        foreach (self::$vectors['resolveSelectSelectedOption'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SelectState::resolveSelectedOption($vector['options'], $vector['modelValue']),
            );
        }
    }

    public function testResolveDisplayLabel(): void
    {
        foreach (self::$vectors['resolveSelectDisplayLabel'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SelectState::resolveDisplayLabel(
                    $vector['selectedLabel'] ?? null,
                    $vector['floating'],
                    $vector['placeholder'] ?? null,
                ),
            );
        }
    }

    public function testResolveHasClearControl(): void
    {
        foreach (self::$vectors['resolveSelectHasClearControl'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SelectState::resolveHasClearControl($vector['clearable'], $vector['hasValue'], $vector['disabled']),
            );
        }
    }

    public function testResolveRendersHiddenInput(): void
    {
        foreach (self::$vectors['resolveSelectRendersHiddenInput'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveRendersHiddenInput($vector['name'] ?? null));
        }
    }

    public function testResolveForwardsAttribute(): void
    {
        foreach (self::$vectors['resolveSelectForwardsAttribute'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveForwardsAttribute($vector['name']));
        }
    }

    public function testResolveFieldFilled(): void
    {
        foreach (self::$vectors['resolveSelectFieldFilled'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveFieldFilled($vector['hasValue'], $vector['open']));
        }
    }

    public function testResolveWrapperClasses(): void
    {
        foreach (self::$vectors['resolveSelectWrapperClasses'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveWrapperClasses($vector['state']));
        }
    }

    public function testResolveTriggerClasses(): void
    {
        foreach (self::$vectors['resolveSelectTriggerClasses'] as $vector) {
            self::assertSame($vector['expected'], SelectState::resolveTriggerClasses($vector['state']));
        }
    }

    public function testResolveTeleport(): void
    {
        $ran = 0;

        foreach (self::$vectors['resolveSelectTeleport'] as $vector) {
            if (($vector['$vueOnly'] ?? false) === true) {
                continue;
            }

            self::assertSame(
                $vector['expected'],
                SelectState::resolveTeleport($vector['teleportTo'] ?? null, $vector['disableTeleport']),
            );
            $ran++;
        }

        self::assertSame(count(self::$vectors['resolveSelectTeleport']) - 1, $ran);
    }
}
