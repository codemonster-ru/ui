<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\FieldsetState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfFieldset.
 */
final class FieldsetStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/fieldset/state-vectors.json';
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

        self::assertSame(
            ['isFieldsetInvalid', 'resolveFieldsetClasses', 'resolveFieldsetDescribedBy', 'resolveFieldsetPresence'],
            $rules,
        );
    }

    public function testZeroIsPresentAndTheEmptyStringIsNot(): void
    {
        // The one place PHP truthiness and the reference disagree.
        self::assertSame(
            ['label' => true, 'description' => true, 'error' => true],
            FieldsetState::resolvePresence('0', '0', '0', false, false, false),
        );
        self::assertSame(
            ['label' => false, 'description' => false, 'error' => false],
            FieldsetState::resolvePresence('', '', '', false, false, false),
        );
    }

    public function testPresenceVectors(): void
    {
        foreach (self::$vectors['resolveFieldsetPresence'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldsetState::resolvePresence(
                    $vector['label'],
                    $vector['description'],
                    $vector['error'],
                    $vector['hasLabelSlot'],
                    $vector['hasDescriptionSlot'],
                    $vector['hasErrorSlot'],
                ),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testInvalidVectors(): void
    {
        foreach (self::$vectors['isFieldsetInvalid'] as $vector) {
            self::assertSame($vector['expected'], FieldsetState::isInvalid($vector['invalid'], $vector['hasError']));
        }
    }

    public function testDescribedByVectors(): void
    {
        foreach (self::$vectors['resolveFieldsetDescribedBy'] as $vector) {
            self::assertSame(
                $vector['expected'],
                FieldsetState::describedBy(
                    $vector['descriptionId'],
                    $vector['errorId'],
                    $vector['hasDescription'],
                    $vector['hasError'],
                ),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testClassVectors(): void
    {
        foreach (self::$vectors['resolveFieldsetClasses'] as $vector) {
            self::assertSame($vector['expected'], FieldsetState::resolveClasses($vector['invalid']));
        }
    }
}
