<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\VueForge\Razor\Components\StepperComponent;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfStepper.
 *
 * The assertions mirror
 * packages/core/src/components/stepper/VfStepper.characterization.spec.ts for
 * the half a server renders: the structure, one native button per item, the
 * value resolution with its fallback and its quirks, the state precedence,
 * aria-current, native disabled, the root custom properties with the
 * JavaScript-shaped factor, the orientation and content-position classes, and
 * the consumer attributes. What a server cannot render - the selection change,
 * the keyboard, the focus, the events - is the browser gate's
 * (scripts/ci/check-razor-browser.mjs) and the parity harness's, and the two
 * things this suite pins about it are that the no-JS output is truthful and
 * that nothing here pretends to select.
 */
final class StepperComponentTest extends TestCase
{
    private const ITEMS = [
        ['value' => 'account', 'label' => 'Account'],
        ['value' => 'profile', 'label' => 'Profile', 'description' => 'Tell us about yourself'],
        ['value' => 'confirm', 'label' => 'Confirm'],
    ];

    /** @param array<string, mixed> $props */
    private function render(array $props): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-stepper');
        self::assertNotNull($component, 'The vf-stepper component must be registered by the provider.');
        self::assertInstanceOf(StepperComponent::class, $component);

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    /**
     * @param list<string> $disabled
     * @return list<array{value: string, label: string, description?: string, disabled?: bool}>
     */
    private static function items(array $disabled = []): array
    {
        return array_map(
            static fn (array $item): array => in_array($item['value'], $disabled, true) ? $item + ['disabled' => true] : $item,
            self::ITEMS,
        );
    }

    private static function rail(int $index): string
    {
        return '<span class="vf-stepper__rail" aria-hidden="true">'
            . '<span class="vf-stepper__connector vf-stepper__connector--before"></span>'
            . '<span class="vf-stepper__marker">' . $index . '</span>'
            . '<span class="vf-stepper__connector vf-stepper__connector--after"></span>'
            . '</span>';
    }

    private static function item(string $state, string $value, string $label, int $index, ?string $description = null, bool $disabled = false): string
    {
        $current = $state === 'current';

        return '<li class="vf-stepper__item vf-stepper__item--' . $state . '">'
            . '<button type="button" class="vf-stepper__trigger' . ($current ? ' vf-stepper__trigger--current' : '') . '"'
            . ' data-vf-stepper-value="' . $value . '"'
            . ($disabled ? ' disabled' : '')
            . ($current ? ' aria-current="step"' : '')
            . '>' . self::rail($index)
            . '<span class="vf-stepper__content"><span class="vf-stepper__label">' . $label . '</span>'
            . ($description === null ? '' : '<span class="vf-stepper__description">' . $description . '</span>')
            . '</span></button></li>';
    }

    /** The default three items with the given states. @param list<string> $states */
    private static function list(array $states, array $disabled = []): string
    {
        return '<ol class="vf-stepper__list">'
            . self::item($states[0], 'account', 'Account', 1, null, in_array('account', $disabled, true))
            . self::item($states[1], 'profile', 'Profile', 2, 'Tell us about yourself', in_array('profile', $disabled, true))
            . self::item($states[2], 'confirm', 'Confirm', 3, null, in_array('confirm', $disabled, true))
            . '</ol>';
    }

    /** @return list<string> */
    private static function states(string $html): array
    {
        preg_match_all('/vf-stepper__item--([a-z]+)/', $html, $matches);

        return $matches[1];
    }

    /** @return list<string> */
    private static function currentValues(string $html): array
    {
        preg_match_all('/data-vf-stepper-value="([^"]+)" aria-current="step"/', $html, $matches);

        return $matches[1];
    }

    private static function style(string $html): ?string
    {
        return preg_match('/<nav[^>]* style="([^"]*)"/', $html, $matches) === 1 ? $matches[1] : null;
    }

    // ------------------------------------------------------------- structure

    public function testItRendersTheDefaultMarkupExactly(): void
    {
        self::assertSame(
            '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below"'
                . ' style="--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;"'
                . ' aria-label="Progress" data-vf-razor="stepper">'
                . self::list(['current', 'upcoming', 'upcoming'])
                . '</nav>',
            $this->render(['items' => self::ITEMS]),
        );
    }

