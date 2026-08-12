<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmBreadcrumbs;
use Codemonster\Ui\Components\CmDropdown;
use Codemonster\Ui\Components\CmLink;
use Codemonster\Ui\Components\CmMenu;
use Codemonster\Ui\Components\CmTabs;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmNavigationComponentsParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>, attributes?: array<string, mixed>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $props = [...$case['props'], ...($case['attributes'] ?? [])];
        if (isset($props['ariaLabel'])) {
            $props['aria-label'] = $props['ariaLabel'];
            unset($props['ariaLabel']);
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
        foreach (['breadcrumbs', 'dropdown', 'link', 'menu', 'tabs'] as $slug) {
            $cases = dirname(__DIR__, 4) . "/contracts/{$slug}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$slug}-{$basename}" => [$slug, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    private function component(string $slug): CmBreadcrumbs|CmDropdown|CmLink|CmMenu|CmTabs
    {
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-navigation-parity-' . bin2hex(random_bytes(6)),
        );
        return match ($slug) {
            'breadcrumbs' => new CmBreadcrumbs($views),
            'dropdown' => new CmDropdown($views),
            'link' => new CmLink($views),
            'menu' => new CmMenu($views),
            'tabs' => new CmTabs($views),
            default => throw new \InvalidArgumentException("Unknown navigation component [{$slug}]."),
        };
    }
}
