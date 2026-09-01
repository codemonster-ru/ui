<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Components;

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Components\CmNavMenu;
use Codemonster\Ui\Tests\Support\SignificantDom;
use Codemonster\View\Locator\DefaultLocator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

final class CmNavMenuParityTest extends TestCase
{
    #[DataProvider('caseProvider')]
    public function testMatchesCanonicalSignificantDom(string $casePath, string $htmlPath): void
    {
        /** @var array{props: array<string, mixed>, slots: array<string, string>} $case */
        $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
        $views = new RazorEngine(
            new DefaultLocator(dirname(__DIR__, 2) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster-ui-nav-menu-' . bin2hex(random_bytes(6)),
        );
        $slots = [];

        foreach ($case['slots'] as $name => $content) {
            $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString($content);
        }

        $actual = (new CmNavMenu($views))->render(new ComponentRenderContext($case['props'], $slots))->value();

        self::assertSame(
            SignificantDom::normalize((string) file_get_contents($htmlPath)),
            SignificantDom::normalize($actual),
        );
    }

    /** @return iterable<string, array{string, string}> */
    public static function caseProvider(): iterable
    {
        $cases = dirname(__DIR__, 4) . '/contracts/nav-menu/cases';
        foreach (glob($cases . '/*.case.json') ?: [] as $casePath) {
            $basename = substr(basename($casePath), 0, -strlen('.case.json'));
            yield $basename => [$casePath, $cases . '/' . $basename . '.html'];
        }
    }
}
