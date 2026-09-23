{{-- One shared case for VfMenuItem.

     No slot: the component has none, and its label is a prop. No branch here
     names `to` or `component` either - unlike vf-link and vf-breadcrumbs this
     component has no router branch at all, so there is nothing to refuse.

     Showcase fixture only. Nothing here is product implementation: the branch
     test, the class list, the disabled rules and the icon-name fallback live
     in the component. --}}
<vf-menu-item
    :label="$case['props']['label'] ?? ''"
    :icon="$case['props']['icon'] ?? null"
    :disabled="$case['props']['disabled'] ?? null"
    :active="$case['props']['active'] ?? null"
    :tone="$case['props']['tone'] ?? null"
    :href="$case['props']['href'] ?? null"
    :target="$case['props']['target'] ?? null"
    :rel="$case['props']['rel'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :tabindex="$case['attrs']['tabindex'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
></vf-menu-item>
@if (($case['attrs']['aria-describedby'] ?? null) === 'aria-described-hint')
    <p id="aria-described-hint" class="parity-hint">Shown in workspace settings.</p>
@endif
