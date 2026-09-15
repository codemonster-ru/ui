{{-- One shared case for VfStepper.

     A group renders each member as its own real vf-stepper. The items are
     handed to the component as the catalog spells them; `modelValue`,
     `defaultValue`, `contentPosition` and `ariaLabel` are spelled in
     kebab-case, as a template would spell them. The consumer button beside
     the stepper is a real button, written here the way any consumer would
     write it. There is no showcase script: every trigger on the page is live
     through the packaged controller alone.

     Showcase fixture only. Nothing here is product implementation: the value
     resolution, the state precedence, the ARIA, the custom properties and
     the selection all live in the component and its controller. `members`
     and `beside` are handed in by the view, which derives them from the
     case. --}}
@foreach ($members as $member)
    <vf-stepper
    :items="$member['items'] ?? []"
    :model-value="$member['modelValue'] ?? null"
    :default-value="$member['defaultValue'] ?? null"
    :orientation="$member['orientation'] ?? null"
    :content-position="$member['contentPosition'] ?? null"
    :aria-label="$member['ariaLabel'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
    :id="$case['attrs']['id'] ?? null"
    :role="$case['attrs']['role'] ?? null"
    :aria-current="$case['attrs']['aria-current'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    ></vf-stepper>
@endforeach
@if ($beside !== null)<button type="button" class="razor-showcase__beside">{{ $beside['text'] }}</button>@endif
