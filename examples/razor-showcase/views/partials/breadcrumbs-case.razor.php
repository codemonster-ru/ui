{{-- One shared case for VfBreadcrumbs.

     Its own partial. The tag is repeated once per slot combination because
     the engine collects named slots when it compiles, so a separator slot
     wrapped in @if would still be declared - and a declared separator slot,
     empty or not, is what makes the trail "have a separator slot". A Razor
     named slot takes no argument, so the same separator content repeats after
     every item that has one; the Vue scoped slot's item and index have no
     counterpart here and no case relies on them.

     No branch here names an item `to` or the root `component`: the router
     branch is the Vue adapter's own, and the Razor component refuses those
     by name.

     Showcase fixture only. Nothing here is product implementation: the
     current-selection and link-selection rules, the rel derivation and the
     separator live in the component. The consumer span is a real consumer
     separator, written here the way any consumer would write it. --}}
@if (isset($case['content']['separator']))
<vf-breadcrumbs
    :items="$case['props']['items'] ?? []"
    :aria-label="$case['props']['ariaLabel'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
    :title="$case['attrs']['title'] ?? null"
><razor-slot name="separator">@if (($case['content']['separator']['markup'] ?? null) === 'label')<span class="consumer-separator">{{ $case['content']['separator']['text'] ?? '' }}</span>@else{{ $case['content']['separator']['text'] ?? '' }}@endif</razor-slot></vf-breadcrumbs>
@else
<vf-breadcrumbs
    :items="$case['props']['items'] ?? []"
    :aria-label="$case['props']['ariaLabel'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
    :title="$case['attrs']['title'] ?? null"
></vf-breadcrumbs>
@endif
@if (($case['attrs']['aria-describedby'] ?? null) === 'aria-described-hint')
    <p id="aria-described-hint" class="parity-hint">Shown in workspace settings.</p>
@endif
