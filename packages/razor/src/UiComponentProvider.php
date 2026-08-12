<?php

declare(strict_types=1);

namespace Codemonster\Ui;

use Codemonster\Razor\RazorEngine;
use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmCard;
use Codemonster\View\EngineInterface;
use Codemonster\View\Locator\DefaultLocator;

final readonly class UiComponentProvider implements ComponentProviderInterface
{
    private EngineInterface $views;

    public function __construct(?EngineInterface $views = null)
    {
        $this->views = $views ?? new RazorEngine(
            new DefaultLocator(dirname(__DIR__) . '/resources/views'),
            cachePath: sys_get_temp_dir() . '/codemonster_ui_razor',
        );
    }

    public function prefix(): string
    {
        return 'cm';
    }

    public function components(): array
    {
        return [
            'button' => new CmButton($this->views),
            'card' => new CmCard(),
        ];
    }
}
