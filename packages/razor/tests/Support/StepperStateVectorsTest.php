<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\StepperState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfStepper.
 */
final class StepperStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/stepper/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRuleAndNothingThatHoldsState(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame([
            'formatStepperProgressFactor',
            'resolveStepperActiveValue',
            'resolveStepperClasses',
            'resolveStepperContentPosition',
            'resolveStepperFallbackValue',
            'resolveStepperRootStyle',
            'resolveStepperStepState',
        ], $rules);
        self::assertSame([], array_filter(
            (new \ReflectionClass(StepperState::class))->getMethods(),
            static fn (\ReflectionMethod $method): bool => preg_match('/next|previous|select|wrap|focus|listen|machine|controller/i', $method->getName()) === 1,
        ), 'StepperState grew a rule that holds or advances state or knows a key');
    }

    public function testTheFactorIsWrittenAsJavaScriptWritesIt(): void
    {
        self::assertSame('0.3333333333333333', StepperState::formatProgressFactor(1 / 3));
        self::assertNotSame((string) (1 / 3), StepperState::formatProgressFactor(1 / 3), 'the PHP default would be the wrong contract');
        self::assertSame('0.6666666666666666', StepperState::formatProgressFactor(2 / 3));
        self::assertSame('1', StepperState::formatProgressFactor(3 / 3));
        self::assertSame('0', StepperState::formatProgressFactor(0 / 3));
    }

    public function testTheFactorMirrorRefusesWhatAStepperCannotProduce(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        StepperState::formatProgressFactor(1.5);
    }

    public function testResolveContentPositionVectors(): void
    {
        foreach (self::$vectors['resolveStepperContentPosition'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::resolveContentPosition($vector['orientation'], $vector['contentPosition'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveClassesVectors(): void
    {
        foreach (self::$vectors['resolveStepperClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::resolveClasses($vector['orientation'], $vector['contentPosition'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveFallbackValueVectors(): void
    {
        foreach (self::$vectors['resolveStepperFallbackValue'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::resolveFallbackValue($vector['items']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveActiveValueVectors(): void
    {
        foreach (self::$vectors['resolveStepperActiveValue'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::resolveActiveValue($vector['modelValue'] ?? null, $vector['internalValue'] ?? null, $vector['items']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveStepStateVectors(): void
    {
        foreach (self::$vectors['resolveStepperStepState'] as $vector) {
            $states = array_map(
                static fn (array $item): string => StepperState::resolveStepState($vector['items'], $vector['activeValue'] ?? null, $item),
                $vector['items'],
            );
            self::assertSame($vector['expected'], $states, json_encode($vector, JSON_THROW_ON_ERROR));
        }
    }

    public function testFormatProgressFactorVectors(): void
    {
        foreach (self::$vectors['formatStepperProgressFactor'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::formatProgressFactor($vector['factor']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveRootStyleVectors(): void
    {
        foreach (self::$vectors['resolveStepperRootStyle'] as $vector) {
            self::assertSame(
                $vector['expected'],
                StepperState::resolveRootStyle($vector['items'], $vector['activeValue'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }
}
