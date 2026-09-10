<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor;

use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\VueForge\Razor\Components\AvatarComponent;
use Codemonster\VueForge\Razor\Components\BadgeComponent;
use Codemonster\VueForge\Razor\Components\ButtonComponent;
use Codemonster\VueForge\Razor\Components\CardComponent;
use Codemonster\VueForge\Razor\Components\CheckboxComponent;
use Codemonster\VueForge\Razor\Components\DividerComponent;
use Codemonster\VueForge\Razor\Components\FieldComponent;
use Codemonster\VueForge\Razor\Components\IconButtonComponent;
use Codemonster\VueForge\Razor\Components\InputComponent;
use Codemonster\VueForge\Razor\Components\PanelComponent;
use Codemonster\VueForge\Razor\Components\RadioComponent;
use Codemonster\VueForge\Razor\Components\SkeletonComponent;
use Codemonster\VueForge\Razor\Components\SkeletonGateComponent;
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
        // One SkeletonComponent, registered as `vf-skeleton` and handed to the
        // gate. Not two instances of the same class: the gate must render the
        // *canonical* skeleton, and sharing the instance is what makes that
        // checkable rather than merely likely - VueForgeRazorProviderTest
        // asserts the identity, so a future refactor that gave the gate its own
        // copy fails there instead of drifting quietly.
        $skeleton = new SkeletonComponent();

        return [
            'avatar' => new AvatarComponent(),
            'badge' => new BadgeComponent(),
            'button' => new ButtonComponent(),
            'card' => new CardComponent(),
            'checkbox' => new CheckboxComponent(),
            'divider' => new DividerComponent(),
            'field' => new FieldComponent(),
            'icon-button' => new IconButtonComponent(),
            'input' => new InputComponent(),
            // Registered beside the card, never through it. See PanelComponent.
            'panel' => new PanelComponent(),
            'radio' => new RadioComponent(),
            'skeleton' => $skeleton,
            'skeleton-gate' => new SkeletonGateComponent($skeleton),
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
