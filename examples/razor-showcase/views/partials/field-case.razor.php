{{-- One shared VfField case, rendered by the real vf-field and vf-input.

     The control is written inside the field's default slot, exactly as a
     consumer writes it. Nothing here passes an id, an aria-describedby value or
     an invalid flag to the control: the field supplies all three through the
     render-time field context, which is the Razor equivalent of the slot scope
     the Vue showcase binds. --}}
<vf-field
    :label="$case['field']['label'] ?? null"
    :label-placement="$case['field']['placement'] ?? 'top'"
    :floating-variant="$case['field']['variant'] ?? null"
    :description="$case['field']['description'] ?? null"
    :error="$case['field']['error'] ?? null"
    :required="$case['field']['required'] ?? false"
    :invalid="$case['field']['invalid'] ?? false"
    :control-id="$controlId"
    :class="$case['fieldAttrs']['class'] ?? null"
    :style="$case['fieldAttrs']['style'] ?? null"
    :data-testid="$case['fieldAttrs']['data-testid'] ?? null"
>
    <vf-input
        :value="$case['control']['modelValue'] ?? null"
        :leading-icon="$case['control']['leadingIcon'] ?? null"
        :clearable="$case['control']['clearable'] ?? false"
        :disabled="$case['attrs']['disabled'] ?? false"
        :readonly="$case['attrs']['readonly'] ?? false"
    />
</vf-field>
