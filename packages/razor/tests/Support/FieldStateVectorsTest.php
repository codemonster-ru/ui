<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\FieldState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations of these rules cannot drift apart. The file is a monorepo
 * test fixture, not a runtime dependency: nothing in src/ reads it.
 */
final class FieldStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/field/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRule(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame([
            'isFieldFloatingLabel',
            'isFieldInvalid',
            'resolveFieldClasses',
            'resolveFieldControlClasses',
            'resolveFieldDescribedBy',
        ], $rules);
    }

    public function testFloatingLabelMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['isFieldFloatingLabel'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldState::isFloatingLabel(
                    $vector['labelPlacement'],
                    $vector['hasLabel'],
                    $vector['controlSupportsFloating'],
                ),
                sprintf(
                    'isFloatingLabel(%s, %s, %s)',
                    $vector['labelPlacement'],
                    var_export($vector['hasLabel'], true),
                    var_export($vector['controlSupportsFloating'], true),
                ),
            );
        }
    }

    public function testInvalidMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['isFieldInvalid'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldState::isInvalid($vector['invalid'], $vector['hasError']),
            );
        }
    }

    public function testRootClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveFieldClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldState::resolveClasses($vector['invalid'], $vector['floating'], $vector['floatingVariant']),
                sprintf('resolveClasses(%s)', json_encode($vector)),
            );
        }
    }

    public function testControlClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveFieldControlClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldState::resolveControlClasses($vector['floating'], $vector['filled']),
            );
        }
    }

    public function testDescribedByMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveFieldDescribedBy'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldState::resolveDescribedBy(
                    $vector['descriptionId'],
                    $vector['errorId'],
                    $vector['hasDescription'],
                    $vector['hasError'],
                ),
            );
        }
    }
}
