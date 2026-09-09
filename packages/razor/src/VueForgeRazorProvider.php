<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor;

use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\VueForge\Razor\Components\BadgeComponent;
use Codemonster\VueForge\Razor\Components\ButtonComponent;
use Codemonster\VueForge\Razor\Components\CheckboxComponent;
use Codemonster\VueForge\Razor\Components\DividerComponent;
use Codemonster\VueForge\Razor\Components\FieldComponent;
use Codemonster\VueForge\Razor\Components\IconButtonComponent;
use Codemonster\VueForge\Razor\Components\InputComponent;
use Codemonster\VueForge\Razor\Components\RadioComponent;
use Codemonster\VueForge\Razor\Components\SwitchComponent;
use Codemonster\VueForge\Razor\Components\TagComponent;
use Codemonster\VueForge\Razor\Components\TextareaComponent;

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
            'badge' => new BadgeComponent(),
            'button' => new ButtonComponent(),
            'checkbox' => new CheckboxComponent(),
            'divider' => new DividerComponent(),
            'field' => new FieldComponent(),
            'icon-button' => new IconButtonComponent(),
            'input' => new InputComponent(),
            'radio' => new RadioComponent(),
            'switch' => new SwitchComponent(),
            'tag' => new TagComponent(),
            'textarea' => new TextareaComponent(),
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
