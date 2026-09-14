<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\ProgressBarState;
use Codemonster\VueForge\Razor\Support\ProgressSpinnerState;
use Codemonster\VueForge\Razor\Support\SkeletonState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfProgressBar.
 *
 * Reads the same vector file the shared-core TypeScript suite reads, so the two
 * implementations cannot drift apart. NAN and INF cannot travel through JSON
 * and are pinned here directly.
 */
final class ProgressBarStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/progress-bar/state-vectors.json';
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
            [
                'formatProgressBarNumber',
                'resolveProgressBarClasses',
                'resolveProgressBarHeight',
                'resolveProgressBarMax',
                'resolveProgressBarPercentage',
                'resolveProgressBarRootStyle',
                'resolveProgressBarValue',
                'resolveProgressBarValueLabel',
                'resolveProgressBarValueSemantics',
                'resolveProgressBarValueStyle',
            ],
            $rules,
        );
    }

    public function testItIsNotTheSpinnerStateInDisguise(): void
    {
        // Restated, not shared: the class extends nothing and reads no other
        // state class. A bar state that started delegating to the spinner's
        // would change for whichever changed first.
        $reflection = new \ReflectionClass(ProgressBarState::class);
        self::assertFalse($reflection->getParentClass());
        $source = (string) file_get_contents((string) $reflection->getFileName());
        self::assertStringNotContainsString('ProgressSpinnerState::', $source);
        self::assertStringNotContainsString('SkeletonState::', $source);
        self::assertStringNotContainsString('AlertState::', $source);
        self::assertStringNotContainsString('PresentationState::', $source);
    }

    public function testTheMaximumFallsBackForTheValuesJsonCannotCarry(): void
    {
        self::assertSame(100, ProgressBarState::resolveMax(NAN));
        self::assertSame(100, ProgressBarState::resolveMax(INF));
        self::assertSame(100, ProgressBarState::resolveMax(-INF));
        self::assertSame(100, ProgressBarState::resolveMax(null));
    }

    public function testTheValueFallsBackForTheValuesJsonCannotCarry(): void
    {
        self::assertSame(0, ProgressBarState::resolveValue(NAN, 100));
        self::assertSame(0, ProgressBarState::resolveValue(INF, 100));
        self::assertSame(0, ProgressBarState::resolveValue(-INF, 100));
        self::assertSame(0, ProgressBarState::resolveValue(null, 100));
    }

    public function testItNeverDividesByZeroBecauseTheMaximumIsResolvedFirst(): void
    {
        $max = ProgressBarState::resolveMax(0);

        self::assertSame('5%', ProgressBarState::resolvePercentage(ProgressBarState::resolveValue(5, $max), $max));
    }

    public function testTheLabelRoundsAsMathRoundDoes(): void
    {
        // PHP's round() agrees with Math.round on every non-negative double
        // that matters here, the two hard ones included: 12.5 rounds up, and
        // 0.49999999999999994 - which floor(x + 0.5) would carry to 1 -
        // rounds down.
        self::assertSame('13%', ProgressBarState::resolveValueLabel(1, 8));
        self::assertSame('14%', ProgressBarState::resolveValueLabel(0.145, 1));
        self::assertSame('0%', ProgressBarState::resolveValueLabel(0.0049999999999999994, 1));
    }

    public function testTheNumberFormatterIsJavaScriptsNotPhps(): void
    {
        // The three places PHP's (string) cast would differ, each of which
        // reaches an attribute the harness compares.
        self::assertSame('58.333333333333336', ProgressBarState::formatNumber(7 / 12 * 100));
        self::assertSame('58.333333333333', (string) (7 / 12 * 100));
        self::assertSame('1e-7', ProgressBarState::formatNumber(1e-7));
        self::assertSame('1.0E-7', (string) 1e-7);
        self::assertSame('100', ProgressBarState::formatNumber(100.0));
        // The other edges of ECMAScript's layout, beyond what a bar produces.
        self::assertSame('0.30000000000000004', ProgressBarState::formatNumber(0.1 + 0.2));
        self::assertSame('123456789012345680000', ProgressBarState::formatNumber(123456789012345680000.0));
        self::assertSame('1.5e+21', ProgressBarState::formatNumber(1.5e21));
        self::assertSame('5e-324', ProgressBarState::formatNumber(5e-324));
        self::assertSame('-2.5', ProgressBarState::formatNumber(-2.5));
    }

    public function testItIsNotTheSpinnerClassRuleUnderAnotherBlockName(): void
    {
        self::assertSame(['vf-progress-spinner', 'vf-progress-spinner--danger'], ProgressSpinnerState::resolveClasses('danger'));
        self::assertSame(
            [
                'vf-progress-bar',
                'vf-progress-bar--danger',
                'vf-progress-bar--striped',
                'vf-progress-bar--animated',
                'vf-progress-bar--indeterminate',
            ],
            ProgressBarState::resolveClasses('danger', true, true, true),
        );
    }

    public function testItAgreesWithTheSpinnerSizeAndSkeletonLengthRulesTodayAndIsItsOwnCopy(): void
    {
        foreach ([0, 12, 6.5, 12.0, '1rem', '', null] as $value) {
            self::assertSame(ProgressSpinnerState::resolveSize($value), ProgressBarState::resolveHeight($value));
            self::assertSame(SkeletonState::resolveLength($value), ProgressBarState::resolveHeight($value));
        }
    }

    public function testAnEmptyHeightIsKeptAsAnEmptyDeclaration(): void
    {
        self::assertSame([['--vf-progress-bar-height', '']], ProgressBarState::resolveRootStyle(''));
        self::assertSame([], ProgressBarState::resolveRootStyle(null));
    }

    public function testFormatNumberMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['formatProgressBarNumber'] as $vector) {
            self::assertSame($vector['expected'], ProgressBarState::formatNumber($vector['value']), json_encode($vector));
        }
    }

    public function testMaxMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarMax'] as $vector) {
            self::assertEquals($vector['expected'], ProgressBarState::resolveMax($vector['max']), json_encode($vector));
        }
    }

    public function testValueMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarValue'] as $vector) {
            self::assertEquals(
                $vector['expected'],
                ProgressBarState::resolveValue($vector['value'], $vector['max']),
                json_encode($vector),
            );
        }
    }

    public function testPercentageMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarPercentage'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ProgressBarState::resolvePercentage($vector['value'], $vector['max']),
                json_encode($vector),
            );
        }
    }

    public function testValueLabelMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarValueLabel'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ProgressBarState::resolveValueLabel($vector['value'], $vector['max']),
                json_encode($vector),
            );
        }
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ProgressBarState::resolveClasses(
                    $vector['tone'],
                    $vector['striped'],
                    $vector['animated'],
                    $vector['indeterminate'],
                ),
                json_encode($vector),
            );
        }
    }

    public function testHeightMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarHeight'] as $vector) {
            self::assertSame($vector['expected'], ProgressBarState::resolveHeight($vector['value']), json_encode($vector));
        }
    }

    public function testRootStyleMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarRootStyle'] as $vector) {
            self::assertSame($vector['expected'], ProgressBarState::resolveRootStyle($vector['height']), json_encode($vector));
        }
    }

    public function testValueStyleMatchesTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarValueStyle'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ProgressBarState::resolveValueStyle($vector['indeterminate'], $vector['percentage']),
                json_encode($vector),
            );
        }
    }

    public function testValueSemanticsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveProgressBarValueSemantics'] as $vector) {
            self::assertSame(
                $vector['expected'],
                ProgressBarState::resolveValueSemantics($vector['indeterminate'], $vector['value'], $vector['max']),
                json_encode($vector),
            );
        }
    }
}
