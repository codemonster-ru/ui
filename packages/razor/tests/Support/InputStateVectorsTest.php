<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\InputState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations of these rules cannot drift apart. The file is a monorepo
 * test fixture, not a runtime dependency: nothing in src/ reads it.
 */
final class InputStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/input/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testFilledVectors(): void
    {
        foreach (self::$vectors['isInputFilled'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                InputState::isFilled($vector['value']),
                "isInputFilled vector #{$index}",
            );
        }
    }

    public function testPasswordRevealAvailabilityVectors(): void
    {
        foreach (self::$vectors['isPasswordRevealAvailable'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                InputState::isPasswordRevealAvailable($vector['passwordReveal'], $vector['type']),
                "isPasswordRevealAvailable vector #{$index}",
            );
        }
    }

    public function testTypeResolutionVectors(): void
    {
        foreach (self::$vectors['resolveInputType'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                InputState::resolveType(
                    $vector['type'],
                    $vector['passwordRevealAvailable'],
                    $vector['passwordRevealed'],
                ),
                "resolveInputType vector #{$index}",
            );
        }
    }

    public function testClearAvailabilityVectors(): void
    {
        foreach (self::$vectors['isClearActionAvailable'] as $index => $vector) {
            self::assertSame(
                $vector['expected'],
                InputState::isClearActionAvailable(
                    $vector['clearable'],
                    $vector['filled'],
                    $vector['disabled'],
                    $vector['readonly'],
                ),
                "isClearActionAvailable vector #{$index}",
            );
        }
    }

    public function testAdornmentStateVectors(): void
    {
        foreach (self::$vectors['resolveInputAdornmentState'] as $index => $vector) {
            $state = InputState::resolveAdornmentState(
                $vector['hasLeadingAdornment'],
                $vector['hasTrailingAdornment'],
                $vector['hasPasswordRevealControl'],
                $vector['hasClearControl'],
            );

            foreach ($vector['expected'] as $key => $expected) {
                self::assertSame($expected, $state[$key], "resolveInputAdornmentState vector #{$index} [{$key}]");
            }
        }
    }

    public function testEveryRuleTheAdapterRestatesHasVectors(): void
    {
        $covered = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($covered);

        self::assertSame([
            'isClearActionAvailable',
            'isInputFilled',
            'isPasswordRevealAvailable',
            'resolveInputAdornmentState',
            'resolveInputType',
        ], $covered);
    }
}
