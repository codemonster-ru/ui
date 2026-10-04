<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\TableState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfTable.
 */
final class TableStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/table/state-vectors.json';
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

        self::assertSame(['resolveTableClasses', 'resolveTableSections'], $rules);
    }

    public function testTheCaptionZeroIsACaption(): void
    {
        self::assertTrue(TableState::resolveSections('0', false, false, false, false)['caption']);
        self::assertFalse(TableState::resolveSections('', false, false, false, false)['caption']);
    }

    public function testClassVectors(): void
    {
        self::assertCount(16, self::$vectors['resolveTableClasses']);

        foreach (self::$vectors['resolveTableClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TableState::resolveClasses(
                    $vector['columnDividers'],
                    $vector['compact'],
                    $vector['striped'],
                    $vector['stickyHeader'],
                ),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testSectionVectors(): void
    {
        foreach (self::$vectors['resolveTableSections'] as $vector) {
            self::assertSame(
                $vector['expected'],
                TableState::resolveSections(
                    $vector['caption'],
                    $vector['hasCaptionSlot'],
                    $vector['hasHeaderSlot'],
                    $vector['hasDefaultSlot'],
                    $vector['hasFooterSlot'],
                ),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }
}
