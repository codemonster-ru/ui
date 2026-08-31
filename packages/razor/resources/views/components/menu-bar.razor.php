<!-- prettier-ignore -->
<nav class="{{ $classes }}" aria-label="{{ $ariaLabel }}" data-cm-controller="menu-bar"{!! $attributes !!}><ul class="cm-menu-bar__list" role="menubar">@foreach ($nodes as $node)@include('components.menu-bar-node', ['node' => $node])@endforeach</ul></nav>
