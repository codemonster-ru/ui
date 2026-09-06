<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfInput.
 *
 * Assertions read the parsed DOM rather than comparing whole strings, so a
 * meaningful change fails on the element or attribute that moved instead of on
 * an opaque snapshot.
 */
final class InputComponentTest extends TestCase
{
    /**
     * @param array<string, mixed> $props
     * @param array<string, string> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-input');
        self::assertNotNull($component, 'The vf-input component must be registered by the provider.');

        $slotClosures = [];
        foreach ($slots as $name => $markup) {
            $slotClosures[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($markup);
        }

        return $component->render(new ComponentRenderContext($props, $slotClosures))->value();
    }

    /** @param array<string, mixed> $props */
    private function query(array $props = [], array $slots = []): DOMXPath
    {
        // The charset meta is required: DOMDocument otherwise decodes the
        // markup as ISO-8859-1 and mangles UTF-8 attribute values.
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
                . $this->render($props, $slots)
                . '</body></html>',
            LIBXML_NOERROR,
        ));

        return new DOMXPath($document);
    }

    private function input(DOMXPath $xpath): DOMElement
    {
        $node = $xpath->query('//input')->item(0);
        self::assertInstanceOf(DOMElement::class, $node);

        return $node;
    }

    public function testPlainInputRendersABareNativeControl(): void
    {
        $xpath = $this->query(['name' => 'workspace']);

        self::assertSame(0, $xpath->query('//div')->length, 'A bare input must not be wrapped.');
        $input = $this->input($xpath);
        self::assertSame('vf-input', $input->getAttribute('class'));
        self::assertSame('workspace', $input->getAttribute('name'));
        self::assertSame('', $input->getAttribute('value'));
        self::assertFalse($input->hasAttribute('data-vf-filled'));
        self::assertFalse($input->hasAttribute('aria-invalid'));
        self::assertSame('input', $input->getAttribute('data-vf-razor'));
    }

    public function testValueMarksTheControlFilled(): void
    {
        $input = $this->input($this->query(['value' => 'Acme']));

        self::assertSame('Acme', $input->getAttribute('value'));
        self::assertSame('true', $input->getAttribute('data-vf-filled'));
    }

    public function testSizeAddsAModifierOnlyWhenItIsNotTheDefault(): void
    {
        self::assertSame('vf-input', $this->input($this->query(['size' => 'md']))->getAttribute('class'));
        self::assertSame('vf-input vf-input--sm', $this->input($this->query(['size' => 'sm']))->getAttribute('class'));
        self::assertSame('vf-input vf-input--lg', $this->input($this->query(['size' => 'lg']))->getAttribute('class'));
    }

    public function testInvalidExposesTheModifierAndAriaInvalid(): void
    {
        $input = $this->input($this->query(['invalid' => true]));

        self::assertStringContainsString('vf-input--invalid', $input->getAttribute('class'));
        self::assertSame('true', $input->getAttribute('aria-invalid'));
    }

    public function testNativeFormAttributesAreForwardedToTheControl(): void
    {
        $input = $this->input($this->query([
            'id' => 'workspace-name',
            'name' => 'workspace',
            'placeholder' => 'Acme',
            'autocomplete' => 'organization',
            'required' => true,
            'maxlength' => '32',
            'aria-describedby' => 'workspace-hint',
            'data-testid' => 'workspace-input',
        ]));

        self::assertSame('workspace-name', $input->getAttribute('id'));
        self::assertSame('workspace', $input->getAttribute('name'));
        self::assertSame('Acme', $input->getAttribute('placeholder'));
        self::assertSame('organization', $input->getAttribute('autocomplete'));
        self::assertTrue($input->hasAttribute('required'));
        self::assertSame('32', $input->getAttribute('maxlength'));
        self::assertSame('workspace-hint', $input->getAttribute('aria-describedby'));
        self::assertSame('workspace-input', $input->getAttribute('data-testid'));
    }

    public function testNumericRangeAttributesSurviveWithoutNormalisingTheType(): void
    {
        $input = $this->input($this->query([
            'type' => 'number',
            'value' => '5',
            'min' => '0',
            'max' => '10',
            'step' => '0.5',
        ]));

        self::assertSame('number', $input->getAttribute('type'));
        self::assertSame('0', $input->getAttribute('min'));
        self::assertSame('10', $input->getAttribute('max'));
        self::assertSame('0.5', $input->getAttribute('step'));
    }

    /** @return list<array{string}> */
    public static function nativeTypeProvider(): array
    {
        return array_map(
            static fn (string $type): array => [$type],
            ['text', 'email', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'time', 'password', 'color'],
        );
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('nativeTypeProvider')]
    public function testNativeTypesPassThroughUnchanged(string $type): void
    {
        self::assertSame($type, $this->input($this->query(['type' => $type]))->getAttribute('type'));
    }

    public function testDisabledAndReadonlyRenderAsNativeBooleanAttributes(): void
    {
        $disabled = $this->input($this->query(['disabled' => true, 'value' => 'x', 'clearable' => true]));
        self::assertTrue($disabled->hasAttribute('disabled'));

        $readonly = $this->input($this->query(['readonly' => true, 'value' => 'x', 'clearable' => true]));
        self::assertTrue($readonly->hasAttribute('readonly'));

        $enabled = $this->input($this->query(['disabled' => false, 'readonly' => false]));
        self::assertFalse($enabled->hasAttribute('disabled'));
        self::assertFalse($enabled->hasAttribute('readonly'));
    }

    public function testLeadingAndTrailingIconsRenderInAriaHiddenAdornments(): void
    {
        $xpath = $this->query(['leading-icon' => 'eye', 'trailing-icon' => 'xmark']);

        $leading = $xpath->query('//span[contains(@class, "vf-input-wrap__icon--leading")]')->item(0);
        $trailing = $xpath->query('//span[contains(@class, "vf-input-wrap__icon--trailing")]')->item(0);
        self::assertInstanceOf(DOMElement::class, $leading);
        self::assertInstanceOf(DOMElement::class, $trailing);
        self::assertSame('true', $leading->getAttribute('aria-hidden'));
        self::assertSame('true', $trailing->getAttribute('aria-hidden'));
        self::assertSame(1, $xpath->query('.//svg', $leading)->length);

        $input = $this->input($xpath);
        self::assertStringContainsString('vf-input--with-leading', $input->getAttribute('class'));
        self::assertStringContainsString('vf-input--with-trailing', $input->getAttribute('class'));
    }

    public function testSlotContentReplacesTheIconPropInsideTheAdornment(): void
    {
        $xpath = $this->query(
            ['leading-icon' => 'eye'],
            ['leading' => '<span class="consumer-leading">@</span>'],
        );

        $leading = $xpath->query('//span[contains(@class, "vf-input-wrap__icon--leading")]')->item(0);
        self::assertInstanceOf(DOMElement::class, $leading);
        self::assertSame(0, $xpath->query('.//svg', $leading)->length);
        self::assertSame(1, $xpath->query('.//span[@class="consumer-leading"]', $leading)->length);
    }

    public function testAnUnknownIconNameFailsLoudlyInsteadOfRenderingNothing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/Unknown VueForge Razor icon \[magnifyingGlass\]/');

        $this->render(['leading-icon' => 'magnifyingGlass']);
    }

    public function testClearableRendersAnInertActionUntilTheControllerEnablesIt(): void
    {
        $xpath = $this->query(['clearable' => true, 'value' => 'hello']);

        $clear = $xpath->query('//button[@data-vf-razor-input="clear"]')->item(0);
        self::assertInstanceOf(DOMElement::class, $clear);
        self::assertSame('button', $clear->getAttribute('type'));
        self::assertSame('Clear input', $clear->getAttribute('aria-label'));
        self::assertTrue($clear->hasAttribute('hidden'), 'The clear action must be hidden before enhancement.');
        self::assertTrue($clear->hasAttribute('disabled'), 'The clear action must be inert before enhancement.');
        self::assertStringContainsString('vf-icon-button', $clear->getAttribute('class'));
        self::assertStringContainsString('vf-input-wrap__clear', $clear->getAttribute('class'));
    }

    public function testActionModifierClassesAreWithheldUntilEnhancement(): void
    {
        $xpath = $this->query(['clearable' => true, 'value' => 'hello']);
        $wrapper = $xpath->query('//div')->item(0);
        self::assertInstanceOf(DOMElement::class, $wrapper);

        // No trailing control is usable yet, so the geometry classes that
        // reserve space for one are not applied.
        self::assertSame('vf-input-wrap', $wrapper->getAttribute('class'));
        self::assertSame('vf-input', $this->input($xpath)->getAttribute('class'));
    }

    public function testPasswordRevealRendersAnInertToggleAndKeepsThePasswordType(): void
    {
        $xpath = $this->query(['password-reveal' => true, 'type' => 'password', 'value' => 'secret']);

        self::assertSame('password', $this->input($xpath)->getAttribute('type'));
        $toggle = $xpath->query('//button[@data-vf-razor-input="password-reveal"]')->item(0);
        self::assertInstanceOf(DOMElement::class, $toggle);
        self::assertSame('Show password', $toggle->getAttribute('aria-label'));
        self::assertSame('false', $toggle->getAttribute('aria-pressed'));
        self::assertTrue($toggle->hasAttribute('hidden'));
        self::assertTrue($toggle->hasAttribute('disabled'));
    }

    public function testPasswordRevealIsNotOfferedForOtherTypes(): void
    {
        $xpath = $this->query(['password-reveal' => true, 'type' => 'text']);

        self::assertSame(0, $xpath->query('//button[@data-vf-razor-input="password-reveal"]')->length);
    }

    public function testConsumerClassAndStyleLandOnTheInputWhenBare(): void
    {
        $input = $this->input($this->query(['class' => 'consumer-class', 'style' => 'margin-top: 4px;']));

        self::assertSame('vf-input consumer-class', $input->getAttribute('class'));
        self::assertSame('margin-top: 4px;', $input->getAttribute('style'));
    }

    public function testConsumerClassAndStyleMoveToTheWrapperWhenAdorned(): void
    {
        $xpath = $this->query([
            'leading-icon' => 'eye',
            'class' => 'consumer-class',
            'style' => 'margin-top: 4px;',
        ]);

        $wrapper = $xpath->query('//div')->item(0);
        self::assertInstanceOf(DOMElement::class, $wrapper);
        self::assertStringContainsString('consumer-class', $wrapper->getAttribute('class'));
        self::assertSame('margin-top: 4px;', $wrapper->getAttribute('style'));

        $input = $this->input($xpath);
        self::assertStringNotContainsString('consumer-class', $input->getAttribute('class'));
        self::assertFalse($input->hasAttribute('style'));
    }

    public function testEveryRazorRootCarriesTheOwnershipMarker(): void
    {
        self::assertSame('input', $this->input($this->query())->getAttribute('data-vf-razor'));

        $adorned = $this->query(['leading-icon' => 'eye']);
        $wrapper = $adorned->query('//div')->item(0);
        self::assertInstanceOf(DOMElement::class, $wrapper);
        self::assertSame('input', $wrapper->getAttribute('data-vf-razor'));
        self::assertFalse($this->input($adorned)->hasAttribute('data-vf-razor'));
    }

    public function testMultipleInstancesRenderIndependently(): void
    {
        $first = $this->render(['name' => 'first', 'value' => 'alpha']);
        $second = $this->render(['name' => 'second']);

        self::assertStringContainsString('value="alpha"', $first);
        self::assertStringContainsString('data-vf-filled="true"', $first);
        self::assertStringNotContainsString('data-vf-filled', $second);
    }

    public function testCustomActionLabelsAreHonoured(): void
    {
        $xpath = $this->query([
            'clearable' => true,
            'password-reveal' => true,
            'type' => 'password',
            'value' => 'secret',
            'clear-label' => 'Очистить',
            'show-password-label' => 'Показать пароль',
        ]);

        $clear = $xpath->query('//button[@data-vf-razor-input="clear"]')->item(0);
        $toggle = $xpath->query('//button[@data-vf-razor-input="password-reveal"]')->item(0);
        self::assertInstanceOf(DOMElement::class, $clear);
        self::assertInstanceOf(DOMElement::class, $toggle);
        self::assertSame('Очистить', $clear->getAttribute('aria-label'));
        self::assertSame('Показать пароль', $toggle->getAttribute('aria-label'));
    }
}
