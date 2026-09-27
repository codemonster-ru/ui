{{-- One shared case for VfGroupBox.

     The tag is repeated per slot combination because the engine collects
     named slots when it compiles, so a title or toggle-icon slot wrapped in
     @if would still be declared. The catalog never combines the two.

     A group renders each member as its own real vf-group-box; a nested case
     renders a real second vf-group-box inside the first's default slot, as a
     template would. The button and the link are real consumer controls. There
     is no showcase script: every trigger on the page is live through the
     packaged controller alone.

     Showcase fixture only. The title test, the state, the ids, the ARIA, the
     deferred content and the toggle all live in the component and its
     controller. --}}
@foreach ($members as $member)
    @if ($titleSlot !== null)
        <vf-group-box
        :title="$member['title'] ?? null"
        :collapsible="$member['collapsible'] ?? null"
        :collapsed="$member['collapsed'] ?? null"
        :default-collapsed="$member['defaultCollapsed'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :name="$case['attrs']['name'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :aria-expanded="$case['attrs']['aria-expanded'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="title">{{ $titleSlot['text'] ?? '' }}@if (($titleSlot['markup'] ?? null) === 'rich')<strong>Invoice</strong> <em>#1024</em>@endif @if (isset($titleSlot['control']))<a href="#">{{ $titleSlot['control']['text'] }}</a>@endif</razor-slot>@include('partials.group-box-body', ['body' => $body])</vf-group-box>
    @elseif ($toggleIcon !== null)
        <vf-group-box
        :title="$member['title'] ?? null"
        :collapsible="$member['collapsible'] ?? null"
        :collapsed="$member['collapsed'] ?? null"
        :default-collapsed="$member['defaultCollapsed'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :name="$case['attrs']['name'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :aria-expanded="$case['attrs']['aria-expanded'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="toggleIcon">{{ $toggleIcon['text'] ?? '' }}</razor-slot>@include('partials.group-box-body', ['body' => $body])</vf-group-box>
    @else
        <vf-group-box
        :title="$member['title'] ?? null"
        :collapsible="$member['collapsible'] ?? null"
        :collapsed="$member['collapsed'] ?? null"
        :default-collapsed="$member['defaultCollapsed'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :name="$case['attrs']['name'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :aria-expanded="$case['attrs']['aria-expanded'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.group-box-body', ['body' => $body])</vf-group-box>
    @endif
@endforeach
