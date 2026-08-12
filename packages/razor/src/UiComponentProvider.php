<?php

declare(strict_types=1);

namespace Codemonster\Ui;

use Codemonster\Razor\RazorEngine;
use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\Ui\Components\CmAlert;
use Codemonster\Ui\Components\CmAvatar;
use Codemonster\Ui\Components\CmBadge;
use Codemonster\Ui\Components\CmBreadcrumbs;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmCard;
use Codemonster\Ui\Components\CmCheckbox;
use Codemonster\Ui\Components\CmCommandPalette;
use Codemonster\Ui\Components\CmContainer;
use Codemonster\Ui\Components\CmDataTable;
use Codemonster\Ui\Components\CmDatePicker;
use Codemonster\Ui\Components\CmDivider;
use Codemonster\Ui\Components\CmDialog;
use Codemonster\Ui\Components\CmDropdown;
use Codemonster\Ui\Components\CmDrawer;
use Codemonster\Ui\Components\CmField;
use Codemonster\Ui\Components\CmGrid;
use Codemonster\Ui\Components\CmInput;
use Codemonster\Ui\Components\CmInline;
use Codemonster\Ui\Components\CmLink;
use Codemonster\Ui\Components\CmMenu;
use Codemonster\Ui\Components\CmPopover;
use Codemonster\Ui\Components\CmRadio;
use Codemonster\Ui\Components\CmSelect;
use Codemonster\Ui\Components\CmSection;
use Codemonster\Ui\Components\CmSkeleton;
use Codemonster\Ui\Components\CmStack;
use Codemonster\Ui\Components\CmSwitch;
use Codemonster\Ui\Components\CmTable;
use Codemonster\Ui\Components\CmTabs;
use Codemonster\Ui\Components\CmTextarea;
use Codemonster\Ui\Components\CmTooltip;
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
            'breadcrumbs' => new CmBreadcrumbs($this->views),
            'button' => new CmButton($this->views),
            'card' => new CmCard($this->views),
            'checkbox' => new CmCheckbox($this->views),
            'command-palette' => new CmCommandPalette($this->views),
            'container' => new CmContainer($this->views),
            'data-table' => new CmDataTable($this->views),
            'date-picker' => new CmDatePicker($this->views),
            'divider' => new CmDivider($this->views),
            'dialog' => new CmDialog($this->views),
            'dropdown' => new CmDropdown($this->views),
            'drawer' => new CmDrawer($this->views),
            'field' => new CmField($this->views),
            'grid' => new CmGrid($this->views),
            'input' => new CmInput($this->views),
            'inline' => new CmInline($this->views),
            'link' => new CmLink($this->views),
            'menu' => new CmMenu($this->views),
            'popover' => new CmPopover($this->views),
            'radio' => new CmRadio($this->views),
            'select' => new CmSelect($this->views),
            'section' => new CmSection($this->views),
            'skeleton' => new CmSkeleton($this->views),
            'stack' => new CmStack($this->views),
            'switch' => new CmSwitch($this->views),
            'table' => new CmTable($this->views),
            'tabs' => new CmTabs($this->views),
            'textarea' => new CmTextarea($this->views),
            'tooltip' => new CmTooltip($this->views),
        ];
    }
}
