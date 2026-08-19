<?php

declare(strict_types=1);

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\Ui\Assets\AssetManifest;
use Codemonster\Ui\Assets\AssetPublisher;
use Codemonster\Ui\UiComponentProvider;
use Codemonster\View\Locator\DefaultLocator;

require dirname(__DIR__) . '/vendor/autoload.php';

$root = dirname(__DIR__);
$assetDirectory = $root . '/public/vendor/codemonster-ui';
$styles = $assetDirectory . '/css/css/styles.css';

if (!is_file($styles)) {
    (new AssetPublisher(AssetManifest::packaged()))->publish($assetDirectory);
}

$components = new ComponentRegistry();
$components->register(new UiComponentProvider());

$showcase = json_decode(
    (string) file_get_contents($root . '/../shared/parity-showcase.json'),
    true,
    flags: JSON_THROW_ON_ERROR,
);

$engine = new RazorEngine(
    new DefaultLocator($root . '/views'),
    cachePath: sys_get_temp_dir() . '/codemonster-ui-razor-example',
    components: $components,
);

$content = $engine->render('home', [
    'title' => $showcase['title'],
    'intro' => $showcase['intro'],
    'buttonPrimaryLabel' => $showcase['button']['primaryLabel'],
    'buttonSecondaryLabel' => $showcase['button']['secondaryLabel'],
    'buttonLoadingLabel' => $showcase['button']['loadingLabel'],
    'cardTitle' => $showcase['card']['title'],
    'cardBody' => $showcase['card']['body'],
    'cardFooter' => $showcase['card']['footer'],
    'controlId' => $showcase['form']['controlId'],
    'email' => $showcase['form']['email'],
    'formDescription' => $showcase['form']['description'],
    'accordionId' => $showcase['accordion']['id'],
    'accordionItems' => $showcase['accordion']['items'],
    'accordionDefaultOpenItems' => $showcase['accordion']['defaultOpenItems'],
]);

echo "<!doctype html>\n";
echo "<html lang=\"en\">\n<head>\n";
echo "  <meta charset=\"utf-8\">\n";
echo "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n";
echo "  <title>CodeMonster UI · Razor</title>\n";
echo "  <link rel=\"stylesheet\" href=\"/vendor/codemonster-ui/css/tokens/tokens.css\">\n";
echo "  <link rel=\"stylesheet\" href=\"/vendor/codemonster-ui/css/css/styles.css\">\n";
echo "</head>\n<body>\n";
echo $content;
echo "\n</body>\n</html>\n";
