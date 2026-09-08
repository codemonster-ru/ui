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
 * Server-rendered VfField.
 *
 * The assertions deliberately mirror
 * packages/core/src/components/field/VfField.characterization.spec.ts case for
 * case. Where that file records what the historical Vue component does, this
 * one records that the Razor component does the same thing, so the two can be
 * read side by side. The browser-level proof that they agree is the parity
 * gate; this suite is what fails first, and points at the attribute.
 */
final class FieldComponentTest extends TestCase
{
    protected function setUp(): void
    {
        FieldIds::reset();
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, callable(): RenderedHtml> $slots
     */
    private function render(array $props = [], array $slots = []): string
    {
        $registry = new ComponentRegistry();
        $registry->register(new VueForgeRazorProvider());
        $component = $registry->resolve('vf-field');
        self::assertNotNull($component, 'The vf-field component must be registered by the provider.');

        return $component->render(new ComponentRenderContext($props, $slots))->value();
    }

    /** A slot rendering a real vf-input, which is what the field is for. */
    private function inputSlot(array $inputProps = []): callable
    {
        return static function () use ($inputProps): RenderedHtml {
            $registry = new ComponentRegistry();
            $registry->register(new VueForgeRazorProvider());

            return $registry->resolve('vf-input')->render(new ComponentRenderContext($inputProps, []));
        };
    }

    /** A slot rendering something inert, which never opts into floating. */
    private function inertSlot(): callable
    {
        return static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<span class="inert"></span>');
    }

    /**
     * @param array<string, mixed> $props
     * @param array<string, callable(): RenderedHtml> $slots
     */
    private function field(array $props = [], array $slots = []): DOMElement
    {
        $slots = $slots === [] ? ['default' => $this->inputSlot()] : $slots;
        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'
            . $this->render($props, $slots) . '</body></html>',
            LIBXML_NOERROR,
        ));
        $field = (new DOMXPath($document))->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field ")]')?->item(0);
        self::assertInstanceOf(DOMElement::class, $field);

