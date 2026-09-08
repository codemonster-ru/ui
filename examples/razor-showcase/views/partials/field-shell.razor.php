{{-- One shared case composed with the real vf-field around the real vf-input.

     M11 replaced the handwritten shell that used to stand here. Nothing on this
     page computes a field class, an id or an aria-describedby value any more:
     the component owns all of them, and the control picks up its id and
     relationships from the field it is rendered inside.

     The control id is still passed explicitly, because the case id is what
     makes a showcase address portable between the two platforms. --}}
<vf-field
    :label="$case['field']['label'] ?? null"
    :label-placement="$case['field']['placement'] ?? 'top'"
    :floating-variant="$case['field']['variant'] ?? null"
    :description="$case['field']['description'] ?? null"
    :error="$case['field']['error'] ?? null"
    :required="$case['field']['required'] ?? false"
    :invalid="$case['field']['invalid'] ?? false"
    :control-id="$controlId"
>
    @include('partials.input-case', ['case' => $case, 'controlId' => null, 'describedBy' => null, 'invalid' => false])
</vf-field>
