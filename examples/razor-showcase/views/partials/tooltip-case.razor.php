{{-- One shared case for VfTooltip.

     The tag is repeated per content-slot shape - none, rich markup, or a slot
     that renders nothing - because the engine collects named slots when it
     compiles, so a content slot wrapped in @if would still be declared. The
     default slot is the trigger: real consumer buttons or plain text.

     A real vf-popover is rendered before the roots when the case puts one
     beside them or holds a tooltip inside it. A group renders each member as
     its own real vf-tooltip. There is no showcase script: every trigger on the
     page is live through the packaged controller alone.

     Showcase fixture only. Nothing here is product implementation.
     `members`, `trigger` and `body` are handed in by the view. --}}
@if (($case['content']['popover'] ?? null) === 'inside')
    <vf-popover><razor-slot name="trigger"><span>Host</span></razor-slot><vf-tooltip text="Inside hint" :open-delay="$case['content']['popoverDelay'] ?? null"><button type="button" class="parity-trigger-control">Inside</button></vf-tooltip></vf-popover>
@elseif (($case['content']['popover'] ?? null) === 'beside')
    <vf-popover><razor-slot name="trigger"><span>Host</span></razor-slot><p class="parity-panel-note">Host body</p></vf-popover>
@endif
@foreach ($members as $member)
    @if ($body === 'rich')
        <vf-tooltip
        :text="$member['text'] ?? null"
        :placement="$member['placement'] ?? null"
        :open-delay="$member['openDelay'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.tooltip-trigger', ['trigger' => $trigger])<razor-slot name="content"><strong>Rich</strong> body</razor-slot></vf-tooltip>
    @elseif ($body === 'empty')
        <vf-tooltip
        :text="$member['text'] ?? null"
        :placement="$member['placement'] ?? null"
        :open-delay="$member['openDelay'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.tooltip-trigger', ['trigger' => $trigger])<razor-slot name="content"></razor-slot></vf-tooltip>
    @else
        <vf-tooltip
        :text="$member['text'] ?? null"
        :placement="$member['placement'] ?? null"
        :open-delay="$member['openDelay'] ?? null"
        :teleport-to="$member['teleportTo'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.tooltip-trigger', ['trigger' => $trigger])</vf-tooltip>
    @endif
@endforeach
@if (($case['content']['after'] ?? false) === true)
    <button type="button" class="parity-after-control">After</button>
@endif
