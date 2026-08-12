<?php

declare(strict_types=1);

namespace Codemonster\Ui;

use Codemonster\Razor\RazorEngine;
use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\Ui\Components\CmAlert;
use Codemonster\Ui\Components\CmAvatar;
use Codemonster\Ui\Components\CmBadge;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmCard;
use Codemonster\Ui\Components\CmDivider;
use Codemonster\Ui\Components\CmField;
use Codemonster\Ui\Components\CmInput;
use Codemonster\Ui\Components\CmSkeleton;
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
            'accordion' => new CmAccordion($this->views),
            'alert' => new CmAlert($this->views),
            'avatar' => new CmAvatar($this->views),
            'badge' => new CmBadge($this->views),
            'button' => new CmButton($this->views),
            'card' => new CmCard($this->views),
            'divider' => new CmDivider($this->views),
            'field' => new CmField($this->views),
            'input' => new CmInput($this->views),
            'skeleton' => new CmSkeleton($this->views),
        ];
    }
}
