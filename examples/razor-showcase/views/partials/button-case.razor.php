{{-- One shared VfButton case, rendered by the real vf-button component.

     The label and any icon are default slot content, because the historical
     component has no icon props: a caller writes whatever the button should
     contain. The tag is repeated per slot combination because the engine
     collects named slots when it compiles, so slot presence has to follow the
     data rather than an @if inside one tag. --}}
@if (isset($case['content']['icon']) && isset($case['content']['label']))
<vf-button
    :variant="$case['props']['variant'] ?? null"
    :size="$case['props']['size'] ?? null"
    :block="$case['props']['block'] ?? false"
    :loading="$case['props']['loading'] ?? false"
    :type="$case['props']['type'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? false"
    :name="$case['attrs']['name'] ?? null"
    :value="$case['attrs']['value'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
>{{ $case['content']['label'] }}</vf-button>
@elseif (isset($case['content']['icon']))
<vf-button
    :variant="$case['props']['variant'] ?? null"
    :size="$case['props']['size'] ?? null"
    :block="$case['props']['block'] ?? false"
    :loading="$case['props']['loading'] ?? false"
    :type="$case['props']['type'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? false"
    :name="$case['attrs']['name'] ?? null"
    :value="$case['attrs']['value'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
/>
@else
<vf-button
    :variant="$case['props']['variant'] ?? null"
    :size="$case['props']['size'] ?? null"
    :block="$case['props']['block'] ?? false"
    :loading="$case['props']['loading'] ?? false"
    :type="$case['props']['type'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? false"
    :name="$case['attrs']['name'] ?? null"
    :value="$case['attrs']['value'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
>{{ $case['content']['label'] ?? '' }}</vf-button>
@endif
