<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmCardIntegrationTest extends TestCase
{
    private string $root;
    private string $views;
    private string $cache;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-card-integration-' . bin2hex(random_bytes(6));
        $this->views = $this->root . '/views';
        $this->cache = $this->root . '/cache';
        mkdir($this->views, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersNestedCardsAndComponentsWithEscapedSlotValues(): void
    {
        $this->template('nested-card', <<<'RAZOR'
<cm-card title="Ignored fallback">
    <razor-slot name="header"><h2>{{ $heading }}</h2></razor-slot>
    <cm-card :title="$innerTitle"><cm-button>Save {{ $label }}</cm-button></cm-card>
    <razor-slot name="footer">Footer {{ $footer }}</razor-slot>
</cm-card>
RAZOR);

        $html = $this->engine()->render('nested-card', [
            'heading' => '<Outer>',
            'innerTitle' => '<Inner>',
            'label' => '<Label>',
            'footer' => '<Footer>',
        ]);

        self::assertSame(2, substr_count($html, 'class="cm-card"'));
        self::assertStringContainsString('<h2>&lt;Outer&gt;</h2>', $html);
        self::assertStringNotContainsString('Ignored fallback', $html);
        self::assertStringContainsString('<h3 class="cm-card__title">&lt;Inner&gt;</h3>', $html);
        self::assertStringContainsString('<button class="cm-button cm-button--primary cm-button--md"', $html);
        self::assertStringContainsString('Save &lt;Label&gt;', $html);
        self::assertStringContainsString('Footer &lt;Footer&gt;', $html);
        self::assertStringNotContainsString('<Outer>', $html);
        self::assertStringNotContainsString('<Inner>', $html);
    }

    public function testOmitsEmptyRegionsAndEscapesRootAttributes(): void
    {
        $this->template('empty-card', '<cm-card data-note="&quot;&lt;unsafe&gt;" />');

        self::assertSame(
            '<section class="cm-card" data-note="&quot;&lt;unsafe&gt;"></section>',
            $this->engine()->render('empty-card'),
        );
    }

    private function engine(): RazorEngine
    {
        $components = new ComponentRegistry();
        $components->register(new UiComponentProvider());

        return new RazorEngine(new DefaultLocator($this->views), cachePath: $this->cache, components: $components);
    }

    private function template(string $name, string $contents): void
    {
        file_put_contents($this->views . '/' . $name . '.razor.php', $contents);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) {
            return;
        }

        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $path = $directory . '/' . $entry;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }

        rmdir($directory);
    }
}
