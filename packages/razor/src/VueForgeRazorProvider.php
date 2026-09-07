<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor;

use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\VueForge\Razor\Components\IconButtonComponent;
use Codemonster\VueForge\Razor\Components\InputComponent;

/**
 * Registers the VueForge components with an Annabel Razor component registry.
 *
 *     $registry = new ComponentRegistry();
 *     $registry->register(new VueForgeRazorProvider());
 *
 * Templates then use the `vf-` prefix:
 *
 *     <vf-input name="workspace" value="Acme" clearable />
 *
 * This is the whole public entry point of the package. Everything under
 * Support/ is internal and may change without notice while the adapter is
 * unreleased.
 */
final class VueForgeRazorProvider implements ComponentProviderInterface
{
    public function prefix(): string
    {
        return 'vf';
    }

    /** @inheritDoc */
    public function components(): array
    {
        return [
            'icon-button' => new IconButtonComponent(),
            'input' => new InputComponent(),
        ];
    }

    /**
     * Absolute path to the directory holding the packaged browser and style
     * assets a host application must serve.
     *
     * Returned as a path rather than a URL because publishing strategy belongs
     * to the host: copy the directory, symlink it, or point a static route at
     * it.
     */
    public static function assetPath(): string
    {
        return dirname(__DIR__) . '/dist';
    }
}
