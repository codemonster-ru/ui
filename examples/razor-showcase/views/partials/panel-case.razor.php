{{-- One shared case for VfPanel.

     Its own partial rather than a fourth branch of partials/m16-case.razor.php.
     A partial that rendered "the section-with-a-header component for this
     catalog" is exactly where VfPanel could quietly start rendering VfCard, and
     the two are near enough that nobody would see it on the page.

     The tag is repeated per slot combination because the engine collects named
     slots when it compiles, so a slot wrapped in @if would still be declared.
     Only the header and the footer need branching: a panel's default slot has
     no wrapper and no condition, so a default slot rendering nothing produces
     nothing - which is the difference from VfCard, where the same input
     produces an empty classed div and forces that partial into seven branches.

     The footer slot is handed over on purpose in two of the four branches.
     VfPanel declares no footer, so the component drops it, and a showcase that
     never passed one would be showing a rule nobody exercised.

     Showcase fixture only. Nothing here is product implementation: the class
     merging, the header rules and the style merging all live in the component.

     The buttons are real consumer controls, written here the way any consumer
     would write them. The panel owns no interaction; what is in its slots is
     the consumer's. --}}
@if (array_key_exists('header', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
    <vf-panel
    :title="$case['props']['title'] ?? null"
    :subtle="($case['props']['subtle'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif<razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}</razor-slot></vf-panel>
@elseif (array_key_exists('header', $case['content'] ?? []) && !array_key_exists('footer', $case['content'] ?? []))
    <vf-panel
    :title="$case['props']['title'] ?? null"
    :subtle="($case['props']['subtle'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ><razor-slot name="header">{{ $case['content']['header']['text'] ?? '' }}@if (isset($case['content']['header']['control']))<button type="button">{{ $case['content']['header']['control']['text'] }}</button>@endif</razor-slot>{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-panel>
@elseif (!array_key_exists('header', $case['content'] ?? []) && array_key_exists('footer', $case['content'] ?? []))
    <vf-panel
    :title="$case['props']['title'] ?? null"
    :subtle="($case['props']['subtle'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif<razor-slot name="footer">{{ $case['content']['footer']['text'] ?? '' }}</razor-slot></vf-panel>
@else
    <vf-panel
    :title="$case['props']['title'] ?? null"
    :subtle="($case['props']['subtle'] ?? false) ? true : null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    >{{ $case['content']['body']['text'] ?? '' }}@if (($case['content']['body']['markup'] ?? null) === 'paragraphs')<p>Storage, seats and outbound transfer.</p><p>Updated hourly.</p>@endif@if (isset($case['content']['body']['control']))<button type="button">{{ $case['content']['body']['control']['text'] }}</button>@endif</vf-panel>
@endif
