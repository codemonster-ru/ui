<?php

declare(strict_types=1);

namespace Codemonster\VueForge\Razor;

use Codemonster\Razor\Components\Contracts\ComponentProviderInterface;
use Codemonster\VueForge\Razor\Components\AccordionComponent;
use Codemonster\VueForge\Razor\Components\AlertComponent;
use Codemonster\VueForge\Razor\Components\AvatarComponent;
use Codemonster\VueForge\Razor\Components\BadgeComponent;
use Codemonster\VueForge\Razor\Components\BreadcrumbsComponent;
use Codemonster\VueForge\Razor\Components\ButtonComponent;
use Codemonster\VueForge\Razor\Components\CardComponent;
use Codemonster\VueForge\Razor\Components\CheckboxComponent;
use Codemonster\VueForge\Razor\Components\DividerComponent;
use Codemonster\VueForge\Razor\Components\DropdownComponent;
use Codemonster\VueForge\Razor\Components\FieldComponent;
use Codemonster\VueForge\Razor\Components\GroupBoxComponent;
use Codemonster\VueForge\Razor\Components\IconButtonComponent;
use Codemonster\VueForge\Razor\Components\InputComponent;
use Codemonster\VueForge\Razor\Components\LinkComponent;
use Codemonster\VueForge\Razor\Components\MenuComponent;
use Codemonster\VueForge\Razor\Components\MenuItemComponent;
use Codemonster\VueForge\Razor\Components\PanelComponent;
use Codemonster\VueForge\Razor\Components\PopoverComponent;
use Codemonster\VueForge\Razor\Components\ProgressBarComponent;
use Codemonster\VueForge\Razor\Components\ProgressSpinnerComponent;
use Codemonster\VueForge\Razor\Components\RadioComponent;
use Codemonster\VueForge\Razor\Components\SkeletonComponent;
use Codemonster\VueForge\Razor\Components\SkeletonGateComponent;
use Codemonster\VueForge\Razor\Components\StepperComponent;
use Codemonster\VueForge\Razor\Components\TabsComponent;
use Codemonster\VueForge\Razor\Components\SwitchComponent;
use Codemonster\VueForge\Razor\Components\TagComponent;
use Codemonster\VueForge\Razor\Components\TextareaComponent;
use Codemonster\VueForge\Razor\Components\TooltipComponent;

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
        // The same arrangement for the spinner, since M20. One
        // ProgressSpinnerComponent, registered as `vf-progress-spinner` and
        // handed to the button, whose loading state renders it. Before M20 the
        // button rendered a Support\ProgressSpinner of its own that reproduced
        // the subset it needed; now there is one spinner renderer in the
        // package, and ButtonComponentTest asserts the button holds this one.
        $progressSpinner = new ProgressSpinnerComponent();
        // And for the button, since M29. One ButtonComponent, registered as
        // `vf-button` and handed to the group box, whose disclosure trigger is
        // the canonical ghost button. GroupBoxComponentTest asserts the group
        // box holds this one.
        $button = new ButtonComponent($progressSpinner);

        return [
            // The first component that owns a control of its own; its browser
            // enhancement lives in browser/accordion.ts. See AccordionComponent.
            'accordion' => new AccordionComponent(),
            // Server-complete: an alert owns a role and no interaction. See
            // AlertComponent.
            'alert' => new AlertComponent(),
            'avatar' => new AvatarComponent(),
            'badge' => new BadgeComponent(),
            // Server-complete: N native anchors and nothing to enhance. The Vue
            // component's router branch has no counterpart here by design - see
            // BreadcrumbsComponent.
            'breadcrumbs' => new BreadcrumbsComponent(),
            'button' => $button,
            'card' => new CardComponent(),
            'checkbox' => new CheckboxComponent(),
            'divider' => new DividerComponent(),
            // The first overlay: it owns a trigger wrapper and a menu it creates,
            // teleports and positions; its browser enhancement lives in
            // browser/dropdown.ts, with floater.js bundled into the artifact.
            // Registered beside vf-menu and vf-menu-item, never through them: a
            // dropdown's menu content is whatever the host puts in it. See
            // DropdownComponent.
            'dropdown' => new DropdownComponent(),
            'field' => new FieldComponent(),
            // The fourth component that owns a control - the disclosure
            // trigger, a ghost vf-button, only when collapsible; its browser
            // enhancement lives in browser/group-box.ts. See GroupBoxComponent.
            'group-box' => new GroupBoxComponent($button),
            'icon-button' => new IconButtonComponent(),
            'input' => new InputComponent(),
            // Server-complete: one native anchor and nothing to enhance. The Vue
            // component's router branch has no counterpart here by design - see
            // LinkComponent.
            'link' => new LinkComponent(),
            // Server-complete, and registered beside each other rather than
            // through each other: vf-menu owns no control and knows nothing
            // about vf-menu-item, whose control accounts for itself. The two
            // share a block name in one stylesheet and no runtime coupling at
            // all, which is why neither takes the other in its constructor.
            // See MenuComponent and MenuItemComponent.
            'menu' => new MenuComponent(),
            'menu-item' => new MenuItemComponent(),
            // Registered beside the card, never through it. See PanelComponent.
            'panel' => new PanelComponent(),
            // The second overlay, registered beside vf-dropdown and never
            // through it: the two share the page's escape stack at runtime and
            // no server code. Its browser enhancement lives in
            // browser/popover.ts. See PopoverComponent.
            'popover' => new PopoverComponent(),
            // Registered beside the spinner, never through it: the two share a
            // role name and a tone union and no rule. See ProgressBarComponent.
            'progress-bar' => new ProgressBarComponent(),
            'progress-spinner' => $progressSpinner,
            'radio' => new RadioComponent(),
            'skeleton' => $skeleton,
            'skeleton-gate' => new SkeletonGateComponent($skeleton),
            // The second component that owns controls - one native button per
            // item; its browser enhancement lives in browser/stepper.ts. See
            // StepperComponent.
            'stepper' => new StepperComponent(),
            'switch' => new SwitchComponent(),
            // The third component that owns controls, and the first whose
            // controls carry an explicit interactive role - one native
            // button[role=tab] per item, two scroll buttons and at most one
            // tabpanel; its browser enhancement lives in browser/tabs.ts.
            // See TabsComponent.
            'tabs' => new TabsComponent(),
            'tag' => new TagComponent(),
            'textarea' => new TextareaComponent(),
            // The third overlay, registered beside vf-popover and never through
            // it: it owns no control and shares no server code or escape entry
            // with either overlay. Its browser enhancement lives in
            // browser/tooltip.ts. See TooltipComponent.
            'tooltip' => new TooltipComponent(),
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
