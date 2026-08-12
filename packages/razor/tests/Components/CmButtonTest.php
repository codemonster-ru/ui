<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Components\CmButton;
use PHPUnit\Framework\TestCase;

final class CmButtonTest extends TestCase
{
    public function testRendersContractDefaults(): void
    {
        $button = new CmButton();
        $context = new ComponentRenderContext(
            [],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Save')],
        );

        self::assertSame(
            '<button class="cm-button cm-button--primary cm-button--md" type="button">'
            . '<span class="cm-button__label">Save</span></button>',
            $button->render($context)->value(),
        );
    }

    public function testRendersConfigurationAndSafeConsumerAttributes(): void
    {
        $button = new CmButton();
        $context = new ComponentRenderContext([
            'variant' => 'danger',
            'size' => 'lg',
            'type' => 'submit',
            'disabled' => true,
            'class' => 'consumer cm-button',
            'data-id' => '"save"',
        ], []);

        self::assertSame(
            '<button class="cm-button cm-button--danger cm-button--lg consumer" type="submit" disabled'
            . ' data-id="&quot;save&quot;"><span class="cm-button__label"></span></button>',
            $button->render($context)->value(),
        );
    }
}
