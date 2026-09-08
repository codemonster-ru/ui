<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\VueForge\Razor\Support\FieldIds;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use DOMDocument;
use DOMElement;
use DOMXPath;
use PHPUnit\Framework\TestCase;

/**
 * Server-rendered VfTextarea.
 *
 * The assertions deliberately mirror
 * packages/core/src/components/textarea/VfTextarea.characterization.spec.ts
 * case for case. The escaping tests have no Vue counterpart on purpose: Vue
 * never puts this value in markup, so only the PHP adapter can get it wrong.
 */
final class TextareaComponentTest extends TestCase
{
    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /** @param array<string, mixed> $props */
    private function render(array $props = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-textarea');
        self::assertNotNull($component, 'The vf-textarea component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, []))->value();
    }

    /** @param array<string, mixed> $props */
    private function control(array $props = []): DOMElement
    {
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($props) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $control = (new DOMXPath($document))->query('//textarea')?->item(0);
        self::assertInstanceOf(DOMElement::class, $control);

        return $control;
    }

    /** Renders the control inside a real vf-field. */
    private function inField(array $fieldProps, array $controlProps = []): DOMElement
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $field = $registry->resolve('vf-field');
        $textarea = $registry->resolve('vf-textarea');

        $markup = $field->render(new ComponentRenderContext($fieldProps, [
            'default' => static fn (): RenderedHtml => $textarea->render(
                new ComponentRenderContext($controlProps, []),
            ),
        ]))->value();

        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $markup . '</body></html>',
            LIBXML_NOERROR,
        ));
        $root = (new DOMXPath($document))
            ->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field ")]')?->item(0);
        self::assertInstanceOf(DOMElement::class, $root);

        return $root;
    }

    public function testRendersANativeTextareaElement(): void
    {
        self::assertSame('textarea', $this->control()->tagName);
    }

    public function testCarriesOnlyTheCanonicalClassAtTheDefaultSize(): void
    {
        self::assertSame('vf-textarea', $this->control()->getAttribute('class'));
        self::assertSame('vf-textarea', $this->control(['size' => 'md'])->getAttribute('class'));
    }

    public function testEmitsAModifierForTheTwoNonDefaultSizes(): void
    {
        foreach (['sm', 'lg'] as $size) {
            self::assertStringContainsString(
                'vf-textarea--' . $size,
                $this->control(['size' => $size])->getAttribute('class'),
            );
        }
    }

    public function testStartsEmptyUnfilledAndValid(): void
    {
        $control = $this->control();

        self::assertSame('', $control->textContent);
        self::assertFalse($control->hasAttribute('data-vf-filled'));
        self::assertFalse($control->hasAttribute('aria-invalid'));
    }

    public function testRendersTheValueAsElementTextRatherThanAnAttribute(): void
    {
        // The native form. HTML defines no value attribute for textarea, and
        // element text is the only place an initial value survives without JS.
        $control = $this->control(['value' => 'Release notes']);

        self::assertSame('Release notes', $control->textContent);
        self::assertFalse($control->hasAttribute('value'));
    }

    public function testRendersAMultilineValueWithItsNewlinesIntact(): void
    {
        self::assertSame("first\nsecond\nthird", $this->control(['value' => "first\nsecond\nthird"])->textContent);
    }

    public function testKeepsMarkupLikeTextAsTextRatherThanMarkup(): void
    {
        $value = '<script>alert(1)</script> & "quoted" & \'single\' <b>bold</b>';
        $markup = $this->render(['value' => $value]);
        $control = $this->control(['value' => $value]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringNotContainsString('<b>', $markup);
        self::assertStringContainsString('&lt;script&gt;', $markup);
        self::assertStringContainsString('&amp;', $markup);
        // Round-trips: what the browser reads back is exactly what went in.
        self::assertSame($value, $control->textContent);
        self::assertNull($control->ownerDocument->getElementsByTagName('script')->item(0));
    }

    public function testDoesNotLetAValueCloseItsOwnElement(): void
    {
        $control = $this->control(['value' => '</textarea><img src=x onerror=alert(1)>']);

        self::assertSame('</textarea><img src=x onerror=alert(1)>', $control->textContent);
        self::assertNull($control->ownerDocument->getElementsByTagName('img')->item(0));
    }

    public function testMarksItselfFilledOnlyWhenNonEmpty(): void
    {
        self::assertSame('true', $this->control(['value' => 'x'])->getAttribute('data-vf-filled'));
        self::assertFalse($this->control(['value' => ''])->hasAttribute('data-vf-filled'));
    }

    public function testCountsWhitespaceAsFilled(): void
    {
        self::assertSame('true', $this->control(['value' => '   '])->getAttribute('data-vf-filled'));
    }

    public function testExposesAriaInvalidAndTheModifierOnlyWhenInvalid(): void
    {
        $control = $this->control(['invalid' => true]);

        self::assertSame('true', $control->getAttribute('aria-invalid'));
        self::assertStringContainsString('vf-textarea--invalid', $control->getAttribute('class'));
    }

    public function testLetsAConsumerAriaInvalidOverrideTheComponent(): void
    {
        // The quirk: attrs are applied after the component's own bindings.
        self::assertSame(
            'false',
            $this->control(['invalid' => true, 'aria-invalid' => 'false'])->getAttribute('aria-invalid'),
        );
    }

    public function testForwardsNativeTextareaAttributes(): void
    {
        $control = $this->control([
            'rows' => 6,
            'placeholder' => 'Say something',
            'name' => 'notes',
            'maxlength' => 200,
            'minlength' => 2,
            'spellcheck' => 'false',
            'autocomplete' => 'off',
            'wrap' => 'hard',
        ]);

        self::assertSame('6', $control->getAttribute('rows'));
        self::assertSame('Say something', $control->getAttribute('placeholder'));
        self::assertSame('notes', $control->getAttribute('name'));
        self::assertSame('200', $control->getAttribute('maxlength'));
        self::assertSame('2', $control->getAttribute('minlength'));
        self::assertSame('false', $control->getAttribute('spellcheck'));
        self::assertSame('off', $control->getAttribute('autocomplete'));
        self::assertSame('hard', $control->getAttribute('wrap'));
    }

    public function testForwardsDisabledReadonlyAndRequired(): void
    {
        $control = $this->control(['disabled' => true, 'readonly' => true, 'required' => true]);

        self::assertTrue($control->hasAttribute('disabled'));
        self::assertTrue($control->hasAttribute('readonly'));
        self::assertTrue($control->hasAttribute('required'));
    }

    public function testMergesAConsumerClassAndForwardsStyleAndData(): void
    {
        $control = $this->control([
            'class' => 'consumer-textarea',
            'style' => 'min-height: 120px',
            'data-testid' => 'notes',
        ]);

        self::assertSame('vf-textarea consumer-textarea', $control->getAttribute('class'));
        self::assertSame('min-height: 120px', $control->getAttribute('style'));
        self::assertSame('notes', $control->getAttribute('data-testid'));
    }

    public function testTakesItsIdAndDescriptionFromTheFieldItIsInside(): void
    {
        $field = $this->inField(['label' => 'Release notes', 'description' => 'Shown to everyone']);
        $label = $field->getElementsByTagName('label')->item(0);
        $control = $field->getElementsByTagName('textarea')->item(0);
        $description = (new DOMXPath($field->ownerDocument))
            ->query('//p[@class="vf-field__description"]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertInstanceOf(DOMElement::class, $description);
        self::assertSame($label?->getAttribute('for'), $control->getAttribute('id'));
        self::assertSame($description->getAttribute('id'), $control->getAttribute('aria-describedby'));
    }

    public function testAnErroredFieldMakesTheControlInvalid(): void
    {
        $control = $this->inField(['label' => 'Notes', 'error' => 'Required'])
            ->getElementsByTagName('textarea')->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertSame('true', $control->getAttribute('aria-invalid'));
        self::assertStringContainsString('vf-textarea--invalid', $control->getAttribute('class'));
    }

    public function testReportsFilledAndFloatingSupportToItsField(): void
    {
        $field = $this->inField(
            ['label' => 'Notes', 'label-placement' => 'floating'],
            ['value' => 'Shipped it'],
        );
        $wrapper = (new DOMXPath($field->ownerDocument))
            ->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field__control ")]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $wrapper);
        self::assertStringContainsString('vf-field--floating', $field->getAttribute('class'));
        self::assertStringContainsString('vf-field__control--filled', $wrapper->getAttribute('class'));
    }

    public function testCarriesTheFloatingModifierFromThePlacementAlone(): void
    {
        $control = $this->inField(['label-placement' => 'floating'])
            ->getElementsByTagName('textarea')->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertStringContainsString('vf-textarea--floating', $control->getAttribute('class'));
    }

    public function testAnExplicitIdOnTheControlWinsOverTheField(): void
    {
        $field = $this->inField(['label' => 'Notes'], ['id' => 'chosen']);

        self::assertSame('chosen', $field->getElementsByTagName('textarea')->item(0)?->getAttribute('id'));
    }

    public function testCarriesItsOwnEnhancementMarker(): void
    {
        self::assertSame('textarea', $this->control()->getAttribute('data-vf-razor'));
    }
}