    public function testItRendersOneNativeButtonPerItemAndNothingElseInteractive(): void
    {
        $html = $this->render(['items' => self::ITEMS]);

        self::assertSame(3, substr_count($html, '<button type="button" class="vf-stepper__trigger'));
        self::assertSame(3, substr_count($html, '<li class="vf-stepper__item '));
        self::assertStringNotContainsString('role=', $html);
        self::assertStringNotContainsString('tabindex', $html);
        self::assertStringNotContainsString(' id=', $html);
        self::assertStringNotContainsString('aria-controls', $html);
        self::assertStringNotContainsString('aria-labelledby', $html);
        self::assertStringNotContainsString('aria-disabled', $html);
        self::assertStringNotContainsString('aria-selected', $html);
        self::assertStringNotContainsString('<template', $html);
    }

    public function testItRendersTheDescriptionOnlyForANonEmptyOne(): void
    {
        $html = $this->render(['items' => [
            ['value' => 'a', 'label' => 'A', 'description' => 'Alpha'],
            ['value' => 'b', 'label' => 'B', 'description' => ''],
            ['value' => 'c', 'label' => 'C'],
        ]]);

        self::assertSame(1, substr_count($html, 'vf-stepper__description'));
        self::assertStringContainsString('<span class="vf-stepper__description">Alpha</span>', $html);
    }

    public function testItEscapesLabelsDescriptionsAndValues(): void
    {
        $html = $this->render(['items' => [
            ['value' => 'a"b', 'label' => '<b>Bold</b>', 'description' => 'Tom & Jerry'],
        ]]);

        self::assertStringContainsString('data-vf-stepper-value="a&quot;b"', $html);
        self::assertStringContainsString('<span class="vf-stepper__label">&lt;b&gt;Bold&lt;/b&gt;</span>', $html);
        self::assertStringContainsString('<span class="vf-stepper__description">Tom &amp; Jerry</span>', $html);
    }

    public function testItRendersAnEmptyListForNoItems(): void
    {
        self::assertSame(
            '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below"'
                . ' style="--vf-stepper-item-count: 0;" aria-label="Progress" data-vf-razor="stepper">'
                . '<ol class="vf-stepper__list"></ol></nav>',
            $this->render(['items' => []]),
        );
    }

    // ------------------------------------------------------------ value

    public function testItFallsBackToTheFirstEnabledItem(): void
    {
        self::assertSame(['account'], self::currentValues($this->render(['items' => self::ITEMS])));
        self::assertSame(['profile'], self::currentValues($this->render(['items' => self::items(['account'])])));
    }

    public function testDefaultValueSeedsTheState(): void
    {
        $html = $this->render(['items' => self::ITEMS, 'default-value' => 'profile']);

        self::assertSame(['profile'], self::currentValues($html));
        self::assertSame(['complete', 'current', 'upcoming'], self::states($html));
        self::assertSame(self::list(['complete', 'current', 'upcoming']), substr($html, strpos($html, '<ol'), -6));
    }

    public function testModelValueWinsOverDefaultValue(): void
    {
        $html = $this->render(['items' => self::ITEMS, 'model-value' => 'confirm', 'default-value' => 'profile']);

        self::assertSame(['confirm'], self::currentValues($html));
        self::assertSame(['complete', 'complete', 'current'], self::states($html));
        self::assertSame(['confirm'], self::currentValues($this->render(['items' => self::ITEMS, 'modelValue' => 'confirm', 'defaultValue' => 'profile'])));
    }

    public function testANullModelValueIsNothingSaidAndAnEmptyStringIsAValue(): void
    {
        self::assertSame(['profile'], self::currentValues($this->render(['items' => self::ITEMS, 'model-value' => null, 'default-value' => 'profile'])));

        $empty = $this->render(['items' => self::ITEMS, 'model-value' => '', 'default-value' => 'profile']);
        self::assertSame([], self::currentValues($empty));
        self::assertSame(['upcoming', 'upcoming', 'upcoming'], self::states($empty));
        self::assertSame('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;', self::style($empty));
    }

    public function testAnUnknownModelValueLeavesNoStepCurrent(): void
    {
        $html = $this->render(['items' => self::ITEMS, 'model-value' => 'missing']);

        self::assertSame([], self::currentValues($html));
        self::assertSame(['upcoming', 'upcoming', 'upcoming'], self::states($html));
        self::assertStringNotContainsString('vf-stepper__trigger--current', $html);
        self::assertSame('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;', self::style($html));
    }

    public function testADisabledSeedIsKeptAsTheActiveValueWithoutBeingCurrent(): void
    {
        $html = $this->render(['items' => self::items(['profile']), 'default-value' => 'profile']);

        self::assertSame([], self::currentValues($html));
        self::assertSame(['complete', 'disabled', 'upcoming'], self::states($html));
        self::assertSame('--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0.5;', self::style($html));
    }

