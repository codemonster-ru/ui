<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\AlertState;
use Codemonster\VueForge\Razor\Support\PresentationState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfAlert.
 */
final class AlertStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/alert/state-vectors.json';
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

        self::assertSame(['resolveAlertClasses', 'resolveAlertIcon', 'resolveAlertRegions'], $rules);
    }

    public function testItSuppressesTheModifierAtPrimaryAndEmitsItAtNeutral(): void
    {
        // The mirror image of the badge and the tag.
        self::assertSame(['vf-alert'], AlertState::resolveClasses('primary'));
        self::assertSame(['vf-alert', 'vf-alert--neutral'], AlertState::resolveClasses('neutral'));
    }

    public function testItIsNotTheBadgeOrTagResolverUnderAnotherName(): void
    {
        foreach (['neutral', 'primary', 'success', 'info', 'warn', 'help', 'danger', 'contrast'] as $tone) {
            $alert = implode(' ', AlertState::resolveClasses($tone));

            self::assertStringNotContainsString('vf-badge', $alert);
            self::assertStringNotContainsString('vf-tag', $alert);
        }
        self::assertNotSame(
            count(PresentationState::resolveBadgeClasses('neutral')),
            count(AlertState::resolveClasses('neutral')),
        );
        self::assertNotSame(
            count(PresentationState::resolveTagClasses('primary')),
            count(AlertState::resolveClasses('primary')),
        );
    }

    public function testFourTonesShareOneGlyph(): void
    {
        foreach (['neutral', 'primary', 'info', 'contrast'] as $tone) {
            self::assertSame('info-circle', AlertState::resolveIcon($tone, null));
        }
    }

    public function testAnExplicitIconWinsIncludingTheEmptyString(): void
    {
        self::assertSame('user', AlertState::resolveIcon('danger', 'user'));
        self::assertSame('', AlertState::resolveIcon('danger', ''));
        self::assertSame('x-circle', AlertState::resolveIcon('danger', null));
    }

    public function testItDecidesNothingAboutARoleOrADismissControl(): void
    {
        // Four keys, none of them a role, a politeness or a dismiss flag.
        $regions = AlertState::resolveRegions(false, false, null, 'Saved', false, null);

        self::assertSame(['icon', 'iconGlyph', 'title', 'titleText'], array_keys($regions));
    }

    public function testAnEmptyStringTitleRendersNoParagraphButAnEmptyTitleSlotRendersAnEmptyOne(): void
    {
        self::assertFalse(AlertState::resolveRegions(false, false, null, '', false, null)['title']);
        self::assertSame(
            ['icon' => true, 'iconGlyph' => true, 'title' => true, 'titleText' => true],
            AlertState::resolveRegions(false, false, null, '', true, false),
        );
    }

    public function testBothFallbacksComeBackWhenTheirSlotRendersNothing(): void
    {
        self::assertTrue(AlertState::resolveRegions(false, true, false, null, false, null)['iconGlyph']);
        self::assertFalse(AlertState::resolveRegions(false, true, true, null, false, null)['iconGlyph']);
        self::assertTrue(AlertState::resolveRegions(false, false, null, 'Saved', true, false)['titleText']);
        self::assertFalse(AlertState::resolveRegions(false, false, null, 'Saved', true, true)['titleText']);
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveAlertClasses'] as $vector) {
            self::assertSame($vector['expected'], AlertState::resolveClasses($vector['tone']));
        }
    }

    public function testIconsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveAlertIcon'] as $vector) {
            self::assertSame(
                $vector['expected'],
                AlertState::resolveIcon($vector['tone'], $vector['icon']),
                sprintf('resolveAlertIcon(%s)', json_encode($vector)),
            );
        }
    }

    public function testRegionsMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveAlertRegions'] as $vector) {
            self::assertSame(
                $vector['expected'],
                AlertState::resolveRegions(
                    $vector['hideIcon'],
                    $vector['hasIconSlot'],
                    $vector['iconSlotContent'],
                    $vector['title'],
                    $vector['hasTitleSlot'],
                    $vector['titleSlotContent'],
                ),
                sprintf('resolveAlertRegions(%s)', json_encode($vector)),
            );
        }
    }
}
