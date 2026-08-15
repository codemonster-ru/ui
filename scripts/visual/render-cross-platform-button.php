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
    fwrite(STDERR, "Usage: php scripts/visual/render-cross-platform-button.php OUTPUT_FILE\n");
    exit(1);
}

$case = json_decode(
    (string) file_get_contents($repository . '/contracts/button/cases/default.case.json'),
    true,
    flags: JSON_THROW_ON_ERROR,
);
$slots = [];
foreach ($case['slots'] as $name => $contents) {
    $slots[$name] = static fn (): RenderedHtml => RenderedHtml::fromTrustedString((string) $contents);
}

$button = (new UiComponentProvider())->components()['button'];
$html = $button->render(new ComponentRenderContext($case['props'], $slots))->value();

if (file_put_contents($output, $html . "\n") === false) {
    throw new RuntimeException("Unable to write Razor visual fixture to {$output}.");
}

fwrite(STDOUT, "Rendered button-default through the Annabel Razor adapter to {$output}.\n");
