<?php

declare(strict_types=1);

/**
 * Front controller of the Razor showcase.
 *
 * A real application: it installs the adapter through Composer, registers the
 * real provider with the real Razor engine, renders real templates, and serves
 * the assets the package itself produces. Nothing here reimplements VfInput,
 * copies fixture markup, or reads anything from the Vue application or the
 * frozen reference checkout.
 *
 * Serve it with the PHP development server:
 *   php -S 127.0.0.1:8080 -t examples/razor-showcase/public
 */

use Codemonster\Razor\Components\ComponentRegistry;
use Codemonster\Razor\RazorEngine;
use Codemonster\VueForge\Razor\VueForgeRazorProvider;
use Codemonster\View\Locator\DefaultLocator;

$applicationRoot = dirname(__DIR__);
$repositoryRoot = dirname($applicationRoot, 2);

require $applicationRoot . '/vendor/autoload.php';

/** The packaged assets the adapter advertises. The host serves them; it never rebuilds them. */
$assetPath = VueForgeRazorProvider::assetPath();

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if (str_starts_with($requestPath, '/assets/')) {
    $name = basename($requestPath);
    $candidates = [
        'vueforge-razor.css' => $assetPath . '/vueforge-razor.css',
        'vueforge-razor.js' => $assetPath . '/vueforge-razor.js',
        'razor-showcase.css' => $applicationRoot . '/public/razor-showcase.css',
    ];

    if (!isset($candidates[$name]) || !is_file($candidates[$name])) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Asset [{$name}] is not available.\n";
        if (!isset($candidates[$name])) {
            exit(0);
        }
        echo "Build the adapter assets first: npm run razor:assets\n";
        exit(0);
    }

    header('Content-Type: ' . (str_ends_with($name, '.css') ? 'text/css' : 'text/javascript') . '; charset=utf-8');
    header('Cache-Control: no-store');
    readfile($candidates[$name]);
    exit(0);
}

/**
 * Shared plain data.
 *
 * The case catalog and the component index are read from the files that own
 * them. A copy inside this application could disagree with the catalog the
 * parity gate uses, which is exactly the drift the shared index exists to stop.
 */
function readSharedJson(string $path): array
{
    $contents = file_get_contents($path);

    if ($contents === false) {
        throw new RuntimeException("Unable to read shared data at [{$path}].");
    }

    return json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
}

$catalogData = readSharedJson($repositoryRoot . '/contracts/input/cases.json');
$showcaseIndex = readSharedJson($repositoryRoot . '/examples/shared/showcase-index.json');

$cases = $catalogData['cases'];
$caseIds = array_column($cases, 'id');

$requestedCase = isset($_GET['case']) && is_string($_GET['case']) ? $_GET['case'] : null;
$unknownCase = $requestedCase !== null && !in_array($requestedCase, $caseIds, true) ? $requestedCase : null;
$theme = (isset($_GET['theme']) && $_GET['theme'] === 'dark') ? 'dark' : 'light';

/**
 * The Vue origin.
 *
 * The two applications are served separately, so the link needs an origin this
 * one cannot know. It is supplied by the environment and falls back to the
 * documented path rather than silently linking back to this page.
 */
$vueOrigin = rtrim((string) ($_SERVER['VUEFORGE_VUE_SHOWCASE_ORIGIN'] ?? getenv('VUEFORGE_VUE_SHOWCASE_ORIGIN') ?: ''), '/');
$vuePath = $showcaseIndex['urlContract']['platforms']['vue']['path'];

$vueHref = static function (?string $caseId) use ($vueOrigin, $vuePath, $theme): string {
    $query = ['component' => 'VfInput', 'theme' => $theme];
    if ($caseId !== null) {
        $query['case'] = $caseId;
    }

    return $vueOrigin . $vuePath . '?' . http_build_query($query);
};

// Per-case values the template needs. Computing them here keeps the template a
// template: it renders, it does not decide what a case means.
$caseLinks = [];
$controlIds = [];
$describedBy = [];
$fieldInvalid = [];
$fieldClasses = [];
$fieldControlClasses = [];
$interactionSummaries = [];

foreach ($cases as $case) {
    $id = $case['id'];
    $caseLinks[$id] = $vueHref($id);

    if (isset($case['interaction']['steps'])) {
        $interactionSummaries[$id] = implode(' → ', array_column($case['interaction']['steps'], 'action'));
    }

    if (!isset($case['field'])) {
        $controlIds[$id] = null;
        $describedBy[$id] = $case['attrs']['aria-describedby'] ?? null;
        $fieldInvalid[$id] = $case['props']['invalid'] ?? false;
        continue;
    }

    $controlId = str_replace('/', '-', $id) . '-control';
    $floating = ($case['field']['placement'] ?? 'top') === 'floating';
    $variant = $case['field']['variant'] ?? 'in';
    $hasError = isset($case['field']['error']);

    $described = [];
    if (isset($case['field']['description'])) {
        $described[] = $controlId . '-description';
    }
    if ($hasError) {
        $described[] = $controlId . '-error';
    }

    $controlIds[$id] = $controlId;
    $describedBy[$id] = $described === [] ? null : implode(' ', $described);
    $fieldInvalid[$id] = $hasError ? true : ($case['props']['invalid'] ?? false);
    $fieldClasses[$id] = 'vf-field'
        . ($hasError ? ' vf-field--invalid' : '')
        . ($floating ? ' vf-field--floating vf-field--floating-' . $variant : '');
    $fieldControlClasses[$id] = 'vf-field__control' . ($floating ? ' vf-field__control--floating' : '');
}

$registry = new ComponentRegistry();
$registry->register(new VueForgeRazorProvider());

$engine = new RazorEngine(
    new DefaultLocator([$applicationRoot . '/views']),
    'razor.php',
    sys_get_temp_dir() . '/vueforge-razor-showcase-cache',
    $registry,
);

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');

echo $engine->render('input-showcase', [
    'cases' => $cases,
    'catalog' => $showcaseIndex['components'],
    'theme' => $theme,
    'requestedCase' => $requestedCase,
    'unknownCase' => $unknownCase,
    'vueHref' => $vueHref(null),
    'caseLinks' => $caseLinks,
    'controlIds' => $controlIds,
    'describedBy' => $describedBy,
    'fieldInvalid' => $fieldInvalid,
    'fieldClasses' => $fieldClasses,
    'fieldControlClasses' => $fieldControlClasses,
    'interactionSummaries' => $interactionSummaries,
]);
