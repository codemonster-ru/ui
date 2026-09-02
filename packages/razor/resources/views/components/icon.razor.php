<!-- prettier-ignore -->
<svg class="{{ $classes }}" xmlns="http://www.w3.org/2000/svg" viewBox="{{ $viewBox }}"@if ($label !== null) role="img" aria-label="{{ $label }}"@else aria-hidden="true"@endif focusable="false"{!! $attributes !!}>{!! $body !!}</svg>
