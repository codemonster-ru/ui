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

        self::assertStringContainsString('data-cm-controller="dialog" data-cm-dialog-state="open" data-cm-dialog-dismissible="true" open', $html);
        self::assertStringContainsString('class="cm-drawer cm-drawer--start cm-drawer--md"', $html);
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

    public function testDialogCanLockUserDismissal(): void
    {
        file_put_contents($this->root . '/views/locked.razor.php', <<<'RAZOR'
<cm-dialog id="busy" title="Deleting" :open="true" :dismissible="false" />
RAZOR);
        $html = $this->engine()->render('locked');

        self::assertStringContainsString('data-cm-dialog-dismissible="false"', $html);
        self::assertStringContainsString('data-cm-dialog-close disabled', $html);
    }

    public function testRendersTrustedOverlayCompositionAndFiniteVariants(): void
    {
        file_put_contents($this->root . '/views/composed.razor.php', <<<'RAZOR'
<cm-dialog id="publish" title="Publish" size="lg" :dividers="true"><razor-slot name="header">Rich <strong>heading</strong></razor-slot><razor-slot name="description">Trusted <strong>description</strong></razor-slot><razor-slot name="actions"><button>Preview</button></razor-slot></cm-dialog><cm-drawer id="account" title="Account" size="full" :rounded="true" :dismissible="false" /><cm-popover id="profile" label="Open profile"><razor-slot name="trigger"><span aria-hidden="true">●</span></razor-slot></cm-popover><cm-tooltip id="archive" label="Archive" content="Archive project"><razor-slot name="trigger"><span aria-hidden="true">×</span></razor-slot><razor-slot name="content">Archive <strong>this project</strong></razor-slot></cm-tooltip>
RAZOR);
        $html = $this->engine()->render('composed');

        self::assertStringContainsString('class="cm-dialog cm-dialog--lg cm-dialog--dividers"', $html);
        self::assertStringContainsString('<h2 class="cm-dialog__title" id="publish-title">Rich <strong>heading</strong></h2>', $html);
        self::assertStringContainsString('aria-describedby="publish-description"', $html);
        self::assertStringContainsString('class="cm-drawer cm-drawer--end cm-drawer--full cm-drawer--rounded"', $html);
        self::assertStringContainsString('data-cm-drawer-dismissible="false"', $html);
        self::assertStringContainsString('aria-label="Open profile"', $html);
        self::assertStringContainsString('Archive <strong>this project</strong>', $html);
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
