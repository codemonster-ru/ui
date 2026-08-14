<?php

declare(strict_types=1);

/** @param mixed $value */
function ensure(bool $condition, string $message, mixed $value = null): void
{
    if (!$condition) {
        $suffix = $value === null ? '' : ': ' . json_encode($value, JSON_UNESCAPED_SLASHES);
        throw new RuntimeException($message . $suffix);
    }
}

$lock = json_decode((string) file_get_contents(__DIR__ . '/composer.lock'), true, flags: JSON_THROW_ON_ERROR);
$packages = array_values(array_filter(
    $lock['packages'] ?? [],
    static fn (array $package): bool => ($package['name'] ?? null) === 'codemonster-ru/ui-razor',
));

ensure(count($packages) === 1, 'Expected one locked codemonster-ru/ui-razor package', count($packages));
$package = $packages[0];
$source = $package['source'] ?? [];
$dist = $package['dist'] ?? [];
$reference = $source['reference'] ?? null;

ensure(($package['version'] ?? null) === 'v1.1.0', 'Unexpected locked package version', $package['version'] ?? null);
ensure(($source['type'] ?? null) === 'git', 'Unexpected source type', $source['type'] ?? null);
ensure(
    ($source['url'] ?? null) === 'https://github.com/codemonster-ru/ui-razor.git',
    'Unexpected source repository',
    $source['url'] ?? null,
);
ensure(is_string($reference) && preg_match('/^[0-9a-f]{40}$/D', $reference) === 1, 'Invalid source reference', $reference);
ensure(($dist['type'] ?? null) === 'zip', 'Unexpected dist type', $dist['type'] ?? null);
ensure(($dist['reference'] ?? null) === $reference, 'Source and dist references differ', $dist['reference'] ?? null);
ensure(
    ($dist['url'] ?? null) === "https://api.github.com/repos/codemonster-ru/ui-razor/zipball/{$reference}",
    'Unexpected dist archive URL',
    $dist['url'] ?? null,
);

echo "[composer-registry-consumer] Locked v1.1.0 at {$reference}.\n";
