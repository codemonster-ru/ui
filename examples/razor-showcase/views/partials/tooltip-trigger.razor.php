{{-- The default slot of one shared VfTooltip case: real consumer buttons, or
     plain text with nothing focusable, from the same catalog words the Vue
     route reads. Showcase fixture only. --}}
@if (isset($trigger['controls']))@foreach ($trigger['controls'] as $text)<button type="button" class="parity-trigger-control">{{ $text }}</button>@endforeach@else{{ $trigger['text'] ?? '' }}@endif