        return $field;
    }

    public function testRendersADivRootCarryingTheCanonicalClass(): void
    {
        $field = $this->field();

        self::assertSame('div', $field->tagName);
        self::assertSame('vf-field', $field->getAttribute('class'));
    }

    public function testRendersNoLabelDescriptionOrErrorWhenGivenNone(): void
    {
        $markup = $this->render([], ['default' => $this->inputSlot()]);

        self::assertStringNotContainsString('vf-field__label', $markup);
        self::assertStringNotContainsString('vf-field__description', $markup);
        self::assertStringNotContainsString('vf-field__error', $markup);
    }

    public function testPlacesATopLabelBeforeTheControlAsASibling(): void
    {
        $field = $this->field(['label' => 'Workspace']);
        $children = [];

        foreach ($field->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $children[] = $child->tagName . '.' . $child->getAttribute('class');
            }
        }

        self::assertSame(['label.vf-field__label', 'div.vf-field__control'], $children);
    }

    public function testPointsTheLabelAtTheControlItWraps(): void
    {
        $field = $this->field(['label' => 'Workspace']);
        $for = $field->getElementsByTagName('label')->item(0)?->getAttribute('for');
        $input = $field->getElementsByTagName('input')->item(0);

        self::assertNotSame('', $for);
        self::assertInstanceOf(DOMElement::class, $input);
        self::assertSame($for, $input->getAttribute('id'));
    }

    public function testAnExplicitControlIdWinsOverTheGeneratedOne(): void
    {
        $field = $this->field(['label' => 'Workspace', 'control-id' => 'workspace-name']);

        self::assertSame('workspace-name', $field->getElementsByTagName('label')->item(0)?->getAttribute('for'));
        self::assertSame('workspace-name', $field->getElementsByTagName('input')->item(0)?->getAttribute('id'));
    }

    public function testAnExplicitControlIdOnTheInputWinsOverTheField(): void
    {
        // The consumer keeps the final say Vue gives them through the slot scope.
        $field = $this->field(['label' => 'Workspace'], ['default' => $this->inputSlot(['id' => 'chosen'])]);

        self::assertSame('chosen', $field->getElementsByTagName('input')->item(0)?->getAttribute('id'));
    }

    public function testTwoFieldsOnOnePageDoNotShareIds(): void
    {
        $markup = $this->render(['label' => 'First', 'description' => 'One'], ['default' => $this->inputSlot()])
            . $this->render(['label' => 'Second', 'description' => 'Two'], ['default' => $this->inputSlot()]);

        $document = new DOMDocument();
        self::assertTrue($document->loadHTML(
            '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' . $markup . '</body></html>',
            LIBXML_NOERROR,
        ));

        $ids = [];
        foreach ((new DOMXPath($document))->query('//*[@id]') as $node) {
            self::assertInstanceOf(DOMElement::class, $node);
            $ids[] = $node->getAttribute('id');
        }

        self::assertCount(4, $ids, 'Two fields should contribute two controls and two descriptions.');
        self::assertSame($ids, array_unique($ids), 'Generated ids collided across fields.');

        // And each label reaches its own control rather than the other field's.
        foreach ((new DOMXPath($document))->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field ")]') as $field) {
            self::assertInstanceOf(DOMElement::class, $field);
            $for = $field->getElementsByTagName('label')->item(0)?->getAttribute('for');
            self::assertSame($for, $field->getElementsByTagName('input')->item(0)?->getAttribute('id'));
        }
    }

    public function testDescribesTheControlWithTheDescriptionThenTheError(): void
    {
        $field = $this->field(['label' => 'L', 'description' => 'Shown to collaborators', 'error' => 'Taken']);
        $description = (new DOMXPath($field->ownerDocument))
            ->query('//p[@class="vf-field__description"]')?->item(0);
        $error = (new DOMXPath($field->ownerDocument))->query('//p[@class="vf-field__error"]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $description);
        self::assertInstanceOf(DOMElement::class, $error);
        self::assertSame(
            $description->getAttribute('id') . ' ' . $error->getAttribute('id'),
            $field->getElementsByTagName('input')->item(0)?->getAttribute('aria-describedby'),
        );
    }

    public function testOmitsDescribedByWhenThereIsNeitherDescriptionNorError(): void
    {
        $field = $this->field(['label' => 'L']);

        self::assertFalse($field->getElementsByTagName('input')->item(0)?->hasAttribute('aria-describedby'));
    }

    public function testOrdersDescriptionBeforeErrorBothAfterTheControl(): void
    {
        $field = $this->field(['label' => 'L', 'description' => 'D', 'error' => 'E']);
        $children = [];

        foreach ($field->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $children[] = $child->getAttribute('class');
            }
        }

        self::assertSame(
            ['vf-field__label', 'vf-field__control', 'vf-field__description', 'vf-field__error'],
            $children,
        );
    }

    public function testAnErrorMakesTheFieldInvalidWithoutTheProp(): void
    {
        self::assertStringContainsString('vf-field--invalid', $this->field(['error' => 'Taken'])->getAttribute('class'));
    }

    public function testTheInvalidPropAloneRendersNoErrorParagraph(): void
    {
        $markup = $this->render(['invalid' => true], ['default' => $this->inputSlot()]);

        self::assertStringContainsString('vf-field--invalid', $markup);
        self::assertStringNotContainsString('vf-field__error', $markup);
    }

    public function testTheFieldItselfNeverCarriesAriaDescribedby(): void
    {
        $field = $this->field(['description' => 'D']);

        self::assertFalse($field->hasAttribute('aria-describedby'));
    }

    public function testRendersNoRequiredMarkerByDefault(): void
    {
        self::assertStringNotContainsString(
            'vf-field__required-mark',
            $this->render(['label' => 'L'], ['default' => $this->inputSlot()]),
        );
    }

    public function testRendersAnAriaHiddenAsteriskInsideTheLabelWhenRequired(): void
    {
        $field = $this->field(['label' => 'L', 'required' => true]);
        $mark = (new DOMXPath($field->ownerDocument))->query('//span[@class="vf-field__required-mark"]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $mark);
        self::assertSame('*', $mark->textContent);
        self::assertSame('true', $mark->getAttribute('aria-hidden'));
        self::assertSame('vf-field__label', $mark->parentNode?->getAttribute('class'));
    }

    public function testRendersNoMarkerWhenRequiredButThereIsNoLabelToCarryIt(): void
    {
        self::assertStringNotContainsString(
            'vf-field__required-mark',
            $this->render(['required' => true], ['default' => $this->inputSlot()]),
        );
    }

    public function testDoesNotFloatWithoutAControlThatSupportsIt(): void
    {
        // The quirk a port is most likely to get wrong: the placement alone is
        // not enough, the control has to opt in.
        $field = $this->field(['label' => 'L', 'label-placement' => 'floating'], ['default' => $this->inertSlot()]);

        self::assertSame('vf-field', $field->getAttribute('class'));
        self::assertSame(
            'vf-field__label',
            $field->getElementsByTagName('label')->item(0)?->getAttribute('class'),
        );
    }

    public function testFloatsWhenTheControlOptsInMovingTheLabelInsideTheControl(): void
    {
        $field = $this->field(['label' => 'L', 'label-placement' => 'floating']);
        $control = (new DOMXPath($field->ownerDocument))
            ->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field__control ")]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertStringContainsString('vf-field--floating', $field->getAttribute('class'));
        self::assertStringContainsString('vf-field--floating-in', $field->getAttribute('class'));
        self::assertStringContainsString('vf-field__control--floating', $control->getAttribute('class'));

        $tags = [];
        foreach ($control->childNodes as $child) {
            if ($child instanceof DOMElement) {
                $tags[] = $child->tagName;
            }
        }

        self::assertSame(['input', 'label'], $tags, 'The floating label follows the control.');
        self::assertSame(
            'vf-field__label vf-field__label--floating',
            $control->getElementsByTagName('label')->item(0)?->getAttribute('class'),
        );
    }

    public function testDoesNotFloatAFieldWithNoLabel(): void
    {
        $field = $this->field(['label-placement' => 'floating']);

        self::assertSame('vf-field', $field->getAttribute('class'));
    }

    public function testEmitsTheRequestedFloatingVariant(): void
    {
        $field = $this->field(['label' => 'L', 'label-placement' => 'floating', 'floating-variant' => 'over']);

        self::assertStringContainsString('vf-field--floating-over', $field->getAttribute('class'));
    }

    public function testMarksTheControlFilledWhenTheInputHasAValue(): void
    {
        $field = $this->field(
            ['label' => 'L', 'label-placement' => 'floating'],
            ['default' => $this->inputSlot(['value' => 'Acme'])],
        );
        $control = (new DOMXPath($field->ownerDocument))
            ->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field__control ")]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertStringContainsString('vf-field__control--filled', $control->getAttribute('class'));
    }

    public function testTracksFilledIndependentlyOfFloating(): void
    {
        $field = $this->field(['label' => 'L'], ['default' => $this->inputSlot(['value' => 'Acme'])]);
        $control = (new DOMXPath($field->ownerDocument))
            ->query('//div[contains(concat(" ", normalize-space(@class), " "), " vf-field__control ")]')?->item(0);

        self::assertInstanceOf(DOMElement::class, $control);
        self::assertStringContainsString('vf-field__control--filled', $control->getAttribute('class'));
    }

    public function testEmitsClassesInTheReferenceOrder(): void
    {
        $field = $this->field(['label' => 'L', 'label-placement' => 'floating', 'invalid' => true]);

        self::assertSame(
            'vf-field vf-field--invalid vf-field--floating vf-field--floating-in',
            $field->getAttribute('class'),
        );
    }

    public function testMergesAConsumerClassOntoTheRoot(): void
    {
        $field = $this->field(['label' => 'L', 'class' => 'consumer-field']);

        self::assertSame('vf-field consumer-field', $field->getAttribute('class'));
    }

    public function testFallsConsumerStyleAndDataAttributesThroughToTheRoot(): void
    {
        $field = $this->field(['label' => 'L', 'style' => 'margin-top: 8px', 'data-testid' => 'field']);

        self::assertSame('margin-top: 8px', $field->getAttribute('style'));
        self::assertSame('field', $field->getAttribute('data-testid'));
    }

    public function testTheFieldPropagatesItsInvalidStateToTheControl(): void
    {
        $field = $this->field(['label' => 'L', 'error' => 'Taken']);
        $input = $field->getElementsByTagName('input')->item(0);

        self::assertInstanceOf(DOMElement::class, $input);
        self::assertStringContainsString('vf-input--invalid', $input->getAttribute('class'));
        self::assertSame('true', $input->getAttribute('aria-invalid'));
    }

    public function testTheControlCarriesTheFloatingModifierFromThePlacementAlone(): void
    {
        // Vue's VfInput reads the placement, not whether the field floated, so
        // a label-less floating field still marks the control.
        $field = $this->field(['label-placement' => 'floating']);
        $input = $field->getElementsByTagName('input')->item(0);

        self::assertInstanceOf(DOMElement::class, $input);
        self::assertStringContainsString('vf-input--floating', $input->getAttribute('class'));
        self::assertSame('vf-field', $field->getAttribute('class'));
    }

    public function testMarksOnlyAFieldWhoseControlWiredItselfUpForEnhancement(): void
    {
        self::assertSame('field', $this->field(['label' => 'L'])->getAttribute('data-vf-razor'));
        self::assertFalse(
            $this->field(['label' => 'L'], ['default' => $this->inertSlot()])->hasAttribute('data-vf-razor'),
        );
    }

    public function testEscapesEveryConsumerSuppliedValue(): void
    {
        $markup = $this->render([
            'label' => '<script>alert(1)</script>',
            'description' => '"quoted" & <b>bold</b>',
            'error' => "it's broken",
            'control-id' => 'a"b',
        ], ['default' => $this->inputSlot()]);

        self::assertStringNotContainsString('<script>', $markup);
        self::assertStringContainsString('&lt;script&gt;', $markup);
        self::assertStringContainsString('&quot;quoted&quot; &amp; &lt;b&gt;bold&lt;/b&gt;', $markup);
        self::assertStringContainsString('&#039;', $markup);
        self::assertStringContainsString('for="a&quot;b"', $markup);
    }
}
