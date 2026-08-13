<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmDialog;
use Codemonster\Ui\Components\CmDrawer;
use Codemonster\Ui\Components\CmPopover;
use Codemonster\Ui\Components\CmTooltip;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmOverlayComponentsParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>, attributes?: array<string, mixed>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = [...$case['props'], ...($case['attributes'] ?? [])];
        foreach (['closeLabel' => 'close-label', 'defaultVisible' => 'default-visible'] as $source => $target) {
            if (array_key_exists($source, $props)) {
                $props[$target] = $props[$source];
                unset($props[$source]);
            }
        }
        $slots = [];
        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }
        $actual = $this->component($slug)->render(new ComponentRenderContext($props, $slots))->value();
        self::assertSame(SignificantDom::normalize((string) file_get_contents($htmlPath)), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        foreach (['dialog', 'drawer', 'popover', 'tooltip'] as $slug) {
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
            cachePath: sys_get_temp_dir() . '/codemonster-ui-overlay-parity-' . bin2hex(random_bytes(6)),
        );
        return match ($slug) {
            'dialog' => new CmDialog($views),
            'drawer' => new CmDrawer($views),
            'popover' => new CmPopover($views),
            'tooltip' => new CmTooltip($views),
            default => throw new \InvalidArgumentException("Unknown overlay component [{$slug}]."),
        };
    }
}
