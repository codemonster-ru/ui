<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmDataTable;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

final class CmDataTableComponentsTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-data-table-' . bin2hex(random_bytes(6));
        mkdir($this->root . '/views', 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testRendersTrustedTableSlotsAndDataTableRuntimeMarkup(): void
    {
        file_put_contents($this->root . '/views/tables.razor.php', <<<'RAZOR'
<cm-table caption="Summary"><razor-slot name="header"><tr><th scope="col">Name</th></tr></razor-slot><tr><td>{{ $name }}</td></tr></cm-table><cm-data-table id="projects" caption="Projects" :columns="$columns" :rows="$rows" />
RAZOR);
        $html = $this->engine()->render('tables', [
            'name' => '<Apollo>',
            'columns' => [['key' => 'name', 'header' => 'Name', 'sortable' => true]],
            'rows' => [['id' => 'apollo', 'cells' => ['name' => '<Apollo>']]],
        ]);
        self::assertStringContainsString('<thead class="cm-table__head"><tr><th scope="col">Name</th></tr></thead>', $html);
        self::assertStringContainsString('data-cm-controller="data-table"', $html);
        self::assertStringContainsString('&lt;Apollo&gt;', $html);
        self::assertStringNotContainsString('<Apollo>', $html);
    }

    public function testRejectsInvalidDataTableCells(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('invalid DataTable cell');
        $component = new CmDataTable(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->root . '/component-cache',
        ));
        $component->render(new ComponentRenderContext([
            'id' => 'projects',
            'columns' => [['key' => 'name', 'header' => 'Name']],
            'rows' => [['id' => 'apollo', 'cells' => ['name' => []]]],
        ], []));
    }

    public function testRejectsPageSizeMissingFromOptions(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('must contain [page-size]');
        $component = new CmDataTable(new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: $this->root . '/component-cache',
        ));
        $component->render(new ComponentRenderContext([
            'id' => 'projects',
            'columns' => [['key' => 'name', 'header' => 'Name']],
            'page-size' => 10,
            'page-size-options' => [25, 50],
        ], []));
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
