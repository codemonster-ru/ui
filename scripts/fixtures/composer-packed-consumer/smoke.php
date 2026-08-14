<?php

declare(strict_types=1);

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\Components\ComponentRenderContext;
use Codemonster\Razor\Components\RenderedHtml;
use Codemonster\Ui\Assets\AssetManifest;
use Codemonster\Ui\Assets\AssetPublisher;
use Codemonster\Ui\UiComponentProvider;

require __DIR__ . '/vendor/autoload.php';

function ensure(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$provider = new UiComponentProvider();
$components = $provider->components();
$registry = new ComponentRegistry();
$registry->register($provider);

ensure($provider->prefix() === 'cm', 'Unexpected component prefix.');
ensure(count($components) === 37, 'Unexpected public component count.');
ensure($registry->handles('cm-button'), 'Component provider was not registered.');

$button = $components['button']->render(new ComponentRenderContext(
    ['variant' => 'secondary'],
    ['default' => static fn (): RenderedHtml => RenderedHtml::fromTrustedString('Packed consumer')],
))->value();
ensure(str_contains($button, 'cm-button--secondary'), 'Button rendering failed.');
ensure(str_contains($button, 'Packed consumer'), 'Button slot rendering failed.');

$target = sys_get_temp_dir() . '/codemonster-ui-packed-assets-' . bin2hex(random_bytes(6));
$manifest = AssetManifest::packaged();
$published = (new AssetPublisher($manifest))->publish($target);
ensure(count($published) === count($manifest->artifacts()), 'Not every packaged asset was published.');
ensure(is_file($target . '/css/tokens/tokens.css'), 'Token stylesheet was not published.');
ensure(is_file($target . '/css/css/styles.css'), 'Component stylesheet was not published.');
ensure(str_contains((string) file_get_contents($target . '/css/css/components/button.css'), '.cm-button'), 'Button CSS is invalid.');

echo "[composer-packed-consumer] Provider, rendering, and asset publication passed.\n";
