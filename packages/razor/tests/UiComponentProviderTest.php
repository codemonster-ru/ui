<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests;

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Ui\Components\CmAccordion;
use Codemonster\Ui\Components\CmButton;
use Codemonster\Ui\Components\CmCard;
use Codemonster\Ui\Components\CmField;
use Codemonster\Ui\Components\CmInput;
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
        self::assertInstanceOf(CmCard::class, $provider->components()['card']);
        self::assertInstanceOf(CmField::class, $provider->components()['field']);
        self::assertInstanceOf(CmInput::class, $provider->components()['input']);
        self::assertTrue($registry->handles('cm-button'));
        self::assertInstanceOf(CmAccordion::class, $registry->resolve('cm-accordion'));
        self::assertInstanceOf(CmButton::class, $registry->resolve('cm-button'));
        self::assertInstanceOf(CmCard::class, $registry->resolve('cm-card'));
        self::assertInstanceOf(CmField::class, $registry->resolve('cm-field'));
        self::assertInstanceOf(CmInput::class, $registry->resolve('cm-input'));
        self::assertFalse($registry->handles('other-button'));
    }
}
