<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\ButtonComponent;
use Codemonster\VueForge\Razor\Components\GroupBoxComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfGroupBox.
 *
 * The assertions mirror
 * packages/core/src/components/group-box/VfGroupBox.characterization.spec.ts
 * for the half a server renders: the element identities, the title test, the
 * initial state, the trigger, the id graph, the content's presence, the slots
 * and the consumer attributes. The toggle and its event are the browser
 * gate's (scripts/ci/check-razor-browser.mjs) and the parity harness's.
 */
final class GroupBoxComponentTest extends TestCase
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
        $component = $registry->resolve('vf-group-box');
        self::assertNotNull($component, 'The vf-group-box component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    private static function slot(string $markup): \Closure
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
    }

    private static function icon(): string
    {
        return '<span aria-hidden="true" class="vf-group-box__icon">'
            . IconRenderer::render('chevron-down', 'var(--vf-icon-size-sm)')
            . '</span>';
    }

    private static function trigger(string $title, bool $open, bool $disabled = false, ?string $icon = null): string
    {
        return '<button id="vf-group-box-trigger-r-0" aria-controls="vf-group-box-content-r-1"'
            . ' aria-expanded="' . ($open ? 'true' : 'false') . '"'
            . ' class="vf-button vf-button--ghost vf-group-box__trigger" type="button"'
            . ($disabled ? ' disabled' : '') . '>'
            . ($icon ?? self::icon())
            . '<span class="vf-group-box__title">' . $title . '</span>'
            . '</button>';
    }

    // ------------------------------------------------------------- structure

    public function testItRendersTheStaticUntitledGroupWithAContentId(): void
    {
        self::assertSame(
            '<fieldset class="vf-group-box" data-vf-razor="group-box">'
                . '<div id="vf-group-box-content-r-1" class="vf-group-box__content">Body</div>'
                . '</fieldset>',
            $this->render([], ['default' => self::slot('Body')]),
        );
    }

    public function testItRendersTheTitledGroupWithALegendAndAPlainContentDiv(): void
    {
        self::assertSame(
            '<fieldset class="vf-group-box vf-group-box--titled" data-vf-razor="group-box">'
                . '<legend class="vf-group-box__legend"><span class="vf-group-box__title">Shipping</span></legend>'
                . '<div id="vf-group-box-content-r-1" class="vf-group-box__content">Body</div>'
                . '</fieldset>',
            $this->render(['title' => 'Shipping'], ['default' => self::slot('Body')]),
        );
    }

    public function testItRendersTheOpenCollapsibleGroup(): void
    {
        self::assertSame(
            '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible" data-vf-razor="group-box">'
                . '<legend class="vf-group-box__legend">' . self::trigger('Details', true) . '</legend>'
                . '<div id="vf-group-box-content-r-1" aria-labelledby="vf-group-box-trigger-r-0" class="vf-group-box__content" role="region">Body</div>'
                . '</fieldset>',
            $this->render(['title' => 'Details', 'collapsible' => true], ['default' => self::slot('Body')]),
        );
    }

    public function testItRendersTheClosedCollapsibleGroupWithTheContentDeferred(): void
    {
        self::assertSame(
            '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible vf-group-box--collapsed" data-vf-razor="group-box">'
                . '<legend class="vf-group-box__legend">' . self::trigger('Details', false) . '</legend>'
                . '<template data-vf-razor-group-box="content">Body</template>'
                . '</fieldset>',
            $this->render(
                ['title' => 'Details', 'collapsible' => true, 'default-collapsed' => true],
                ['default' => self::slot('Body')],
            ),
        );
    }

    public function testTheTriggerIsTheCanonicalButtonInstance(): void
    {
        $components = (new VueForgeRazorProvider())->components();
        $groupBox = $components['group-box'];
        self::assertInstanceOf(GroupBoxComponent::class, $groupBox);

        $property = (new \ReflectionClass(GroupBoxComponent::class))->getProperty('button');
        self::assertSame($components['button'], $property->getValue($groupBox));
        self::assertInstanceOf(ButtonComponent::class, $components['button']);
        self::assertCount(30, $components);
    }

    public function testTheTriggerClassSerialisationFollowsTheButtonAdapter(): void
    {
        // Vue writes "vf-group-box__trigger vf-button vf-button--ghost": an
        // inherited class leads VfButton's list. ButtonComponent appends a
        // consumer class after its own, since M12, for every consumer. The
        // same set, a different string order; no stylesheet, accessibility
        // tree or parity comparison can see it (classes are compared as a
        // set). Pinned here so the difference is a known one.
        self::assertStringContainsString(
            'class="vf-button vf-button--ghost vf-group-box__trigger"',
            $this->render(['title' => 'T', 'collapsible' => true]),
        );
    }

    // ------------------------------------------------------------- title

    public function testTheEmptyTitleIsNoTitleEvenWhenCollapsible(): void
    {
        $markup = $this->render(['title' => '', 'collapsible' => true], ['default' => self::slot('Body')]);

        self::assertStringNotContainsString('<legend', $markup);
        self::assertStringNotContainsString('<button', $markup);
        self::assertStringContainsString('<fieldset class="vf-group-box" ', $markup);
        self::assertStringNotContainsString('role="region"', $markup);
    }

    public function testTheTitleZeroIsATitleAndACollapsibleOne(): void
    {
        // PHP truthiness would drop "0"; the reference renders it.
        $markup = $this->render(['title' => '0', 'collapsible' => true], ['default' => self::slot('Body')]);

        self::assertStringContainsString('<span class="vf-group-box__title">0</span>', $markup);
        self::assertStringContainsString('vf-group-box vf-group-box--titled vf-group-box--collapsible"', $markup);
        self::assertStringContainsString('aria-expanded="true"', $markup);
        self::assertStringContainsString('role="region"', $markup);
    }

    public function testATitleSlotCountsBesideAnEmptyTitleAndReplacesThePropText(): void
    {
        $markup = $this->render(
            ['title' => '', 'collapsible' => true],
            ['title' => self::slot('<b>Slotted</b>'), 'default' => self::slot('Body')],
        );
        self::assertStringContainsString('<span class="vf-group-box__title"><b>Slotted</b></span>', $markup);
        self::assertSame(1, substr_count($markup, '<button'));

        self::assertStringNotContainsString(
            'Prop',
            $this->render(['title' => 'Prop'], ['title' => self::slot('Slot')]),
        );
    }

    public function testCollapsibleWithoutATitleIsTheStaticGroupAndIgnoresCollapsed(): void
    {
        $markup = $this->render(['collapsible' => true, 'collapsed' => true], ['default' => self::slot('Body')]);

        self::assertSame(
            '<fieldset class="vf-group-box" data-vf-razor="group-box">'
                . '<div id="vf-group-box-content-r-1" class="vf-group-box__content">Body</div>'
                . '</fieldset>',
            $markup,
        );
    }

    public function testTheTitleIsEscaped(): void
    {
        self::assertStringContainsString(
            '<span class="vf-group-box__title">&lt;b&gt;x&lt;/b&gt;</span>',
            $this->render(['title' => '<b>x</b>']),
        );
    }

    // ------------------------------------------------------------- state

    public function testTheCollapseResolution(): void
    {
        $cases = [
            [[], true],
            [['default-collapsed' => true], false],
            [['defaultCollapsed' => true], false],
            [['collapsed' => true], false],
            [['collapsed' => false, 'default-collapsed' => true], true],
            [['collapsed' => true, 'default-collapsed' => false], false],
            [['collapsed' => null, 'default-collapsed' => true], false],
            [['collapsed' => 'false', 'default-collapsed' => 'true'], true],
        ];

        foreach ($cases as [$props, $open]) {
            FieldIds::reset();
            $markup = $this->render(['title' => 'T', 'collapsible' => true, ...$props], ['default' => self::slot('Body')]);
            $label = json_encode($props, JSON_THROW_ON_ERROR);

            self::assertStringContainsString('aria-expanded="' . ($open ? 'true' : 'false') . '"', $markup, $label);
            self::assertSame($open, str_contains($markup, 'class="vf-group-box__content"'), $label);
            self::assertSame(!$open, str_contains($markup, 'vf-group-box--collapsed'), $label);
        }
    }

    public function testATitledButNotCollapsibleGroupIgnoresEverySeed(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsed' => true, 'default-collapsed' => true], ['default' => self::slot('Body')]);

        self::assertStringContainsString('class="vf-group-box__content"', $markup);
        self::assertStringNotContainsString('vf-group-box--collapsed', $markup);
        self::assertStringNotContainsString('<template', $markup);
    }

    public function testCollapsedIsTheInitialStateOnlyAndCarriesNoControlledMarker(): void
    {
        // The documented platform divergence: no controlled mode on the server.
        // `collapsed` decides what is rendered and nothing else - no attribute
        // tells the controller to wait for a parent.
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'collapsed' => true]);

        self::assertStringNotContainsString('controlled', $markup);
        self::assertStringNotContainsString('data-vf-razor-group-box-', str_replace('data-vf-razor-group-box="content"', '', $markup));
    }

    public function testANonBooleanCollapsedIsRejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['title' => 'T', 'collapsed' => ['yes']]);
    }

    // ------------------------------------------------------------- ids

    public function testTheOpenPairIsWiredBothWays(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true]);

        self::assertStringContainsString('id="vf-group-box-trigger-r-0" aria-controls="vf-group-box-content-r-1"', $markup);
        self::assertStringContainsString('id="vf-group-box-content-r-1" aria-labelledby="vf-group-box-trigger-r-0"', $markup);
    }

    public function testTheQuirkWhileClosedAriaControlsNamesAnIdNoElementCarries(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'collapsed' => true]);

        self::assertStringContainsString('aria-controls="vf-group-box-content-r-1"', $markup);
        self::assertStringNotContainsString('id="vf-group-box-content-r-1"', $markup);
    }

    public function testBothIdsAreAllocatedOnEveryRenderTriggerFirst(): void
    {
        self::assertStringContainsString('id="vf-group-box-content-r-1"', $this->render(['title' => 'T']));
        self::assertStringContainsString('id="vf-group-box-content-r-3"', $this->render());
        self::assertStringContainsString('id="vf-group-box-trigger-r-4"', $this->render(['title' => 'T', 'collapsible' => true]));
    }

    public function testAConsumerIdStaysOnTheFieldset(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'id' => 'shipping']);

        self::assertStringContainsString(' id="shipping"', $markup);
        self::assertStringContainsString('id="vf-group-box-trigger-r-0"', $markup);
    }

    // ------------------------------------------------------------- disabled

    public function testDisabledIsTheNativeTriggerAttributeOnly(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'disabled' => true]);

        self::assertStringContainsString(self::trigger('T', true, true), $markup);
        self::assertStringNotContainsString('aria-disabled', $markup);
        self::assertStringNotContainsString('--disabled', $markup);
        self::assertStringStartsWith('<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible" data-vf-razor', $markup);
    }

    public function testDisabledNeverReachesTheFieldset(): void
    {
        foreach ([['disabled' => true], ['title' => 'T', 'disabled' => true], ['title' => 'T', 'collapsible' => true, 'disabled' => true]] as $props) {
            $markup = $this->render($props);
            $fieldset = substr($markup, 0, (int) strpos($markup, '>') + 1);

            self::assertStringNotContainsString('disabled', $fieldset, json_encode($props, JSON_THROW_ON_ERROR));
        }
    }

    public function testDisabledKeepsAClosedGroupClosed(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'collapsed' => true, 'disabled' => true]);

        self::assertStringContainsString('aria-expanded="false" class="vf-button vf-button--ghost vf-group-box__trigger" type="button" disabled', $markup);
        self::assertStringContainsString('<template data-vf-razor-group-box="content">', $markup);
    }

    // ------------------------------------------------------------- slots

    public function testTheToggleIconSlotReplacesTheWholeWrapper(): void
    {
        $markup = $this->render(
            ['title' => 'Details', 'collapsible' => true],
            ['toggle-icon' => self::slot('<i class="custom">+</i>')],
        );

        self::assertStringContainsString(self::trigger('Details', true, false, '<i class="custom">+</i>'), $markup);
        self::assertStringNotContainsString('vf-group-box__icon', $markup);
        self::assertStringNotContainsString('aria-hidden', $markup);
    }

    public function testATemplateSpellsTheToggleIconSlotInCamelCaseWithTheSameResult(): void
    {
        // The Razor engine refuses a dashed named-slot declaration, so a
        // template writes <razor-slot name="toggleIcon">. The markup is the
        // same as through the PHP API's toggle-icon.
        $dashed = $this->render(['title' => 'Details', 'collapsible' => true], ['toggle-icon' => self::slot('<i>+</i>')]);
        FieldIds::reset();
        $camel = $this->render(['title' => 'Details', 'collapsible' => true], ['toggleIcon' => self::slot('<i>+</i>')]);

        self::assertSame($dashed, $camel);
        self::assertStringNotContainsString('vf-group-box__icon', $camel);
    }

    public function testTheToggleIconSlotRendersFromARealTemplate(): void
    {
        $engine = new \Codemonster\Razor\RazorEngine(
            new \Codemonster\View\Locator\DefaultLocator([sys_get_temp_dir()]),
            'razor.php',
            sys_get_temp_dir() . '/vueforge-group-box-template-test-cache',
            (static function (): ComponentRegistry {
                $registry = new ComponentRegistry();
                $registry->register(new VueForgeRazorProvider());
                return $registry;
            })(),
        );
        $name = 'vueforge-group-box-template-' . bin2hex(random_bytes(4));
        $path = sys_get_temp_dir() . '/' . $name . '.razor.php';
        file_put_contents($path, '<vf-group-box title="Details" :collapsible="true"><razor-slot name="toggleIcon"><i>+</i></razor-slot>Body</vf-group-box>');

        try {
            $markup = $engine->render($name, []);
        } finally {
            @unlink($path);
        }

        self::assertStringContainsString('type="button"><i>+</i><span class="vf-group-box__title">Details</span></button>', $markup);
        self::assertStringNotContainsString('vf-group-box__icon', $markup);
    }

    public function testTheToggleIconSlotNeverRendersWithoutATrigger(): void
    {
        self::assertStringNotContainsString('custom', $this->render(['title' => 'T'], ['toggle-icon' => self::slot('<i class="custom">+</i>')]));
    }

    public function testRichTitleMarkupRendersInsideTheTitleSpanInsideTheTrigger(): void
    {
        $markup = $this->render(['collapsible' => true], ['title' => self::slot('<strong>Invoice</strong> <em>#1024</em>')]);

        self::assertStringContainsString('<span class="vf-group-box__title"><strong>Invoice</strong> <em>#1024</em></span></button>', $markup);
    }

    public function testTheDefaultSlotRendersDirectlyInTheContentAndAnAbsentOneLeavesItEmpty(): void
    {
        self::assertStringContainsString('class="vf-group-box__content"><p>A</p><p>B</p></div>', $this->render(['title' => 'T'], ['default' => self::slot('<p>A</p><p>B</p>')]));
        self::assertStringContainsString('class="vf-group-box__content"></div>', $this->render(['title' => 'T']));
    }

    // ------------------------------------------------------------- attributes

    public function testConsumerAttributesLandOnTheFieldsetAfterTheCanonicalClasses(): void
    {
        $markup = $this->render([
            'title' => 'T',
            'collapsible' => true,
            'class' => 'extra',
            'style' => 'color: red',
            'id' => 'gb',
            'data-testid' => 'box',
            'aria-label' => 'X',
            'name' => 'n',
            'form' => 'f',
        ]);
        $fieldset = substr($markup, 0, (int) strpos($markup, '>') + 1);

        self::assertSame(
            '<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible extra" id="gb" data-testid="box" aria-label="X" name="n" form="f" style="color: red" data-vf-razor="group-box">',
            $fieldset,
        );
        self::assertSame(1, substr_count($markup, 'data-testid'));
    }

    public function testAConsumerAriaExpandedLandsOnTheFieldsetAndLeavesTheTriggerItsOwn(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'aria-expanded' => 'false']);

        self::assertStringContainsString('<fieldset class="vf-group-box vf-group-box--titled vf-group-box--collapsible" aria-expanded="false"', $markup);
        self::assertStringContainsString('id="vf-group-box-trigger-r-0" aria-controls="vf-group-box-content-r-1" aria-expanded="true"', $markup);
    }

    public function testItRejectsANonScalarForwardedAttribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['data-x' => ['a']]);
    }

    // ------------------------------------------------------------- no JS

    public function testNothingHerePretendsToToggleWithoutAScript(): void
    {
        $markup = $this->render(['title' => 'T', 'collapsible' => true, 'collapsed' => true], ['default' => self::slot('Body')]);

        self::assertStringNotContainsString('<details', $markup);
        self::assertStringNotContainsString('<summary', $markup);
        self::assertStringNotContainsString('<script', $markup);
        self::assertStringNotContainsString('onclick', $markup);
        self::assertStringNotContainsString('href', $markup);
        self::assertStringContainsString('type="button"', $markup);
    }

    public function testOnlyAClosedGroupCarriesTheDeferredTemplate(): void
    {
        self::assertSame(0, substr_count($this->render(['title' => 'T', 'collapsible' => true]), '<template'));
        self::assertSame(0, substr_count($this->render(['title' => 'T', 'collapsed' => true]), '<template'));
        self::assertSame(1, substr_count($this->render(['title' => 'T', 'collapsible' => true, 'collapsed' => true]), 'data-vf-razor-group-box="content"'));
    }
}
