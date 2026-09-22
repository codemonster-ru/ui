<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Support;

use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\Support\MenuItemState;
use PHPUnit\Framework\TestCase;

/**
 * The PHP half of the cross-language contract for VfMenuItem.
 */
final class MenuItemStateVectorsTest extends TestCase
{
    /** @var array<string, mixed> */
    private static array $vectors;

    public static function setUpBeforeClass(): void
    {
        $path = dirname(__DIR__, 3) . '/shared-core/src/menu/state-vectors.json';
        $contents = file_get_contents($path);
        self::assertIsString($contents, "Shared vectors are missing at [{$path}].");
        self::$vectors = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

    public function testTheVectorFileCoversEveryMirroredRuleAndNothingAboutRelOrSelect(): void
    {
        $rules = array_values(array_filter(
            array_keys(self::$vectors),
            static fn (string $key): bool => !str_starts_with($key, '$'),
        ));
        sort($rules);

        self::assertSame(['isMenuItemLink', 'resolveMenuItemClasses', 'resolveMenuItemIconName'], $rules);

        // And the mirror has no method named after a link relationship or an
        // event. A `resolveRel` here would be VfLink's derivation applied to a
        // component that has none, and a `resolveSelect` would be this adapter
        // inventing a server analogue for a Vue emit.
        $methods = array_map(
            static fn (\ReflectionMethod $method): string => $method->getName(),
            (new \ReflectionClass(MenuItemState::class))->getMethods(\ReflectionMethod::IS_PUBLIC),
        );
        sort($methods);
        self::assertSame(['isLink', 'resolveClasses', 'resolveIconName'], $methods);
    }

    public function testTheClassListEmitsNoModifierForTheDefaultsAndOrdersActiveBeforeTone(): void
    {
        self::assertSame(['vf-menu__item'], MenuItemState::resolveClasses(false, 'default'));
        self::assertSame(
            ['vf-menu__item', 'vf-menu__item--active', 'vf-menu__item--danger'],
            MenuItemState::resolveClasses(true, 'danger'),
        );
    }

    public function testTheClassListNeverCarriesADisabledModifier(): void
    {
        // The disabled look is `:is(:disabled, [aria-disabled='true'])` in CSS,
        // one rule covering both branches. There is no `--disabled` class to
        // emit, and emitting one would be a class no stylesheet selects.
        self::assertStringNotContainsString('disabled', implode(' ', MenuItemState::resolveClasses(false, 'default')));
        self::assertStringNotContainsString('disabled', implode(' ', MenuItemState::resolveClasses(true, 'danger')));
    }

    public function testTheLinkTestIsTruthinessRatherThanDefinedness(): void
    {
        // The VfLink boundary: VfLink renders `<a href="">`, this renders a
        // button, and the two are not made to agree.
        self::assertFalse(MenuItemState::isLink(''));
        self::assertFalse(MenuItemState::isLink(null));
        self::assertTrue(MenuItemState::isLink('/docs'));
    }

    public function testTheLinkTestTakesNoDisabledFlag(): void
    {
        // A disabled item with a destination is still an anchor; only its href
        // is dropped, and that decision belongs to the component.
        $parameters = (new \ReflectionMethod(MenuItemState::class, 'isLink'))->getParameters();

        self::assertCount(1, $parameters);
        self::assertSame('href', $parameters[0]->getName());
    }

    public function testEveryResolvedIconNameIsOneTheRegistryHolds(): void
    {
        self::assertTrue(IconRenderer::has(MenuItemState::FALLBACK_ICON));

        foreach (['pencil', 'chevronRight', 'no-such-glyph', '', 'MOON'] as $name) {
            self::assertTrue(IconRenderer::has(MenuItemState::resolveIconName($name)), $name);
        }
    }

    public function testEveryGlyphResolvesFromBothItsKebabAndCamelSpelling(): void
    {
        foreach (IconRenderer::available() as $kebab) {
            $camel = (string) preg_replace_callback(
                '/-([a-z0-9])/',
                static fn (array $matches): string => strtoupper($matches[1]),
                $kebab,
            );

            self::assertSame($kebab, MenuItemState::resolveIconName($kebab));
            self::assertSame($kebab, MenuItemState::resolveIconName($camel));
        }
    }

    public function testResolveClassesVectors(): void
    {
        foreach (self::$vectors['resolveMenuItemClasses'] as $vector) {
            self::assertSame(
                $vector['expected'],
                MenuItemState::resolveClasses($vector['active'], $vector['tone']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testIsLinkVectors(): void
    {
        foreach (self::$vectors['isMenuItemLink'] as $vector) {
            self::assertSame(
                $vector['expected'],
                MenuItemState::isLink($vector['href']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }

    public function testResolveIconNameVectors(): void
    {
        foreach (self::$vectors['resolveMenuItemIconName'] as $vector) {
            self::assertSame(
                $vector['expected'],
                MenuItemState::resolveIconName($vector['icon']),
                json_encode($vector, JSON_THROW_ON_ERROR),
            );
        }
    }
}
