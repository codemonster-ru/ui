{{-- One shared case for VfPopover.

     The tag is repeated per trigger-slot shape - a plain span, a real consumer
     button, or no slot at all - because the engine collects named slots when
     it compiles, so a trigger slot wrapped in @if would still be declared. The
     default slot is the panel content, always.

     A real vf-dropdown is rendered before the roots when the case puts one
     beside the popover. A group renders each member as its own real
     vf-popover. There is no showcase script: every trigger on the page is
     live through the packaged controller alone.

     Showcase fixture only. Nothing here is product implementation.
     `members`, `panel` and `trigger` are handed in by the view. --}}
@if (isset($case['content']['beside']['dropdown']))
    @include('partials.popover-dropdown', ['label' => 'Menu', 'inPlace' => $case['content']['beside']['dropdown']['inPlace'] ?? false])
@endif
@foreach ($members as $member)
    @if (isset($trigger['control']))
        <vf-popover
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-outside-click="$member['closeOnOutsideClick'] ?? null"
        :close-on-escape="$member['closeOnEscape'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="trigger"><button type="button" class="parity-trigger-control">{{ $trigger['control']['text'] }}</button></razor-slot>@include('partials.popover-panel', ['panel' => $panel])</vf-popover>
    @elseif (isset($trigger['text']))
        <vf-popover
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-outside-click="$member['closeOnOutsideClick'] ?? null"
        :close-on-escape="$member['closeOnEscape'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="trigger"><span>{{ $trigger['text'] }}</span></razor-slot>@include('partials.popover-panel', ['panel' => $panel])</vf-popover>
    @else
        <vf-popover
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-outside-click="$member['closeOnOutsideClick'] ?? null"
        :close-on-escape="$member['closeOnEscape'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.popover-panel', ['panel' => $panel])</vf-popover>
    @endif
@endforeach
@if (isset($case['content']['after']['control']))
    <button type="button" class="parity-after-control">{{ $case['content']['after']['control']['text'] }}</button>
@endif
