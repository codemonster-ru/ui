<?php

declare(strict_types=1);

namespace Codemonster\Ui\Tests\Assets;

use Codemonster\Ui\Assets\AssetManifest;
use Codemonster\Ui\Assets\AssetPublisher;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class AssetPublisherTest extends TestCase
{
    private string $root;

    protected function setUp(): void
    {
        $this->root = sys_get_temp_dir() . '/codemonster-ui-assets-' . bin2hex(random_bytes(6));
        mkdir($this->root, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirectory($this->root);
    }

    public function testPublishesOnlyIntegrityCheckedManifestArtifacts(): void
    {
        file_put_contents($this->root . '/styles.css', '.cm-test { color: red; }');
        $manifest = [
            'schemaVersion' => 1,
            'artifacts' => [
                'styles' => [
                    'path' => 'styles.css',
                    'mediaType' => 'text/css',
                    'sha256' => hash_file('sha256', $this->root . '/styles.css'),
                    'source' => [
                        'package' => '@codemonster-ru/ui-css',
                        'version' => '0.1.0',
                        'export' => './styles.css',
                    ],
                ],
            ],
        ];
        file_put_contents($this->root . '/manifest.json', json_encode($manifest, JSON_THROW_ON_ERROR));

        $published = (new AssetPublisher(AssetManifest::load($this->root . '/manifest.json')))
            ->publish($this->root . '/public');

        self::assertSame([$this->root . '/public/styles.css'], $published);
        self::assertSame('.cm-test { color: red; }', file_get_contents($published[0]));
    }

    public function testRejectsNonStringIntegrityMetadata(): void
    {
        $manifest = [
            'schemaVersion' => 1,
            'artifacts' => [
                'styles' => [
                    'path' => 'styles.css',
                    'mediaType' => 'text/css',
                    'sha256' => 123,
                    'source' => [
                        'package' => '@codemonster-ru/ui-css',
                        'version' => '0.1.0',
                        'export' => './styles.css',
                    ],
                ],
            ],
        ];
        file_put_contents($this->root . '/manifest.json', json_encode($manifest, JSON_THROW_ON_ERROR));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('UI asset [styles] has invalid metadata.');

        AssetManifest::load($this->root . '/manifest.json');
    }

    private function removeDirectory(string $directory): void
    {
        foreach (scandir($directory) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $path = $directory . '/' . $entry;
            is_dir($path) ? $this->removeDirectory($path) : unlink($path);
        }

        rmdir($directory);
    }
}
