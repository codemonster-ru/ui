{{-- One shared case for VfAccordion.

     The tag is repeated per slot combination because the engine collects
     named slots when it compiles, so a trigger slot wrapped in @if would still
     be declared. The default slot needs no branching: it is content or nothing.

     A group renders each member as its own real vf-accordion; a nested case
     renders a real second vf-accordion inside the first's default slot, as a
     template would. The button and the link are real consumer controls, written
     here the way any consumer would write them. There is no showcase script:
     every trigger on the page is live through the packaged controller alone.

     Showcase fixture only. Nothing here is product implementation: the initial
     state, the ids, the ARIA, the deferred content and the toggle all live in
     the component and its controller. `members`, `body` and `trigger` are
     handed in by the view, which derives them from the case. --}}
@foreach ($members as $member)
    @if ($trigger !== null)
        <vf-accordion
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :title="$member['title'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :aria-expanded="$case['attrs']['aria-expanded'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        ><razor-slot name="trigger">{{ $trigger['text'] ?? '' }}@if (isset($trigger['control']))<a href="#">{{ $trigger['control']['text'] }}</a>@endif</razor-slot>@include('partials.accordion-body', ['body' => $body])</vf-accordion>
    @else
        <vf-accordion
        :open="$member['open'] ?? null"
        :default-open="$member['defaultOpen'] ?? null"
        :title="$member['title'] ?? null"
        :disabled="$member['disabled'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
        :id="$case['attrs']['id'] ?? null"
        :role="$case['attrs']['role'] ?? null"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :aria-expanded="$case['attrs']['aria-expanded'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        >@include('partials.accordion-body', ['body' => $body])</vf-accordion>
    @endif
@endforeach
