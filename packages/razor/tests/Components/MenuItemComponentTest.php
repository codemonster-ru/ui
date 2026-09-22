<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfMenuItem.
 *
 * The assertions mirror
 * packages/core/src/components/menu/VfMenuItem.characterization.spec.ts case
 * for case. The tests that carry the milestone are the ones about the three
 * neighbours this component must not be made to agree with: `href=''` renders
 * the button where VfLink keeps an empty href on an anchor; `target="_blank"`
 * without a `rel` writes no rel where VfLink and VfBreadcrumbs derive one; and
 * the consumer `role` loses here where it wins on vf-menu.
 *
 * No output of this component ever carries a `to`, a router class, a
 * controller marker, a script or a synthetic stand-in for the `select` emit.
 */
final class MenuItemComponentTest extends TestCase
{
    private const LABEL_EDIT = '<span class="vf-menu__item-label">Edit</span>';
    private const LABEL_GO = '<span class="vf-menu__item-label">Go</span>';
    private const ICON_SIZE = 'var(--vf-icon-current-size, var(--vf-icon-size-md))';

    /** @param array<string, mixed> $props */
    private function render(array $props): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-menu-item');
        self::assertNotNull($component, 'The vf-menu-item component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    private static function icon(string $name): string
    {
        return IconRenderer::render($name, self::ICON_SIZE, true, 'vf-menu__item-icon');
    }

    // ------------------------------------------------------------- branches

    public function testItRendersAButtonWhenThereIsNoHref(): void
    {
        self::assertSame(
            '<button class="vf-menu__item" type="button" role="menuitem">' . self::LABEL_EDIT . '</button>',
            $this->render(['label' => 'Edit']),
        );
    }

    public function testItRendersAnAnchorWhenThereIsAnHref(): void
    {
        self::assertSame(
            '<a class="vf-menu__item" href="/a" role="menuitem">' . self::LABEL_GO . '</a>',
            $this->render(['label' => 'Go', 'href' => '/a']),
        );
    }

    public function testAnEmptyHrefRendersTheButtonBranch(): void
    {
        // Load-bearing. VfLink renders `<a href="">` for the same input; the
        // branch test here is truthiness and the two do not agree.
        self::assertSame(
            '<button class="vf-menu__item" type="button" role="menuitem">' . self::LABEL_GO . '</button>',
            $this->render(['label' => 'Go', 'href' => '']),
        );
    }

    public function testBothBranchesWriteRoleMenuitemUnconditionally(): void
    {
        foreach (
            [
                ['label' => 'A'],
                ['label' => 'A', 'disabled' => true],
                ['label' => 'A', 'href' => '/a'],
                ['label' => 'A', 'href' => '/a', 'disabled' => true],
            ] as $props
        ) {
            self::assertStringContainsString('role="menuitem"', $this->render($props));
        }
    }

    public function testOnlyTheButtonBranchWritesTypeButton(): void
    {
        self::assertStringContainsString('type="button"', $this->render(['label' => 'A']));
        self::assertStringContainsString('type="button"', $this->render(['label' => 'A', 'disabled' => true]));
        self::assertStringNotContainsString('type=', $this->render(['label' => 'A', 'href' => '/a']));
        self::assertStringNotContainsString(
            'type=',
            $this->render(['label' => 'A', 'href' => '/a', 'disabled' => true]),
        );
    }

    // -------------------------------------------------------------- classes

    public function testItEmitsOnlyTheBlockClassForTheDefaults(): void
    {
        self::assertStringContainsString('class="vf-menu__item"', $this->render(['label' => 'A']));
    }

    public function testItOrdersTheActiveModifierBeforeTheDangerOne(): void
    {
        self::assertStringContainsString(
            'class="vf-menu__item vf-menu__item--active vf-menu__item--danger"',
            $this->render(['label' => 'A', 'active' => true, 'tone' => 'danger']),
        );
    }

    public function testADisabledItemHasNoDisabledModifierOnEitherBranch(): void
    {
        self::assertStringContainsString('class="vf-menu__item"', $this->render(['label' => 'A', 'disabled' => true]));
        self::assertStringContainsString(
            'class="vf-menu__item"',
            $this->render(['label' => 'A', 'href' => '/a', 'disabled' => true]),
        );
    }

    public function testADisabledItemKeepsItsActiveAndDangerModifiers(): void
    {
        self::assertStringContainsString(
            'class="vf-menu__item vf-menu__item--active vf-menu__item--danger"',
            $this->render(['label' => 'A', 'disabled' => true, 'active' => true, 'tone' => 'danger']),
        );
    }

    public function testAConsumerClassIsMergedBeforeTheBlockClass(): void
    {
        // The inverse of vf-menu and vf-link, both of which put their own
        // classes first. The Vue component binds attrs first, so the
        // consumer's class is the earlier source.
        self::assertStringContainsString(
            'class="mine vf-menu__item vf-menu__item--active"',
            $this->render(['label' => 'A', 'class' => 'mine', 'active' => true]),
        );
    }

    // ----------------------------------------------------------- link branch

    public function testItWritesTargetAndRelAsGiven(): void
    {
        $html = $this->render(['label' => 'A', 'href' => '/a', 'target' => '_blank', 'rel' => 'nofollow']);

        self::assertStringContainsString('target="_blank"', $html);
        self::assertStringContainsString('rel="nofollow"', $html);
    }

    public function testItWritesNoRelForBlankWhenNoneWasGiven(): void
    {
        // The single most important assertion in this file. VfLink derives
        // `noopener noreferrer` here and VfBreadcrumbs reuses VfLink's rule;
        // calling LinkState::resolveRel in this component would write an
        // attribute the reference never writes.
        self::assertSame(
            '<a class="vf-menu__item" href="/a" target="_blank" role="menuitem">' . self::LABEL_GO . '</a>',
            $this->render(['label' => 'Go', 'href' => '/a', 'target' => '_blank']),
        );
    }

    public function testItDoesNotMergeAnExplicitRelWithADerivedOne(): void
    {
        $html = $this->render(['label' => 'A', 'href' => '/a', 'target' => '_blank', 'rel' => 'nofollow']);

        self::assertStringContainsString('rel="nofollow"', $html);
        self::assertStringNotContainsString('noopener', $html);
    }

    public function testTargetAndRelDoNotReachTheButtonBranch(): void
    {
        $html = $this->render(['label' => 'A', 'target' => '_blank', 'rel' => 'nofollow']);

        self::assertStringStartsWith('<button', $html);
        self::assertStringNotContainsString('target=', $html);
        self::assertStringNotContainsString('rel=', $html);
    }

    // -------------------------------------------------------------- disabled

    public function testADisabledButtonTakesTheNativeAttributeAndAriaDisabled(): void
    {
        self::assertSame(
            '<button class="vf-menu__item" type="button" disabled aria-disabled="true" role="menuitem">'
                . self::LABEL_EDIT . '</button>',
            $this->render(['label' => 'Edit', 'disabled' => true]),
        );
    }

    public function testADisabledAnchorDropsItsHrefButKeepsTargetAndRel(): void
    {
        // The whole quirk in one assertion: no href, no `disabled` attribute,
        // an aria-disabled, a tabindex of -1, and target and rel still written
        // because only the href is guarded.
        self::assertSame(
            '<a class="vf-menu__item" target="_blank" rel="nofollow" aria-disabled="true" tabindex="-1"'
                . ' role="menuitem">' . self::LABEL_GO . '</a>',
            $this->render([
                'label' => 'Go',
                'href' => '/a',
                'disabled' => true,
                'target' => '_blank',
                'rel' => 'nofollow',
            ]),
        );
    }

    public function testAnEnabledItemOfEitherBranchHasNoAriaDisabledAndNoTabindex(): void
    {
        foreach ([['label' => 'A'], ['label' => 'A', 'href' => '/a']] as $props) {
            $html = $this->render($props);

            self::assertStringNotContainsString('aria-disabled', $html);
            self::assertStringNotContainsString('tabindex', $html);
            self::assertStringNotContainsString('disabled', $html);
        }
    }

    public function testADisabledButtonTakesNoTabindex(): void
    {
        self::assertStringNotContainsString('tabindex', $this->render(['label' => 'A', 'disabled' => true]));
    }

    // ------------------------------------------------------------------ icon

    public function testItRendersNoIconNodeWhenNoneIsGiven(): void
    {
        self::assertStringNotContainsString('vf-icon', $this->render(['label' => 'A']));
    }

    public function testItRendersTheIconBeforeTheLabelWithTheClassOnTheInnerSvg(): void
    {
        // The extra class and aria-hidden belong on the svg, not on the
        // wrapper span, because that is where the Vue icon component spreads
        // its attrs. Moving them to the wrapper is the tidying a migration
        // would do by accident.
        self::assertSame(
            '<button class="vf-menu__item" type="button" role="menuitem">'
                . self::icon('pencil') . self::LABEL_EDIT . '</button>',
            $this->render(['label' => 'Edit', 'icon' => 'pencil']),
        );

        $html = $this->render(['label' => 'Edit', 'icon' => 'pencil']);
        self::assertStringContainsString('<span class="vf-icon-wrapper"', $html);
        self::assertStringContainsString('class="vf-menu__item-icon vf-icon', $html);
        self::assertStringNotContainsString('<span class="vf-menu__item-icon', $html);
    }

    public function testItRendersTheIconOnTheAnchorBranchTheSameWay(): void
    {
        self::assertSame(
            '<a class="vf-menu__item" href="/a" role="menuitem">' . self::icon('pencil') . self::LABEL_GO . '</a>',
            $this->render(['label' => 'Go', 'href' => '/a', 'icon' => 'pencil']),
        );
    }

    public function testAnUnknownIconNameFallsBackToTheMoonGlyphRatherThanThrowing(): void
    {
        // The public prop is `IconName | string`, so an arbitrary string is
        // part of the contract and the Vue icon component answers one with the
        // moon glyph. IconRenderer throws, which is why the resolution runs
        // before it - for this component only.
        self::assertSame(
            '<button class="vf-menu__item" type="button" role="menuitem">'
                . self::icon('moon') . self::LABEL_EDIT . '</button>',
            $this->render(['label' => 'Edit', 'icon' => 'no-such-glyph']),
        );
    }

    public function testACamelCaseIconNameResolvesToTheSameGlyphAsItsKebabSpelling(): void
    {
        self::assertSame(
            $this->render(['label' => 'A', 'icon' => 'chevron-right']),
            $this->render(['label' => 'A', 'icon' => 'chevronRight']),
        );
    }

    // ----------------------------------------------------------------- attrs

    public function testItForwardsIdDataStyleAndAriaLabelToTheControl(): void
    {
        $html = $this->render([
            'label' => 'A',
            'id' => 'edit',
            'data-testid' => 'item',
            'aria-label' => 'Edit item',
            'style' => 'color: red;',
        ]);

        self::assertStringContainsString('id="edit"', $html);
        self::assertStringContainsString('data-testid="item"', $html);
        self::assertStringContainsString('aria-label="Edit item"', $html);
        self::assertStringContainsString('style="color: red;"', $html);
    }

    public function testAConsumerRoleDoesNotOverrideRoleMenuitemOnEitherBranch(): void
    {
        // Load-bearing, and the exact inverse of vf-menu.
        self::assertStringContainsString('role="menuitem"', $this->render(['label' => 'A', 'role' => 'option']));
        self::assertStringNotContainsString('role="option"', $this->render(['label' => 'A', 'role' => 'option']));
        self::assertStringContainsString(
            'role="menuitem"',
            $this->render(['label' => 'A', 'href' => '/a', 'role' => 'option']),
        );
    }

    public function testAConsumerTabindexSurvivesOnTheButtonBranchAndIsDroppedOnAnEnabledAnchor(): void
    {
        // The two branches genuinely differ: the button binds no tabindex, so
        // the consumer's value lands; the anchor binds undefined over it when
        // enabled, which removes it.
        self::assertStringContainsString('tabindex="3"', $this->render(['label' => 'A', 'tabindex' => '3']));
        self::assertStringNotContainsString(
            'tabindex',
            $this->render(['label' => 'A', 'href' => '/a', 'tabindex' => '3']),
        );
        self::assertStringContainsString(
            'tabindex="-1"',
            $this->render(['label' => 'A', 'href' => '/a', 'disabled' => true, 'tabindex' => '3']),
        );
    }

    // ------------------------------------------------------------- absences

    public function testNoOutputCarriesARouterOrControllerSurface(): void
    {
        $html = $this->render(['label' => 'A', 'href' => '/a', 'icon' => 'pencil', 'active' => true]);

        self::assertStringNotContainsString('<script', $html);
        self::assertStringNotContainsString('data-vf-razor', $html);
        self::assertStringNotContainsString('router', $html);
        // `select` has no server analogue and gets no stand-in.
        self::assertStringNotContainsString('select', $html);
    }

    public function testActiveExposesNoAccessibilityState(): void
    {
        $html = $this->render(['label' => 'A', 'active' => true]);

        self::assertStringContainsString('vf-menu__item--active', $html);
        self::assertStringNotContainsString('aria-selected', $html);
        self::assertStringNotContainsString('aria-checked', $html);
        self::assertStringNotContainsString('aria-current', $html);
        self::assertStringNotContainsString('aria-pressed', $html);
    }

    public function testItEscapesTheLabelAndTheConsumerClass(): void
    {
        self::assertStringContainsString(
            '<span class="vf-menu__item-label">&lt;b&gt;x&lt;/b&gt;</span>',
            $this->render(['label' => '<b>x</b>']),
        );
        self::assertStringContainsString(
            'class="&quot;evil&quot; vf-menu__item"',
            $this->render(['label' => 'A', 'class' => '"evil"']),
        );
    }

    public function testItRefusesANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['label' => 'A', 'data-thing' => ['nope']]);
    }
}