    public function testEveryItemDisabledLeavesNothingCurrent(): void
    {
        $html = $this->render(['items' => self::items(['account', 'profile', 'confirm'])]);

        self::assertSame([], self::currentValues($html));
        self::assertSame(['disabled', 'disabled', 'disabled'], self::states($html));
        self::assertSame(3, substr_count($html, ' disabled>'));
    }

    // ------------------------------------------------------------ state

    public function testDisabledBeatsEveryOtherState(): void
    {
        self::assertSame(['disabled', 'complete', 'current'], self::states($this->render(['items' => self::items(['account']), 'default-value' => 'confirm'])));
        self::assertSame(['current', 'upcoming', 'disabled'], self::states($this->render(['items' => self::items(['confirm'])])));
        self::assertSame(['current', 'disabled', 'upcoming'], self::states($this->render(['items' => self::items(['profile'])])));
    }

    public function testADisabledTriggerCarriesTheNativeAttributeOnly(): void
    {
        $html = $this->render(['items' => self::items(['profile'])]);

        self::assertStringContainsString(
            '<button type="button" class="vf-stepper__trigger" data-vf-stepper-value="profile" disabled>',
            $html,
        );
        self::assertStringNotContainsString('aria-disabled', $html);
        self::assertSame(self::list(['current', 'disabled', 'upcoming'], ['profile']), substr($html, strpos($html, '<ol'), -6));
    }

    public function testAriaCurrentIsWrittenOnTheCurrentTriggerOnly(): void
    {
        $html = $this->render(['items' => self::ITEMS, 'default-value' => 'confirm']);

        self::assertSame(1, substr_count($html, 'aria-current'));
        self::assertSame(1, substr_count($html, 'vf-stepper__trigger--current'));
        self::assertStringContainsString('data-vf-stepper-value="confirm" aria-current="step"', $html);
        self::assertStringNotContainsString('aria-current="false"', $html);
        self::assertStringNotContainsString('aria-current="true"', $html);
    }

    // ------------------------------------------------------------ root style

    /** @return iterable<string, array{int, string, string}> */
    public static function factors(): iterable
    {
        yield 'two, first' => [2, 's0', '0'];
        yield 'two, second' => [2, 's1', '1'];
        yield 'three, middle' => [3, 's1', '0.5'];
        yield 'four, second: sixteen digits' => [4, 's1', '0.3333333333333333'];
        yield 'four, third' => [4, 's2', '0.6666666666666666'];
        yield 'seven, second: seventeen digits' => [7, 's1', '0.16666666666666666'];
        yield 'seven, sixth: rounded up' => [7, 's5', '0.8333333333333334'];
        yield 'seven, last' => [7, 's6', '1'];
    }

    /** @dataProvider factors */
    public function testTheProgressFactorIsWrittenAsJavaScriptWritesIt(int $count, string $value, string $factor): void
    {
        $items = [];
        for ($index = 0; $index < $count; $index++) {
            $items[] = ['value' => 's' . $index, 'label' => 'Step ' . ($index + 1)];
        }

        self::assertSame(
            '--vf-stepper-item-count: ' . $count . '; --vf-stepper-progress-factor: ' . $factor . ';',
            self::style($this->render(['items' => $items, 'model-value' => $value])),
        );
    }

    public function testASingleItemWritesTheCountOnly(): void
    {
        self::assertSame('--vf-stepper-item-count: 1;', self::style($this->render(['items' => [self::ITEMS[0]]])));
    }

    public function testAConsumerStyleFollowsTheCustomProperties(): void
    {
        self::assertSame(
            '--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0; margin-block-end: 24px;',
            self::style($this->render(['items' => self::ITEMS, 'style' => 'margin-block-end: 24px'])),
        );
    }

    // ------------------------------------------------------------ layout

    /** @return iterable<string, array{?string, ?string, string}> */
    public static function layouts(): iterable
    {
        yield 'default' => [null, null, 'vf-stepper--horizontal vf-stepper--content-below'];
        yield 'horizontal above' => ['horizontal', 'above', 'vf-stepper--horizontal vf-stepper--content-above'];
        yield 'horizontal start falls back' => ['horizontal', 'start', 'vf-stepper--horizontal vf-stepper--content-below'];
        yield 'vertical' => ['vertical', null, 'vf-stepper--vertical vf-stepper--content-end'];
        yield 'vertical start' => ['vertical', 'start', 'vf-stepper--vertical vf-stepper--content-start'];
        yield 'vertical above falls back' => ['vertical', 'above', 'vf-stepper--vertical vf-stepper--content-end'];
    }

