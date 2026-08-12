<?php

declare(strict_types=1);

namespace Codemonster\Ui\Assets;

use JsonException;
use RuntimeException;

final readonly class AssetManifest
{
    /**
     * @param array<string, array{path: string, mediaType: string, sha256: string, source: array{package: string, version: string, export: string}}> $artifacts
     */
    private function __construct(
        private string $assetsDirectory,
        private array $artifacts,
    ) {
    }

    public static function packaged(): self
    {
        return self::load(dirname(__DIR__, 2) . '/resources/assets/manifest.json');
    }

    public static function load(string $manifestPath): self
    {
        $contents = file_get_contents($manifestPath);

        if ($contents === false) {
            throw new RuntimeException("Unable to read UI asset manifest [{$manifestPath}].");
        }

        try {
            $manifest = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new RuntimeException("Invalid UI asset manifest [{$manifestPath}].", 0, $exception);
        }

        if (!is_array($manifest) || ($manifest['schemaVersion'] ?? null) !== 1 || !is_array($manifest['artifacts'] ?? null)) {
            throw new RuntimeException('UI asset manifest must use schema version 1 and define artifacts.');
        }

        /** @var array<string, mixed> $artifacts */
        $artifacts = $manifest['artifacts'];

        foreach ($artifacts as $name => $artifact) {
            if (!is_string($name) || !is_array($artifact)) {
                throw new RuntimeException('UI asset manifest contains an invalid artifact entry.');
            }

            self::validateArtifact($name, $artifact);
        }

        /** @var array<string, array{path: string, mediaType: string, sha256: string, source: array{package: string, version: string, export: string}}> $artifacts */
        return new self(dirname($manifestPath), $artifacts);
    }

    /**
     * @return array<string, array{path: string, mediaType: string, sha256: string, source: array{package: string, version: string, export: string}}>
     */
    public function artifacts(): array
    {
        return $this->artifacts;
    }

    public function sourcePath(string $name): string
    {
        $artifact = $this->artifacts[$name] ?? null;

        if ($artifact === null) {
            throw new RuntimeException("Unknown UI asset [{$name}].");
        }

        return $this->assetsDirectory . '/' . $artifact['path'];
    }

    public function verify(string $name): void
    {
        $path = $this->sourcePath($name);
        $expected = $this->artifacts[$name]['sha256'];
        $actual = is_file($path) ? hash_file('sha256', $path) : false;

        if ($actual === false || !hash_equals($expected, $actual)) {
            throw new RuntimeException("UI asset [{$name}] failed SHA-256 verification.");
        }
    }

    /** @param array<mixed> $artifact */
    private static function validateArtifact(string $name, array $artifact): void
    {
        $path = $artifact['path'] ?? null;
        $source = $artifact['source'] ?? null;

        if (!is_string($path) || $path === '' || str_starts_with($path, '/') || str_contains($path, '..')) {
            throw new RuntimeException("UI asset [{$name}] has an unsafe relative path.");
        }

        if (!is_string($artifact['mediaType'] ?? null)
            || preg_match('/^[a-f0-9]{64}$/D', $artifact['sha256'] ?? '') !== 1
            || !is_array($source)
            || !is_string($source['package'] ?? null)
            || !is_string($source['version'] ?? null)
            || !is_string($source['export'] ?? null)) {
            throw new RuntimeException("UI asset [{$name}] has invalid metadata.");
        }
    }
}
