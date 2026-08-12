<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests;

use Codemonster\Razor\Components\ComponentRegistry;
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
        self::assertSame([], $provider->components());
        self::assertTrue($registry->handles('cm-button'));
        self::assertFalse($registry->handles('other-button'));
    }
}
