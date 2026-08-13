<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmCommandPalette;
use Codemonster\Ui\Components\CmDatePicker;
use Codemonster\Ui\Components\CmSelect;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmAdvancedInputComponentsParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, attributes?: array<string, mixed>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = [...$case['props'], ...($case['attributes'] ?? [])];
        foreach (['emptyText' => 'empty-text', 'closeLabel' => 'close-label'] as $source => $target) {
            if (array_key_exists($source, $props)) {
                $props[$target] = $props[$source];
                unset($props[$source]);
            }
        }
        $actual = $this->component($slug)->render(new ComponentRenderContext($props, []))->value();
        self::assertSame(SignificantDom::normalize((string) file_get_contents($htmlPath)), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        foreach (['command-palette', 'date-picker', 'select'] as $slug) {
            $cases = dirname(__DIR__, 4) . "/contracts/{$slug}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$slug}-{$basename}" => [$slug, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    private function component(string $slug): ComponentInterface
    {
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-advanced-input-parity-' . bin2hex(random_bytes(6)),
        );
        return match ($slug) {
            'command-palette' => new CmCommandPalette($views),
            'date-picker' => new CmDatePicker($views),
            'select' => new CmSelect($views),
            default => throw new \InvalidArgumentException("Unknown advanced input component [{$slug}]."),
        };
    }
}
