<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests;

use JsonException;
use PHPUnit\Framework\TestCase;

final class PackageMetadataTest extends TestCase
{
    /** @throws JsonException */
    public function testComposerPackageIdentityAndAutoloading(): void
    {
        $contents = file_get_contents(__DIR__ . '/../composer.json');

        self::assertIsString($contents);

        /** @var array{name: string, autoload: array{'psr-4': array<string, string>}} $manifest */
        $manifest = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);

        self::assertSame('codemonster-ru/ui', $manifest['name']);
        self::assertSame('src/', $manifest['autoload']['psr-4']['Codemonster\\Ui\\']);
    }
}
