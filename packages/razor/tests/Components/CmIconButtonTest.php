<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmIconButton;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class CmIconButtonTest extends TestCase
{
    private string $cache;

    protected function setUp(): void
    {
        $this->cache = sys_get_temp_dir() . '/codemonster-ui-icon-button-' . bin2hex(random_bytes(6));
    }

    protected function tearDown(): void
    {
        foreach (glob($this->cache . '/*') ?: [] as $file) unlink($file);
        if (is_dir($this->cache)) rmdir($this->cache);
    }

    public function testRendersAccessibleContractDefaultsAndTrustedIcon(): void
    {
        $context = new ComponentRenderContext(
            ['label' => 'Search'],
            ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('<svg></svg>')],
        );

        self::assertSame(
            '<button class="cm-icon-button cm-icon-button--ghost cm-icon-button--md" type="button" aria-label="Search">'
            . '<span class="cm-icon-button__icon" aria-hidden="true"><svg></svg></span></button>',
            $this->button()->render($context)->value(),
        );
    }

    public function testRendersConfigurationAndSafeRootAttributes(): void
    {
        $context = new ComponentRenderContext([
            'label' => 'Delete "item"',
            'variant' => 'danger',
            'size' => 'lg',
            'type' => 'submit',
            'disabled' => true,
            'class' => 'consumer cm-icon-button',
            'data-id' => 'delete',
            'aria-label' => 'Override',
        ], []);

        self::assertSame(
            '<button class="cm-icon-button cm-icon-button--danger cm-icon-button--lg consumer" type="submit"'
            . ' aria-label="Delete &quot;item&quot;" disabled data-id="delete"><span class="cm-icon-button__icon"'
            . ' aria-hidden="true"></span></button>',
            $this->button()->render($context)->value(),
        );
    }

    public function testRejectsMissingLabelAndInvalidFiniteConfiguration(): void
    {
        foreach ([[], ['label' => ' '], ['label' => 'More', 'variant' => 'unknown']] as $props) {
            try {
                $this->button()->render(new ComponentRenderContext($props, []));
                self::fail('Expected invalid IconButton props to be rejected.');
            } catch (InvalidArgumentException) {
                self::addToAssertionCount(1);
            }
        }
    }

    private function button(): CmIconButton
    {
        return new CmIconButton(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->cache,
        ));
    }
}
