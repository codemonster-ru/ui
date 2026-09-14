<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\AccordionState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfAccordion.
 */
final class AccordionStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/accordion/state-vectors.json';
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

        self::assertSame(['resolveAccordionIconClasses', 'resolveAccordionOpen', 'resolveAccordionTransition'], $rules);
        self::assertSame([], array_filter(
            (new \ReflectionClass(AccordionState::class))->getMethods(),
            static fn (\ReflectionMethod $method): bool => preg_match('/toggle|next|listen|machine/i', $method->getName()) === 1,
        ), 'AccordionState grew a rule that holds or advances state');
    }

    public function testTheControlledPropWinsOverTheSeedInBothDirections(): void
    {
        self::assertFalse(AccordionState::resolveOpen(false, true));
        self::assertTrue(AccordionState::resolveOpen(true, false));
    }

    public function testNullIsAbsence(): void
    {
        self::assertTrue(AccordionState::resolveOpen(null, true));
        self::assertFalse(AccordionState::resolveOpen(null, null));
    }

    public function testResolveOpenVectors(): void
    {
        foreach (self::$vectors['resolveAccordionOpen'] as $vector) {
            self::assertSame(
                $vector['expected'],
                AccordionState::resolveOpen($vector['open'] ?? null, $vector['defaultOpen'] ?? null),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveIconClassesVectors(): void
    {
        foreach (self::$vectors['resolveAccordionIconClasses'] as $vector) {
            self::assertSame($vector['expected'], AccordionState::resolveIconClasses($vector['open']));
        }
    }

    public function testResolveTransitionVectors(): void
    {
        foreach (self::$vectors['resolveAccordionTransition'] as $vector) {
            self::assertSame($vector['expected'], AccordionState::resolveTransition());
        }
        self::assertStringNotContainsString('ms', AccordionState::resolveTransition());
    }
}
