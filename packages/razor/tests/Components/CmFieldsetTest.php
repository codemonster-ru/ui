<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmFieldset;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmFieldsetTest extends TestCase
{
    public function testRendersFallbackLegendAndGroupedContent(): void
    {
        $context = new ComponentRenderContext(
            ['id' => 'notifications', 'label' => 'Notifications'],
            [
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(
                    '<input name="email" type="checkbox">',
                ),
            ],
        );

        self::assertSame(
            '<fieldset class="cm-fieldset" id="notifications"><legend class="cm-fieldset__legend">'
            . 'Notifications</legend><div class="cm-fieldset__content">'
            . '<input name="email" type="checkbox"></div></fieldset>',
            $this->fieldset()->render($context)->value(),
        );
    }

    public function testRendersTrustedRegionsAndDeterministicInvalidRelationships(): void
    {
        $context = new ComponentRenderContext(
            [
                'id' => 'contact-method',
                'label' => 'Ignored',
                'description' => 'Ignored description',
                'error' => 'Ignored error',
                'class' => 'consumer',
                'data-test' => 'fieldset',
                'aria-describedby' => 'consumer-description',
                'aria-invalid' => false,
            ],
            [
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<input type="radio">'),
                'legend' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<strong>Contact</strong>'),
                'description' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<em>Choose one</em>'),
                'error' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<strong>Required</strong>'),
            ],
        );

        self::assertSame(
            '<fieldset class="cm-fieldset cm-fieldset--invalid consumer" id="contact-method"'
            . ' aria-describedby="contact-method-description contact-method-error" aria-invalid="true"'
            . ' data-test="fieldset"><legend class="cm-fieldset__legend"><strong>Contact</strong></legend>'
            . '<div class="cm-fieldset__content"><input type="radio"></div>'
            . '<p class="cm-fieldset__description" id="contact-method-description"><em>Choose one</em></p>'
            . '<p class="cm-fieldset__error" id="contact-method-error"><strong>Required</strong></p></fieldset>',
            $this->fieldset()->render($context)->value(),
        );
    }

    /** @return iterable<string, array{array<string, mixed>}> */
    public static function invalidRequiredProps(): iterable
    {
        yield 'missing id' => [['label' => 'Preferences']];
        yield 'blank id' => [['id' => '  ', 'label' => 'Preferences']];
        yield 'missing label' => [['id' => 'preferences']];
        yield 'blank label' => [['id' => 'preferences', 'label' => '  ']];
    }

    /** @param array<string, mixed> $props */
    #[DataProvider('invalidRequiredProps')]
    public function testRejectsMissingOrBlankStableIdentity(array $props): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->fieldset()->render(new ComponentRenderContext($props, []));
    }

    private function fieldset(): CmFieldset
    {
        return new CmFieldset(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-fieldset-' . bin2hex(random_bytes(6)),
        ));
    }
}
