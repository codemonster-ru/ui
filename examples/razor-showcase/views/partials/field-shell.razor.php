{{-- Local field surroundings for the field-composition cases.

     This is NOT a migrated public Razor VfField, and the catalog on this page
     reports VfField as not implemented in Razor. It is the label/description/
     error composition the Input cases need in order to be shown at all, written
     natively here, exactly as the migration plan describes for the first
     component. Migrating VfField is its own milestone; nothing here counts as
     that milestone being done. --}}
<div class="{{ $fieldClasses }}" data-vf-razor-field="{{ $floating ? 'floating' : 'top' }}">
    @if (!$floating)
        <label class="vf-field__label" for="{{ $controlId }}">{{ $case['field']['label'] }}</label>
    @endif
    <div class="{{ $controlClasses }}">
        @include('partials.input-case', ['case' => $case, 'controlId' => $controlId, 'describedBy' => $describedBy, 'invalid' => $invalid])
        @if ($floating)
            <label class="vf-field__label vf-field__label--floating" for="{{ $controlId }}">{{ $case['field']['label'] }}</label>
        @endif
    </div>
    @if (isset($case['field']['description']))
        <p id="{{ $controlId }}-description" class="vf-field__description">{{ $case['field']['description'] }}</p>
    @endif
    @if (isset($case['field']['error']))
        <p id="{{ $controlId }}-error" class="vf-field__error">{{ $case['field']['error'] }}</p>
    @endif
</div>
