<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\SkeletonGateState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfSkeletonGate.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart.
 */
final class SkeletonGateStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/skeleton-gate/state-vectors.json';
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
            'resolveSkeletonGateContentClasses',
            'resolveSkeletonGateLength',
            'resolveSkeletonGateMinHeight',
            'resolveSkeletonGateOverlayStyle',
            'resolveSkeletonGateRootStyle',
        ], $rules);
    }

    public function testAZeroReserveIsAReservationAndAnEmptyReserveIsNotAnAbsence(): void
    {
        self::assertSame('0px', SkeletonGateState::resolveMinHeight(false, 50, 0, false, null));
        self::assertSame('', SkeletonGateState::resolveMinHeight(false, 50, '', false, null));
    }

    public function testTheMeasuredHeightAppliesOnlyWhileTheGateIsNotReady(): void
    {
        self::assertSame('84px', SkeletonGateState::resolveMinHeight(false, null, null, true, 84));
        self::assertNull(SkeletonGateState::resolveMinHeight(true, null, null, true, 84));
    }

    public function testTheFadeDurationIsAlwaysWritten(): void
    {
        self::assertSame(
            [['--vf-skeleton-gate-fade-duration', '220ms']],
            SkeletonGateState::resolveRootStyle(null, null, 220),
        );
    }

    public function testAnEmptyValueSurvivesTheRule(): void
    {
        // Deliberately unlike SkeletonState::resolveStyle, which drops it. The
        // gate's reference builds a plain object and lets the serialiser
        // decide; SkeletonGateComponent is where this adapter decides.
        self::assertSame([
            ['min-height', ''],
            ['border-radius', ''],
            ['--vf-skeleton-gate-fade-duration', '220ms'],
        ], SkeletonGateState::resolveRootStyle('', '', 220));
    }

    public function testTheLengthVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonGateLength'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SkeletonGateState::resolveLength($vector['value']),
                'resolveSkeletonGateLength(' . json_encode($vector['value']) . ')',
            );
        }
    }

    public function testTheMinHeightVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonGateMinHeight'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SkeletonGateState::resolveMinHeight(
                    $vector['ready'],
                    $vector['minHeight'],
                    $vector['reserveHeight'],
                    $vector['preserveLastHeight'],
                    $vector['measuredContentHeight'],
                ),
                'resolveSkeletonGateMinHeight(' . json_encode($vector) . ')',
            );
        }
    }

    public function testTheRootStyleVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonGateRootStyle'] as $vector) {
            self::assertSame(
                array_map(static fn (array $pair): array => [$pair[0], $pair[1]], $vector['expected']),
                SkeletonGateState::resolveRootStyle($vector['minHeight'], $vector['radius'], $vector['fadeDuration']),
                'resolveSkeletonGateRootStyle(' . json_encode($vector) . ')',
            );
        }
    }

    public function testTheOverlayStyleVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonGateOverlayStyle'] as $vector) {
            self::assertSame(
                array_map(static fn (array $pair): array => [$pair[0], $pair[1]], $vector['expected']),
                SkeletonGateState::resolveOverlayStyle($vector['radius']),
                'resolveSkeletonGateOverlayStyle(' . json_encode($vector['radius']) . ')',
            );
        }
    }

    public function testTheContentClassVectors(): void
    {
        foreach (self::$vectors['resolveSkeletonGateContentClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                SkeletonGateState::resolveContentClasses($vector['ready'], $vector['normalizeContentSpacing']),
                'resolveSkeletonGateContentClasses(' . json_encode($vector) . ')',
            );
        }
    }
}
