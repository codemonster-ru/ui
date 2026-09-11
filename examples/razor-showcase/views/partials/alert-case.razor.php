{{-- One shared case for VfAlert.

     The tag is repeated per slot combination because the engine collects named
     slots when it compiles, so a slot wrapped in @if would still be declared -
     and "no slot" and "a slot rendering nothing" are different inputs to both
     of the alert's fallbacks. Two named slots give four branches. The default
     slot needs no branching: the body wrapper renders whether or not anything
     is in it.

     There is no dismiss button here, and no attribute that would ask the
     component for one: the reference has no such control, and a showcase that
     rendered one would be showing a component that does not exist.

     Showcase fixture only. Nothing here is product implementation: the class
     merging, the role precedence, the glyph choice and the fallbacks all live
     in the component.

     The buttons are real consumer controls, written here the way any consumer
     would write them. The alert owns no interaction; what is in its slots is
     the consumer's. --}}
@if (array_key_exists('icon', $case['content'] ?? []) && array_key_exists('title', $case['content'] ?? []))
    <vf-alert
    :tone="$case['props']['tone'] ?? null"
    :title="$case['props']['title'] ?? null"
    :icon="$case['props']['icon'] ?? null"
    :hide-icon="($case['props']['hideIcon'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-live="$case['attrs']['aria-live'] ?? null"
    :aria-atomic="$case['attrs']['aria-atomic'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="icon">{{ $case['content']['icon']['text'] ?? '' }}</razor-slot><razor-slot name="title">{{ $case['content']['title']['text'] ?? '' }}@if (isset($case['content']['title']['control']))<button type="button">{{ $case['content']['title']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-alert>
@elseif (array_key_exists('icon', $case['content'] ?? []) && !array_key_exists('title', $case['content'] ?? []))
    <vf-alert
    :tone="$case['props']['tone'] ?? null"
    :title="$case['props']['title'] ?? null"
    :icon="$case['props']['icon'] ?? null"
    :hide-icon="($case['props']['hideIcon'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-live="$case['attrs']['aria-live'] ?? null"
    :aria-atomic="$case['attrs']['aria-atomic'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="icon">{{ $case['content']['icon']['text'] ?? '' }}</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-alert>
@elseif (!array_key_exists('icon', $case['content'] ?? []) && array_key_exists('title', $case['content'] ?? []))
    <vf-alert
    :tone="$case['props']['tone'] ?? null"
    :title="$case['props']['title'] ?? null"
    :icon="$case['props']['icon'] ?? null"
    :hide-icon="($case['props']['hideIcon'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-live="$case['attrs']['aria-live'] ?? null"
    :aria-atomic="$case['attrs']['aria-atomic'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="title">{{ $case['content']['title']['text'] ?? '' }}@if (isset($case['content']['title']['control']))<button type="button">{{ $case['content']['title']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-alert>
@else
    <vf-alert
    :tone="$case['props']['tone'] ?? null"
    :title="$case['props']['title'] ?? null"
    :icon="$case['props']['icon'] ?? null"
    :hide-icon="($case['props']['hideIcon'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-live="$case['attrs']['aria-live'] ?? null"
    :aria-atomic="$case['attrs']['aria-atomic'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-alert>
@endif