    /** @dataProvider layouts */
    public function testOrientationAndContentPositionResolveToTheRootClasses(?string $orientation, ?string $position, string $classes): void
    {
        $props = ['items' => self::ITEMS];
        if ($orientation !== null) {
            $props['orientation'] = $orientation;
        }
        if ($position !== null) {
            $props['content-position'] = $position;
        }

        self::assertStringContainsString('<nav class="vf-stepper ' . $classes . '"', $this->render($props));
        if ($position !== null) {
            unset($props['content-position']);
            $props['contentPosition'] = $position;
            self::assertStringContainsString('<nav class="vf-stepper ' . $classes . '"', $this->render($props));
        }
    }

    public function testAnUnknownOrientationOrPositionIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => self::ITEMS, 'orientation' => 'diagonal']);
    }

    // ------------------------------------------------------------ attrs

    public function testTheAccessibleNameDefaultsToProgressAndIsAProp(): void
    {
        self::assertStringContainsString(' aria-label="Progress"', $this->render(['items' => self::ITEMS]));
        self::assertStringContainsString(' aria-label="Checkout"', $this->render(['items' => self::ITEMS, 'aria-label' => 'Checkout']));
        self::assertStringContainsString(' aria-label="Checkout"', $this->render(['items' => self::ITEMS, 'ariaLabel' => 'Checkout']));
        self::assertSame(1, substr_count($this->render(['items' => self::ITEMS, 'aria-label' => 'Checkout']), 'aria-label='));
    }

    public function testConsumerClassIsAppendedAndOtherAttributesLandOnTheNavOnly(): void
    {
        $html = $this->render([
            'items' => self::ITEMS,
            'class' => 'checkout-steps',
            'id' => 'steps',
            'data-testid' => 'steps',
            'role' => 'group',
            'aria-current' => 'page',
        ]);

        self::assertStringContainsString(
            '<nav class="vf-stepper vf-stepper--horizontal vf-stepper--content-below checkout-steps"'
                . ' style="--vf-stepper-item-count: 3; --vf-stepper-progress-factor: 0;" aria-label="Progress"'
                . ' data-vf-razor="stepper" id="steps" data-testid="steps" role="group" aria-current="page">',
            $html,
        );
        // The consumer aria-current is on the nav; the trigger keeps its own.
        self::assertSame(2, substr_count($html, 'aria-current'));
        self::assertSame(['account'], self::currentValues($html));
        self::assertStringContainsString('<ol class="vf-stepper__list"><li class="vf-stepper__item', $html);
        self::assertSame(1, substr_count($html, ' id='));
    }

    public function testANonScalarAttributeIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => self::ITEMS, 'data-meta' => ['a' => 1]]);
    }

    // ------------------------------------------------------------ items validation

    public function testItemsMustBeAList(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => 'account,profile']);
    }

    public function testAnItemWithoutAStringValueIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => [['value' => 1, 'label' => 'One']]]);
    }

    public function testAnItemWithAnUnknownKeyIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => [['value' => 'a', 'label' => 'A', 'icon' => 'check']]]);
    }

    public function testAnItemWithANonBooleanDisabledIsRefused(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->render(['items' => [['value' => 'a', 'label' => 'A', 'disabled' => 'yes']]]);
    }

    // ------------------------------------------------------------ no JavaScript

    public function testTheServerOutputCarriesNoScriptNoFormAndNoLinkToSelect(): void
    {
        $html = $this->render(['items' => self::ITEMS, 'default-value' => 'profile']);

        self::assertStringNotContainsString('<script', $html);
        self::assertStringNotContainsString('<form', $html);
        self::assertStringNotContainsString('<a ', $html);
        self::assertStringNotContainsString('onclick', $html);
        self::assertStringNotContainsString('href', $html);
        self::assertSame(3, substr_count($html, 'type="button"'));
        // The controller mounts on this marker and on nothing else.
        self::assertSame(1, substr_count($html, 'data-vf-razor="stepper"'));
        self::assertStringNotContainsString('data-vf-razor-stepper-enhanced', $html);
    }

    public function testItIsRegisteredBesideTheOtherComponentsAndTakesNoConstructorArgument(): void
    {
        $provider = new VueForgeRazorProvider();
        $components = $provider->components();

        self::assertInstanceOf(StepperComponent::class, $components['stepper']);
        self::assertNull((new \ReflectionClass(StepperComponent::class))->getConstructor());
        self::assertCount(32, $components);
    }
}
