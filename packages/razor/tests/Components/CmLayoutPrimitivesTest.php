<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmLayoutPrimitivesTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-layout-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testComposesNestedPrimitivesAndEscapesSlotValues(): void
    {
        file_put_contents($this->root . '/views/layout.razor.php', <<<'RAZOR'
<cm-container element="main" size="lg" aria-label="Workspace"><cm-stack><cm-section :surface="true"><cm-inline :wrap="false"><span>{{ $value }}</span></cm-inline></cm-section><cm-grid><article>One</article><article>Two</article></cm-grid></cm-stack></cm-container>
RAZOR);
        $html = $this->engine()->render('layout', ['value' => '<Unsafe>']);
        self::assertStringContainsString('<main class="cm-container cm-container--lg" aria-label="Workspace">', $html);
        self::assertStringContainsString('class="cm-section cm-section--surface"', $html);
        self::assertStringContainsString('class="cm-inline cm-inline--nowrap"', $html);
        self::assertStringContainsString('&lt;Unsafe&gt;', $html);
        self::assertStringNotContainsString('<Unsafe>', $html);
    }

    private function engine(): RazorEngine
    {
        $components = new ComponentRegistry();
        $components->register(new UiComponentProvider());
        return new RazorEngine(new DefaultLocator($this->root . '/views'), cachePath: $this->root . '/cache', components: $components);
    }

    private function removeDirectory(string $directory): void
    {
        if (!is_dir($directory)) return;
        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') continue;
            $path = $directory . '/' . $entry;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }
        rmdir($directory);
    }
}
