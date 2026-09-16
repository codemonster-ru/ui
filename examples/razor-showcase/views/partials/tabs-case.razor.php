{{-- One shared case for VfTabs.

     The tag is repeated per slot combination because the engine collects
     named slots when it compiles, so a slot wrapped in @if would still be
     declared - and a declared panel slot, empty or not, is what makes the
     tabs "have a panel slot". A Razor named slot takes no argument, so the
     panel slot is spelled per item as panel0..panel6 (the catalog's longest
     list has seven items; a slot for an index the list does not have is
     never read) beside the shared `panel` an empty list declares it
     through, and the numbered tab slot as tab0..tab2. Each holds the same
     paragraph the Vue scoped slot renders for that item's value, and a real
     consumer button when the case declares one.

     A group renders each member as its own real vf-tabs; the consumer
     button before the tabs is a real button, written here the way any
     consumer would write it; the case's `dir` lands on the root as it does
     on every target. There is no showcase script: every tab, scroll button
     and panel on the page is live through the packaged controller alone.

     Showcase fixture only. Nothing here is product implementation: the value
     resolution, the ids, the ARIA, the roving tabindex, the deferred panel
     content, the selection, the indicator and the scroller all live in the
     component and its controller. `members`, `panel`, `numbered` and
     `before` are handed in by the view, which derives them from the case. --}}
@if ($before !== null)<button type="button" class="razor-showcase__before">{{ $before['text'] }}</button>@endif
@foreach ($members as $member)
    @if ($panel !== null && $numbered)
        <vf-tabs
    :items="$member['items'] ?? []"
    :model-value="array_key_exists('modelValue', $member) ? $member['modelValue'] : null"
    :default-value="$member['defaultValue'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :dir="$case['attrs']['dir'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="tab0"><span>1. {{ $member['items'][0]['label'] ?? '' }}</span></razor-slot><razor-slot name="tab1"><span>2. {{ $member['items'][1]['label'] ?? '' }}</span></razor-slot><razor-slot name="tab2"><span>3. {{ $member['items'][2]['label'] ?? '' }}</span></razor-slot><razor-slot name="panel"></razor-slot><razor-slot name="panel0"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][0]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel1"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][1]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel2"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][2]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel3"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][3]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel4"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][4]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel5"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][5]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel6"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][6]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot></vf-tabs>
    @elseif ($panel !== null)
        <vf-tabs
    :items="$member['items'] ?? []"
    :model-value="array_key_exists('modelValue', $member) ? $member['modelValue'] : null"
    :default-value="$member['defaultValue'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :dir="$case['attrs']['dir'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="panel"></razor-slot><razor-slot name="panel0"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][0]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel1"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][1]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel2"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][2]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel3"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][3]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel4"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][4]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel5"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][5]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot><razor-slot name="panel6"><p>{{ $panel['text'] ?? '' }} {{ $member['items'][6]['value'] ?? '' }}</p>@if (isset($panel['control']))<button type="button" class="razor-showcase__panel-control">{{ $panel['control']['text'] }}</button>@endif</razor-slot></vf-tabs>
    @else
        <vf-tabs
    :items="$member['items'] ?? []"
    :model-value="array_key_exists('modelValue', $member) ? $member['modelValue'] : null"
    :default-value="$member['defaultValue'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :dir="$case['attrs']['dir'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
        ></vf-tabs>
    @endif
@endforeach
