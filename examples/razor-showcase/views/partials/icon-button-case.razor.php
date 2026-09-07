{{-- One shared VfIconButton case, rendered by the real vf-icon-button Razor
     component.

     Every prop is named explicitly, the same way the Input case partial does
     it: the engine has no prop spread, and an explicit map is what makes a
     missing prop visible in review. A prop bound to null behaves exactly like
     an omitted one, so this single list covers the whole catalog.

     Unlike the Input partial there is only one tag. That partial repeats itself
     once per slot combination because the engine collects named slots at
     compile time, so a slot wrapped in @if would still be declared.
     VfIconButton has no slots at all, so the problem does not arise. --}}
<vf-icon-button
    :icon="$case['props']['icon']"
    :variant="$case['props']['variant'] ?? null"
    :size="$case['props']['size'] ?? null"
    :type="$case['props']['type'] ?? null"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :aria-pressed="$case['attrs']['aria-pressed'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? false"
    :id="$case['attrs']['id'] ?? null"
    :title="$case['attrs']['title'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
/>
