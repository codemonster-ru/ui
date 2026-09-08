{{-- One shared VfTextarea case, rendered by the real vf-textarea and, where
     the case asks for one, the real vf-field.

     Nothing here passes the control an id, an aria-describedby value or an
     invalid flag: the field supplies all three through the render-time field
     context, which is the point of the field being real. --}}
@if (isset($case['field']))
<vf-field
    :label="$case['field']['label'] ?? null"
    :label-placement="$case['field']['placement'] ?? 'top'"
    :description="$case['field']['description'] ?? null"
    :error="$case['field']['error'] ?? null"
    :required="$case['field']['required'] ?? false"
    :control-id="$controlId"
>
    <vf-textarea
        :value="$case['props']['modelValue'] ?? null"
        :size="$case['props']['size'] ?? null"
        :invalid="$case['props']['invalid'] ?? false"
        :rows="$case['attrs']['rows'] ?? null"
        :placeholder="$case['attrs']['placeholder'] ?? null"
        :name="$case['attrs']['name'] ?? null"
        :maxlength="$case['attrs']['maxlength'] ?? null"
        :minlength="$case['attrs']['minlength'] ?? null"
        :wrap="$case['attrs']['wrap'] ?? null"
        :spellcheck="$case['attrs']['spellcheck'] ?? null"
        :autocomplete="$case['attrs']['autocomplete'] ?? null"
        :disabled="$case['attrs']['disabled'] ?? false"
        :readonly="$case['attrs']['readonly'] ?? false"
        :required="$case['attrs']['required'] ?? false"
        :aria-label="$case['attrs']['aria-label'] ?? null"
        :data-testid="$case['attrs']['data-testid'] ?? null"
        :class="$case['attrs']['class'] ?? null"
        :style="$case['attrs']['style'] ?? null"
    />
</vf-field>
@else
<vf-textarea
    :value="$case['props']['modelValue'] ?? null"
    :size="$case['props']['size'] ?? null"
    :invalid="$case['props']['invalid'] ?? false"
    :rows="$case['attrs']['rows'] ?? null"
    :placeholder="$case['attrs']['placeholder'] ?? null"
    :name="$case['attrs']['name'] ?? null"
    :maxlength="$case['attrs']['maxlength'] ?? null"
    :minlength="$case['attrs']['minlength'] ?? null"
    :wrap="$case['attrs']['wrap'] ?? null"
    :spellcheck="$case['attrs']['spellcheck'] ?? null"
    :autocomplete="$case['attrs']['autocomplete'] ?? null"
    :disabled="$case['attrs']['disabled'] ?? false"
    :readonly="$case['attrs']['readonly'] ?? false"
    :required="$case['attrs']['required'] ?? false"
    :aria-label="$case['attrs']['aria-label'] ?? null"
    :data-testid="$case['attrs']['data-testid'] ?? null"
    :class="$case['attrs']['class'] ?? null"
    :style="$case['attrs']['style'] ?? null"
/>
@endif
