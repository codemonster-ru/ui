<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmField;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmFieldTest extends TestCase
{
    public function testRendersLabelControlAndValidationRegionsInContractOrder(): void
    {
        $context = new ComponentRenderContext(
            [
                'control-id' => 'profile-name',
                'label' => 'Display name',
                'description' => 'Shown publicly.',
                'error' => 'Required.',
                'required' => true,
            ],
            [
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString(
                    '<input id="profile-name" aria-describedby="profile-name-description profile-name-error">',
                ),
            ],
        );

        self::assertSame(
            '<div class="cm-field cm-field--invalid"><label class="cm-field__label" for="profile-name">'
            . 'Display name<span class="cm-field__required" aria-hidden="true">*</span></label>'
            . '<div class="cm-field__control"><input id="profile-name"'
            . ' aria-describedby="profile-name-description profile-name-error"></div>'
            . '<p class="cm-field__description" id="profile-name-description">Shown publicly.</p>'
            . '<p class="cm-field__error" id="profile-name-error">Required.</p></div>',
            $this->field()->render($context)->value(),
        );
    }

    public function testNamedSlotsRemainTrustedComponentContent(): void
    {
        $context = new ComponentRenderContext(
            ['control-id' => 'email', 'label' => '<Fallback>'],
            [
                'default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<input id="email">'),
                'label' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<strong>Email</strong>'),
            ],
        );

        self::assertSame(
            '<div class="cm-field"><label class="cm-field__label" for="email"><strong>Email</strong></label>'
            . '<div class="cm-field__control"><input id="email"></div></div>',
            $this->field()->render($context)->value(),
        );
    }

    private function field(): CmField
    {
        return new CmField(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-field-' . bin2hex(random_bytes(6)),
        ));
    }
}
