<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmBreadcrumbs;
use Codemonster\Ui\Components\CmCard;
use Codemonster\Ui\Components\CmCheckbox;
use Codemonster\Ui\Components\CmCommandPalette;
use Codemonster\Ui\Components\CmDatePicker;
use Codemonster\Ui\Components\CmDialog;
use Codemonster\Ui\Components\CmDropdown;
use Codemonster\Ui\Components\CmDrawer;
use Codemonster\Ui\Components\CmField;
use Codemonster\Ui\Components\CmInput;
use Codemonster\Ui\Components\CmLink;
use Codemonster\Ui\Components\CmMenu;
use Codemonster\Ui\Components\CmPopover;
use Codemonster\Ui\Components\CmRadio;
use Codemonster\Ui\Components\CmSelect;
use Codemonster\Ui\Components\CmSwitch;
use Codemonster\Ui\Components\CmTabs;
use Codemonster\Ui\Components\CmTextarea;
use Codemonster\Ui\Components\CmTooltip;
use Codemonster\Ui\UiComponentProvider;
use PHPUnit\Framework\TestCase;

final class UiComponentProviderTest extends TestCase
{
    public function testRegistersTheCodeMonsterPrefix(): void
    {
        $provider = new UiComponentProvider();
        $registry = new ComponentRegistry();

        $registry->register($provider);

        self::assertSame('cm', $provider->prefix());
        self::assertInstanceOf(CmAccordion::class, $provider->components()['accordion']);
        self::assertInstanceOf(CmButton::class, $provider->components()['button']);
        self::assertInstanceOf(CmBreadcrumbs::class, $provider->components()['breadcrumbs']);
        self::assertInstanceOf(CmCard::class, $provider->components()['card']);
        self::assertInstanceOf(CmCheckbox::class, $provider->components()['checkbox']);
        self::assertInstanceOf(CmCommandPalette::class, $provider->components()['command-palette']);
        self::assertInstanceOf(CmDatePicker::class, $provider->components()['date-picker']);
        self::assertInstanceOf(CmDialog::class, $provider->components()['dialog']);
        self::assertInstanceOf(CmDropdown::class, $provider->components()['dropdown']);
        self::assertInstanceOf(CmDrawer::class, $provider->components()['drawer']);
        self::assertInstanceOf(CmField::class, $provider->components()['field']);
        self::assertInstanceOf(CmInput::class, $provider->components()['input']);
        self::assertInstanceOf(CmLink::class, $provider->components()['link']);
        self::assertInstanceOf(CmMenu::class, $provider->components()['menu']);
        self::assertInstanceOf(CmPopover::class, $provider->components()['popover']);
        self::assertInstanceOf(CmRadio::class, $provider->components()['radio']);
        self::assertInstanceOf(CmSelect::class, $provider->components()['select']);
        self::assertInstanceOf(CmSwitch::class, $provider->components()['switch']);
        self::assertInstanceOf(CmTabs::class, $provider->components()['tabs']);
        self::assertInstanceOf(CmTextarea::class, $provider->components()['textarea']);
        self::assertInstanceOf(CmTooltip::class, $provider->components()['tooltip']);
        self::assertTrue($registry->handles('cm-button'));
        self::assertInstanceOf(CmAccordion::class, $registry->resolve('cm-accordion'));
        self::assertInstanceOf(CmButton::class, $registry->resolve('cm-button'));
        self::assertInstanceOf(CmBreadcrumbs::class, $registry->resolve('cm-breadcrumbs'));
        self::assertInstanceOf(CmCard::class, $registry->resolve('cm-card'));
        self::assertInstanceOf(CmCheckbox::class, $registry->resolve('cm-checkbox'));
        self::assertInstanceOf(CmCommandPalette::class, $registry->resolve('cm-command-palette'));
        self::assertInstanceOf(CmDatePicker::class, $registry->resolve('cm-date-picker'));
        self::assertInstanceOf(CmDialog::class, $registry->resolve('cm-dialog'));
        self::assertInstanceOf(CmDropdown::class, $registry->resolve('cm-dropdown'));
        self::assertInstanceOf(CmDrawer::class, $registry->resolve('cm-drawer'));
        self::assertInstanceOf(CmField::class, $registry->resolve('cm-field'));
        self::assertInstanceOf(CmInput::class, $registry->resolve('cm-input'));
        self::assertInstanceOf(CmLink::class, $registry->resolve('cm-link'));
        self::assertInstanceOf(CmMenu::class, $registry->resolve('cm-menu'));
        self::assertInstanceOf(CmPopover::class, $registry->resolve('cm-popover'));
        self::assertInstanceOf(CmRadio::class, $registry->resolve('cm-radio'));
        self::assertInstanceOf(CmSelect::class, $registry->resolve('cm-select'));
        self::assertInstanceOf(CmSwitch::class, $registry->resolve('cm-switch'));
        self::assertInstanceOf(CmTabs::class, $registry->resolve('cm-tabs'));
        self::assertInstanceOf(CmTextarea::class, $registry->resolve('cm-textarea'));
        self::assertInstanceOf(CmTooltip::class, $registry->resolve('cm-tooltip'));
        self::assertFalse($registry->handles('other-button'));
    }
}
