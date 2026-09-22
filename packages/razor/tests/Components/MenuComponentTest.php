<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfMenu.
 *
 * The assertions mirror
 * packages/core/src/components/menu/VfMenu.characterization.spec.ts case for
 * case. The test that carries this half of the milestone is the one about the
 * consumer `role`: the Vue template binds attrs last, so `role="menu"` is
 * overridable, and this adapter reproduces that rather than protecting a role
 * the reference does not protect. The other is the absence test - no control,
 * no script, no marker, no tabindex, no menu-widget ARIA - because a menu
 * that grew any of those would be this adapter implementing the ARIA menu
 * pattern the reference never had.
 */
final class MenuComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-menu');
        self::assertNotNull($component, 'The vf-menu component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @return array<string, \Closure(): RenderedHtml> */
    private static function slot(string $html): array
    {
        return ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($html)];
    }

    public function testItRendersOneDivWithRoleMenuAndNothingElse(): void
    {
        self::assertSame('<div class="vf-menu" role="menu"></div>', $this->render());
    }

    public function testItPlacesConsumerContentDirectlyInTheRootWithNoWrapper(): void
    {
        self::assertSame(
            '<div class="vf-menu" role="menu"><span>Item</span></div>',
            $this->render([], self::slot('<span>Item</span>')),
        );
    }

    public function testItKeepsSeveralChildrenInOrder(): void
    {
        self::assertSame(
            '<div class="vf-menu" role="menu"><span>One</span><span>Two</span><span>Three</span></div>',
            $this->render([], self::slot('<span>One</span><span>Two</span><span>Three</span>')),
        );
    }

    public function testItHostsRawMenuitemChildrenWithoutTouchingThem(): void
    {
        // The shape the historical VfMenu.spec.ts used. The menu adds no
        // tabindex, no id, no data attribute and no aria-activedescendant.
        $children = '<button role="menuitem">Edit</button><button role="menuitem">Delete</button>';

        self::assertSame(
            '<div class="vf-menu" role="menu">' . $children . '</div>',
            $this->render([], self::slot($children)),
        );
    }

    public function testItForwardsIdDataAndAriaLabelToTheRoot(): void
    {
        self::assertSame(
            '<div class="vf-menu" role="menu" id="actions" data-testid="menu" aria-label="Actions"></div>',
            $this->render(['id' => 'actions', 'data-testid' => 'menu', 'aria-label' => 'Actions']),
        );
    }

    public function testItMergesAConsumerClassAfterTheBlockClass(): void
    {
        // The inverse of vf-menu-item, which merges the consumer's first.
        self::assertSame('<div class="vf-menu mine" role="menu"></div>', $this->render(['class' => 'mine']));
    }

    public function testItLetsAConsumerTabindexLandAndWritesNoneOfItsOwn(): void
    {
        self::assertSame('<div class="vf-menu" role="menu" tabindex="0"></div>', $this->render(['tabindex' => '0']));
        self::assertStringNotContainsString('tabindex', $this->render());
    }

    public function testAConsumerRoleOverridesRoleMenu(): void
    {
        // Load-bearing, and the exact inverse of vf-menu-item. The Vue
        // template binds attrs last, so the consumer's value wins and it stays
        // in the position the component wrote the attribute in.
        self::assertSame('<div class="vf-menu" role="list"></div>', $this->render(['role' => 'list']));
    }

    public function testItRendersTheWholeConsumerAttrSurfaceInOneShape(): void
    {
        self::assertSame(
            '<div class="vf-menu mine" role="list" id="m" tabindex="0">x</div>',
            $this->render(
                ['id' => 'm', 'class' => 'mine', 'role' => 'list', 'tabindex' => '0'],
                self::slot('x'),
            ),
        );
    }

    public function testItForwardsStyleAndTheAriaRelationshipAttributes(): void
    {
        $html = $this->render([
            'style' => 'min-width: 10rem;',
            'aria-labelledby' => 'trigger',
            'aria-describedby' => 'hint',
        ]);

        self::assertStringContainsString('style="min-width: 10rem;"', $html);
        self::assertStringContainsString('aria-labelledby="trigger"', $html);
        self::assertStringContainsString('aria-describedby="hint"', $html);
    }

    public function testItOwnsNoControlNoScriptAndNoMenuWidgetAria(): void
    {
        $html = $this->render([], self::slot('<button role="menuitem">Edit</button>'));

        // Everything focusable inside is the consumer's. The menu contributes
        // no button, no anchor, no script, no controller marker and none of
        // the ARIA a menu widget would need to be one.
        self::assertSame(1, substr_count($html, '<button'));
        self::assertStringNotContainsString('<script', $html);
        self::assertStringNotContainsString('data-vf-razor', $html);
        self::assertStringNotContainsString('aria-orientation', $html);
        self::assertStringNotContainsString('aria-activedescendant', $html);
    }

    public function testItEscapesAConsumerClassAndAttributeValues(): void
    {
        self::assertStringContainsString(
            'class="vf-menu &quot;evil&quot;"',
            $this->render(['class' => '"evil"']),
        );
    }
}
