<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\Contracts\ComponentInterface;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmContainer;
use Codemonster\Ui\Components\CmGrid;
use Codemonster\Ui\Components\CmInline;
use Codemonster\Ui\Components\CmSection;
use Codemonster\Ui\Components\CmStack;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmLayoutPrimitivesParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $slug, string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array{default: string}} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $slots = ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString($case['slots']['default'])];
        $actual = $this->component($slug)->render(new ComponentRenderContext($case['props'], $slots))->value();
        self::assertSame(SignificantDom::normalize((string) file_get_contents($htmlPath)), SignificantDom::normalize($actual));
    }

    /** @return iterable<string, array{string, string, string}> */
    public static function caseProvider(): iterable
    {
        foreach (['container', 'grid', 'inline', 'section', 'stack'] as $slug) {
            $cases = dirname(__DIR__, 4) . "/contracts/{$slug}/cases";
            foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
                $basename = substr(basename($casePath), 0, -strlen('.case.json'));
                yield "{$slug}-{$basename}" => [$slug, $casePath, $cases . '/' . $basename . '.html'];
            }
        }
    }

    private function component(string $slug): ComponentInterface
    {
        $views = new RazorEngine(new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-layout-parity-' . bin2hex(random_bytes(6)));
        return match ($slug) {
            'container' => new CmContainer($views),
            'grid' => new CmGrid($views),
            'inline' => new CmInline($views),
            'section' => new CmSection($views),
            'stack' => new CmStack($views),
            default => throw new \InvalidArgumentException("Unknown layout primitive [{$slug}]."),
        };
    }
}
