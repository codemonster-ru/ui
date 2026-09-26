<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\DropdownComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfDropdown.
 *
 * The server half of
 * packages/core/src/components/dropdown/VfDropdown.characterization.spec.ts:
 * the trigger wrapper's exact attributes, the dangling closed aria-controls,
 * the inert deferred menu, the unpositioned open menu in place, the disabled
 * state that wins over open, the root that takes every forwarded attribute,
 * and the adapter metadata the browser controller reads. What happens after a
 * gesture is the controller's and is measured in a real browser by the parity
 * profile and the Razor browser gate.
 */
final class DropdownComponentTest extends TestCase
{
    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-dropdown');
        self::assertNotNull($component, 'The vf-dropdown component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** @return array<string, \Closure(): RenderedHtml> */
    private static function slots(string $trigger = 'Actions', string $menu = '<button type="button" role="menuitem">Edit</button>'): array
    {
        return [
            'trigger' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($trigger),
            'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($menu),
        ];
    }

    private const CLOSED_META = ' data-vf-razor="dropdown" data-vf-razor-dropdown-placement="bottom-start"'
        . ' data-vf-razor-dropdown-variant="default" data-vf-razor-dropdown-close-on-select="true"'
        . ' data-vf-razor-dropdown-teleport="body"';

    public function testItRendersTheClosedTriggerWithADanglingAriaControlsAndTheMenuDeferred(): void
    {
        self::assertSame(
            '<div class="vf-dropdown"' . self::CLOSED_META . '>'
            . '<div id="vf-dropdown-trigger-r-1" class="vf-dropdown__trigger" aria-controls="vf-dropdown-menu-r-0"'
            . ' aria-expanded="false" aria-haspopup="menu" tabindex="0">Actions</div>'
            . '<template data-vf-razor-dropdown="menu"><button type="button" role="menuitem">Edit</button></template>'
            . '</div>',
            $this->render([], self::slots()),
        );
    }

    public function testTheClosedMenuDoesNotExistSoTheReferenceDangles(): void
    {
        $html = $this->render([], self::slots());

        self::assertStringNotContainsString('role="menu"', $html);
        self::assertStringNotContainsString('id="vf-dropdown-menu-r-0"', $html);
        self::assertStringContainsString('aria-controls="vf-dropdown-menu-r-0"', $html);
    }

    public function testItRendersAnInitiallyOpenMenuInPlaceUnpositionedAndWiredBothWays(): void
    {
        self::assertSame(
            '<div class="vf-dropdown"' . self::CLOSED_META . '>'
            . '<div id="vf-dropdown-trigger-r-1" class="vf-dropdown__trigger" aria-controls="vf-dropdown-menu-r-0"'
            . ' aria-expanded="true" aria-haspopup="menu" tabindex="0">Actions</div>'
            . '<div id="vf-dropdown-menu-r-0" class="vf-dropdown__menu vf-dropdown__menu--default"'
            . ' style="left:0px;top:0px;" aria-labelledby="vf-dropdown-trigger-r-1" role="menu">'
            . '<span class="vf-dropdown__arrow vf-dropdown__arrow--bottom" style="left:0px;top:0px;" aria-hidden="true"></span>'
            . '<button type="button" role="menuitem">Edit</button></div>'
            . '</div>',
            $this->render(['default-open' => true], self::slots()),
        );
    }

    public function testOpenWinsOverDefaultOpenWheneverItIsGiven(): void
    {
        self::assertStringContainsString('aria-expanded="false"', $this->render(['open' => false, 'default-open' => true], self::slots()));
        self::assertStringContainsString('aria-expanded="true"', $this->render(['open' => true], self::slots()));
        self::assertStringContainsString('aria-expanded="true"', $this->render(['defaultOpen' => 'true'], self::slots()));
    }

    public function testDisabledWritesAriaDisabledLeavesTheTabOrderAndRendersClosedWhateverOpenSays(): void
    {
        $html = $this->render(['disabled' => true, 'open' => true], self::slots());

        self::assertStringContainsString(
            '<div id="vf-dropdown-trigger-r-1" class="vf-dropdown__trigger" aria-controls="vf-dropdown-menu-r-0"'
            . ' aria-disabled="true" aria-expanded="false" aria-haspopup="menu" tabindex="-1">',
            $html,
        );
        self::assertStringNotContainsString('role="menu"', $html);
        self::assertStringContainsString('<template data-vf-razor-dropdown="menu">', $html);
    }

    public function testAnEnabledTriggerNeverWritesAriaDisabled(): void
    {
        self::assertStringNotContainsString('aria-disabled', $this->render(['disabled' => false], self::slots()));
    }

    public function testTheVariantAndPlacementAreWrittenThroughAndDecideTheOpenClasses(): void
    {
        $pills = $this->render(['default-open' => true, 'variant' => 'pills', 'placement' => 'bottom-end'], self::slots());

        self::assertStringContainsString('class="vf-dropdown__menu vf-dropdown__menu--pills"', $pills);
        self::assertStringContainsString('data-vf-razor-dropdown-placement="bottom-end"', $pills);
        self::assertStringContainsString('data-vf-razor-dropdown-variant="pills"', $pills);

        // Unvalidated, as the reference writes them: an unknown variant is a
        // modifier nothing selects, and a top placement marks the menu and
        // the arrow before anything computes a position.
        $unknown = $this->render(['default-open' => true, 'variant' => 'bogus', 'placement' => 'top-start'], self::slots());
        self::assertStringContainsString(
            'class="vf-dropdown__menu vf-dropdown__menu--bogus vf-dropdown__menu--top"',
            $unknown,
        );
        self::assertStringContainsString('class="vf-dropdown__arrow vf-dropdown__arrow--top"', $unknown);
    }

    public function testTheTeleportDestinationTravelsAsAdapterMetadata(): void
    {
        self::assertStringContainsString(
            'data-vf-razor-dropdown-teleport="#overlay-root"',
            $this->render(['teleport-to' => '#overlay-root'], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-dropdown-teleport="false"',
            $this->render(['teleport-to' => false], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-dropdown-teleport="false"',
            $this->render(['teleportTo' => 'false'], self::slots()),
        );
        self::assertStringContainsString(
            'data-vf-razor-dropdown-teleport="false"',
            $this->render(['teleport-to' => '#overlay-root', 'disable-teleport' => true], self::slots()),
        );
        // A null attribute is "not given": body, as for an absent one.
        self::assertStringContainsString(
            'data-vf-razor-dropdown-teleport="body"',
            $this->render(['teleport-to' => null], self::slots()),
        );
    }

    public function testCloseOnSelectFalseTravelsAsAdapterMetadata(): void
    {
        self::assertStringContainsString(
            'data-vf-razor-dropdown-close-on-select="false"',
            $this->render(['close-on-select' => false], self::slots()),
        );
    }

    public function testForwardedAttributesAndTheConsumerClassLandOnTheRootOnly(): void
    {
        $html = $this->render(
            ['id' => 'consumer', 'data-testid' => 'dd', 'aria-label' => 'Menu', 'class' => 'consumer extra', 'style' => 'margin-top: 4px;'],
            self::slots(),
        );

        self::assertStringStartsWith(
            '<div id="consumer" data-testid="dd" aria-label="Menu" class="vf-dropdown consumer extra" style="margin-top: 4px;"',
            $html,
        );
        self::assertStringContainsString('<div id="vf-dropdown-trigger-r-1" class="vf-dropdown__trigger"', $html);
    }

    public function testEmptySlotsRenderAnEmptyTriggerAndAnEmptyDeferredMenu(): void
    {
        self::assertStringContainsString(
            'tabindex="0"></div><template data-vf-razor-dropdown="menu"></template></div>',
            $this->render(),
        );
        self::assertStringContainsString(
            'aria-hidden="true"></span></div></div>',
            $this->render(['default-open' => true]),
        );
    }

    public function testEveryInstanceGetsItsOwnIdsAndTheyNeverCross(): void
    {
        $first = $this->render([], self::slots());
        $second = $this->render([], self::slots());

        self::assertStringContainsString('aria-controls="vf-dropdown-menu-r-0"', $first);
        self::assertStringContainsString('id="vf-dropdown-trigger-r-1"', $first);
        self::assertStringContainsString('aria-controls="vf-dropdown-menu-r-2"', $second);
        self::assertStringContainsString('id="vf-dropdown-trigger-r-3"', $second);
    }

    public function testItWritesNoScriptAndNoInlineHandler(): void
    {
        $html = $this->render(['default-open' => true], self::slots());

        self::assertStringNotContainsString('<script', $html);
        self::assertDoesNotMatchRegularExpression('/\son[a-z]+=/', $html);
    }

    public function testItRejectsAnUnusableTeleportTargetAndNonScalarAttributes(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['teleport-to' => ['#x']], self::slots());
    }

    public function testItRejectsANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['a']], self::slots());
    }

    public function testItIsRegisteredBesideTheOtherComponentsAndTakesNoConstructorArgument(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(DropdownComponent::class, $components['dropdown']);
        self::assertNull((new \ReflectionClass(DropdownComponent::class))->getConstructor());
        self::assertCount(27, $components);
    }
}
