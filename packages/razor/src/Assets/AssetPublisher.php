<?php

declare(strict_types=1);

namespace Codemonster\Ui\Assets;

use RuntimeException;

final readonly class AssetPublisher
{
    public function __construct(private AssetManifest $manifest)
    {
    }

    /** @return list<string> Published destination paths. */
    public function publish(string $targetDirectory): array
    {
        $targetDirectory = rtrim($targetDirectory, DIRECTORY_SEPARATOR);

        if ($targetDirectory === '') {
            throw new RuntimeException('UI asset publication target must not be empty.');
        }

        $published = [];

        foreach ($this->manifest->artifacts() as $name => $artifact) {
            $this->manifest->verify($name);
            $destination = $targetDirectory . '/' . $artifact['path'];
            $directory = dirname($destination);

            if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
                throw new RuntimeException("Unable to create UI asset directory [{$directory}].");
            }

            $temporary = $destination . '.' . bin2hex(random_bytes(6)) . '.tmp';

            try {
                if (!copy($this->manifest->sourcePath($name), $temporary) || !rename($temporary, $destination)) {
                    throw new RuntimeException("Unable to publish UI asset [{$name}].");
                }
            } finally {
                if (is_file($temporary)) {
                    unlink($temporary);
                }
            }

            $published[] = $destination;
        }

        return $published;
    }
}
