<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmBreadcrumbs;
use Codemonster\Ui\Components\CmCard;
use Codemonster\Ui\Components\CmCheckbox;
use Codemonster\Ui\Components\CmDropdown;
use Codemonster\Ui\Components\CmField;
use Codemonster\Ui\Components\CmInput;
use Codemonster\Ui\Components\CmLink;
use Codemonster\Ui\Components\CmMenu;
use Codemonster\Ui\Components\CmRadio;
use Codemonster\Ui\Components\CmSwitch;
use Codemonster\Ui\Components\CmTabs;
use Codemonster\Ui\Components\CmTextarea;
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
        self::assertInstanceOf(CmDropdown::class, $provider->components()['dropdown']);
        self::assertInstanceOf(CmField::class, $provider->components()['field']);
        self::assertInstanceOf(CmInput::class, $provider->components()['input']);
        self::assertInstanceOf(CmLink::class, $provider->components()['link']);
        self::assertInstanceOf(CmMenu::class, $provider->components()['menu']);
        self::assertInstanceOf(CmRadio::class, $provider->components()['radio']);
        self::assertInstanceOf(CmSwitch::class, $provider->components()['switch']);
        self::assertInstanceOf(CmTabs::class, $provider->components()['tabs']);
        self::assertInstanceOf(CmTextarea::class, $provider->components()['textarea']);
        self::assertTrue($registry->handles('cm-button'));
        self::assertInstanceOf(CmAccordion::class, $registry->resolve('cm-accordion'));
        self::assertInstanceOf(CmButton::class, $registry->resolve('cm-button'));
        self::assertInstanceOf(CmBreadcrumbs::class, $registry->resolve('cm-breadcrumbs'));
        self::assertInstanceOf(CmCard::class, $registry->resolve('cm-card'));
        self::assertInstanceOf(CmCheckbox::class, $registry->resolve('cm-checkbox'));
        self::assertInstanceOf(CmDropdown::class, $registry->resolve('cm-dropdown'));
        self::assertInstanceOf(CmField::class, $registry->resolve('cm-field'));
        self::assertInstanceOf(CmInput::class, $registry->resolve('cm-input'));
        self::assertInstanceOf(CmLink::class, $registry->resolve('cm-link'));
        self::assertInstanceOf(CmMenu::class, $registry->resolve('cm-menu'));
        self::assertInstanceOf(CmRadio::class, $registry->resolve('cm-radio'));
        self::assertInstanceOf(CmSwitch::class, $registry->resolve('cm-switch'));
        self::assertInstanceOf(CmTabs::class, $registry->resolve('cm-tabs'));
        self::assertInstanceOf(CmTextarea::class, $registry->resolve('cm-textarea'));
        self::assertFalse($registry->handles('other-button'));
    }
}
