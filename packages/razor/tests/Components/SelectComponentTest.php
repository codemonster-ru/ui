<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Components\SelectComponent;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\Support\IconButton;
use Codemonster\VueForge\Razor\Support\IconRenderer;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfSelect.
 *
 * The server half of
 * packages/core/src/components/select/VfSelect.characterization.spec.ts: the
 * closed wrapper, trigger and hidden input, the dangling closed aria-controls,
 * the options waiting inert with their values, the chevron and clear swap,
 * the attributes that reach the trigger and the ones dropped, the field
 * report, and the adapter metadata the browser controller reads. What happens
 * after a gesture is the controller's and is measured in a real browser by the
 * parity profile and the Razor browser gate.
 */
final class SelectComponentTest extends TestCase
{
    private const OPTIONS = [
        ['value' => 'starter', 'label' => 'Starter'],
        ['value' => 'legacy', 'label' => 'Legacy', 'disabled' => true],
        ['value' => 'pro', 'label' => 'Pro'],
    ];

    protected function setUp(): void
    {
        FieldIds::reset();
    }

    private static function registry(): ComponentRegistry
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());

        return $registry;
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, \Closure(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $component = self::registry()->resolve('vf-select');
        self::assertNotNull($component, 'The vf-select component must be registered by the provider.');

        return $component->render(new ComponentRenderContext(['options' => self::OPTIONS] + $props, $slots))->value();
    }

    private static function chevron(): string
    {
        return '<span class="vf-select__icon vf-select__icon--chevron" aria-hidden="true">'
            . IconRenderer::render('chevron-down', 'var(--vf-field-icon-size)') . '</span>';
    }

    private static function listboxTemplate(string $selected = ''): string
    {
        $markup = '<template data-vf-razor-select="listbox">';
        foreach (self::OPTIONS as $option) {
            $on = $option['value'] === $selected;
            $markup .= '<button type="button" class="vf-dropdown__item vf-select__option'
                . ($on ? ' vf-select__option--selected' : '') . '" role="option" aria-selected="'
                . ($on ? 'true' : 'false') . '"' . (isset($option['disabled']) ? ' disabled' : '')
                . ' tabindex="-1" data-vf-razor-select-value="' . $option['value'] . '">' . $option['label'] . '</button>';
        }

        return $markup . '</template>';
    }

    public function testItRendersTheClosedSelectWithADanglingAriaControlsAndTheOptionsDeferred(): void
    {
        self::assertSame(
            '<div class="vf-select-wrap" data-vf-razor="select" data-vf-razor-select-value=""'
            . ' data-vf-razor-select-placement="bottom-start" data-vf-razor-select-teleport="body"'
            . ' data-vf-razor-select-floating="false" data-vf-razor-select-clearable="false"'
            . ' data-vf-razor-select-size="md" data-vf-razor-select-invalid="false">'
            . '<button id="vf-select-trigger-r-0" type="button" class="vf-select" aria-controls="vf-select-listbox-r-1"'
            . ' aria-expanded="false" aria-haspopup="listbox" data-vf-razor-select="trigger">'
            . '<span class="vf-select__value"></span>' . self::chevron() . '</button>'
            . self::listboxTemplate()
            . '</div>',
            $this->render(),
        );
    }

    public function testTheClosedListboxDoesNotExistSoTheReferenceDangles(): void
    {
        $html = $this->render();

        self::assertStringNotContainsString('role="listbox"', $html);
        self::assertStringNotContainsString('id="vf-select-listbox-r-1"', $html);
        self::assertStringContainsString('aria-controls="vf-select-listbox-r-1"', $html);
        self::assertStringNotContainsString('aria-activedescendant', $html);
    }

    public function testItDisplaysTheSelectedLabelAndMarksTheFilledTrigger(): void
    {
        $html = $this->render(['model-value' => 'pro', 'placeholder' => 'Pick']);

        self::assertStringContainsString('class="vf-select" data-vf-filled="true"', $html);
        self::assertStringContainsString('<span class="vf-select__value">Pro</span>', $html);
        self::assertStringContainsString(self::listboxTemplate('pro'), $html);
    }

    public function testADisabledSelectedOptionIsStillDisplayed(): void
    {
        self::assertStringContainsString(
            '<span class="vf-select__value">Legacy</span>',
            $this->render(['model-value' => 'legacy']),
        );
    }

    public function testAModelNoOptionHasIsFilledButShowsThePlaceholder(): void
    {
        $html = $this->render(['model-value' => 'ghost', 'placeholder' => 'Pick']);

        self::assertStringContainsString('class="vf-select vf-select--placeholder" data-vf-filled="true"', $html);
        self::assertStringContainsString('<span class="vf-select__value">Pick</span>', $html);
    }

    public function testAnEmptyValueOptionIsSelectedButNotFilled(): void
    {
        $component = self::registry()->resolve('vf-select');
        self::assertNotNull($component);
        $html = $component->render(new ComponentRenderContext([
            'options' => [['value' => '', 'label' => 'None'], ...self::OPTIONS],
            'clearable' => true,
        ], []))->value();

        self::assertStringContainsString('<span class="vf-select__value">None</span>', $html);
        self::assertStringNotContainsString('data-vf-filled', $html);
        // The chevron, not the clear button: the clear button waits in its template.
        self::assertStringContainsString(
            'None</span>' . self::chevron() . '</button><template data-vf-razor-select="listbox">',
            $html,
        );
    }

    public function testTheHiddenInputRendersForAStringNameOnlyWithTheValueAndDisabled(): void
    {
        self::assertStringNotContainsString('type="hidden"', $this->render(['model-value' => 'pro']));
        self::assertStringContainsString(
            '<div class="vf-select-wrap" data-vf-razor="select" data-vf-razor-select-value="pro"',
            $this->render(['model-value' => 'pro', 'name' => 'plan']),
        );
        self::assertStringContainsString(
            'data-vf-razor-select-invalid="false"><input type="hidden" name="plan" value="pro"><button',
            $this->render(['model-value' => 'pro', 'name' => 'plan']),
        );
        self::assertStringContainsString(
            '<input type="hidden" name="plan" value="pro" disabled>',
            $this->render(['model-value' => 'pro', 'name' => 'plan', 'disabled' => true]),
        );
        self::assertStringContainsString('<input type="hidden" name="plan" value="">', $this->render(['name' => 'plan']));
    }

    public function testRequiredAndOtherAttributesAreDroppedButAriaDataTitleAndTabindexReachTheTrigger(): void
    {
        $html = $this->render([
            'name' => 'plan',
            'required' => true,
            'autofocus' => true,
            'form' => 'f',
            'role' => 'combobox',
            'aria-label' => 'Plan',
            'data-testid' => 'plan',
            'title' => 'Pick a plan',
            'tabindex' => '3',
        ]);

        foreach (['required', 'autofocus', 'form="f"', 'role="combobox"'] as $dropped) {
            self::assertStringNotContainsString($dropped, $html);
        }
        self::assertStringContainsString(
            'aria-haspopup="listbox" aria-label="Plan" data-testid="plan" title="Pick a plan" tabindex="3"',
            $html,
        );
    }

    public function testAForwardedAttributeOverridesTheComponentsOwn(): void
    {
        $html = $this->render(['aria-haspopup' => 'true', 'aria-expanded' => 'mixed']);

        self::assertStringContainsString('aria-expanded="mixed" aria-haspopup="true"', $html);
        // The controller is told which of its own attributes it must never rewrite.
        self::assertStringContainsString('data-vf-razor-select-forwarded="aria-expanded"', $html);
        self::assertStringNotContainsString('data-vf-razor-select-forwarded', $this->render());
        // A null attribute is "not given" and overrides nothing.
        self::assertStringNotContainsString(
            'data-vf-razor-select-forwarded',
            $this->render(['aria-expanded' => null, 'data-vf-filled' => null]),
        );
    }

    public function testClassAndStyleGoToTheWrapperAndAStringIdToTheTrigger(): void
    {
        $html = $this->render(['class' => 'consumer', 'style' => 'margin-top: 4px;', 'id' => 'plan-select']);

        self::assertStringStartsWith('<div class="vf-select-wrap consumer" style="margin-top: 4px;"', $html);
        self::assertStringContainsString('<button id="plan-select" type="button"', $html);
    }

    public function testSizeInvalidAndDisabledWriteTheHistoricalClassesAndAttributes(): void
    {
        $html = $this->render(['size' => 'sm', 'invalid' => true, 'disabled' => true]);

        self::assertStringStartsWith('<div class="vf-select-wrap vf-select-wrap--sm"', $html);
        self::assertStringContainsString(
            'class="vf-select vf-select--sm vf-select--invalid" aria-controls="vf-select-listbox-r-1"'
            . ' aria-expanded="false" aria-haspopup="listbox" aria-invalid="true" disabled',
            $html,
        );
    }

    public function testTheClearButtonReplacesTheChevronAndTheSwapWaitsInTemplates(): void
    {
        $html = $this->render(['model-value' => 'pro', 'clearable' => true]);
        $clear = IconButton::render('xmark', 'ghost', 'sm', attributes: [
            'class' => 'vf-select-wrap__clear',
            'aria-label' => 'Clear select',
        ]);

        self::assertStringStartsWith('<div class="vf-select-wrap vf-select-wrap--with-clear"', $html);
        self::assertStringContainsString('class="vf-select vf-select--with-clear" data-vf-filled="true"', $html);
        self::assertStringContainsString('<span class="vf-select__value">Pro</span></button>' . $clear, $html);
        self::assertStringEndsWith(
            '<template data-vf-razor-select="chevron">' . self::chevron() . '</template>'
            . '<template data-vf-razor-select="clear">' . $clear . '</template></div>',
            $html,
        );
    }

    public function testAClearableSelectWithoutAValueShowsTheChevronAndAClearableDisabledOneNeedsNoTemplates(): void
    {
        self::assertStringContainsString(
            '<span class="vf-select__value"></span>' . self::chevron() . '</button>',
            $this->render(['clearable' => true]),
        );
        self::assertStringNotContainsString(
            'data-vf-razor-select="clear"',
            $this->render(['clearable' => true, 'model-value' => 'pro', 'disabled' => true]),
        );
    }

    public function testAdornmentsRenderIconsOrSlotsBeforeAndAfterTheValue(): void
    {
        $html = $this->render([], [
            'leading' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<b>L</b>'),
            'trailing' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<i>T</i>'),
        ]);

        self::assertStringContainsString(
            'class="vf-select vf-select--with-leading vf-select--with-trailing"',
            $html,
        );
        self::assertStringContainsString(
            '<span class="vf-select__icon vf-select__icon--leading" aria-hidden="true"><b>L</b></span>'
            . '<span class="vf-select__value"></span>'
            . '<span class="vf-select__icon vf-select__icon--trailing" aria-hidden="true"><i>T</i></span>',
            $html,
        );
    }

    public function testTheTeleportDestinationTravelsAsMetadata(): void
    {
        self::assertStringContainsString(
            'data-vf-razor-select-teleport="#overlay"',
            $this->render(['teleport-to' => '#overlay']),
        );
        self::assertStringContainsString(
            'data-vf-razor-select-teleport="false"',
            $this->render(['teleport-to' => 'false']),
        );
        self::assertStringContainsString(
            'data-vf-razor-select-teleport="false"',
            $this->render(['disable-teleport' => true, 'teleport-to' => '#overlay']),
        );
        self::assertStringContainsString(
            'data-vf-razor-select-placement="bottom-end"',
            $this->render(['placement' => 'bottom-end']),
        );
    }

    public function testInsideAFloatingFieldItTakesTheFieldIdsAndReportsFloatingAndFilled(): void
    {
        $field = self::registry()->resolve('vf-field');
        self::assertNotNull($field);
        $select = self::registry()->resolve('vf-select');
        self::assertNotNull($select);

        $html = $field->render(new ComponentRenderContext(
            ['label' => 'Plan', 'label-placement' => 'floating', 'description' => 'Billing', 'control-id' => 'plan-control'],
            ['default' => static fn (): RenderedHtml => $select->render(new ComponentRenderContext([
                'options' => self::OPTIONS,
                'model-value' => 'pro',
                'placeholder' => 'Pick',
            ], []))],
        ))->value();

        self::assertStringContainsString('vf-field--floating', $html);
        self::assertStringContainsString('vf-field__control--floating vf-field__control--filled', $html);
        self::assertStringContainsString('<div class="vf-select-wrap vf-select-wrap--floating"', $html);
        self::assertStringContainsString('<button id="plan-control" type="button" class="vf-select vf-select--floating"', $html);
        self::assertMatchesRegularExpression('/aria-describedby="vf-field-description-r-\d+"/', $html);
        // The trigger declares itself the field's control; the hidden input never does.
        self::assertStringContainsString('data-vf-razor-select="trigger" data-vf-razor-field-control="">', $html);
        self::assertSame(1, substr_count($html, 'data-vf-razor-field-control'));
    }

    public function testOutsideAFieldTheTriggerDeclaresNoFieldControl(): void
    {
        self::assertStringNotContainsString('data-vf-razor-field-control', $this->render(['name' => 'plan']));
    }

    public function testAFloatingFieldSuppressesThePlaceholderAndAnEmptySelectIsUnfilled(): void
    {
        $field = self::registry()->resolve('vf-field');
        self::assertNotNull($field);
        $select = self::registry()->resolve('vf-select');
        self::assertNotNull($select);

        $html = $field->render(new ComponentRenderContext(
            ['label' => 'Plan', 'label-placement' => 'floating', 'control-id' => 'plan-control'],
            ['default' => static fn (): RenderedHtml => $select->render(new ComponentRenderContext([
                'options' => self::OPTIONS,
                'placeholder' => 'Pick',
            ], []))],
        ))->value();

        self::assertStringContainsString('class="vf-select vf-select--placeholder vf-select--floating"', $html);
        self::assertStringContainsString('<span class="vf-select__value"></span>', $html);
        self::assertStringNotContainsString('vf-field__control--filled', $html);
        self::assertStringContainsString('data-vf-razor-select-placeholder="Pick"', $html);
        self::assertStringContainsString('data-vf-razor-select-floating="true"', $html);
    }

    public function testAnEscapedLabelAndValueStayText(): void
    {
        $component = self::registry()->resolve('vf-select');
        self::assertNotNull($component);
        $html = $component->render(new ComponentRenderContext([
            'options' => [['value' => '"<x>', 'label' => '<b>bold</b>']],
            'model-value' => '"<x>',
        ], []))->value();

        self::assertStringContainsString('<span class="vf-select__value">&lt;b&gt;bold&lt;/b&gt;</span>', $html);
        self::assertStringContainsString('data-vf-razor-select-value="&quot;&lt;x&gt;"', $html);
    }

    public function testMalformedOptionsAndTeleportAreRefused(): void
    {
        $component = self::registry()->resolve('vf-select');
        self::assertNotNull($component);

        foreach ([
            ['options' => 'starter'],
            ['options' => [['value' => 1, 'label' => 'One']]],
            ['options' => [['value' => 'a', 'label' => 'A', 'disabled' => 'yes']]],
            ['options' => [], 'teleport-to' => true],
            ['options' => [], 'data-vf-razor-select' => 'x'],
        ] as $props) {
            try {
                $component->render(new ComponentRenderContext($props, []));
                self::fail('Expected a refusal for ' . json_encode($props));
            } catch (\InvalidArgumentException) {
                self::addToAssertionCount(1);
            }
        }
    }

    public function testTheProviderRegistersOneSelect(): void
    {
        $components = (new VueForgeRazorProvider())->components();

        self::assertInstanceOf(SelectComponent::class, $components['select']);
        self::assertNull((new \ReflectionClass(SelectComponent::class))->getConstructor());
        self::assertCount(34, $components);
    }
}
