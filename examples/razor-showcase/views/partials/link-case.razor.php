{{-- One shared case for VfLink.

     Its own partial. The tag is repeated per attribute set only where the
     engine needs it: every case renders one vf-link with the same seven
     bindings, and the described-by hint is appended beside the anchor for the
     one case whose aria-describedby points outside it - the same paragraph
     the parity fixture appends, so the relationship resolves on every target.

     No branch here names `to` or `component`: the router branch is the Vue
     adapter's own, and the Razor component refuses those props by name.

     Showcase fixture only. Nothing here is product implementation: the class
     merging and the rel derivation live in the component.

     The button is a real consumer control, written here the way any consumer
     would write it. The link owns the anchor; what is inside it is the
     consumer's. --}}
<vf-link
    :href="$case['props']['href'] ?? null"
    :target="$case['props']['target'] ?? null"
    :rel="$case['props']['rel'] ?? null"
    :underline="$case['props']['underline'] ?? null"
    :tone="$case['props']['tone'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-current="$case['attrs']['aria-current'] ?? null"
    :aria-describedby="$case['attrs']['aria-describedby'] ?? null"
>@if (($case['content']['markup'] ?? null) === 'label')<span class="consumer-label">{{ $case['content']['text'] ?? '' }}</span>@else{{ $case['content']['text'] ?? '' }}@endif@if (isset($case['content']['control']))<button type="button">{{ $case['content']['control']['text'] }}</button>@endif</vf-link>
@if (($case['attrs']['aria-describedby'] ?? null) === 'aria-described-hint')
    <p id="aria-described-hint" class="parity-hint">Shown in workspace settings.</p>
@endif
