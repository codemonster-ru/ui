{{-- One shared case for VfDropdown.

     The tag is repeated per trigger-slot shape - a plain span, a real consumer
     button, or no slot at all - because the engine collects named slots when
     it compiles, so a trigger slot wrapped in @if would still be declared. The
     default slot is the menu content, always.

     A group renders each member as its own real vf-dropdown. There is no
     showcase script: every trigger on the page is live through the packaged
     controller alone, which teleports each menu to <body> and positions it
     with the floater.js bundled in the same file.

     Showcase fixture only. Nothing here is product implementation: the ids,
     the ARIA, the deferred menu, the teleport, the position and the whole
     keyboard and pointer contract live in the component and its controller.
     `members`, `menu` and `trigger` are handed in by the view. --}}
@foreach ($members as $member)
    @if (isset($trigger['control']))
        <vf-dropdown
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-select="$member['closeOnSelect'] ?? null"
        :variant="$member['variant'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="trigger"><button type="button" class="parity-trigger-control">{{ $trigger['control']['text'] }}</button></razor-slot>@include('partials.dropdown-menu', ['menu' => $menu])</vf-dropdown>
    @elseif (isset($trigger['text']))
        <vf-dropdown
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-select="$member['closeOnSelect'] ?? null"
        :variant="$member['variant'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="trigger"><span>{{ $trigger['text'] }}</span></razor-slot>@include('partials.dropdown-menu', ['menu' => $menu])</vf-dropdown>
    @else
        <vf-dropdown
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :placement="$member['placement'] ?? null"
        :disable-teleport="$member['disableTeleport'] ?? null"
        :close-on-select="$member['closeOnSelect'] ?? null"
        :variant="$member['variant'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.dropdown-menu', ['menu' => $menu])</vf-dropdown>
    @endif
@endforeach
@if (isset($case['content']['after']['control']))
    <button type="button" class="parity-after-control">{{ $case['content']['after']['control']['text'] }}</button>
@endif
