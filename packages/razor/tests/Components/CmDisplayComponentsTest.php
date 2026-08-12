<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Exceptions\RazorException;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\TestCase;

final class CmDisplayComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-display-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersDisplayComponentsThroughRegisteredTags(): void
    {
        file_put_contents($this->root . '/views/display.razor.php', <<<'RAZOR'
<cm-badge tone="danger">Blocked</cm-badge><cm-alert title="Saved">Done.</cm-alert><cm-avatar label="AK" size="sm" shape="circle" /><cm-divider orientation="vertical" style="height: 2rem" /><cm-skeleton :animated="false" min-height="6rem" radius="control" />
RAZOR);

        $html = $this->engine()->render('display');

        self::assertStringContainsString('<span class="cm-badge cm-badge--danger">Blocked</span>', $html);
        self::assertStringContainsString('<section class="cm-alert" role="status">', $html);
        self::assertStringContainsString('<span class="cm-avatar cm-avatar--sm cm-avatar--circle">', $html);
        self::assertStringContainsString('role="separator" aria-orientation="vertical" style="height: 2rem"', $html);
        self::assertStringContainsString('class="cm-skeleton cm-skeleton--radius-control" aria-hidden="true" style="min-height: 6rem"', $html);
    }

    public function testEscapesValuesAndPreservesTrustedSlots(): void
    {
        file_put_contents($this->root . '/views/escaping.razor.php', <<<'RAZOR'
<cm-alert :title="$title"><razor-slot name="icon"><strong>!</strong></razor-slot>{{ $body }}</cm-alert><cm-avatar :image="$image" :image-alt="$alt" />
RAZOR);
        $html = $this->engine()->render('escaping', [
            'title' => '<Title>',
            'body' => '<Body>',
            'image' => '"><script>unsafe</script>',
            'alt' => '<Alt>',
        ]);

        self::assertStringContainsString('<strong>!</strong>', $html);
        self::assertStringContainsString('&lt;Title&gt;', $html);
        self::assertStringContainsString('&lt;Body&gt;', $html);
        self::assertStringContainsString('src="&quot;&gt;&lt;script&gt;unsafe&lt;/script&gt;" alt="&lt;Alt&gt;"', $html);
        self::assertStringNotContainsString('<script>', $html);
    }

    public function testRejectsUnsafeSkeletonLength(): void
    {
        file_put_contents($this->root . '/views/unsafe.razor.php', '<cm-skeleton min-height="calc(100% - 1px)" />');
        $this->expectException(RazorException::class);
        $this->expectExceptionMessage('Unable to render Razor view [unsafe].');
        $this->engine()->render('unsafe');
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
