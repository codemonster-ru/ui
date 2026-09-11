<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\AlertState;
use Codemonster\VueForge\Razor\Support\PresentationState;
use Codemonster\VueForge\Razor\Support\ProgressSpinnerState;
use Codemonster\VueForge\Razor\Support\SkeletonState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfProgressSpinner.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart.
 */
final class ProgressSpinnerStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/progress-spinner/state-vectors.json';
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
            ['resolveProgressSpinnerClasses', 'resolveProgressSpinnerSize', 'resolveProgressSpinnerStyle'],
            $rules,
        );
    }

    public function testTheModifierIsSuppressedAtPrimaryAndNowhereElse(): void
    {
        // The alert's convention, and the opposite of the badge's. A spinner
        // whose rule was borrowed from the badge would emit the wrong class at
        // exactly two tones.
        self::assertSame(['vf-progress-spinner'], ProgressSpinnerState::resolveClasses('primary'));
        self::assertSame(['vf-progress-spinner', 'vf-progress-spinner--neutral'], ProgressSpinnerState::resolveClasses('neutral'));
        self::assertSame(['vf-badge'], PresentationState::resolveBadgeClasses('neutral'));
        self::assertSame(['vf-alert', 'vf-alert--danger'], AlertState::resolveClasses('danger'));
    }

    public function testItIsNotAnotherStateClassInDisguise(): void
    {
        // Restated, not shared: the class extends nothing and the tone rule
        // reads no other class. A spinner state that started delegating to the
        // alert's or the badge's would change for whichever changed first.
        $reflection = new \ReflectionClass(ProgressSpinnerState::class);
        self::assertFalse($reflection->getParentClass());
        $source = (string) file_get_contents((string) $reflection->getFileName());
        self::assertStringNotContainsString('AlertState::', $source);
        self::assertStringNotContainsString('PresentationState::', $source);
        self::assertStringNotContainsString('SkeletonState::', $source);
    }

    public function testZeroIsALengthRatherThanAnAbsence(): void
    {
        self::assertSame('0px', ProgressSpinnerState::resolveSize(0));
        self::assertNull(ProgressSpinnerState::resolveSize(null));
    }

    public function testItAgreesWithTheSkeletonLengthRuleTodayAndIsItsOwnCopy(): void
    {
        foreach ([0, 40, 12.5, 40.0, '2em', '', null] as $value) {
            self::assertSame(SkeletonState::resolveLength($value), ProgressSpinnerState::resolveSize($value));
        }
    }

    public function testAnEmptySizeIsKeptAsAnEmptyDeclaration(): void
    {
        // The rule keeps it; the component decides. See ProgressSpinnerComponent.
        self::assertSame([['--vf-progress-spinner-size', '']], ProgressSpinnerState::resolveStyle(''));
        self::assertSame([], ProgressSpinnerState::resolveStyle(null));
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressSpinnerClasses'] as $vector) {
            self::assertSame($vector['expected'], ProgressSpinnerState::resolveClasses($vector['tone']));
        }
    }

    public function testSizeMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressSpinnerSize'] as $vector) {
            self::assertSame($vector['expected'], ProgressSpinnerState::resolveSize($vector['value']));
        }
    }

    public function testStyleMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressSpinnerStyle'] as $vector) {
            self::assertSame($vector['expected'], ProgressSpinnerState::resolveStyle($vector['size']));
        }
    }
}
