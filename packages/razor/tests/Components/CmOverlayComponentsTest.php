<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmOverlayComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-overlay-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersRegisteredOverlayTagsAndRuntimeMarkers(): void
    {
        file_put_contents($this->root . '/views/overlays.razor.php', <<<'RAZOR'
<cm-dialog id="confirm" title="Confirm" :open="true">Continue?</cm-dialog><cm-drawer id="filters" title="Filters" side="start">Controls</cm-drawer><cm-popover id="help" label="Help">Details</cm-popover><cm-tooltip id="save" label="Save" content="Save changes" />
RAZOR);
        $html = $this->engine()->render('overlays');

        self::assertStringContainsString('data-cm-controller="dialog" data-cm-dialog-state="open" open', $html);
        self::assertStringContainsString('class="cm-drawer cm-drawer--start"', $html);
        self::assertStringContainsString('data-cm-controller="popover"', $html);
        self::assertStringContainsString('data-cm-controller="tooltip"', $html);
    }

    public function testEscapesOverlayValuesAndPreservesTrustedSlots(): void
    {
        file_put_contents($this->root . '/views/escaping.razor.php', <<<'RAZOR'
<cm-dialog id="unsafe" :title="$unsafe" :description="$unsafe"><strong>Trusted body</strong><razor-slot name="footer"><button>Trusted action</button></razor-slot></cm-dialog><cm-tooltip id="tip" :label="$unsafe" :content="$unsafe" />
RAZOR);
        $html = $this->engine()->render('escaping', ['unsafe' => '<script>unsafe</script>']);

        self::assertStringContainsString('&lt;script&gt;unsafe&lt;/script&gt;', $html);
        self::assertStringContainsString('<strong>Trusted body</strong>', $html);
        self::assertStringContainsString('<button>Trusted action</button>', $html);
        self::assertStringNotContainsString('<script>', $html);
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
