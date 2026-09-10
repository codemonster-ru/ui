<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\AvatarState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfAvatar.
 *
 * The fallback chain is the contract this file exists to hold still: it is the
 * one rule in M16 that a port can get wrong while producing markup that looks
 * entirely reasonable.
 */
final class AvatarStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/avatar/state-vectors.json';
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

        self::assertSame(['resolveAvatarBranch', 'resolveAvatarClasses'], $rules);
    }

    public function testTheFallbackOrderIsImageThenLabelThenIconThenSlot(): void
    {
        // One chain rather than four claims: the contract is the ordering.
        self::assertSame('image', AvatarState::resolveBranch('/a.png', 'MC', 'user'));
        self::assertSame('label', AvatarState::resolveBranch(null, 'MC', 'user'));
        self::assertSame('icon', AvatarState::resolveBranch(null, null, 'user'));
        self::assertSame('slot', AvatarState::resolveBranch(null, null, null));
    }

    public function testAnEmptyStringDoesNotSelectItsBranch(): void
    {
        self::assertSame('label', AvatarState::resolveBranch('', 'MC', null));
        self::assertSame('slot', AvatarState::resolveBranch('', '', ''));
    }

    public function testClassesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveAvatarClasses'] as $vector) {
            self::assertSame($vector['expected'], AvatarState::resolveClasses($vector['size'], $vector['shape']));
        }
    }

    public function testBranchesMatchTheSharedVectors(): void
    {
        foreach (self::$vectors['resolveAvatarBranch'] as $vector) {
            self::assertSame(
                $vector['expected'],
                AvatarState::resolveBranch($vector['image'], $vector['label'], $vector['icon']),
                sprintf(
                    'resolveAvatarBranch(%s, %s, %s)',
                    json_encode($vector['image']),
                    json_encode($vector['label']),
                    json_encode($vector['icon']),
                ),
            );
        }
    }
}
