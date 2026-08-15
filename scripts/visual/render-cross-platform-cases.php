<?php

declare(strict_types=1);

use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\UiComponentProvider;

$repository = dirname(__DIR__, 2);
$autoload = $repository . '/packages/razor/vendor/autoload.php';

if (!is_file($autoload)) {
    fwrite(STDERR, "Razor dependencies are unavailable. Run composer install --working-dir=packages/razor.\n");
    exit(1);
}

require $autoload;

// The Composer vendor tree supplies the Annabel Razor runtime. Always resolve
// this package's own classes from the checked-out source under test.
spl_autoload_register(static function (string $class) use ($repository): void {
    $prefix = 'Codemonster\\Ui\\';
    if (!str_starts_with($class, $prefix)) {
        return;
    }

    $relative = str_replace('\\', '/', substr($class, strlen($prefix)));
    $source = $repository . '/packages/razor/src/' . $relative . '.php';
    if (is_file($source)) {
        require $source;
    }
}, prepend: true);

$output = $argv[1] ?? null;
if (!is_string($output) || $output === '') {
    fwrite(STDERR, "Usage: php scripts/visual/render-cross-platform-cases.php OUTPUT_FILE\n");
    exit(1);
}

/** @return string */
function kebab(string $value): string
{
    return strtolower((string) preg_replace('/(?<!^)[A-Z]/', '-$0', $value));
}

$manifest = json_decode(
    (string) file_get_contents($repository . '/contracts/cross-platform-visual-baselines.json'),
    true,
    flags: JSON_THROW_ON_ERROR,
);
$casePaths = glob($repository . '/contracts/*/cases/*.case.json') ?: [];
$casesById = [];
foreach ($casePaths as $casePath) {
    $case = json_decode((string) file_get_contents($casePath), true, flags: JSON_THROW_ON_ERROR);
    $casesById[$case['id']] = [
        'case' => $case,
        'component' => basename(dirname($casePath, 2)),
    ];
}

$components = (new UiComponentProvider())->components();
$rendered = [];
foreach ($manifest['caseIds'] as $caseId) {
    if (!isset($casesById[$caseId])) {
        throw new RuntimeException("Cross-platform case [{$caseId}] is unavailable.");
    }

    ['case' => $case, 'component' => $component] = $casesById[$caseId];
    if (!isset($components[$component])) {
        throw new RuntimeException("Razor adapter [{$component}] is unavailable for [{$caseId}].");
    }

    $props = [];
    foreach ($case['props'] as $name => $value) {
        $props[kebab((string) $name)] = $value;
    }
    $props = [...$props, ...($case['attributes'] ?? [])];
    $slots = [];
    foreach ($case['slots'] as $name => $contents) {
        $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString((string) $contents);
    }

    $rendered[$caseId] = $components[$component]
        ->render(new ComponentRenderContext($props, $slots))
        ->value();
}

if (file_put_contents($output, json_encode($rendered, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR) . "\n") === false) {
    throw new RuntimeException("Unable to write Razor visual fixtures to {$output}.");
}

fwrite(STDOUT, 'Rendered ' . count($rendered) . " cross-platform cases through the Annabel Razor adapters.\n");
